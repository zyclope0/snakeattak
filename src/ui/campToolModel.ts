import type { Game } from '../game.ts';
import { kinds, type Kind } from '../data.ts';
import { missionById } from '../missions.ts';

export const CAMP_TOOLS = ['honey', 'encourage', 'repair', 'hero'] as const;
export type CampTool = (typeof CAMP_TOOLS)[number];

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
      game.gold >= 90,
    status: !hero
      ? 'Le héros est tombé. Aucun entraînement possible.'
      : game.campaign.training === 'force'
        ? 'Frappe renforcée · +15 % de dégâts du héros'
        : game.campaign.training === 'guard'
          ? 'Gardien · −15 % sur les coups et tirs reçus'
          : !eligible
            ? game.mission
              ? 'Dans une autre expédition, dès Les trois ponts'
              : 'Disponible après la vague 4'
            : game.status !== 'preparing'
              ? 'Entre deux vagues · 90 pièces'
              : game.gold < 90
                ? `Il manque ${90 - game.gold} pièces pour l’entraînement`
                : '90 pièces · un seul entraînement pour ces alliés',
  };
}

/** Read-only help: no command, selection, clock, persistence or random draw. */
export function campToolModel(game: Game, tool: CampTool) {
  const active = game.status === 'preparing' || game.status === 'fighting';
  if (tool === 'hero')
    return {
      cost: 90,
      title: 'Entraîner le héros',
      when: 'Entre deux vagues. Dès Les trois ponts en expédition ; après la vague 4 en classique.',
      gesture: 'Tous les alliés → Actions du camp → Entraîner le héros. Choisis Frappe ou Gardien.',
      result:
        'Frappe : +15 % de dégâts. Gardien : −15 % sur les coups reçus. Un seul choix pour ces alliés.',
      ...heroTrainingState(game),
    };
  if (tool === 'repair')
    return {
      cost: 80,
      title: 'Réparer le cristal',
      when: 'Si le cristal a perdu de la vie, avant ou pendant une vague.',
      gesture: 'Tous les alliés → Actions du camp → Réparer le cristal.',
      result:
        'Le cristal regagne jusqu’à 25 points de vie, sans dépasser 100.' +
        (game.mission ? ' Les dégâts subis restent comptés pour tes étoiles.' : ''),
      ready: active && game.base < 100 && game.gold >= 80,
      status: !active
        ? 'La partie est terminée'
        : game.base >= 100
          ? 'Ton cristal est intact'
          : game.gold < 80
            ? `Il manque ${80 - game.gold} pièces pour réparer`
            : `Cristal : ${game.base} / 100 · réparation possible`,
    };
  if (tool === 'encourage') {
    const fighters = game.units.some((u) => u.hp > 0 && kinds[u.kind as Kind].damage > 0);
    return {
      cost: 0,
      title: 'Encourager',
      when: 'Pendant le combat, quand tes alliés peuvent frapper.',
      gesture: 'Tous les alliés → Actions du camp → Encourager nos alliés.',
      result: 'Leurs attaques accélèrent pendant 8 s. Une fois par vague.',
      ready: game.status === 'fighting' && !game.encouragementUsed && fighters,
      status: !active
        ? 'La partie est terminée'
        : game.encouragementRemaining > 0
          ? `Encouragés · ${Math.ceil(game.encouragementRemaining)} s`
          : game.encouragementUsed
            ? 'Revient à la prochaine vague'
            : game.status === 'preparing'
              ? 'À utiliser pendant le combat'
              : !fighters
                ? 'Aucun allié capable de frapper'
                : 'Un encouragement gratuit pour cette vague',
    };
  }
  return {
    cost: 0,
    title: 'Le miel',
    when: 'Pendant une vague, sur un chemin attaqué. Un pot gratuit par vague.',
    gesture: 'Choisis Attirer ou Ralentir, puis touche un chemin. Annuler garde ton pot.',
    result: `Attirer détourne les gourmands aux jonctions. Ralentir freine sur la flaque. Le miel dure ${game.feastDuration} s.`,
    ready: game.status === 'fighting' && !game.feastUsed,
    status: !active
      ? 'La partie est terminée'
      : game.feastUsed
        ? 'Pot utilisé · revient à la prochaine vague'
        : game.status === 'preparing'
          ? 'Ton pot attend le combat'
          : 'Ton pot est prêt',
  };
}
