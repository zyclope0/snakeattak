import type { Entity } from '../game.ts';
import { medicalRules } from '../healing.ts';
import * as TEXT from '../texts/fr/board.ts';
import { fill } from '../texts/fill.ts';

/** Compact labels derived from live stock; full stock needs no repeating caption. */
export function medicalReadout(units: readonly Entity[]) {
  const badges: { id: number; x: number; y: number; text: string }[] = [];
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
      });
    }
  }
  return {
    badges,
    present,
    reserveLabel: refilling ? fill(TEXT.reserveNNS, refilling, Math.ceil(remaining)) : TEXT.reserve,
  };
}
