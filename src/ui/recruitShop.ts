import { availableGold, canSpend } from './capriceBudget.ts';
import { setAttribute, setMarkup, setText, setTitle } from '../i18n/dom.ts';
import { kinds, unlockWave } from '../data.ts';
import type { Kind } from '../data.ts';
import type { Game } from '../game.ts';
import type { Session } from '../session.ts';
import { portraitStyle } from '../art.ts';
import type { bindCatalogPages } from './catalogPages.ts';
import { matchesUnitFamily, RECRUITABLE_KINDS, UNIT_FAMILIES } from './unitCatalog.ts';
import { addOption, byId, make, setPressed } from './dom.ts';
import { revealBoard } from './battleDom.ts';
import { battleOver } from './battleState.ts';
import * as TEXT from '../texts/fr/recruiting.ts';
import { fill } from '../texts/fill.ts';

/** One word under an ally's name: what it is good at. */
const SPECIALITIES: Partial<Record<Kind, string>> = {
  club: TEXT.contact,
  ninja: TEXT.rapide,
  medic: TEXT.soins,
  archer: TEXT.distance,
  wall: TEXT.blocage,
  dragon: TEXT.souffle,
  dino: TEXT.robuste,
  shield: TEXT.protection,
  bat: TEXT.puissance,
  nurse: TEXT.soins,
  knight: TEXT.armure,
  cavalry: TEXT.charge,
  twohead: TEXT.double,
  tank: TEXT.obus,
  raptor: TEXT.rapide,
  triceratops: TEXT.charge,
  stegosaurus: TEXT.protection,
  trex: TEXT.puissance,
  mutantRock: TEXT.robuste,
  mutantStretch: TEXT.allonge,
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
    `<span class="portrait" aria-hidden="true"></span><span class="unit-info"><strong>${unit.name}</strong><small>${SPECIALITIES[kind]}</small></span><span class="price">${session.game.recruitCost(kind)} <i aria-hidden="true">●</i><span class="sr-only">${TEXT.pieces}</span></span>`,
  );
  card.querySelector<HTMLElement>('.portrait')!.style.cssText = portraitStyle(kind);
  card.onclick = () => {
    session.selectUnit(session.selected === kind ? null : kind);
    session.game.message = session.selected
      ? fill(TEXT.nToucheUnEspaceLibreDansTonCampA, unit.name)
      : TEXT.placementAnnule;
    if (session.selected) revealBoard();
    refresh();
  };
  return card;
}

function showTabs(view: ShopView, ready: number, future: number) {
  byId<HTMLButtonElement>('shop-future').disabled = !future;
  setText(byId('shop-ready'), fill(TEXT.disponiblesN, ready));
  setText(byId('shop-future'), fill(TEXT.aDecouvrirN, future));
  setPressed(byId('shop-ready'), view === 'ready');
  setPressed(byId('shop-future'), view === 'future');
}

function shopNote(game: Game, view: ShopView, ready: number): string {
  if (view === 'future') return TEXT.voiciLesProchainsAlliesLeGuide;
  if (ready) return TEXT.choisisUnAlliePuisPlaceLeDansTon;
  return game.mission?.caprice
    ? TEXT.aucunAlliePermisDansCeFiltrePourCe
    : TEXT.cesAlliesArriventPlusTardOuvreA;
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
    cardNote(game, kind, cost, (missing) => fill(TEXT.encoreNPieces, missing)) ?? '',
  );
  const reason = cardNote(game, kind, cost, (missing) => fill(TEXT.ilManqueNPieces, missing));
  card.dataset.state = locked ? 'locked' : poor ? 'poor' : chosen ? 'selected' : 'ready';
  setAttribute(
    card,
    'aria-label',
    `${kinds[kind].name}, ${cost === 0 ? 'offert' : fill(TEXT.nPieces, cost)}. ${reason}.`,
  );
  card.classList.toggle('selected', chosen);
  setPressed(card, chosen);
}

function showPrice(card: HTMLButtonElement, cost: number) {
  const price = card.querySelector<HTMLElement>('.price')!;
  setText(price.firstChild!, cost === 0 ? TEXT.offert : `${cost} `);
  price.querySelector<HTMLElement>('i')!.hidden = cost === 0;
  setText(price.querySelector<HTMLElement>('.sr-only')!, cost === 0 ? '' : TEXT.pieces);
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
      ? TEXT.aDecouvrirDansUneAutreMission
      : fill(TEXT.arriveALaVagueN, unlockWave[kind]);
  if (!canSpend(game, cost))
    return game.caprice.reserve
      ? TEXT.reserveBancaireProtegee2
      : missingCoins(cost - availableGold(game));
  return SPECIALITIES[kind];
}
