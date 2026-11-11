import { activeEnemyLanes } from './tutorial.ts';
import { freshRewards, rewardOffer, REWARDS, freeRecruit, extraHoneySeconds } from './rewards.ts';
import type { RewardState, RewardId } from './rewards.ts';
import { freshCampaign, chapterIndex, chapterStars } from './campaignRules.ts';
import type { CampaignState } from './campaignRules.ts';
import { makeBalanceTuning } from './balanceTuning.ts';
import type { BalanceTuning } from './balanceTuning.ts';
import { isPlacementFree } from './placement.ts';
import { wavePattern, eggIncubation, waveBriefing } from './waves.ts';
import { FEAST_DURATION } from './tactics.ts';
import type { Feast, FeastFlavor } from './tactics.ts';
import { LANES } from './ai.ts';
import { kinds, TOTAL_WAVES, waveStats, unlockWave } from './data.ts';
import type { Kind } from './data.ts';
import { levelForWave, missionLevel } from './levels.ts';
import { missionById, missionWave, readMissionRun } from './missions.ts';
import type { MissionRun } from './missions.ts';
import { balanceRecruitPrice } from './balanceRevision.ts';
import type { BalanceRevision } from './balanceRevision.ts';
import { capriceBudget, capriceRules } from './caprices.ts';
import type { CapriceRules } from './caprices.ts';
import type { Entity, Egg, Effect } from './engine/state.ts';
import { nextRandom, addAlly } from './engine/state.ts';
import { normalizeCamp as normalizeCampRule } from './engine/camp.ts';
import { spawnNext, hatchEggs } from './engine/spawning.ts';
import { tickBosses } from './engine/court.ts';
import { updateAllies, separateAllies } from './engine/allies.ts';
import { updateConfusion, updateEnemies } from './engine/enemyTurn.ts';
import { collectFallen, resolveWave } from './engine/outcome.ts';
export type { Entity, Egg, Effect } from './engine/state.ts';
/**
 * La partie : son état et les commandes du joueur. Les règles de chaque pas de simulation
 * sont dans `src/engine/` et s'exécutent dans l'ordre fixé par `step`. Cet ordre et les
 * tirages de `nextRandom` décident de la partie : les changer casse les anciens codes.
 */
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
  /** Sortes d'alliés recrutées pendant une mission à caprice « copains ». */
  readonly #capriceKinds = new Set<Kind>();
  get caprice(): CapriceRules {
    return capriceRules(this.mission);
  }
  readonly #balanceRevision: BalanceRevision;
  get balanceRevision(): BalanceRevision {
    return this.#balanceRevision;
  }
  constructor(
    seed = 2026,
    tuning?: Partial<BalanceTuning>,
    mission?: MissionRun,
    balance?: BalanceRevision,
  ) {
    this.mission = mission === undefined ? null : readMissionRun(mission);
    if (mission !== undefined && !this.mission) throw new RangeError('Expédition invalide');
    const revision = this.mission?.balance ?? 1;
    if (
      (balance !== undefined && balance !== 1 && balance !== 2) ||
      (this.mission && balance !== undefined && balance !== revision)
    )
      throw new RangeError('Révision invalide');
    this.#balanceRevision = balance ?? revision;
    if (this.mission) {
      seed = this.mission.seed;
      this.gold = capriceBudget(
        missionById(this.mission.missionId)!.budget,
        capriceRules(this.mission),
      );
    }
    this.tuning = makeBalanceTuning(tuning);
    this.rng = seed >>> 0;
    this.initialSeed = this.rng;
    this.rewards = freshRewards(seed);
    addAlly(this, 'club', 756, 180);
    addAlly(this, 'club', 756, 468);
    addAlly(this, 'hero', 828, 324);
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
    normalizeCampRule(this);
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
      this.gold - this.caprice.reserve < 90 ||
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
    return freeRecruit(this.rewards, kind) ? 0 : balanceRecruitPrice(kind, this.balanceRevision);
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
  offerFeast(lane: number, flavor: FeastFlavor = 'lure'): boolean {
    if (
      this.paused ||
      this.status !== 'fighting' ||
      this.feastUsed ||
      this.caprice.noHoney ||
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
  isUnlocked(kind: Kind) {
    return (
      typeof kind === 'string' &&
      Object.hasOwn(kinds, kind) &&
      (this.mission
        ? missionById(this.mission.missionId)!.unlockRank
        : this.wave + (this.status === 'preparing' ? 1 : 0)) >= (unlockWave[kind] ?? 1)
    );
  }
  /** Sortes d'alliés retenues pour un caprice « copains » (vide sinon). */
  get capriceKindsChosen(): readonly Kind[] {
    return [...this.#capriceKinds];
  }
  /**
   * Fixe les sortes d'alliés d'un caprice « copains » avant le premier recrutement
   * (écran de préparation) ou à la restauration d'une sauvegarde. Sans choix, les
   * premières sortes recrutées sont retenues.
   */
  chooseCapriceKinds(list: readonly Kind[]): boolean {
    const limit = this.caprice.kinds;
    if (
      !limit ||
      this.status !== 'preparing' ||
      this.#capriceKinds.size ||
      !Array.isArray(list) ||
      list.length < 1 ||
      list.length > limit ||
      new Set(list).size !== list.length ||
      list.some(
        (kind) =>
          kind === 'hero' ||
          !this.isUnlocked(kind) ||
          (this.caprice.noHealers && (kind === 'medic' || kind === 'nurse')),
      )
    )
      return false;
    for (const kind of list) this.#capriceKinds.add(kind);
    return true;
  }
  capriceAllows(kind: Kind): boolean {
    const rules = this.caprice;
    if (rules.noHealers && (kind === 'medic' || kind === 'nurse')) return false;
    return !rules.kinds || this.#capriceKinds.has(kind) || this.#capriceKinds.size < rules.kinds;
  }
  canRecruit(kind: Kind, x: number, y: number): boolean {
    return (
      !this.paused &&
      this.capriceAllows(kind) &&
      this.status !== 'won' &&
      this.status !== 'lost' &&
      kind !== 'hero' &&
      this.isUnlocked(kind) &&
      this.gold - this.caprice.reserve >= this.recruitCost(kind) &&
      isPlacementFree(this.units, x, y, this.level)
    );
  }
  recruit(kind: Kind, x: number, y: number): boolean {
    if (!this.canRecruit(kind, x, y)) return false;
    const voucher = freeRecruit(this.rewards, kind);
    this.gold -= this.recruitCost(kind);
    if (voucher) voucher.used = true;
    addAlly(this, kind, x, y);
    if (this.caprice.kinds) this.#capriceKinds.add(kind);
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
          const pickedLane = Math.floor(nextRandom(this) * 3),
            lane = wavePattern(this.wave) === 'brood' ? i % 3 : pickedLane,
            duration = eggIncubation(this.wave, i, nextRandom(this));
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
      this.gold - this.caprice.reserve < 80 ||
      this.base >= 100
    )
      return false;
    this.gold -= 80;
    this.base = Math.min(100, this.base + 25);
    return true;
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
    spawnNext(this, dt);
    hatchEggs(this, dt);
    tickBosses(this, dt);
    updateConfusion(this, dt);
    updateAllies(this, dt);
    const rankStats = waveStats(this.mission ? this.difficultyWave : this.wave || 1);
    const stats = {
      ...rankStats,
      speed: rankStats.speed * this.caprice.speed,
      damage: rankStats.damage * this.caprice.bite,
    };
    updateEnemies(this, dt, stats);
    collectFallen(this);
    separateAllies(this, dt);
    resolveWave(this, dt, stats);
  }
}
