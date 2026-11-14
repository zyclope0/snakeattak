import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import type { Hash } from 'node:crypto';
import type { Game } from '../src/game.ts';
import type { Kind } from '../src/data.ts';
import { REWARDS } from '../src/rewards.ts';
import { encodeVoyage } from '../src/voyageCode.ts';
import {
  bonusOffer,
  chooseBonus,
  recordStage,
  stageGame,
  startVoyage,
  voyagePhase,
  voyagePlanOf,
} from '../src/voyageState.ts';
import { expectedVoyageTraces } from './fixtures/voyage-traces.ts';

// Voyages entiers joués par un joueur automatique fixe, par les mêmes appels que l'interface :
// commencer, jouer l'étape, enregistrer son résultat, garder une carte. L'empreinte couvre le
// plan tiré de la graine, tout l'état de chaque partie pas après pas, et l'état du voyage.
// Une empreinte qui change veut dire qu'un code de voyage ne donne plus le même voyage : ce
// joueur ne se retouche donc pas, et les réglages de `src/voyageTuning.ts` non plus sans une
// nouvelle version.
const order: Kind[] = ['shield', 'archer', 'club', 'ninja', 'raptor', 'club'];
const spots: [number, number][] = [];
for (let x = 660; x <= 948; x += 48)
  for (const y of [180, 324, 468, 132, 276, 420]) spots.push([x, y]);

/** Places the free allies of the bag, then spends the purse down to `keep` coins. */
function prepare(game: Game, salt: number, keep: number) {
  let spot = salt + game.wave * 7;
  const place = (kind: Kind) => {
    for (let i = 0; i < spots.length; i++) {
      const [x, y] = spots[(spot + i * 5) % spots.length];
      if (game.recruit(kind, x, y)) {
        spot += 11;
        return true;
      }
    }
    return false;
  };
  for (const choice of [...game.rewards.choices]) {
    const kind = choice.id === 'skip' || choice.used ? null : REWARDS[choice.id].kind;
    if (kind) place(kind);
  }
  if (game.base < 70) game.repair();
  if (game.wave === 1 && salt % 2) game.trainHero(salt % 4 === 1 ? 'force' : 'guard');
  const affordable = (kind: Kind) =>
    game.gold - game.caprice.reserve - game.recruitCost(kind) >= keep;
  let buy = salt;
  for (let tries = 0; tries < 80; tries++) {
    const kind = order[buy++ % order.length];
    if (affordable(kind)) place(kind);
    else if (!order.some(affordable)) break;
  }
}

/** Plays one stage to its end and returns a line that sums it up. */
function playStage(game: Game, salt: number, hash: Hash): string {
  const snap = () => hash.update(JSON.stringify(game)).update(JSON.stringify(game.stage));
  let steps = 0;
  while (game.status !== 'won' && game.status !== 'lost' && steps < 30 * 60 * 20) {
    if (game.status === 'preparing') {
      // The thrifty players keep coins aside: they fall sooner, and a fallen voyage is traced too.
      prepare(game, salt, salt % 3 === 2 ? 400 : 0);
      snap();
      if (!game.startWave()) break;
    }
    game.step(1 / 30);
    steps++;
    if (steps % 90 === 30)
      game.offerFeast(Math.floor(steps / 90 + salt) % 3, salt % 2 ? 'lure' : 'sticky');
    if (steps % 400 === 200) game.encourage();
    if (steps % 45 === 0) snap();
  }
  snap();
  return `${game.status} w${game.wave} b${game.base} g${game.gold} k${game.kills} s${steps}`;
}

function travel(seed: number, salt: number): string {
  const hash = createHash('sha256');
  let state = startVoyage(seed)!;
  hash.update(JSON.stringify(voyagePlanOf(state)));
  const stages: string[] = [];
  while (voyagePhase(state) === 'stage') {
    const game = stageGame(state)!;
    stages.push(playStage(game, salt + state.won, hash));
    state = recordStage(state, game)!;
    if (voyagePhase(state) === 'bonus')
      state = chooseBonus(state, bonusOffer(state)[(salt + state.won) % 3])!;
    hash.update(JSON.stringify(state));
  }
  return `${encodeVoyage(seed)} ${state.status} ${state.won}/5 [${state.bag.join(' ')}] ${stages.join(' | ')} ${hash.digest('hex').slice(0, 24)}`;
}

function traces(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [seed, salt] of [
    [2026, 0],
    [31337, 1],
    [777, 3],
    [123456, 4],
    [1048575, 2],
    [0, 5],
  ])
    out[`graine ${seed}, joueur ${salt}`] = travel(seed, salt);
  return out;
}

test('les voyages de référence se rejouent à l’identique', () => {
  assert.deepEqual(traces(), expectedVoyageTraces);
});
