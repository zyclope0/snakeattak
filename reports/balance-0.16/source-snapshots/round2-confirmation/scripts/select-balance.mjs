import { readFile, writeFile } from 'node:fs/promises';
import { rankCandidates } from './balance-selection.ts';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
const [summaryFile, out] = process.argv.slice(2);
if (!summaryFile || !out)
  throw Error('Usage: node scripts/select-balance.mjs summary.json output.json');
const summary = JSON.parse(await readFile(summaryFile, 'utf8'));
if (!summary.sourceUnchanged || summary.exploratorySubset)
  throw Error('Need a complete, unchanged-source training cohort');
if (summary.stage === 'holdout') throw Error('Holdout cannot select a configuration');
const raw = JSON.parse(await readFile(resolve(dirname(summaryFile), 'balance-lab.json'), 'utf8'));
const base = new Map(
  raw.games.filter((g) => g.id === 'baseline').map((g) => [`${g.seed}:${g.profile}`, g]),
);
const discordances = summary.configs.map((c) => ({
  id: c.id,
  newEarlyLosses: raw.games.filter(
    (g) =>
      g.id === c.id &&
      g.status === 'lost' &&
      g.wave < 12 &&
      base.has(`${g.seed}:${g.profile}`) &&
      !(
        base.get(`${g.seed}:${g.profile}`).status === 'lost' &&
        base.get(`${g.seed}:${g.profile}`).wave < 12
      ),
  ).length,
}));
const ranking = rankCandidates(
  summary.configs.map((c) => ({
    ...c,
    newEarlyLosses: discordances.find((d) => d.id === c.id).newEarlyLosses,
  })),
);
const scoreHash = createHash('sha256')
  .update(await readFile(new URL('./balance-selection.ts', import.meta.url)))
  .digest('hex');
await writeFile(
  out,
  JSON.stringify(
    { stage: summary.stage, resultsHash: summary.resultsHash, scoreHash, discordances, ranking },
    null,
    2,
  ) + '\n',
);
console.log(
  JSON.stringify(
    ranking.map(({ id, eligible, score, winRate, medianBossSeconds, rangedPeerGap }) => ({
      id,
      eligible,
      score,
      winRate,
      medianBossSeconds,
      rangedPeerGap,
    })),
    null,
    2,
  ),
);
