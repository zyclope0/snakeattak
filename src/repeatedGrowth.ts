/**
 * `1 + step` multiplied by itself `times` times. Not `**`: its last digit differs from one
 * JavaScript engine to the next (Node 22 and Node 24 already disagree from the third power),
 * so the same seed played a different game on two phones. A product of doubles is the same
 * number on every device.
 */
export function grown(step: number, times: number): number {
  let factor = 1;
  for (let time = 0; time < times; time++) factor *= 1 + step;
  return factor;
}
