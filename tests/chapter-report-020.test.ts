import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { Session } from '../src/session.ts';
import { kinds } from '../src/data.ts';
import type { Kind } from '../src/data.ts';
import { decodeCheckpoint, encodeCheckpoint } from '../src/checkpoints.ts';
import { chapterReportFor, createChapterReportObserver } from '../src/chapterReport.ts';

function fight(wave: number, seed = 20) {
  const game = new Game(seed);
  game.wave = wave - 1;
  assert.equal(game.startWave(), true);
  return game;
}

function finish(game: Game) {
  game.remaining = 0;
  game.enemies = [];
  game.eggs = [];
  game.step(0.05);
  return game;
}

test('0.20 : le bilan décrit le chapitre vraiment gagné, même quand le camp a déjà changé de terrain', () => {
  for (const [wave, chapter, terrainName] of [
    [4, 1, 'La clairière des fougères'],
    [8, 2, 'Le bosquet ambré'],
    [12, 3, 'Le jardin des vieilles pierres'],
  ] as const) {
    const game = fight(wave);
    game.campaign.chapterMin[chapter - 1] = 73;
    game.base = 92;
    game.kills = 37;
    finish(game);
    const before = JSON.stringify(game);
    assert.deepEqual(chapterReportFor(game), {
      chapter,
      wave,
      terrainName,
      stars: 2,
      crystalMinimum: 73,
      crystalCurrent: 92,
      alliesPresent: 3,
      killsSinceAdventureStart: 37,
      army: [
        { kind: 'club', name: 'Massue', count: 2 },
        { kind: 'hero', name: 'Héros', count: 1 },
      ],
    });
    assert.equal(JSON.stringify(game), before, 'lecture sans effet moteur, RNG ou récompense');
  }
});

test('0.20 : pas de bilan au camp initial, en combat, en défaite ou sans étoiles gagnées', () => {
  const game = new Game(20);
  assert.equal(chapterReportFor(game), null);
  for (const wave of [1, 3, 5, 7, 9, 11]) {
    game.wave = wave;
    game.campaign.chapterStars = [3, 3, 3];
    assert.equal(chapterReportFor(game), null);
  }
  for (const wave of [4, 8, 12]) {
    game.wave = wave;
    game.status = 'preparing';
    game.campaign.chapterStars = [0, 0, 0];
    assert.equal(chapterReportFor(game), null);
    game.campaign.chapterStars = [3, 3, 3];
    for (const status of ['fighting', 'lost'] as const) {
      game.status = status;
      assert.equal(chapterReportFor(game), null);
    }
  }
  game.wave = 12;
  game.status = 'preparing';
  assert.equal(chapterReportFor(game), null, 'un faux camp final ne vaut pas une victoire');
  game.wave = 4;
  game.status = 'won';
  assert.equal(chapterReportFor(game), null, 'won ne légitime pas une frontière intermédiaire');
});

test('0.20 : les alliés présents sont regroupés par vrais types du catalogue, sans MVP ni morts', () => {
  const game = finish(fight(8));
  const template = game.units[0];
  game.units = (Object.keys(kinds) as Kind[]).map((kind, index) => ({
    ...template,
    id: 100 + index,
    kind,
  }));
  game.units.push({ ...template, id: 200, kind: 'ninja' });
  game.units.push({ ...template, id: 201, kind: 'dragon', hp: 0 });
  const before = JSON.stringify(game);
  const report = chapterReportFor(game)!;
  assert.equal(report.alliesPresent, 23);
  assert.equal(report.army.length, 22, 'la liste est bornée par les 22 types réels');
  assert.deepEqual(
    report.army.find((unit) => unit.kind === 'ninja'),
    {
      kind: 'ninja',
      name: 'Ninja',
      count: 2,
    },
  );
  assert.deepEqual(
    report.army.find((unit) => unit.kind === 'dragon'),
    {
      kind: 'dragon',
      name: 'Bébé dragon',
      count: 1,
    },
  );
  assert.equal(JSON.stringify(game), before);
  game.units = [];
  assert.equal(report.alliesPresent, 23, 'le bilan ne partage pas un tableau mutable du moteur');
  assert.equal(chapterReportFor(game)!.alliesPresent, 0);
});

test('0.20 : les étoiles sont celles du passage courant et la pause ne masque pas le bilan', () => {
  const game = fight(4);
  game.campaign.chapterMin[0] = 51;
  finish(game);
  game.paused = true;
  assert.equal(chapterReportFor(game)?.stars, 1);
  assert.equal(chapterReportFor(game)?.crystalMinimum, 51);
});

test('0.20 : une transition observée de la même vague fête une fois la vraie victoire', () => {
  for (const wave of [4, 8, 12]) {
    const observe = createChapterReportObserver();
    const game = fight(wave);
    assert.deepEqual(observe(game), { report: null, fresh: false });
    finish(game);
    const before = JSON.stringify(game);
    assert.equal(observe(game).fresh, true);
    assert.equal(observe(game).fresh, false);
    game.paused = true;
    assert.equal(observe(game).fresh, false);
    assert.equal(JSON.stringify(game), before.replace('"paused":false', '"paused":true'));
  }
});

test('0.20 : reprise, première observation tardive et nouvelle instance restent statiques', () => {
  const observe = createChapterReportObserver();
  const won = finish(fight(4));
  const raw = encodeCheckpoint(won)!;
  assert.ok(raw);
  const restored = decodeCheckpoint(raw)!;
  assert.ok(restored);
  assert.equal(observe(restored).report?.chapter, 1);
  assert.equal(observe(restored).fresh, false);
  const session = new Session(20);
  session.useGame(fight(8));
  observe(session.game);
  session.useGame(finish(fight(8, 21)));
  assert.equal(observe(session.game).fresh, false, 'autre Game malgré la même vague');
  session.restart(22);
  assert.deepEqual(observe(session.game), { report: null, fresh: false });
  assert.equal(observe(finish(fight(12))).fresh, false, 'première lecture finale statique');
});

test('0.20 : une vague non observée ou un faux camp sans étoiles ne déclenchent aucune fête', () => {
  const observe = createChapterReportObserver();
  const game = fight(3);
  observe(game);
  finish(game);
  assert.equal(game.startWave(), true);
  finish(game);
  assert.equal(observe(game).fresh, false, 'vague 4 combattue entre deux observations');
  game.status = 'fighting';
  game.campaign.chapterStars[0] = 0;
  observe(game);
  game.status = 'preparing';
  assert.deepEqual(observe(game), { report: null, fresh: false });
});

test('0.20 : un ancien camp ne transforme pas son minimum synthétique en mesure historique', () => {
  const game = finish(fight(4));
  game.base = 41;
  const original = JSON.parse(encodeCheckpoint(game)!);
  for (const version of [1, 2, 3]) {
    const restored = decodeCheckpoint(JSON.stringify({ ...original, version }))!;
    assert.ok(restored);
    const before = JSON.stringify(restored);
    const report = chapterReportFor(restored)!;
    assert.equal(report.stars, 1);
    assert.equal(report.crystalCurrent, 41);
    assert.equal(report.crystalMinimum, null, 'le minimum ancien n’était pas mesuré');
    assert.equal(JSON.stringify(restored), before);
  }
});
