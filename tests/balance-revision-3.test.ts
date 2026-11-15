import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BALANCE_REVISIONS,
  CURRENT_BALANCE_REVISION,
  balanceRecruitPrice,
  lateEggRule,
} from '../src/balanceRevision.ts';
import { decodeCheckpoint, encodeCheckpoint } from '../src/checkpoints.ts';
import { kinds } from '../src/data.ts';
import type { Kind } from '../src/data.ts';
import { checkDigits } from '../src/codeText.ts';
import { decodeDeparture, departureForGame, encodeDeparture } from '../src/departures.ts';
import { readFamilyBackup, writeFamilyBackup } from '../src/familyBackup.ts';
import { Game } from '../src/game.ts';
import { createMissionProgress } from '../src/missionProgress.ts';
import { createMissionRun } from '../src/missions.ts';
import { createCareer } from '../src/progression.ts';
import { createCapriceAlbumsController } from '../src/capriceAlbums.ts';
import { english } from '../src/i18n/english.ts';
import * as TEXT from '../src/texts/fr/battle.ts';

// Third balance revision, 15 November 2026: an idea of the child (« more eggs when the game
// lasts »), values chosen by the parent after 240 simulated games. Retyped on purpose.
test('la révision 3 existe toujours et garde les prix de la révision 2', () => {
  assert.ok(BALANCE_REVISIONS.includes(3));
  assert.ok(CURRENT_BALANCE_REVISION >= 3);
  for (const kind of Object.keys(kinds) as Kind[])
    assert.equal(balanceRecruitPrice(kind, 3), balanceRecruitPrice(kind, 2), kind);
  assert.equal(lateEggRule(1), null);
  assert.equal(lateEggRule(2), null);
  assert.deepEqual({ ...lateEggRule(3) }, { after: 45, every: 15, most: 2, hatchIn: 8, count: 2 });
});

test('la révision 3 n’existe que dans la grande aventure', () => {
  assert.equal(new Game(7, undefined, undefined, 3).balanceRevision, 3);
  assert.ok(new Game(7, undefined, undefined, 3).lateEggs);
  for (const revision of [1, 2] as const)
    assert.equal(new Game(7, undefined, undefined, revision).lateEggs, null);
  const run = createMissionRun('refuge', 7, undefined, 2);
  assert.throws(() => new Game(7, undefined, run, 3));
  assert.equal(new Game(7, undefined, run).lateEggs, null);
});

/** The last camp before the king, well defended: the one wave that always lasts. */
function kingWave(revision: 2 | 3): Game {
  const game = new Game(31, undefined, undefined, revision);
  game.wave = 11;
  game.gold = 20000;
  game.normalizeCamp();
  let bought = 0;
  for (const kind of ['knight', 'archer', 'shield', 'medic', 'tank', 'trex', 'dragon'] as Kind[])
    for (let x = 624; x <= 972; x += 48)
      for (let y = 120; y <= 528; y += 48) if (bought < 40 && game.recruit(kind, x, y)) bought++;
  assert.ok(game.startWave());
  return game;
}
/** Seconds at which an egg appeared beyond the three places of the wave's own eggs. */
function lateEggTimes(game: Game): { times: number[]; said: boolean; seconds: number } {
  const seen = new Set<number>();
  const times: number[] = [];
  let seconds = 0,
    said = false;
  while (game.status === 'fighting' && seconds < 200) {
    game.step(1 / 30);
    seconds += 1 / 30;
    for (const egg of game.eggs)
      if (egg.x >= 396 && !seen.has(egg.id)) {
        seen.add(egg.id);
        times.push(Math.round(seconds));
        said ||= game.message === TEXT.laVagueDureUnNouvelOeufEstApparu;
      }
  }
  return { times, said, seconds };
}

test('une vague qui dure pond un œuf à 45 s, un second à 60 s, pas plus', () => {
  const late = lateEggTimes(kingWave(3));
  assert.deepEqual(late.times, [45, 60]);
  assert.ok(late.said, 'le jeu annonce l’œuf');
  assert.ok(late.seconds > 60, 'le combat a bien duré');
  // The same camp under the second revision: the wave lasts as long, and nothing appears.
  const before = lateEggTimes(kingWave(2));
  assert.deepEqual(before.times, []);
  assert.ok(before.seconds > 45);
});

test('le plateau annonce l’œuf de plus au moment où il apparaît', async () => {
  const { Presentation } = await import('../src/render/presentation.ts');
  const BOARD = await import('../src/texts/fr/board.ts');
  const game = kingWave(3);
  const board = new Presentation();
  board.update(game, 16);
  const said: number[] = [];
  let seconds = 0;
  while (game.status === 'fighting' && seconds < 70) {
    game.step(1 / 30);
    seconds += 1 / 30;
    const before = board.notice?.title;
    board.update(game, 1000 / 30);
    if (board.notice?.title === BOARD.unOeufDePlusEstApparu && before !== board.notice.title)
      said.push(Math.round(seconds));
  }
  assert.equal(game.lateEggsLaid, 2);
  assert.equal(said[0], 45, 'le bandeau arrive avec le premier œuf');
  assert.equal(english[BOARD.unOeufDePlusEstApparu], 'One more egg has appeared!');
  assert.equal(
    english[BOARD.laVagueDureIlEclotBientot],
    'This wave is taking long: it hatches soon.',
  );
});

test('une vague courte ne pond rien, et le compte repart à chaque vague', () => {
  const game = new Game(5, undefined, undefined, 3);
  game.gold = 20000;
  for (const [x, y] of [
    [660, 180],
    [660, 324],
    [660, 468],
    [708, 180],
    [708, 324],
    [708, 468],
  ])
    game.recruit('archer', x, y);
  assert.ok(game.startWave());
  const first = lateEggTimes(game);
  assert.ok(first.seconds < 45, 'la première vague finit avant 45 s');
  assert.deepEqual(first.times, []);
  assert.equal(game.status, 'preparing');
});

test('un camp de la révision 3 s’écrit en version 10 et se relit à l’identique', () => {
  const game = new Game(2026, undefined, undefined, 3);
  game.initialSeed = 2026;
  const raw = encodeCheckpoint(game);
  assert.ok(raw);
  const saved = JSON.parse(raw);
  assert.equal(saved.version, 10);
  assert.equal(saved.balance, 3);
  const back = decodeCheckpoint(raw);
  assert.ok(back);
  assert.equal(back.balanceRevision, 3);
  assert.ok(back.lateEggs);
  assert.equal(encodeCheckpoint(back), raw);
  // A version and a revision that do not go together are refused, as is an expedition.
  for (const wrong of [
    { ...saved, balance: 2 },
    { ...saved, version: 9 },
    { ...saved, mission: createMissionRun('refuge', 7, undefined, 2) },
    (({ initialSeed: _, ...rest }) => rest)(saved),
  ])
    assert.equal(decodeCheckpoint(JSON.stringify(wrong)), null);
  // An object that claims the third revision and an expedition at once is not written.
  const expedition = new Game(7, undefined, createMissionRun('trois-ponts', 7, undefined, 2));
  assert.ok(encodeCheckpoint(expedition));
  const forged = new Proxy(expedition, {
    get: (target, key) => (key === 'balanceRevision' ? 3 : Reflect.get(target, key, target)),
  });
  assert.equal(encodeCheckpoint(forged), null);
  // The second revision still writes and reads version 9.
  const second = new Game(2026, undefined, undefined, 2);
  second.initialSeed = 2026;
  assert.equal(JSON.parse(encodeCheckpoint(second)!).version, 9);
  assert.equal(decodeCheckpoint(encodeCheckpoint(second)!)!.balanceRevision, 2);
});

test('le code de départ de la révision 3 porte la règle 5, pour la grande aventure seulement', () => {
  const code = encodeDeparture({ kind: 'classic', seed: 2026, balance: 3 });
  assert.match(code, /^AVENTURE-5-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{2}$/);
  const decoded = decodeDeparture(code);
  assert.ok(decoded.ok && decoded.departure.kind === 'classic');
  assert.deepEqual({ ...decoded.departure }, { kind: 'classic', seed: 2026, balance: 3 });
  // The older codes of the same seed keep their text and their rules.
  assert.match(encodeDeparture({ kind: 'classic', seed: 2026 }), /^AVENTURE-1-/);
  assert.match(encodeDeparture({ kind: 'classic', seed: 2026, balance: 2 }), /^AVENTURE-4-/);
  const game = new Game(2026, undefined, undefined, 3);
  game.initialSeed = 2026;
  assert.equal(encodeDeparture(departureForGame(game)!), code);
  // An expedition written with rule 5, check digits included, was not written by the game.
  const mission = encodeDeparture({ kind: 'mission', run: createMissionRun('trois-ponts', 7) });
  const [word, rule, a, b] = mission.split('-');
  assert.equal(rule, '1');
  const forged = `${word}-5-${a}-${b}-${checkDigits(`${word}-5-${a}${b}`)}`;
  const refusal = decodeDeparture(forged);
  assert.deepEqual(refusal, { ok: false, reason: 'setup' });
  assert.equal(decodeDeparture(mission).ok, true);
});

test('la sauvegarde familiale emporte un camp de la révision 3', () => {
  const game = new Game(2026, undefined, undefined, 3);
  game.initialSeed = 2026;
  const camp = encodeCheckpoint(game)!;
  const raw = writeFamilyBackup(
    camp,
    createCareer().state,
    createMissionProgress(),
    createCapriceAlbumsController().state,
  );
  assert.ok(raw, 'la sauvegarde familiale s’écrit');
  const read = readFamilyBackup(raw);
  assert.ok(read);
  assert.equal(read.version, 5, 'la version qui sait nommer une révision d’équilibrage');
  assert.equal(decodeCheckpoint(read.camp!)!.balanceRevision, 3);
});

test('l’annonce de l’œuf se lit en anglais', () => {
  assert.equal(
    english[TEXT.laVagueDureUnNouvelOeufEstApparu],
    'This wave is taking long… A new egg has appeared!',
  );
});
