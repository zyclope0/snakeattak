import { checkDigits, codeDigits, codeNumber, readLookalikes, tidyCode } from './codeText.ts';
import { isVoyageSeed } from './voyage.ts';
import { CURRENT_VOYAGE_VERSION, isVoyageVersion } from './voyageTuning.ts';
import type { VoyageVersion } from './voyageTuning.ts';

/**
 * A voyage code reads `VOYAGE-V-SSSS-CC`: the version of the voyage rules, four signs for
 * the seed, two check signs. Same writing as a departure code (`departures.ts`). Whoever
 * types it plays the same five stages, the same caprices and is offered the same cards;
 * the bag, the stages won and the record stay with each player.
 *
 * The version names a table of `voyageTuning.ts`. A code of an older version keeps drawing
 * the voyage it always drew.
 */
const WORD = 'VOYAGE';
const WRITTEN_CODE = /^([A-Z]+)-(\d)-([A-Z0-9]{4})-([A-Z0-9]{2})$/;
const SEED_SIGNS = 4;
/** Far longer than a code with a few stray spaces: the rest is not read at all. */
const INPUT_LIMIT = 64;

type Refusal = { ok: false; reason: 'format' | 'version' | 'checksum' };
export type VoyageCode = { ok: true; seed: number; version: VoyageVersion } | Refusal;
const refused = (reason: Refusal['reason']): Refusal => ({ ok: false, reason });

const checkOf = (version: string, seedSigns: string) =>
  checkDigits(`${WORD}-${version}-${seedSigns}`);

/** The code of a voyage; null when the seed or the version is not one. */
export function encodeVoyage(
  seed: number,
  version: VoyageVersion = CURRENT_VOYAGE_VERSION,
): string | null {
  if (!isVoyageSeed(seed) || !isVoyageVersion(version)) return null;
  const signs = codeDigits(seed, SEED_SIGNS);
  return `${WORD}-${version}-${signs}-${checkOf(String(version), signs)}`;
}

/** Reads what a child typed. A wrong code is an answer, never an exception. */
export function decodeVoyage(raw: unknown): VoyageCode {
  if (typeof raw !== 'string' || raw.length > INPUT_LIMIT) return refused('format');
  const match = WRITTEN_CODE.exec(tidyCode(raw));
  if (!match || match[1] !== WORD) return refused('format');
  const [, , written, typedSigns, typedCheck] = match;
  const version = Number(written);
  if (!isVoyageVersion(version)) return refused('version');
  const signs = readLookalikes(typedSigns);
  const seed = codeNumber(signs);
  if (seed === null || !isVoyageSeed(seed)) return refused('format');
  if (checkOf(written, signs) !== readLookalikes(typedCheck)) return refused('checksum');
  return { ok: true, seed, version };
}
