import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Optional snapshot comparison, separate from npm test: no baseline checkout is needed by CI.
const [baselineRoot, candidateRoot] = process.argv.slice(2);
if (!baselineRoot || !candidateRoot)
  throw new Error(
    'Usage: node tests/compare-engine-015.mjs <baseline-directory> <candidate-directory>',
  );
const load = (root, file) => import(pathToFileURL(resolve(root, 'src', file)).href);
const [{ Game: Before }, { Game: After }, { Session: SessionBefore }, { Session: SessionAfter }] =
  await Promise.all([
    load(baselineRoot, 'game.ts'),
    load(candidateRoot, 'game.ts'),
    load(baselineRoot, 'session.ts'),
    load(candidateRoot, 'session.ts'),
  ]);
const hash = createHash('sha256');
let snapshots = 0;
function compare(a, b, label) {
  const before = JSON.stringify(a),
    after = JSON.stringify(b);
  assert.equal(after, before, label);
  hash.update(label + ':' + after + '\n');
  snapshots++;
}
for (const seed of [15, 1234, 4294967295]) {
  for (const completed of [0, 4, 8]) {
    const a = new Before(seed),
      b = new After(seed);
    for (const game of [a, b]) {
      game.wave = completed;
      game.normalizeCamp();
      game.recruit('archer', 948, 180);
      game.recruit('medic', 948, 468);
      game.startWave();
    }
    compare(a, b, `${seed}/${completed}/start`);
    for (let i = 0; i < 600; i++) {
      for (const game of [a, b]) {
        if (i === 60) game.offerFeast(1, completed === 4 ? 'sticky' : 'lure');
        game.step(1 / 30);
      }
      if ((i + 1) % 60 === 0) compare(a, b, `${seed}/${completed}/${i + 1}`);
    }
  }
}
for (const speed of [1, 2]) {
  const a = new SessionBefore(32),
    b = new SessionAfter(32);
  for (const session of [a, b]) {
    session.speed = speed;
    session.game.startWave();
  }
  for (let i = 0; i < 300; i++) {
    if (i === 70 || i === 90) for (const session of [a, b]) session.game.paused = i === 70;
    if (i === 150)
      for (const session of [a, b]) {
        session.restart(32);
        session.game.startWave();
      }
    for (const session of [a, b]) session.advance([16, 33, 100, 17][i % 4]);
    if ((i + 1) % 30 === 0) compare(a, b, `session/${speed}/${i + 1}`);
  }
}
console.log(
  JSON.stringify(
    {
      scenarios: 9,
      stepsPerGame: 5400,
      sessionFramesPerVersion: 600,
      snapshots,
      equal: true,
      sha256: hash.digest('hex'),
    },
    null,
    2,
  ),
);
