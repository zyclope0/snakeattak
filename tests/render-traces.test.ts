import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Game } from '../src/game.ts';
import type { Entity } from '../src/game.ts';
import { kinds } from '../src/data.ts';
import type { Kind } from '../src/data.ts';
import { createMissionRun } from '../src/missions.ts';
import { Presentation } from '../src/render/presentation.ts';
import { characterMotion } from '../src/render/characterMotion.ts';
import type { CharacterAction, Gait } from '../src/render/characterMotion.ts';

// Ce que le rendu calcule sans Phaser, rejoué sur des parties entières à graine fixe : mots
// flottants, annonces, poses, poussière, éclairs. Les empreintes ont été relevées avant le
// découpage de `Presentation.update` et de `characterMotion` ; découper ou déplacer ce code ne
// doit en changer aucune. Une empreinte qui change est une image qui change.
const order = (Object.keys(kinds) as Kind[]).filter((kind) => kind !== 'hero');
const spots: [number, number][] = [];
for (let x = 624; x <= 972; x += 36) for (let y = 120; y <= 528; y += 36) spots.push([x, y]);

function observed(p: Presentation): string {
  return JSON.stringify([
    p.clock,
    p.encounter,
    p.notice,
    p.floats,
    p.bursts,
    p.arrivals,
    [...p.actions],
    p.fortDamage,
    p.fortRepair,
    [...p.reactions],
    p.sparks,
    [...p.flashes],
    [...p.placed],
    [...p.gaits],
    Number.isFinite(p.victoryAge) ? p.victoryAge : 'jamais',
  ]);
}

/** Un joueur automatique fixe ; la présentation regarde chaque pas, avec des images inégales. */
function watch(game: Game, salt: number, limit: number): string {
  const p = new Presentation(),
    hash = createHash('sha256');
  let steps = 0,
    buy = salt,
    spot = salt * 7,
    updates = 0;
  const observe = (deltaMs: number) => {
    p.update(game, deltaMs);
    hash.update(observed(p));
    updates++;
  };
  while (game.status !== 'won' && game.status !== 'lost' && steps < limit) {
    if (game.status === 'preparing') {
      if (game.rewards.pending !== null) game.chooseReward(game.rewardOffer[salt % 3]);
      if (game.base < 70) game.repair();
      for (let tries = 0, bought = 0; tries < order.length * 2 && bought < 3; tries++) {
        const kind = order[buy++ % order.length];
        for (let i = 0; i < spots.length; i++) {
          const [x, y] = spots[(spot + i * 5) % spots.length];
          if (!game.recruit(kind, x, y)) continue;
          bought++;
          spot += 11;
          break;
        }
      }
      observe(1000 / 30);
      if (!game.startWave()) break;
    }
    game.step(1 / 30);
    steps++;
    if (steps % 90 === 30)
      game.offerFeast(((steps / 90 + salt) % 3) | 0, salt % 2 ? 'lure' : 'sticky');
    if (steps % 700 === 350) for (const u of game.units) if (u.id % 3 === 0) u.confusedFor = 3;
    if (steps % 611 === 600) {
      // Pause : l'horloge visuelle se fige.
      game.paused = true;
      observe(1000 / 30);
      game.paused = false;
    }
    // Image lente, delta nul, horloge cassée, puis le rythme normal.
    observe(steps % 97 === 0 ? 150 : steps % 53 === 0 ? 0 : steps % 389 === 0 ? NaN : 1000 / 30);
  }
  for (let i = 0; i < 120; i++) observe(1000 / 60);
  return `${game.status} v${game.wave} ${updates} ${hash.digest('hex').slice(0, 24)}`;
}

/** Le camp à la veille de la dernière vague : le roi, ses protections, ses œufs. */
function beforeTheKing(): Game {
  const game = new Game(31);
  game.wave = 11;
  game.gold = 20000;
  game.normalizeCamp();
  return game;
}

test('la présentation de parties entières garde ses empreintes', () => {
  assert.deepEqual(
    {
      classique: watch(new Game(2026), 3, 6000),
      royale: watch(beforeTheKing(), 2, 6000),
      coquilles: watch(
        new Game(1, undefined, createMissionRun('coquilles', 4646, null, 2)),
        4,
        6000,
      ),
    },
    {
      classique: 'fighting v8 6137 f957627ae0a72b116b010197',
      royale: 'lost v12 1295 49c86f11bbdb8f8dd1ea9f56',
      coquilles: 'won v3 3108 c0a63308ff0c9725e751e303',
    },
  );
});

test('les poses de chaque combattant gardent leur empreinte', () => {
  const hash = createHash('sha256');
  let seed = 20261113,
    poses = 0;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const blows = ['hit', 'arrow', 'fire', 'shell', 'block'] as const;
  for (const kind of [...(Object.keys(kinds) as Kind[]), 'snake'] as const)
    for (const boss of [false, true])
      for (const state of ['idle', 'move', 'attack'] as const)
        for (const facing of [1, -1])
          for (const flying of [false, true])
            for (let i = 0; i < 24; i++) {
              const unit = { id: Math.floor(random() * 500), kind, boss, state, facing } as Entity;
              const action: CharacterAction | undefined =
                random() < 0.3
                  ? undefined
                  : {
                      age: random() * 0.6,
                      kind: blows[Math.floor(random() * blows.length)],
                      facing: ([1, -1, undefined] as const)[Math.floor(random() * 3)],
                    };
              const gait: Gait | undefined =
                random() < 0.25
                  ? undefined
                  : { travel: random() * 400, rest: random() < 0.5 ? 0 : random() * 0.2 };
              const clock = random() * 100;
              hash.update(
                JSON.stringify(characterMotion(unit, clock, action, false, gait, flying)),
              );
              hash.update(JSON.stringify(characterMotion(unit, clock, action, true, gait, flying)));
              poses += 2;
            }
  assert.equal(`${poses} ${hash.digest('hex').slice(0, 24)}`, '25344 5a5119a78c3ec2d864c4d68e');
});
