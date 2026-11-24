import { capriceById, capricesForMission } from './caprices.ts';
import { missionSetup, MISSION_SETUPS, readMissionRun } from './missions.ts';
import type { MissionRun } from './missions.ts';
import { pickOne, questionStream, SEED_RANGE } from './seededRandom.ts';
import { isVoyageSeed } from './voyage.ts';
import { CURRENT_EXPEDITION_VERSION, EXPEDITION_TUNINGS } from './expeditionTuning.ts';
import type {
  Draw,
  ExpeditionTuning,
  ExpeditionVersion,
  ForkDraws,
  TableauTuning,
} from './expeditionTuning.ts';

/**
 * The map of an expedition, drawn from its seed alone before the first fight: every battle,
 * every fork and every halt of its three tableaux. A saved expedition never stores it: the
 * same seed and the same version draw it again, on every device.
 */
export type Path = 'calm' | 'brave';
export type HaltKind = 'feu' | 'roulotte' | 'oeuf';
export type Battle = Readonly<{
  run: MissionRun;
  path: Path | 'first' | 'guardian';
  king: boolean;
  court: boolean;
  kingHp: number;
}>;
/** One step of a tableau: a battle, a choice of two battles, or a choice of two halts. */
export type Step =
  | Readonly<{ kind: 'battle'; battle: Battle }>
  | Readonly<{ kind: 'fork'; calm: Battle; brave: Battle }>
  | Readonly<{ kind: 'halt'; halts: readonly [HaltKind, HaltKind] }>;
export type ExpeditionPlan = Readonly<{
  version: ExpeditionVersion;
  seed: number;
  tableaux: readonly (readonly Step[])[];
}>;

/** The shape of every tableau: five battles, two of them after a choice of halts. */
export const SHAPE = ['first', 'fork', 'halt', 'fork', 'fork', 'halt', 'guardian'] as const;
export const STEPS_PER_TABLEAU = SHAPE.length;
const HALTS: readonly HaltKind[] = ['feu', 'roulotte', 'oeuf'];

/** A step where the child picks one of two: a fork or a halt. */
export const isChoice = (shape: (typeof SHAPE)[number] | undefined): boolean =>
  shape === 'fork' || shape === 'halt';
/** The forks and halts of a tableau before a step: one pick each. */
export const choicesBefore = (step: number) => SHAPE.slice(0, step).filter(isChoice).length;
export const CHOICES_PER_TABLEAU = choicesBefore(STEPS_PER_TABLEAU);
/** The battles of a tableau before a step: every step but the halts. */
export const battlesBeforeStep = (step: number) =>
  SHAPE.slice(0, step).filter((shape) => shape !== 'halt').length;
/** Five battles a tableau: the guardian is the fifth. */
export const BATTLES_PER_TABLEAU = battlesBeforeStep(STEPS_PER_TABLEAU);

function drawBattle(
  random: () => number,
  draw: Draw,
  path: Battle['path'],
  tuning: ExpeditionTuning,
  guardian?: TableauTuning['guardian'],
): Battle {
  // A fixed challenge brings the mission it was tuned for; only the setup and the fight vary.
  const fixed = 'defi' in draw ? capriceById(draw.defi) : null;
  if ('defi' in draw && !fixed) throw new RangeError(draw.defi);
  const drawn = 'defi' in draw ? null : draw;
  const missionId = fixed ? fixed.missionId : pickOne(random, drawn!.missions);
  const setup = missionSetup(Math.floor(random() * MISSION_SETUPS));
  const fightSeed = Math.floor(random() * SEED_RANGE);
  const caprices = fixed
    ? [fixed]
    : capricesForMission(missionId).filter(
        (c) => drawn!.tiers.includes(c.tier) && !tuning.excluded.includes(c.id) && !c.rules.king,
      );
  const caprice = fixed ?? (caprices.length ? pickOne(random, caprices) : null);
  const run = readMissionRun({
    missionId,
    balance: 2,
    ...(missionId === 'refuge' ? { rules: 2 } : {}),
    ...(tuning.paths === 2 ? { paths: 2 } : {}),
    seed: fightSeed,
    ...setup,
    ...(caprice ? { caprice: caprice.id } : {}),
  })!;
  return Object.freeze({
    run,
    path,
    king: !!guardian,
    court: guardian?.court ?? false,
    kingHp: guardian?.kingHp ?? 1,
  });
}

/** The whole expedition of a seed. Null for a seed or a version that does not exist. */
export function planExpedition(
  seed: number,
  version: ExpeditionVersion = CURRENT_EXPEDITION_VERSION,
  tuning: ExpeditionTuning = EXPEDITION_TUNINGS[version],
): ExpeditionPlan | null {
  // The seeds of the voyage: twenty bits.
  if (!isVoyageSeed(seed) || !tuning) return null;
  const tableaux = tuning.tableaux.map((table, t) => {
    let fork = 0;
    /** A path's draw: the same for every fork, or the one of this fork. */
    const at = (draw: Draw | ForkDraws, index: number): Draw =>
      Array.isArray(draw) ? (draw as ForkDraws)[index] : (draw as Draw);
    return Object.freeze(
      SHAPE.map((shape, s): Step => {
        // The plan's own questions; the gifts, the roulotte and the egg ask theirs
        // (expeditionState.ts), and no two share a number.
        const random = questionStream(seed, 100 * (t + 1) + s);
        if (shape === 'halt') {
          const first = pickOne(random, HALTS);
          const second = pickOne(
            random,
            HALTS.filter((h) => h !== first),
          );
          return Object.freeze({ kind: 'halt', halts: Object.freeze([first, second]) as never });
        }
        if (shape === 'fork') {
          const index = fork++;
          return Object.freeze({
            kind: 'fork',
            calm: drawBattle(random, at(table.calm, index), 'calm', tuning),
            brave: drawBattle(random, at(table.brave, index), 'brave', tuning),
          });
        }
        const battle =
          shape === 'first'
            ? drawBattle(random, table.first, 'first', tuning)
            : drawBattle(random, table.guardian, 'guardian', tuning, table.guardian);
        return Object.freeze({ kind: 'battle', battle });
      }),
    );
  });
  return Object.freeze({ version, seed, tableaux: Object.freeze(tableaux) });
}
