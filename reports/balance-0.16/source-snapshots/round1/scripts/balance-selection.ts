export type ConfigurationSummary = {
  id: string;
  games: number;
  winRate: number;
  earlyLosses: number;
  timeouts: number;
  errors: number;
  medianBossSeconds: number | null;
  meanShieldsBroken: number | null;
  meanShotsFired: number | null;
  profiles: { profile: string; winRate: number }[];
  newEarlyLosses?: number;
};
const organized = ['mixed', 'melee', 'ranged', 'heavy', 'dinosaurs', 'mutants'];
const avg = (a: number[]) => a.reduce((s, n) => s + n, 0) / a.length;
/** Predeclared training score; final holdout data must never select a setting. */
export function rankCandidates(configs: ConfigurationSummary[]) {
  const baseline = configs.find((c) => c.id === 'baseline');
  if (!baseline) throw Error('Canonical baseline required');
  return configs
    .filter((c) => c.id !== 'baseline')
    .map((c) => {
      const rates = organized.map((p) => c.profiles.find((r) => r.profile === p)!.winRate);
      const ranged = c.profiles.find((p) => p.profile === 'ranged')!.winRate;
      const peerRate = avg(
        c.profiles
          .filter((p) => organized.includes(p.profile) && p.profile !== 'ranged')
          .map((p) => p.winRate),
      );
      const newEarly =
        c.newEarlyLosses !== undefined
          ? c.newEarlyLosses / c.games
          : Math.max(0, c.earlyLosses / c.games - baseline.earlyLosses / baseline.games);
      const casual = c.profiles.find((p) => p.profile === 'casual')?.winRate ?? 0;
      const baselineCasual = baseline.profiles.find((p) => p.profile === 'casual')?.winRate ?? 0;
      const regressions = avg(
        organized.map((p) =>
          Math.max(
            0,
            baseline.profiles.find((r) => r.profile === p)!.winRate -
              c.profiles.find((r) => r.profile === p)!.winRate -
              0.15,
          ),
        ),
      );
      const duration = c.medianBossSeconds;
      const parts = {
        familyTarget: Math.abs(c.winRate - 0.75) * 100,
        strategySpread: (Math.max(...rates) - Math.min(...rates)) * 40,
        rangedExcess: Math.max(0, ranged - peerRate - 0.1) * 80,
        earlyRegression: newEarly * 200,
        profileRegression: regressions * 90,
        casualRegression: Math.max(0, baselineCasual - casual - 0.15) * 120,
        duration:
          duration === null
            ? 30
            : duration < 15
              ? (15 - duration) / 2
              : duration > 60
                ? (duration - 60) / 5
                : 0,
        absentMechanics:
          Math.max(0, 1 - (c.meanShieldsBroken ?? 0)) * 2 +
          Math.max(0, 1 - (c.meanShotsFired ?? 0)) * 3,
      };
      const eligible =
        c.timeouts === 0 && c.errors === 0 && c.winRate >= 0.5 && newEarly <= 0.1 && casual >= 0.25;
      return {
        id: c.id,
        eligible,
        score: Object.values(parts).reduce((s, n) => s + n, 0) + (eligible ? 0 : 1e6),
        parts,
        winRate: c.winRate,
        medianBossSeconds: duration,
        rangedPeerGap: ranged - peerRate,
      };
    })
    .sort((a, b) => a.score - b.score || a.id.localeCompare(b.id));
}
