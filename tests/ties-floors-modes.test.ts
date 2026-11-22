import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith('.webp') || url.includes('.mp3'))
      return { format: 'module', source: 'export default "x";', shortCircuit: true };
    return nextLoad(url, context);
  },
});
const { Game } = await import('../src/game.ts');
const { closerTo } = await import('../src/engine/state.ts');
const { ENDLESS_RULES, endlessStats } = await import('../src/endless.ts');
const { CURRENT_BALANCE_REVISION } = await import('../src/balanceRevision.ts');
const { CRYSTAL_WARD, REWARD_COINS } = await import('../src/gameConstants.ts');
const X = await import('../src/expedition.ts');

// Rules that no test ran on 22 November 2026 (docs/analyse-2026-11-22/D-audit.md, 2.1 and
// 2.2): a tie between two targets, the floor of the coins after many kings, the snakes that
// grow along La Grande Expédition, and the cards for one battle in the endless adventure.

test('between two targets at the very same distance, the oldest fighter is taken', () => {
  const at = (id: number, x: number, y: number) => ({ id, x, y }) as never;
  const origin = { x: 500, y: 300 };
  const older = at(3, 540, 330);
  const younger = at(9, 460, 270);
  assert.ok(closerTo(origin, older, younger) < 0);
  assert.ok(closerTo(origin, younger, older) > 0);
  assert.deepEqual(
    [younger, older].sort((a, b) => closerTo(origin, a, b)),
    [older, younger],
  );
  // Nearer wins over older.
  assert.ok(closerTo(origin, at(9, 510, 300), older) < 0);
});

test('however many kings, a wave of the endless adventure keeps a tenth of its coins', () => {
  const rules = ENDLESS_RULES[1];
  const stats = { hp: 10, damage: 2, reward: 100 };
  // The share shrinks with each king until the floor holds it.
  const share = (kings: number) => endlessStats(stats, rules, kings).reward;
  assert.equal(share(0), 100);
  assert.equal(share(1), Math.round(100 * (1 + rules.coinStep)));
  const kings = Math.ceil(Math.log(0.1) / Math.log(1 + rules.coinStep));
  assert.ok((1 + rules.coinStep) ** kings < 0.1, `the floor acts from king ${kings}`);
  assert.equal(share(kings), 10);
  assert.equal(share(kings + 200), 10);
  assert.ok(share(kings - 1) > 10);
});

test('the snakes of La Grande Expédition grow with each battle won', () => {
  const start = X.startExpedition(4242)!;
  const plan = X.expeditionPlanOf(start)!;
  const stats = { hp: 100, damage: 10, reward: 5 };
  // Version 3: life ×1.07 and bite ×1.035 for each battle won, one on top of the other; the
  // coins never change. The whole road is walked: a growth that stops after the first battle,
  // or that adds instead of multiplying, gives other numbers further on.
  let state = start;
  let battles = 0;
  for (let guard = 0; guard < 100 && state.status === 'travelling'; guard++) {
    const phase = X.expeditionPhase(state);
    if (phase === 'gift') state = X.skipGift(state)!;
    else if (phase === 'roulotte') state = X.leaveRoulotte(state)!;
    else if (phase === 'halt') state = X.chooseHalt(plan, state, 0)!;
    else {
      const won = X.battlesWon(state);
      assert.equal(won, battles);
      const game = X.createExpeditionGame(plan, state, 'calm')!;
      const met = game.strengthen(stats);
      if (won === 0) assert.deepEqual(met, stats, 'the first battle is as written');
      assert.equal(met.hp, 100 * 1.07 ** won, `life after ${won} battle(s)`);
      assert.equal(met.damage, 10 * 1.035 ** won, `bite after ${won} battle(s)`);
      assert.equal(met.reward, 5);
      game.status = 'won';
      state = X.winBattle(plan, state, game, 'calm')!;
      battles += 1;
    }
  }
  assert.equal(state.status, 'arrived');
  assert.equal(battles, X.EXPEDITION_BATTLES);
  assert.ok(battles >= 3);
  // A classic game never touches the numbers.
  assert.equal(new Game(7).strengthen(stats), stats);
});

const endless = (seed: number) =>
  new Game(seed, undefined, undefined, CURRENT_BALANCE_REVISION, undefined, ENDLESS_RULES[1]);
/** Closes the wave as if every snake had fallen: the gift of that wave waits. */
function clearWave(game: InstanceType<typeof Game>, wave: number) {
  game.wave = wave - 1;
  game.status = 'preparing';
  game.rewards.pending = null;
  assert.ok(game.startWave());
  game.remaining = 0;
  game.enemies = [];
  game.eggs = [];
  game.step(1 / 30);
}

test('a card for one battle taken in the endless adventure: coins, crystal guard, ally', () => {
  // The seeds are the first whose offer after wave 4 holds the card.
  for (const [seed, card] of [
    [2, 'pieces'],
    [1, 'cristal'],
    [1, 'renfort-ninja'],
  ] as const) {
    const game = endless(seed);
    clearWave(game, 4);
    assert.ok(game.boonOffer.includes(card), `${card} is offered to seed ${seed}`);
    const [gold, ward, held] = [game.gold, game.rewards.ward, game.boons.length];
    assert.equal(game.chooseReward(card), true, card);
    assert.equal(game.gold, gold + (card === 'pieces' ? REWARD_COINS : 0), card);
    assert.equal(game.rewards.ward, ward + (card === 'cristal' ? CRYSTAL_WARD : 0), card);
    assert.equal(game.boons.length, held, 'a card for one battle takes no place');
    assert.equal(game.rewards.pending, null);
    const taken = game.rewards.choices.at(-1)!;
    assert.equal(taken.id, card);
    assert.equal(taken.milestone, 4);
    // Coins and the guard are spent at once; an offered ally waits to be placed.
    assert.equal(taken.used, card !== 'renfort-ninja', card);
    assert.equal(game.offerAnswered(4), true);
    assert.equal(game.chooseReward(card), false, 'the gift is answered once');
  }
});
