import { capriceDefinitionForRun } from '../caprices.ts';
import type { Kind } from '../data.ts';
import type { Game } from '../game.ts';
import { setText as setDisplayText, setMarkup as setDisplayMarkup } from '../i18n/dom.ts';
import { defeatCopy } from '../render/resultCopy.ts';
import type { Session } from '../session.ts';
import { MISSIONS } from '../missions.ts';
import type { MissionId, MissionRun } from '../missions.ts';
import { byId } from './dom.ts';
import { assaults, nests } from './missionDraft.ts';

type Actions = {
  launch: (run: MissionRun, kinds?: readonly Kind[], retry?: boolean) => void | boolean;
  home: () => void;
  showMissions?: () => void;
  /** Opens the preparation of a mission on a fresh draw. */
  prepare: (id: MissionId) => void;
  unlocked: (id: MissionId) => boolean;
};

const indexOf = (id?: MissionId) => MISSIONS.findIndex((m) => m.id === id);

function resultText(g: Game, run: MissionRun, caprice: boolean): string {
  const won = g.status === 'won';
  if (caprice) return won ? 'Caprice réussi !' : '';
  if (!won) return defeatCopy(g).subtitle;
  return `Mission réussie ! ${run.missionId === MISSIONS.at(-1)!.id ? 'Les six missions sont terminées. Rejoue-les autrement !' : 'Prochaine mission disponible sur la carte.'}`;
}

/**
 * The mission's panel beside the board: its two draws, how it ended, and the way to play it
 * again, to go on to the next one or to return to the map.
 */
export function bindMissionOutcome(session: Session, actions: Actions) {
  byId('mission-back-map').onclick = () => {
    actions.home();
    actions.showMissions?.();
    byId<HTMLDetailsElement>('mission-list').open = true;
    byId('expedition-heading').scrollIntoView({ block: 'start' });
    byId('expedition-heading').focus({ preventScroll: true });
  };
  byId('mission-again').onclick = () => {
    if (session.game.mission)
      actions.launch(session.game.mission, session.game.capriceKindsChosen, true);
  };
  byId('mission-next').onclick = () => {
    const next = MISSIONS[indexOf(session.game.mission?.missionId) + 1];
    if (!next || !actions.unlocked(next.id)) return;
    actions.home();
    actions.prepare(next.id);
  };

  return function refresh() {
    const g = session.game,
      run = g.mission;
    byId('mission-battle-actions').hidden = !run;
    if (!run) return;
    const caprice = capriceDefinitionForRun(run);
    setDisplayText(byId('mission-battle-title'), 'Tes alliés');
    setDisplayText(byId('mission-battle-config'), `${assaults[run.assault]} · ${nests[run.nest]}`);
    const end = g.status === 'won' || g.status === 'lost';
    const result = byId('mission-result');
    result.hidden = !end;
    setDisplayText(result, resultText(g, run, !!caprice));
    if (caprice && g.status === 'lost') {
      // Clear the previous whole-node copy binding before adopting a protected leaf.
      setDisplayMarkup(result, '<span data-copy-raw lang="fr"></span>');
      result.firstElementChild!.textContent = caprice.announce;
    }
    byId('mission-again').hidden = !end;
    byId('mission-next').hidden =
      g.status !== 'won' || !!caprice || indexOf(run.missionId) >= MISSIONS.length - 1;
  };
}
