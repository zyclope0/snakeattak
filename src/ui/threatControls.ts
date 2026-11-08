import type { Session } from '../session.ts';
import { LANE_NAMES } from '../ai.ts';
import { enemyPortraitStyle } from '../art.ts';
import { pauseForDialog } from './dialogs.ts';
import { currentWaveThreats, threatAdvice } from './threatPreview.ts';
import { renderThreatCards, renderThreatAdvice } from './threatCards.ts';

export function bindThreatControls(session: Session, refresh: () => void) {
  const el = (id: string) => document.getElementById(id)!;
  const dialog = el('threat-dialog') as HTMLDialogElement,
    button = el('wave-threats') as HTMLButtonElement;
  const modal = pauseForDialog(dialog, session, refresh);
  let observed = session.game,
    local = -1;
  button.onclick = () => {
    const game = session.game,
      preview = currentWaveThreats(game);
    if (!preview) return;
    observed = game;
    local = preview.local;
    el('threat-title').textContent = `Vague ${preview.local} · Les serpents annoncés`;
    el('threat-lanes').textContent =
      'Voies ouvertes : ' + preview.lanes.map((l) => LANE_NAMES[l]).join(' · ');
    const types = preview.entries.map((e) => e.kind);
    renderThreatCards(el('wave-threat-list'), types);
    renderThreatAdvice(
      el('wave-threat-advice'),
      threatAdvice(types, (k) => game.isUnlocked(k)),
    );
    const egg = document.createElement('span'),
      copy = document.createElement('p');
    egg.className = 'enemy-portrait';
    egg.style.cssText = enemyPortraitStyle('egg');
    egg.setAttribute('aria-hidden', 'true');
    copy.textContent = `${preview.eggs} ${preview.eggs === 1 ? 'œuf peut éclore' : 'œufs peuvent éclore'} et ajouter des serpents ordinaires.`;
    el('wave-threat-eggs').replaceChildren(egg, copy);
    modal.open();
    el('threat-title').focus({ preventScroll: true });
  };
  el('threat-close').onclick = modal.close;
  return () => {
    const game = session.game;
    button.hidden = game.status !== 'preparing' || game.wave >= game.totalWaves;
    if (
      dialog.open &&
      (observed !== game || game.status !== 'preparing' || game.wave + 1 !== local)
    )
      modal.close();
  };
}
