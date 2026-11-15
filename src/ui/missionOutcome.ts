import { capriceDefinitionForRun } from '../caprices.ts';
import type { Kind } from '../data.ts';
import type { Game } from '../game.ts';
import { setText as setDisplayText, setMarkup as setDisplayMarkup } from '../i18n/dom.ts';
import { defeatCopy } from '../render/resultCopy.ts';
import type { Session } from '../session.ts';
import { MISSIONS } from '../missions.ts';
import type { MissionId, MissionRun } from '../missions.ts';
import { byId, make } from './dom.ts';
import { assaults, nests } from './missionDraft.ts';
import { replayOffer } from './stickerGoals.ts';
import type { StickerTally } from './stickerGoals.ts';
import { stickerRow } from './stickerRow.ts';
import * as TEXT from '../texts/fr/missionScreens.ts';
import { fill } from '../texts/fill.ts';

type Actions = {
  launch: (run: MissionRun, kinds?: readonly Kind[], retry?: boolean) => void | boolean;
  home: () => void;
  showMissions?: () => void;
  /** Opens the preparation of a mission on a fresh draw. */
  prepare: (id: MissionId) => void;
  /** Opens the preparation of a mission on its caprices. */
  prepareCaprices: (id: MissionId) => void;
  unlocked: (id: MissionId) => boolean;
  /** The stickers of a mission in the book of the game that has just been played. */
  stickers: (id: MissionId) => StickerTally;
};

const indexOf = (id?: MissionId) => MISSIONS.findIndex((m) => m.id === id);

function resultText(g: Game, run: MissionRun, caprice: boolean): string {
  const won = g.status === 'won';
  if (caprice) return won ? TEXT.capriceReussi : '';
  if (!won) return defeatCopy(g).subtitle;
  return fill(
    TEXT.missionReussieN,
    run.missionId === MISSIONS.at(-1)!.id
      ? TEXT.lesSixMissionsSontTermineesRejoue
      : TEXT.prochaineMissionDisponibleSurLa,
  );
}

/**
 * After a mission is won, what its caprices still offer: the six stickers, a sentence that
 * counts those left, and the button that replays the mission with a caprice. They sit
 * together, just before the buttons that leave or start again. The panel says how its
 * buttons pair up (`data-sticker-offer`), for the layout that sets them two by two on a phone.
 */
function stickerOffer(session: Session, actions: Actions) {
  const panel = byId('mission-battle-actions');
  const stickers = stickerRow();
  const sentence = make('span');
  const hint = make('p', { id: 'mission-sticker-hint' }, stickers.row, sentence);
  const replay = make('button', { id: 'mission-caprice-replay', className: 'secondary' });
  const block = make('div', { className: 'mission-sticker-offer' }, hint, replay);
  replay.onclick = () => {
    const run = session.game.mission;
    if (!run) return;
    actions.home();
    actions.prepareCaprices(run.missionId);
  };
  byId('mission-back-map').before(block);
  /**
   * Shown for a mission that is won. `afterCaprice` and `nextShown` tell which buttons come
   * before the two that leave or start again: the sticker book after a caprice, the next
   * mission, this offer. A single one leads on a row of its own; two share a row.
   */
  return (run: MissionRun | null, afterCaprice: boolean, nextShown: boolean) => {
    const tally = run && actions.stickers(run.missionId);
    const offer = tally && replayOffer(tally, afterCaprice);
    block.hidden = !offer;
    replay.hidden = !offer?.button;
    if (!tally || !offer) {
      delete panel.dataset.stickerOffer;
      return;
    }
    const before = Number(afterCaprice) + Number(nextShown) + Number(!!offer.button);
    panel.dataset.stickerOffer = before === 1 ? 'lead' : 'pairs';
    stickers.show(tally);
    setDisplayText(sentence, offer.sentence);
    if (offer.button) setDisplayText(replay, offer.button);
  };
}

/**
 * The mission's panel beside the board: its two draws, how it ended, and the way to play it
 * again, with a caprice, to go on to the next one or to return to the map.
 */
export function bindMissionOutcome(session: Session, actions: Actions) {
  const showStickerOffer = stickerOffer(session, actions);
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
      // A voyage stage borrows a mission without being one: no map of the missions, no next
      // mission, no caprice to replay. The voyage says what comes next (ui/voyage).
      run = g.stage ? null : g.mission;
    byId('mission-battle-actions').hidden = !run;
    if (!run) return;
    const caprice = capriceDefinitionForRun(run);
    setDisplayText(byId('mission-battle-title'), TEXT.tesAllies);
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
    const won = g.status === 'won';
    const next = won && !caprice && indexOf(run.missionId) < MISSIONS.length - 1;
    byId('mission-next').hidden = !next;
    showStickerOffer(won ? run : null, !!caprice, next);
  };
}
