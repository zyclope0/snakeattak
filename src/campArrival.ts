import { armourFactor, readBoons } from './boons.ts';
import { kinds } from './data.ts';
import type { Kind } from './data.ts';
import { EXPEDITION_STAGE_VERSION } from './voyageRules.ts';
import { readCarriedCamp } from './checkpointUnits.ts';
import type { GiftLedger } from './gameGifts.ts';
import type { Game } from './game.ts';

/** What the previous mission of « La Grande Expédition » hands over, as it was kept. */
export type ArrivingCamp = { units: unknown; gold: unknown; base: unknown; boons: unknown };

/**
 * « La Grande Expédition » (stage rules version 3): the camp of the previous mission comes
 * along — the allies still standing, the coins, the crystal and the lasting gifts. Called
 * once, before the first wave, on a game built for such a stage; false on any doubt, and
 * the game is then left as it was built (`Game.receiveCamp`).
 */
export function receiveCarriedCamp(game: Game, ledger: GiftLedger, camp: ArrivingCamp): boolean {
  if (
    game.stage?.version !== EXPEDITION_STAGE_VERSION ||
    game.wave !== 0 ||
    game.status !== 'preparing'
  )
    return false;
  const boons = readBoons(camp.boons, game.boonRules);
  if (!boons) return false;
  // The first mission of a tableau starts from a new camp: only the gifts come along.
  if (camp.units === null) {
    ledger.boons = boons;
    const armour = armourFactor(boons, game.boonRules);
    for (const u of game.units) u.maxHp = u.hp = kinds[u.kind as Kind].hp * armour;
    return true;
  }
  const carried = readCarriedCamp(camp, armourFactor(boons, game.boonRules));
  if (!carried || !carried.units.every((unit) => game.knowsAlly(unit.kind as Kind))) return false;
  game.units = carried.units;
  game.nextId = Math.max(game.nextId, carried.nextId + 1);
  game.gold = carried.gold;
  game.base = carried.base;
  ledger.boons = boons;
  // The new map may have a rock where an ally lived: every one gets a home of this map.
  game.normalizeCamp();
  return true;
}
