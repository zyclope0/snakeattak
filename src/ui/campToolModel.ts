import { availableGold, canSpend } from './capriceBudget.ts';
import type { Game } from '../game.ts';
import { kinds, type Kind } from '../data.ts';
import { missionById } from '../missions.ts';

export const CAMP_TOOLS = ['honey', 'encourage', 'repair', 'hero'] as const;
export type CampTool = (typeof CAMP_TOOLS)[number];

const REPAIR_COST = 80;
const TRAINING_COST = 90;
const NO_HONEY = 'Pas de miel dans ce caprice';

/** A battle that is still played: in camp or in a wave. */
const inPlay = (game: Game) => game.status === 'preparing' || game.status === 'fighting';

/** A caprice that keeps coins at the bank says so before anything about the price. */
const bankNotice = (game: Game) => (game.caprice.reserve ? 'Réserve bancaire protégée · ' : '');

/** At least one living ally that can hit: encouraging them has an effect. */
export const hasFighters = (game: Game) =>
  game.units.some((u) => u.hp > 0 && kinds[u.kind as Kind].damage > 0);

/** Presentation readiness ignores the temporary pause held by the guide itself. */
export function heroTrainingState(game: Game) {
  const eligible = game.mission
    ? missionById(game.mission.missionId)!.unlockRank >= 4
    : game.wave >= 4;
  const hero = game.units.some((u) => u.kind === 'hero' && u.hp > 0);
  return {
    ready:
      eligible &&
      hero &&
      game.status === 'preparing' &&
      game.campaign.training === 'none' &&
      canSpend(game, TRAINING_COST),
    status: bankNotice(game) + trainingStatus(game, eligible, hero),
  };
}

function trainingStatus(game: Game, eligible: boolean, hero: boolean): string {
  if (!hero) return 'Le héros est tombé. Aucun entraînement possible.';
  if (game.campaign.training === 'force') return 'Frappe renforcée · +15 % de dégâts du héros';
  if (game.campaign.training === 'guard') return 'Gardien · −15 % sur les coups et tirs reçus';
  if (!eligible)
    return game.mission
      ? 'Dans une autre expédition, dès Les trois ponts'
      : 'Disponible après la vague 4';
  if (game.status !== 'preparing') return 'Entre deux vagues · 90 pièces';
  if (!canSpend(game, TRAINING_COST))
    return `Il manque ${TRAINING_COST - availableGold(game)} pièces pour l’entraînement`;
  return '90 pièces · un seul entraînement pour ces alliés';
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
    cost: TRAINING_COST,
    title: 'Entraîner le héros',
    when: 'Entre deux vagues. Dès Les trois ponts en expédition ; après la vague 4 en classique.',
    gesture:
      'Tous les alliés → Conseils et outils → Actions du camp → Entraîner le héros. Choisis Frappe ou Gardien.',
    result:
      'Frappe : +15 % de dégâts. Gardien : −15 % sur les coups reçus. Un seul choix pour ces alliés.',
    ...heroTrainingState(game),
  };
}

function repairHelp(game: Game) {
  return {
    cost: REPAIR_COST,
    title: 'Réparer le cristal',
    when: 'Si le cristal a perdu de la vie, avant ou pendant une vague.',
    gesture: 'Tous les alliés → Conseils et outils → Actions du camp → Réparer le cristal.',
    result:
      'Le cristal regagne jusqu’à 25 points de vie, sans dépasser 100.' +
      (game.mission ? ' Les dégâts subis restent comptés pour tes étoiles.' : ''),
    ready: inPlay(game) && game.base < 100 && canSpend(game, REPAIR_COST),
    status: bankNotice(game) + repairStatus(game),
  };
}

function repairStatus(game: Game): string {
  if (!inPlay(game)) return 'La partie est terminée';
  if (game.base >= 100) return 'Ton cristal est intact';
  if (!canSpend(game, REPAIR_COST))
    return `Il manque ${REPAIR_COST - availableGold(game)} pièces pour réparer`;
  return `Cristal : ${game.base} / 100 · réparation possible`;
}

function encourageHelp(game: Game) {
  return {
    cost: 0,
    title: 'Encourager',
    when: 'Pendant le combat, quand tes alliés peuvent frapper.',
    gesture: 'Tous les alliés → Conseils et outils → Actions du camp → Encourager nos alliés.',
    result: 'Leurs attaques accélèrent pendant 8 s. Une fois par vague.',
    ready: game.status === 'fighting' && !game.encouragementUsed && hasFighters(game),
    status: encourageStatus(game),
  };
}

function encourageStatus(game: Game): string {
  if (!inPlay(game)) return 'La partie est terminée';
  if (game.encouragementRemaining > 0)
    return `Encouragés · ${Math.ceil(game.encouragementRemaining)} s`;
  if (game.encouragementUsed) return 'Revient à la prochaine vague';
  if (game.status === 'preparing') return 'À utiliser pendant le combat';
  return hasFighters(game)
    ? 'Un encouragement gratuit pour cette vague'
    : 'Aucun allié capable de frapper';
}

function honeyHelp(game: Game) {
  const banned = game.caprice.noHoney;
  return {
    cost: 0,
    title: 'Le miel',
    when: banned ? NO_HONEY : 'Pendant une vague, sur un chemin attaqué. Un pot gratuit par vague.',
    gesture: banned
      ? NO_HONEY
      : 'Choisis Attirer ou Ralentir, puis touche un chemin. Annuler garde ton pot.',
    result: banned
      ? NO_HONEY
      : `Attirer détourne les gourmands aux jonctions. Ralentir freine sur la flaque. Le miel dure ${game.feastDuration} s.`,
    ready: !banned && game.status === 'fighting' && !game.feastUsed,
    status: banned ? NO_HONEY : honeyStatus(game),
  };
}

function honeyStatus(game: Game): string {
  if (!inPlay(game)) return 'La partie est terminée';
  if (game.feastUsed) return 'Pot utilisé · revient à la prochaine vague';
  return game.status === 'preparing' ? 'Ton pot attend le combat' : 'Ton pot est prêt';
}
