import type { Kind } from '../data.ts';
import { kinds } from '../data.ts';
import { defenseRole } from '../defenders.ts';
import { laneDefense, LANE_NAMES } from '../ai.ts';
import type { Game } from '../game.ts';

/** Explain existing behaviour; never constrain placement or change a unit. */
export function placementAdvice(kind: Kind) {
  const role = defenseRole(kind);
  const hint =
    role === 'support'
      ? 'Place-le derrière les combattants. Le cercle montre ses soins ; les bandages sont limités.'
      : role === 'ranged'
        ? 'Place-le derrière les combattants, près du chemin. Le cercle montre sa portée de tir.'
        : role === 'mobile'
          ? 'Près d’un passage : il intervient sur les trois voies. Il choisit seul ses cibles.'
          : role === 'fixed'
            ? 'Défense fixe : elle reste ici. Place-la sur le passage des serpents.'
            : 'Devant les tireurs : il garde son secteur, combat au contact et revient à sa place.';
  const short =
    role === 'support'
      ? 'à l’abri des combattants'
      : role === 'ranged'
        ? 'derrière les combattants'
        : role === 'mobile'
          ? 'près d’un passage, trois voies'
          : role === 'fixed'
            ? 'sur le passage des serpents'
            : 'devant les tireurs';
  return {
    role,
    range: kinds[kind].range,
    hint: 'Touche une place libre à droite. ' + hint,
    compactHint: `Touche à droite · ${short} · portée ${kinds[kind].range}`,
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
