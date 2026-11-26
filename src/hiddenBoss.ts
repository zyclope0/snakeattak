import { Game, MAX_STEP, battleOver } from './game.ts';
import { NO_CAPRICE } from './caprices.ts';
import type { CapriceRules } from './caprices.ts';
import { LANE_IDS } from './ai.ts';
import { waveStats } from './data.ts';
import type { Kind } from './data.ts';
import { levelForWave } from './levels.ts';
import type { Level } from './levels.ts';
import { DEFAULT_SEED } from './gameConstants.ts';
import { isBalanceRevision } from './balanceRevision.ts';
import { CURRENT_HIDDEN_BOSS_VERSION, hiddenBossTuning } from './hiddenBossTuning.ts';
import type { HiddenBossTuning, HiddenBossVersion } from './hiddenBossTuning.ts';
import { chainTurn, layChain } from './engine/bossChain.ts';
import type { BossChain } from './engine/bossChain.ts';
import { updateConfusion } from './engine/enemyTurn.ts';
import { separateAllies, updateAllies } from './engine/allies.ts';
import { resolveWave } from './engine/outcome.ts';
import * as TEXT from './texts/fr/hiddenBoss.ts';
import { fill } from './texts/fill.ts';

/**
 * Le combat du boss caché (lot 2, 26 novembre 2026) : un combat à part, qu'aucun écran du jeu
 * n'ouvre encore. Une préparation comme celle d'une mission, avec sa bourse et la boutique de
 * toujours, puis une seule vague : le boss sort de son antre (`engine/bossChain.ts`).
 *
 * C'est une partie (`Game`) d'une autre sorte : ses règles à elle sont ici, et les parties de
 * la grande aventure, des missions, des expéditions et de l'aventure sans fin n'en savent rien.
 * Aucune n'a un champ de plus, aucune ne passe par ce module.
 */

/** The snakes read the defence as cleverly as in a late wave: the boss takes the weak lane. */
const CLEVER: CapriceRules = Object.freeze({ ...NO_CAPRICE, smart: true });
/** The single wave of the battle pays nothing when it ends: the battle ends itself. */
const NO_WAVE_REWARD = Object.freeze({ ...waveStats(1), reward: 0 });

/** What the battle is played by, and what its boss does. */
export type HiddenBossState = {
  /** The version of the numbers, or null for a trial tuning of the laboratory. */
  readonly version: HiddenBossVersion | null;
  readonly tuning: HiddenBossTuning;
  /** Null while the camp prepares: the boss is still in its den. */
  chain: BossChain | null;
};

/** Numbers the laboratory may try: every number a version has, each finite and not negative. */
function readTrial(trial: HiddenBossTuning): HiddenBossTuning {
  for (const name of Object.keys(hiddenBossTuning(CURRENT_HIDDEN_BOSS_VERSION))) {
    const value: unknown = trial[name as keyof HiddenBossTuning];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0)
      throw new RangeError(fill(TEXT.reglageInvalideN, name));
  }
  if (!isBalanceRevision(trial.balance))
    throw new RangeError(fill(TEXT.reglageInvalideN, 'balance'));
  if (!Number.isInteger(trial.terrainWave) || trial.terrainWave < 1)
    throw new RangeError(fill(TEXT.reglageInvalideN, 'terrainWave'));
  if (!Number.isInteger(trial.startRings) || trial.startRings < 1)
    throw new RangeError(fill(TEXT.reglageInvalideN, 'startRings'));
  if (!Number.isInteger(trial.maxRings) || trial.maxRings < trial.startRings)
    throw new RangeError(fill(TEXT.reglageInvalideN, 'maxRings'));
  return Object.freeze({ ...trial });
}

export class HiddenBossGame extends Game {
  readonly hiddenBoss: HiddenBossState;
  /**
   * `version`: the numbers of `HIDDEN_BOSS_VERSIONS` this battle is played by. `trial`: other
   * numbers, for the laboratory and the tests only; such a battle has no version.
   */
  constructor(
    seed = DEFAULT_SEED,
    version: HiddenBossVersion = CURRENT_HIDDEN_BOSS_VERSION,
    trial?: HiddenBossTuning,
  ) {
    const tuning = trial ? readTrial(trial) : hiddenBossTuning(version);
    super(seed, undefined, undefined, tuning.balance);
    this.hiddenBoss = { version: trial ? null : version, tuning, chain: null };
    this.gold = tuning.startGold;
  }
  override get totalWaves() {
    return 1;
  }
  override get level(): Level {
    return levelForWave(this.hiddenBoss.tuning.terrainWave);
  }
  override get enemyLanes(): readonly number[] {
    return LANE_IDS;
  }
  override get caprice(): CapriceRules {
    return CLEVER;
  }
  /** Every ally its balance revision knows is in the shop: the boss comes after the adventure. */
  override isUnlocked(kind: Kind) {
    return typeof kind === 'string' && this.knowsAlly(kind);
  }
  override startWave() {
    if (this.paused || this.status !== 'preparing' || this.wave >= this.totalWaves) return false;
    this.normalizeCamp();
    this.wave = 1;
    this.remaining = 0;
    this.spawnTimer = 0;
    this.status = 'fighting';
    this.feast = null;
    this.feastUsed = false;
    this.encouragementUsed = false;
    this.encouragementRemaining = 0;
    this.honeyTurns = 0;
    this.eggs = [];
    this.hiddenBoss.chain = layChain(this, this.hiddenBoss.tuning);
    this.message = fill(TEXT.nSortDeSonAntre, TEXT.leBossCache);
    return true;
  }
  /**
   * Un pas : miel, alliés, boss, chute des alliés, séparation, fin. Ni œuf, ni roi, ni vague
   * qui entre : le boss est le seul serpent. Les tirages de `nextRandom` ne viennent que du
   * choix de voie de la tête.
   */
  override step(dt: number) {
    if (this.paused || battleOver(this) || !Number.isFinite(dt) || dt <= 0) return;
    dt = Math.min(MAX_STEP, dt);
    this.time += dt;
    if (this.feast) {
      this.feast.remaining -= dt;
      if (this.feast.remaining <= 1e-9) this.feast = null;
    }
    this.effects = this.effects.filter((e) => (e.life -= dt) > 0);
    this.units = this.units.filter((u) => u.hp > 0);
    updateConfusion(this, dt);
    updateAllies(this, dt);
    const { chain, tuning } = this.hiddenBoss;
    if (chain && this.status === 'fighting') chainTurn(this, chain, tuning, dt);
    this.units = this.units.filter((u) => u.hp > 0);
    separateAllies(this, dt);
    resolveWave(this, dt, NO_WAVE_REWARD);
  }
}
