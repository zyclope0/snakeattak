import { availableGold, canSpend } from './capriceBudget.ts';
import type { Game } from '../game.ts';
import { battleOver } from './battleState.ts';
import { kinds, type Kind } from '../data.ts';
import * as TEXT from '../texts/fr/camp.ts';
import { fill } from '../texts/fill.ts';
import { CRYSTAL_MAX, HERO_TRAINING_COST, REPAIR_COST } from '../gameConstants.ts';

export const CAMP_TOOLS = ['honey', 'encourage', 'repair', 'hero'] as const;
export type CampTool = (typeof CAMP_TOOLS)[number];

const NO_HONEY = TEXT.pasDeMielDansCeCaprice;

/** A battle that is still played: in camp or in a wave. */
const inPlay = (game: Game) => !battleOver(game);

/** A caprice that keeps coins at the bank says so before anything about the price. */
const bankNotice = (game: Game) => (game.caprice.reserve ? TEXT.reserveBancaireProtegee : '');

/** At least one living ally that can hit: encouraging them has an effect. */
export const hasFighters = (game: Game) =>
  game.units.some((u) => u.hp > 0 && kinds[u.kind as Kind].damage > 0);

/** Presentation readiness ignores the temporary pause held by the guide itself. */
export function heroTrainingState(game: Game) {
  const eligible = game.heroTrainingOpen;
  const hero = game.units.some((u) => u.kind === 'hero' && u.hp > 0);
  return {
    ready:
      eligible &&
      hero &&
      game.status === 'preparing' &&
      game.campaign.training === 'none' &&
      canSpend(game, HERO_TRAINING_COST),
    status: bankNotice(game) + trainingStatus(game, eligible, hero),
  };
}

function trainingStatus(game: Game, eligible: boolean, hero: boolean): string {
  if (!hero) return TEXT.leHerosEstTombeAucunEntrainement;
  if (game.campaign.training === 'force') return TEXT.frappeRenforcee15DeDegatsDuHeros;
  if (game.campaign.training === 'guard') return TEXT.gardien15SurLesCoupsEtTirsRecus;
  if (!eligible)
    return game.mission ? TEXT.dansUneAutreExpeditionDesLesTrois : TEXT.disponibleApresLaVague4;
  if (game.status !== 'preparing') return TEXT.entreDeuxVagues90Pieces;
  if (!canSpend(game, HERO_TRAINING_COST))
    return fill(TEXT.ilManqueNPiecesPourLEntrainement, HERO_TRAINING_COST - availableGold(game));
  return TEXT.n90PiecesUnSeulEntrainementPourCes;
}

/** Read-only help: no command, selection, clock, persistence or random draw. */
export function campToolModel(game: Game, tool: CampTool) {
  if (tool === 'hero') return heroHelp(game);
  if (tool === 'repair') return repairHelp(game);
  if (tool === 'encourage') return encourageHelp(game);
  return honeyHelp(game);
}

function heroHelp(game: Game) {
  return {
    cost: HERO_TRAINING_COST,
    title: TEXT.entrainerLeHeros,
    when: TEXT.entreDeuxVaguesDesLesTroisPontsEn,
    gesture: TEXT.tousLesAlliesConseilsEtOutils,
    result: TEXT.frappe15DeDegatsGardien15SurLes,
    ...heroTrainingState(game),
  };
}

function repairHelp(game: Game) {
  return {
    cost: REPAIR_COST,
    title: TEXT.reparerLeCristal,
    when: TEXT.siLeCristalAPerduDeLaVieAvantOu,
    gesture: TEXT.tousLesAlliesConseilsEtOutils2,
    result:
      TEXT.leCristalRegagneJusquA25PointsDe +
      // A voyage stage is a mission that earns no star.
      (game.mission && !game.stage ? TEXT.lesDegatsSubisRestentComptesPour : ''),
    ready: inPlay(game) && game.base < CRYSTAL_MAX && canSpend(game, REPAIR_COST),
    status: bankNotice(game) + repairStatus(game),
  };
}

function repairStatus(game: Game): string {
  if (!inPlay(game)) return TEXT.laPartieEstTerminee;
  if (game.base >= CRYSTAL_MAX) return TEXT.tonCristalEstIntact;
  if (!canSpend(game, REPAIR_COST))
    return fill(TEXT.ilManqueNPiecesPourReparer, REPAIR_COST - availableGold(game));
  return fill(TEXT.cristalN100ReparationPossible, game.base);
}

function encourageHelp(game: Game) {
  return {
    cost: 0,
    title: TEXT.encourager,
    when: TEXT.pendantLeCombatQuandTesAllies,
    gesture: TEXT.tousLesAlliesConseilsEtOutils3,
    result: TEXT.leursAttaquesAccelerentPendant8S,
    ready: game.status === 'fighting' && !game.encouragementUsed && hasFighters(game),
    status: encourageStatus(game),
  };
}

function encourageStatus(game: Game): string {
  if (!inPlay(game)) return TEXT.laPartieEstTerminee;
  if (game.encouragementRemaining > 0)
    return fill(TEXT.encouragesNS, Math.ceil(game.encouragementRemaining));
  if (game.encouragementUsed) return TEXT.revientALaProchaineVague;
  if (game.status === 'preparing') return TEXT.aUtiliserPendantLeCombat;
  return hasFighters(game) ? TEXT.unEncouragementGratuitPourCette : TEXT.aucunAllieCapableDeFrapper;
}

function honeyHelp(game: Game) {
  const banned = game.caprice.noHoney;
  return {
    cost: 0,
    title: TEXT.leMiel,
    when: banned ? NO_HONEY : TEXT.pendantUneVagueSurUnCheminAttaque,
    gesture: banned ? NO_HONEY : TEXT.choisisAttirerOuRalentirPuisTouche,
    result: banned ? NO_HONEY : fill(TEXT.attirerDetourneLesGourmandsAux, game.feastDuration),
    ready: !banned && game.status === 'fighting' && !game.feastUsed,
    status: banned ? NO_HONEY : honeyStatus(game),
  };
}

function honeyStatus(game: Game): string {
  if (!inPlay(game)) return TEXT.laPartieEstTerminee;
  if (game.feastUsed) return TEXT.potUtiliseRevientALaProchaineVague;
  return game.status === 'preparing' ? TEXT.tonPotAttendLeCombat : TEXT.tonPotEstPret;
}
