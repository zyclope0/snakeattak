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
const X = await import('../src/expedition.ts');

// What an expedition draws from its seed, written out. An expedition under way keeps only its
// seed: a draw that moves changes the gifts, the roulotte and the eggs of a child who comes
// back to it. These lists were printed by the game before the draws got their names; a test
// that fails here means saved expeditions no longer play the same.

type State = NonNullable<ReturnType<typeof X.startExpedition>>;
const HELD = [
  { id: 'forge', level: 1 },
  { id: 'miel', level: 2 },
] as State['boons'];

/** The first battle won as it stands: the three gifts wait. */
function firstGifts(seed: number): State {
  const start = X.startExpedition(seed)!;
  const plan = X.expeditionPlanOf(start)!;
  const game = X.createExpeditionGame(plan, start)!;
  game.status = 'won';
  return X.winBattle(plan, start, game)!;
}

const DRAWS: Record<number, { gift: string; again: string; roulotte: string[] }> = {
  4242: {
    gift: 'forge cristal vue',
    again: 'renfort-ninja renfort-bouclier armure',
    roulotte: [
      'solide:200 rente:200 | forge:150 miel:150',
      'solide:200 marche:200 | forge:150 miel:150',
      '| forge:150 miel:150',
    ],
  },
  7: {
    gift: 'forge marche solide',
    again: 'marche pieces forge',
    roulotte: [
      'vue:200 armure:200 | forge:150 miel:150',
      'vue:200 armure:200 | forge:150 miel:150',
      'armure:200 marche:200 | forge:150 miel:150',
    ],
  },
  123456: {
    gift: 'rente solide vue',
    again: 'armure renfort-ninja miel',
    roulotte: [
      'marche:200 | forge:150 miel:150',
      'rente:200 marche:200 | forge:150 miel:150',
      'marche:200 vue:200 | forge:150 miel:150',
    ],
  },
};

test('the gifts after a battle, and the gifts drawn again, are the ones the seed gave', () => {
  for (const [seed, expected] of Object.entries(DRAWS)) {
    const gifts = firstGifts(Number(seed));
    assert.equal(X.giftOffer(gifts)!.join(' '), expected.gift, `gifts of ${seed}`);
    assert.equal(
      X.giftOffer(X.rerollGifts(gifts)!)!.join(' '),
      expected.again,
      `gifts of ${seed} drawn again`,
    );
  }
});

test('the roulotte of each tableau sells what the seed gave', () => {
  const stops = [
    [0, 3],
    [1, 6],
    [2, 3],
  ] as const;
  for (const [seed, expected] of Object.entries(DRAWS)) {
    const held = { ...X.skipGift(firstGifts(Number(seed)))!, boons: HELD };
    const stock = stops.map(([tableau, step]) => {
      const offer = X.roulotteOffer({ ...held, tableau, step, pending: { kind: 'roulotte' } })!;
      const sold = (items: readonly { id: string; price: number }[]) =>
        items.map((item) => `${item.id}:${item.price}`);
      return [...sold(offer.buy), '|', ...sold(offer.climb)].join(' ');
    });
    assert.deepEqual(stock, expected.roulotte, `roulotte of ${seed}`);
  }
});

// One letter for each « Œuf Mystère » of thirty expeditions, a word for each expedition: `p`
// for coins, `f` or `m` when the forge or the honey climbs a level.
const EGGS =
  'pmpppm mpfpp fmppp fppm pf pppp ff fpm ppf pmmm pff fmpppp mpm fpppp fppppm fp ffff pppm ' +
  'ppfp fpfp ffmm pfpp pm fffpm fmfff ff mmpp f mpf fpfpfp';

test('each « Œuf Mystère » holds what the seed gave: coins, or a gift that climbs', () => {
  const words: string[] = [];
  let coins = 0;
  for (let seed = 1; seed <= 30; seed++) {
    const start = X.startExpedition(seed)!;
    const plan = X.expeditionPlanOf(start)!;
    let word = '';
    for (const [tableau, steps] of plan.tableaux.entries())
      for (const [step, at] of steps.entries()) {
        const choice = at.kind === 'halt' ? at.halts.indexOf('oeuf') : -1;
        if (choice < 0) continue;
        const before = { ...start, boons: HELD, tableau, step, pending: null };
        const after = X.chooseHalt(plan, before, choice as 0 | 1)!;
        const climbed = after.boons.find((boon, index) => boon.level !== HELD[index]!.level);
        if (!climbed) coins += X.coinsOf(after) - X.coinsOf(before);
        word += climbed ? climbed.id[0] : 'p';
      }
    words.push(word);
  }
  assert.equal(words.join(' '), EGGS);
  // Every egg without a climb holds the same purse.
  assert.equal(coins, 150 * EGGS.split('p').length - 150);
});
