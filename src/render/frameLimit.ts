/**
 * The board is drawn at most about 60 times a second (the parent's decision, 24 November
 * 2026): the battle is computed 30 times a second, and a phone with a 120 Hz screen drew it
 * 120 times (measured on the S24: 120 images a second, for nothing but battery).
 *
 * Phaser's own limit drops a frame that comes a little early, so a plain `limit: 60` would fall
 * to 30 on an ordinary 60 Hz screen. Instead the screen's pace is measured once, and only a
 * screen at least twice as fast as the target draws one frame in two (three, four…): 120 Hz →
 * 60, 144 Hz → 72, 165 Hz → 82, 240 Hz → 60. A 60 or 90 Hz screen draws every frame, as before.
 */
export const FRAME_RATE_TARGET = 60;

/** A measured 120 Hz screen may read 119.9 Hz: the stride is not lost for so little. */
const STRIDE_TOLERANCE = 0.1;

/** Frames the screen shows for each one drawn: 1 below twice the target. */
export function frameStride(intervalMs: number, target = FRAME_RATE_TARGET): number {
  if (!(intervalMs > 0)) return 1;
  return Math.max(1, Math.floor(1000 / intervalMs / target + STRIDE_TOLERANCE));
}

/**
 * The time Phaser waits between two drawn frames: a little less than the stride's frames, so
 * that a frame a little early is not dropped. 0 draws every frame.
 */
export function limitRate(intervalMs: number, target = FRAME_RATE_TARGET): number {
  const stride = frameStride(intervalMs, target);
  return stride > 1 ? (stride - 0.5) * intervalMs : 0;
}

/** Phaser's loop, by the field its frame limit reads (Phaser 3.90, `TimeStep`). */
type LimitedLoop = { _limitRate: number };
const SAMPLED_FRAMES = 30;

/**
 * Measures the screen's pace on the first frames, then sets the loop's limit. Until then every
 * frame is drawn. The loop must have been created with a limit (`fps.limit`), so that Phaser
 * steps through its limited path.
 */
export function limitFrames(loop: unknown, frame = requestAnimationFrame): void {
  const limited = loop as LimitedLoop;
  limited._limitRate = 0;
  const times: number[] = [];
  const sample = (time: number) => {
    times.push(time);
    if (times.length <= SAMPLED_FRAMES) return void frame(sample);
    const gaps = times.slice(1).map((at, i) => at - times[i]);
    gaps.sort((a, b) => a - b);
    limited._limitRate = limitRate(gaps[Math.floor(gaps.length / 2)]);
  };
  frame(sample);
}
