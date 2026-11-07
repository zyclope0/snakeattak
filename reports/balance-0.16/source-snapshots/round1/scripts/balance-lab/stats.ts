import { random } from './profiles.ts';
export const mean = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
export function quantile(values: number[], q: number) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) * q)];
}
export function wilson(wins: number, count: number) {
  if (!count) return { low: 0, high: 1 };
  const z = 1.959963984540054;
  const p = wins / count,
    denominator = 1 + (z * z) / count;
  const center = (p + (z * z) / (2 * count)) / denominator;
  const radius =
    (z * Math.sqrt((p * (1 - p)) / count + (z * z) / (4 * count * count))) / denominator;
  return { low: Math.max(0, center - radius), high: Math.min(1, center + radius) };
}
export function pairedBootstrap(pairs: { seed: number; difference: number }[], iterations = 2000) {
  const clusters = new Map<number, number[]>();
  for (const pair of pairs)
    clusters.set(pair.seed, [...(clusters.get(pair.seed) ?? []), pair.difference]);
  const values = [...clusters.values()].map((v) => mean(v)!);
  if (!values.length) return { difference: null, low: null, high: null, seeds: 0 };
  const rng = random(0xb0165eed),
    draws: number[] = [];
  for (let i = 0; i < iterations; i++) {
    let sum = 0;
    for (let j = 0; j < values.length; j++) sum += values[Math.floor(rng() * values.length)];
    draws.push(sum / values.length);
  }
  return {
    difference: mean(values),
    low: quantile(draws, 0.025),
    high: quantile(draws, 0.975),
    seeds: values.length,
  };
}
