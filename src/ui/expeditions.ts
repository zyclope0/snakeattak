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

/** Mission selection is separate from combat controls and never writes simulation rules. */
export function bindExpeditions(
  session: Session,
  progress: Progress,
  actions: {
    launch: (run: MissionRun, kinds?: readonly Kind[], retry?: boolean) => void | boolean;
    resume: () => void;
    canResume: () => boolean;
    home: () => void;
    showMissions?: () => void;
    profileChanged?: () => void;
    launchClassic: (seed: number, balanceRevision: BalanceRevision) => void;
  },
  albums?: AlbumsController,
) {
  const allowed = (run: MissionRun) =>
    canLaunchCaprice(
      run,
      progress.unlocked(run.missionId),
      progress.state.bestStars[run.missionId] ?? 0,
    );
  /**
   * The form of a departure code, on the parents' page, works before the preparation window
   * has arrived: a mission code waits for the window, a classic code never needs it.
   */
  const departures = bindDepartureControls(session, {
    unlocked: allowed,
    previewMission: (run) => void withDraft((ready) => ready.show(run), 'departure-message'),
    launchClassic: actions.launchClassic,
  });
  /**
   * The preparation window comes in a package of its own, asked for as soon as the home is
   * drawn: the first screen does not wait for it, and it is there by the first tap. If it
   * did not arrive, the next tap asks again.
   */
  let drafting: Promise<ReturnType<typeof bindMissionDraft>> | undefined;
  const loadDraft = () =>
    (drafting ??= import('./missionDraft.ts').then(
      (module) => module.bindMissionDraft(progress, actions, departures.preview, albums),
      (error: unknown) => {
        drafting = undefined;
        throw error;
      },
    ));
  /** `where`: the line that says it when the window did not arrive. */
  const withDraft = (
    use: (ready: ReturnType<typeof bindMissionDraft>) => void,
    where = 'home-next-mission',
  ) => loadDraft().then(use, () => setDisplayText(byId(where), TEXT.missionsIndisponibles));
  /** A new draw of a mission; its last departure tells which draw not to repeat. */
  const freshRun = (id: MissionId) =>
    createMissionRun(id, freshSeed(), progress.lastRun(id), 2, CURRENT_MISSION_PATHS);
  const prepare = (id: MissionId) => void withDraft((ready) => ready.show(freshRun(id)));
  const prepareCaprices = (id: MissionId) =>
    void withDraft((ready) => ready.showCaprices(freshRun(id)));

  // Stickers are read from the book a new game would fill and, after a game, from the book
  // that game fills. Both are the same book unless an old save holds several.
  const inNextBook: StickerEarned = (id) => albums?.has(id) ?? false;
  const inGameBook: StickerEarned = (id) =>
    albums?.has(id, albums.state.campProfileId ?? undefined) ?? false;
  const cards = MISSIONS.map((mission, index) => {
    const card = missionCard(mission, index);
    card.button.onclick = () => prepare(mission.id);
    byId('mission-cards').append(card.button);
    return card;
  });
  const nextMission = () =>
    MISSIONS.find((m) => progress.unlocked(m.id) && !progress.state.bestStars[m.id]) ??
    [...MISSIONS].reverse().find((m) => progress.unlocked(m.id))!;
  const play = () => prepare(nextMission().id);
  /** Once the six missions are won, the caprice the home's main button leads to, if any. */
  const nextCaprice = () => capriceToPlay(progress.state.bestStars, inNextBook);
  /**
   * The home's main button: no dialog between the first tap and the board. A caprice has to
   * be chosen, so that one opens the preparation on the caprices.
   */
  const playNow = () => {
    const caprice = nextCaprice();
    if (caprice) return prepareCaprices(caprice.missionId);
    const run = freshRun(nextMission().id);
    if (allowed(run)) actions.launch(run, []);
  };
  const playLabel = () => (nextCaprice() ? TEXT.jouerUnCaprice : TEXT.jouer);
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
    const journey = missionJourney(progress.state.bestStars, progress.unlocked);
    const next = journey.find((step) => step.status === 'next');
    setDisplayText(
      byId('home-next-mission'),
      next
        ? fill(TEXT.prochaineMissionN, nextMission().name)
        : (nextCaprice()?.sentence ?? fill(TEXT.rejouerLaMissionN, nextMission().name)),
    );
    // The Missions page prepares a departure; only the home's main button starts at once.
    setDisplayText(byId('home-play'), next ? TEXT.preparer : TEXT.preparerEncore);
    setDisplayText(
      byId('mission-total'),
      fill(TEXT.n18Etoiles, showJourney(cards, journey, inNextBook)),
    );
    byId('mission-continue').hidden = !actions.canResume();
    refreshOutcome();
  };
  // Asked for once the home is drawn, not before: the first screen never waits for it.
  setTimeout(() => void loadDraft().catch(() => undefined), 0);
  return Object.assign(refresh, { play, playNow, playLabel, resume: actions.resume });
}
