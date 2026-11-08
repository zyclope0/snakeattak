// Test-only witness. Baselines are captured before changing the source copy.
import { createHash } from 'node:crypto';
import { Game } from '../src/game.ts';
import { encodeCheckpoint } from '../src/checkpoints.ts';
import { decodeDeparture } from '../src/departures.ts';

const sha = (text: string) => createHash('sha256').update(text).digest('hex');
export function replayDeparture(code: string) {
  const decoded = decodeDeparture(code);
  if (!decoded.ok) throw new Error('Invalid recorded departure: ' + code);
  const d = decoded.departure;
  const g = d.kind === 'classic' ? new Game(d.seed) : new Game(d.run.seed, undefined, d.run);
  const trace: string[] = [],
    checkpoints: string[] = [];
  const record = () => {
    // Text changes are the purpose of this release. Every other own field,
    // including RNG, entities, effects, economy and clocks, remains in the hash.
    const { message: _copy, ...state } = g;
    trace.push(sha(JSON.stringify(state)));
  };
  const save = () => {
    const raw = encodeCheckpoint(g);
    if (raw === null) throw new Error('Preparing camp not serializable');
    checkpoints.push(raw);
  };
  save();
  record();
  let frame = 0;
  while (frame < 18000 && g.status !== 'won' && g.status !== 'lost') {
    if (g.status === 'preparing') {
      if (g.rewards.pending !== null) g.skipReward();
      for (const kind of ['archer', 'shield', 'nurse'] as const) {
        if (!g.isUnlocked(kind)) continue;
        for (const x of [840, 888, 936, 984])
          for (const y of [156, 228, 300, 372, 444, 516])
            if (g.units.length < 12 && g.gold >= g.recruitCost(kind)) g.recruit(kind, x, y);
      }
      save();
      g.startWave();
      record();
    }
    if (!g.feastUsed && frame % 90 === 0) g.offerFeast(g.enemyLanes[0], 'sticky');
    if (!g.encouragementUsed && g.units.some((u) => u.state === 'attack')) g.encourage();
    g.step(1 / 30);
    frame++;
    if (frame % 30 === 0 || g.status !== 'fighting') record();
  }
  if (g.status !== 'won' && g.status !== 'lost') throw new Error('Witness timeout: ' + code);
  record();
  return { code, frame, status: g.status, trace, checkpoints };
}
