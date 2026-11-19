import { kinds } from '../data.ts';
import type { Kind } from '../data.ts';

/** Every ally a player can recruit, in the order of the catalogue. */
export const RECRUITABLE_KINDS = Object.keys(kinds).filter((k) => k !== 'hero') as Kind[];
/**
 * The catalogue on a phone held sideways (`mobileMenus.css`): five columns of 48 px cards and,
 * under the title row that holds the tabs, room for five rows.
 */
export const CATALOGUE_COLUMNS = 5;
export const CATALOGUE_ROWS = 5;
