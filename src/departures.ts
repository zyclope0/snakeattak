import {
  MISSIONS,
  MISSION_SETUPS,
  isPersistableMissionRun,
  missionSetup,
  missionSetupIndex,
  readMissionRun,
} from './missions.ts';
import type { MissionRun } from './missions.ts';
import type { Game } from './game.ts';
import { CAPRICE_TIERS, capriceById, capricesForMission } from './caprices.ts';
import type { CapriceDefinition } from './caprices.ts';
import { isOneOf, isUint32 } from './plainData.ts';
import { checkDigits, codeDigits, codeNumber, readLookalikes, tidyCode } from './codeText.ts';
import * as TEXT from './texts/fr/adventure.ts';

export type Departure =
  | Readonly<{ kind: 'classic'; seed: number; balance?: 2 | 3 }>
  | Readonly<{ kind: 'mission'; run: MissionRun }>;
type Refusal = { ok: false; reason: 'format' | 'version' | 'checksum' | 'setup' };
type Result = { ok: true; departure: Departure } | Refusal;
const refused = (reason: Refusal['reason']): Refusal => ({ ok: false, reason });

/**
 * A departure code reads `WORD-V-PPPP-PPPP-[SS-]CC`: the word of the mission, the version
 * of the departure rules, eight digits for the seed and the setup, a suffix for the
 * challenge from version 3 on, two check digits.
 *
 * The version describes the departure rules, not a saved army; it changes on incompatible
 * rule changes and every older code stays readable, byte for byte:
 *   1  the great adventure or an expedition    2  the tutorial refuge only
 *   3  an expedition with a challenge          4  the second balance revision
 *   5  the third balance revision: the great adventure only, written like version 1
 * Setup 0 is the great adventure; 1 to 108 are the eighteen setups of each of the six
 * missions. Versions 3 and 4 keep one more bit for the tutorial rules of the refuge.
 */
const RULES = ['1', '2', '3', '4', '5'] as const;
type Rule = (typeof RULES)[number];
const hasTutorialBit = (rule: string) => rule === '3' || rule === '4';
// The setup takes the low seven bits of the payload; the tutorial bit, when there is one,
// comes next; the seed takes the rest.
const SETUP_RANGE = 128;
const TUTORIAL_BIT = 128;
const seedFactor = (rule: string) => (hasTutorialBit(rule) ? 256 : SETUP_RANGE);
const NO_CHALLENGE = 'N0';

const words = [
  TEXT.refuge,
  TEXT.ponts,
  TEXT.vifs,
  TEXT.coquilles,
  TEXT.sonnette,
  TEXT.fougere,
] as const;

function checksum(word: string, payload: string, version: string, suffix = '') {
  return checkDigits(`${word}-${version}-${payload}${suffix ? `-${suffix}` : ''}`);
}

/** What a code is made of before it is written out. */
type CodeParts = { word: string; rule: Rule; seed: number; config: number; suffix: string };

/** `S2`, `C3`: the row of the challenge (serpents or creator), then its level from 1 to 3. */
function challengeSuffix(id: string): string {
  const caprice = capriceById(id)!;
  return `${caprice.set === 'serpents' ? 'S' : 'C'}${CAPRICE_TIERS.indexOf(caprice.tier) + 1}`;
}
function missionParts(raw: MissionRun): CodeParts {
  const run = readMissionRun(raw);
  if (!run || !isPersistableMissionRun(run)) throw new RangeError(TEXT.departInvalide);
  // The newest rule in use names the version: older codes keep their exact text.
  const rule = run.balance === 2 ? '4' : run.caprice ? '3' : run.rules === 2 ? '2' : '1';
  const index = MISSIONS.findIndex((m) => m.id === run.missionId);
  const tutorial = hasTutorialBit(rule) && run.rules === 2 ? TUTORIAL_BIT : 0;
  return {
    word: words[index],
    rule,
    seed: run.seed,
    config: 1 + index * MISSION_SETUPS + missionSetupIndex(run) + tutorial,
    suffix: run.caprice ? challengeSuffix(run.caprice) : run.balance === 2 ? NO_CHALLENGE : '',
  };
}
function classicParts(departure: { seed: number; balance?: 2 | 3 }): CodeParts {
  if (Object.hasOwn(departure, 'balance') && departure.balance !== 2 && departure.balance !== 3)
    throw new RangeError(TEXT.revisionInvalide);
  const second = departure.balance === 2;
  return {
    word: TEXT.aventure,
    rule: departure.balance === 3 ? '5' : second ? '4' : '1',
    seed: departure.seed,
    config: 0,
    suffix: second ? NO_CHALLENGE : '',
  };
}
export function encodeDeparture(departure: Departure): string {
  const { word, rule, seed, config, suffix } =
    departure.kind === 'mission' ? missionParts(departure.run) : classicParts(departure);
  if (!isUint32(seed)) throw new RangeError(TEXT.graineInvalide);
  const payload = codeDigits(seed * seedFactor(rule) + config, 8);
  return `${word}-${rule}-${payload.slice(0, 4)}-${payload.slice(4)}-${suffix ? `${suffix}-` : ''}${checksum(word, payload, rule, suffix)}`;
}

/** Far longer than any code, even typed with stray spaces: the rest is not read at all. */
export const DEPARTURE_INPUT_LIMIT = 96;
const WRITTEN_CODE = /^([A-Z]+)-(\d)-([A-Z0-9]{4})-([A-Z0-9]{4})-(?:([A-Z0-9]{2})-)?([A-Z0-9]{2})$/;
const CHALLENGE_SUFFIX = /^[SC][123]$/;
/** A code that is written correctly: its fields, with the payload as a number. */
type WrittenCode = { ok: true; word: string; rule: Rule; suffix: string; value: number };

function splitCode(raw: unknown): WrittenCode | Refusal {
  if (typeof raw !== 'string' || raw.length > DEPARTURE_INPUT_LIMIT) return refused('format');
  const match = WRITTEN_CODE.exec(tidyCode(raw));
  if (!match) return refused('format');
  const [, word, rule, a, b, suffix = '', check] = match;
  if (!isOneOf(rule, RULES)) return refused('version');
  // The suffix comes with the versions that name a challenge, and only with them.
  if (hasTutorialBit(rule) ? !suffix : !!suffix) return refused('format');
  const payload = readLookalikes(a + b);
  const value = codeNumber(payload);
  if (value === null || codeNumber(readLookalikes(check)) === null) return refused('format');
  if (checksum(word, payload, rule, suffix) !== readLookalikes(check)) return refused('checksum');
  return { ok: true, word, rule, suffix, value };
}

/** The challenge named by a suffix among the six of a mission; undefined if there is none. */
function challengeOf(missionIndex: number, suffix: string): CapriceDefinition | undefined {
  return capricesForMission(
    MISSIONS[missionIndex].id,
    suffix[0] === 'S' ? 'serpents' : 'createur',
  ).find((entry) => entry.tier === CAPRICE_TIERS[Number(suffix[1]) - 1]);
}

export function decodeDeparture(raw: unknown): Result {
  const code = splitCode(raw);
  if (!code.ok) return code;
  const { word, rule, suffix, value } = code;
  const seed = Math.floor(value / seedFactor(rule));
  const config = value % SETUP_RANGE;
  const rules2 = rule === '2' || (hasTutorialBit(rule) && value % 256 >= TUTORIAL_BIT);
  if (!isUint32(seed) || config > words.length * MISSION_SETUPS) return refused('setup');
  // The tutorial rules only exist in the refuge, the first eighteen setups.
  const inRefuge = config >= 1 && config <= MISSION_SETUPS;
  if (rules2 && !inRefuge) return refused(rule === '2' ? 'version' : 'setup');
  const hasChallenge = rule === '3' || (rule === '4' && suffix !== NO_CHALLENGE);
  if (hasChallenge && (config === 0 || !CHALLENGE_SUFFIX.test(suffix))) return refused('setup');
  if (config === 0) {
    if (word !== TEXT.aventure) return refused('setup');
    const balance =
      rule === '5' ? { balance: 3 as const } : rule === '4' ? { balance: 2 as const } : {};
    return { ok: true, departure: Object.freeze({ kind: 'classic', seed, ...balance }) };
  }
  // The third revision has no expedition: such a code was not written by the game.
  if (rule === '5') return refused('setup');
  const slot = config - 1;
  const index = Math.floor(slot / MISSION_SETUPS);
  if (word !== words[index]) return refused('setup');
  const caprice = hasChallenge ? challengeOf(index, suffix) : null;
  if (hasChallenge && !caprice) return refused('setup');
  const run = readMissionRun({
    missionId: MISSIONS[index].id,
    ...(rule === '4' ? { balance: 2 } : {}),
    ...(rules2 ? { rules: 2 } : {}),
    ...(caprice ? { caprice: caprice.id } : {}),
    seed,
    ...missionSetup(slot % MISSION_SETUPS),
  });
  if (!run) return refused('setup');
  return { ok: true, departure: Object.freeze({ kind: 'mission', run }) };
}
/** A resumed legacy classic camp can have no recoverable initial seed. */
export function departureForGame(
  game: Pick<Game, 'mission' | 'initialSeed'> & Partial<Pick<Game, 'balanceRevision'>>,
): Departure | null {
  if (game.mission) {
    const run = readMissionRun(game.mission);
    return run ? Object.freeze({ kind: 'mission', run }) : null;
  }
  return game.initialSeed !== null && isUint32(game.initialSeed)
    ? Object.freeze({
        kind: 'classic',
        seed: game.initialSeed,
        ...(game.balanceRevision === 3
          ? { balance: 3 as const }
          : game.balanceRevision === 2
            ? { balance: 2 as const }
            : {}),
      })
    : null;
}
