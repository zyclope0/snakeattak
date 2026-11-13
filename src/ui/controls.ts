import { bindCatalogPages } from './catalogPages.ts';
import { campToolModel } from './campToolModel.ts';
import { availableGold, canSpend } from './capriceBudget.ts';
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
import { byId, narrowScreen } from './dom.ts';
export function bindControls(
  session: Session,
  afterChange: () => void = () => {},
  career?: ReturnType<typeof createCareer>,
  actions?: {
    restart?: () => void;
  },
) {
  document.documentElement.style.setProperty('--ui-art', `url("${UI_ART_URL}")`);
  const pauses = pauseStateFor(session);
  const syncOrientation = bindOrientation(session, refresh);
  const cards = new Map<Kind, HTMLButtonElement>();
  const refreshHud = bindHud();
  const refreshResult = bindBattleResult(session);
  byId('mobile-home').onclick = () => byId('menu-home').click();
  byId('pause-home').onclick = () => byId('menu-home').click();
  bindDisplay();
  const catalogue = bindReinforcementsDrawer(session, refresh);
  const pages = bindCatalogPages(refresh);
  bindVisualSettings();
  let catalogView: 'ready' | 'future' = 'ready';
  const familySelect = byId<HTMLSelectElement>('shop-family');
  for (const [value, label] of Object.entries(UNIT_FAMILIES)) {
    const option = document.createElement('option');
    option.value = value;
    setDisplayText(option, label);
    familySelect.append(option);
  }
  familySelect.onchange = () => {
    pages.reset();
    refresh();
  };
  byId('shop-ready').onclick = () => {
    catalogView = 'ready';
    pages.reset();
    refresh();
  };
  byId('shop-future').onclick = () => {
    catalogView = 'future';
    pages.reset();
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
      `<span class="portrait" aria-hidden="true"></span><span class="unit-info"><strong>${d.name}</strong><small>${descriptions[kind]}</small></span><span class="price">${session.game.recruitCost(kind)} <i aria-hidden="true">●</i><span class="sr-only"> pièces</span></span>`,
    );
    b.querySelector<HTMLElement>('.portrait')!.style.cssText = portraitStyle(kind);
    b.onclick = () => {
      session.selectUnit(session.selected === kind ? null : kind);
      session.game.message = session.selected
        ? `${d.name} : touche un espace libre dans ton camp, à droite.`
        : 'Placement annulé.';
      if (session.selected && narrowScreen()) byId('game').scrollIntoView({ block: 'center' });
      refresh();
    };
    byId('shop').append(b);
    cards.set(kind, b);
  }
  const refreshSquad = bindSquadControls(session, career, refresh);
  const refreshAdventure = bindAdventureControls(session, refresh, catalogue.actionsPaused);
  const refreshFeast = bindFeastControls(session, refresh, catalogue.actionsPaused);
  const openToolHelp = bindCampToolHelp(session, refresh);
  const refreshDock = bindBattleDock(session, career, refresh, openToolHelp);
  const refreshThreats = bindThreatControls(session, refresh);
  const refreshRewards = bindRewardControls(session, refresh);
  bindUnitGuide(session, refresh);
  byId('start').onclick = () => {
    afterChange();
    session.game.startWave();
    refresh();
  };
  byId('pause').onclick = () => {
    if (session.game.status === 'won' || session.game.status === 'lost') return;
    if (session.game.paused) pauses.resume();
    else pauses.interrupt();
    refresh();
  };
  byId('resume-game').onclick = () => {
    if (session.game.status === 'won' || session.game.status === 'lost') return;
    pauses.resume();
    refresh();
  };
  byId('speed').onclick = () => {
    session.speed = session.speed === 1 ? 2 : 1;
    refresh();
  };
  byId('repair').onclick = () => {
    session.repair();
    refresh();
  };
  byId('cancel').onclick = () => {
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
  const restartDialog = byId<HTMLDialogElement>('restart-dialog');
  const restartModal = pauseForDialog(restartDialog, session, refresh);
  byId('reset').onclick = () => {
    const g = session.game;
    if (session.hasPlaced || g.wave > 0 || g.gold !== 300 || g.base !== 100) restartModal.open();
    else restart();
  };
  byId('keep-playing').onclick = restartModal.close;
  byId('confirm-restart').onclick = () => {
    restart();
    restartModal.close();
  };
  byId('end-restart').onclick = restart;
  const dialog = byId<HTMLDialogElement>('help-dialog');
  const helpModal = pauseForDialog(dialog, session, refresh);
  byId('help').onclick = helpModal.open;
  byId('close-help').onclick = helpModal.close;
  byId('play-help').onclick = helpModal.close;
  bindLifecycle(session, refresh);
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && !document.querySelector('dialog[open]')) {
      session.selectUnit(null);
      refresh();
    }
    if (
      session.screen === 'battle' &&
      session.game.status !== 'won' &&
      session.game.status !== 'lost' &&
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
      byId('level-name'),
      session.game.mission
        ? missionById(session.game.mission.missionId)!.name
        : session.game.level.name,
    );
    setDisplayText(
      byId('level-subtitle'),
      session.game.mission ? session.game.level.name : session.game.level.subtitle,
    );
    if (finished) session.selectUnit(null);
    byId('end-restart').hidden = !finished || !!session.game.mission;
    setDisplayText(
      byId('brief-title'),
      `${session.game.status === 'preparing' ? 'Prochaine vague' : 'Vague en cours'} · ${Math.max(1, nextWave)} / ${session.game.totalWaves} · ${briefing.title}`,
    );
    setDisplayText(byId('brief-tip'), briefing.tip);
    if (finished) {
      setDisplayText(
        byId('brief-title'),
        session.game.status === 'won'
          ? session.game.mission
            ? 'Expédition réussie !'
            : 'La vallée est sauvée !'
          : 'Le camp est tombé',
      );
      setDisplayText(
        byId('brief-tip'),
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
    byId('selection-panel').hidden = !selected && !session.selectedFeast;
    byId('message').hidden = !!selected || !!session.selectedFeast;
    if (selected) {
      setDisplayText(byId('selection-name'), kinds[selected].name);
      setDisplayText(byId('selection-hint'), placementAdvice(selected).hint);
      byId('selection-portrait').style.cssText = portraitStyle(selected);
    } else if (session.selectedFeast) {
      setDisplayText(
        byId('selection-name'),
        session.selectedFeast === 'sticky' ? 'Miel collant' : 'Miel attirant',
      );
      setDisplayText(
        byId('selection-hint'),
        session.actionHint ??
          'Touche un chemin attaqué. Les boutons Haut, Centre et Bas restent disponibles.',
      );
      byId('selection-portrait').style.cssText = feastIconStyle(session.selectedFeast);
    }
    if (finished) {
      byId<HTMLDetailsElement>('brief-title').closest('details')!.open = true;
      byId<HTMLDetailsElement>('camp-observation').open = true;
      byId<HTMLDetailsElement>('camp-tools').open = true;
    }
    setDisplayText(byId('pause'), session.game.paused ? '▶' : 'Ⅱ');
    setDisplayAttribute(
      byId('pause'),
      'aria-label',
      session.game.paused ? 'Reprendre' : 'Mettre en pause',
    );
    setDisplayText(byId('speed'), `×${session.speed}`);
    const end = session.game.status === 'won' || session.game.status === 'lost';
    byId<HTMLButtonElement>('start').disabled =
      session.game.status !== 'preparing' ||
      session.game.paused ||
      session.game.rewards.pending !== null;
    // Presentation only: during a wave the launch button gives its place to the speed button.
    byId('start').dataset.state = end
      ? 'ended'
      : session.game.rewards.pending !== null
        ? 'reward'
        : session.game.status;
    setDisplayText(
      byId('start'),
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
    byId<HTMLButtonElement>('pause').disabled = end;
    byId('pause').hidden = end;
    byId<HTMLButtonElement>('repair').disabled =
      catalogue.actionsPaused() || !campToolModel(session.game, 'repair').ready;
    byId('cancel').hidden = !session.selected && !session.selectedFeast;
    let ready = 0,
      future = 0;
    for (const kind of cards.keys()) {
      if (!matchesUnitFamily(kind, familySelect.value) || !session.game.capriceAllows(kind))
        continue;
      if (session.game.isUnlocked(kind)) ready++;
      else future++;
    }
    if (!future) catalogView = 'ready';
    byId<HTMLButtonElement>('shop-future').disabled = !future;
    setDisplayText(byId('shop-ready'), `Disponibles (${ready})`);
    setDisplayText(byId('shop-future'), `À découvrir (${future})`);
    byId('shop-ready').setAttribute('aria-pressed', String(catalogView === 'ready'));
    byId('shop-future').setAttribute('aria-pressed', String(catalogView === 'future'));
    setDisplayText(
      byId('shop-note'),
      catalogView === 'ready'
        ? ready
          ? 'Choisis un allié, puis place-le dans ton camp. Les prix sont en pièces.'
          : session.game.mission?.caprice
            ? 'Aucun allié permis dans ce filtre pour ce caprice.'
            : 'Ces alliés arrivent plus tard. Ouvre « À découvrir » pour les rencontrer.'
        : 'Voici les prochains alliés. Le guide explique leurs rôles avant leur arrivée.',
    );
    for (const [kind, b] of cards) {
      const locked = !session.game.isUnlocked(kind);
      b.hidden =
        !matchesUnitFamily(kind, familySelect.value) ||
        !session.game.capriceAllows(kind) ||
        (catalogView === 'ready' ? locked : !locked);
      const cost = session.game.recruitCost(kind);
      b.disabled =
        end ||
        (session.game.paused && !(byId('reinforcements') as HTMLDialogElement).open) ||
        locked ||
        !canSpend(session.game, cost);
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
          : !canSpend(session.game, cost)
            ? session.game.caprice.reserve
              ? 'Réserve bancaire protégée'
              : `Encore ${cost - availableGold(session.game)} pièces`
            : (descriptions[kind] ?? ''),
      );
      const reason = locked
        ? session.game.mission
          ? 'À découvrir dans une autre mission'
          : `Arrive à la vague ${unlockWave[kind]}`
        : !canSpend(session.game, cost)
          ? session.game.caprice.reserve
            ? 'Réserve bancaire protégée'
            : `Il manque ${cost - availableGold(session.game)} pièces`
          : descriptions[kind];
      b.dataset.state = locked
        ? 'locked'
        : !canSpend(session.game, cost)
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
    pages.refresh([...cards.values()].filter((card) => !card.hidden));
    catalogue.refresh();
    refreshRewards();
    refreshSquad();
    refreshAdventure();
  }
  return refresh;
}
