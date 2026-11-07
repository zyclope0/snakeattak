import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Game as CurrentGame } from '../src/game.ts';
import { encodeCheckpoint as currentCheckpoint } from '../src/checkpoints.ts';
import { Game as BaselineGame } from '../reports/missions-0.21/baseline-0.20/src/game.ts';
import { encodeCheckpoint as baselineCheckpoint } from '../reports/missions-0.21/baseline-0.20/src/checkpoints.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = resolve(ROOT, 'reports/missions-0.21/baseline-0.20');
const OUT = resolve(ROOT, 'reports/missions-0.21/classic-control.json');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
function manifest(root) {
  const seen = new Set();
  function visit(path) {
    path = resolve(path);
    if (seen.has(path)) return;
    seen.add(path);
    const source = readFileSync(path, 'utf8');
    for (const match of source.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+\.ts)['"]/g))
      visit(resolve(dirname(path), match[1]));
  }
  visit(resolve(root, 'src/game.ts'));
  visit(resolve(root, 'src/checkpoints.ts'));
  return [...seen]
    .sort()
    .map((path) => ({ path: relative(root, path), sha256: sha(readFileSync(path)) }));
}
function state(game) {
  // All other enumerable simulation fields remain compared, including RNG and paths.
  const { mission, missionMinBase, ...classic } = game;
  return JSON.stringify(classic);
}
const baselineSources = manifest(BASELINE);
const currentSources = manifest(ROOT);
const scenarios = [];
let snapshots = 0;
let checkpoints = 0;
for (const seed of [42, 2026, 98765])
  for (const preparationWave of [0, 3, 7, 11]) {
    const current = new CurrentGame(seed);
    const baseline = new BaselineGame(seed);
    // Identical prepared-camp fixtures exercise four classic wave ranks across three maps,
    // including the final king. No reference hash is regenerated or replaced.
    for (const game of [current, baseline]) {
      game.wave = preparationWave;
      game.gold = 5000;
      assert.equal(game.recruit('medic', 900, 300), true);
      assert.equal(game.recruit('ninja', 660, 180), true);
      assert.equal(game.recruit('archer', 852, 468), true);
    }
    const encoded = currentCheckpoint(current);
    assert.ok(encoded);
    assert.equal(encoded, baselineCheckpoint(baseline));
    checkpoints++;
    assert.equal(state(current), state(baseline));
    for (const game of [current, baseline]) {
      game.rewards.pending = null;
      assert.equal(game.startWave(), true);
    }
    const digest = createHash('sha256');
    for (let tick = 0; tick < 1800; tick++) {
      if (tick === 180) {
        assert.equal(current.encourage(), baseline.encourage());
      }
      if (tick === 240) {
        assert.equal(current.offerFeast(1, 'sticky'), baseline.offerFeast(1, 'sticky'));
      }
      current.step(1 / 30);
      baseline.step(1 / 30);
      const serialized = state(current);
      assert.equal(
        serialized,
        state(baseline),
        `Classic divergence: seed ${seed}, wave ${preparationWave + 1}, tick ${tick}`,
      );
      digest.update(serialized);
      digest.update('\n');
      snapshots++;
    }
    scenarios.push({
      seed,
      firstWave: preparationWave + 1,
      ticks: 1800,
      simulatedSeconds: 60,
      identicalSnapshots: 1800,
      checkpointSha256: sha(encoded),
      snapshotsSha256: digest.digest('hex'),
      finalStatus: current.status,
      finalWave: current.wave,
    });
  }
assert.equal(snapshots, 21600);
assert.equal(checkpoints, 12);
assert.deepEqual(manifest(BASELINE), baselineSources, 'Baseline sources changed during control');
assert.deepEqual(manifest(ROOT), currentSources, 'Current sources changed during control');
const report = {
  version: 1,
  command: 'node --experimental-strip-types scripts/control-classic-021.mjs',
  baseline: '0.20.0 archived source, 19 game-engine modules plus checkpoint encoder dependency',
  comparedSnapshots: snapshots,
  comparedCheckpoints: checkpoints,
  result: 'identical',
  excludedFields: ['mission', 'missionMinBase'],
  method:
    'Three seeds × four prepared-camp fixtures (waves 1,4,8,12) ×1800 fixed-step ticks. Compare every enumerable classic field after each real Game.step and compare prepared v4 checkpoint bytes. The only omitted fields are the two new expedition metadata fields. Existing boss reference hashes are unchanged.',
  limitations:
    'Controlled combat snapshots from four prepared fixtures, not a full twelve-wave replay or exhaustive seed proof.',
  baselineSourceHash: sha(JSON.stringify(baselineSources)),
  currentSourceHash: sha(JSON.stringify(currentSources)),
  baselineSources,
  currentSources,
  scenarios,
};
writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
console.log(
  JSON.stringify({
    comparedSnapshots: snapshots,
    comparedCheckpoints: checkpoints,
    result: report.result,
    out: relative(ROOT, OUT),
  }),
);
