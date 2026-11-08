import { activeEnemyLanes } from './tutorial.ts';
import { ensureMedical, consumeBandage, tickMedical } from './healing.ts';
import type { MedicalState } from './healing.ts';
import { canHitFlying, isFlying, flyingVariant } from './flying.ts';
import { BOSS_COURT, COURT_HEAL, tickCourtHeal } from './bossCourt.ts';
import type { CourtState } from './bossCourt.ts';
import { freshRewards, rewardOffer, REWARDS, freeRecruit, extraHoneySeconds } from './rewards.ts';
import type { RewardState, RewardId } from './rewards.ts';
import { freshCampaign, chapterIndex, chapterStars, HERO_FORCE_FACTOR } from './campaignRules.ts';
import type { CampaignState } from './campaignRules.ts';
import { makeBalanceTuning } from './balanceTuning.ts';
import type { BalanceTuning } from './balanceTuning.ts';
import {
  ensureBossState,
  absorbBossHit,
  cancelBossShot,
  receiveBossDamage,
  bossHeadsHealth,
  healBossHeads,
  tickBossHeads,
  bossMeleeAttacks,
  bossShotAttack,
} from './boss.ts';
import type { BossState } from './boss.ts';
import { coveringShield, umbrellaCover, GUARD_COOLDOWN, GUARD_REDUCTION } from './combatRules.ts';
import { lanePoint, junctionPoint, roadLeg, junctionLeg, routeJunctions } from './routes.ts';
import { canEngage, defenseGoal, defenseRole, reliefTeams } from './defenders.ts';
import { isPlacementFree } from './placement.ts';
import { denseCampHomes } from './campLayout.ts';
import { healAmount, incomingDamage, attackDamage } from './unitRules.ts';
import { enemies as enemyTypes, enemyArmor, enemySpeed } from './enemies.ts';
import type { EnemyKind } from './enemies.ts';
import {
  deathRetaliation,
  RATTLE_RADIUS,
  RATTLE_COOLDOWN,
  CONFUSION_DURATION,
  CONFUSION_IMMUNITY,
} from './enemyAbilities.ts';
import {
  variantFor,
  wavePattern,
  spawnDelay,
  entryLane,
  eggIncubation,
  waveBriefing,
} from './waves.ts';
import { decideTemptation, FEAST_DURATION, stickySpeed } from './tactics.ts';
import type { Feast, FeastFlavor } from './tactics.ts';
import { LANES, laneDefense } from './ai.ts';
import { kinds, TOTAL_WAVES, waveStats, unlockWave } from './data.ts';
import type { Kind } from './data.ts';
import { findPath, blocked, nearestCampPoint, CELL } from './navigation.ts';
import { levelForWave, missionLevel } from './levels.ts';
import type { Point } from './navigation.ts';
import { missionById, missionWave, readMissionRun } from './missions.ts';
import type { MissionRun } from './missions.ts';
export type Entity = Point & {
  id: number;
  kind: Kind | 'snake';
  variant: EnemyKind;
  broodCool: number;
  charge: number;
  guardCool: number;
  rattleCool: number;
  confusedFor: number;
  confusionImmunity: number;
  hp: number;
  maxHp: number;
  cool: number;
  path: Point[];
  nav: number;
  boss: boolean;
  bossState?: BossState;
  medical?: MedicalState;
  court?: CourtState;
  courtReleased?: boolean;
  state: 'idle' | 'move' | 'attack' | 'heal';
  facing: number;
  lane: number;
  stage: number;
  homeX: number;
  homeY: number;
  turnY: number | null;
  targetId: number | null;
};
export type Egg = Point & {
  id: number;
  lane: number;
  hatchIn: number;
  duration: number;
  count: number;
};
export type Effect = Point & {
  sourceId?: number;
  targetId?: number;
  tx: number;
  ty: number;
  kind: 'hit' | 'heal' | 'arrow' | 'gold' | 'fire' | 'poison' | 'shell' | 'honey' | 'block';
  life: number;
};
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
export class Game {
  gold = 300;
  base = 100;
  wave = 0;
  status: 'preparing' | 'fighting' | 'won' | 'lost' = 'preparing';
  paused = false;
  time = 0;
  eggs: Egg[] = [];
  feast: Feast | null = null;
  feastUsed = false;
  encouragementUsed = false;
  encouragementRemaining = 0;
  honeyTurns = 0;
  rng: number;
  hatched = 0;
  reroutes = 0;
  units: Entity[] = [];
  enemies: Entity[] = [];
  effects: Effect[] = [];
  remaining = 0;
  spawnTimer = 0;
  nextId = 0;
  kills = 0;
  message = 'Choisis un allié.';
  readonly tuning: Readonly<BalanceTuning>;
  readonly rewards: RewardState;
  readonly campaign: CampaignState = freshCampaign();
  readonly mission: MissionRun | null;
  /** Departure metadata only; never use this instead of the evolving combat RNG. */
  #departureSeed: number | null = null;
  get initialSeed() {
    return this.#departureSeed;
  }
  set initialSeed(seed: number | null) {
    this.#departureSeed = seed;
  }
  missionMinBase = 100;
  constructor(seed = 2026, tuning?: Partial<BalanceTuning>, mission?: MissionRun) {
    this.mission = mission === undefined ? null : readMissionRun(mission);
    if (mission !== undefined && !this.mission) throw new RangeError('Expédition invalide');
    if (this.mission) {
      seed = this.mission.seed;
      this.gold = missionById(this.mission.missionId)!.budget;
    }
    this.tuning = makeBalanceTuning(tuning);
    this.rng = seed >>> 0;
    this.initialSeed = this.rng;
    this.rewards = freshRewards(seed);
    this.add('club', 756, 180);
    this.add('club', 756, 468);
    this.add('hero', 828, 324);
  }
  get totalWaves() {
    return this.mission ? missionById(this.mission.missionId)!.waves.length : TOTAL_WAVES;
  }
  get difficultyWave() {
    const local = Math.max(
      1,
      Math.min(this.totalWaves, this.wave + (this.status === 'preparing' ? 1 : 0)),
    );
    return this.mission ? missionById(this.mission.missionId)!.waves[local - 1] : local;
  }
  get briefing() {
    return this.mission
      ? missionWave(
          this.mission,
          Math.max(1, Math.min(this.totalWaves, this.wave + (this.status === 'preparing' ? 1 : 0))),
        ).pattern
      : waveBriefing(this.difficultyWave);
  }
  get enemyLanes(): readonly number[] {
    return activeEnemyLanes(
      this.mission,
      Math.max(1, Math.min(this.totalWaves, this.wave + (this.status === 'preparing' ? 1 : 0))),
    );
  }
  get missionStars(): number {
    return this.mission && this.status === 'won' ? chapterStars(this.missionMinBase) : 0;
  }
  get level() {
    if (this.mission) return missionLevel(this.mission.layout);
    return levelForWave(this.wave + (this.status === 'preparing' ? 1 : 0));
  }
  /** Used at chapter boundaries and when restoring an older camp. Keeps live identities. */
  normalizeCamp() {
    const level = this.level;
    const legal = (p: Point) =>
      !blocked(p.x, p.y, level) &&
      !blocked(
        Math.floor(p.x / CELL) * CELL + CELL / 2,
        Math.floor(p.y / CELL) * CELL + CELL / 2,
        level,
      );
    let homes = new Map<number, Point>();
    // Reserve valid homes first so displaced units cannot steal a survivor's place.
    for (const u of this.units) {
      const p = { x: u.homeX, y: u.homeY };
      if (
        p.x >= 600 &&
        p.x <= 984 &&
        p.y >= 108 &&
        p.y <= 540 &&
        legal(p) &&
        ![...homes.values()].some((h) => distance(h, p) < 28)
      )
        homes.set(u.id, p);
    }
    try {
      for (const u of this.units)
        if (!homes.has(u.id))
          homes.set(u.id, nearestCampPoint({ x: u.homeX, y: u.homeY }, level, [...homes.values()]));
    } catch (error) {
      if (error instanceof RangeError) throw error;
      homes = denseCampHomes(this.units, level);
    }
    const positions = this.units.filter(legal).map((u) => ({ x: u.x, y: u.y }));
    const relocated = new Map<number, Point>();
    try {
      for (const u of this.units)
        if (!legal(u)) {
          const reserved = [
            ...positions,
            ...this.units.filter((v) => v.id !== u.id).map((v) => homes.get(v.id)!),
          ];
          const p = nearestCampPoint(u, level, reserved);
          relocated.set(u.id, p);
          positions.push(p);
        }
    } catch (error) {
      if (error instanceof RangeError) throw error;
      // The planned homes are legal even when all other positions fill the camp.
      for (const u of this.units) relocated.set(u.id, homes.get(u.id)!);
    }
    // Commit only after both plans are complete: fallback sees the original camp.
    for (const u of this.units) {
      const home = homes.get(u.id)!;
      u.homeX = home.x;
      u.homeY = home.y;
      const p = relocated.get(u.id);
      if (p) {
        u.x = p.x;
        u.y = p.y;
      }
      u.path = [];
      u.nav = 0;
    }
  }
  private random() {
    this.rng = (Math.imul(this.rng, 1664525) + 1013904223) >>> 0;
    return this.rng / 4294967296;
  }
  get rewardOffer(): RewardId[] {
    return this.rewards.pending === null
      ? []
      : rewardOffer(this.rewards.seed, this.rewards.pending);
  }
  get feastDuration() {
    return FEAST_DURATION + extraHoneySeconds(this.rewards);
  }
  trainHero(path: 'force' | 'guard'): boolean {
    if (
      this.paused ||
      this.status !== 'preparing' ||
      (this.mission ? missionById(this.mission.missionId)!.unlockRank < 4 : this.wave < 4) ||
      this.gold < 90 ||
      this.campaign.training !== 'none' ||
      (path !== 'force' && path !== 'guard') ||
      !this.units.some((u) => u.kind === 'hero' && u.hp > 0)
    )
      return false;
    this.gold -= 90;
    this.campaign.training = path;
    this.message =
      path === 'force' ? 'Le héros entraîne sa force !' : 'Le héros entraîne sa garde !';
    return true;
  }
  encourage(): boolean {
    if (
      this.paused ||
      this.status !== 'fighting' ||
      this.encouragementUsed ||
      !this.units.some((u) => u.hp > 0 && kinds[u.kind as Kind].damage > 0)
    )
      return false;
    this.encouragementUsed = true;
    this.encouragementRemaining = 8;
    this.message = 'Courage ! Les alliés frappent plus vite pendant 8 secondes !';
    return true;
  }
  recruitCost(kind: Kind) {
    return freeRecruit(this.rewards, kind) ? 0 : kinds[kind].cost;
  }
  chooseReward(id: string): boolean {
    const milestone = this.rewards.pending;
    if (
      this.paused ||
      this.status !== 'preparing' ||
      milestone === null ||
      !this.rewardOffer.includes(id as RewardId)
    )
      return false;
    const key = id as RewardId;
    this.rewards.choices.push({ milestone, id: key, used: !REWARDS[key].kind });
    this.rewards.pending = null;
    if (key === 'pieces') this.gold = Math.min(10000000, this.gold + 100);
    if (key === 'cristal') this.rewards.ward += 18;
    this.message = REWARDS[key].title + ' ! ' + REWARDS[key].detail;
    return true;
  }
  skipReward(): boolean {
    const milestone = this.rewards.pending;
    if (this.paused || this.status !== 'preparing' || milestone === null) return false;
    this.rewards.choices.push({ milestone, id: 'skip', used: true });
    this.rewards.pending = null;
    return true;
  }
  private pickLane(boss = false, at?: Point, previousLane?: number, airborne = false) {
    const decision = decideTemptation(
      laneDefense(airborne ? this.units.filter((u) => canHitFlying(u.kind)) : this.units),
      this.mission ? this.difficultyWave : this.wave,
      this.random(),
      this.feast?.flavor === 'lure' ? this.feast.lane : null,
      boss,
      this.enemyLanes,
    );
    if (decision.tempted && at) {
      this.effect(at, { x: at.x, y: LANES[decision.lane] }, 'honey');
      if (previousLane !== decision.lane) this.honeyTurns++;
    }
    return decision.lane;
  }
  offerFeast(lane: number, flavor: FeastFlavor = 'lure'): boolean {
    if (
      this.paused ||
      this.status !== 'fighting' ||
      this.feastUsed ||
      (flavor !== 'lure' && flavor !== 'sticky') ||
      !Number.isInteger(lane) ||
      lane < 0 ||
      lane >= LANES.length ||
      !this.enemyLanes.includes(lane)
    )
      return false;
    this.feast = { lane, remaining: this.feastDuration, flavor };
    this.feastUsed = true;
    this.message =
      flavor === 'sticky'
        ? 'Le miel colle aux écailles ! Les serpents ralentissent sur cette voie.'
        : 'Le goûter est servi ! Les serpents gourmands sont tentés de changer de voie.';
    return true;
  }
  private add(kind: Kind, x: number, y: number) {
    const e = this.entity(kind, x, y, kinds[kind].hp);
    this.units.push(e);
    return e;
  }
  private entity(kind: Entity['kind'], x: number, y: number, hp: number): Entity {
    const entity: Entity = {
      id: ++this.nextId,
      kind,
      variant: 'normal',
      broodCool: 10,
      charge: 0,
      guardCool: 0,
      rattleCool: 0,
      confusedFor: 0,
      confusionImmunity: 0,
      x,
      y,
      hp,
      maxHp: hp,
      cool: 0,
      path: [],
      nav: 0,
      boss: false,
      state: 'idle',
      facing: kind === 'snake' ? 1 : -1,
      lane: 0,
      stage: 0,
      homeX: x,
      homeY: y,
      turnY: null,
      targetId: null,
    };
    if (this.tuning.tacticalRulesEnabled) ensureMedical(entity);
    return entity;
  }
  isUnlocked(kind: Kind) {
    return (
      typeof kind === 'string' &&
      Object.hasOwn(kinds, kind) &&
      (this.mission
        ? missionById(this.mission.missionId)!.unlockRank
        : this.wave + (this.status === 'preparing' ? 1 : 0)) >= (unlockWave[kind] ?? 1)
    );
  }
  canRecruit(kind: Kind, x: number, y: number): boolean {
    return (
      !this.paused &&
      this.status !== 'won' &&
      this.status !== 'lost' &&
      kind !== 'hero' &&
      this.isUnlocked(kind) &&
      this.gold >= this.recruitCost(kind) &&
      isPlacementFree(this.units, x, y, this.level)
    );
  }
  recruit(kind: Kind, x: number, y: number): boolean {
    if (!this.canRecruit(kind, x, y)) return false;
    const voucher = freeRecruit(this.rewards, kind);
    this.gold -= this.recruitCost(kind);
    if (voucher) voucher.used = true;
    this.add(kind, x, y);
    this.message = `${kinds[kind].name} rejoint le camp !`;
    return true;
  }
  startWave() {
    if (
      this.paused ||
      this.status !== 'preparing' ||
      this.wave >= this.totalWaves ||
      this.rewards.pending !== null
    )
      return false;
    this.normalizeCamp();
    this.wave++;
    if (!this.mission && (this.wave - 1) % 4 === 0)
      this.campaign.chapterMin[chapterIndex(this.wave)] = this.base;
    const plan = this.mission ? missionWave(this.mission, this.wave) : null;
    this.remaining = (plan?.stats ?? waveStats(this.wave)).count;
    this.spawnTimer = 0;
    this.status = 'fighting';
    this.feast = null;
    this.feastUsed = false;
    this.encouragementUsed = false;
    this.encouragementRemaining = 0;
    this.honeyTurns = 0;
    this.eggs = plan
      ? plan.eggs.map((egg) => ({
          ...egg,
          id: ++this.nextId,
          y: LANES[egg.lane],
          duration: egg.hatchIn,
        }))
      : Array.from({ length: Math.min(3, 1 + Math.floor(this.wave / 4)) }, (_, i) => {
          const pickedLane = Math.floor(this.random() * 3),
            lane = wavePattern(this.wave) === 'brood' ? i % 3 : pickedLane,
            duration = eggIncubation(this.wave, i, this.random());
          return {
            id: ++this.nextId,
            x: 252 + i * 48,
            y: LANES[lane],
            lane,
            hatchIn: duration,
            duration,
            count: 2,
          };
        });
    this.message =
      !this.mission && this.wave === TOTAL_WAVES
        ? 'La dernière vague ! Le roi à trois têtes approche…'
        : `Vague ${this.wave} : défends le camp !`;
    return true;
  }
  repair() {
    if (this.mission) this.missionMinBase = Math.min(this.missionMinBase, this.base);
    if (
      this.paused ||
      this.status === 'won' ||
      this.status === 'lost' ||
      this.gold < 80 ||
      this.base >= 100
    )
      return false;
    this.gold -= 80;
    this.base = Math.min(100, this.base + 25);
    return true;
  }
  private move(e: Entity, target: Point, speed: number, dt: number, campGoal = true) {
    e.nav -= dt;
    if (e.nav <= 0) {
      // An enemy can stand beside a rock in a cell whose centre is blocked.
      // All allied goals (including emergency relief) need a legal grid endpoint.
      let goal = campGoal ? nearestCampPoint(target, this.level) : target;
      if (!campGoal) {
        const candidates: Point[] = [];
        const cx = Math.floor(target.x / CELL),
          cy = Math.floor(target.y / CELL);
        for (let dx = -3; dx <= 3; dx++)
          for (let dy = -3; dy <= 3; dy++) {
            const p = { x: (cx + dx) * CELL + CELL / 2, y: (cy + dy) * CELL + CELL / 2 };
            if (!blocked(p.x, p.y, this.level)) candidates.push(p);
          }
        goal =
          candidates.sort(
            (a, b) => distance(a, target) - distance(b, target) || a.y - b.y || a.x - b.x,
          )[0] ?? e;
      }
      e.path = findPath(e, goal, this.level);
      e.nav = 0.45;
    }
    const p = e.path[0];
    if (!p) {
      e.state = 'idle';
      return;
    }
    const d = distance(e, p);
    if (d < 3) {
      e.path.shift();
      return;
    }
    const step = Math.min(d, speed * dt);
    const x = e.x + ((p.x - e.x) / d) * step,
      y = e.y + ((p.y - e.y) / d) * step;
    if (!blocked(x, y, this.level)) {
      e.facing = x > e.x ? 1 : x < e.x ? -1 : e.facing;
      e.x = x;
      e.y = y;
      e.state = 'move';
      if (e.kind === 'cavalry' || e.kind === 'triceratops')
        e.charge = Math.min(1, e.charge + dt / 1.4);
    }
  }
  private spawnSnake(
    x: number,
    y: number,
    lane: number,
    hp: number,
    boss: boolean,
    variant: EnemyKind = 'normal',
  ) {
    const e = this.entity('snake', x, y, hp * (boss ? 1 : enemyTypes[variant].hp));
    e.variant = variant;
    e.lane = lane;
    e.boss = boss;
    ensureBossState(e, this.tuning);
    this.enemies.push(e);
    return e;
  }
  private threat(u: Entity, e: Entity) {
    // Protect home lane, but intercept nearby intruders and urgent threats to the crystal.
    return (
      distance(u, e) +
      Math.abs(u.homeY - e.y) * 0.35 -
      (e.x >= 900 ? 1000 : 0) -
      Math.max(0, e.x - 780) * 0.5
    );
  }
  private returnHome(u: Entity, speed: number, dt: number) {
    if (u.targetId !== null) {
      u.targetId = null;
      u.path = [];
      u.nav = 0;
    }
    const home = { x: u.homeX, y: u.homeY };
    if (distance(u, home) > 20) this.move(u, home, speed, dt);
  }
  private walkRoad(e: Entity, goal: Point, speed: number, dt: number, junctionX?: number) {
    e.nav -= dt;
    if (e.nav <= 0 || !e.path.length) {
      e.path =
        junctionX === undefined
          ? roadLeg(e, goal.x, e.lane, this.level, e.boss ? 0 : e.id % 2 ? -11 : 11)
          : junctionLeg(e, goal.y, junctionX, this.level);
      e.nav = 0.45;
    }
    let remaining = speed * dt;
    while (remaining > 0 && e.path.length) {
      const p = e.path[0],
        d = distance(e, p);
      if (d < 0.01) {
        e.path.shift();
        continue;
      }
      const step = Math.min(d, remaining, 2);
      const x = e.x + ((p.x - e.x) / d) * step,
        y = e.y + ((p.y - e.y) / d) * step;
      if (blocked(x, y, this.level)) {
        // Recovery from an old/off-trail position still respects real obstacles.
        e.path = findPath(e, goal, this.level);
        e.nav = 0.45;
        return;
      }
      if (Math.abs(x - e.x) > 0.01) e.facing = x > e.x ? 1 : -1;
      e.x = x;
      e.y = y;
      e.state = 'move';
      remaining -= step;
      if (step === d) e.path.shift();
    }
  }
  private followRoute(e: Entity, speed: number, dt: number) {
    speed *= stickySpeed(e, this.feast, this.level);
    if (e.turnY !== null) {
      const junctions = routeJunctions(this.level);
      const x = e.stage === 1 ? junctions[0] : junctions[1];
      const junction = junctionPoint(x, e.turnY, this.level);
      if (distance(e, junction) < 2.5) {
        e.turnY = null;
        e.nav = 0;
        e.path = [];
      } else this.walkRoad(e, junction, speed, dt, x);
      return;
    }
    const junctions = routeJunctions(this.level);
    const stages = [junctions[0], 444, 612, junctions[1], 828, 972, 1032];
    const goal = lanePoint(
      stages[Math.min(e.stage, stages.length - 1)],
      e.lane,
      this.level,
      e.boss ? 0 : e.id % 2 ? -11 : 11,
    );
    if (
      Math.abs(e.x - goal.x) < 2.5 &&
      Math.abs(e.y - goal.y) < 14 &&
      e.stage < stages.length - 1
    ) {
      if (e.stage === 0 || e.stage === 3) {
        const next = this.pickLane(e.boss, e, e.lane, isFlying(e));
        if (next !== e.lane) {
          e.lane = next;
          e.turnY = LANES[next];
          this.reroutes++;
        }
      }
      e.stage++;
      e.nav = 0;
      e.path = [];
      return;
    }
    this.walkRoad(e, goal, speed, dt);
  }
  private effect(a: Point, b: Point, kind: Effect['kind']) {
    this.effects.push({
      sourceId: 'id' in a && typeof a.id === 'number' ? a.id : undefined,
      targetId: 'id' in b && typeof b.id === 'number' ? b.id : undefined,
      x: a.x,
      y: a.y,
      tx: b.x,
      ty: b.y,
      kind,
      life: kind === 'honey' ? 0.9 : 0.3,
    });
  }
  /** All outgoing hits share kill attribution, including splash and a second head. */
  private hitEnemy(source: Entity, target: Entity, damage: number) {
    if (target.hp <= 0) return;
    const state = ensureBossState(target, this.tuning);
    const unabsorbed = state
      ? absorbBossHit(
          state,
          damage,
          defenseRole(source.kind as Kind) === 'ranged'
            ? this.tuning.bossShieldRangedFactor
            : this.tuning.bossShieldMeleeFactor,
        )
      : damage;
    const actual = unabsorbed * (1 - enemyArmor(target));
    if (state?.heads) {
      receiveBossDamage(state, actual, defenseRole(source.kind as Kind) === 'ranged');
      target.hp = bossHeadsHealth(state);
    } else target.hp -= actual;
    if (target.hp > 0) ensureBossState(target, this.tuning);
    if (target.hp <= 0) {
      cancelBossShot(target.bossState);
      const reaction = deathRetaliation(target);
      if (reaction > 0) {
        // Exactly 2/3 PV: this reaction bypasses armour and cannot hit a bystander.
        source.hp -= reaction;
        this.effect(target, source, 'hit');
      }
    }
  }
  private damageAlly(source: Entity, target: Entity, damage: number, projectile: boolean) {
    const guard = projectile ? coveringShield(this.units, target) : undefined;
    target.hp -=
      incomingDamage(target.kind as Kind, damage) *
      (target.kind === 'hero' && this.campaign.training === 'guard' ? 0.85 : 1) *
      (guard ? 1 - GUARD_REDUCTION : 1);
    if (guard) {
      guard.guardCool = GUARD_COOLDOWN;
      this.effect(guard, target, 'block');
    }
    this.effect(source, target, projectile ? 'poison' : 'hit');
  }
  private supplyGoal(unit: Entity): Point {
    return nearestCampPoint({ x: 984, y: 324 + ((unit.id % 3) - 1) * 36 }, this.level);
  }
  private medicalReady(unit: Entity, dt: number): boolean {
    if (!this.tuning.tacticalRulesEnabled) return true;
    const medical = ensureMedical(unit);
    if (!medical) return false;
    if (medical.phase === 'ready') return true;
    const goal = this.supplyGoal(unit);
    const atBase = distance(unit, goal) <= 26;
    tickMedical(medical, dt, atBase, unit.kind as Kind);
    if (!atBase) this.move(unit, goal, kinds[unit.kind as Kind].speed, dt);
    return false;
  }
  private updateCourt(unit: Entity, dt: number, speed: number, damage: number): boolean {
    const court = unit.court;
    if (!court) return false;
    if (court.role === 'healer') {
      const proposal = tickCourtHeal(court, dt, unit, this.enemies);
      if (proposal) {
        if (proposal.target.bossState?.heads) {
          healBossHeads(proposal.target.bossState, proposal.amount);
          proposal.target.hp = bossHeadsHealth(proposal.target.bossState);
        } else
          proposal.target.hp = Math.min(
            proposal.target.maxHp,
            proposal.target.hp + proposal.amount,
          );
        this.effect(unit, proposal.target, 'heal');
        unit.state = 'heal';
      }
    }
    const king = this.enemies.find((e) => e.id === court.bossId && e.hp > 0);
    if (!king) {
      if (!unit.courtReleased) {
        const [first, second] = routeJunctions(this.level);
        unit.stage = [first, 444, 612, second, 828, 972, 1032].findIndex((x) => x > unit.x + 2);
        if (unit.stage < 0) unit.stage = 6;
        unit.turnY = null;
        unit.path = [];
        unit.nav = 0;
        unit.courtReleased = true;
      }
      return false;
    }
    const definition = court.role === 'healer' ? BOSS_COURT[2] : BOSS_COURT[unit.id % 2];
    const target =
      court.role === 'guard'
        ? this.units
            .filter((u) => u.hp > 0 && distance(u, unit) <= 44 && distance(u, king) <= 150)
            .sort((a, b) => distance(a, unit) - distance(b, unit) || a.id - b.id)[0]
        : undefined;
    if (target && unit.cool <= 0) {
      this.damageAlly(unit, target, damage * enemyTypes[unit.variant].damage, false);
      unit.cool = 1.25;
      unit.state = 'attack';
    }
    const goal = {
      x: Math.max(36, Math.min(984, king.x + definition.offsetX)),
      y: king.y + definition.offsetY,
    };
    if ((!target || distance(unit, king) > 130) && distance(unit, goal) > 18)
      this.move(unit, goal, speed * 1.15, dt, false);
    else if (unit.state !== 'heal') unit.state = target ? 'attack' : 'idle';
    unit.lane = king.lane;
    return true;
  }
  private updateBossShot(e: Entity, dt: number) {
    const state = e.bossState;
    if (!this.tuning.bossEnabled || !e.boss || !state || e.x < 576) return;
    state.shotCooldown = Math.max(0, state.shotCooldown - dt);
    if (state.shotTargetId !== null) {
      state.windup = Math.max(0, state.windup - dt);
      if (state.windup > 1e-9) return;
      const point = { x: state.targetX, y: state.targetY };
      for (const target of this.units) {
        if (target.hp <= 0 || distance(target, point) > this.tuning.bossShotRadius) continue;
        const factor = state.shotHead === 'hybrid' ? 10 / 18 : 1;
        this.damageAlly(e, target, this.tuning.bossShotDamage * factor, true);
      }
      state.shotsFired++;
      cancelBossShot(state);
      return;
    }
    const contact = this.units.some((u) => u.hp > 0 && distance(u, e) <= 44);
    const attack = state.heads ? bossShotAttack(state, contact) : undefined;
    if ((state.heads ? !attack : state.shotCooldown > 0) || this.tuning.bossShotDamage === 0)
      return;
    const target = this.units
      .filter((u) => u.hp > 0 && distance(u, e) <= this.tuning.bossShotRange)
      .sort(
        (a, b) =>
          (defenseRole(a.kind as Kind) === 'ranged' ? 0 : 1) -
            (defenseRole(b.kind as Kind) === 'ranged' ? 0 : 1) ||
          distance(a, e) - distance(b, e) ||
          a.id - b.id,
      )[0];
    if (!target) return;
    if (state.heads && attack) {
      state.shotHead = attack.head;
      state.heads[attack.head].cool = this.tuning.bossShotInterval * attack.intervalFactor;
    }
    state.targetX = target.x;
    state.targetY = target.y;
    state.shotTargetId = target.id;
    state.windup = this.tuning.bossShotWindup;
    state.shotCooldown = this.tuning.bossShotInterval;
  }
  private updateConfusion(dt: number) {
    for (const u of this.units) {
      u.confusedFor = Math.max(0, u.confusedFor - dt);
      u.confusionImmunity = Math.max(0, u.confusionImmunity - dt);
    }
    for (const e of this.enemies) {
      e.rattleCool = Math.max(0, e.rattleCool - dt);
      if (e.hp <= 0 || e.boss || e.variant !== 'rattlesnake' || e.rattleCool > 0) continue;
      let affected = false;
      for (const u of this.units)
        if (
          u.hp > 0 &&
          u.kind !== 'wall' &&
          u.confusionImmunity <= 0 &&
          distance(u, e) <= RATTLE_RADIUS
        ) {
          u.confusedFor = CONFUSION_DURATION;
          u.confusionImmunity = CONFUSION_IMMUNITY;
          u.targetId = null;
          u.path = [];
          u.nav = 0;
          affected = true;
        }
      if (affected) e.rattleCool = RATTLE_COOLDOWN;
    }
  }
  step(dt: number) {
    if (
      this.paused ||
      this.status === 'won' ||
      this.status === 'lost' ||
      !Number.isFinite(dt) ||
      dt <= 0
    )
      return;
    dt = Math.min(0.05, dt);
    if (this.mission) this.missionMinBase = Math.min(this.missionMinBase, this.base);
    this.time += dt;
    if (this.feast) {
      this.feast.remaining -= dt;
      if (this.feast.remaining <= 1e-9) this.feast = null;
    }
    this.effects = this.effects.filter((e) => (e.life -= dt) > 0);
    this.units = this.units.filter((u) => u.hp > 0);
    if (this.status === 'fighting' && this.remaining > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        const plan = this.mission
          ? missionWave(this.mission, this.wave, this.tuning.tacticalRulesEnabled)
          : null;
        const stats = plan?.stats ?? waveStats(this.wave);
        const courtEntry =
          this.tuning.tacticalRulesEnabled &&
          !this.mission &&
          this.wave === TOTAL_WAVES &&
          this.remaining <= 4;
        const boss =
          !this.mission && this.wave === TOTAL_WAVES && (this.remaining === 1 || courtEntry);
        const index = Math.max(0, stats.count - this.remaining);
        const baseVariant = boss
          ? 'normal'
          : plan
            ? plan.composition[index]
            : variantFor(this.wave, this.remaining);
        const variant =
          this.tuning.tacticalRulesEnabled && !boss && !plan
            ? flyingVariant(baseVariant, this.difficultyWave, this.remaining)
            : baseVariant;
        const pickedLane = this.pickLane(boss, undefined, undefined, variant === 'flying');
        const proposedLane =
          this.feast?.flavor === 'lure'
            ? pickedLane
            : entryLane(this.difficultyWave, index, pickedLane);
        const lane = this.enemyLanes.includes(proposedLane) ? proposedLane : pickedLane;
        const entry = this.spawnSnake(
          108,
          LANES[lane],
          lane,
          stats.hp *
            (boss
              ? this.tuning.bossHpMultiplier
              : this.difficultyWave % 2 === 0 && this.remaining % 3 === 0
                ? 1.6
                : 1),
          boss,
          variant,
        );
        if (courtEntry) {
          for (const member of BOSS_COURT) {
            const escort = this.spawnSnake(
              entry.x + member.offsetX,
              entry.y + member.offsetY,
              lane,
              stats.hp * member.hpFactor,
              false,
              member.variant,
            );
            escort.court = {
              bossId: entry.id,
              role: member.role,
              charges: member.role === 'healer' ? COURT_HEAL.charges : 0,
              cool: 0,
            };
          }
          this.remaining = 0;
          this.message = 'Le roi arrive avec sa garde et un soigneur ! Chaque tête a son rôle.';
        } else this.remaining--;
        this.spawnTimer = plan
          ? plan.cadence[index % plan.cadence.length]
          : spawnDelay(this.wave, index);
      }
    }
    if (this.status === 'fighting') {
      for (const egg of this.eggs) {
        egg.hatchIn -= dt;
        if (egg.hatchIn <= 0) {
          for (let i = 0; i < egg.count; i++)
            this.spawnSnake(
              egg.x + i * 12,
              egg.y,
              egg.lane,
              waveStats(this.difficultyWave).hp * 0.75,
              false,
            );
          this.hatched += egg.count;
          this.effect(egg, egg, 'hit');
          this.message = 'Des œufs ont éclos ! De nouveaux serpents arrivent.';
        }
      }
      this.eggs = this.eggs.filter((e) => e.hatchIn > 0);
    }
    for (const e of this.enemies) {
      if (e.hp <= 0) cancelBossShot(e.bossState);
      else {
        const state = ensureBossState(e, this.tuning);
        if (state) {
          state.breakFlash = Math.max(0, state.breakFlash - dt);
          tickBossHeads(state, dt);
        }
      }
    }
    this.updateConfusion(dt);
    const relief = reliefTeams(this.units, this.enemies);
    const assignments = new Map<number, number>();
    for (const u of this.units) {
      if (u.hp <= 0) continue;
      const d = kinds[u.kind as Kind];
      u.cool -= dt;
      u.guardCool = Math.max(0, u.guardCool - dt);
      u.state = 'idle';
      if (u.confusedFor > 0) continue;
      if (healAmount(u.kind as Kind) > 0) {
        if (!this.medicalReady(u, dt)) continue;
        const injured = this.units
          .filter(
            (v) =>
              v.kind !== 'wall' &&
              v.hp > 0 &&
              v.hp < v.maxHp &&
              distance({ x: u.homeX, y: u.homeY }, v) <= 320,
          )
          .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp || a.id - b.id)[0];
        if (injured) {
          if (distance(u, injured) > d.range) this.move(u, injured, d.speed, dt);
          else if (u.cool <= 0) {
            if (this.tuning.tacticalRulesEnabled && (!u.medical || !consumeBandage(u.medical)))
              continue;
            injured.hp = Math.min(injured.maxHp, injured.hp + healAmount(u.kind as Kind));
            u.cool = d.rate;
            u.state = 'heal';
            this.effect(u, injured, 'heal');
          }
        } else this.returnHome(u, d.speed, dt);
        continue;
      }
      if (!d.damage) continue;
      const score = (e: Entity) =>
        this.threat(u, e) +
        (defenseRole(u.kind as Kind) === 'mobile' ? 120 * (assignments.get(e.id) ?? 0) : 0) -
        (u.kind === 'ninja' && e.variant === 'spitter' && e.x >= 612 && distance(u, e) <= 280
          ? 180
          : 0);
      let candidates = this.enemies.filter(
        (e) =>
          e.hp > 0 &&
          (!isFlying(e) || canHitFlying(u.kind)) &&
          (canEngage(u, e) || relief.get(e.id)?.has(u.id)),
      );
      if (u.kind === 'ninja') {
        const urgent = candidates.filter((e) => e.x >= 900);
        if (urgent.length) candidates = urgent;
      }
      let target = candidates.sort((a, b) => score(a) - score(b) || a.id - b.id)[0];
      const retained = candidates.find((e) => e.id === u.targetId);
      // Keep a viable opponent for small score changes. Crystal danger's 1000-point
      // priority and the mobile assignment penalty still immediately break the lock.
      if (target && retained && score(retained) <= score(target) + 12) target = retained;
      if (!target) {
        this.returnHome(u, d.speed, dt);
        continue;
      }
      if (u.targetId !== target.id) {
        u.targetId = target.id;
        u.path = [];
        u.nav = 0;
      }
      assignments.set(target.id, (assignments.get(target.id) ?? 0) + 1);
      u.facing = target.x >= u.x ? 1 : -1;
      if (distance(u, target) > d.range) {
        const goal = relief.get(target.id)?.has(u.id)
          ? { x: Math.max(612, Math.min(984, target.x)), y: target.y }
          : defenseGoal(u, target, this.level);
        this.move(u, goal, d.speed, dt);
      } else if (u.cool <= 0) {
        const damage =
          attackDamage(u.kind as Kind, u.charge, this.tuning.mutantDamageFactor) *
          (u.kind === 'hero' && this.campaign.training === 'force' ? HERO_FORCE_FACTOR : 1);
        if (u.kind === 'dragon' || u.kind === 'tank') {
          const radius = u.kind === 'tank' ? 75 : 65;
          for (const enemy of this.enemies)
            if (enemy.hp > 0 && distance(enemy, target) < radius)
              this.hitEnemy(
                u,
                enemy,
                damage * (enemy === target ? 1 : this.tuning.splashSecondaryFactor),
              );
        } else {
          const covered = umbrellaCover(u, target);
          this.hitEnemy(u, target, damage * (covered ? 0.25 : 1));
          if (covered) this.effect(u, target, 'block');
          if (u.kind === 'twohead') {
            const second = this.enemies
              .filter(
                (e) => e !== target && e.hp > 0 && !isFlying(e) && distance(e, u) <= d.range + 20,
              )
              .sort((a, b) => distance(a, u) - distance(b, u) || a.id - b.id)[0];
            if (second) {
              this.hitEnemy(u, second, damage);
              this.effect(u, second, 'hit');
            }
          }
        }
        u.charge = 0;
        u.cool = d.rate * (this.encouragementRemaining > 0 ? 0.85 : 1);
        u.state = 'attack';
        this.effect(
          u,
          target,
          u.kind === 'dragon'
            ? 'fire'
            : u.kind === 'tank'
              ? 'shell'
              : u.kind === 'archer'
                ? 'arrow'
                : 'hit',
        );
      }
    }
    const stats = waveStats(this.mission ? this.difficultyWave : this.wave || 1);
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      e.cool -= dt;
      e.state = 'move';
      const enemyData = enemyTypes[e.variant];
      if (this.updateCourt(e, dt, stats.speed, stats.damage)) continue;
      this.updateBossShot(e, dt);
      if (e.boss && e.x >= 576) {
        e.broodCool -= dt;
        if (e.broodCool <= 0 && this.eggs.length < 6) {
          const lane = Math.floor(this.random() * 3);
          this.eggs.push({
            id: ++this.nextId,
            x: 300,
            y: LANES[lane],
            lane,
            hatchIn: 4,
            duration: 4,
            count: 2,
          });
          e.broodCool = 12;
          this.message = 'Le roi à trois têtes a pondu un nouvel œuf !';
        }
      }
      const attackRange = e.x >= 612 ? enemyData.range : 44;
      const target = (e.variant === 'courtHealer' ? [] : this.units)
        .filter((u) => u.hp > 0 && distance(u, e) < attackRange)
        .sort(
          (a, b) =>
            (e.variant === 'spitter'
              ? (defenseRole(a.kind as Kind) === 'ranged' ? 0 : 1) -
                (defenseRole(b.kind as Kind) === 'ranged' ? 0 : 1)
              : 0) ||
            distance(a, e) - distance(b, e) ||
            a.id - b.id,
        )[0];
      if (target) {
        e.state = 'attack';
        e.facing = target.x >= e.x ? 1 : -1;
        if (e.bossState?.heads) {
          for (const attack of bossMeleeAttacks(e.bossState)) {
            this.damageAlly(e, target, stats.damage * attack.damageFactor, false);
            e.bossState.heads[attack.head].cool = attack.cooldown;
          }
        } else if (e.cool <= 0) {
          this.damageAlly(
            e,
            target,
            stats.damage * (e.boss ? 2 : enemyData.damage),
            e.variant === 'spitter',
          );
          e.cool = e.variant === 'spitter' ? 1.5 : 1.05;
        }
        // Support can be bitten but never becomes an immortal roadblock.
        if (defenseRole(target.kind as Kind) === 'support' || isFlying(e)) {
          this.followRoute(e, stats.speed * (e.boss ? 0.8 : enemySpeed(e.variant, this.time)), dt);
          e.facing = target.x >= e.x ? 1 : -1;
          e.state = 'attack';
        }
      } else
        this.followRoute(e, stats.speed * (e.boss ? 0.8 : enemySpeed(e.variant, this.time)), dt);
      if (e.x > 1000) {
        const absorbed = e.boss ? 0 : Math.min(9, this.rewards.ward);
        this.rewards.ward -= absorbed;
        this.base = Math.max(0, this.base - (e.boss ? 100 : 9 - absorbed));
        if (this.mission) this.missionMinBase = Math.min(this.missionMinBase, this.base);
        else {
          const chapter = chapterIndex(this.wave);
          this.campaign.chapterMin[chapter] = Math.min(
            this.campaign.chapterMin[chapter],
            this.base,
          );
        }
        e.hp = 0;
        e.maxHp = 0;
        cancelBossShot(e.bossState);
        this.message =
          absorbed > 0
            ? `La protection du cristal a absorbé ${absorbed} dégâts !`
            : 'Un serpent a atteint le camp !';
      }
    }
    for (const e of this.enemies)
      if (e.hp <= 0 && e.maxHp > 0) {
        this.gold += e.boss ? 90 : 12;
        this.kills++;
        this.effect(e, e, 'gold');
      }
    this.units = this.units.filter((u) => u.hp > 0);
    this.enemies = this.enemies.filter((e) => e.hp > 0);
    // Mild local separation; never push fixed defences or cross navigation obstacles.
    for (let i = 0; i < this.units.length; i++)
      for (let j = i + 1; j < this.units.length; j++) {
        const a = this.units[i],
          b = this.units[j],
          d = distance(a, b);
        if (d >= 36) continue;
        const dx = d ? (a.x - b.x) / d : 1,
          dy = d ? (a.y - b.y) / d : 0;
        for (const [u, sign] of [
          [a, 1],
          [b, -1],
        ] as const) {
          if (u.kind === 'wall') continue;
          const x = u.x + dx * sign * 22 * dt,
            y = u.y + dy * sign * 22 * dt;
          if (
            x >= 600 &&
            x <= 984 &&
            !blocked(x, y, this.level) &&
            !blocked(
              Math.floor(x / CELL) * CELL + CELL / 2,
              Math.floor(y / CELL) * CELL + CELL / 2,
              this.level,
            )
          ) {
            u.x = x;
            u.y = y;
          }
        }
      }
    this.encouragementRemaining = Math.max(0, this.encouragementRemaining - dt);
    if (this.encouragementRemaining <= 1e-9) this.encouragementRemaining = 0;
    if (this.base <= 0) {
      this.status = 'lost';
      for (const e of this.enemies) cancelBossShot(e.bossState);
      this.feast = null;
      this.encouragementRemaining = 0;
      this.message = 'Le camp est tombé… Une autre stratégie ?';
    } else if (
      this.status === 'fighting' &&
      this.remaining === 0 &&
      this.enemies.length === 0 &&
      this.eggs.length === 0
    ) {
      this.feast = null;
      this.encouragementRemaining = 0;
      if (!this.mission && this.wave % 4 === 0) {
        const chapter = chapterIndex(this.wave);
        this.campaign.chapterStars[chapter] = chapterStars(this.campaign.chapterMin[chapter]);
      }
      this.gold += stats.reward;
      this.status = this.wave === this.totalWaves ? 'won' : 'preparing';
      if (!this.mission && this.status === 'preparing' && (this.wave === 4 || this.wave === 8)) {
        this.normalizeCamp();
        if (!this.rewards.choices.some((c) => c.milestone === this.wave))
          this.rewards.pending = this.wave;
      }
      this.message =
        this.status === 'won'
          ? this.mission
            ? `Victoire ! ${missionById(this.mission.missionId)!.name} : ${this.missionStars} étoiles !`
            : 'Victoire ! Le roi à trois têtes est vaincu !'
          : `Vague repoussée ! +${stats.reward} pièces. Prépare la suite.`;
    }
  }
}
