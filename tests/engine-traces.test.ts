import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Game } from '../src/game.ts';
import { kinds } from '../src/data.ts';
import type { Kind } from '../src/data.ts';
import { MISSIONS, createMissionRun } from '../src/missions.ts';
import { capricesForMission } from '../src/caprices.ts';
import { decodeCheckpoint, encodeCheckpoint } from '../src/checkpoints.ts';
import { expectedTraces } from './fixtures/engine-traces.ts';

// Parties entières jouées par un joueur automatique fixe. L'empreinte couvre tout l'état du
// jeu, pas après pas : déplacer du code dans `src/engine/` ne doit en changer aucune.
// Une empreinte qui change veut dire qu'une ancienne partie ne se rejoue plus pareil.
const order = (Object.keys(kinds) as Kind[]).filter((kind) => kind !== 'hero');
const spots: [number, number][] = [];
for (let x = 624; x <= 972; x += 36) for (let y = 120; y <= 528; y += 36) spots.push([x, y]);

function play(start: Game, salt: number): string {
  let game = start;
  const hash = createHash('sha256');
  let steps = 0,
    buy = salt,
    spot = salt * 7;
  const snap = () =>
    hash.update(JSON.stringify(game)).update(JSON.stringify(game.capriceKindsChosen));
  while (game.status !== 'won' && game.status !== 'lost' && steps < 30 * 60 * 25) {
    if (game.status === 'preparing') {
      if (game.rewards.pending !== null) {
        if (salt % 3) game.chooseReward(game.rewardOffer[salt % 3]);
        else game.skipReward();
      }
      if (steps && salt % 2) game.trainHero(salt % 4 === 1 ? 'force' : 'guard');
      if (game.base < 70) game.repair();
      let tries = 0,
        bought = 0;
      while (tries < order.length * 2 && bought < 2 + (salt % 4)) {
        const kind = order[buy++ % order.length];
        tries++;
        for (let i = 0; i < spots.length; i++) {
          const [x, y] = spots[(spot + i * 5) % spots.length];
          if (game.recruit(kind, x, y)) {
            bought++;
            spot += 11;
            break;
          }
        }
      }
      if (salt % 5 === 0 && game.wave === 2) {
        // Aller-retour par la sauvegarde : le camp restauré doit rejouer pareil.
        const raw = encodeCheckpoint(game);
        const back = raw ? decodeCheckpoint(raw) : null;
        if (back) game = back;
      }
      snap();
      if (!game.startWave()) break;
    }
    game.step(1 / 30);
    steps++;
    if (steps % 90 === 30)
      game.offerFeast(Math.floor(steps / 90 + salt) % 3, salt % 2 ? 'lure' : 'sticky');
    if (steps % 400 === 200) game.encourage();
    if (steps % 250 === 100) {
      game.repair();
      const [x, y] = spots[spot++ % spots.length];
      game.recruit(order[buy++ % order.length], x, y);
    }
    if (steps % 45 === 0) snap();
  }
  snap();
  return `${game.status} w${game.wave} b${game.base} g${game.gold} k${game.kills} s${steps} ${hash.digest('hex').slice(0, 24)}`;
}

function traces(): Record<string, string> {
  const out: Record<string, string> = {};
  out['classique r1'] = play(new Game(8919, undefined, undefined, 1), 1);
  out['classique r2'] = play(new Game(16838, undefined, undefined, 2), 5);
  // The same departure and the same player as the line above, under the third revision.
  out['classique r3'] = play(new Game(16838, undefined, undefined, 3), 5);
  // And under the fourth: the three newcomers are in its waves.
  out['classique r4'] = play(new Game(16838, undefined, undefined, 4), 5);
  out['classique sans règles tactiques'] = play(new Game(57, { tacticalRulesEnabled: false }), 2);
  let n = 0;
  for (const mission of MISSIONS) {
    n++;
    out[`mission ${mission.id}`] = play(
      new Game(
        1,
        undefined,
        createMissionRun(mission.id, 4242 + n * 101, null, n % 2 ? 2 : undefined),
      ),
      n,
    );
    for (const set of ['serpents', 'createur'] as const) {
      const caprice = capricesForMission(mission.id, set)[n % 3];
      const balance = (n + (set === 'createur' ? 1 : 0)) % 2 ? 2 : undefined;
      const run = {
        ...createMissionRun(mission.id, 9000 + n * 37, null, balance),
        caprice: caprice.id,
      };
      out[`défi ${caprice.id} r${balance ?? 1}`] = play(new Game(1, undefined, run), n + 3);
    }
  }
  return out;
}

test('les parties de référence se rejouent à l’identique', () => {
  assert.deepEqual(traces(), expectedTraces);
});
