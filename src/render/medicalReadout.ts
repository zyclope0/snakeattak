import type { Entity } from '../game.ts';
import { medicalRules } from '../healing.ts';
import * as TEXT from '../texts/fr/board.ts';
import { fill } from '../texts/fill.ts';

/**
 * Compact labels derived from live stock; full stock needs no repeating caption. Each has a
 * short form for a small board, where the whole caption would be read at 5 px.
 */
export function medicalReadout(units: readonly Entity[]) {
  const badges: { id: number; x: number; y: number; text: string; short: string }[] = [];
  let present = 0,
    refilling = 0,
    remaining = 0;
  for (const unit of units) {
    const rules = medicalRules(unit.kind),
      state = unit.medical;
    if (!rules || !state || unit.hp <= 0) continue;
    present++;
    if (state.phase === 'restocking') {
      refilling++;
      remaining = Math.max(remaining, state.remaining);
    } else if (state.phase === 'returning' || state.bandages < rules.capacity) {
      badges.push({
        id: unit.id,
        x: unit.x,
        y: unit.y + 23,
        text: state.phase === 'returning' ? '↩' : `+ ${state.bandages}/${rules.capacity}`,
        short: state.phase === 'returning' ? '↩' : `+${state.bandages}`,
      });
    }
  }
  return {
    badges,
    present,
    reserveLabel: refilling ? fill(TEXT.reserveNNS, refilling, Math.ceil(remaining)) : TEXT.reserve,
    // On a small board the cross of the station says « Réserve »: only the wait is written.
    reserveShort: refilling ? fill(TEXT.nS, Math.ceil(remaining)) : '',
  };
}
