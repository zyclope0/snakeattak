import { FrameMetrics } from './frameMetrics.ts';

/** Included only by the DEV branch; URL opt-in keeps normal development uncluttered. */
export class DevPerformance {
  private metrics = new FrameMetrics();
  private output: HTMLOutputElement;
  private lastFrame = 0;
  private lastLabel = 0;
  constructor(parent: HTMLElement) {
    this.output = document.createElement('output');
    this.output.dataset.performance = 'dev';
    this.output.setAttribute('aria-live', 'off');
    this.output.style.cssText =
      'position:absolute;right:8px;top:8px;z-index:10;pointer-events:none;background:#17382bee;color:#f1e7c8;padding:5px 8px;font:12px monospace;border-radius:4px';
    this.output.textContent = 'Mesure…';
    parent.append(this.output);
  }
  frame(now: number, updateMs: number) {
    if (this.lastFrame) this.metrics.record(now - this.lastFrame, updateMs);
    this.lastFrame = now;
    if (now - this.lastLabel < 500) return;
    const s = this.metrics.snapshot();
    this.output.textContent = `${s.fps.toFixed(0)} FPS · Maj. jeu ${s.updateP95Ms.toFixed(1)} ms p95`;
    this.lastLabel = now;
  }
  destroy() {
    this.output.remove();
  }
}
