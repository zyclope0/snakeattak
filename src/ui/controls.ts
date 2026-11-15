import { bindBattleResult } from './battleResult.ts';
import { bindThreatControls } from './threatControls.ts';
import { bindCampToolHelp } from './campToolHelp.ts';
import { bindBattleDock } from './battleDock.ts';
import { pauseStateFor } from './pauseState.ts';
import { bindLifecycle } from './lifecycle.ts';
import { bindOrientation } from './orientation.ts';
import { bindReinforcementsDrawer } from './reinforcementsDrawer.ts';
import { bindSquadControls } from './squadControls.ts';
import { bindAdventureControls } from './adventureControls.ts';
import type { createCareer } from '../progression.ts';
import { bindRewardControls } from './rewardControls.ts';
import { bindUnitGuide } from './unitGuide.ts';
import { bindFeastControls } from './feastControls.ts';
import { bindHud } from './hud.ts';
import { bindDisplay } from './display.ts';
import { bindVisualSettings } from './visualSettings.ts';
import { pauseForDialog } from './dialogs.ts';
import type { Session } from '../session.ts';
import { UI_ART_URL } from '../art.ts';
import { byId, forwardClick } from './dom.ts';
import { battleOver } from './battleState.ts';
import { openCampDetails, showBriefing, showLevel, showSelection } from './battleBriefing.ts';
import { bindBattleCommands, bindBattleKeys } from './battleCommands.ts';
import { bindRecruitShop } from './recruitShop.ts';
import { CRYSTAL_MAX, START_GOLD } from '../gameConstants.ts';

/**
 * Wires the battle screen. Each part of the screen has its own module; this function only
 * binds them, in an order that matters (listeners fire in it), and returns the one `refresh`
 * that redraws the whole screen from the session.
 */
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
  const refreshHud = bindHud();
  const refreshResult = bindBattleResult(session);
  forwardClick('mobile-home', 'menu-home');
  forwardClick('pause-home', 'menu-home');
  bindDisplay();
  const catalogue = bindReinforcementsDrawer(session, refresh);
  bindVisualSettings();
  const shop = bindRecruitShop(session, refresh);
  const refreshSquad = bindSquadControls(session, career, refresh);
  const refreshAdventure = bindAdventureControls(session, refresh, catalogue.actionsPaused);
  const refreshFeast = bindFeastControls(session, refresh, catalogue.actionsPaused);
  const openToolHelp = bindCampToolHelp(session, refresh);
  const refreshDock = bindBattleDock(session, career, refresh, openToolHelp);
  const refreshThreats = bindThreatControls(session, refresh);
  const refreshRewards = bindRewardControls(session, refresh);
  bindUnitGuide(session, refresh);
  const refreshCommands = bindBattleCommands(session, refresh, {
    beforeWave: afterChange,
    actionsPaused: catalogue.actionsPaused,
  });
  bindRestart(session, refresh, () => {
    if (actions?.restart) actions.restart();
    else session.restart();
    shop.showEverything();
    refresh();
  });
  bindHelpDialog(session, refresh);
  bindLifecycle(session, refresh);
  bindBattleKeys(session, refresh);
  // The order below is part of the behaviour: a step may read what an earlier one wrote
  // (a selection dropped, a window closed).
  function refresh() {
    if (document.hidden) pauses.interrupt();
    syncOrientation();
    afterChange();
    const finished = battleOver(session.game);
    showLevel(session.game);
    if (finished) session.selectUnit(null);
    byId('end-restart').hidden = !finished || !!session.game.mission;
    showBriefing(session.game);
    refreshFeast();
    refreshDock();
    refreshThreats();
    refreshHud(session.game);
    refreshResult();
    showSelection(session);
    if (finished) openCampDetails();
    refreshCommands();
    shop.refresh();
    catalogue.refresh();
    refreshRewards();
    refreshSquad();
    refreshAdventure();
  }
  return refresh;
}

/** Start again: at once on an untouched camp, after a confirmation otherwise. */
function bindRestart(session: Session, refresh: () => void, restart: () => void) {
  const modal = pauseForDialog(byId<HTMLDialogElement>('restart-dialog'), session, refresh);
  byId('reset').onclick = () => {
    const game = session.game;
    if (session.hasPlaced || game.wave > 0 || game.gold !== START_GOLD || game.base !== CRYSTAL_MAX)
      modal.open();
    else restart();
  };
  byId('keep-playing').onclick = modal.close;
  byId('confirm-restart').onclick = () => {
    restart();
    modal.close();
  };
  byId('end-restart').onclick = restart;
}

/** The « Comment jouer » window: the battle waits while it is open. */
function bindHelpDialog(session: Session, refresh: () => void) {
  const modal = pauseForDialog(byId<HTMLDialogElement>('help-dialog'), session, refresh);
  byId('help').onclick = modal.open;
  byId('close-help').onclick = modal.close;
  byId('play-help').onclick = modal.close;
}
