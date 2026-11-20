import kingUrl from '../../../assets/home/menu-classique.webp';
import { BOON_RULES, isLastingBoon } from '../../../boons.ts';
import type { BoonId, LastingBoon } from '../../../boons.ts';
import { capriceDefinitionForRun } from '../../../caprices.ts';
import type { CapriceDefinition } from '../../../caprices.ts';
import { expeditionPlanOf, giftOffer, roulotteOffer } from '../../../expedition.ts';
import type { Battle, ExpeditionState, HaltKind, Path } from '../../../expedition.ts';
import { setAttribute, setText } from '../../../i18n/dom.ts';
import { missionById } from '../../../missions.ts';
import { activeEnemyLanes } from '../../../tutorial.ts';
import { BOON_SIGNS } from '../../boonCopy.ts';
import { frenchLeaf } from '../../capriceCopy.ts';
import { stickerGraphic } from '../../capriceIcons.ts';
import { decoration, make } from '../../dom.ts';
import { svgNode } from '../../svg.ts';
import { stopMap } from '../stopMap.ts';
import { bonusPicture } from '../voyageBag.ts';
import {
  arrivedLine,
  campWords,
  capriceLabel,
  coinsLine,
  giftsLabel,
  giftWords,
  GUARDIAN_NAMES,
  HALT_NAMES,
  haltPromise,
  heldWords,
  PATH_NAMES,
  recordLine,
  stepStates,
  stepWords,
  TABLEAU_NAMES,
} from './expeditionWords.ts';
import type { StepState } from './expeditionWords.ts';
import * as TEXT from '../../../texts/fr/expedition.ts';
import { fill } from '../../../texts/fill.ts';

/** What the buttons of the views ask for; the expedition itself decides what happens. */
export type ExpeditionActions = {
  play: (path?: Path) => void;
  explain: (caprice: CapriceDefinition) => void;
  halt: (choice: 0 | 1) => void;
  gift: (id: BoonId) => void;
  reroll: () => void;
  skip: () => void;
  buy: (id: LastingBoon) => void;
  leave: () => void;
  /** The gift the child gives up for the new one; null keeps every gift. */
  replace: (old: LastingBoon | null) => void;
  other: () => void;
  fresh: () => void;
};

/** A node's classes, one word each: the words of the page stay in src/texts. */
function withClasses<T extends HTMLElement>(node: T, ...names: string[]): T {
  node.classList.add(...names);
  return node;
}

function button(id: string | undefined, classes: string[], text: string, run: () => void) {
  const node = withClasses(make('button', { id, text }), ...classes);
  node.type = 'button';
  node.onclick = run;
  return node;
}

/** A tick drawn in the page, for the steps already passed. */
function tick() {
  return svgNode(
    'svg',
    {
      viewBox: '0 0 32 32',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 4.5,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    },
    svgNode('path', { d: 'm7 16 6 7L26 9' }),
  );
}

/** The seven steps of the tableau: five missions (the last is the guardian) and two halts. */
function trail(state: ExpeditionState) {
  const tableau = expeditionPlanOf(state).tableaux[state.tableau];
  const states = stepStates(state);
  const list = make('ol', { className: 'exp-trail' });
  let battle = 0;
  for (const [index, step] of tableau.entries()) {
    const kind =
      step.kind === 'halt'
        ? 'halt'
        : step.kind === 'battle' && step.battle.king
          ? 'guardian'
          : 'battle';
    if (kind !== 'halt') battle++;
    const words = stepWords(state, index, states[index]);
    const mark = decoration('span', 'exp-mark');
    if (states[index] === 'done') mark.append(tick());
    else if (kind !== 'halt') mark.textContent = String(battle);
    const item = make(
      'li',
      { className: 'exp-step' },
      mark,
      make('span', { className: 'sr-only', text: words.name }),
      make('span', { className: 'sr-only', text: words.state }),
    );
    item.dataset.kind = kind;
    item.dataset.state = states[index] satisfies StepState;
    if (states[index] === 'next') item.setAttribute('aria-current', 'step');
    list.append(item);
  }
  const where = make('span', {
    className: 'exp-where',
    text: fill(TEXT.tableauNSurN, state.tableau + 1, TABLEAU_NAMES.length),
  });
  return make('div', { className: 'exp-road' }, where, list);
}

/** The sticker of the caprice that surprises a mission: shown in advance, and a button. */
function sticker(caprice: CapriceDefinition, explain: ExpeditionActions['explain']) {
  const node = make('button', { className: 'stop-caprice' }, stickerGraphic(caprice));
  node.type = 'button';
  node.setAttribute('aria-haspopup', 'dialog');
  setAttribute(node, 'aria-label', capriceLabel(caprice.name));
  node.onclick = () => explain(caprice);
  return node;
}

function king() {
  const picture = make('img', { className: 'exp-king' });
  picture.src = kingUrl;
  picture.alt = '';
  return picture;
}

/**
 * A mission to play: its name, its small map, the caprice that will surprise it, the gift it
 * promises, and its button. `title` is the path's name at a fork.
 */
function battleCard(
  state: ExpeditionState,
  battle: Battle,
  title: string,
  go: () => void,
  explain: ExpeditionActions['explain'],
) {
  const lanes = activeEnemyLanes(battle.run, 1);
  const card = make('article', { className: 'exp-card' });
  card.dataset.path = battle.path;
  const head = make('h3', { text: title });
  const map = make('span', { className: 'stop-map' }, stopMap(battle.run, lanes));
  const facts = make('div', { className: 'exp-facts' });
  facts.append(make('strong', { text: missionById(battle.run.missionId)!.name }));
  if (battle.king) {
    facts.append(
      make(
        'span',
        { className: 'exp-guardian' },
        king(),
        make('span', { text: GUARDIAN_NAMES[state.tableau] }),
      ),
    );
  }
  const caprice = capriceDefinitionForRun(battle.run);
  if (caprice)
    facts.append(
      make(
        'span',
        { className: 'exp-caprice' },
        sticker(caprice, explain),
        frenchLeaf('span', caprice.name),
      ),
    );
  const reward = make('span', {
    className: 'exp-reward',
    text: battle.path === 'brave' ? TEXT.unCadeauRareApresLaMission : TEXT.unCadeauApresLaMission,
  });
  if (battle.path === 'brave') reward.dataset.rare = '';
  facts.append(reward);
  const play = button(undefined, ['primary', 'exp-go'], TEXT.cEstParti, go);
  play.dataset.path = battle.path;
  card.append(head, make('div', { className: 'exp-body' }, map, facts), play);
  return card;
}

/** A halt to choose: its picture, its name, what it promises, and its button. */
function haltCard(halt: HaltKind, choose: () => void) {
  const picture = decoration('span', 'exp-halt-picture');
  picture.dataset.halt = halt;
  if (halt === 'roulotte') picture.append(make('i'), make('i'), make('i'));
  const card = make(
    'article',
    { className: 'exp-card' },
    picture,
    make('h3', { text: HALT_NAMES[halt] }),
    make('p', { text: haltPromise(halt) }),
  );
  card.classList.add('exp-halt');
  card.dataset.halt = halt;
  const stop = button(undefined, ['primary', 'exp-go'], TEXT.sArreterIci, choose);
  stop.dataset.halt = halt;
  card.append(stop);
  return card;
}

/** The sign of a lasting gift in its clay disc; the once cards keep their picture. */
function giftPicture(id: BoonId) {
  if (!isLastingBoon(id)) return bonusPicture(id);
  const sign = decoration('span', 'exp-sign');
  sign.dataset.boon = id;
  sign.textContent = BOON_SIGNS[id];
  return sign;
}

/** « Tes cadeaux » : the five places, a sign and its stars in each one taken. */
function giftsRow(state: ExpeditionState) {
  const row = make('div', { className: 'exp-gifts' });
  row.setAttribute('role', 'list');
  setAttribute(row, 'aria-label', giftsLabel(state.boons.length));
  row.append(make('span', { className: 'bag-title', text: TEXT.tesCadeaux }));
  for (let place = 0; place < BOON_RULES[1].places; place++) {
    const held = state.boons[place];
    const slot = make('span', { className: held ? 'exp-held' : 'bag-empty' });
    slot.setAttribute('role', 'listitem');
    if (held) {
      const words = heldWords(held.id, held.level);
      setAttribute(slot, 'aria-label', words.label);
      slot.title = words.detail;
      slot.append(giftPicture(held.id), decoration('small', 'exp-stars'));
      slot.lastElementChild!.textContent = '★'.repeat(held.level);
    } else setAttribute(slot, 'aria-label', TEXT.placeLibre);
    row.append(slot);
  }
  return row;
}

/** Under every view: the gifts, what the camp carries, and the way to another expedition. */
function foot(state: ExpeditionState, actions: ExpeditionActions, other = true) {
  const camp = make('p', { className: 'exp-camp' });
  for (const words of campWords(state)) camp.append(make('span', { text: words }));
  const row = withClasses(
    make('div', { className: 'voyage-foot' }, giftsRow(state), camp),
    'exp-foot',
  );
  if (other)
    row.append(button('expedition-other', ['secondary'], TEXT.uneAutreExpedition, actions.other));
  return row;
}

/**
 * The map of the tableau: its seven steps, then what waits at this one — a mission, two
 * paths, or two halts — and under it the camp. `notice` says once what a halt has just done.
 */
export function mapView(
  state: ExpeditionState,
  notice: string,
  actions: ExpeditionActions,
): Node[] {
  const step = expeditionPlanOf(state).tableaux[state.tableau][state.step];
  const choices = make('div', { className: 'exp-choices' });
  let ask = '';
  if (step.kind === 'battle')
    choices.append(
      battleCard(
        state,
        step.battle,
        step.battle.king ? fill(TEXT.leGardienN, GUARDIAN_NAMES[state.tableau]) : '',
        () => actions.play(),
        actions.explain,
      ),
    );
  else if (step.kind === 'fork') {
    ask = TEXT.choisisTonChemin;
    for (const path of ['calm', 'brave'] as const)
      choices.append(
        battleCard(state, step[path], PATH_NAMES[path], () => actions.play(path), actions.explain),
      );
  } else {
    ask = TEXT.choisisTaHalte;
    for (const [index, halt] of step.halts.entries())
      choices.append(haltCard(halt, () => actions.halt(index as 0 | 1)));
  }
  choices.dataset.count = String(choices.childElementCount);
  const lines = make('div', { className: 'exp-lines' });
  if (notice) lines.append(make('p', { className: 'exp-notice', text: notice }));
  if (ask) lines.append(make('h2', { text: ask }));
  if (step.kind !== 'halt' && (state.tableau > 0 || state.step > 0))
    lines.append(
      make('p', { className: 'exp-grow', text: TEXT.lesSerpentsGrandissentAChaqueMission }),
    );
  const said = lines.childElementCount ? [lines] : [];
  return [trail(state), ...said, choices, foot(state, actions)];
}

/** One card to choose: the whole card is the button. */
function giftCard(state: ExpeditionState, id: BoonId, rare: boolean, choose: () => void) {
  const words = giftWords(state, id, rare);
  const card = make(
    'button',
    { className: 'bonus-card' },
    giftPicture(id),
    make('strong', { text: words.title }),
    make('span', { className: 'bonus-detail', text: words.detail }),
    make('small', { text: words.action }),
  );
  card.type = 'button';
  card.classList.add('exp-gift');
  card.dataset.gift = id;
  setAttribute(card, 'aria-label', `${words.title}. ${words.detail}`);
  card.onclick = choose;
  return card;
}

/** The held gifts as cards: one of them gives its place to `id`, or the child keeps them all. */
function replaceChoice(
  state: ExpeditionState,
  id: LastingBoon,
  actions: ExpeditionActions,
): Node[] {
  const cards = state.boons.map((held) => {
    const words = heldWords(held.id, held.level);
    const card = make(
      'button',
      { className: 'bonus-card' },
      giftPicture(held.id),
      make('strong', { text: words.label }),
      make('span', { className: 'bonus-detail', text: words.detail }),
    );
    card.type = 'button';
    card.classList.add('exp-gift');
    card.dataset.replace = held.id;
    card.onclick = () => actions.replace(held.id);
    return card;
  });
  const keep = button('expedition-keep', ['secondary'], TEXT.garderMesCadeaux, () =>
    actions.replace(null),
  );
  return [
    make(
      'div',
      { className: 'exp-ask' },
      make('h2', { text: fill(TEXT.tesNPlacesSontPrises, BOON_RULES[1].places) }),
      make('p', {
        className: 'exp-swap',
        text: fill(TEXT.choisisLeCadeauARemplacerParN, giftWords(state, id, false).title),
      }),
      make('div', { className: 'exp-ask-actions' }, keep),
    ),
    make('div', { className: 'exp-shop' }, ...cards),
  ];
}

/** After a battle won: three gifts, one reroll, or nothing at all. */
export function giftView(
  state: ExpeditionState,
  replacing: LastingBoon | null,
  actions: ExpeditionActions,
): Node[] {
  // The five gifts are the cards themselves: no row of places under them.
  if (replacing) return replaceChoice(state, replacing, actions);
  const pending = state.pending?.kind === 'gift' ? state.pending : null;
  const rare = !!pending?.rare;
  const ask = make('div', { className: 'exp-ask' }, make('h2', { text: TEXT.choisisTonCadeau }));
  if (rare)
    ask.append(make('p', { className: 'exp-rare', text: TEXT.cadeauRareIlArriveAuNiveau2 }));
  const row = make('div', { className: 'exp-ask-actions' });
  if (pending && !pending.rerolled)
    row.append(button('expedition-reroll', ['secondary'], TEXT.troisAutresCadeaux, actions.reroll));
  row.append(button('expedition-skip', ['secondary'], TEXT.neRienPrendre, actions.skip));
  ask.append(row);
  const cards = giftOffer(state).map((id) => giftCard(state, id, rare, () => actions.gift(id)));
  return [
    ask,
    withClasses(make('div', { className: 'bonus-cards' }, ...cards), 'exp-gift-cards'),
    foot(state, actions, false),
  ];
}

/** La roulotte : gifts to buy, gifts to climb, each with its price; then on the way again. */
export function roulotteView(
  state: ExpeditionState,
  replacing: LastingBoon | null,
  actions: ExpeditionActions,
): Node[] {
  // The five gifts are the cards themselves: no row of places under them.
  if (replacing) return replaceChoice(state, replacing, actions);
  const coins = state.camp?.gold ?? state.purse;
  const offer = roulotteOffer(state);
  const items = [
    ...offer.buy.map((item) => ({ ...item, label: fill(TEXT.acheterNPieces, item.price) })),
    ...offer.climb.map((item) => {
      const level = (state.boons.find((b) => b.id === item.id)?.level ?? 0) + 1;
      return { ...item, label: fill(TEXT.niveauNNPieces, level, item.price) };
    }),
  ];
  const cards = items.map((item) => {
    const card = giftCard(state, item.id, false, () => actions.buy(item.id));
    setText(card.querySelector('small')!, item.label);
    card.disabled = coins < item.price;
    return card;
  });
  const leave = button('expedition-leave', ['primary'], TEXT.repartir, actions.leave);
  return [
    make(
      'div',
      { className: 'exp-ask' },
      make('p', { className: 'exp-coins', text: coinsLine(coins) }),
      make('div', { className: 'exp-ask-actions' }, leave),
    ),
    make('div', { className: 'exp-shop' }, ...cards),
    foot(state, actions, false),
  ];
}

/** The expedition is over: the missions won, the gifts kept, the record, a new one. */
export function arrivedView(
  state: ExpeditionState,
  best: number,
  actions: ExpeditionActions,
): Node[] {
  const nodes: Node[] = [decoration('span', 'exp-trophy'), make('h2', { text: arrivedLine() })];
  const line = recordLine(best);
  if (line) nodes.push(make('p', { className: 'voyage-best', text: line }));
  nodes.push(
    withClasses(make('div', { className: 'voyage-foot' }, giftsRow(state)), 'exp-foot'),
    make(
      'div',
      { className: 'voyage-actions' },
      button('expedition-new', ['primary'], TEXT.uneNouvelleExpedition, actions.fresh),
    ),
  );
  return nodes;
}
