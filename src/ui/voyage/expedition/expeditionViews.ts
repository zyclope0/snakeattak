import kingUrl from '../../../assets/home/menu-classique.webp';
import { BOON_RULES, isLastingBoon } from '../../../boons.ts';
import type { BoonId, LastingBoon } from '../../../boons.ts';
import { capriceDefinitionForRun } from '../../../caprices.ts';
import type { CapriceDefinition } from '../../../caprices.ts';
import { coinsOf, expeditionPlanOf, giftOffer, roulotteOffer } from '../../../expedition.ts';
import type { Battle, ExpeditionState, HaltKind, Path } from '../../../expedition.ts';
import { setAttribute } from '../../../i18n/dom.ts';
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
  roadColumns,
} from './expeditionWords.ts';
import type { RoadStop } from './expeditionWords.ts';
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

/** Where a stop stands in the road's box, in hundredths: its column, its lane. */
const COLUMN = (column: number, columns: number) => ((column + 0.5) / columns) * 100;
const LANE = (row: number, rows: number) => (rows === 1 ? 50 : row === 0 ? 22 : 78);
/** One smooth stretch of road, level at both ends, as the voyage draws its path. */
const curve = (x1: number, y1: number, x2: number, y2: number) => {
  const middle = (x1 + x2) / 2;
  return `M${x1} ${y1}C${middle} ${y1},${middle} ${y2},${x2} ${y2}`;
};

/** The mark of one stop: the mission's number, a halt's picture or the king, and a tick once passed. */
function stopMark(stop: RoadStop) {
  const mark = decoration('span', 'exp-mark');
  if (stop.kind === 'halt') {
    const picture = decoration('span', 'exp-halt-picture');
    picture.dataset.halt = stop.halt!;
    if (stop.halt === 'roulotte') picture.append(make('i'), make('i'), make('i'));
    mark.append(picture);
  } else if (stop.kind === 'guardian') mark.append(king());
  else mark.textContent = String(stop.mission);
  if (stop.state === 'done') {
    const done = decoration('span', 'exp-tick');
    done.append(tick());
    mark.append(done);
  }
  return mark;
}

/**
 * The road of the tableau, as the voyage draws its path: one dashed road from the edge of the
 * panel to the guardian. At every fork and every halt it splits in two, then joins again
 * before the next: the child sees where it parts and where it meets. The way travelled is
 * drawn in green, the brave path in gold; the stops not chosen fade.
 */
function road(state: ExpeditionState) {
  const columns = roadColumns(state);
  const list = make('ol', { className: 'exp-stops' });
  setAttribute(list, 'aria-label', TEXT.laRouteDuTableau);
  const lines: SVGElement[] = [];
  const stretch = (d: string, kind: string) => {
    const path = svgNode('path', { d, 'vector-effect': 'non-scaling-stroke' });
    path.setAttribute('class', kind);
    lines.push(path);
  };
  /** How a stretch to or from a stop looks: travelled, faded, brave, or still open. */
  const look = (stop: RoadStop, travelled: boolean) =>
    travelled
      ? 'exp-taken'
      : stop.state === 'skipped'
        ? 'exp-faded'
        : stop.path === 'brave'
          ? 'exp-brave'
          : 'exp-open';
  const count = columns.length;
  const firstLane = LANE(0, columns[0].length);
  stretch(
    `M-1 ${firstLane}L${COLUMN(0, count)} ${firstLane}`,
    columns[0][0].state === 'done' ? 'exp-taken' : 'exp-open',
  );
  for (const [column, stops] of columns.entries()) {
    for (const [row, stop] of stops.entries()) {
      const item = make('li', { className: 'exp-stop' }, stopMark(stop));
      // Read as the child sees it: the mission, then the path or the halt, then where it stands.
      if (stop.detail) item.append(make('span', { className: 'sr-only', text: stop.detail }));
      item.append(
        make('span', { className: 'sr-only', text: stop.name }),
        make('span', { className: 'sr-only', text: stop.said }),
      );
      item.dataset.kind = stop.kind;
      item.dataset.state = stop.state;
      if (stop.path) item.dataset.path = stop.path;
      if (stops.length === 1) item.dataset.alone = '';
      if (stop.state === 'next' && stops.length === 1) item.setAttribute('aria-current', 'step');
      item.style.setProperty('--column', String(column + 1));
      item.style.setProperty('--row', stops.length === 1 ? '1 / 3' : String(row + 1));
      list.append(item);
    }
    const next = columns[column + 1];
    const x = COLUMN(column, count);
    if (!next) {
      const lane = LANE(0, stops.length);
      stretch(`M${x} ${lane}L101 ${lane}`, stops[0].state === 'done' ? 'exp-taken' : 'exp-open');
      continue;
    }
    // Between two columns the road gathers at one point, halfway, then parts again.
    const meet = (x + COLUMN(column + 1, count)) / 2;
    const passedNext = next.some((stop) => stop.state === 'done');
    for (const [row, from] of stops.entries())
      stretch(
        curve(x, LANE(row, stops.length), meet, 50),
        look(from, from.state === 'done' && passedNext),
      );
    for (const [row, to] of next.entries())
      stretch(
        curve(meet, 50, COLUMN(column + 1, count), LANE(row, next.length)),
        look(to, to.state === 'done'),
      );
  }
  const drawing = svgNode(
    'svg',
    {
      class: 'exp-lines-drawn',
      viewBox: '0 0 100 100',
      preserveAspectRatio: 'none',
      'aria-hidden': 'true',
    },
    ...lines,
  );
  list.style.setProperty('--columns', String(count));
  const where = make('span', {
    className: 'exp-where',
    text: fill(TEXT.tableauNSurN, state.tableau + 1, expeditionPlanOf(state).tableaux.length),
  });
  return make(
    'div',
    { className: 'exp-road' },
    where,
    make('div', { className: 'exp-road-box' }, drawing, list),
  );
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
  const head = make('h3', { id: `exp-head-${battle.path}`, text: title });
  const map = make('span', { className: 'stop-map' }, stopMap(battle.run, lanes));
  const facts = make('div', { className: 'exp-facts' });
  // An étape is named by its fixed challenge, never by the mission whose waves it borrows.
  // A battle of version 1 may have none: the mission names it, as it did then.
  const caprice = capriceDefinitionForRun(battle.run);
  if (!caprice) facts.append(make('strong', { text: missionById(battle.run.missionId)!.name }));
  // The guardian's name is the card's title: its picture stands beside the map.
  if (battle.king) facts.append(make('span', { className: 'exp-guardian' }, king()));
  const named = caprice && frenchLeaf('strong', caprice.name);
  if (caprice && named) {
    named.id = `exp-defi-${battle.path}`;
    facts.append(make('span', { className: 'exp-caprice' }, sticker(caprice, explain), named));
  }
  // King Snake ends the expedition: no gift waits after him.
  const last = battle.king && state.tableau === expeditionPlanOf(state).tableaux.length - 1;
  // The gift it promises shares the row of the path's name.
  const top = make('div', { className: 'exp-card-head' }, head);
  if (!last) {
    const reward = make('span', {
      className: 'exp-reward',
      text: battle.path === 'brave' ? TEXT.unCadeauRareAGagner : TEXT.unCadeauAGagner,
    });
    if (battle.path === 'brave') reward.dataset.rare = '';
    top.append(reward);
  }
  const play = button(undefined, ['primary', 'exp-go'], TEXT.cEstParti, go);
  play.dataset.path = battle.path;
  // Two « C'est parti ! » side by side: each one is told by its path and its challenge.
  const told = [title ? head.id : '', named ? named.id : ''].filter(Boolean).join(' ');
  if (told) play.setAttribute('aria-describedby', told);
  card.append(top, make('div', { className: 'exp-body' }, map, facts), play);
  return card;
}

/** A halt to choose: its picture, its name, what it promises, and its button. */
function haltCard(state: ExpeditionState, halt: HaltKind, choose: () => void) {
  const picture = decoration('span', 'exp-halt-picture');
  picture.dataset.halt = halt;
  if (halt === 'roulotte') picture.append(make('i'), make('i'), make('i'));
  const card = make(
    'article',
    { className: 'exp-card' },
    picture,
    make('h3', { id: `exp-head-${halt}`, text: HALT_NAMES[halt] }),
    make('p', { text: haltPromise(state, halt) }),
  );
  card.classList.add('exp-halt');
  card.dataset.halt = halt;
  const stop = button(undefined, ['primary', 'exp-go'], TEXT.sArreterIci, choose);
  stop.dataset.halt = halt;
  stop.setAttribute('aria-describedby', `exp-head-${halt}`);
  card.append(stop);
  return card;
}

/** The sign of a lasting gift in its clay disc; the honey pot and the once cards keep their picture. */
function giftPicture(id: BoonId) {
  if (!isLastingBoon(id) || id === 'miel') return bonusPicture(id);
  const sign = decoration('span', 'exp-sign');
  sign.dataset.boon = id;
  sign.textContent = BOON_SIGNS[id];
  return sign;
}

/** « Tes cadeaux » : the five places, a sign and its stars in each one taken. */
function giftsRow(state: ExpeditionState) {
  const list = make('span', { className: 'exp-places' });
  list.setAttribute('role', 'list');
  setAttribute(list, 'aria-label', giftsLabel(state.boons.length));
  const title = make('span', { className: 'bag-title', text: TEXT.tesCadeaux });
  title.setAttribute('aria-hidden', 'true');
  const row = make('div', { className: 'exp-gifts' }, title, list);
  for (let place = 0; place < BOON_RULES[1].places; place++) {
    const held = state.boons[place];
    const slot = make('span', { className: held ? 'exp-held' : 'bag-empty' });
    slot.setAttribute('role', 'listitem');
    if (held) {
      const words = heldWords(held.id, held.level);
      setAttribute(slot, 'aria-label', words.label);
      setAttribute(slot, 'title', words.detail);
      slot.append(giftPicture(held.id), decoration('small', 'exp-stars'));
      slot.lastElementChild!.textContent = '★'.repeat(held.level);
    } else setAttribute(slot, 'aria-label', TEXT.placeLibre);
    list.append(slot);
  }
  return row;
}

/** Under every view: the gifts, what the camp carries, and the way to another expedition. */
function foot(state: ExpeditionState, actions: ExpeditionActions, other = true, notice = '') {
  // What a halt has just done to the camp takes, once, the place of what the camp carries.
  const camp = make('p', { className: notice ? 'exp-notice' : 'exp-camp' });
  if (notice) {
    camp.setAttribute('role', 'status');
    camp.append(make('span', { text: notice }));
  } else for (const words of campWords(state)) camp.append(make('span', { text: words }));
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
  best: number,
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
      choices.append(haltCard(state, halt, () => actions.halt(index as 0 | 1)));
  }
  choices.dataset.count = String(choices.childElementCount);
  const lines = make('div', { className: 'exp-lines' });
  if (ask) lines.append(make('h2', { text: ask }));
  const record = recordLine(best);
  if (record) lines.append(make('p', { className: 'exp-record', text: record }));
  if (step.kind !== 'halt' && (state.tableau > 0 || state.step > 0))
    lines.append(
      make('p', { className: 'exp-grow', text: TEXT.lesSerpentsGrandissentAChaqueEtape }),
    );
  const said = lines.childElementCount ? [lines] : [];
  return [road(state), ...said, choices, foot(state, actions, true, notice)];
}

/** One card to choose: the whole card is the button. */
function giftCard(
  state: ExpeditionState,
  id: BoonId,
  rare: boolean,
  choose: () => void,
  action?: string,
) {
  const words = { ...giftWords(state, id, rare), ...(action ? { action } : {}) };
  const card = make(
    'button',
    { className: 'bonus-card' },
    giftPicture(id),
    make('strong', { text: words.title }),
    make('span', { className: 'bonus-detail', text: words.detail }),
    make('small', { text: words.action }),
  );
  // A plain « Choisir » can hide on a low screen; a level or a price always shows.
  if (words.action === TEXT.choisirCeCadeau) card.dataset.plain = '';
  card.type = 'button';
  card.classList.add('exp-gift');
  card.dataset.gift = id;
  setAttribute(card, 'aria-label', `${words.title}. ${words.detail} ${words.action}`);
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
  const keep = button('expedition-keep-gifts', ['secondary'], TEXT.garderMesCadeaux, () =>
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
  const offer = giftOffer(state);
  // Only a lasting gift or the purse counts twice when rare: say it only then.
  const twice = offer.some((id) => isLastingBoon(id) || id === 'pieces');
  if (rare && twice) ask.append(make('p', { className: 'exp-rare', text: TEXT.cadeauRare }));
  const row = make('div', { className: 'exp-ask-actions' });
  if (pending && !pending.rerolled)
    row.append(button('expedition-reroll', ['secondary'], TEXT.troisAutresCadeaux, actions.reroll));
  row.append(button('expedition-skip', ['secondary'], TEXT.neRienPrendre, actions.skip));
  ask.append(row);
  const cards = offer.map((id) => giftCard(state, id, rare, () => actions.gift(id)));
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
  const coins = coinsOf(state);
  const offer = roulotteOffer(state);
  const items = [
    ...offer.buy.map((item) => ({ ...item, label: fill(TEXT.acheterNPieces, item.price) })),
    ...offer.climb.map((item) => {
      const level = (state.boons.find((b) => b.id === item.id)?.level ?? 0) + 1;
      return { ...item, label: fill(TEXT.niveauNNPieces, level, item.price) };
    }),
  ];
  const cards = items.map((item) => {
    const card = giftCard(state, item.id, false, () => actions.buy(item.id), item.label);
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
