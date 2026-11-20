import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { CURRENT_BALANCE_REVISION } from '../src/balanceRevision.ts';
import { decodeCheckpoint, encodeCheckpoint } from '../src/checkpoints.ts';
import { waveStats } from '../src/data.ts';
import { ENDLESS_RULES, endlessStats, endlessWave, readEndlessRules } from '../src/endless.ts';
import { TOTAL_WAVES } from '../src/gameConstants.ts';
import { Game } from '../src/game.ts';
import { createMissionRun } from '../src/missions.ts';
import { BOON_MAX_LEVEL, BOON_PLACES, BOON_STEPS, boonOffer, takeBoon } from '../src/boons.ts';
import type { Boons, LastingBoon } from '../src/boons.ts';

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
  assert.throws(() => new Game(7, undefined, undefined, 6, undefined, RULES));
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
  assert.deepEqual(game.rewardOffer, [], 'the endless adventure offers gifts, not cards');
  assert.deepEqual(game.boonOffer, boonOffer(game.rewards.seed, 1, TOTAL_WAVES, []));
  assert.ok(game.chooseReward(game.boonOffer[0]));
  assert.equal(game.rewards.pending, null);
  assert.equal(endlessWave(game.kings, game.wave + 1), TOTAL_WAVES + 1);
});

test('chaque tour offre de nouveau un cadeau après les vagues 4 et 8, tiré à part', () => {
  const game = endless();
  clearWave(game, 4);
  const first = game.boonOffer;
  assert.equal(first.length, 3);
  assert.ok(game.skipReward());
  clearWave(game, 4);
  assert.equal(game.rewards.pending, null, 'one gift per camp and round');
  clearWave(game, TOTAL_WAVES);
  game.skipReward();
  clearWave(game, 4);
  assert.equal(game.rewards.pending, 4, 'the second round offers wave 4 again');
  assert.deepEqual(game.boonOffer, boonOffer(game.rewards.seed, 1, 4, []));
  assert.notDeepEqual(game.boonOffer, first);
});

test('un cadeau repris monte de niveau, trois au plus ; cinq places', () => {
  let boons: Boons = [];
  for (const id of ['forge', 'forge', 'forge'] as const) boons = takeBoon(boons, id)!;
  assert.deepEqual(boons, [{ id: 'forge', level: BOON_MAX_LEVEL }]);
  assert.equal(takeBoon(boons, 'forge'), null, 'never above the top level');
  assert.ok(!boonOffer(1, 0, 4, boons).includes('forge'), 'a full gift is not offered');
  for (const id of ['armure', 'marche', 'rente', 'solide'] as const) boons = takeBoon(boons, id)!;
  assert.equal(boons.length, BOON_PLACES);
  assert.equal(takeBoon(boons, 'vue'), null, 'five places: a sixth needs a place');
  assert.deepEqual(
    takeBoon(boons, 'vue', 'rente')!.map((b) => b.id),
    ['forge', 'armure', 'marche', 'vue', 'solide'],
  );
  assert.equal(takeBoon(boons, 'armure')![1].level, 2, 'climbing a level needs no place');
});

test('les cadeaux changent le camp : forge, armure, marché, rente, cristal, longue-vue, miel', () => {
  const game = endless();
  // Hands a gift as if it had been offered; the round goes back to the first one.
  const give = (id: LastingBoon) => {
    const taken = takeInGame(game, id);
    game.kings = 0;
    return taken;
  };
  const hero = game.units.find((u) => u.kind === 'hero')!;
  const life = hero.maxHp;
  assert.ok(give('armure'));
  assert.equal(hero.maxHp, life * (1 + BOON_STEPS.armure), 'allies in the camp grow');
  const price = game.recruitCost('archer');
  assert.ok(give('marche'));
  assert.equal(game.recruitCost('archer'), Math.round(price * (1 - BOON_STEPS.marche)));
  const honey = game.feastDuration;
  assert.ok(give('miel'));
  assert.equal(game.feastDuration, honey + BOON_STEPS.miel);
  assert.ok(give('rente'));
  assert.ok(give('solide'));
  game.base = 50;
  const gold = game.gold;
  clearWave(game, 1);
  assert.equal(game.gold, gold + waveStats(1).reward + BOON_STEPS.rente);
  assert.equal(game.base, 50 + BOON_STEPS.solide);
  // A classic game has no gift: level zero everywhere.
  assert.equal(new Game(7).boonLevel('forge'), 0);
});

/** Takes a gift through the game, drawing offers until it comes. */
function takeInGame(game: Game, id: LastingBoon): boolean {
  for (let round = 0; round < 400; round++) {
    game.rewards.pending = 4;
    if (game.boonOffer.includes(id)) return game.chooseReward(id);
    game.kings++;
  }
  return false;
}

test('les serpents d’un tour sont plus forts, jamais plus nombreux', () => {
  const base = waveStats(5);
  assert.deepEqual(endlessStats(base, RULES, 0), base);
  assert.deepEqual(endlessStats(base, null, 3), base);
  const strong = endlessStats(base, RULES, 2);
  assert.equal(strong.count, base.count);
  assert.equal(strong.hp, base.hp * (1 + RULES.hpStep) ** 2);
  assert.equal(strong.damage, base.damage * (1 + RULES.biteStep) ** 2);
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

test('un camp de l’aventure sans fin se sauvegarde et se relit tel quel', () => {
  const game = endless();
  clearWave(game, 4);
  assert.ok(game.chooseReward(game.boonOffer[0]));
  clearWave(game, TOTAL_WAVES);
  assert.ok(game.chooseReward(game.boonOffer[0]));
  clearWave(game, 4);
  const raw = encodeCheckpoint(game)!;
  assert.ok(raw, 'an endless camp is saved');
  const saved = JSON.parse(raw);
  assert.equal(saved.version, 15);
  assert.equal(saved.kings, 1);
  const back = decodeCheckpoint(raw)!;
  assert.ok(back, 'and read back');
  assert.equal(back.kings, 1);
  assert.deepEqual(back.boons, game.boons);
  assert.equal(back.rewards.pending, 4);
  assert.deepEqual(back.boonOffer, game.boonOffer);
  assert.equal(encodeCheckpoint(back), raw, 'the same camp, written the same way');
  // A save that claims more gifts than camps answered, or a level too high, is refused.
  const tamper = (change: (save: Record<string, unknown>) => void) => {
    const copy = JSON.parse(raw);
    change(copy);
    return decodeCheckpoint(JSON.stringify(copy));
  };
  assert.equal(
    tamper(
      (s) =>
        (s.boons = [
          { id: 'forge', level: 3 },
          { id: 'armure', level: 3 },
        ]),
    ),
    null,
  );
  assert.equal(
    tamper((s) => (s.boons = [{ id: 'forge', level: 4 }])),
    null,
  );
  assert.equal(
    tamper((s) => (s.kings = -1)),
    null,
  );
  assert.equal(
    tamper((s) => (s.endless = 2)),
    null,
  );
  // A camp of a classic game is never read as an endless one.
  const classic = new Game(7);
  clearWave(classic, 4);
  classic.skipReward();
  assert.equal(decodeCheckpoint(encodeCheckpoint(classic)!)!.endless, null);
});

test('« Rentrer avec mon record » : seulement dans le camp d’après un roi, cadeau choisi', () => {
  const game = endless();
  assert.equal(game.retire(), false, 'not before a king');
  clearWave(game, TOTAL_WAVES);
  assert.equal(game.retire(), false, 'not before the gift is chosen');
  assert.ok(game.skipReward());
  assert.ok(game.retire());
  assert.equal(game.status, 'won');
  assert.equal(game.startWave(), false, 'the game is over');
  assert.equal(new Game(7).retire(), false, 'never in another game');
});
