import { setText as setDisplayText } from '../i18n/dom.ts';
import type { createMissionProgressController } from '../missionProgress.ts';
import type { Session } from '../session.ts';
import { byId } from '../ui/dom.ts';
import type { bindExpeditions } from '../ui/expeditions.ts';
import type { bindMenu } from '../ui/menu.ts';
import * as TEXT from '../texts/fr/home.ts';

/**
 * The big button of the home: « Reprendre » what waits to be continued, else « Jouer » the
 * next mission or, once the six are won, « Jouer un caprice ». A mission just won is
 * finished: it leaves the button to what comes next and stays on the Missions page.
 * Answers what redraws it.
 */
export function bindHomePrimary(
  session: Session,
  missions: ReturnType<typeof createMissionProgressController>,
  /** Whether a mission waits to be continued. */
  missionWaits: () => boolean,
  expeditions: ReturnType<typeof bindExpeditions>,
  menu: ReturnType<typeof bindMenu>,
) {
  return function refreshHomePrimary() {
    const primary = byId('home-primary');
    const inMissions = missions.state.activeMode === 'missions';
    const resume = inMissions ? missionWaits() : !byId('home-continue').hidden;
    setDisplayText(primary, resume ? TEXT.reprendre : expeditions.playLabel());
    if (resume)
      setDisplayText(
        byId('home-next-mission'),
        inMissions
          ? TEXT.reprendreMaMission
          : session.game.endless
            ? TEXT.reprendreMonAventureSansFin
            : TEXT.reprendreMonAventureClassique,
      );
    primary.onclick = () => {
      if (!resume) expeditions.playNow();
      else if (missions.state.activeMode === 'missions') expeditions.resume();
      else menu.resumeClassic();
    };
  };
}
