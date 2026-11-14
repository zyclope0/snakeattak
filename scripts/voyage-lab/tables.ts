// Tables d'essai du laboratoire du voyage. Celle du jeu est dans `src/voyageTuning.ts`.
import type { RewardId } from '../../src/rewards.ts';
import { freezeTuning } from '../../src/voyageTuning.ts';

/**
 * Le voyage « brut », point de départ de la passe d'équilibrage du 14 novembre 2026 : les
 * missions dans l'ordre du jeu, n'importe quel caprice de la mission dès la troisième étape,
 * le roi tel qu'il vient dans une mission, les cartes à leur valeur de la grande aventure.
 * Gardé ici pour pouvoir refaire la mesure « avant » : `TABLE=brut npm run balance:voyage`.
 */
export const RAW_TUNING = freezeTuning({
  stages: [
    { missions: ['refuge', 'trois-ponts'], tiers: [], coins: 0 },
    { missions: ['trois-ponts', 'course'], tiers: [], coins: 0 },
    { missions: ['course', 'coquilles'], tiers: ['petit', 'moyen', 'grand'], coins: 0 },
    { missions: ['coquilles', 'sonnette'], tiers: ['petit', 'moyen', 'grand'], coins: 0 },
    { missions: ['sonnette', 'carrefour'], tiers: ['petit', 'moyen', 'grand'], coins: 0 },
  ],
  excluded: [],
  bonusCoins: 100,
  bonusWard: 18,
  kingHp: 6.5,
});

/**
 * Le sac « raisonnable » : parmi les trois cartes offertes, la première de cette liste.
 * L'ordre vient de la mesure de chaque carte seule (docs/VOYAGE.md) : un allié offert à
 * chaque étape aide plus que des pièces ou la garde du cristal, et le miel aide le moins.
 * Chaque offre contient un allié : ce sac prend donc toujours l'allié.
 */
export const REASONABLE_ORDER: readonly RewardId[] = [
  'renfort-bouclier',
  'renfort-ninja',
  'renfort-raptor',
  'pieces',
  'cristal',
  'miel',
];
