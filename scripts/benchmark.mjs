// Banc du moteur : un vrai camp mélangé (une soixantaine d'alliés de toutes les sortes, posés
// sur les places permises du camp) contre 20, 30 puis 40 serpents vivants tenus à ce nombre.
// Le rapport du conseil du 20 novembre 2026 (docs/passation/COUNCIL-INFINI-2026-11-20.md, § 7)
// a montré que l'ancien banc (120 ninjas) ne voyait pas le coût des chemins et du camp.
// Reproductible : même graine, même camp, même suite de pas ; l'empreinte finale de chaque
// scène permet de vérifier qu'une optimisation ne change aucun résultat.
//
// Usage : node scripts/benchmark.mjs [src=../src/] ; BENCH_TICKS=1800 (pas mesurés par scène)
import { performance } from 'node:perf_hooks';
import { createHash } from 'node:crypto';

const root = process.argv[2]
  ? new URL(process.argv[2].replace(/\/?$/, '/'), `file://${process.cwd()}/`).href
  : new URL('../src/', import.meta.url).href;
const { Game } = await import(root + 'game.ts');
const { kinds } = await import(root + 'data.ts');
const { CAMP_LEFT, CAMP_RIGHT, CAMP_TOP, CAMP_BOTTOM } = await import(root + 'boardLandmarks.ts');
const { ENDLESS_RULES } = await import(root + 'endless.ts');

const TICKS = Number(process.env.BENCH_TICKS ?? 1800);
const WARMUP = 900;
const CAMP_SIZE = 60;
/** Kings already beaten: the snakes of an endless round this far live long in the camp. */
const KINGS = Number(process.env.BENCH_KINGS ?? 3);
/** Every ally of the seventh revision but the hero, in catalogue order, cycled through. */
const MIX = Object.keys(kinds).filter((k) => k !== 'hero');

function camp() {
  const rules = ENDLESS_RULES[1];
  const game = new Game(1234, undefined, undefined, rules.balance, undefined, rules);
  game.kings = KINGS;
  game.gold = 1_000_000;
  // Wave 10 is faced: every ally is open.
  game.wave = 9;
  let n = 0;
  for (let y = CAMP_TOP + 12; y <= CAMP_BOTTOM && game.units.length < CAMP_SIZE + 3; y += 30)
    for (let x = CAMP_LEFT + 12; x <= CAMP_RIGHT && game.units.length < CAMP_SIZE + 3; x += 30)
      if (game.recruit(MIX[n % MIX.length], x, y)) n++;
  game.startWave();
  game.remaining = 100_000;
  // The crystal never falls: the scene measures a crowded fight, not a defeat.
  game.base = 1e9;
  return game;
}

function scene(live) {
  const game = camp();
  const units = game.units.length;
  const samples = [];
  let snakes = 0;
  for (let i = 0; i < WARMUP + TICKS; i++) {
    // Holds the number of live snakes: a new one enters as soon as one falls.
    game.spawnTimer = game.enemies.length < live ? 0 : 1;
    // And the camp stays whole: a bitten ally is healed back, so the camp keeps its size.
    for (const u of game.units) u.hp = u.maxHp;
    const start = performance.now();
    game.step(1 / 30);
    const ms = performance.now() - start;
    if (i >= WARMUP) {
      samples.push(ms);
      snakes += game.enemies.length;
    }
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const at = (q) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
  return {
    live,
    units,
    allies: game.units.length,
    meanSnakes: +(snakes / TICKS).toFixed(1),
    p50Ms: +at(0.5).toFixed(3),
    p95Ms: +at(0.95).toFixed(3),
    maxMs: +sorted.at(-1).toFixed(3),
    meanMs: +(samples.reduce((a, b) => a + b, 0) / samples.length).toFixed(3),
    kills: game.kills,
    fingerprint: createHash('sha256').update(JSON.stringify(game)).digest('hex').slice(0, 16),
  };
}

const results = [20, 30, 40].map(scene);
console.log(JSON.stringify({ scenario: 'camp mélangé contre serpents vivants', results }, null, 2));
