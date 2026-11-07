import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { runJobs as beforeJobs } from '../reports/balance-0.19/source-snapshots/candidate-0.19/scripts/balance-lab.mjs';
import { runJobs as afterJobs } from './balance-lab.mjs';
import { PROFILES, replayMetrics, hashValue } from './balance-lab/core.ts';
const root = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const out = root + '/reports/control-0.20';
await mkdir(out, { recursive: true });
const manifest = JSON.parse(
  await readFile(root + '/reports/balance-0.19/validation/manifest.json', 'utf8'),
);
const checks = await Promise.all(
  manifest.sourceFiles.map(async (x) => ({
    path: x.path,
    same:
      createHash('sha256')
        .update(await readFile(root + '/' + x.path))
        .digest('hex') === x.sha256,
    sha256: x.sha256,
  })),
);
if (checks.some((x) => !x.same)) throw Error('Combat changed');
const seeds = Array.from(
  { length: 4 },
  (_, i) => (0x16002026 + Math.imul(121 + i, 2654435761)) >>> 0,
);
const config = JSON.parse(await readFile(root + '/reports/balance-0.19/control.json', 'utf8'))[0];
const jobs = seeds.flatMap((seed) => PROFILES.map((profile) => ({ ...config, seed, profile })));
const before = await beforeJobs(jobs, { workers: 3 });
const after = await afterJobs(jobs, { workers: 3 });
const pairs = after.map((r, i) => ({
  seed: r.seed,
  profile: r.profile,
  status: r.status,
  equal: hashValue(replayMetrics(r)) === hashValue(replayMetrics(before[i])),
}));
if (
  pairs.some((x) => !x.equal) ||
  [...before, ...after].some((x) => ['error', 'timeout'].includes(x.status))
)
  throw Error('Control mismatch');
const result = {
  version: '0.20.0',
  sourceUnchanged: true,
  sourceFiles: checks,
  seeds,
  comparisons: 32,
  executions: 64,
  allEqual: true,
  errors: 0,
  timeouts: 0,
  profiles: PROFILES,
  pairs,
  before,
  after,
};
await writeFile(out + '/evidence.json', JSON.stringify(result, null, 2) + '\n');
console.log(
  JSON.stringify({ comparisons: 32, executions: 64, allEqual: true, seeds, sourceUnchanged: true }),
);
