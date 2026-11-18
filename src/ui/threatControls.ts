import { setText as setDisplayText } from '../i18n/dom.ts';
import type { Game } from '../game.ts';
import type { Session } from '../session.ts';
import { LANE_NAMES } from '../ai.ts';
import { enemyPortraitStyle } from '../art.ts';
import { pauseForDialog } from './dialogs.ts';
import { currentWaveThreats, threatAdvice } from './threatPreview.ts';
import { renderThreatCards, renderThreatAdvice } from './threatCards.ts';
import { byId, make } from './dom.ts';
import { snakeIndexDoor } from './snakeIndexDoor.ts';
import * as TEXT from '../texts/fr/advice.ts';
import { fill } from '../texts/fill.ts';

type WaveThreats = NonNullable<ReturnType<typeof currentWaveThreats>>;

/** The snakes announced for the next wave, in a window opened from the camp. */
export function bindThreatControls(session: Session, refresh: () => void) {
  const dialog = byId('threat-dialog') as HTMLDialogElement,
    button = byId('wave-threats') as HTMLButtonElement;
  const modal = pauseForDialog(dialog, session, refresh);
  let observed = session.game,
    local = -1;
  button.onclick = () => {
    const game = session.game,
      preview = currentWaveThreats(game);
    if (!preview) return;
    observed = game;
    local = preview.local;
    showThreats(game, preview);
    modal.open();
    byId('threat-title').focus({ preventScroll: true });
  };
  byId('threat-close').onclick = modal.close;
  byId('threat-close').after(
    snakeIndexDoor(
      'threat-all-snakes',
      TEXT.tousLesSerpents,
      TEXT.lesSerpentsNeSontPasArrivesReessaie,
      () => session.game.balanceRevision,
    ),
  );
  return () => {
    const game = session.game;
    button.hidden = game.status !== 'preparing' || game.wave >= game.totalWaves;
    // The window describes one wave of one battle: it closes when either moves on.
    if (
      dialog.open &&
      (observed !== game || game.status !== 'preparing' || game.wave + 1 !== local)
    )
      modal.close();
  };
}

function showThreats(game: Game, preview: WaveThreats) {
  setDisplayText(byId('threat-title'), fill(TEXT.vagueNLesSerpentsAnnonces, preview.local));
  setDisplayText(
    byId('threat-lanes'),
    // One sentence with its place for the names: two texts stuck together are a sentence
    // the English catalogue does not know, and half of it stayed in French.
    fill(TEXT.voiesOuvertesN, preview.lanes.map((l) => LANE_NAMES[l]).join(' · ')),
  );
  const types = preview.entries.map((e) => e.kind);
  renderThreatCards(byId('wave-threat-list'), types, game.balanceRevision);
  renderThreatAdvice(
    byId('wave-threat-advice'),
    threatAdvice(types, (k) => game.isUnlocked(k) && game.capriceAllows(k)),
  );
  byId('wave-threat-eggs').replaceChildren(...eggWarning(preview.eggs, !!game.lateEggs));
}

/** `late`: this game also brings an egg when a wave drags on, and says so beforehand. */
function eggWarning(eggs: number, late: boolean) {
  const egg = make('span', { className: 'enemy-portrait' });
  egg.style.cssText = enemyPortraitStyle('egg');
  egg.setAttribute('aria-hidden', 'true');
  const copy = make('p', {
    text: fill(
      TEXT.nNEtAjouterDesSerpentsOrdinaires,
      eggs,
      eggs === 1 ? TEXT.oeufPeutEclore : TEXT.oeufsPeuventEclore,
    ),
  });
  if (!late) return [egg, copy];
  const note = make('p', { text: TEXT.siLaVagueDureUnOeufDePlusPeutArriver });
  return [egg, make('div', {}, copy, note)];
}
