import { setAttribute, setText } from '../../i18n/dom.ts';
import type { Game } from '../../game.ts';
import type { Session } from '../../session.ts';
import type { Kind } from '../../data.ts';
import type { BattleScene } from '../../render/BattleScene.ts';
import { boonLayer } from '../../render/boonLayer.ts';
import { visualSettings } from '../../render/visualSettings.ts';
import { balanceRecruitPrice } from '../../balanceRevision.ts';
import { endlessWave } from '../../endless.ts';
import { byId, decoration, make } from '../dom.ts';
import { battleOver } from '../battleState.ts';
import { placesRow } from './boonPlaces.ts';
import { bindBoonSheet } from './boonSheet.ts';
import * as TEXT from '../../texts/fr/boons.ts';
import { fill } from '../../texts/fill.ts';

/** How long « +120 » stays by the coins after « la rente » paid them (`styles/20-boons.css`). */
const INCOME_MS = 2000;

/**
 * L'étagère des cadeaux (aventure sans fin, lot B, 27 novembre 2026), loaded by `boonDoor.ts`
 * the first time an endless game is drawn. Rendering only: it reads the gifts of the game
 * (`game.boons`, `game.boonLevel`, `game.boonGain`) and changes nothing in it.
 *
 * - the shelf (`#boon-shelf`) in the dock, at the camp and during a wave: five places, the sign
 *   of each gift and its stars, empty places dotted; a touch opens the sheet (`boonSheet.ts`);
 * - the gifts held above the cards of a new gift (`#reward-held`), the free places dotted;
 * - the recap when the camp falls (`#boon-recap`), and when the child goes home with the
 *   record (the sheet, before the way home);
 * - each gift where it acts: on the board (`render/boonLayer.ts`), « 135 » under « 150 »
 *   struck out on the favourites (« le marché »), « +8 s » on the honey pots (« la grande
 *   réserve de miel »), « +120 » by the coins when a wave ends (« la rente »). « La longue-vue »
 *   is the circle shown when an ally is placed (`placementRange.ts`, lot A).
 */
export function bindBoonShelf(session: Session, scene: BattleScene, refresh: () => void) {
  const sheet = bindBoonSheet(session, refresh);
  const places = placesRow();
  const shelf = make('button', { id: 'boon-shelf', className: 'boon-shelf' }, places.row);
  shelf.type = 'button';
  shelf.setAttribute('aria-haspopup', 'dialog');
  shelf.setAttribute('aria-controls', 'boon-sheet');
  shelf.onclick = () => sheet.open(false);
  byId('dock-allies').after(shelf);

  const held = placesRow();
  const heldRow = make(
    'div',
    { id: 'reward-held', className: 'boon-held' },
    make('span', { className: 'boon-held-title', text: TEXT.tesCadeaux }),
    held.row,
  );
  byId('reward-cards').before(heldRow);

  const fallen = placesRow();
  const fallenLine = make('span', { className: 'boon-held-line' });
  const fall = make(
    'div',
    { id: 'boon-recap', className: 'boon-held' },
    make('span', { className: 'boon-held-title', text: TEXT.tesCadeaux }),
    fallen.row,
    fallenLine,
  );
  byId('battle-result-summary').after(fall);
  // Read aloud as one picture: « Tes cadeaux : 3 sur 5 places ».
  for (const row of [held.row, fallen.row]) row.setAttribute('role', 'img');

  // « Rentrer avec mon record » shows the recap first; its button goes home.
  byId('endless-home').onclick = () => sheet.open(true);

  const income = decoration('span', 'boon-income');
  income.hidden = true;
  document.querySelector('.treasure-stat')?.append(income);
  let incomeTimer = 0;
  const motion = matchMedia('(prefers-reduced-motion:reduce)');
  const showIncome = (coins: number) => {
    income.textContent = `+${coins}`;
    income.classList.toggle('still', visualSettings.reduced(motion.matches));
    income.hidden = false;
    // Restarted, the rise plays again.
    income.style.animation = 'none';
    void income.offsetWidth;
    income.style.animation = '';
    clearTimeout(incomeTimer);
    incomeTimer = window.setTimeout(() => (income.hidden = true), INCOME_MS);
  };

  scene.addLayer(boonLayer);
  let watched: Game | null = null;
  let status = '';
  return () => {
    const game = session.game;
    const endless = !!game.endless;
    const over = battleOver(game);
    shelf.hidden = !endless || session.screen !== 'battle' || over;
    heldRow.hidden = fall.hidden = !endless;
    fall.hidden ||= !over;
    if (endless) {
      const label = fill(TEXT.tesCadeauxNSurN, game.boons.length, game.boonRules.places);
      for (const [node, row] of [
        [shelf, places],
        [held.row, held],
        [fallen.row, fallen],
      ] as const) {
        row.show(game);
        setAttribute(node, 'aria-label', label);
      }
      setText(
        fallenLine,
        fill(TEXT.vagueNRoisBattusN, endlessWave(game.kings, game.wave), game.kings),
      );
    }
    showMarket(game);
    showHoney(game);
    // « La rente » pays when a wave is pushed back: the coins say so, where they are counted.
    const ended = watched === game && status === 'fighting' && game.status === 'preparing';
    if (ended && game.boonGain('rente') > 0) showIncome(game.boonGain('rente'));
    if (watched !== game || !endless) income.hidden = true;
    watched = game;
    status = game.status;
  };
}

/** « Le marché »: the price before the gift, struck out, beside the price of the favourite. */
function showMarket(game: Game) {
  for (const card of Array.from(
    document.querySelectorAll<HTMLElement>('#dock-allies .dock-card'),
  )) {
    let was = card.querySelector<HTMLElement>('.boon-was');
    const kind = card.dataset.dockKind as Kind | undefined;
    const plain =
      kind && game.boonLevel('marche') ? balanceRecruitPrice(kind, game.balanceRevision) : 0;
    const cost = kind ? game.recruitCost(kind) : 0;
    const struck = cost > 0 && cost < plain;
    if (!struck && !was) continue;
    if (!was) {
      was = decoration('s', 'boon-was');
      card.append(was);
    }
    was.hidden = !struck;
    was.textContent = struck ? String(plain) : '';
  }
}

/** « La grande réserve de miel »: the seconds it adds, on each pot of the dock. */
function showHoney(game: Game) {
  const seconds = game.endless ? game.boonGain('miel') : 0;
  for (const pot of Array.from(document.querySelectorAll<HTMLElement>('#dock-honey button'))) {
    let more = pot.querySelector<HTMLElement>('.boon-more');
    if (!seconds && !more) continue;
    if (!more) {
      more = decoration('small', 'boon-more');
      pot.append(more);
    }
    more.hidden = !seconds;
    more.textContent = seconds ? `+${seconds} s` : '';
  }
}
