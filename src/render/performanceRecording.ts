import * as TEXT from '../texts/fr/board.ts';
/** Local diagnostics only: complete windows >=1s, bounded to one active hour. */
export class PerformanceRecording {
  private windows: number[] = [];
  private elapsed = 0;
  private frames = 0;
  private activeMs = 0;
  private totalFrames = 0;
  private longest = 0;
  private truncated = false;
  private capacity: number;
  constructor(capacity = 3600) {
    this.capacity = capacity;
    if (!Number.isInteger(capacity) || capacity < 1) throw new RangeError(TEXT.invalidCapacity);
  }
  record(ms: number) {
    if (!Number.isFinite(ms) || ms <= 0) return false;
    this.elapsed += ms;
    this.activeMs += ms;
    this.longest = Math.max(this.longest, ms);
    this.frames++;
    this.totalFrames++;
    if (this.elapsed >= 1000) {
      this.windows.push((1000 * this.frames) / this.elapsed);
      if (this.windows.length > this.capacity) {
        this.windows.shift();
        this.truncated = true;
      }
      this.elapsed = this.frames = 0;
    }
    return true;
  }
  snapshot() {
    const sorted = [...this.windows].sort((a, b) => a - b);
    const n = sorted.length;
    return {
      activeMs: this.activeMs,
      frames: this.totalFrames,
      windows: n,
      fpsMedian: n ? (sorted[Math.floor((n - 1) / 2)] + sorted[Math.floor(n / 2)]) / 2 : null,
      fpsMin: n ? sorted[0] : null,
      longestFrameMs: this.longest || null,
      truncated: this.truncated,
      method: TEXT.fpsPerComplete1000msActiveWindow,
    };
  }
  reset() {
    this.windows = [];
    this.elapsed = this.frames = this.activeMs = this.totalFrames = this.longest = 0;
    this.truncated = false;
  }
}
export function performanceEnabled(search: string, development: boolean) {
  const params = new URLSearchParams(search);
  return params.get('perf') === '1' || (development && params.has('debug-performance'));
}
