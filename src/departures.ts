import { MISSIONS, readMissionRun } from './missions.ts';
import type { MissionRun } from './missions.ts';
import type { Game } from './game.ts';

export type Departure =
  Readonly<{ kind: 'classic'; seed: number }> | Readonly<{ kind: 'mission'; run: MissionRun }>;
type Result =
  | { ok: true; departure: Departure }
  | { ok: false; reason: 'format' | 'version' | 'checksum' | 'setup' };
const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const words = ['REFUGE', 'PONTS', 'VIFS', 'COQUILLES', 'SONNETTE', 'FOUGERE'] as const;
const assaults = ['balanced', 'rush', 'escort'] as const;
const nests = ['spread', 'clustered'] as const;
// This versions the departure rules, not a saved army. Bump on incompatible rule changes.
// v1 remains byte-compatible; v2 identifies the progressive refuge only.
const uint = (n: number) => Number.isInteger(n) && n >= 0 && n <= 0xffffffff;
function digits(value: number, count: number) {
  let result = '';
  for (let i = 0; i < count; i++) {
    result = alphabet[value % 32] + result;
    value = Math.floor(value / 32);
  }
  return result;
}
function number(text: string): number | null {
  let value = 0;
  for (const letter of text) {
    const index = alphabet.indexOf(letter);
    if (index < 0) return null;
    value = value * 32 + index;
  }
  return value;
}
function checksum(word: string, payload: string, version: string) {
  let hash = 2166136261;
  for (const letter of `${word}-${version}-${payload}`)
    hash = Math.imul(hash ^ letter.charCodeAt(0), 16777619) >>> 0;
  return digits(hash & 1023, 2);
}
export function encodeDeparture(departure: Departure): string {
  let seed: number,
    config = 0,
    word: string = 'AVENTURE',
    version = '1';
  if (departure.kind === 'mission') {
    const run = readMissionRun(departure.run);
    if (!run) throw new RangeError('Départ invalide');
    if (run.rules === 2) version = '2';
    const index = MISSIONS.findIndex((m) => m.id === run.missionId);
    config =
      1 + index * 18 + run.layout + assaults.indexOf(run.assault) * 3 + nests.indexOf(run.nest) * 9;
    seed = run.seed;
    word = words[index];
  } else seed = departure.seed;
  if (!uint(seed)) throw new RangeError('Graine invalide');
  const payload = digits(seed * 128 + config, 8);
  return `${word}-${version}-${payload.slice(0, 4)}-${payload.slice(4)}-${checksum(word, payload, version)}`;
}
export function decodeDeparture(raw: unknown): Result {
  if (typeof raw !== 'string' || raw.length > 96) return { ok: false, reason: 'format' };
  const clean = raw
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s/g, '');
  const match = /^([A-Z]+)-(\d)-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{2})$/.exec(clean);
  if (!match) return { ok: false, reason: 'format' };
  const [, word, rule, a, b, check] = match;
  if (rule !== '1' && rule !== '2') return { ok: false, reason: 'version' };
  const alias = (s: string) => s.replace(/O/g, '0').replace(/[IL]/g, '1');
  const payload = alias(a + b),
    value = number(payload);
  if (value === null || number(alias(check)) === null) return { ok: false, reason: 'format' };
  if (checksum(word, payload, rule) !== alias(check)) return { ok: false, reason: 'checksum' };
  const seed = Math.floor(value / 128),
    config = value % 128;
  if (!uint(seed) || config > 108) return { ok: false, reason: 'setup' };
  if (rule === '2' && (config === 0 || config > 18)) return { ok: false, reason: 'version' };
  if (config === 0)
    return word === 'AVENTURE'
      ? { ok: true, departure: Object.freeze({ kind: 'classic', seed }) }
      : { ok: false, reason: 'setup' };
  const slot = config - 1,
    index = Math.floor(slot / 18),
    variant = slot % 18;
  if (word !== words[index]) return { ok: false, reason: 'setup' };
  const run = readMissionRun({
    missionId: MISSIONS[index].id,
    ...(rule === '2' ? { rules: 2 } : {}),
    seed,
    layout: variant % 3,
    assault: assaults[Math.floor(variant / 3) % 3],
    nest: nests[Math.floor(variant / 9)],
  })!;
  return { ok: true, departure: Object.freeze({ kind: 'mission', run }) };
}
/** A resumed legacy classic camp can have no recoverable initial seed. */
export function departureForGame(game: Pick<Game, 'mission' | 'initialSeed'>): Departure | null {
  if (game.mission) {
    const run = readMissionRun(game.mission);
    return run ? Object.freeze({ kind: 'mission', run }) : null;
  }
  return game.initialSeed !== null && uint(game.initialSeed)
    ? Object.freeze({ kind: 'classic', seed: game.initialSeed })
    : null;
}
