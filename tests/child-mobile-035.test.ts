import test from 'node:test';
import assert from 'node:assert/strict';
import { Session } from '../src/session.ts';
import { Game } from '../src/game.ts';
import { kinds } from '../src/data.ts';
import { DEFAULT_ROSTERS } from '../src/roster.ts';
import { createMissionRun } from '../src/missions.ts';
import { levelForWave, missionLevel } from '../src/levels.ts';
import { lanePoint } from '../src/routes.ts';
import { encodeCheckpoint } from '../src/checkpoints.ts';
import { dockKinds } from '../src/ui/dockModel.ts';
import { feastLaneAtPoint, activateBoard } from '../src/ui/boardActions.ts';

test('les quatre raccourcis suivent les favoris déverrouillés sans les réécrire', () => {
  const game = new Game(35),
    roster = [...DEFAULT_ROSTERS[0]];
  const before = JSON.stringify(game),
    favourites = JSON.stringify(roster);
  assert.deepEqual(dockKinds(game, roster), ['club', 'nurse', 'archer', 'ninja']);
  game.gold = 0;
  assert.deepEqual(dockKinds(game, roster), ['club', 'nurse', 'archer', 'ninja']);
  game.gold = 300;
  assert.equal(JSON.stringify(roster), favourites);
  assert.equal(JSON.stringify(game), before);
});

test('les favoris futurs sont complétés sans héros, doublon ni déverrouillage indu', () => {
  const game = new Game(35);
  const result = dockKinds(game, ['tank', 'hero', 'tank', 'trex']);
  assert.equal(result.length, 4);
  assert.equal(new Set(result).size, 4);
  assert.ok(result.every((kind) => kind !== 'hero' && game.isUnlocked(kind)));
  const late = new Game(35);
  late.wave = 11;
  assert.deepEqual(dockKinds(late, ['tank', 'trex', 'dragon', 'ninja']), [
    'tank',
    'trex',
    'dragon',
    'ninja',
  ]);
});

test('choisir un allié ou un miel est exclusif et ne dépense rien', () => {
  const session = new Session(35);
  const before = JSON.stringify(session.game);
  session.selectUnit('archer');
  session.selectFeast('sticky');
  assert.equal(session.selected, null);
  assert.equal(session.selectedFeast, 'sticky');
  session.selectUnit('club');
  assert.equal(session.selectedFeast, null);
  assert.equal(session.selected, 'club');
  assert.equal(JSON.stringify(session.game), before);
});

test('nouveau Game et redémarrage effacent le geste sans le sérialiser', () => {
  const s = new Session(35),
    before = encodeCheckpoint(s.game);
  s.selectFeast('lure');
  assert.equal(encodeCheckpoint(s.game), before);
  s.useGame(new Game(36));
  assert.equal(s.selectedFeast, null);
  s.selectFeast('sticky');
  s.restart(35);
  assert.equal(s.selectedFeast, null);
  s.selectFeast('sticky');
  s.selectUnit(null);
  assert.equal(s.selectedFeast, null);
});

test('les centres courbes sont reconnus sur toutes les cartes sans consommer le RNG', () => {
  const levels = [
    levelForWave(1),
    levelForWave(5),
    levelForWave(9),
    ...([0, 1, 2] as const).map(missionLevel),
  ];
  for (const level of levels)
    for (const x of [150, 400, 528, 720, 910])
      for (let lane = 0; lane < 3; lane++) {
        const p = lanePoint(x, lane, level);
        assert.equal(feastLaneAtPoint(p, level), lane, level.id + ':' + x);
      }
  const level = levels[0];
  for (const point of [
    { x: 0, y: 180 },
    { x: 1050, y: 324 },
    { x: 700, y: 250 },
    { x: NaN, y: 180 },
    { x: 720, y: Infinity },
  ])
    assert.equal(feastLaneAtPoint(point, level), null);
});

test('aucun milieu entre deux voies courbes ne peut consommer le pot', () => {
  const levels = [
    levelForWave(1),
    levelForWave(5),
    levelForWave(9),
    ...([0, 1, 2] as const).map(missionLevel),
  ];
  for (const level of levels)
    for (let x = 108; x <= 972; x += 4)
      for (let lane = 0; lane < 2; lane++) {
        const a = lanePoint(x, lane, level),
          b = lanePoint(x, lane + 1, level);
        assert.equal(
          feastLaneAtPoint({ x, y: (a.y + b.y) / 2 }, level),
          null,
          `${level.id} x${x} lanes${lane}/${lane + 1}`,
        );
      }
  const session = new Session(35);
  session.game.startWave();
  session.selectFeast('sticky');
  const before = JSON.stringify(session.game);
  assert.equal(activateBoard(session, { x: 240, y: 254 }), false);
  assert.equal(session.game.feastUsed, false);
  assert.equal(JSON.stringify(session.game), before);
});

for (const flavor of ['lure', 'sticky'] as const)
  test(`le toucher ${flavor} envoie exactement la commande existante`, () => {
    const s = new Session(35),
      witness = new Game(35);
    s.game.startWave();
    witness.startWave();
    const gold = s.game.gold;
    s.selectFeast(flavor);
    assert.equal(activateBoard(s, lanePoint(750, 1, s.game.level)), true);
    assert.equal(witness.offerFeast(1, flavor), true);
    assert.deepEqual(s.game, witness);
    assert.equal(s.game.gold, gold);
    assert.equal(s.selectedFeast, null);
    s.selectFeast(flavor);
    assert.equal(activateBoard(s, lanePoint(750, 0, s.game.level)), false);
    assert.equal(s.game.feast?.lane, 1);
  });

test('préparation, pause, hors chemin et voie paisible ne consomment aucun pot', () => {
  const s = new Session(35);
  s.useGame(new Game(35, undefined, createMissionRun('refuge', 35)));
  s.selectFeast('sticky');
  assert.equal(activateBoard(s, lanePoint(750, 1, s.game.level)), false);
  s.game.startWave();
  const before = JSON.stringify(s.game);
  assert.equal(activateBoard(s, lanePoint(750, 0, s.game.level)), false);
  assert.equal(activateBoard(s, { x: 700, y: 250 }), false);
  assert.equal(JSON.stringify(s.game), before);
  s.game.paused = true;
  assert.equal(activateBoard(s, lanePoint(750, 1, s.game.level)), false);
  assert.equal(s.game.feastUsed, false);
  assert.equal(s.selectedFeast, 'sticky');
});

test('la fin de vague annule le geste ; le recrutement garde son vrai coût', () => {
  const s = new Session(35);
  s.game.startWave();
  s.selectFeast('lure');
  s.game.remaining = 0;
  s.game.eggs = [];
  s.game.enemies = [];
  s.advance(40);
  assert.equal(s.game.status, 'preparing');
  assert.equal(s.selectedFeast, null);
  const gold = s.game.gold;
  s.selectUnit('club');
  assert.equal(activateBoard(s, { x: 950, y: 468 }), true);
  assert.equal(s.game.gold, gold - kinds.club.cost);
});
