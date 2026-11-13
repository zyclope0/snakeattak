import type { Kind } from '../data.ts';
import { kinds } from '../data.ts';
import { defenseRole, type DefenseRole } from '../defenders.ts';
import { laneDefense, LANE_NAMES } from '../ai.ts';
import type { Game } from '../game.ts';

/** Where each role does its best work: the full sentence, and a few words for the board. */
const SPOTS: Record<DefenseRole, { hint: string; short: string }> = {
  support: {
    hint: 'Place-le derrière les combattants. Le cercle montre ses soins ; les bandages sont limités.',
    short: 'à l’abri des combattants',
  },
  ranged: {
    hint: 'Place-le derrière les combattants, près du chemin. Le cercle montre sa portée de tir.',
    short: 'derrière les combattants',
  },
  mobile: {
    hint: 'Près d’un passage : il intervient sur les trois voies. Il choisit seul ses cibles.',
    short: 'près d’un passage, trois voies',
  },
  fixed: {
    hint: 'Défense fixe : elle reste ici. Place-la sur le passage des serpents.',
    short: 'sur le passage des serpents',
  },
  guard: {
    hint: 'Devant les tireurs : il garde son secteur, combat au contact et revient à sa place.',
    short: 'devant les tireurs',
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
    hint: 'Touche une place libre à droite. ' + hint,
    compactHint:
      kinds[kind].range > 0
        ? `Touche à droite · ${short} · portée ${reach}`
        : `Touche à droite · ${short}`,
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
  return `À renforcer : ${LANE_NAMES[low]}`;
}
