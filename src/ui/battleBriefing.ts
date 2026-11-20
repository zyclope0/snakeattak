import { setText } from '../i18n/dom.ts';
import { portraitStyle } from '../art.ts';
import { kinds } from '../data.ts';
import type { Game } from '../game.ts';
import { missionById } from '../missions.ts';
import { defeatCopy, endlessCopy } from '../render/resultCopy.ts';
import type { Session } from '../session.ts';
import { feastIconStyle, feastName } from './feastControls.ts';
import { placementAdvice } from './placementAdvice.ts';
import { byId } from './dom.ts';
import { announcedWave, battleOver } from './battleState.ts';
import * as TEXT from '../texts/fr/advice.ts';
import { endlessWave } from '../endless.ts';

/** The name of the place: the mission first when there is one, then its map. */
export function showLevel(game: Game) {
  setText(
    byId('level-name'),
    game.mission ? missionById(game.mission.missionId)!.name : game.level.name,
  );
  setText(byId('level-subtitle'), game.mission ? game.level.name : game.level.subtitle);
}

/** The wave that comes, or how the battle ended. */
export function showBriefing(game: Game) {
  const { title, tip } = battleOver(game) ? outcomeBriefing(game) : waveBriefing(game);
  setText(byId('brief-title'), title);
  setText(byId('brief-tip'), tip);
}

function waveBriefing(game: Game) {
  const briefing = game.briefing;
  return {
    title: `${game.status === 'preparing' ? TEXT.prochaineVague : TEXT.vagueEnCours} · ${waveNumber(game)} · ${briefing.title}`,
    tip: briefing.tip,
  };
}

/** « 4 / 12 »; the endless adventure counts from its very first wave, with no end. */
function waveNumber(game: Game): string {
  const wave = Math.max(1, announcedWave(game));
  return game.endless ? String(endlessWave(game.kings, wave)) : `${wave} / ${game.totalWaves}`;
}

function outcomeBriefing(game: Game) {
  if (game.endless) {
    const copy = endlessCopy(game);
    return { title: copy.title, tip: copy.subtitle };
  }
  if (game.status !== 'won') return { title: TEXT.leCampEstTombe, tip: defeatCopy(game).subtitle };
  return game.mission
    ? {
        title: TEXT.expeditionReussie,
        tip: TEXT.tesAlliesOntTenuRetrouveLaCarte,
      }
    : {
        title: TEXT.laValleeEstSauvee,
        tip: TEXT.douzeVaguesRepousseesLeGouterPeut,
      };
}

/** What the player is about to place takes the place of the message under the board. */
export function showSelection(session: Session) {
  const unit = session.selected;
  const feast = session.selectedFeast;
  byId('selection-panel').hidden = !unit && !feast;
  byId('message').hidden = !!unit || !!feast;
  if (unit) showChoice(kinds[unit].name, placementAdvice(unit).hint, portraitStyle(unit));
  else if (feast)
    showChoice(
      feastName(feast),
      session.actionHint ?? TEXT.toucheUnCheminAttaqueLesBoutons,
      feastIconStyle(feast),
    );
}

function showChoice(name: string, hint: string, picture: string) {
  setText(byId('selection-name'), name);
  setText(byId('selection-hint'), hint);
  byId('selection-portrait').style.cssText = picture;
}

/** After a battle, everything the camp panel folds away is laid open. */
export function openCampDetails() {
  byId('brief-title').closest('details')!.open = true;
  byId<HTMLDetailsElement>('camp-observation').open = true;
  byId<HTMLDetailsElement>('camp-tools').open = true;
}
