import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The site is published by hand, from one workflow. This holds what it checks before
// anything is sent: the rule « only main, only with the whole CI green » was kept by hand
// until 22 November 2026.

const workflow = readFileSync('.github/workflows/deploy-site.yml', 'utf8');
const stepAt = (name: string) => {
  const at = workflow.indexOf(name);
  assert.ok(at > 0, `the step « ${name} » exists`);
  return at;
};

test('nothing is sent before the commit is known to be in main with a green CI', () => {
  const guard = stepAt('Le commit est dans main et sa CI complète est verte');
  assert.ok(guard < stepAt('npm ci'), 'before anything is installed');
  assert.ok(guard < stepAt('Envoyer le site'), 'before anything is sent');
  const step = workflow.slice(guard, stepAt('actions/setup-node'));
  // In main: the whole history is fetched, and the commit must be an ancestor of main.
  assert.match(workflow, /fetch-depth: 0/);
  assert.match(step, /git merge-base --is-ancestor "\$commit" FETCH_HEAD/);
  // Green: a finished, successful run of the whole CI for a push on that very commit.
  assert.match(step, /workflows\/check\.yml\/runs\?head_sha=\$commit&event=push&status=success/);
  assert.match(workflow, /^ {2}actions: read$/m);
  // The way around is a box someone ticks, and it never lifts the first rule.
  assert.match(workflow, /urgence:[\s\S]*?default: false/);
  assert.ok(step.indexOf('--is-ancestor') < step.indexOf('URGENCE" = "true"'));
});

test('the publication runs by hand only, one at a time', () => {
  const triggers = workflow.slice(workflow.indexOf('\non:'), workflow.indexOf('\npermissions:'));
  assert.match(triggers, /workflow_dispatch:/);
  assert.doesNotMatch(triggers, /\b(push|pull_request|schedule|workflow_run):/);
  assert.match(workflow, /concurrency:\s+group: publier-le-site\s+cancel-in-progress: false/);
});
