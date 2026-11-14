import type { BalanceRevision } from '../balanceRevision.ts';
import type { Kind } from '../data.ts';
import type { AlbumsController } from './capriceAlbums.ts';
import { setText as setDisplayText } from '../i18n/dom.ts';
import type { Session } from '../session.ts';
import { MISSIONS, createMissionRun } from '../missions.ts';
import type { MissionId, MissionRun } from '../missions.ts';
import type { createMissionProgressController } from '../missionProgress.ts';
import { bindMissionDraft, freshSeed } from './missionDraft.ts';
import { bindMissionOutcome } from './missionOutcome.ts';
import { missionJourney } from './missionJourney.ts';
import { missionCard, showJourney } from './missionJourneyView.ts';
import { capriceToPlay, missionStickers } from './stickerGoals.ts';
import type { StickerEarned } from './stickerGoals.ts';
import { byId } from './dom.ts';

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
  const draft = bindMissionDraft(session, progress, actions, albums);
  /** A new draw of a mission; its last departure tells which draw not to repeat. */
  const freshRun = (id: MissionId) => createMissionRun(id, freshSeed(), progress.lastRun(id), 2);
  const prepare = (id: MissionId) => draft.show(freshRun(id));
  const prepareCaprices = (id: MissionId) => draft.showCaprices(freshRun(id));
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
    if (draft.allowed(run)) actions.launch(run, []);
  };
  const playLabel = () => (nextCaprice() ? 'Jouer un caprice' : 'Jouer');
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
    draft.refreshCodes();
    const journey = missionJourney(progress.state.bestStars, progress.unlocked);
    const next = journey.find((step) => step.status === 'next');
    setDisplayText(
      byId('home-next-mission'),
      next
        ? `Prochaine mission : ${nextMission().name}`
        : (nextCaprice()?.sentence ?? `Rejouer la mission : ${nextMission().name}`),
    );
    // The Missions page prepares a departure; only the home's main button starts at once.
    setDisplayText(byId('home-play'), next ? 'Préparer' : 'Préparer encore');
    setDisplayText(
      byId('mission-total'),
      `${showJourney(cards, journey, inNextBook)} / 18 étoiles`,
    );
    byId('mission-continue').hidden = !actions.canResume();
    refreshOutcome();
  };
  return Object.assign(refresh, { play, playNow, playLabel, resume: actions.resume });
}
