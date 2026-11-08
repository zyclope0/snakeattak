import { childCopy } from './childCopy.ts';
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
  actions?: { restart?: () => void },
) {
  document.documentElement.style.setProperty('--ui-art', `url("${UI_ART_URL}")`);
  const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
  const syncOrientation = bindOrientation(session, refresh);
  const cards = new Map<Kind, HTMLButtonElement>();
  const refreshHud = bindHud();
  el('mobile-home').onclick = () => el('menu-home').click();
  bindDisplay();
  bindReinforcementsDrawer();
  bindVisualSettings();
  let catalogView: 'ready' | 'future' = 'ready';
  const familySelect = el<HTMLSelectElement>('shop-family');
  for (const [value, label] of Object.entries(UNIT_FAMILIES)) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
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
    b.title = d.description;
    b.dataset.kind = kind;
    b.setAttribute('aria-pressed', 'false');
    b.innerHTML = `<span class="portrait" aria-hidden="true"></span><span class="unit-info"><strong>${d.name}</strong><small>${descriptions[kind]}</small></span><span class="price">${d.cost} <i aria-hidden="true">●</i><span class="sr-only"> pièces</span></span>`;
    b.querySelector<HTMLElement>('.portrait')!.style.cssText = portraitStyle(kind);
    b.onclick = () => {
      session.selected = session.selected === kind ? null : kind;
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
  const refreshRewards = bindRewardControls(session, refresh);
  bindUnitGuide(session, refresh);
  el('start').onclick = () => {
    afterChange();
    session.game.startWave();
    refresh();
  };
  el('pause').onclick = () => {
    session.game.paused = !session.game.paused;
    refresh();
  };
  el('resume-game').onclick = () => {
    session.game.paused = false;
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
    session.selected = null;
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
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      session.game.paused = true;
      refresh();
    }
  });
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      session.selected = null;
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
      session.game.paused = !session.game.paused;
      refresh();
    }
  });
  function refresh() {
    syncOrientation();
    afterChange();
    const nextWave = Math.min(
      session.game.totalWaves,
      session.game.wave + (session.game.status === 'preparing' ? 1 : 0),
    );
    const briefing = session.game.briefing;
    const finished = session.game.status === 'won' || session.game.status === 'lost';
    el('level-name').textContent = session.game.mission
      ? missionById(session.game.mission.missionId)!.name
      : session.game.level.name;
    el('level-subtitle').textContent = session.game.mission
      ? session.game.level.name
      : session.game.level.subtitle;
    if (finished) session.selected = null;
    el('end-restart').hidden = !finished || !!session.game.mission;
    el('brief-title').textContent =
      `${session.game.status === 'preparing' ? 'Prochaine vague' : 'Vague en cours'} · ${Math.max(1, nextWave)} / ${session.game.totalWaves} · ${briefing.title}`;
    el('brief-tip').textContent = childCopy(briefing.tip);
    if (finished) {
      el('brief-title').textContent =
        session.game.status === 'won'
          ? session.game.mission
            ? 'Expédition réussie !'
            : 'La vallée est sauvée !'
          : 'Le camp est tombé';
      el('brief-tip').textContent =
        session.game.status === 'won'
          ? session.game.mission
            ? 'Tes alliés ont tenu ! Retrouve la carte pour choisir la suite.'
            : 'Douze vagues repoussées. Le goûter peut commencer !'
          : 'Consulte le statut de sauvegarde pour reprendre un camp, ou commence une nouvelle aventure.';
    }
    refreshFeast();
    refreshHud(session.game);
    const selected = session.selected;
    el('selection-panel').hidden = !selected;
    el('message').hidden = !!selected;
    if (selected) {
      el('selection-name').textContent = kinds[selected].name;
      const readout = placementReadout(session.game, selected);
      el('selection-hint').textContent =
        `${readout?.category ?? 'Placement'} · portée initiale ${kinds[selected].range}. Touche ton camp ; cet allié agit ensuite seul.`;
      el('selection-portrait').style.cssText = portraitStyle(selected);
    }
    if (finished) {
      el<HTMLDetailsElement>('brief-title').closest('details')!.open = true;
      el<HTMLDetailsElement>('camp-observation').open = true;
      el<HTMLDetailsElement>('camp-tools').open = true;
    }
    el('pause').textContent = session.game.paused ? '▶' : 'Ⅱ';
    el('pause').setAttribute('aria-label', session.game.paused ? 'Reprendre' : 'Mettre en pause');
    el('speed').textContent = `×${session.speed}`;
    const end = session.game.status === 'won' || session.game.status === 'lost';
    el<HTMLButtonElement>('start').disabled =
      session.game.status !== 'preparing' ||
      session.game.paused ||
      session.game.rewards.pending !== null;
    el('start').textContent = end
      ? 'Partie terminée'
      : session.game.rewards.pending !== null
        ? 'Choisir un bonus'
        : session.game.status === 'fighting'
          ? 'Vague en cours…'
          : session.game.wave
            ? 'Vague suivante'
            : 'Lancer la vague';
    el<HTMLButtonElement>('pause').disabled = end;
    el<HTMLButtonElement>('repair').disabled =
      end || session.game.paused || session.game.gold < 80 || session.game.base >= 100;
    el('cancel').hidden = !session.selected;
    let ready = 0,
      future = 0;
    for (const kind of cards.keys()) {
      if (!matchesUnitFamily(kind, familySelect.value)) continue;
      if (session.game.isUnlocked(kind)) ready++;
      else future++;
    }
    if (!future) catalogView = 'ready';
    el<HTMLButtonElement>('shop-future').disabled = !future;
    el('shop-ready').textContent = `Disponibles (${ready})`;
    el('shop-future').textContent = `À découvrir (${future})`;
    el('shop-ready').setAttribute('aria-pressed', String(catalogView === 'ready'));
    el('shop-future').setAttribute('aria-pressed', String(catalogView === 'future'));
    el('shop-note').textContent =
      catalogView === 'ready'
        ? ready
          ? 'Choisis un allié, puis place-le dans ton camp. Les prix sont en pièces.'
          : 'Ces alliés arrivent plus tard. Ouvre « À découvrir » pour les rencontrer.'
        : 'Voici les prochains alliés. Le guide explique leurs rôles avant leur arrivée.';
    for (const [kind, b] of cards) {
      const locked = !session.game.isUnlocked(kind);
      b.hidden =
        !matchesUnitFamily(kind, familySelect.value) ||
        (catalogView === 'ready' ? locked : !locked);
      const cost = session.game.recruitCost(kind);
      b.disabled = end || session.game.paused || locked || session.game.gold < cost;
      const price = b.querySelector<HTMLElement>('.price')!;
      price.firstChild!.textContent = cost === 0 ? 'Offert' : `${cost} `;
      price.querySelector<HTMLElement>('i')!.hidden = cost === 0;
      price.querySelector<HTMLElement>('.sr-only')!.textContent = cost === 0 ? '' : ' pièces';
      b.classList.toggle('free-offer', cost === 0);
      b.querySelector('small')!.textContent = locked
        ? session.game.mission
          ? 'À découvrir dans une autre mission'
          : `Arrive à la vague ${unlockWave[kind]}`
        : session.game.gold < cost
          ? `Encore ${cost - session.game.gold} pièces`
          : (descriptions[kind] ?? '');
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
      b.setAttribute(
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
