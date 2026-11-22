import { kinds } from './data.ts';
import type { Kind } from './data.ts';
import type { Entity } from './engine/state.ts';
import { ensureMedical, medicalRules, readMedical } from './healing.ts';
import type { MedicalState } from './healing.ts';
import { CRYSTAL_MAX, ENTITY_ID_LIMIT, GOLD_LIMIT } from './gameConstants.ts';
import { isArrayOfLength, isIntegerIn, isNumberIn, isRecord } from './plainData.ts';

/**
 * The allies of a saved camp: what is written for each of them and how it is read back.
 * A save keeps where an ally stands, its home, its health and a healer's supplies. The rest
 * belongs to a fight that is over (path, target, cooldowns) and is rebuilt idle.
 */

// A 19px square cannot contain two homes 28px apart; the camp has at most 483 such cells.
export const UNIT_LIMIT = 512;

// The defenders' side of the board, in board pixels.
const isCampX = (value: unknown): value is number => isNumberIn(value, 580, 1080);
const isCampY = (value: unknown): value is number => isNumberIn(value, 96, 552);

/** The name of an ally that exists in the catalogue. */
export const isKind = (value: unknown): value is Kind =>
  typeof value === 'string' && Object.hasOwn(kinds, value);

type SavedUnit = {
  id: number;
  kind: Entity['kind'];
  x: number;
  y: number;
  hp: number;
  homeX: number;
  homeY: number;
  medical?: MedicalState;
  medicalCool?: number;
};

/**
 * What a save keeps of one ally. `withSupplies` is false for the formats older than the
 * healers' supplies. Null when the supplies cannot be trusted: the camp is not saved then.
 */
export function saveUnit(unit: Entity, withSupplies: boolean): SavedUnit | null {
  const saved = {
    id: unit.id,
    kind: unit.kind,
    x: unit.x,
    y: unit.y,
    hp: unit.hp,
    homeX: unit.homeX,
    homeY: unit.homeY,
  };
  if (!withSupplies) return saved;
  const rules = medicalRules(unit.kind);
  if (!rules) return unit.medical === undefined ? saved : null;
  // A healer that never served has no supplies yet: it is saved with a full bag.
  const medical = ensureMedical({ kind: unit.kind, medical: unit.medical });
  if (!medical || !Number.isFinite(unit.cool)) return null;
  return { ...saved, medical, medicalCool: Math.max(0, Math.min(rules.interval, unit.cool)) };
}

/** How the allies of one save are written: which columns its format version holds. */
export type UnitFormat = Readonly<{
  /** False for version 1, saved before the homes: an ally then lives where it stands. */
  homes: boolean;
  /** True from version 6 on: healers carry their supplies and their delay. */
  supplies: boolean;
  /** The save's identifier counter: no ally can have a greater identifier. */
  nextId: number;
  /** The life of every ally, as a multiple of its kind's: more than one with the armour. */
  lifeFactor?: number;
}>;

type Supplies = {
  medical: MedicalState | null;
  cool: number;
};

/** A healer's supplies and delay before its next care; the other allies must carry none. */
function readSupplies(
  saved: Record<string, unknown>,
  kind: Kind,
  stored: boolean,
): Supplies | null {
  const rules = medicalRules(kind);
  if (!rules) {
    const carried = Object.hasOwn(saved, 'medical') || Object.hasOwn(saved, 'medicalCool');
    return stored && carried ? null : { medical: null, cool: 0 };
  }
  // A camp saved before the supplies existed restarts its healers with a full bag.
  if (!stored) return { medical: ensureMedical({ kind }), cool: 0 };
  const medical = readMedical(saved.medical, kind);
  if (!medical || !isNumberIn(saved.medicalCool, 0, rules.interval)) return null;
  return { medical, cool: saved.medicalCool };
}

/**
 * One saved ally as a fresh idle entity; null when anything about it is out of bounds.
 * `taken` holds the identifiers already read: two allies never share one. Dead allies are
 * refused, never brought back.
 */
export function readUnit(
  saved: unknown,
  format: UnitFormat,
  taken: ReadonlySet<number>,
): Entity | null {
  if (
    !isRecord(saved) ||
    !isKind(saved.kind) ||
    !isIntegerIn(saved.id, 1, format.nextId) ||
    taken.has(saved.id) ||
    !isCampX(saved.x) ||
    !isCampY(saved.y) ||
    !isCampY(saved.homeY) ||
    (format.homes && !isCampX(saved.homeX))
  )
    return null;
  const kind = saved.kind;
  // The armour of the endless adventure gives every ally more life.
  const maxHp = kinds[kind].hp * (format.lifeFactor ?? 1);
  const supplies = readSupplies(saved, kind, format.supplies);
  if (!supplies) return null;
  if (!isNumberIn(saved.hp, 0, maxHp) || saved.hp <= 0) return null;
  return {
    id: saved.id,
    kind,
    x: saved.x,
    y: saved.y,
    hp: saved.hp,
    maxHp,
    homeX: format.homes ? (saved.homeX as number) : saved.x,
    homeY: saved.homeY,
    variant: 'normal',
    broodCool: 10,
    charge: 0,
    guardCool: 0,
    rattleCool: 0,
    confusedFor: 0,
    confusionImmunity: 0,
    cool: supplies.cool,
    ...(supplies.medical ? { medical: supplies.medical } : {}),
    path: [],
    nav: 0,
    boss: false,
    state: 'idle',
    facing: -1,
    lane: 0,
    stage: 0,
    turnY: null,
    targetId: null,
  };
}

/** A camp carried from one battle to the next: its allies as fresh idle entities. */
export type CarriedCamp = { units: Entity[]; gold: number; base: number; nextId: number };

/**
 * Reads the camp an expedition carries from one battle to the next: its coins, its crystal
 * and its allies, each with a home and a healer's supplies. `lifeFactor` is what the armour
 * makes of an ally's life. Null when anything is out of bounds, when two allies share a
 * number or when two heroes come along. `nextId` is the highest number an ally carries.
 */
export function readCarriedCamp(
  raw: { units?: unknown; gold?: unknown; base?: unknown },
  lifeFactor: number,
): CarriedCamp | null {
  const { gold, base, units: saved } = raw;
  if (
    !isIntegerIn(gold, 0, GOLD_LIMIT) ||
    !isNumberIn(base, 1, CRYSTAL_MAX) ||
    !isArrayOfLength(saved, 0, UNIT_LIMIT)
  )
    return null;
  let nextId = 0;
  for (const one of saved)
    nextId = Math.max(
      nextId,
      isRecord(one) && isIntegerIn(one.id, 1, ENTITY_ID_LIMIT) ? one.id : 0,
    );
  const taken = new Set<number>();
  const units: Entity[] = [];
  for (const one of saved) {
    const unit = readUnit(one, { homes: true, supplies: true, nextId, lifeFactor }, taken);
    if (!unit) return null;
    taken.add(unit.id);
    units.push(unit);
  }
  if (units.filter((u) => u.kind === 'hero').length > 1) return null;
  return { units, gold, base, nextId };
}
