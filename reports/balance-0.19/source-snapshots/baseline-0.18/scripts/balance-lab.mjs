import { Worker } from 'node:worker_threads';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { kinds, unlockWave, waveStats, TOTAL_WAVES } from '../src/data.ts';
import {
  failedCampaign,
  cohortSeeds,
  runCampaign,
  summarize,
  PROFILES,
  METHOD,
  hashValue,
  replayMetrics,
} from './balance-lab/core.ts';
export { cohortSeeds, runCampaign, summarize, replayMetrics } from './balance-lab/core.ts';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sha = (content) => createHash('sha256').update(content).digest('hex');
async function manifest() {
  const files = new Set();
  async function visit(path) {
    path = resolve(path);
    if (files.has(path)) return;
    files.add(path);
    const source = await readFile(path, 'utf8');
    for (const match of source.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+\.ts)['"]/g))
      await visit(resolve(dirname(path), match[1]));
  }
  await visit(resolve(root, 'src/game.ts'));
  await visit(resolve(root, 'src/data.ts'));
  const sourceFiles = await Promise.all(
    [...files]
      .sort()
      .map(async (path) => ({ path: relative(root, path), sha256: sha(await readFile(path)) })),
  );
  const scriptPaths = [
    resolve(root, 'scripts/balance-lab.mjs'),
    ...(await readdir(resolve(root, 'scripts/balance-lab')))
      .filter((name) => /\.(?:ts|mjs)$/.test(name))
      .sort()
      .map((name) => resolve(root, 'scripts/balance-lab', name)),
  ];
  const scriptFiles = await Promise.all(
    scriptPaths.map(async (path) => ({
      path: relative(root, path),
      sha256: sha(await readFile(path)),
    })),
  );
  return {
    sourceHash: hashValue(sourceFiles),
    scriptHash: hashValue(scriptFiles),
    sourceFiles,
    scriptFiles,
  };
}
export async function runJobs(jobs, { workers = 3, onResult = async () => {} } = {}) {
  if (!Number.isInteger(workers) || workers < 1 || workers > 3)
    throw new Error('workers must be an integer from 1 to 3');
  const queue = [...jobs],
    results = [];
  await Promise.all(
    Array.from({ length: Math.min(workers, jobs.length) }, async () => {
      let worker = new Worker(new URL('./balance-lab/worker.mjs', import.meta.url));
      try {
        while (queue.length) {
          const job = queue.shift();
          const result = await new Promise((resolveResult, reject) => {
            const done = (value) => {
              cleanup();
              resolveResult(value);
            };
            const failed = (error) => {
              cleanup();
              reject(error);
            };
            const exited = (code) => {
              cleanup();
              reject(
                new Error(
                  `Worker exited unexpectedly (${code}) for ${job.id}/${job.profile}/${job.seed}`,
                ),
              );
            };
            const cleanup = () => {
              worker.off('message', done);
              worker.off('error', failed);
              worker.off('exit', exited);
            };
            worker.once('message', done);
            worker.once('error', failed);
            worker.once('exit', exited);
            worker.postMessage(job);
          }).catch(async (error) => {
            await worker.terminate();
            worker = new Worker(new URL('./balance-lab/worker.mjs', import.meta.url));
            return failedCampaign(job, error);
          });
          results.push(result);
          await onResult(result, results.length, jobs.length);
        }
      } finally {
        await worker.terminate();
      }
    }),
  );
  return results.sort(
    (a, b) => a.id.localeCompare(b.id) || a.seed - b.seed || a.profile.localeCompare(b.profile),
  );
}
function argumentsMap(args) {
  const result = {};
  for (let index = 0; index < args.length; index++) {
    const key = args[index];
    if (!key.startsWith('--') || !args[index + 1] || args[index + 1].startsWith('--'))
      throw new Error(`Expected --option value, received ${key}`);
    result[key.slice(2)] = args[++index];
  }
  for (const key of Object.keys(result))
    if (!['stage', 'configs', 'out', 'workers', 'replay', 'seed-count', 'profiles'].includes(key))
      throw new Error(`Unknown option --${key}`);
  return result;
}
const USAGE =
  'Usage: node scripts/balance-lab.mjs --stage discovery|confirmation|discovery2|confirmation2|holdout|rewards017|campaign018|rhythm019|adventure019 --configs file.json --out reports/name --workers 3';
async function main() {
  if (process.argv.length === 3 && process.argv[2] === '--help') {
    console.log(USAGE);
    return;
  }
  const args = argumentsMap(process.argv.slice(2));
  const out = resolve(args.out ?? 'reports/balance-lab');
  await mkdir(out, { recursive: true });
  if (args.replay) {
    const saved = JSON.parse(await readFile(args.replay, 'utf8'));
    const result = runCampaign(saved.replay ?? saved);
    const equivalent = saved.replay
      ? hashValue(replayMetrics(result)) === hashValue(replayMetrics(saved))
      : null;
    await writeFile(
      resolve(out, 'replay.json'),
      JSON.stringify({ equivalent, result }, null, 2) + '\n',
    );
    console.log(
      JSON.stringify({ status: result.status, equivalent, output: resolve(out, 'replay.json') }),
    );
    if (equivalent === false || result.status === 'error') process.exitCode = 1;
    return;
  }
  if (!args.stage || !args.configs) throw new Error(USAGE);
  const stageSeeds = cohortSeeds(args.stage);
  const count = args['seed-count'] === undefined ? stageSeeds.length : Number(args['seed-count']);
  if (!Number.isInteger(count) || count < 1 || count > stageSeeds.length)
    throw new Error('Invalid --seed-count');
  const seeds = stageSeeds.slice(0, count);
  const profiles = args.profiles ? args.profiles.split(',') : [...PROFILES];
  if (
    !profiles.length ||
    new Set(profiles).size !== profiles.length ||
    profiles.some((profile) => !PROFILES.includes(profile))
  )
    throw new Error('Invalid --profiles');
  const configs = JSON.parse(await readFile(args.configs, 'utf8'));
  if (
    !Array.isArray(configs) ||
    !configs.length ||
    configs.some(
      (c) =>
        !c ||
        typeof c.id !== 'string' ||
        !c.id.length ||
        (c.tuning !== undefined &&
          (c.tuning === null || typeof c.tuning !== 'object' || Array.isArray(c.tuning))) ||
        (c.useDefault !== undefined && typeof c.useDefault !== 'boolean'),
    ) ||
    new Set(configs.map((c) => c.id)).size !== configs.length
  )
    throw new Error('Expected unique configurations [{id,tuning,useDefault?}]');
  const jobs = configs.flatMap((config) =>
    seeds.flatMap((seed) => profiles.map((profile) => ({ ...config, seed, profile }))),
  );
  const started = performance.now(),
    hashes = await manifest();
  const version = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8')).version;
  await mkdir(resolve(out, 'campaigns'), { recursive: true });
  const runManifest = {
    stage: args.stage,
    configs,
    seeds,
    profiles,
    version,
    nodeVersion: process.version,
    method: METHOD,
    catalog: kinds,
    unlockWave,
    waveStats: Array.from({ length: TOTAL_WAVES }, (_, index) => ({
      wave: index + 1,
      ...waveStats(index + 1),
    })),
    exploratorySubset: seeds.length !== stageSeeds.length || profiles.length !== PROFILES.length,
    workers: Number(args.workers ?? 3),
    ...hashes,
  };
  await writeFile(resolve(out, 'manifest.json'), JSON.stringify(runManifest, null, 2) + '\n');
  const games = await runJobs(jobs, {
    workers: runManifest.workers,
    onResult: async (result, completed, total) => {
      const filename = `${result.id.replace(/[^a-z0-9_-]/gi, '_')}-${result.profile}-${result.seed}-${hashValue(result.id).slice(0, 8)}.json`;
      await writeFile(resolve(out, 'campaigns', filename), JSON.stringify(result, null, 2) + '\n');
      if (
        completed % 8 === 0 ||
        completed === total ||
        result.status === 'error' ||
        result.status === 'timeout'
      )
        console.log(
          `${completed}/${total}: ${result.id}/${result.profile}/${result.seed} ${result.status} wave ${result.wave}; ${((performance.now() - started) / 1000).toFixed(1)} s`,
        );
    },
  });
  const finalHashes = await manifest();
  const sourceUnchanged =
    hashes.sourceHash === finalHashes.sourceHash && hashes.scriptHash === finalHashes.scriptHash;
  const summary = summarize(games);
  const report = {
    ...runManifest,
    sourceUnchanged,
    finalHashes: sourceUnchanged ? undefined : finalHashes,
    resultsHash: hashValue(games.map(replayMetrics)),
    wallSeconds: (performance.now() - started) / 1000,
    cpuSeconds: games.reduce((sum, game) => sum + game.performance.cpuSeconds, 0),
    summary,
    games,
  };
  await writeFile(resolve(out, 'balance-lab.json'), JSON.stringify(report, null, 2) + '\n');
  await writeFile(
    resolve(out, 'summary.json'),
    JSON.stringify(
      {
        ...runManifest,
        sourceUnchanged,
        resultsHash: report.resultsHash,
        wallSeconds: report.wallSeconds,
        cpuSeconds: report.cpuSeconds,
        ...summary,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    JSON.stringify(
      {
        output: out,
        games: games.length,
        resultsHash: report.resultsHash,
        sourceUnchanged,
        configs: summary.configs.map(
          ({ id, games, wins, losses, timeouts, errors, medianBossSeconds }) => ({
            id,
            games,
            wins,
            losses,
            timeouts,
            errors,
            medianBossSeconds,
          }),
        ),
      },
      null,
      2,
    ),
  );
  if (
    !sourceUnchanged ||
    games.some((game) => game.status === 'error' || game.status === 'timeout')
  )
    process.exitCode = 1;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
