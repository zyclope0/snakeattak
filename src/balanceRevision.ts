import { kinds } from './data.ts';
import type { Kind } from './data.ts';
import * as TEXT from './texts/fr/battle.ts';

export type BalanceRevision = 1 | 2;
export const CURRENT_BALANCE_REVISION: BalanceRevision = 2;
/** Historical prices remain the default for callers replaying an old departure. */
export function balanceRecruitPrice(kind: Kind, revision: BalanceRevision = 1): number {
  if (revision !== 1 && revision !== 2) throw new RangeError(TEXT.revisionInvalide);
  if (revision === 2) {
    if (kind === 'trex') return 340;
    if (kind === 'dragon') return 210;
    if (kind === 'tank') return 440;
  }
  return kinds[kind].cost;
}
