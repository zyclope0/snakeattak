import { readVoyageState } from '../src/voyageState.ts';
import type { VoyageState } from '../src/voyageState.ts';
import { CURRENT_VOYAGE_VERSION } from '../src/voyageTuning.ts';
import type { VoyageVersion } from '../src/voyageTuning.ts';

/**
 * The first stage of a voyage, for the tests. The game no longer starts a voyage (La Grande
 * Expédition took its place on 21 November 2026); it only lets a child finish one.
 */
export function startVoyage(
  seed: number,
  version: VoyageVersion = CURRENT_VOYAGE_VERSION,
): VoyageState | null {
  return readVoyageState({ version, seed, won: 0, bag: [], status: 'travelling' });
}
