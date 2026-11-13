import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { createMissionRun } from '../src/missions.ts';
import { announcedWave, bankSummary, battleOver } from '../src/ui/battleState.ts';
import { campToolModel, hasFighters } from '../src/ui/campToolModel.ts';

test('une bataille est finie quand elle est gagnée ou perdue, pas avant', () => {
  const game = new Game(42);
  assert.equal(battleOver(game), false);
  game.startWave();
  assert.equal(battleOver(game), false);
  game.status = 'won';
  assert.equal(battleOver(game), true);
  game.status = 'lost';
  assert.equal(battleOver(game), true);
});

test('la vague annoncée est la prochaine au camp, la vague en cours au combat', () => {
  const game = new Game(42);
  assert.equal(announcedWave(game), 1);
  game.startWave();
  assert.equal(announcedWave(game), 1);
  game.status = 'preparing';
  game.wave = game.totalWaves;
  assert.equal(announcedWave(game), game.totalWaves, 'jamais au-delà de la dernière vague');
});

test('le résumé de la banque sépare la réserve du caprice et les pièces à dépenser', () => {
  const run = { ...createMissionRun('carrefour', 42), caprice: 'carrefour-createur-petit' };
  const game = new Game(42, undefined, run);
  game.gold = 500;
  assert.ok(game.caprice.reserve > 0);
  assert.equal(
    bankSummary(game),
    `${game.caprice.reserve} à la banque · ${500 - game.caprice.reserve} disponibles`,
  );
});

test('sans allié capable de frapper, l’encouragement ne se propose pas', () => {
  const game = new Game(42);
  assert.equal(hasFighters(game), true);
  game.startWave();
  assert.equal(campToolModel(game, 'encourage').ready, true);
  for (const unit of game.units) unit.hp = 0;
  assert.equal(hasFighters(game), false);
  assert.equal(campToolModel(game, 'encourage').ready, false);
  assert.equal(campToolModel(game, 'encourage').status, 'Aucun allié capable de frapper');
});
