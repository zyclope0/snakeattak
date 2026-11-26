import { setText } from '../i18n/dom.ts';
import { portraitStyle } from '../art.ts';
import { kinds } from '../data.ts';
import type { Game } from '../game.ts';
import { missionById } from '../missions.ts';
import { capriceById } from '../caprices.ts';
import { defeatCopy, endlessCopy, victoryCopy } from '../render/resultCopy.ts';
import type { Session } from '../session.ts';
import { feastIconStyle, feastName } from './feastControls.ts';
import { placementAdvice } from './placementAdvice.ts';
import { byId } from './dom.ts';
import { announcedWave, battleOver } from './battleState.ts';
import * as TEXT from '../texts/fr/advice.ts';
import { endlessWave } from '../endless.ts';
import { chapterOfWave, WAVES_PER_CHAPTER } from '../gameConstants.ts';
import { fill } from '../texts/fill.ts';
import { EXPEDITION_STAGE_VERSION } from '../voyageRules.ts';

/**
 * The name of the place: the mission first when there is one, then its map. A step of « La
 * Grande Expédition » with a challenge is named by it, never by the mission it borrows.
 */
export function showLevel(game: Game) {
  const name = byId('level-name');
  const defi =
    game.stage?.version === EXPEDITION_STAGE_VERSION ? capriceById(game.mission?.caprice) : null;
  frenchName(name, !!defi);
  setText(
    name,
    defi?.name ?? (game.mission ? missionById(game.mission.missionId)!.name : game.level.name),
  );
  const round = game.mission ? null : endlessRound(game);
  const subtitle = byId('level-subtitle');
  setText(subtitle, game.mission ? game.level.name : (round ?? game.level.subtitle));
  // The round is shown wherever the name of the place is, even where the map's own words are
  // left out for room (`styles/19-endless.css`).
  subtitle.toggleAttribute('data-round', !!round);
}

/**
 * After a king of the endless adventure, the map's « Vagues 1 à 4 » would hide that the round
 * is a new one: the round is named, and its waves counted from the very first one.
 */
function endlessRound(game: Game): string | null {
  if (!game.endless || game.kings <= 0) return null;
  const first = chapterOfWave(Math.max(1, announcedWave(game))) * WAVES_PER_CHAPTER + 1;
  return fill(
    TEXT.nETourVaguesNAN,
    game.kings + 1,
    endlessWave(game.kings, first),
    endlessWave(game.kings, first + WAVES_PER_CHAPTER - 1),
  );
}

/** The son's names stay in French in every language: the node is never translated. */
function frenchName(node: HTMLElement, french: boolean) {
  if (french) {
    node.dataset.copyRaw = '';
    node.lang = 'fr';
  } else {
    delete node.dataset.copyRaw;
    node.removeAttribute('lang');
  }
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
  if (game.endless || game.ending) {
    const copy = game.ending ?? endlessCopy(game);
    return { title: copy.title, tip: copy.subtitle };
  }
  if (game.status !== 'won') return { title: TEXT.leCampEstTombe, tip: defeatCopy(game).subtitle };
  return game.mission
    ? {
        title: game.stage ? victoryCopy(game).title : TEXT.missionReussie2,
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
