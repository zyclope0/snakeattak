import { defenseRole } from '../defenders.ts';
import type { Game } from '../game.ts';
import type { Kind } from '../data.ts';
import { healAmount } from '../unitRules.ts';
import { placementSuggestions } from '../placement.ts';
import { turnReach } from '../engine/allies.ts';
import * as TEXT from '../texts/fr/board.ts';
export function placementReadout(game: Game, kind: Kind, pointer?: { x: number; y: number }) {
  const p =
    pointer && Number.isFinite(pointer.x) && Number.isFinite(pointer.y)
      ? pointer
      : placementSuggestions(game, kind)[0];
  if (!p) return null;
  return {
    x: p.x,
    y: p.y,
    // The reach the ally really has in this game: « la longue-vue » lengthens a shooter's.
    radius: turnReach(game, kind),
    valid: game.canRecruit(kind, p.x, p.y),
    healing: healAmount(kind) > 0,
    category:
      healAmount(kind) > 0
        ? TEXT.soin
        : kind === 'wall'
          ? TEXT.defenseFixe
          : defenseRole(kind) === 'ranged'
            ? TEXT.tir2
            : TEXT.contact,
  };
}
