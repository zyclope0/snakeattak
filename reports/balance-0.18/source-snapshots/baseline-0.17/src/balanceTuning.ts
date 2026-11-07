/** Immutable, per-campaign balance. No adaptation during play. */
export type BalanceTuning = {
  bossEnabled: boolean;
  bossHpMultiplier: number;
  bossShieldFraction: number;
  bossShieldRangedFactor: number;
  bossShieldMeleeFactor: number;
  bossShotDamage: number;
  bossShotInterval: number;
  bossShotWindup: number;
  bossShotRadius: number;
  bossShotRange: number;
  splashSecondaryFactor: number;
  mutantDamageFactor: number;
};
export const DEFAULT_BALANCE: Readonly<BalanceTuning> = Object.freeze({
  bossEnabled: true,
  bossHpMultiplier: 6.5,
  bossShieldFraction: 0.12,
  bossShieldRangedFactor: 0.45,
  bossShieldMeleeFactor: 1.6,
  bossShotDamage: 18,
  bossShotInterval: 7,
  bossShotWindup: 1.8,
  bossShotRadius: 38,
  bossShotRange: 260,
  splashSecondaryFactor: 1,
  mutantDamageFactor: 1.75,
});
export const LEGACY_BALANCE: Readonly<BalanceTuning> = Object.freeze({
  ...DEFAULT_BALANCE,
  bossEnabled: false,
  bossHpMultiplier: 6,
  bossShieldFraction: 0,
  bossShotDamage: 0,
  splashSecondaryFactor: 1,
  mutantDamageFactor: 1,
});
const limits = {
  bossHpMultiplier: [6, 10],
  bossShieldFraction: [0, 0.35],
  bossShieldRangedFactor: [0.2, 1],
  bossShieldMeleeFactor: [1, 2],
  bossShotDamage: [0, 50],
  bossShotInterval: [3, 8],
  bossShotWindup: [0.8, 2.5],
  bossShotRadius: [24, 70],
  bossShotRange: [180, 300],
  splashSecondaryFactor: [0.25, 1],
  mutantDamageFactor: [1, 2],
} as const;
export function makeBalanceTuning(overrides: Partial<BalanceTuning> = {}): Readonly<BalanceTuning> {
  const result = { ...DEFAULT_BALANCE };
  for (const key of Object.keys(DEFAULT_BALANCE) as (keyof BalanceTuning)[]) {
    if (!Object.hasOwn(overrides, key)) continue;
    const value = overrides[key];
    if (key === 'bossEnabled') {
      if (typeof value !== 'boolean') throw new TypeError('bossEnabled must be boolean');
      result.bossEnabled = value;
    } else {
      const [min, max] = limits[key];
      if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
        throw new RangeError(`${key} must be finite in [${min}, ${max}]`);
      result[key] = value;
    }
  }
  return Object.freeze(result);
}
