import type { Game } from '../game.ts';
import { kinds } from '../data.ts';
import type { Kind } from '../data.ts';
import { RECRUITABLE_KINDS } from './unitCatalog.ts';

/** Gold never changes order; a grey card remains a useful recruitment goal. */
export function dockKinds(game: Game, favourites: readonly Kind[]): Kind[] {
  return [...new Set([...favourites, ...RECRUITABLE_KINDS])]
    .filter((kind) => kind !== 'hero' && Object.hasOwn(kinds, kind) && game.isUnlocked(kind))
    .slice(0, 4);
}
