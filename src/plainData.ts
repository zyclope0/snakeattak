/**
 * Guards shared by everything that reads data the game did not just compute: a save, a
 * departure code, an imported family file. One definition, so that every reader refuses
 * the same things. No browser object here.
 */

/** A plain object: neither null nor an array. */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** A finite number between `min` and `max`, both included. */
export const isNumberIn = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;

/** A whole number between `min` and `max`, both included. */
export const isIntegerIn = (value: unknown, min: number, max: number): value is number =>
  isNumberIn(value, min, max) && Number.isInteger(value);

/** The stars of a mission or of a chapter: 0 to 3. */
export const isStarCount = (value: unknown): value is number => isIntegerIn(value, 0, 3);
