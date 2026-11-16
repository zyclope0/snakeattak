import { kinds } from './data.ts';
import type { Kind } from './data.ts';
import * as TEXT from './texts/fr/battle.ts';

/**
 * The revisions of the balance. A game keeps the one it started with: an old starting code
 * and an old save replay exactly as they did.
 *   1  the first balance              2  three prices lowered (10 November 2026)
 *   3  an egg when a wave drags on, in the great adventure (15 November 2026)
 *   4  three new snakes in the great adventure (16 November 2026)
 */
export const BALANCE_REVISIONS = [1, 2, 3, 4] as const;
export type BalanceRevision = (typeof BALANCE_REVISIONS)[number];
export const CURRENT_BALANCE_REVISION: BalanceRevision = 4;
export const isBalanceRevision = (value: unknown): value is BalanceRevision =>
  (BALANCE_REVISIONS as readonly unknown[]).includes(value);
/** From the third on, a revision exists in the great adventure only: no expedition has it. */
export type ClassicRevision = Exclude<BalanceRevision, 1 | 2>;
export const isClassicRevision = (value: unknown): value is ClassicRevision =>
  isBalanceRevision(value) && value >= 3;
/** Historical prices remain the default for callers replaying an old departure. */
export function balanceRecruitPrice(kind: Kind, revision: BalanceRevision = 1): number {
  if (!isBalanceRevision(revision)) throw new RangeError(TEXT.revisionInvalide);
  if (revision >= 2) {
    if (kind === 'trex') return 340;
    if (kind === 'dragon') return 210;
    if (kind === 'tank') return 440;
  }
  return kinds[kind].cost;
}

/**
 * An egg that arrives when a wave of the great adventure drags on (idea of the child, values
 * chosen by the parent on 15 November 2026 after 240 simulated games): the first after
 * `after` seconds of a wave, the next every `every` seconds, `most` at most in one wave. Each
 * hatches `count` ordinary snakes `hatchIn` seconds later.
 */
export type LateEggRule = Readonly<{
  after: number;
  every: number;
  most: number;
  hatchIn: number;
  count: number;
}>;
const LATE_EGGS: LateEggRule = Object.freeze({
  after: 45,
  every: 15,
  most: 2,
  hatchIn: 8,
  count: 2,
});
/** Null before the third revision: older games never see such an egg. */
export const lateEggRule = (revision: BalanceRevision): LateEggRule | null =>
  revision >= 3 ? LATE_EGGS : null;
