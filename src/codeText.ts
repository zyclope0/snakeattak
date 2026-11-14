/**
 * The writing shared by the codes a child reads aloud or copies: departure codes and voyage
 * codes. Thirty-two signs without O, I, L or U, so that no two of them look alike.
 */
const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** `value` written on exactly `count` signs, most significant first. */
export function codeDigits(value: number, count: number): string {
  let result = '';
  for (let i = 0; i < count; i++) {
    result = alphabet[value % 32] + result;
    value = Math.floor(value / 32);
  }
  return result;
}
/** The number written by `text`; null when a sign is not in the alphabet. */
export function codeNumber(text: string): number | null {
  let value = 0;
  for (const letter of text) {
    const index = alphabet.indexOf(letter);
    if (index < 0) return null;
    value = value * 32 + index;
  }
  return value;
}
/** Two check signs for a written text: a typing mistake is caught 1023 times out of 1024. */
export function checkDigits(text: string): string {
  let hash = 2166136261;
  for (const letter of text) hash = Math.imul(hash ^ letter.charCodeAt(0), 16777619) >>> 0;
  return codeDigits(hash & 1023, 2);
}
/** A child may type lower case, accents and spaces. */
export const tidyCode = (raw: string): string =>
  raw
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s/g, '');
/** The alphabet has no O, I or L: read them as the digits they look like. */
export const readLookalikes = (text: string): string =>
  text.replace(/O/g, '0').replace(/[IL]/g, '1');
