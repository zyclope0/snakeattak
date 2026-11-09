import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { createMissionRun } from '../src/missions.ts';
import { CAMP_TOOLS, campToolModel, heroTrainingState } from '../src/ui/campToolModel.ts';

test('consulter les quatre outils ne dépense rien et ne touche aucun état du Game ni le RNG', () => {
  const game = new Game(42);
  const before = JSON.stringify(game);
  for (const tool of CAMP_TOOLS) {
    const help = campToolModel(game, tool);
    for (const field of ['title', 'when', 'gesture', 'result', 'status'] as const)
      assert.ok(help[field].length > 0);
  }
  assert.equal(JSON.stringify(game), before);
  const twin = new Game(42);
  game.startWave();
  twin.startWave();
  for (let i = 0; i < 90; i++) {
    for (const tool of CAMP_TOOLS) campToolModel(game, tool);
    game.step(1 / 30);
    twin.step(1 / 30);
  }
  assert.deepEqual(game, twin);
});

test('l’entraînement distingue le classique et les vrais rangs des expéditions', () => {
  const classic = new Game(42);
  classic.wave = 3;
  assert.equal(heroTrainingState(classic).ready, false);
  assert.match(heroTrainingState(classic).status, /après la vague 4/);
  classic.wave = 4;
  assert.equal(heroTrainingState(classic).ready, true);
  for (const [id, ready] of [
    ['refuge', false],
    ['trois-ponts', true],
    ['course', true],
  ] as const) {
    const game = new Game(42, undefined, createMissionRun(id, 42));
    assert.equal(heroTrainingState(game).ready, ready);
    assert.doesNotMatch(heroTrainingState(game).status, /après la vague 4|mission 5/i);
    if (ready) assert.equal(game.trainHero('force'), true);
    else assert.equal(game.trainHero('force'), false);
  }
});

test('le guide ne propose pas d’entraînement au héros mort, entraîné, pauvre ou en combat', () => {
  const game = new Game(42);
  game.wave = 4;
  game.gold = 89;
  assert.equal(heroTrainingState(game).ready, false);
  game.gold = 90;
  assert.equal(heroTrainingState(game).ready, true);
  game.units.find((u) => u.kind === 'hero')!.hp = 0;
  assert.equal(heroTrainingState(game).ready, false);
  assert.match(heroTrainingState(game).status, /tombé/i);
  game.units.find((u) => u.kind === 'hero')!.hp = 100;
  game.campaign.training = 'guard';
  assert.equal(heroTrainingState(game).ready, false);
  assert.match(heroTrainingState(game).status, /Gardien/);
  game.campaign.training = 'none';
  game.startWave();
  assert.equal(heroTrainingState(game).ready, false);
});

test('un héros entraîné puis tombé est annoncé mort sans effacer son entraînement', () => {
  for (const training of ['guard', 'force'] as const) {
    const game = new Game(42);
    game.wave = 4;
    assert.equal(game.trainHero(training), true);
    game.units.find((u) => u.kind === 'hero')!.hp = 0;
    const before = JSON.stringify(game);
    const help = campToolModel(game, 'hero');
    assert.equal(help.ready, false);
    assert.match(help.status, /héros est tombé/i);
    assert.equal(game.campaign.training, training);
    assert.equal(JSON.stringify(game), before);
  }
});

test('l’aide de réparation explique les étoiles seulement en expédition sans modifier le minimum du cristal', () => {
  const game = new Game(42, undefined, createMissionRun('trois-ponts', 42));
  game.base = 75;
  const before = JSON.stringify(game);
  assert.match(
    campToolModel(game, 'repair').result,
    /dégâts subis restent comptés pour tes étoiles/i,
  );
  assert.equal(JSON.stringify(game), before);
  assert.doesNotMatch(campToolModel(new Game(42), 'repair').result, /étoiles/i);
});

test('réparation, miel et encouragement décrivent leurs vrais effets et états', () => {
  const game = new Game(42);
  assert.equal(campToolModel(game, 'repair').ready, false);
  assert.match(campToolModel(game, 'repair').status, /intact/i);
  game.base = 90;
  assert.equal(campToolModel(game, 'repair').ready, true);
  assert.match(campToolModel(game, 'repair').result, /25/);
  assert.equal(campToolModel(game, 'repair').cost, 80);
  assert.equal(campToolModel(game, 'hero').cost, 90);
  assert.equal(campToolModel(game, 'honey').cost, 0);
  assert.equal(campToolModel(game, 'encourage').cost, 0);
  game.gold = 79;
  assert.equal(campToolModel(game, 'repair').ready, false);
  assert.equal(campToolModel(game, 'encourage').ready, false);
  game.startWave();
  assert.equal(campToolModel(game, 'honey').ready, true);
  assert.equal(campToolModel(game, 'encourage').ready, true);
  assert.match(campToolModel(game, 'encourage').result, /8 s/);
  game.encourage();
  assert.equal(campToolModel(game, 'encourage').ready, false);
  game.encouragementUsed = false;
  game.encouragementRemaining = 0;
  for (const unit of game.units) unit.hp = 0;
  assert.equal(campToolModel(game, 'encourage').ready, false);
  assert.match(campToolModel(game, 'encourage').status, /aucun allié/i);
  game.feastUsed = true;
  assert.equal(campToolModel(game, 'honey').ready, false);
  game.status = 'lost';
  assert.equal(campToolModel(game, 'repair').ready, false);
});
