import { Game } from '../game.ts';
import { kinds, type Kind } from '../data.ts';
import { canHitFlying } from '../flying.ts';
import { missionById, missionWave, type MissionRun } from '../missions.ts';
import { missionThreats, threatAdvice } from './threatPreview.ts';
/** An isolated proposed Game supplies the same availability as the eventual launch. */
export function missionScouting(run: MissionRun, chosen: readonly Kind[] = []) {
  const game = new Game(run.seed, undefined, run);
  if (chosen.length && !game.chooseCapriceKinds(chosen))
    throw new RangeError('Invalid preparation friend choice');
  const available = (kind: Kind) => game.isUnlocked(kind) && game.capriceAllows(kind);
  const types = missionThreats(run);
  const flyingKinds = (Object.keys(kinds) as Kind[]).filter(
    (kind) => canHitFlying(kind) && available(kind),
  );
  let flyingPlan = '';
  if (missionById(run.missionId)!.waves.some((rank) => rank >= 6)) {
    flyingPlan = !run.caprice
      ? 'Des volants arriveront dans cette mission : prévois des archers, un dragon ou un tank.'
      : flyingKinds.length
        ? `Des volants arriveront dans cette mission : alliés possibles, ${flyingKinds.map((kind) => kinds[kind].name).join(' · ')}.`
        : 'Des volants arriveront dans cette mission.';
  }
  return {
    types,
    advice: threatAdvice(types, available),
    flyingKinds,
    plan: missionWave(run, 1).pattern.tip + (flyingPlan ? ' ' + flyingPlan : ''),
  };
}
