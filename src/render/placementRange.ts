import { defenseRole } from '../defenders.ts';
import type { Game } from '../game.ts';
import type { Kind } from '../data.ts';
import { kinds } from '../data.ts';
import { healAmount } from '../unitRules.ts';
import { placementSuggestions } from '../placement.ts';
export function placementReadout(game: Game, kind: Kind, pointer?: { x: number; y: number }) {
  const p =
    pointer && Number.isFinite(pointer.x) && Number.isFinite(pointer.y)
      ? pointer
      : placementSuggestions(game, kind)[0];
  if (!p) return null;
  return {
    x: p.x,
    y: p.y,
    radius: kinds[kind].range,
    valid: game.canRecruit(kind, p.x, p.y),
    healing: healAmount(kind) > 0,
    category:
      healAmount(kind) > 0
        ? 'Soin'
        : kind === 'wall'
          ? 'Défense fixe'
          : defenseRole(kind) === 'ranged'
            ? 'Tir'
            : 'Contact',
  };
}
