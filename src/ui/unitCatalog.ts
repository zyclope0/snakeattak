import { kinds } from '../data.ts';
import type { Kind } from '../data.ts';

/** Every ally a player can recruit, in the order of the catalogue. */
export const RECRUITABLE_KINDS = Object.keys(kinds).filter((k) => k !== 'hero') as Kind[];
