import { Game } from '../game.ts';
import { kinds, type Kind } from '../data.ts';
import { canHitFlying } from '../flying.ts';
import { missionById, missionWave, type MissionRun } from '../missions.ts';
import { missionThreats, threatAdvice } from './threatPreview.ts';
import * as TEXT from '../texts/fr/missionScreens.ts';
import { fill } from '../texts/fill.ts';

/**
 * Flying snakes arrive from wave rank 6 (`flyingVariant`): a mission that reaches it says so.
 * Under a caprice the allies may be limited, so the sentence names those who can reach them.
 */
function flyingNotice(run: MissionRun, flyingKinds: readonly Kind[]): string {
  if (!missionById(run.missionId)!.waves.some((rank) => rank >= 6)) return '';
  if (!run.caprice) return TEXT.desVolantsArriverontDansCette;
  if (!flyingKinds.length) return TEXT.desVolantsArriverontDansCette2;
  return fill(
    TEXT.desVolantsArriverontDansCette3,
    flyingKinds.map((kind) => kinds[kind].name).join(' · '),
  );
}

/** An isolated proposed Game supplies the same availability as the eventual launch. */
export function missionScouting(run: MissionRun, chosen: readonly Kind[] = []) {
  const game = new Game(run.seed, undefined, run);
  if (chosen.length && !game.chooseCapriceKinds(chosen))
    throw new RangeError(TEXT.invalidPreparationFriendChoice);
  const available = (kind: Kind) => game.isUnlocked(kind) && game.capriceAllows(kind);
  const types = missionThreats(run);
  const flyingKinds = (Object.keys(kinds) as Kind[]).filter(
    (kind) => canHitFlying(kind) && available(kind),
  );
  const flyingPlan = flyingNotice(run, flyingKinds);
  return {
    types,
    advice: threatAdvice(types, available),
    flyingKinds,
    plan: missionWave(run, 1).pattern.tip + (flyingPlan ? ' ' + flyingPlan : ''),
  };
}
