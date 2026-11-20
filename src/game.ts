import { activeEnemyLanes } from './tutorial.ts';
import { freshRewards, rewardOffer, REWARDS, freeRecruit, extraHoneySeconds } from './rewards.ts';
import { endlessStats, endlessWave, readEndlessRules } from './endless.ts';
import { BOON_RULES, boonLevel, boonOffer, isLastingBoon, readBoons, takeBoon } from './boons.ts';
import type { BoonId, BoonRules, Boons, LastingBoon } from './boons.ts';
import type { EndlessRules } from './endless.ts';
import type { Milestone, RewardState, RewardId } from './rewards.ts';
import { freshCampaign, chapterIndex, chapterStars } from './campaignRules.ts';
import type { CampaignState } from './campaignRules.ts';
import { makeBalanceTuning } from './balanceTuning.ts';
import type { BalanceTuning } from './balanceTuning.ts';
import { isPlacementFree } from './placement.ts';
import { waveBriefing } from './waves.ts';
import { FEAST_DURATION } from './tactics.ts';
import type { Feast, FeastFlavor } from './tactics.ts';
import { LANES } from './ai.ts';
import { kinds, TOTAL_WAVES, waveStats, unlockWave } from './data.ts';
import type { Kind } from './data.ts';
import {
  CRYSTAL_MAX,
  CRYSTAL_WARD,
  DEFAULT_SEED,
  ENCOURAGEMENT_SECONDS,
  GOLD_LIMIT,
  HERO_TRAINING_COST,
  REPAIR_AMOUNT,
  REPAIR_COST,
  REWARD_COINS,
  START_GOLD,
  WAVES_PER_CHAPTER,
  REWARD_WAVES,
} from './gameConstants.ts';
import { levelForWave, missionLevel } from './levels.ts';
import { missionById, missionWave, readMissionRun } from './missions.ts';
import type { MissionRun } from './missions.ts';
import {
  allyExists,
  balanceRecruitPrice,
  isBalanceRevision,
  lateEggRule,
} from './balanceRevision.ts';
import type { BalanceRevision, LateEggRule } from './balanceRevision.ts';
import { capriceBudget, capriceRules } from './caprices.ts';
import type { CapriceRules } from './caprices.ts';
import { openStage, readStageRules } from './voyageRules.ts';
import type { StageRules } from './voyageRules.ts';
import type { Entity, Egg, Effect } from './engine/state.ts';
import { addAlly } from './engine/state.ts';
import { normalizeCamp as normalizeCampRule } from './engine/camp.ts';
import { spawnNext, hatchEggs, layWaveEggs, layLateEgg } from './engine/spawning.ts';
import { tickBosses } from './engine/court.ts';
import { updateAllies, separateAllies } from './engine/allies.ts';
import { updateConfusion, updateEnemies } from './engine/enemyTurn.ts';
import { collectFallen, resolveWave } from './engine/outcome.ts';
import * as TEXT from './texts/fr/battle.ts';
import { fill } from './texts/fill.ts';
export type { Entity, Egg, Effect } from './engine/state.ts';

/** Longest simulated step: a slow frame is cut short rather than leaping over a fight. */
const MAX_STEP = 0.05;

/** Won or lost: the game no longer advances and nothing can be bought. */
function isOver(game: Game): boolean {
  return game.status === 'won' || game.status === 'lost';
}
/** Coins the player may spend: a caprice can lock part of the purse in the bank. */
function spendableGold(game: Game): number {
  return game.gold - game.caprice.reserve;
}
/** The wave being fought or, in the camp, the wave being prepared. */
function facedWave(game: Game): number {
  return game.wave + (game.status === 'preparing' ? 1 : 0);
}
/**
 * La partie : son état et les commandes du joueur. Les règles de chaque pas de simulation
 * sont dans `src/engine/` et s'exécutent dans l'ordre fixé par `step`. Cet ordre et les
 * tirages de `nextRandom` décident de la partie : les changer casse les anciens codes.
 */
export class Game {
  gold = START_GOLD;
  base = CRYSTAL_MAX;
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
  message = TEXT.choisisUnAllie;
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
  missionMinBase = CRYSTAL_MAX;
  /** Sortes d'alliés recrutées pendant une mission à caprice « copains ». */
  readonly #capriceKinds = new Set<Kind>();
  get caprice(): CapriceRules {
    return capriceRules(this.mission);
  }
  readonly #balanceRevision: BalanceRevision;
  get balanceRevision(): BalanceRevision {
    return this.#balanceRevision;
  }
  /**
   * The eggs of a wave that drags on, or null in a game that has none. Private with its two
   * counters: a camp is saved between waves, so nothing of them is ever written, and the
   * fingerprints of older games do not see them.
   */
  readonly #lateEggs: LateEggRule | null;
  #waveSeconds = 0;
  #lateEggsLaid = 0;
  get lateEggs(): LateEggRule | null {
    return this.#lateEggs;
  }
  /** How many eggs the current wave has received for lasting; the board announces each one. */
  get lateEggsLaid(): number {
    return this.#lateEggsLaid;
  }
  /** Stage of a voyage this game plays; null for every other game. Never saved in a camp. */
  readonly #stage: StageRules | null;
  get stage(): StageRules | null {
    return this.#stage;
  }
  /** Rules of the endless adventure, or null for every other game. */
  readonly #endless: EndlessRules | null;
  get endless(): EndlessRules | null {
    return this.#endless;
  }
  /**
   * Kings beaten in the endless adventure: the rounds already played. Zero elsewhere. Private
   * behind accessors, so that it is not part of the state other games are fingerprinted by.
   */
  #kings = 0;
  /** The lasting gifts of the endless adventure, and the camps whose card is answered. */
  #boons: Boons = [];
  readonly #answered = new Set<string>();
  get kings(): number {
    return this.#kings;
  }
  set kings(count: number) {
    if (!this.#endless && count !== 0) throw new RangeError(TEXT.revisionInvalide);
    this.#kings = count;
  }
  constructor(
    seed = DEFAULT_SEED,
    tuning?: Partial<BalanceTuning>,
    mission?: MissionRun,
    balance?: BalanceRevision,
    stage?: StageRules,
    endless?: EndlessRules,
  ) {
    this.mission = mission === undefined ? null : readMissionRun(mission);
    if (mission !== undefined && !this.mission) throw new RangeError(TEXT.expeditionInvalide);
    this.#stage = stage === undefined ? null : readStageRules(stage);
    // A stage is an expedition of the second balance revision, nothing older.
    if (stage !== undefined && (!this.#stage || this.mission?.balance !== 2))
      throw new RangeError(TEXT.expeditionInvalide);
    const revision = this.mission?.balance ?? 1;
    // An expedition names its own revision; the third one only exists in the great adventure.
    if (
      (balance !== undefined && !isBalanceRevision(balance)) ||
      (this.mission && balance !== undefined && balance !== revision)
    )
      throw new RangeError(TEXT.revisionInvalide);
    this.#balanceRevision = balance ?? revision;
    this.#lateEggs = this.mission ? null : lateEggRule(this.#balanceRevision);
    // The endless adventure is the great adventure of its own revision, played on.
    this.#endless = endless === undefined ? null : readEndlessRules(endless);
    if (
      endless !== undefined &&
      (!this.#endless || this.mission || this.#balanceRevision !== this.#endless.balance)
    )
      throw new RangeError(TEXT.revisionInvalide);
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
    if (this.#stage) openStage(this, this.#stage);
    addAlly(this, 'club', 756, 180);
    addAlly(this, 'club', 756, 468);
    addAlly(this, 'hero', 828, 324);
  }
  get totalWaves() {
    return this.mission ? missionById(this.mission.missionId)!.waves.length : TOTAL_WAVES;
  }
  /** One-based number of the wave being played, or of the next one while preparing. */
  private get localWave() {
    return Math.max(1, Math.min(this.totalWaves, facedWave(this)));
  }
  get difficultyWave() {
    const local = this.localWave;
    return this.mission ? missionById(this.mission.missionId)!.waves[local - 1] : local;
  }
  get briefing() {
    return this.mission
      ? missionWave(this.mission, this.localWave).pattern
      : waveBriefing(this.difficultyWave);
  }
  get enemyLanes(): readonly number[] {
    return activeEnemyLanes(this.mission, this.localWave);
  }
  get missionStars(): number {
    return this.mission && this.status === 'won' ? chapterStars(this.missionMinBase) : 0;
  }
  get level() {
    if (this.mission) return missionLevel(this.mission.layout);
    return levelForWave(facedWave(this));
  }
  /** Used at chapter boundaries and when restoring an older camp. Keeps live identities. */
  normalizeCamp() {
    normalizeCampRule(this);
  }
  get rewardOffer(): RewardId[] {
    return this.rewards.pending === null || this.#endless
      ? []
      : rewardOffer(this.rewards.seed, this.rewards.pending, this.kings);
  }
  /** The three gifts of the endless adventure offered now; empty in every other game. */
  get boonOffer(): BoonId[] {
    return this.rewards.pending === null || !this.#endless
      ? []
      : boonOffer(this.rewards.seed, this.kings, this.rewards.pending, this.#boons, this.boonRules);
  }
  /** The lasting gifts of the endless adventure, with their level; empty elsewhere. */
  get boons(): Readonly<Boons> {
    return this.#boons;
  }
  /** The gift table of this endless adventure; version 1's for every other game. */
  get boonRules(): BoonRules {
    return BOON_RULES[this.#endless?.version ?? 1];
  }
  /** What a lasting gift gives now: its level times its step. Zero when not taken. */
  boonGain(id: LastingBoon): number {
    return this.boonLevel(id) * this.boonRules.steps[id];
  }
  /** Level of a lasting gift: zero when it is not taken, and in every other game. */
  boonLevel(id: LastingBoon): number {
    return boonLevel(this.#boons, id);
  }
  /**
   * Puts back the gifts of a saved endless camp, once its wave, kings and pending offer are
   * back, and rebuilds which camps were answered: every camp of the earlier rounds, and of
   * this one up to the wave, but the one still pending. False on any doubt.
   */
  restoreEndless(raw: unknown): boolean {
    const boons = readBoons(raw, this.boonRules);
    if (!this.#endless || !boons) return false;
    const answered = new Set<string>();
    for (let round = 0; round <= this.kings; round++)
      for (const milestone of [...REWARD_WAVES, TOTAL_WAVES]) {
        const reached =
          milestone === TOTAL_WAVES ? round > 0 : round < this.kings || milestone <= this.wave;
        const key = `${round}:${milestone}`;
        if (reached && key !== `${this.kings}:${this.rewards.pending}`) answered.add(key);
      }
    // One level a gift, one gift an answered camp: more levels were never offered.
    if (boons.reduce((sum, b) => sum + b.level, 0) > answered.size) return false;
    this.#boons = boons;
    this.#answered.clear();
    for (const key of answered) this.#answered.add(key);
    return true;
  }
  /**
   * Whether taking this gift first asks which gift gives its place: a new lasting gift of the
   * endless adventure while the five places are taken.
   */
  boonNeedsPlace(id: string): boolean {
    return (
      !!this.#endless &&
      isLastingBoon(id) &&
      !this.boonLevel(id) &&
      this.#boons.length >= this.boonRules.places
    );
  }
  /** Whether the card of this camp was already answered, in this round. */
  offerAnswered(milestone: Milestone): boolean {
    if (this.#endless) return this.#answered.has(`${this.kings}:${milestone}`);
    return this.rewards.choices.some((c) => c.milestone === milestone);
  }
  get feastDuration() {
    return FEAST_DURATION + extraHoneySeconds(this.rewards) + this.boonGain('miel');
  }
  trainHero(path: 'force' | 'guard'): boolean {
    if (
      this.paused ||
      this.status !== 'preparing' ||
      (this.mission ? missionById(this.mission.missionId)!.unlockRank < 4 : this.wave < 4) ||
      spendableGold(this) < HERO_TRAINING_COST ||
      this.campaign.training !== 'none' ||
      (path !== 'force' && path !== 'guard') ||
      !this.units.some((u) => u.kind === 'hero' && u.hp > 0)
    )
      return false;
    this.gold -= HERO_TRAINING_COST;
    this.campaign.training = path;
    this.message = path === 'force' ? TEXT.leHerosEntraineSaForce : TEXT.leHerosEntraineSaGarde;
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
    this.encouragementRemaining = ENCOURAGEMENT_SECONDS;
    this.message = TEXT.courageLesAlliesFrappentPlusVite;
    return true;
  }
  recruitCost(kind: Kind) {
    if (freeRecruit(this.rewards, kind)) return 0;
    const price = balanceRecruitPrice(kind, this.balanceRevision);
    const market = this.boonLevel('marche');
    return market ? Math.round(price * (1 - this.boonGain('marche'))) : price;
  }
  /**
   * Takes the card or gift `id` among those offered. In the endless adventure, `replace`
   * names the lasting gift a new one takes the place of when the five places are full.
   */
  chooseReward(id: string, replace?: string): boolean {
    if (this.#endless) return this.#chooseBoon(id, replace);
    const milestone = this.rewards.pending;
    if (
      this.paused ||
      this.status !== 'preparing' ||
      milestone === null ||
      !this.rewardOffer.includes(id as RewardId)
    )
      return false;
    const key = id as RewardId;
    this.rewards.choices.push({ milestone, id: key, used: !REWARDS[key].kind, ...this.#round() });
    this.rewards.pending = null;
    if (key === 'pieces') this.gold = Math.min(GOLD_LIMIT, this.gold + REWARD_COINS);
    if (key === 'cristal') this.rewards.ward += CRYSTAL_WARD;
    this.message = REWARDS[key].title + ' ! ' + REWARDS[key].detail;
    return true;
  }
  #chooseBoon(id: string, replace?: string): boolean {
    const milestone = this.rewards.pending;
    if (
      this.paused ||
      this.status !== 'preparing' ||
      milestone === null ||
      !this.boonOffer.includes(id as BoonId)
    )
      return false;
    if (isLastingBoon(id)) {
      const taken = takeBoon(this.#boons, id, isLastingBoon(replace) ? replace : undefined);
      if (!taken) return false;
      const armour = (level: number) => 1 + this.boonRules.steps.armure * level;
      const before = armour(this.boonLevel('armure'));
      this.#boons = taken;
      const after = armour(this.boonLevel('armure'));
      // The armour takes the allies already in the camp, wounds kept in proportion.
      if (after !== before)
        for (const u of this.units) {
          // Written as a save reads it back: the kind's life times the armour.
          u.maxHp = kinds[u.kind as Kind].hp * after;
          u.hp = Math.min(u.maxHp, (u.hp * after) / before);
        }
    } else {
      const card = id as RewardId;
      this.rewards.choices.push({
        milestone,
        id: card,
        used: !REWARDS[card].kind,
        ...this.#round(),
      });
      if (card === 'pieces') this.gold = Math.min(GOLD_LIMIT, this.gold + REWARD_COINS);
      if (card === 'cristal') this.rewards.ward += CRYSTAL_WARD;
    }
    this.#answered.add(`${this.kings}:${milestone}`);
    this.rewards.pending = null;
    return true;
  }
  /** The round a choice belongs to: only the endless adventure has more than one. */
  #round(): { round?: number } {
    return this.kings > 0 ? { round: this.kings } : {};
  }
  skipReward(): boolean {
    const milestone = this.rewards.pending;
    if (this.paused || this.status !== 'preparing' || milestone === null) return false;
    if (this.#endless) {
      this.#answered.add(`${this.kings}:${milestone}`);
      this.rewards.pending = null;
      return true;
    }
    this.rewards.choices.push({ milestone, id: 'skip', used: true, ...this.#round() });
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
        ? TEXT.leMielColleAuxEcaillesLesSerpents
        : TEXT.leGouterEstServiLesSerpents;
    return true;
  }
  /** False for an ally of a later revision: this game has never heard of it. */
  knowsAlly(kind: Kind): boolean {
    return Object.hasOwn(kinds, kind) && allyExists(kind, this.balanceRevision);
  }
  isUnlocked(kind: Kind) {
    return (
      typeof kind === 'string' &&
      this.knowsAlly(kind) &&
      this.#unlockedUpTo() >= (unlockWave[kind] ?? 1)
    );
  }
  /**
   * How far the allies are open: the rank of a mission, the wave faced in the great adventure.
   * In the endless adventure, an ally once open stays open: after a king, every one is.
   */
  #unlockedUpTo(): number {
    if (this.mission) return missionById(this.mission.missionId)!.unlockRank;
    return this.kings > 0 ? TOTAL_WAVES : facedWave(this);
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
      !isOver(this) &&
      kind !== 'hero' &&
      this.isUnlocked(kind) &&
      spendableGold(this) >= this.recruitCost(kind) &&
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
    this.message = fill(TEXT.nRejointLeCamp, kinds[kind].name);
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
    if (!this.mission && (this.wave - 1) % WAVES_PER_CHAPTER === 0)
      this.campaign.chapterMin[chapterIndex(this.wave)] = this.base;
    const plan = this.mission ? missionWave(this.mission, this.wave) : null;
    this.remaining = (plan?.stats ?? waveStats(this.wave)).count;
    this.spawnTimer = 0;
    this.#waveSeconds = 0;
    this.#lateEggsLaid = 0;
    this.status = 'fighting';
    this.feast = null;
    this.feastUsed = false;
    this.encouragementUsed = false;
    this.encouragementRemaining = 0;
    this.honeyTurns = 0;
    this.eggs = layWaveEggs(this, plan);
    this.message =
      !this.mission && this.wave === TOTAL_WAVES
        ? this.#endless
          ? TEXT.kingSnakeRevient
          : TEXT.laDerniereVagueKingSnakeApproche
        : fill(
            TEXT.vagueNDefendsLeCamp,
            this.#endless ? endlessWave(this.kings, this.wave) : this.wave,
          );
    return true;
  }
  repair() {
    if (this.mission) this.missionMinBase = Math.min(this.missionMinBase, this.base);
    if (
      this.paused ||
      isOver(this) ||
      spendableGold(this) < REPAIR_COST ||
      this.base >= CRYSTAL_MAX
    )
      return false;
    this.gold -= REPAIR_COST;
    this.base = Math.min(CRYSTAL_MAX, this.base + REPAIR_AMOUNT);
    return true;
  }
  /** A wave that lasts brings one more egg, then another, up to the rule's limit. */
  #layLateEggs(dt: number) {
    const rule = this.#lateEggs;
    if (!rule || this.status !== 'fighting') return;
    this.#waveSeconds += dt;
    if (
      this.#lateEggsLaid >= rule.most ||
      this.#waveSeconds < rule.after + this.#lateEggsLaid * rule.every
    )
      return;
    this.eggs.push(layLateEgg(this, rule, this.#lateEggsLaid++));
    this.message = TEXT.laVagueDureUnNouvelOeufEstApparu;
  }
  step(dt: number) {
    if (this.paused || isOver(this) || !Number.isFinite(dt) || dt <= 0) return;
    dt = Math.min(MAX_STEP, dt);
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
    this.#layLateEggs(dt);
    tickBosses(this, dt);
    updateConfusion(this, dt);
    updateAllies(this, dt);
    const rankStats = endlessStats(
      waveStats(this.mission ? this.difficultyWave : this.wave || 1),
      this.#endless,
      this.kings,
    );
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
