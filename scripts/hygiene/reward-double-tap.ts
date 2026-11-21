// Reproduction (étape d'hygiène, 21 novembre 2026) : dans l'aventure sans fin, les cinq places
// prises, un double appui sur un cadeau neuf remplaçait un cadeau sans choix, et un double
// appui sur « Garder mes cadeaux » passait toute l'offre. Sort en erreur si l'un des deux
// revient.   node --experimental-strip-types scripts/hygiene/reward-double-tap.ts
import { registerHooks } from 'node:module';
registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith('.webp') || url.includes('.mp3') || url.endsWith('.css'))
      return { format: 'module', source: 'export default "x";', shortCircuit: true };
    return nextLoad(url, context);
  },
});
import { doc, El } from './fakedom.ts';
const R = '../../src/';
// la page : le panneau des cadeaux a un <p> d'introduction
const panel = doc.getElementById('reward-panel');
panel.append(new El('p'));
const { Session } = await import(R + 'session.ts');
const { bindRewardControls } = await import(R + 'ui/rewardControls.ts');
const { isLastingBoon } = await import(R + 'boons.ts');
const { giftCopy } = await import(R + 'ui/boonCopy.ts');
const { TAP_HOLD_MS } = await import(R + 'ui/tapHold.ts');

function endVictorious(g: any) {
  g.remaining = 0;
  g.enemies = [];
  g.eggs = [];
  g.step(1 / 30);
}
/** Une aventure sans fin menée jusqu'à cinq cadeaux durables tenus, et une offre avec un cadeau neuf. */
function fiveGifts(seed: number) {
  const s = new Session(1);
  s.restartEndless(seed);
  const g = s.game;
  for (let guard = 0; guard < 400; guard++) {
    if (g.rewards.pending !== null) {
      const offer = g.boonOffer;
      if (g.boons.length >= 5 && offer.some((id: string) => g.boonNeedsPlace(id))) return s;
      const pick =
        offer.find(
          (id: string) =>
            isLastingBoon(id) &&
            !g.boonNeedsPlace(id) &&
            (g.boons.length < 5 ? !g.boonLevel(id) || true : true),
        ) ?? null;
      if (!pick || !g.chooseReward(pick)) g.skipReward();
    }
    g.startWave();
    endVictorious(g);
  }
  return null;
}
let s: any = null,
  seed = 0;
for (seed = 1; seed < 50 && !s; seed++) s = fiveGifts(seed);
const game = s.game;
let refreshes = 0;
const refresh: () => void = () => {
  refreshes++;
  redraw();
};
const redraw = bindRewardControls(s, refresh);
redraw();
const cards = doc.getElementById('reward-cards').children;
const skip = doc.getElementById('skip-reward');
const show = () =>
  `cartes : [${cards
    .filter((c) => !c.hidden)
    .map((c) => c.dataset.reward)
    .join(', ')}] · bouton du bas : « ${skip.textContent} »`;
const held = () => game.boons.map((b: any) => `${b.id}★${b.level}`).join(' ');
console.log(
  `Aventure sans fin, graine ${seed - 1}, ${game.kings} roi(s) vaincu(s), vague ${game.wave}. Cadeaux tenus : ${held()}`,
);
console.log('Avant : ' + show());
const index = cards.findIndex((c) => !c.hidden && game.boonNeedsPlace(c.dataset.reward));
const wanted = cards[index].dataset.reward!;
const under = game.boons[index];
console.log(
  `\n--- Scénario A : double appui sur la carte n° ${index + 1} « ${giftCopy(game, wanted).title} » (cadeau neuf, les 5 places sont prises)`,
);
cards[index].click();
console.log(
  'Après le 1er appui : ' +
    show() +
    ` · titre : « ${doc.getElementById('reward-title').textContent} »`,
);
cards[index].click();
console.log('Après le 2e appui  : ' + show());
console.log(`Cadeaux tenus : ${held()} · offre en attente : ${game.rewards.pending}`);
const lostA = !game.boons.some((b: any) => b.id === under.id);
console.log(
  lostA
    ? `=> DÉFAUT : « ${giftCopy(game, under.id).title} » niveau ${under.level} a été remplacé sans que l'enfant ait choisi.`
    : '=> sain',
);

// --- Scénario B : « Garder mes cadeaux » en double appui
let t: any = null;
for (let sd = seed; sd < 120 && !t; sd++) t = fiveGifts(sd);
const game2 = t.game;
// même page, autre session : on relie les mêmes éléments
const redraw2 = bindRewardControls(t, () => redraw2());
redraw2();
const cards2 = doc.getElementById('reward-cards').children.slice(5);
const index2 = cards2.findIndex((c) => !c.hidden && game2.boonNeedsPlace(c.dataset.reward));
console.log(
  `\n--- Scénario B : appui sur le cadeau neuf « ${cards2[index2].dataset.reward} », puis DOUBLE appui sur « Garder mes cadeaux »`,
);
const before = JSON.stringify(game2.boons);
cards2[index2].click();
const asked = skip.textContent;
console.log(`Bouton du bas : « ${asked} » · offre en attente : ${game2.rewards.pending}`);
// L'attente d'entrée dans la question passe d'abord : le 1er appui doit vraiment en sortir,
// sinon ce scénario n'essaierait pas l'attente posée au retour vers l'offre.
await new Promise((r) => setTimeout(r, TAP_HOLD_MS + 50));
skip.click();
const left = skip.textContent !== asked;
console.log(
  `Après le 1er appui : bouton du bas « ${skip.textContent} » · offre en attente : ${game2.rewards.pending}`,
);
skip.click();
console.log(
  `Après le 2e appui  : offre en attente : ${game2.rewards.pending} · cadeaux ${JSON.stringify(game2.boons) === before ? 'inchangés' : 'changés'} · camp répondu : ${game2.offerAnswered(game2.wave === 0 ? 12 : game2.wave)}`,
);
const lostB = game2.rewards.pending === null || !left;
console.log(
  !left
    ? '=> DÉFAUT du scénario : le 1er appui n’est pas sorti de la question.'
    : lostB
      ? '=> DÉFAUT : l’offre entière est passée (« Continuer sans bonus »), aucun cadeau pour ce camp.'
      : '=> sain',
);
// --- Après un délai (appui voulu, 350 ms plus tard) : le choix doit rester possible
if (game.rewards.pending !== null) {
  await new Promise((r) => setTimeout(r, 350));
  const cardsNow = doc.getElementById('reward-cards').children.slice(0, 5);
  const target = cardsNow.find((c) => !c.hidden)!;
  const label = target.dataset.reward;
  target.click();
  console.log(
    `\n(contrôle) appui voulu 350 ms plus tard sur « ${label} » → offre en attente : ${game.rewards.pending}, cadeaux : ${held()}`,
  );
}

if (lostA || lostB) process.exit(1);
