import { bindMissionPreparation } from './missionPreparation.ts';
import { helpPoint } from './helpBubble.ts';
import type { BalanceRevision } from '../balanceRevision.ts';
import { bindCapricePreparation, canLaunchCaprice, friendsViewHasContent } from './capriceView.ts';
import { capriceBudget, capriceRules } from '../caprices.ts';
import type { Kind } from '../data.ts';
import type { AlbumsController } from './capriceAlbums.ts';
import { setText as setDisplayText, setTitle as setDisplayTitle } from '../i18n/dom.ts';
import { drawMissionPreview, showMissionScouting } from './missionPreview.ts';
import type { Session } from '../session.ts';
import { createMissionRun, missionById } from '../missions.ts';
import type { MissionRun } from '../missions.ts';
import type { createMissionProgressController } from '../missionProgress.ts';
import { kinds } from '../data.ts';
import { portraitStyle } from '../art.ts';
import { bindDepartureControls } from './departures.ts';
import { byId } from './dom.ts';
import { originalRulesLabel, portrait } from './gameParts.ts';

type Progress = ReturnType<typeof createMissionProgressController>;
type Actions = {
  launch: (run: MissionRun, kinds?: readonly Kind[], retry?: boolean) => void | boolean;
  canResume: () => boolean;
  profileChanged?: () => void;
  launchClassic: (seed: number, balanceRevision: BalanceRevision) => void;
};

export const freshSeed = () => crypto.getRandomValues(new Uint32Array(1))[0];
/** The three terrains of a mission, as the preparation and the voyage map name them. */
export const lands = ['Détours', 'Méandres', 'Carrefour'];
export const assaults = {
  balanced: 'Arrivées régulières',
  rush: 'Petits groupes rapides',
  escort: 'Avancées groupées',
};
export const nests = { spread: 'Éclosions décalées', clustered: 'Couvée groupée' };

/** Another draw of the same mission: its rules and its caprice stay. */
function drawAgain(run: MissionRun): MissionRun {
  const { rules: _, ...draw } = createMissionRun(run.missionId, freshSeed(), run, run.balance);
  const next = run.rules === 2 ? { ...draw, rules: 2 as const } : draw;
  return run.caprice ? { ...next, caprice: run.caprice } : next;
}

/** What the preparation says of a departure: its mission, its budget and its three draws. */
function describeRun(run: MissionRun, resumable: boolean, replayable: boolean) {
  const mission = missionById(run.missionId)!;
  setDisplayText(byId('mission-title'), mission.name);
  setDisplayText(byId('mission-objective'), mission.objective);
  byId('mission-replacement-note').hidden = !resumable;
  setDisplayText(
    byId('mission-budget'),
    `${capriceBudget(mission.budget, capriceRules(run))} pièces · ${mission.waves.length} vagues · nouveaux alliés`,
  );
  setDisplayText(byId('mission-land'), lands[run.layout]);
  setDisplayText(byId('mission-assault'), assaults[run.assault]);
  setDisplayText(byId('mission-nest'), nests[run.nest]);
  byId('mission-retry').hidden = !replayable;
}

/** Every mission begins with the hero and two club fighters. */
function drawStartingParty() {
  const party = byId('mission-party');
  party.replaceChildren();
  for (const kind of ['hero', 'club', 'club'] as const) {
    const face = portrait(kind);
    setDisplayTitle(face, kinds[kind].name);
    party.append(face);
  }
}

/**
 * The preparation of a mission: the departure being looked at, what its window says of it,
 * and the buttons that draw another one or start it. It never writes simulation rules.
 */
export function bindMissionDraft(
  session: Session,
  progress: Progress,
  actions: Actions,
  albums?: AlbumsController,
) {
  const dialog = byId<HTMLDialogElement>('mission-dialog');
  let draft: MissionRun | null = null;
  const legacyLabel = originalRulesLabel('mission-original-rules', byId('mission-title'));
  const stars = (run: MissionRun) => progress.state.bestStars[run.missionId] ?? 0;
  const allowed = (run: MissionRun) =>
    canLaunchCaprice(run, progress.unlocked(run.missionId), stars(run));
  const changed = () => dialog.dispatchEvent(new Event('mission-preparation-change'));

  /** A caprice is picked or dropped: the same departure, without leaving the view. */
  function chooseCaprice(id?: string) {
    if (!draft) return;
    const { caprice: _, ...normal } = draft;
    show(id ? { ...normal, caprice: id } : normal, false);
  }
  function chooseFriends(chosen: readonly Kind[]) {
    if (draft) showMissionScouting(draft, chosen);
    changed();
  }
  const preparation = bindCapricePreparation(
    dialog,
    chooseCaprice,
    albums,
    actions.profileChanged,
    portraitStyle,
    chooseFriends,
  );
  const views = bindMissionPreparation(dialog, helpPoint);
  const departures = bindDepartureControls(session, {
    unlocked: allowed,
    previewMission: show,
    launchClassic: actions.launchClassic,
  });

  /** Opens the preparation on this departure, or refreshes it in place. */
  function show(run: MissionRun, resetScroll = true) {
    if (!allowed(run)) return;
    draft = run;
    legacyLabel.hidden = run.balance === 2;
    preparation.update(run, stars(run));
    views.offerFriends(friendsViewHasContent(run, albums?.state.children.length ?? 0));
    departures.preview(run);
    describeRun(run, actions.canResume(), !!progress.lastRun(run.missionId));
    drawMissionPreview(byId('mission-map') as unknown as SVGElement, run);
    showMissionScouting(run, preparation.chosen());
    drawStartingParty();
    dialog.dataset.run = JSON.stringify(run);
    if (!dialog.open) dialog.showModal();
    changed();
    if (resetScroll) rewind();
  }
  /** A new departure starts on the first view, at the top, the title in focus. */
  function rewind() {
    views.reset();
    dialog.scrollTop = 0;
    dialog.querySelector('.mission-dialog-body')!.scrollTop = 0;
    byId('mission-title').focus({ preventScroll: true });
  }
  /** Opens the preparation straight on the caprices of this departure, for who comes for one. */
  function showCaprices(run: MissionRun) {
    show(run);
    if (draft === run) views.show('caprices');
  }

  byId('mission-close').onclick = () => dialog.close();
  byId('mission-reroll').onclick = () => {
    if (draft) show(drawAgain(draft));
  };
  byId('mission-retry').onclick = () => {
    const previous = draft && progress.lastRun(draft.missionId);
    if (previous) show(previous);
  };
  byId('mission-launch').onclick = () => {
    if (!draft || !allowed(draft)) return;
    if (actions.launch(draft, preparation.chosen()) !== false) dialog.close();
  };
  return { show, showCaprices, allowed, refreshCodes: departures.refresh };
}
