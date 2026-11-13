import { availableGold, canSpend } from './capriceBudget.ts';
import { setAttribute, setMarkup, setText, setTitle } from '../i18n/dom.ts';
import { kinds, unlockWave } from '../data.ts';
import type { Kind } from '../data.ts';
import type { Game } from '../game.ts';
import type { Session } from '../session.ts';
import { portraitStyle } from '../art.ts';
import type { bindCatalogPages } from './catalogPages.ts';
import { matchesUnitFamily, RECRUITABLE_KINDS, UNIT_FAMILIES } from './unitCatalog.ts';
import { byId, make } from './dom.ts';
import { addOption, revealBoard, setPressed } from './battleDom.ts';
import { battleOver } from './battleState.ts';

/** One word under an ally's name: what it is good at. */
const SPECIALITIES: Partial<Record<Kind, string>> = {
  club: 'Contact',
  ninja: 'Rapide',
  medic: 'Soins',
  archer: 'Distance',
  wall: 'Blocage',
  dragon: 'Souffle',
  dino: 'Robuste',
  shield: 'Protection',
  bat: 'Puissance',
  nurse: 'Soins',
  knight: 'Armure',
  cavalry: 'Charge',
  twohead: 'Double',
  tank: 'Obus',
  raptor: 'Rapide',
  triceratops: 'Charge',
  stegosaurus: 'Protection',
  trex: 'Puissance',
  mutantRock: 'Robuste',
  mutantStretch: 'Allonge',
};

/** The allies that can be recruited now, or those that arrive later. */
type ShopView = 'ready' | 'future';

/**
 * The catalogue of allies: a family filter, two tabs and one card per ally. A card only
 * selects; the purchase itself happens on the board, through Session.
 */
export function bindRecruitShop(
  session: Session,
  pages: ReturnType<typeof bindCatalogPages>,
  refresh: () => void,
) {
  let view: ShopView = 'ready';
  const family = byId<HTMLSelectElement>('shop-family');
  for (const [value, label] of Object.entries(UNIT_FAMILIES)) addOption(family, value, label);
  const showFirstPage = () => {
    pages.reset();
    refresh();
  };
  const show = (next: ShopView) => {
    view = next;
    showFirstPage();
  };
  family.onchange = showFirstPage;
  byId('shop-ready').onclick = () => show('ready');
  byId('shop-future').onclick = () => show('future');
  const cards = new Map<Kind, HTMLButtonElement>();
  for (const kind of RECRUITABLE_KINDS) {
    const card = recruitCard(session, kind, refresh);
    byId('shop').append(card);
    cards.set(kind, card);
  }
  const listed = (kind: Kind) =>
    matchesUnitFamily(kind, family.value) && session.game.capriceAllows(kind);
  return {
    /** A new battle starts from every family, on the allies that are ready. */
    showEverything() {
      view = 'ready';
      family.value = 'all';
    },
    refresh() {
      const game = session.game;
      const offered = [...cards.keys()].filter(listed);
      const ready = offered.filter((kind) => game.isUnlocked(kind)).length;
      const future = offered.length - ready;
      if (!future) view = 'ready';
      showTabs(view, ready, future);
      setText(byId('shop-note'), shopNote(game, view, ready));
      const frozen =
        battleOver(game) || (game.paused && !byId<HTMLDialogElement>('reinforcements').open);
      for (const [kind, card] of cards) {
        card.hidden = !listed(kind) || game.isUnlocked(kind) !== (view === 'ready');
        showCard(card, kind, session, frozen);
      }
      pages.refresh([...cards.values()].filter((card) => !card.hidden));
    },
  };
}

function recruitCard(session: Session, kind: Kind, refresh: () => void): HTMLButtonElement {
  const unit = kinds[kind];
  const card = make('button', { className: 'unit-card' });
  setTitle(card, unit.description);
  card.dataset.kind = kind;
  card.setAttribute('aria-pressed', 'false');
  setMarkup(
    card,
    `<span class="portrait" aria-hidden="true"></span><span class="unit-info"><strong>${unit.name}</strong><small>${SPECIALITIES[kind]}</small></span><span class="price">${session.game.recruitCost(kind)} <i aria-hidden="true">●</i><span class="sr-only"> pièces</span></span>`,
  );
  card.querySelector<HTMLElement>('.portrait')!.style.cssText = portraitStyle(kind);
  card.onclick = () => {
    session.selectUnit(session.selected === kind ? null : kind);
    session.game.message = session.selected
      ? `${unit.name} : touche un espace libre dans ton camp, à droite.`
      : 'Placement annulé.';
    if (session.selected) revealBoard();
    refresh();
  };
  return card;
}

function showTabs(view: ShopView, ready: number, future: number) {
  byId<HTMLButtonElement>('shop-future').disabled = !future;
  setText(byId('shop-ready'), `Disponibles (${ready})`);
  setText(byId('shop-future'), `À découvrir (${future})`);
  setPressed(byId('shop-ready'), view === 'ready');
  setPressed(byId('shop-future'), view === 'future');
}

function shopNote(game: Game, view: ShopView, ready: number): string {
  if (view === 'future')
    return 'Voici les prochains alliés. Le guide explique leurs rôles avant leur arrivée.';
  if (ready) return 'Choisis un allié, puis place-le dans ton camp. Les prix sont en pièces.';
  return game.mission?.caprice
    ? 'Aucun allié permis dans ce filtre pour ce caprice.'
    : 'Ces alliés arrivent plus tard. Ouvre « À découvrir » pour les rencontrer.';
}

/** `frozen`: the battle is over, or paused behind something other than the open catalogue. */
function showCard(card: HTMLButtonElement, kind: Kind, session: Session, frozen: boolean) {
  const game = session.game;
  const cost = game.recruitCost(kind);
  const locked = !game.isUnlocked(kind);
  const poor = !canSpend(game, cost);
  const chosen = session.selected === kind;
  card.disabled = frozen || locked || poor;
  showPrice(card, cost);
  setText(
    card.querySelector('small')!,
    cardNote(game, kind, cost, (missing) => `Encore ${missing} pièces`) ?? '',
  );
  const reason = cardNote(game, kind, cost, (missing) => `Il manque ${missing} pièces`);
  card.dataset.state = locked ? 'locked' : poor ? 'poor' : chosen ? 'selected' : 'ready';
  setAttribute(
    card,
    'aria-label',
    `${kinds[kind].name}, ${cost === 0 ? 'offert' : `${cost} pièces`}. ${reason}.`,
  );
  card.classList.toggle('selected', chosen);
  setPressed(card, chosen);
}

function showPrice(card: HTMLButtonElement, cost: number) {
  const price = card.querySelector<HTMLElement>('.price')!;
  setText(price.firstChild!, cost === 0 ? 'Offert' : `${cost} `);
  price.querySelector<HTMLElement>('i')!.hidden = cost === 0;
  setText(price.querySelector<HTMLElement>('.sr-only')!, cost === 0 ? '' : ' pièces');
  card.classList.toggle('free-offer', cost === 0);
}

/**
 * What stands between the player and this ally, else its speciality. The card shows it and
 * the screen reader says it, each with its own words for the missing coins.
 */
function cardNote(
  game: Game,
  kind: Kind,
  cost: number,
  missingCoins: (missing: number) => string,
): string | undefined {
  if (!game.isUnlocked(kind))
    return game.mission
      ? 'À découvrir dans une autre mission'
      : `Arrive à la vague ${unlockWave[kind]}`;
  if (!canSpend(game, cost))
    return game.caprice.reserve
      ? 'Réserve bancaire protégée'
      : missingCoins(cost - availableGold(game));
  return SPECIALITIES[kind];
}
