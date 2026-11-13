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
  /** The home's main button: no dialog between the first tap and the board. */
  const playNow = () => {
    const run = freshRun(nextMission().id);
    if (draft.allowed(run)) actions.launch(run, []);
  };
  byId('home-play').onclick = play;
  byId('mission-continue').onclick = actions.resume;
  const refreshOutcome = bindMissionOutcome(session, {
    ...actions,
    prepare,
    unlocked: progress.unlocked,
  });

  const refresh = () => {
    draft.refreshCodes();
    const journey = missionJourney(progress.state.bestStars, progress.unlocked);
    const next = journey.find((step) => step.status === 'next');
    setDisplayText(
      byId('home-next-mission'),
      next
        ? `Prochaine mission : ${nextMission().name}`
        : `Rejouer la mission : ${nextMission().name}`,
    );
    // The Missions page prepares a departure; only the home's main button starts at once.
    setDisplayText(byId('home-play'), next ? 'Préparer' : 'Préparer encore');
    setDisplayText(byId('mission-total'), `${showJourney(cards, journey)} / 18 étoiles`);
    byId('mission-continue').hidden = !actions.canResume();
    refreshOutcome();
  };
  return Object.assign(refresh, { play, playNow, resume: actions.resume });
}
