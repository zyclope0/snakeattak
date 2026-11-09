import {
  setText as setDisplayText,
  setTitle as setDisplayTitle,
  setMarkup as setDisplayMarkup,
  setAttribute as setDisplayAttribute,
} from '../i18n/dom.ts';
import { bindBattleResult } from './battleResult.ts';
import { placementAdvice } from './placementAdvice.ts';
import { defeatCopy } from '../render/resultCopy.ts';
import { bindThreatControls } from './threatControls.ts';
import { bindCampToolHelp } from './campToolHelp.ts';
import { bindBattleDock } from './battleDock.ts';
import { feastIconStyle } from './feastControls.ts';
import { pauseStateFor } from './pauseState.ts';
import { bindLifecycle } from './lifecycle.ts';
import { bindOrientation } from './orientation.ts';
import { bindReinforcementsDrawer } from './reinforcementsDrawer.ts';
import { placementReadout } from '../render/placementRange.ts';
import { bindSquadControls } from './squadControls.ts';
import { bindAdventureControls } from './adventureControls.ts';
import type { createCareer } from '../progression.ts';
import { bindRewardControls } from './rewardControls.ts';
import { bindUnitGuide } from './unitGuide.ts';
import { unlockWave } from '../data.ts';
import { bindFeastControls } from './feastControls.ts';
import { bindHud } from './hud.ts';
import { bindDisplay } from './display.ts';
import { bindVisualSettings } from './visualSettings.ts';
import { missionById } from '../missions.ts';
import { pauseForDialog } from './dialogs.ts';
import { kinds } from '../data.ts';
import type { Kind } from '../data.ts';
import type { Session } from '../session.ts';
import { portraitStyle, UI_ART_URL } from '../art.ts';
import { matchesUnitFamily, RECRUITABLE_KINDS, UNIT_FAMILIES } from './unitCatalog.ts';
export function bindControls(
  session: Session,
  afterChange: () => void = () => {},
  career?: ReturnType<typeof createCareer>,
  actions?: {
    restart?: () => void;
  },
) {
  document.documentElement.style.setProperty('--ui-art', `url("${UI_ART_URL}")`);
  const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
  const pauses = pauseStateFor(session);
  const syncOrientation = bindOrientation(session, refresh);
  const cards = new Map<Kind, HTMLButtonElement>();
  const refreshHud = bindHud();
  const refreshResult = bindBattleResult(session);
  el('mobile-home').onclick = () => el('menu-home').click();
  bindDisplay();
  bindReinforcementsDrawer();
  bindVisualSettings();
  let catalogView: 'ready' | 'future' = 'ready';
  const familySelect = el<HTMLSelectElement>('shop-family');
  for (const [value, label] of Object.entries(UNIT_FAMILIES)) {
    const option = document.createElement('option');
    option.value = value;
    setDisplayText(option, label);
    familySelect.append(option);
  }
  familySelect.onchange = () => {
    el('shop').scrollTop = 0;
    refresh();
  };
  el('shop-ready').onclick = () => {
    catalogView = 'ready';
    refresh();
  };
  el('shop-future').onclick = () => {
    catalogView = 'future';
    refresh();
  };
  const descriptions: Partial<Record<Kind, string>> = {
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
  for (const kind of RECRUITABLE_KINDS) {
    const d = kinds[kind],
      b = document.createElement('button');
    b.className = 'unit-card';
    setDisplayTitle(b, d.description);
    b.dataset.kind = kind;
    b.setAttribute('aria-pressed', 'false');
    setDisplayMarkup(
      b,
      `<span class="portrait" aria-hidden="true"></span><span class="unit-info"><strong>${d.name}</strong><small>${descriptions[kind]}</small></span><span class="price">${d.cost} <i aria-hidden="true">●</i><span class="sr-only"> pièces</span></span>`,
    );
    b.querySelector<HTMLElement>('.portrait')!.style.cssText = portraitStyle(kind);
    b.onclick = () => {
      session.selectUnit(session.selected === kind ? null : kind);
      session.game.message = session.selected
        ? `${d.name} : touche un espace libre dans ton camp, à droite.`
        : 'Placement annulé.';
      if (session.selected && window.matchMedia('(max-width:800px)').matches)
        el('game').scrollIntoView({ block: 'center' });
      refresh();
    };
    el('shop').append(b);
    cards.set(kind, b);
  }
  const refreshSquad = bindSquadControls(session, career, refresh);
  const refreshAdventure = bindAdventureControls(session, refresh);
  const refreshFeast = bindFeastControls(session, refresh);
  const openToolHelp = bindCampToolHelp(session, refresh);
  const refreshDock = bindBattleDock(session, career, refresh, openToolHelp);
  const refreshThreats = bindThreatControls(session, refresh);
  const refreshRewards = bindRewardControls(session, refresh);
  bindUnitGuide(session, refresh);
  el('start').onclick = () => {
    afterChange();
    session.game.startWave();
    refresh();
  };
  el('pause').onclick = () => {
    if (session.game.paused) pauses.resume();
    else pauses.interrupt();
    refresh();
  };
  el('resume-game').onclick = () => {
    pauses.resume();
    refresh();
  };
  el('speed').onclick = () => {
    session.speed = session.speed === 1 ? 2 : 1;
    refresh();
  };
  el('repair').onclick = () => {
    session.game.repair();
    refresh();
  };
  el('cancel').onclick = () => {
    session.selectUnit(null);
    session.game.message = 'Placement annulé. Choisis un allié ou lance la vague.';
    refresh();
  };
  const restart = () => {
    if (actions?.restart) actions.restart();
    else session.restart();
    catalogView = 'ready';
    familySelect.value = 'all';
    refresh();
  };
  const restartDialog = el<HTMLDialogElement>('restart-dialog');
  const restartModal = pauseForDialog(restartDialog, session, refresh);
  el('reset').onclick = () => {
    const g = session.game;
    if (session.hasPlaced || g.wave > 0 || g.gold !== 300 || g.base !== 100) restartModal.open();
    else restart();
  };
  el('keep-playing').onclick = restartModal.close;
  el('confirm-restart').onclick = () => {
    restart();
    restartModal.close();
  };
  el('end-restart').onclick = restart;
  const dialog = el<HTMLDialogElement>('help-dialog');
  const helpModal = pauseForDialog(dialog, session, refresh);
  el('help').onclick = helpModal.open;
  el('close-help').onclick = helpModal.close;
  el('play-help').onclick = helpModal.close;
  bindLifecycle(session, refresh);
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && !document.querySelector('dialog[open]')) {
      session.selectUnit(null);
      refresh();
    }
    if (
      session.screen === 'battle' &&
      e.code === 'Space' &&
      !(
        e.target instanceof HTMLElement &&
        e.target.closest('button, select, input, textarea, summary, a, [contenteditable]')
      ) &&
      !document.querySelector('dialog[open]')
    ) {
      e.preventDefault();
      if (session.game.paused) pauses.resume();
      else pauses.interrupt();
      refresh();
    }
  });
  function refresh() {
    if (document.hidden) pauses.interrupt();
    syncOrientation();
    afterChange();
    const nextWave = Math.min(
      session.game.totalWaves,
      session.game.wave + (session.game.status === 'preparing' ? 1 : 0),
    );
    const briefing = session.game.briefing;
    const finished = session.game.status === 'won' || session.game.status === 'lost';
    setDisplayText(
      el('level-name'),
      session.game.mission
        ? missionById(session.game.mission.missionId)!.name
        : session.game.level.name,
    );
    setDisplayText(
      el('level-subtitle'),
      session.game.mission ? session.game.level.name : session.game.level.subtitle,
    );
    if (finished) session.selectUnit(null);
    el('end-restart').hidden = !finished || !!session.game.mission;
    setDisplayText(
      el('brief-title'),
      `${session.game.status === 'preparing' ? 'Prochaine vague' : 'Vague en cours'} · ${Math.max(1, nextWave)} / ${session.game.totalWaves} · ${briefing.title}`,
    );
    setDisplayText(el('brief-tip'), briefing.tip);
    if (finished) {
      setDisplayText(
        el('brief-title'),
        session.game.status === 'won'
          ? session.game.mission
            ? 'Expédition réussie !'
            : 'La vallée est sauvée !'
          : 'Le camp est tombé',
      );
      setDisplayText(
        el('brief-tip'),
        session.game.status === 'won'
          ? session.game.mission
            ? 'Tes alliés ont tenu ! Retrouve la carte pour choisir la suite.'
            : 'Douze vagues repoussées. Le goûter peut commencer !'
          : defeatCopy(session.game).subtitle,
      );
    }
    refreshFeast();
    refreshDock();
    refreshThreats();
    refreshHud(session.game);
    refreshResult();
    const selected = session.selected;
    el('selection-panel').hidden = !selected && !session.selectedFeast;
    el('message').hidden = !!selected || !!session.selectedFeast;
    if (selected) {
      setDisplayText(el('selection-name'), kinds[selected].name);
      setDisplayText(el('selection-hint'), placementAdvice(selected).hint);
      el('selection-portrait').style.cssText = portraitStyle(selected);
    } else if (session.selectedFeast) {
      setDisplayText(
        el('selection-name'),
        session.selectedFeast === 'sticky' ? 'Miel collant' : 'Miel attirant',
      );
      setDisplayText(
        el('selection-hint'),
        session.actionHint ??
          'Touche un chemin attaqué. Les boutons Haut, Centre et Bas restent disponibles.',
      );
      el('selection-portrait').style.cssText = feastIconStyle(session.selectedFeast);
    }
    if (finished) {
      el<HTMLDetailsElement>('brief-title').closest('details')!.open = true;
      el<HTMLDetailsElement>('camp-observation').open = true;
      el<HTMLDetailsElement>('camp-tools').open = true;
    }
    setDisplayText(el('pause'), session.game.paused ? '▶' : 'Ⅱ');
    setDisplayAttribute(
      el('pause'),
      'aria-label',
      session.game.paused ? 'Reprendre' : 'Mettre en pause',
    );
    setDisplayText(el('speed'), `×${session.speed}`);
    const end = session.game.status === 'won' || session.game.status === 'lost';
    el<HTMLButtonElement>('start').disabled =
      session.game.status !== 'preparing' ||
      session.game.paused ||
      session.game.rewards.pending !== null;
    setDisplayText(
      el('start'),
      end
        ? 'Partie terminée'
        : session.game.rewards.pending !== null
          ? 'Choisir un bonus'
          : session.game.status === 'fighting'
            ? 'Vague en cours…'
            : session.game.wave
              ? 'Vague suivante'
              : 'Lancer la vague',
    );
    el<HTMLButtonElement>('pause').disabled = end;
    el<HTMLButtonElement>('repair').disabled =
      end || session.game.paused || session.game.gold < 80 || session.game.base >= 100;
    el('cancel').hidden = !session.selected && !session.selectedFeast;
    let ready = 0,
      future = 0;
    for (const kind of cards.keys()) {
      if (!matchesUnitFamily(kind, familySelect.value)) continue;
      if (session.game.isUnlocked(kind)) ready++;
      else future++;
    }
    if (!future) catalogView = 'ready';
    el<HTMLButtonElement>('shop-future').disabled = !future;
    setDisplayText(el('shop-ready'), `Disponibles (${ready})`);
    setDisplayText(el('shop-future'), `À découvrir (${future})`);
    el('shop-ready').setAttribute('aria-pressed', String(catalogView === 'ready'));
    el('shop-future').setAttribute('aria-pressed', String(catalogView === 'future'));
    setDisplayText(
      el('shop-note'),
      catalogView === 'ready'
        ? ready
          ? 'Choisis un allié, puis place-le dans ton camp. Les prix sont en pièces.'
          : 'Ces alliés arrivent plus tard. Ouvre « À découvrir » pour les rencontrer.'
        : 'Voici les prochains alliés. Le guide explique leurs rôles avant leur arrivée.',
    );
    for (const [kind, b] of cards) {
      const locked = !session.game.isUnlocked(kind);
      b.hidden =
        !matchesUnitFamily(kind, familySelect.value) ||
        (catalogView === 'ready' ? locked : !locked);
      const cost = session.game.recruitCost(kind);
      b.disabled = end || session.game.paused || locked || session.game.gold < cost;
      const price = b.querySelector<HTMLElement>('.price')!;
      setDisplayText(price.firstChild!, cost === 0 ? 'Offert' : `${cost} `);
      price.querySelector<HTMLElement>('i')!.hidden = cost === 0;
      setDisplayText(price.querySelector<HTMLElement>('.sr-only')!, cost === 0 ? '' : ' pièces');
      b.classList.toggle('free-offer', cost === 0);
      setDisplayText(
        b.querySelector('small')!,
        locked
          ? session.game.mission
            ? 'À découvrir dans une autre mission'
            : `Arrive à la vague ${unlockWave[kind]}`
          : session.game.gold < cost
            ? `Encore ${cost - session.game.gold} pièces`
            : (descriptions[kind] ?? ''),
      );
      const reason = locked
        ? session.game.mission
          ? 'À découvrir dans une autre mission'
          : `Arrive à la vague ${unlockWave[kind]}`
        : session.game.gold < cost
          ? `Il manque ${cost - session.game.gold} pièces`
          : descriptions[kind];
      b.dataset.state = locked
        ? 'locked'
        : session.game.gold < cost
          ? 'poor'
          : session.selected === kind
            ? 'selected'
            : 'ready';
      setDisplayAttribute(
        b,
        'aria-label',
        `${kinds[kind].name}, ${cost === 0 ? 'offert' : `${cost} pièces`}. ${reason}.`,
      );
      b.classList.toggle('selected', session.selected === kind);
      b.setAttribute('aria-pressed', String(session.selected === kind));
    }
    refreshRewards();
    refreshSquad();
    refreshAdventure();
  }
  return refresh;
}
