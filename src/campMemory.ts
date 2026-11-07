import type { Game } from './game.ts';
import { encodeCheckpoint, decodeCheckpoint } from './checkpoints.ts';
/** Session-only retry remains possible even when browser storage is blocked. */
export function createCampMemory(initial?: Game) {
  let checkpoint = initial ? encodeCheckpoint(initial) : null;
  return {
    raw(): string | null {
      return checkpoint;
    },
    replace(raw: string | null): boolean {
      if (raw === null) {
        checkpoint = null;
        return true;
      }
      const game = decodeCheckpoint(raw);
      if (!game) return false;
      const canonical = encodeCheckpoint(game);
      if (!canonical) return false;
      checkpoint = canonical;
      return true;
    },
    remember(game: Game) {
      const raw = encodeCheckpoint(game);
      if (raw) checkpoint = raw;
    },
    load() {
      return checkpoint ? decodeCheckpoint(checkpoint) : null;
    },
  };
}
