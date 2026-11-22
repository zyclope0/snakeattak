import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// The site is published by hand, from one workflow. This holds what it checks before
// anything is sent: the rule « only main, only with the whole CI green » was kept by hand
// until 22 November 2026. The step's own script is run here, in a small repository, with a
// stand-in for GitHub's answer: reading the file for the right words let nine ways of
// switching the guard off go by (review of 22 November 2026).

const workflow = readFileSync('.github/workflows/deploy-site.yml', 'utf8');
const GUARD = 'Le commit est dans main et sa CI complète est verte';
const STEP = '\n      - ';

/** The steps of the only job, each as its own text. */
const steps = workflow.slice(workflow.indexOf('    steps:')).split(STEP).slice(1);
const guardAt = steps.findIndex((step) => step.startsWith(`name: ${GUARD}`));
const guard = steps[guardAt] ?? '';

/** The script of the guard, as the runner would hand it to bash. */
const script = guard
  .slice(guard.indexOf('run: |\n') + 'run: |\n'.length)
  .split('\n')
  .map((line) => line.replace(/^ {10}/, ''))
  .join('\n');

const git = (cwd: string, ...args: string[]) => {
  const done = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(done.status, 0, `git ${args.join(' ')}: ${done.stderr}`);
  return done.stdout.trim();
};

/** A repository whose `origin` has a `main`, one commit in it and one commit outside. */
function repository() {
  const root = mkdtempSync(join(tmpdir(), 'publication-guard-'));
  const origin = join(root, 'origin.git');
  const work = join(root, 'work');
  const bin = join(root, 'bin');
  mkdirSync(bin);
  git(root, 'init', '--quiet', '--bare', '--initial-branch=main', origin);
  git(root, 'clone', '--quiet', origin, work);
  git(work, 'config', 'user.email', 'guard@example.invalid');
  git(work, 'config', 'user.name', 'guard');
  git(work, 'config', 'commit.gpgsign', 'false');
  git(work, 'checkout', '--quiet', '-b', 'main');
  git(work, 'commit', '--quiet', '--allow-empty', '-m', 'in main');
  git(work, 'push', '--quiet', 'origin', 'main');
  const inMain = git(work, 'rev-parse', 'HEAD');
  git(work, 'checkout', '--quiet', '-b', 'work');
  git(work, 'commit', '--quiet', '--allow-empty', '-m', 'outside main');
  const outside = git(work, 'rev-parse', 'HEAD');
  // GitHub's answer: the number given, or a failure; what was asked is written down.
  writeFileSync(
    join(bin, 'gh'),
    '#!/bin/sh\necho "$@" > "$GH_ASKED"\n[ "$GH_ANSWER" = fails ] && exit 1\necho "$GH_ANSWER"\n',
  );
  chmodSync(join(bin, 'gh'), 0o755);
  return { root, work, bin, inMain, outside };
}

const repo = repository();
test.after(() => rmSync(repo.root, { recursive: true, force: true }));

/** Runs the guard on `commit`: its exit code, and what it asked GitHub. */
function runGuard(commit: string, answer: string, urgence = false) {
  git(repo.work, 'checkout', '--quiet', '--detach', commit);
  const asked = join(repo.root, 'asked');
  rmSync(asked, { force: true });
  const done = spawnSync('bash', ['--noprofile', '--norc', '-eo', 'pipefail', '-c', script], {
    cwd: repo.work,
    encoding: 'utf8',
    env: {
      PATH: `${repo.bin}:${process.env.PATH}`,
      HOME: repo.root,
      DEPOT: 'someone/game',
      URGENCE: String(urgence),
      GH_ANSWER: answer,
      GH_ASKED: asked,
    },
  });
  let question = '';
  try {
    question = readFileSync(asked, 'utf8');
  } catch {
    // Nothing was asked.
  }
  return { status: done.status, question };
}

test('a commit of main with a green whole CI is published, and the right question is asked', () => {
  const { status, question } = runGuard(repo.inMain, '1');
  assert.equal(status, 0);
  assert.match(question, /repos\/someone\/game\/actions\/workflows\/check\.yml\/runs\?/);
  for (const part of [`head_sha=${repo.inMain}`, 'event=push', 'branch=main', 'status=success'])
    assert.ok(question.includes(part), `${part} is in the question`);
  assert.equal(runGuard(repo.inMain, '3').status, 0);
});

test('a commit of main without a green whole CI is not published', () => {
  assert.equal(runGuard(repo.inMain, '0').status, 1);
});

test('when GitHub does not answer, nothing is published', () => {
  assert.equal(runGuard(repo.inMain, 'fails').status, 1);
  assert.equal(runGuard(repo.inMain, '').status, 1);
  assert.equal(runGuard(repo.inMain, 'Not Found').status, 1);
  assert.equal(runGuard(repo.inMain, '-1').status, 1);
});

test('« urgence » publishes a commit of main whatever the CI says, even with no answer', () => {
  assert.equal(runGuard(repo.inMain, '0', true).status, 0);
  assert.equal(runGuard(repo.inMain, 'fails', true).status, 0);
});

test('a commit outside main is never published, and GitHub is not even asked', () => {
  for (const urgence of [false, true]) {
    const { status, question } = runGuard(repo.outside, '1', urgence);
    assert.equal(status, 1);
    assert.equal(question, '');
  }
});

test('the guard is a step nothing switches off, before anything is installed or sent', () => {
  assert.ok(guardAt > 0, `the step « ${GUARD} » exists`);
  // Its own keys: a name, what it is told, its script. No condition, no « carry on anyway »,
  // no other shell than the runner's (which stops at the first failure).
  const keys = [...guard.matchAll(/^ {8}([\w-]+):/gm)].map(([, key]) => key);
  assert.deepEqual(keys, ['env', 'run']);
  assert.doesNotMatch(workflow, /continue-on-error/);
  // The commit it judges is the commit that is built: one checkout, of the asked ref, with
  // the whole history, before the guard and never after.
  const checkouts = steps.flatMap((step, at) => (step.includes('actions/checkout') ? [at] : []));
  assert.equal(checkouts.length, 1);
  assert.ok(checkouts[0] < guardAt);
  const checkout = steps[checkouts[0]];
  assert.match(checkout, /ref: \$\{\{ inputs\.ref \}\}/);
  assert.match(checkout, /fetch-depth: 0/);
  const after = steps.slice(guardAt + 1).join(STEP);
  assert.doesNotMatch(after, /git (checkout|switch|reset|pull|merge)/);
  for (const later of ['npm ci', 'npm run verify', 'Envoyer le site'])
    assert.ok(after.includes(later), `« ${later} » comes after the guard`);
  // What it is told: the box « urgence », the repository, and a token that may read the runs.
  assert.match(guard, /URGENCE: \$\{\{ inputs\.urgence \}\}/);
  assert.match(guard, /DEPOT: \$\{\{ github\.repository \}\}/);
  assert.match(guard, /GH_TOKEN: \$\{\{ github\.token \}\}/);
  assert.match(workflow, /^ {2}actions: read$/m);
  assert.match(workflow, /urgence:[\s\S]*?default: false/);
  // One job only: nothing else could send the site.
  assert.equal([...workflow.matchAll(/^ {2}[\w-]+:\n {4}runs-on:/gm)].length, 1);
});

test('the publication runs by hand only, one at a time', () => {
  const triggers = workflow.slice(workflow.indexOf('\non:'), workflow.indexOf('\npermissions:'));
  assert.match(triggers, /workflow_dispatch:/);
  assert.doesNotMatch(triggers, /\b(push|pull_request|schedule|workflow_run):/);
  assert.match(workflow, /concurrency:\s+group: publier-le-site\s+cancel-in-progress: false/);
});
