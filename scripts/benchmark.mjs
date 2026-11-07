import { performance } from 'node:perf_hooks';
import { Game } from '../src/game.ts';
// A deliberately crowded six-wave battle, reproducible across changes.
const game = new Game(1234);
game.gold = 100000;
for (let x = 612; x <= 972; x += 48) {
  for (let y = 132; y <= 516; y += 48) game.recruit('ninja', x, y);
}
game.wave = 5;
game.startWave();
game.remaining = 120;
const samples = [];
const units = game.units.length;
for (let i = 0; i < 3600; i++) {
  const start = performance.now();
  game.step(1 / 30);
  samples.push(performance.now() - start);
}
samples.sort((a, b) => a - b);
console.log(
  JSON.stringify(
    {
      scenario: '120 snakes, crowded army',
      units,
      ticks: samples.length,
      meanMs: samples.reduce((a, b) => a + b) / samples.length,
      p95Ms: samples[Math.floor(samples.length * 0.95)],
      maxMs: samples.at(-1),
      status: game.status,
    },
    null,
    2,
  ),
);
