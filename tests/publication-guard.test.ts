import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// The site is published by hand, from one workflow. This holds what it checks before
// anything is sent: the rule « only main, only with the whole CI green » was kept by hand
// until 22 November 2026. The step's own script is run here, in a small repository, with a
// stand-in for GitHub's answer: reading the file for the right words let nine ways of
// switching the guard off go by (review of 22 November 2026).

const workflow = readFileSync('.github/workflows/deploy-site.yml', 'utf8');
/**
 * What the CI runs for a push on main (`.github/workflows/check.yml`): every command, then
 * the groups of browser recipes, as they are written there.
 */
const NPM_LINES = [
  '- run: npm ci',
  '- run: npm run verify',
  'run: npm run test:android-signatures',
  'run: npm audit --omit=dev --audit-level=high',
  'run: npm run test:browser',
  'run: npm run test:discovery',
  'run: npm run build:ads-preview',
  'run: npm run test:ads-preview',
  'run: npm run build:ads-test',
  'run: npm run test:ads-delivery',
  'run: npm run build:android',
  'run: npm run test:android-web',
  'run: npm run build:portable',
  'run: npm run test:family',
  'run: GAME_URL="file://$PWD/dist-portable/index.html" npm run test:browser',
  '- run: npm ci',
  'run: npm run build',
  'run: npm run build:android',
  'npm run "$recette"',
];
const GROUPS = [
  'include:',
  '- groupe: écrans',
  'site: true',
  'recettes: >-',
  'test:audit test:threat-preparation test:reinforcements-scroll test:child-mobile',
  'test:interruptions test:offline test:presentation test:tactical-clarity',
  'test:mission-journey test:endless',
  '- groupe: langue et caprices',
  'recettes: test:locale test:caprices',
  '- groupe: menus 1',
  'recettes: test:mobile-menus',
  'menus: voyage',
  '- groupe: menus 2',
  'recettes: test:mobile-menus',
  'sauf: voyage',
  '- groupe: règles et rendu',
  'site: true',
  'recettes: >-',
  'test:rewards test:journey test:missions:regressions test:medical-persistence',
  'test:stage test:render-settings test:tactical test:expedition',
  '- groupe: sauvegardes',
  'site: true',
  'android: true',
  'recettes: >-',
  'test:saves:update test:saves:family test:saves:forced-close',
  'test:saves:double-taps test:failure test:saves:unkept test:saves:gate',
  '- groupe: retour',
  'site: true',
  'android: true',
  'recettes: test:back-button',
];
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
  // The commit judged is an older one of main, not its tip: a green tip says nothing of it.
  git(work, 'commit', '--quiet', '--allow-empty', '-m', 'in main');
  const inMain = git(work, 'rev-parse', 'HEAD');
  git(work, 'commit', '--quiet', '--allow-empty', '-m', 'the tip of main');
  git(work, 'push', '--quiet', 'origin', 'main');
  git(work, 'checkout', '--quiet', '-b', 'work');
  git(work, 'commit', '--quiet', '--allow-empty', '-m', 'outside main');
  const outside = git(work, 'rev-parse', 'HEAD');
  // The work branch is on the server too: being pushed somewhere is not being in main. Nor is
  // being under a branch that sorts before main, under a tag that took the name « main » or
  // « origin/main », or under the branch the server shows first.
  const traps = ['work', 'work:aaa', 'work:refs/tags/main', 'work:refs/tags/origin/main'];
  git(work, 'push', '--quiet', 'origin', ...traps);
  git(origin, 'symbolic-ref', 'HEAD', 'refs/heads/aaa');
  // As on the runner, which fetches the whole history: the tags are here too.
  git(work, 'fetch', '--quiet', '--tags', 'origin');
  // GitHub's answer: the number given, or a failure; what was asked is written down. Like
  // the real one, it gives the count only to who asks for the count: `--jq .total_count`.
  writeFileSync(
    join(bin, 'gh'),
    [
      '#!/bin/sh',
      'echo "$@" > "$GH_ASKED"',
      '[ "$GH_ANSWER" = fails ] && exit 1',
      'if [ $# -eq 4 ] && [ "$1 $3 $4" = "api --jq .total_count" ]; then echo "$GH_ANSWER"',
      'else echo "{\\"total_count\\":$GH_ANSWER}"; fi',
      '',
    ].join('\n'),
  );
  chmodSync(join(bin, 'gh'), 0o755);
  return { root, work, bin, inMain, outside };
}

// The step's script is for the runner's shell (`bash -e`, as GitHub runs a step that names no
// shell). A Windows machine that builds the Android package has none of it: the tests that
// run the script are skipped there, by name, and never where the CI runs.
const noShell = process.platform === 'win32' && !process.env.CI;
const runs = { skip: noShell && 'bash and git are needed to run the guard: not on Windows' };
const repo = noShell ? null : repository();
test.after(() => repo && rmSync(repo.root, { recursive: true, force: true }));

/** Runs the guard on `commit`: its exit code, and what it asked GitHub. */
function runGuard(which: 'inMain' | 'outside', answer: string, urgence: boolean | string = false) {
  assert.ok(repo);
  const commit = repo[which];
  git(repo.work, 'checkout', '--quiet', '--detach', commit);
  const asked = join(repo.root, 'asked');
  rmSync(asked, { force: true });
  const done = spawnSync('bash', ['--noprofile', '--norc', '-e', '-c', script], {
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
  return { status: done.status, question, commit };
}

test(
  'a commit of main with a green whole CI is published, and the right question is asked',
  runs,
  () => {
    const { status, question, commit } = runGuard('inMain', '1');
    assert.equal(status, 0);
    // The whole question, word for word: the successful runs of the whole CI, for a push, on
    // main, for this very commit, and their count.
    assert.equal(
      question.trim(),
      `api repos/someone/game/actions/workflows/check.yml/runs?head_sha=${commit}&event=push&branch=main&status=success --jq .total_count`,
    );
    assert.equal(runGuard('inMain', '3').status, 0);
  },
);

test('a commit of main without a green whole CI is not published', runs, () => {
  assert.equal(runGuard('inMain', '0').status, 1);
});

test('when GitHub does not answer, nothing is published', runs, () => {
  assert.equal(runGuard('inMain', 'fails').status, 1);
  assert.equal(runGuard('inMain', '').status, 1);
  assert.equal(runGuard('inMain', 'Not Found').status, 1);
  assert.equal(runGuard('inMain', '-1').status, 1);
});

test(
  '« urgence » publishes a commit of main whatever the CI says, even with no answer',
  runs,
  () => {
    assert.equal(runGuard('inMain', '0', true).status, 0);
    assert.equal(runGuard('inMain', 'fails', true).status, 0);
  },
);

test('only the box ticked is « urgence »: nothing else stands for it', runs, () => {
  for (const said of ['', 'false', 'TRUE', '1', 'oui'])
    assert.equal(runGuard('inMain', '0', said).status, 1, `« ${said} »`);
});

test('a commit outside main is never published, and GitHub is not even asked', runs, () => {
  for (const urgence of [false, true]) {
    const { status, question } = runGuard('outside', '1', urgence);
    assert.equal(status, 1);
    assert.equal(question, '');
  }
});

/** The lines of a step that say something: no comment, no indentation. */
const said = (step: string) =>
  step
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

test('the guard is a step nothing switches off, before anything is installed or sent', () => {
  assert.ok(guardAt > 0, `the step « ${GUARD} » exists`);
  // Its own keys: a name, what it is told, its script. No condition, no « carry on anyway »,
  // no other shell than the runner's (which stops at the first failure) — however the key is
  // written.
  const keys = [...guard.matchAll(/^ {8}["']?([\w-]+)["']?\s*:/gm)].map(([, key]) => key);
  assert.deepEqual(keys, ['env', 'run']);
  assert.doesNotMatch(workflow, /\b(defaults|shell)\s*:/);
  // Before it: the confirmation and the checkout, nothing that could prepare the ground.
  assert.equal(guardAt, 2);
  // The job itself adds nothing: no condition, no variable, no permission of its own.
  assert.deepEqual(
    said(workflow.slice(workflow.indexOf('\njobs:\n'), workflow.indexOf('    steps:'))),
    ['jobs:', 'publier:', 'runs-on: ubuntu-latest', 'timeout-minutes: 20'],
  );
  assert.doesNotMatch(workflow, /continue-on-error|\|\| *true|set \+e/);
  // The commit it judges is the commit that is built: one checkout, of the asked ref, of this
  // repository, with the whole history, before the guard and never after.
  const checkouts = steps.flatMap((step, at) => (step.includes('actions/checkout') ? [at] : []));
  assert.deepEqual(checkouts, [1]);
  assert.ok(checkouts[0] < guardAt);
  assert.deepEqual(said(steps[1]), [
    'uses: actions/checkout@v4',
    'with:',
    'ref: ${{ inputs.ref }}',
    'fetch-depth: 0',
  ]);
  // The first step refuses a run that was not confirmed.
  assert.deepEqual(said(steps[0]).slice(0, 2), [
    'name: Confirmation',
    "if: ${{ inputs.confirmation != 'PUBLIER' }}",
  ]);
  assert.ok(steps[0].includes('exit 1'));
  // After the guard, nothing touches the tree: git only says which commit is built, and
  // GitHub is asked nothing more.
  const after = steps.slice(guardAt + 1).join(STEP);
  const commands = said(after).join('\n');
  for (const [command] of commands.matchAll(/\bgit\b[^\n"]*/g))
    assert.match(command, /^git rev-parse HEAD\)?$/, `after the guard: ${command}`);
  assert.doesNotMatch(commands, /\bgh\b/);
  for (const later of ['run: npm ci', 'run: npm run verify\n', 'Envoyer le site'])
    assert.ok(after.includes(later), `« ${later.trim()} » comes after the guard`);
  // What it is told: the box « urgence », the repository, and a token that may read the runs.
  assert.deepEqual(said(guard).slice(1, 6), [
    'env:',
    'GH_TOKEN: ${{ github.token }}',
    'URGENCE: ${{ inputs.urgence }}',
    'DEPOT: ${{ github.repository }}',
    'run: |',
  ]);
  assert.match(workflow, /^ {2}actions: read$/m);
  const urgence = workflow.slice(
    workflow.indexOf('      urgence:'),
    workflow.indexOf('permissions:'),
  );
  assert.deepEqual(said(urgence).slice(2), ['type: boolean', 'default: false']);
  // One job only: nothing else could send the site.
  const jobs = workflow.slice(workflow.indexOf('\njobs:\n') + 1);
  assert.deepEqual(
    [...jobs.matchAll(/^ {2}(\S[^:\n]*):/gm)].map(([, name]) => name),
    ['publier'],
  );
});

test('a run of the CI for a push is the whole CI: that is what the guard counts', () => {
  const check = readFileSync('.github/workflows/check.yml', 'utf8');
  // The guard asks for `check.yml`, pushes only; a push is a push on main.
  assert.match(check, /\non:\n {2}push:\n {4}branches: \[main\]\n {2}pull_request:\npermissions:/);
  // Everything runs unless « complet » is `false`, and it is `false` in one place only,
  // inside what is done for a pull request.
  assert.equal(check.split('complet=false').length - 1, 1);
  const scope = check.slice(check.indexOf('complet=true'), check.indexOf('echo "complet='));
  const forRequests = scope.slice(scope.indexOf('if [ "$EVENEMENT" = pull_request ]; then'));
  assert.ok(forRequests.includes('complet=false'));
  assert.match(forRequests, /\n {10}fi\n {10}$/, 'the pull-request block closes last');
  assert.match(check, /EVENEMENT: \$\{\{ github\.event_name \}\}/);
  // That answer reaches the jobs as it is: one way out of « portée », one way into the others.
  const lines = said(check);
  assert.deepEqual(
    lines.filter((line) => /^complet:/i.test(line)),
    [
      'complet: ${{ steps.fichiers.outputs.complet }}',
      'COMPLET: ${{ needs.portee.outputs.complet }}',
    ],
  );
  // No job, no step is switched off by what started the run. Every condition, in the order
  // of the file: the fifteen steps of `verify` that a documents-only pull request skips, the
  // job of the recipes, and what a group of recipes needs built.
  const conditions = lines.flatMap(
    (line) => line.match(/^(?:- )?["']?if["']?\s*:\s*(.+)$/)?.[1] ?? [],
  );
  assert.deepEqual(conditions, [
    ...Array<string>(15).fill("env.COMPLET != 'false'"),
    "needs.portee.outputs.complet != 'false'",
    'matrix.site',
    'matrix.android',
  ]);
  assert.equal(check.split('github.event_name').length - 1, 2, 'the scope and the concurrency');
  // A step that fails fails the run: nothing carries on anyway.
  assert.doesNotMatch(check, /continue-on-error|set \+e/);
  // Every command of the CI, as it is written: nothing after it swallows a failure, and none
  // is dropped without this list being changed on purpose.
  assert.deepEqual(
    lines.filter((line) => /\bnpm /.test(line)),
    NPM_LINES,
  );
  // The recipes of a group all run, one after the other, and the step that runs them has no
  // condition of its own.
  const recipes = check.slice(check.indexOf('      - name: Recettes\n'));
  assert.deepEqual(said(recipes), [
    '- name: Recettes',
    'env:',
    'MOBILE_MENUS_ONLY: ${{ matrix.menus }}',
    'MOBILE_MENUS_EXCEPT: ${{ matrix.sauf }}',
    'run: |',
    'for recette in ${{ matrix.recettes }}; do',
    'echo "::group::$recette"',
    'npm run "$recette"',
    'echo "::endgroup::"',
    'done',
  ]);
  // The groups of recipes, as they are: a group taken out is taken out here too, on purpose.
  const groups = check.slice(
    check.indexOf('        include:\n'),
    check.indexOf('    name: recettes'),
  );
  assert.deepEqual(said(groups), GROUPS);
});

test('for a push, the scope of the CI answers « everything », whatever was changed', runs, () => {
  assert.ok(repo);
  const check = readFileSync('.github/workflows/check.yml', 'utf8');
  const step = check.slice(check.indexOf('      - id: fichiers\n'), check.indexOf('\n  verify:'));
  const scope = step
    .slice(step.indexOf('run: |\n') + 'run: |\n'.length)
    .split('\n')
    .map((line) => line.replace(/^ {10}/, ''))
    .join('\n');
  // A commit that changes one document only: a pull request may skip the recipes for it.
  git(repo.work, 'checkout', '--quiet', '--detach', repo.inMain);
  writeFileSync(join(repo.work, 'LISEZ.md'), 'un document\n');
  git(repo.work, 'add', 'LISEZ.md');
  git(repo.work, 'commit', '--quiet', '-m', 'a document');
  const answer = (event: string) => {
    const out = join(repo.root, 'output');
    rmSync(out, { force: true });
    const done = spawnSync('bash', ['--noprofile', '--norc', '-e', '-c', scope], {
      cwd: repo.work,
      encoding: 'utf8',
      env: { PATH: process.env.PATH, HOME: repo.root, EVENEMENT: event, GITHUB_OUTPUT: out },
    });
    assert.equal(done.status, 0, done.stderr);
    return readFileSync(out, 'utf8').trim();
  };
  assert.equal(answer('pull_request'), 'complet=false', 'the case is one a pull request skips');
  assert.equal(answer('push'), 'complet=true');
});

// The tests above run the guard and hold what matters most in the two files. They cannot see
// everything a change could do (a failure swallowed further down, a variable set for every
// step, a line that behaves differently on GitHub's machine): two attempts to break them
// found new ways each time. So the files themselves are held, byte for byte, like the games
// of reference: a change to either is a change to what publishes the site or to what judges
// every commit. It is made here too, on purpose, after reading `docs/SITE.md`, « Publier ».
const FINGERPRINTS = {
  'deploy-site.yml': 'f355fe13b1aabfe21f9437fc0d0d347582dd5df1a9cc97e3d984327a3288f181',
  'check.yml': '85f6c74df20bfcf07a07e0422cd4992dd7a5d8606bcc058e2492486bdb937ddb',
};

test('the workflow that publishes and the one that judges are the ones that were read', () => {
  for (const [name, expected] of Object.entries(FINGERPRINTS)) {
    const now = createHash('sha256')
      .update(readFileSync(`.github/workflows/${name}`))
      .digest('hex');
    assert.equal(
      now,
      expected,
      `${name} changed. If the change is meant, read it again against the guard, then write ${now} in FINGERPRINTS.`,
    );
  }
});

test('the publication runs by hand only, one at a time', () => {
  const triggers = workflow.slice(workflow.indexOf('\non:'), workflow.indexOf('\npermissions:'));
  // One way in, whatever the others are called.
  assert.deepEqual(
    [...triggers.matchAll(/^ {2}(\S[^:\n]*):/gm)].map(([, name]) => name),
    ['workflow_dispatch'],
  );
  assert.match(workflow, /concurrency:\s+group: publier-le-site\s+cancel-in-progress: false/);
});
