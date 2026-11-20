import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { CURRENT_BALANCE_REVISION } from '../src/balanceRevision.ts';
import { waveStats } from '../src/data.ts';
import { ENDLESS_RULES, endlessStats, endlessWave, readEndlessRules } from '../src/endless.ts';
import { TOTAL_WAVES } from '../src/gameConstants.ts';
import { Game } from '../src/game.ts';
import { createMissionRun } from '../src/missions.ts';
import { rewardOffer } from '../src/rewards.ts';

registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith('.webp'))
      return {
        format: 'module',
        source: `export default ${JSON.stringify(url)};`,
        shortCircuit: true,
      };
    return nextLoad(url, context);
  },
});

const RULES = ENDLESS_RULES[1];
const endless = (seed = 7) =>
  new Game(seed, undefined, undefined, CURRENT_BALANCE_REVISION, undefined, RULES);

/** Plays the wave `wave` as if every snake had fallen at once: the wave closes. */
function clearWave(game: Game, wave: number) {
  game.wave = wave - 1;
  game.status = 'preparing';
  game.rewards.pending = null;
  assert.ok(game.startWave(), `wave ${wave} starts`);
  game.remaining = 0;
  game.enemies = [];
  game.eggs = [];
  game.step(1 / 30);
}

test('l’aventure sans fin ne se joue qu’avec la révision courante, sans mission', () => {
  assert.throws(
    () => new Game(7, undefined, undefined, CURRENT_BALANCE_REVISION - 1, undefined, RULES),
  );
  assert.throws(
    () => new Game(7, undefined, createMissionRun('refuge', 7, null, 2), 2, undefined, RULES),
  );
  assert.throws(
    () =>
      new Game(7, undefined, undefined, CURRENT_BALANCE_REVISION, undefined, {
        ...RULES,
        hpStep: -1,
      }),
  );
  assert.equal(readEndlessRules({ ...RULES, version: 2 }), null);
  // Every other game stays at zero kings and has no endless rules.
  const classic = new Game(7);
  assert.equal(classic.endless, null);
  assert.throws(() => (classic.kings = 1));
});

test('après King Snake, le même camp repart à la vague 1 avec un roi de plus et un cadeau', () => {
  const game = endless();
  const allies = game.units.map((u) => u.id);
  game.campaign.training = 'force';
  clearWave(game, TOTAL_WAVES);
  assert.equal(game.status, 'preparing');
  assert.equal(game.kings, 1);
  assert.equal(game.wave, 0);
  assert.deepEqual(
    game.units.map((u) => u.id),
    allies,
  );
  assert.equal(game.campaign.training, 'force', 'the hero keeps his training');
  assert.deepEqual(game.campaign.chapterStars, [0, 0, 0]);
  assert.equal(game.rewards.pending, TOTAL_WAVES);
  assert.deepEqual(game.rewardOffer, rewardOffer(game.rewards.seed, TOTAL_WAVES, 1));
  assert.ok(game.chooseReward(game.rewardOffer[0]));
  assert.equal(game.rewards.choices.at(-1)!.round, 1);
  assert.equal(endlessWave(game.kings, game.wave + 1), TOTAL_WAVES + 1);
});

test('chaque tour offre de nouveau les cadeaux des vagues 4 et 8, tirés à part', () => {
  const game = endless();
  clearWave(game, 4);
  const first = game.rewardOffer;
  assert.ok(game.chooseReward(first[0]));
  assert.equal(game.rewards.choices[0].round, undefined, 'round zero writes nothing');
  clearWave(game, TOTAL_WAVES);
  game.skipReward();
  clearWave(game, 4);
  assert.equal(game.rewards.pending, 4, 'the second round offers wave 4 again');
  assert.deepEqual(game.rewardOffer, rewardOffer(game.rewards.seed, 4, 1));
  // Round zero draws exactly as before the endless adventure existed.
  assert.deepEqual(first, rewardOffer(game.rewards.seed, 4));
});

test('les serpents d’un tour sont plus forts, jamais plus nombreux', () => {
  const base = waveStats(5);
  assert.deepEqual(endlessStats(base, RULES, 0), base);
  assert.deepEqual(endlessStats(base, null, 3), base);
  const strong = endlessStats(base, RULES, 2);
  assert.equal(strong.count, base.count);
  assert.equal(strong.hp, base.hp * (1 + 2 * RULES.hpStep));
  assert.equal(strong.damage, base.damage * (1 + 2 * RULES.biteStep));
  // In the game: the first snake of round two is as much stronger.
  const game = endless();
  clearWave(game, TOTAL_WAVES);
  game.rewards.pending = null;
  assert.ok(game.startWave());
  for (let i = 0; i < 60 && !game.enemies.length; i++) game.step(1 / 30);
  const snake = game.enemies[0];
  assert.ok(snake, 'a snake entered');
  const plain = new Game(7);
  assert.ok(plain.startWave());
  for (let i = 0; i < 60 && !plain.enemies.length; i++) plain.step(1 / 30);
  assert.equal(game.remaining, plain.remaining, 'same number of snakes');
  assert.ok(
    Math.abs(snake.maxHp / plain.enemies[0].maxHp - (1 + RULES.hpStep)) < 1e-9,
    'life grows by one step',
  );
});
