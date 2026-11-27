import { setAttribute, setText } from '../../i18n/dom.ts';
import type { Game } from '../../game.ts';
import type { Session } from '../../session.ts';
import { kinds, type Kind } from '../../data.ts';
import { balanceRecruitPrice } from '../../balanceRevision.ts';
import { endlessWave } from '../../endless.ts';
import { boonTitle, boonWords, stars } from '../boonCopy.ts';
import { byId, make } from '../dom.ts';
import { pauseForDialog } from '../dialogs.ts';
import { paint, place, placesRow, type Held, type Place } from './boonPlaces.ts';
import * as TEXT from '../../texts/fr/boons.ts';
import { fill } from '../../texts/fill.ts';

type Row = {
  place: Place;
  name: HTMLElement;
  words: HTMLElement;
  example: HTMLElement;
  next: HTMLElement;
};

/**
 * « Tes cadeaux » (lot B, 27 November 2026): the five places in large, what each gift does in
 * a child's words, and what taking it again would give. Opened from the shelf, at the camp and
 * during a wave (the wave waits while it is open). The same window is the recap when the child
 * goes home with the record: the wave, the kings, the gifts, and the choice to stay.
 * Escape and Android's « retour » close it (`pauseForDialog`, `backButton.ts`).
 */
export function bindBoonSheet(session: Session, refresh: () => void) {
  const close = make('button', { className: 'close', text: '✕' });
  close.type = 'button';
  close.autofocus = true;
  setAttribute(close, 'aria-label', TEXT.fermer);
  const title = make('h2', { id: 'boon-sheet-title' });
  const line = make('p', { className: 'boon-sheet-line' });
  const list = make('ul', { className: 'boon-sheet-list' });
  const recap = placesRow();
  recap.row.classList.add('boon-recap-places');
  recap.row.setAttribute('role', 'img');
  const note = make('p', { className: 'boon-sheet-note', text: TEXT.taPartieTAttendALAccueil });
  const home = make('button', { className: 'primary', text: TEXT.rentrerALAccueil });
  const stay = make('button', { className: 'secondary', text: TEXT.resterAuCamp });
  home.type = stay.type = 'button';
  const actions = make('div', { className: 'boon-sheet-actions' }, home, stay);
  const dialog = make(
    'dialog',
    { id: 'boon-sheet', className: 'boon-sheet' },
    close,
    title,
    line,
    list,
    recap.row,
    note,
    actions,
  );
  dialog.setAttribute('aria-labelledby', 'boon-sheet-title');
  byId('app').append(dialog);
  const modal = pauseForDialog(dialog, session, refresh);
  close.onclick = stay.onclick = modal.close;
  home.onclick = () => {
    modal.close();
    byId('menu-home').click();
  };
  const rows: Row[] = [];
  const show = (game: Game, ending: boolean) => {
    dialog.toggleAttribute('data-recap', ending);
    setText(title, ending ? TEXT.tonAventure : TEXT.tesCadeaux);
    setText(line, fill(TEXT.vagueNRoisBattusN, endlessWave(game.kings, game.wave), game.kings));
    line.hidden = note.hidden = actions.hidden = recap.row.hidden = !ending;
    list.hidden = ending;
    recap.show(game);
    setAttribute(
      recap.row,
      'aria-label',
      fill(TEXT.tesCadeauxNSurN, game.boons.length, game.boonRules.places),
    );
    while (rows.length < game.boonRules.places) list.append(row(rows));
    rows.forEach((r, i) => {
      r.place.node.parentElement!.hidden = i >= game.boonRules.places;
      showRow(r, game, game.boons[i]);
    });
  };
  return {
    /** The gifts; `ending`, the recap before going home with the record. */
    open(ending: boolean) {
      show(session.game, ending);
      modal.open();
    },
  };
}

function row(rows: Row[]) {
  const r: Row = {
    place: place(),
    name: make('strong'),
    words: make('span'),
    example: make('span', { className: 'boon-example' }),
    next: make('small'),
  };
  rows.push(r);
  r.place.node.classList.add('boon-big');
  return make(
    'li',
    {},
    r.place.node,
    make('span', { className: 'boon-sheet-words' }, r.name, r.words, r.example, r.next),
  );
}

function showRow(r: Row, game: Game, held: Held | undefined) {
  paint(r.place, held);
  const steps = game.boonRules.steps;
  setText(r.name, held ? boonTitle(held.id) : TEXT.placeLibre);
  setText(
    r.words,
    held ? boonWords(held.id, held.level, steps) : TEXT.leProchainCadeauPeutVenirIci,
  );
  const example = held?.id === 'marche' ? marketExample(game) : '';
  r.example.hidden = !example;
  setText(r.example, example);
  r.next.hidden = !held;
  if (!held) return;
  const max = game.boonRules.maxLevel;
  setText(
    r.next,
    held.level < max
      ? fill(TEXT.siTuLeReprendsN, `${stars(held.level)} → ${stars(held.level + 1)}`)
      : TEXT.toutEnHaut,
  );
}

/** « Le marché » with a real price: the dearest ally of the camp, as it costs now. */
function marketExample(game: Game): string {
  let best: { kind: Kind; plain: number; cost: number } | undefined;
  for (const kind of Object.keys(kinds) as Kind[]) {
    if (!game.knowsAlly(kind)) continue;
    const plain = balanceRecruitPrice(kind, game.balanceRevision);
    const cost = game.recruitCost(kind);
    if (cost > 0 && cost < plain && (!best || plain > best.plain)) best = { kind, plain, cost };
  }
  return best ? fill(TEXT.nNPiecesAuLieuDeN, kinds[best.kind].name, best.cost, best.plain) : '';
}
