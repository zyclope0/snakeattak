import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'reports/balance-0.22');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const input = ['discovery/classic.json', 'discovery/missions.json', 'holdout/all.json'];
const reports = input.map((name) => JSON.parse(readFileSync(resolve(out, name), 'utf8')));
const expected = [128, 648, 344];
const scriptHash = sha(readFileSync(resolve(root, 'scripts/tactical-balance-022.mjs')));
const sourceHashes = {};
for (const [version, folder] of [
  ['0.21', 'baseline-0.21'],
  ['0.22', 'candidate-0.22'],
]) {
  const sourceRoot = resolve(out, 'source-snapshots', folder);
  const manifest = JSON.parse(readFileSync(resolve(sourceRoot, 'manifest.json'), 'utf8'));
  for (const file of manifest.sourceFiles)
    assert.equal(
      sha(readFileSync(resolve(sourceRoot, file.path))),
      file.sha256,
      `${version}/${file.path}`,
    );
  assert.equal(sha(JSON.stringify(manifest.sourceFiles)), manifest.sourceHash);
  assert.equal(
    sha(readFileSync(resolve(sourceRoot, 'scripts/tactical-balance-022.mjs'))),
    scriptHash,
  );
  sourceHashes[version] = manifest.sourceHash;
}
for (const [index, report] of reports.entries()) {
  assert.equal(report.records.length, expected[index]);
  assert.equal(report.total.runs, expected[index]);
  assert.equal(report.total.errors, 0);
  assert.equal(report.total.timeouts, 0);
  assert.equal(report.scriptHashBefore, scriptHash);
  assert.equal(report.scriptHashAfter, scriptHash);
  for (const manifest of report.manifests) {
    assert.equal(manifest.unchanged, true);
    assert.equal(manifest.sourceHashBefore, sourceHashes[manifest.version]);
    assert.equal(manifest.sourceHashAfter, sourceHashes[manifest.version]);
  }
  for (const record of report.records) {
    assert.ok(['won', 'lost'].includes(record.status));
    assert.ok(!record.timeout && !record.error);
    assert.ok(record.flyingKills + record.flyingEscaped <= record.flyingSeen);
    assert.ok(record.injuredSurvivors <= record.survivors);
    assert.ok(record.supplyRefills <= record.supplyReturns);
    assert.ok(record.courtHeals <= record.courtSeen.healer * 6);
    for (const kills of Object.values(record.headKills))
      assert.ok(kills <= Number(record.bossSeen));
  }
}
const [classic, missions, holdout] = reports;
assert.equal(classic.pairs.length, 64);
assert.equal(missions.pairs.length, 324);
assert.equal(holdout.pairs.length, 64);
assert.equal(holdout.records.filter((r) => r.mode === 'missions').length, 216);
assert.ok(
  holdout.records
    .filter((r) => r.mode === 'missions')
    .every((r) => r.version === '0.22' && ['methodical', 'casual'].includes(r.bot)),
);
for (const mode of ['classic', 'missions']) {
  const discovered = new Set(
    reports.slice(0, 2).flatMap((r) => r.records.filter((x) => x.mode === mode).map((x) => x.seed)),
  );
  assert.ok(
    holdout.records.filter((r) => r.mode === mode).every((r) => !discovered.has(r.seed)),
    `${mode}: seed overlap`,
  );
}
const audit = {
  inputs: input,
  finalRuns: expected.reduce((a, b) => a + b, 0),
  errors: 0,
  timeouts: 0,
  sourceHashes,
  scriptHash,
  sourceSnapshotsVerified: true,
  pairedCohortsVerified: true,
  holdoutSeedsDisjoint: true,
  observedMetricInvariants: true,
};
writeFileSync(resolve(out, 'audit.json'), JSON.stringify(audit, null, 2) + '\n');
console.log(JSON.stringify(audit));
