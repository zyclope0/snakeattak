import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

// The reproduction sets up a page of its own (a tiny DOM) : it runs in its own process.
test('un double appui ne remplace pas un cadeau et ne passe pas toute l’offre', () => {
  const run = spawnSync(
    process.execPath,
    ['--experimental-strip-types', 'scripts/hygiene/reward-double-tap.ts'],
    { encoding: 'utf8' },
  );
  assert.equal(run.status, 0, run.stdout + run.stderr);
  assert.equal((run.stdout.match(/=> sain/g) ?? []).length, 2, run.stdout);
});
