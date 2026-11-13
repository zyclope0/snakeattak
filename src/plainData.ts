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

/** A whole number on 32 unsigned bits: a seed, or the state of the random source. */
export const isUint32 = (value: unknown): value is number => isIntegerIn(value, 0, 0xffffffff);

/** An array holding between `min` and `max` items, both included. */
export const isArrayOfLength = (value: unknown, min: number, max: number): value is unknown[] =>
  Array.isArray(value) && value.length >= min && value.length <= max;

/** One of the listed values, compared without any conversion. */
export const isOneOf = <T>(value: unknown, options: readonly T[]): value is T =>
  options.includes(value as T);

// C0 and C1 control characters: invisible, and able to break a line or a label.
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f-\u009f]/u;
const CONTROL_CHARACTERS = new RegExp(CONTROL_CHARACTER.source, 'gu');

/** True when a typed or imported text holds a control character. */
export const hasControlCharacter = (text: string): boolean => CONTROL_CHARACTER.test(text);

/** The same text without its control characters. */
export const withoutControlCharacters = (text: string): string =>
  text.replace(CONTROL_CHARACTERS, '');

/**
 * Read a JSON text of at most `limit` characters with `read`. Null when it is not a text,
 * is too long, is not JSON, or when `read` refuses it or throws: a damaged save is a
 * refused save, never an exception for the caller.
 */
export function readBoundedJson<T>(
  raw: unknown,
  limit: number,
  read: (value: unknown) => T | null,
): T | null {
  if (typeof raw !== 'string' || raw.length > limit) return null;
  try {
    return read(JSON.parse(raw));
  } catch {
    return null;
  }
}
