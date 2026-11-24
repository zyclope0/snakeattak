import type { BalanceRevision } from '../balanceRevision.ts';
import type { Kind } from '../data.ts';
import type { AlbumsController } from './capriceAlbums.ts';
import { setText as setDisplayText } from '../i18n/dom.ts';
import type { Session } from '../session.ts';
import { CURRENT_MISSION_PATHS, MISSIONS, createMissionRun } from '../missions.ts';
import type { MissionId, MissionRun } from '../missions.ts';
import type { createMissionProgressController } from '../missionProgress.ts';
import type { bindMissionDraft } from './missionDraft.ts';
import { freshSeed } from './missionWords.ts';
import { canLaunchCaprice } from './capriceGate.ts';
import { bindDepartureControls } from './departures.ts';
import { bindMissionOutcome } from './missionOutcome.ts';
import { missionJourney } from './missionJourney.ts';
import { missionCard, showJourney } from './missionJourneyView.ts';
import { capriceToPlay, missionStickers } from './stickerGoals.ts';
import type { StickerEarned } from './stickerGoals.ts';
import { byId } from './dom.ts';
import * as TEXT from '../texts/fr/missionScreens.ts';
import { fill } from '../texts/fill.ts';

type Progress = ReturnType<typeof createMissionProgressController>;
type Draft = ReturnType<typeof bindMissionDraft>;
type Departures = ReturnType<typeof bindDepartureControls>;
type MissionActions = {
  launch: (run: MissionRun, kinds?: readonly Kind[], retry?: boolean) => void | boolean;
  resume: () => void;
  canResume: () => boolean;
  home: () => void;
  showMissions?: () => void;
  profileChanged?: () => void;
  launchClassic: (seed: number, balanceRevision: BalanceRevision) => void;
};

/** Mission selection is separate from combat controls and never writes simulation rules. */
export function bindExpeditions(
  session: Session,
  progress: Progress,
  actions: MissionActions,
  albums?: AlbumsController,
) {
  const allowed = (run: MissionRun) => launchAllowed(progress, run);
  /**
   * The form of a departure code, on the parents' page, works before the preparation window
   * has arrived: a mission code waits for the window, a classic code never needs it.
   */
  const departures = bindDepartureControls(session, {
    unlocked: allowed,
    previewMission: (run) =>
      void withDraft(loadDraft, (ready) => ready.show(run), 'departure-message'),
    launchClassic: actions.launchClassic,
  });
  const loadDraft = missionDraftLoader(progress, actions, departures, albums);
  const prepare = (id: MissionId) =>
    void withDraft(loadDraft, (ready) => ready.show(freshRun(progress, id)));
  const prepareCaprices = (id: MissionId) =>
    void withDraft(loadDraft, (ready) => ready.showCaprices(freshRun(progress, id)));

  // Stickers are read from the book a new game would fill and, after a game, from the book
  // that game fills. Both are the same book unless an old save holds several.
  const inNextBook: StickerEarned = (id) => albums?.has(id) ?? false;
  const inGameBook: StickerEarned = (id) =>
    albums?.has(id, albums.state.campProfileId ?? undefined) ?? false;
  const cards = missionCards(prepare);
  const play = () => prepare(nextMission(progress).id);
  /**
   * The home's main button: no dialog between the first tap and the board. A caprice has to
   * be chosen, so that one opens the preparation on the caprices.
   */
  const playNow = () => {
    const caprice = nextCaprice(progress, inNextBook);
    if (caprice) return prepareCaprices(caprice.missionId);
    const run = freshRun(progress, nextMission(progress).id);
    if (allowed(run)) actions.launch(run, []);
  };
  const playLabel = () => (nextCaprice(progress, inNextBook) ? TEXT.jouerUnCaprice : TEXT.jouer);
  byId('home-play').onclick = play;
  byId('mission-continue').onclick = actions.resume;
  const refreshOutcome = bindMissionOutcome(session, {
    ...actions,
    prepare,
    prepareCaprices,
    unlocked: progress.unlocked,
    stickers: (id) => missionStickers(id, progress.state.bestStars[id], inGameBook),
  });

  const refresh = () => {
    departures.refresh();
    writeJourney(progress, cards, inNextBook);
    byId('mission-continue').hidden = !actions.canResume();
    refreshOutcome();
  };
  // Asked for once the home is drawn, not before: the first screen never waits for it.
  setTimeout(() => void loadDraft().catch(() => undefined), 0);
  return Object.assign(refresh, { play, playNow, playLabel, resume: actions.resume });
}

/**
 * The preparation window comes in a package of its own, asked for as soon as the home is
 * drawn: the first screen does not wait for it, and it is there by the first tap. If it
 * did not arrive, the next tap asks again; a browser keeps a module that failed once, so the
 * words say to reload the page (`missionsIndisponibles`).
 */
function missionDraftLoader(
  progress: Progress,
  actions: MissionActions,
  departures: Departures,
  albums: AlbumsController | undefined,
) {
  let drafting: Promise<Draft> | undefined;
  return () =>
    (drafting ??= import('./missionDraft.ts').then(
      (module) => module.bindMissionDraft(progress, actions, departures.preview, albums),
      (error: unknown) => {
        drafting = undefined;
        throw error;
      },
    ));
}

/** `where`: the line that says it when the window did not arrive. */
function withDraft(
  load: () => Promise<Draft>,
  use: (ready: Draft) => void,
  where = 'home-next-mission',
) {
  return load().then(use, () => setDisplayText(byId(where), TEXT.missionsIndisponibles));
}

/** A new draw of a mission; its last departure tells which draw not to repeat. */
const freshRun = (progress: Progress, id: MissionId) =>
  createMissionRun(id, freshSeed(), progress.lastRun(id), 2, CURRENT_MISSION_PATHS);

/** Whether this departure may start, from its mission being open and its best stars. */
const launchAllowed = (progress: Progress, run: MissionRun) =>
  canLaunchCaprice(
    run,
    progress.unlocked(run.missionId),
    progress.state.bestStars[run.missionId] ?? 0,
  );

/** The cards of the Missions page; a tap prepares that mission. */
function missionCards(prepare: (id: MissionId) => void) {
  return MISSIONS.map((mission, index) => {
    const card = missionCard(mission, index);
    card.button.onclick = () => prepare(mission.id);
    byId('mission-cards').append(card.button);
    return card;
  });
}

/** The first mission unlocked and never won; once all are won, the last one unlocked. */
const nextMission = (progress: Progress) =>
  MISSIONS.find((m) => progress.unlocked(m.id) && !progress.state.bestStars[m.id]) ??
  [...MISSIONS].reverse().find((m) => progress.unlocked(m.id))!;

/** Once the six missions are won, the caprice the home's main button leads to, if any. */
const nextCaprice = (progress: Progress, inNextBook: StickerEarned) =>
  capriceToPlay(progress.state.bestStars, inNextBook);

/** The home's next mission, the Missions page's button and its stars. */
function writeJourney(
  progress: Progress,
  cards: ReturnType<typeof missionCards>,
  inNextBook: StickerEarned,
) {
  const journey = missionJourney(progress.state.bestStars, progress.unlocked);
  const next = journey.find((step) => step.status === 'next');
  setDisplayText(
    byId('home-next-mission'),
    next
      ? fill(TEXT.prochaineMissionN, nextMission(progress).name)
      : (nextCaprice(progress, inNextBook)?.sentence ??
          fill(TEXT.rejouerLaMissionN, nextMission(progress).name)),
  );
  // The Missions page prepares a departure; only the home's main button starts at once.
  setDisplayText(byId('home-play'), next ? TEXT.preparer : TEXT.preparerEncore);
  setDisplayText(
    byId('mission-total'),
    fill(TEXT.n18Etoiles, showJourney(cards, journey, inNextBook)),
  );
}
