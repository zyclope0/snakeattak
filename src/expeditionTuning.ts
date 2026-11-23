import { BOON_RULES } from './boons.ts';
import type { CapriceTier } from './caprices.ts';
import type { MissionId } from './missions.ts';

/**
 * The tables of « La Grande Expédition », one per version. A saved expedition names its
 * version and is played with its table for good: the rules of a version never change once
 * played. New values, new version.
 */
export type ExpeditionVersion = 1 | 2 | 3;
export const CURRENT_EXPEDITION_VERSION: ExpeditionVersion = 3;
/** The gifts of the expedition follow the first table of gifts (boons.ts): places, levels, steps. */
export const EXPEDITION_GIFT_RULES = BOON_RULES[1];

/**
 * What a battle is drawn from. Version 1 draws a mission and a caprice of these tiers;
 * version 2 gives every step its fixed challenge (« défi »), a caprice of the son named
 * by its id: the mission it was tuned for brings the waves, unnamed, and only the terrain,
 * the attack, the nests and the fight change from one expedition to the next.
 */
export type Draw =
  | Readonly<{ missions: readonly MissionId[]; tiers: readonly CapriceTier[] }>
  | Readonly<{ defi: string }>;
/** One draw for each of the three forks of a tableau, in order. */
export type ForkDraws = readonly [Draw, Draw, Draw];
export type TableauTuning = Readonly<{
  /** The first mission of the tableau, with a new camp. */
  first: Draw;
  /** The calm path: an easier draw, an ordinary gift after it; one a fork in version 2. */
  calm: Draw | ForkDraws;
  /** The brave path: a harder draw, a rare gift after it; one a fork in version 2. */
  brave: Draw | ForkDraws;
  /** The guardian's mission; the king closes it with this much life (6 to 10, as in a mission). */
  guardian: Draw & { kingHp: number; court: boolean };
}>;
export type ExpeditionTuning = Readonly<{
  tableaux: readonly TableauTuning[];
  /** Coins added to the camp's purse before every mission but the first of a tableau. */
  stipend: number;
  /**
   * The snakes grow stronger battle after battle, all expedition long: their life and their
   * bite are multiplied by 1 + this step at each battle won before (as in the endless
   * adventure, where it is at each king).
   */
  strength: Readonly<{ hpStep: number; biteStep: number }>;
  /** « Le Feu de Camp » : crystal mended, and the share of their lost life the allies get back. */
  campfire: Readonly<{ crystal: number; heal: number }>;
  /** « La Roulotte de Mamie Pistache » : what a gift costs, and what a level up costs. */
  roulotte: Readonly<{ gift: number; levelUp: number }>;
  /** « L'Œuf Mystère » : the coins of its gentlest surprise. */
  eggCoins: number;
  /** Caprices never drawn here: those that limit the kinds of allies (the camp is built). */
  excluded: readonly string[];
  /** The path rules of its battles (`navigation.ts`); absent, the first ones. */
  paths?: 2;
}>;

/**
 * Version 1. The missions climb in the order of the game; the brave path meets a stronger
 * caprice. The parent chose the snakes' strength on 20 November 2026 (« moyen ») after the
 * measures of docs/VOYAGE-LONG-PROPOSITION.md: life ×1.06 and bite ×1.03 a battle.
 */
const VERSION_1: ExpeditionTuning = {
  tableaux: [
    {
      first: { missions: ['refuge'], tiers: [] },
      calm: { missions: ['refuge', 'trois-ponts'], tiers: [] },
      brave: { missions: ['trois-ponts', 'course'], tiers: ['petit'] },
      guardian: { missions: ['course'], tiers: [], kingHp: 6, court: false },
    },
    {
      first: { missions: ['trois-ponts'], tiers: ['petit'] },
      calm: { missions: ['course', 'coquilles'], tiers: ['petit'] },
      brave: { missions: ['coquilles', 'sonnette'], tiers: ['moyen'] },
      guardian: { missions: ['sonnette'], tiers: [], kingHp: 6, court: false },
    },
    {
      first: { missions: ['coquilles'], tiers: ['petit'] },
      calm: { missions: ['sonnette', 'coquilles'], tiers: ['moyen'] },
      brave: { missions: ['sonnette', 'carrefour'], tiers: ['grand'] },
      guardian: { missions: ['carrefour'], tiers: [], kingHp: 6.5, court: true },
    },
  ],
  stipend: 120,
  strength: { hpStep: 0.06, biteStep: 0.03 },
  campfire: { crystal: 40, heal: 0.5 },
  roulotte: { gift: 200, levelUp: 150 },
  eggCoins: 150,
  excluded: ['sonnette-petit', 'carrefour-moyen'],
};
/**
 * Version 2 (decision of the parent, 21 November 2026): one fixed challenge a step, the
 * same in every expedition, from the son's caprices; the brave path has the harder one. The
 * table was adjusted after measure and accepted by the parent the same day. Three challenges
 * that a carried camp made void (« Bourse trouée », « Deux copains seulement », « Un seul
 * copain ») gave their places to the creator's, measured and accepted the same day.
 * The table is docs/VOYAGE-LONG-PROPOSITION.md, « Les défis fixes ». New rules (Les Ponts
 * Mouillés, Double Couronne…) will take some places, one by one, in later versions.
 */
const VERSION_2: ExpeditionTuning = {
  ...VERSION_1,
  // A little stronger than version 1 (decision of the parent, 21 November 2026: the simulated
  // players are weaker than real children, « n'hésite pas à augmenter un petit peu »).
  strength: { hpStep: 0.07, biteStep: 0.035 },
  tableaux: [
    {
      first: { defi: 'refuge-petit' },
      calm: [
        { defi: 'refuge-createur-petit' },
        { defi: 'course-petit' },
        { defi: 'coquilles-petit' },
      ],
      brave: [
        { defi: 'refuge-moyen' },
        { defi: 'sonnette-moyen' },
        { defi: 'refuge-createur-moyen' },
      ],
      guardian: { defi: 'trois-ponts-createur-moyen', kingHp: 6, court: false },
    },
    {
      first: { defi: 'trois-ponts-createur-petit' },
      calm: [
        { defi: 'sonnette-createur-moyen' },
        { defi: 'coquilles-moyen' },
        { defi: 'coquilles-createur-moyen' },
      ],
      brave: [{ defi: 'trois-ponts-moyen' }, { defi: 'course-moyen' }, { defi: 'sonnette-grand' }],
      guardian: { defi: 'course-createur-petit', kingHp: 6, court: false },
    },
    {
      first: { defi: 'refuge-grand' },
      calm: [
        { defi: 'coquilles-createur-petit' },
        { defi: 'coquilles-createur-grand' },
        { defi: 'coquilles-grand' },
      ],
      brave: [{ defi: 'trois-ponts-grand' }, { defi: 'course-grand' }, { defi: 'carrefour-grand' }],
      guardian: { defi: 'carrefour-petit', kingHp: 6.5, court: true },
    },
  ],
};
/**
 * Version 3 (decision of the parent, 21 November 2026): version 2 with the second path
 * rules, so that an ally no longer stands against a rock. Nothing else changes: the same
 * challenges at the same steps, the same strength.
 */
const VERSION_3: ExpeditionTuning = { ...VERSION_2, paths: 2 };
export const EXPEDITION_TUNINGS: Readonly<Record<ExpeditionVersion, ExpeditionTuning>> = {
  1: VERSION_1,
  2: VERSION_2,
  3: VERSION_3,
};
