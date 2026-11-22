import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

// The recipe renders the views of the expedition on a tiny DOM of its own: it runs in its
// own process. It holds how the views call the rules of the model (a lost negation, a
// condition left out), which the tests of the model cannot see.
test('les vues de l’expédition branchent les règles du modèle comme il faut', () => {
  const run = spawnSync(
    process.execPath,
    ['--experimental-strip-types', 'scripts/hygiene/expedition-views.mjs'],
    { encoding: 'utf8' },
  );
  assert.equal(run.status, 0, run.stdout + run.stderr);
  assert.match(run.stdout, /"checks":\d\d/, run.stdout);
});
