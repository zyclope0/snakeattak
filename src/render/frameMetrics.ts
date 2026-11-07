/** Small fixed window, allocated once; no telemetry or game state. */
export class FrameMetrics {
  private frameTimes: Float64Array;
  private updateTimes: Float64Array;
  private count = 0;
  private index = 0;
  constructor(capacity = 120) {
    if (!Number.isInteger(capacity) || capacity < 1) throw new RangeError('Invalid metrics window');
    this.frameTimes = new Float64Array(capacity);
    this.updateTimes = new Float64Array(capacity);
  }
  record(frameMs: number, updateMs: number) {
    if (
      !Number.isFinite(frameMs) ||
      frameMs <= 0 ||
      frameMs > 1000 ||
      !Number.isFinite(updateMs) ||
      updateMs < 0
    )
      return false;
    this.frameTimes[this.index] = frameMs;
    this.updateTimes[this.index] = updateMs;
    this.index = (this.index + 1) % this.frameTimes.length;
    this.count = Math.min(this.count + 1, this.frameTimes.length);
    return true;
  }
  snapshot() {
    const frames = Array.from(this.frameTimes.subarray(0, this.count)).sort((a, b) => a - b);
    const updates = Array.from(this.updateTimes.subarray(0, this.count)).sort((a, b) => a - b);
    const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / (values.length || 1);
    const p95 = (values: number[]) => values[Math.floor(values.length * 0.95)] ?? 0;
    return {
      frames: this.count,
      fps: this.count ? 1000 / mean(frames) : 0,
      frameP95Ms: p95(frames),
      updateP95Ms: p95(updates),
      updateMeanMs: mean(updates),
    };
  }
}
