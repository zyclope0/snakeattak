import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { createCareer } from '../src/progression.ts';
import { CAPRICES, CREATOR_CHALLENGES, capriceById, defineCaprice } from '../src/caprices.ts';
import { createMissionRun, readMissionRun } from '../src/missions.ts';
import { encodeDeparture, decodeDeparture } from '../src/departures.ts';
import { encodeCheckpoint, decodeCheckpoint } from '../src/checkpoints.ts';
import {
  createMissionProgress,
  createMissionProgressController,
  validateMissionProgress,
} from '../src/missionProgress.ts';
import { createCapriceAlbums } from '../src/capriceAlbums.ts';
import { readFamilyBackup, writeFamilyBackup } from '../src/familyBackup.ts';

function milestone(revision: 1 | 2, wave: 4 | 8) {
  const game = new Game(42, undefined, undefined, revision);
  game.wave = wave;
  game.rewards.pending = wave;
  game.normalizeCamp();
  return game;
}
for (const order of [
  [1, 2],
  [2, 1],
] as const) {
  test(`chapter camps distinguish balance ${order.join(' → ')} at the same reward seed`, () => {
    for (const wave of [4, 8] as const) {
      const career = createCareer();
      const first = milestone(order[0], wave);
      career.sync(first);
      const original = career.state.chapterCamps[wave === 4 ? 0 : 1];
      const second = milestone(order[1], wave);
      second.gold = 555;
      career.sync(second);
      const resumed = career.chapterGame(wave === 4 ? 1 : 2)!;
      assert.equal(resumed.balanceRevision, order[1]);
      assert.equal(resumed.recruitCost('dragon'), order[1] === 2 ? 210 : 240);
      assert.equal(resumed.gold, 555);
      assert.notEqual(career.state.chapterCamps[wave === 4 ? 0 : 1], original);
    }
  });
}
test('same seed and revision retain the first pre-choice chapter snapshot across reload', () => {
  for (const revision of [1, 2] as const)
    for (const wave of [4, 8] as const) {
      const career = createCareer();
      const game = milestone(revision, wave);
      career.sync(game);
      const original = career.state.chapterCamps[wave === 4 ? 0 : 1];
      game.gold += 100;
      game.units[0].hp -= 10;
      career.sync(game);
      assert.equal(career.state.chapterCamps[wave === 4 ? 0 : 1], original);
      const reloaded = createCareer(undefined, career.state);
      reloaded.sync(game);
      assert.equal(reloaded.state.chapterCamps[wave === 4 ? 0 : 1], original);
    }
});

const canonical = capriceById('carrefour-grand')!;
const alias = defineCaprice({
  ...canonical,
  id: 'test-private-balance2-alias',
  rules: { ...canonical.rules, count: 1.25 },
});
const experimentalRun = {
  ...createMissionRun('carrefour', 42, undefined, 2),
  caprice: alias.id,
};
function unlockedProgress() {
  const state = createMissionProgress();
  for (const key of Object.keys(state.bestStars) as (keyof typeof state.bestStars)[])
    state.bestStars[key] = 3;
  return state;
}
test('experimental revision2 caprices remain playable but cannot be encoded into code4 or camp9', () => {
  const run = readMissionRun(experimentalRun)!;
  assert.ok(run);
  const game = new Game(42, undefined, run);
  assert.equal(game.caprice.count, 1.25);
  assert.throws(() => encodeDeparture({ kind: 'mission', run }), RangeError);
  assert.equal(encodeCheckpoint(game), null);
  assert.equal(game.startWave(), true);
});
test('camp9 readers and progress2 reject experimental identities before retaining any state', () => {
  const normalRun = { ...experimentalRun, caprice: canonical.id };
  const validCamp = JSON.parse(encodeCheckpoint(new Game(42, undefined, normalRun))!);
  validCamp.mission = experimentalRun;
  const forgedCamp = JSON.stringify(validCamp);
  assert.equal(decodeCheckpoint(forgedCamp), null);
  const state = {
    ...unlockedProgress(),
    version: 2 as const,
    lastRuns: { carrefour: experimentalRun },
  };
  assert.equal(validateMissionProgress(state), null);
  assert.equal(validateMissionProgress({ ...state, retryCamp: forgedCamp }), null);
  assert.equal(writeFamilyBackup(null, createCareer().state, state, createCapriceAlbums()), null);
  const validFamily = JSON.parse(
    writeFamilyBackup(
      null,
      createCareer().state,
      {
        ...state,
        lastRuns: { carrefour: normalRun },
      },
      createCapriceAlbums(),
    )!,
  );
  validFamily.missions.lastRuns.carrefour = experimentalRun;
  assert.equal(readFamilyBackup(JSON.stringify(validFamily)), null);
  const controller = createMissionProgressController(unlockedProgress());
  const before = controller.state;
  assert.equal(controller.started(experimentalRun), false);
  assert.deepEqual(controller.state, before);
  const game = new Game(42, undefined, experimentalRun);
  assert.equal(controller.rememberCamp(game), false);
  game.status = 'won';
  game.wave = game.totalWaves;
  assert.equal(controller.record(game), false);
  assert.deepEqual(controller.state, before);
});
test('all canonical36 identities still round trip code4, camp9 and progress2', () => {
  for (const caprice of [...CAPRICES, ...CREATOR_CHALLENGES]) {
    const run = { ...createMissionRun(caprice.missionId, 42, undefined, 2), caprice: caprice.id };
    const departure = { kind: 'mission' as const, run };
    assert.deepEqual(decodeDeparture(encodeDeparture(departure)), { ok: true, departure });
    const game = new Game(42, undefined, run);
    const camp = encodeCheckpoint(game)!;
    assert.equal(encodeCheckpoint(decodeCheckpoint(camp)!), camp);
    const controller = createMissionProgressController(unlockedProgress());
    assert.equal(controller.started(run), true);
    assert.equal(controller.rememberCamp(game), true);
    assert.deepEqual(validateMissionProgress(controller.state), controller.state);
  }
});
test('legacy experimental camp8 behavior remains available without applying new rules', () => {
  const { balance, ...run } = experimentalRun;
  const game = new Game(42, undefined, run);
  const raw = encodeCheckpoint(game)!;
  assert.equal(JSON.parse(raw).version, 8);
  assert.equal(decodeCheckpoint(raw)!.caprice.count, 1.25);
  assert.equal(encodeCheckpoint(decodeCheckpoint(raw)!), raw);
  assert.match(encodeDeparture({ kind: 'mission', run }), /-3-.*-S3-/);
});
