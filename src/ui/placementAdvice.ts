import type { Kind } from '../data.ts';
import { kinds } from '../data.ts';
import { defenseRole, type DefenseRole } from '../defenders.ts';
import { laneDefense, LANE_NAMES } from '../ai.ts';
import type { Game } from '../game.ts';
import * as TEXT from '../texts/fr/advice.ts';
import { fill } from '../texts/fill.ts';

/** Where each role does its best work: the full sentence, and a few words for the board. */
const SPOTS: Record<DefenseRole, { hint: string; short: string }> = {
  support: {
    hint: TEXT.placeLeDerriereLesCombattantsLe,
    short: TEXT.aLAbriDesCombattants,
  },
  ranged: {
    hint: TEXT.placeLeDerriereLesCombattantsPres,
    short: TEXT.derriereLesCombattants,
  },
  mobile: {
    hint: TEXT.presDUnPassageIlIntervientSurLes,
    short: TEXT.presDUnPassageTroisVoies,
  },
  fixed: {
    hint: TEXT.defenseFixeElleResteIciPlaceLaSur,
    short: TEXT.surLePassageDesSerpents,
  },
  guard: {
    hint: TEXT.devantLesTireursIlGardeSonSecteur,
    short: TEXT.devantLesTireurs,
  },
};

/** Explain existing behaviour; never constrain placement or change a unit. */
export function placementAdvice(kind: Kind) {
  const role = defenseRole(kind);
  const { hint, short } = SPOTS[role];
  // UI vocabulary only: contact up to 80, middle distance up to 180, then long.
  // The actual range and the placement circle remain the canonical data value.
  const reach =
    kinds[kind].range <= 80 ? 'courte' : kinds[kind].range <= 180 ? 'moyenne' : 'longue';
  return {
    role,
    range: kinds[kind].range,
    hint: TEXT.toucheUnePlaceLibreADroite + hint,
    compactHint:
      kinds[kind].range > 0
        ? fill(TEXT.toucheADroiteNPorteeN, short, reach)
        : fill(TEXT.toucheADroiteN, short),
  };
}

/** Relative, visible deployment only; closed tutorial lanes are never recommended. */
export function weakLaneAdvice(game: Pick<Game, 'status' | 'wave' | 'enemyLanes' | 'units'>) {
  if (game.status !== 'preparing' || game.wave === 0) return null;
  const lanes = game.enemyLanes,
    scores = laneDefense(game.units);
  if (lanes.length < 2) return null;
  const low = lanes.reduce((a, b) => (scores[a] <= scores[b] ? a : b));
  const strongest = Math.max(...lanes.map((i) => scores[i]));
  if (!strongest || scores[low] >= strongest * 0.65) return null;
  return fill(TEXT.aRenforcerN, LANE_NAMES[low]);
}
