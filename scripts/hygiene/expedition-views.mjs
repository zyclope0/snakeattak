// Les écrans de l'expédition demandent leurs règles au modèle (`src/expedition.ts`). Les
// tests du modèle tiennent ces règles ; cette recette tient leur BRANCHEMENT dans les vues :
// une négation perdue ou une condition oubliée dans `expeditionViews.ts` se verrait ici, pas
// dans le modèle. Elle rend les vues avec un faux DOM, dans son propre processus.
//   node --experimental-strip-types scripts/hygiene/expedition-views.mjs
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { install, dump } from './view-dom.mjs';

registerHooks({
  load(url, context, nextLoad) {
    if (/\.(webp|png|svg|jpg|css)(\?.*)?$/.test(url) || url.includes('.mp3'))
      return { format: 'module', source: 'export default "x";', shortCircuit: true };
    return nextLoad(url, context);
  },
});
install();
const X = await import('../../src/expedition.ts');
const B = await import('../../src/boons.ts');
const V = await import('../../src/ui/voyage/expedition/expeditionViews.ts');

const actions = Object.fromEntries(
  [
    'play',
    'explain',
    'halt',
    'gift',
    'reroll',
    'skip',
    'buy',
    'leave',
    'replace',
    'other',
    'fresh',
  ].map((name) => [name, () => {}]),
);
/** Every element of a rendered view, as plain data. */
function all(nodes) {
  const found = [];
  const walk = (node) => {
    if (typeof node === 'string') return;
    found.push(node);
    for (const kid of node.kids ?? []) walk(kid);
  };
  for (const node of nodes.map(dump)) walk(node);
  return found;
}
const withClass = (nodes, name) =>
  all(nodes).filter((node) => (node.cls ?? '').split(' ').includes(name));
const SEED = 4242;
const plan = X.planExpedition(SEED);
const start = X.startExpedition(SEED);
const win = (state, path) => {
  const game = X.createExpeditionGame(plan, state, path);
  game.status = 'won';
  return X.winBattle(plan, state, game, path);
};
const gift = win(start);
const fork = X.skipGift(gift);
let checks = 0;
const check = (value, label) => {
  assert.ok(value, label);
  checks++;
};

// 1. « Les serpents grandissent » : not before the first battle, said from the second on.
check(
  withClass(V.mapView(start, '', 0, actions), 'exp-grow').length === 0,
  'no growth line at the start',
);
check(
  withClass(V.mapView(fork, '', 0, actions), 'exp-grow').length === 1,
  'the growth line from the second battle',
);

// 2. A gift is promised on every battle card, except King Snake's: he ends the expedition.
const lastTableau = plan.tableaux.length - 1;
const beforeKing = { ...fork, tableau: lastTableau, step: X.STEPS_PER_TABLEAU - 1 };
const beforeGuardian = { ...fork, tableau: 0, step: X.STEPS_PER_TABLEAU - 1 };
check(
  withClass(V.mapView(beforeKing, '', 0, actions), 'exp-reward').length === 0,
  'no gift promised after King Snake',
);
check(
  withClass(V.mapView(beforeGuardian, '', 0, actions), 'exp-reward').length === 1,
  'a gift promised after the first guardian',
);
const forkRewards = withClass(V.mapView(fork, '', 0, actions), 'exp-reward');
check(forkRewards.length === 2, 'a gift promised on both paths of a fork');
check(
  forkRewards.filter((node) => node.data && 'rare' in node.data).length === 1,
  'the brave path alone promises a rare gift',
);

// 3. « Cadeau rare » : said only when the offer is rare AND holds something that counts twice.
const offerOf = (state) => X.giftOffer(state);
const rare = { ...gift, pending: { kind: 'gift', rare: true, rerolled: false } };
const plainOffer = { ...gift, pending: { kind: 'gift', rare: false, rerolled: false } };
check(offerOf(rare).some(X.countsTwice), 'this rare offer holds a gift that counts twice');
check(withClass(V.giftView(rare, null, actions), 'exp-rare').length === 1, 'a rare offer says so');
check(
  withClass(V.giftView(plainOffer, null, actions), 'exp-rare').length === 0,
  'an offer that is not rare says nothing',
);
// An offer of cards for the next battle only: found among the seeds, with five gifts at the top.
const top = B.LASTING_BOONS.slice(0, X.EXPEDITION_GIFT_RULES.places).map((id) => ({
  id,
  level: X.EXPEDITION_GIFT_RULES.maxLevel,
}));
let onceOnly = null;
for (let seed = 1; seed < 4000 && !onceOnly; seed++) {
  const state = { ...rare, seed, boons: top };
  if (!X.planExpedition(seed)) continue;
  if (!offerOf(state).some(X.countsTwice)) onceOnly = state;
}
check(onceOnly, 'a rare offer with nothing that counts twice exists');
check(
  withClass(V.giftView(onceOnly, null, actions), 'exp-rare').length === 0,
  'a rare offer of one-battle cards does not say « rare »',
);

// 4. A plain « Choisir » is marked (a low screen may hide it); a level or a price never is.
const cardsOf = (nodes) => withClass(nodes, 'bonus-card');
const plainCards = (nodes) => cardsOf(nodes).filter((card) => card.data && 'plain' in card.data);
const offer = offerOf(plainOffer);
const expectedPlain = offer.filter(
  (id) => !B.isLastingBoon(id) || !B.boonLevel(plainOffer.boons, id),
).length;
check(
  plainCards(V.giftView(plainOffer, null, actions)).length === expectedPlain,
  'new gifts at level 1 are plain',
);
const rareLasting = offerOf(rare).filter((id) => B.isLastingBoon(id)).length;
check(
  plainCards(V.giftView(rare, null, actions)).length === offerOf(rare).length - rareLasting,
  'a rare lasting gift says its level: not plain',
);

// 5. The roulotte: a card is out of reach exactly when the coins do not pay its price; a
// price on a card is never « plain ».
const shop = (coins) => ({
  ...fork,
  pending: { kind: 'roulotte' },
  camp: { ...fork.camp, gold: coins },
});
const stock = X.roulotteOffer(shop(0));
const prices = [...stock.buy, ...stock.climb].map((item) => item.price);
check(prices.length > 0, 'the roulotte sells something');
for (const coins of [0, Math.min(...prices) - 1, Math.min(...prices), Math.max(...prices), 9999]) {
  const cards = cardsOf(V.roulotteView(shop(coins), null, actions));
  check(cards.length === prices.length, 'one card per thing sold');
  for (const [index, card] of cards.entries())
    check(
      !!card.props?.disabled === coins < prices[index],
      `${coins} coins, a price of ${prices[index]}`,
    );
  check(
    plainCards(V.roulotteView(shop(coins), null, actions)).length === 0,
    'a priced card is not plain',
  );
}
// A gift held climbs one level at the roulotte: the card says the level it reaches.
const held = { ...shop(9999), boons: [{ id: 'forge', level: 1 }] };
const climb = cardsOf(V.roulotteView(held, null, actions)).map((card) => JSON.stringify(card));
check(
  climb.some((text) => /[Nn]iveau 2/.test(text)),
  'a gift held at level 1 is sold as level 2',
);

console.log(JSON.stringify({ recipe: 'expedition-views', checks }));
