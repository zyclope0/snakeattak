import { FrameMetrics } from './frameMetrics.ts';
import { PerformanceRecording } from './performanceRecording.ts';
import type { pauseForDialog } from '../ui/dialogs.ts';

/** Explicit local opt-in. No network or persistence. Reading owns a temporary UI pause. */
export class DevPerformance {
  private metrics = new FrameMetrics();
  private recording = new PerformanceRecording();
  private panel: HTMLDivElement;
  private output: HTMLOutputElement;
  private dialog: HTMLDialogElement;
  private report: HTMLTextAreaElement;
  private lastFrame = 0;
  private lastLabel = 0;
  private context: { mission: string; wave: number } = { mission: '', wave: 0 };
  private modal: ReturnType<typeof pauseForDialog>;
  private observedGame?: object;
  private startContext: { mission: string; wave: number } | null = null;
  constructor(
    private parent: HTMLElement,
    bindDialog: (dialog: HTMLDialogElement) => ReturnType<typeof pauseForDialog>,
    private readContext: () => { identity: object; mission: string; wave: number },
  ) {
    this.panel = document.createElement('div');
    this.panel.className = 'performance-panel';
    this.output = document.createElement('output');
    this.output.dataset.performance = 'local';
    this.output.setAttribute('aria-live', 'off');
    this.output.textContent = 'Mesure…';
    this.panel.append(this.output);
    const button = (label: string, action: () => void, container: HTMLElement) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.textContent = label;
      el.onclick = action;
      container.append(el);
      return el;
    };
    this.dialog = document.createElement('dialog');
    this.dialog.className = 'performance-dialog';
    this.modal = bindDialog(this.dialog);
    const title = document.createElement('h2');
    title.textContent = 'Relevé local de performance';
    this.report = document.createElement('textarea');
    this.report.readOnly = true;
    this.report.setAttribute('aria-label', 'Rapport à copier');
    this.dialog.append(title, this.report);
    button(
      'Sélectionner le relevé',
      () => {
        this.report.focus();
        this.report.select();
      },
      this.dialog,
    );
    button('Fermer', () => this.modal.close(), this.dialog);
    button(
      'Relevé',
      () => {
        this.report.value = JSON.stringify(this.snapshot(), null, 2);
        this.modal.open();
      },
      this.panel,
    );
    button(
      'Recommencer la mesure',
      () => {
        this.reset();
        this.report.value = JSON.stringify(this.snapshot(), null, 2);
      },
      this.dialog,
    );
    parent.append(this.panel);
    document.body.append(this.dialog);
  }
  suspend() {
    this.lastFrame = 0;
  }
  reset() {
    this.recording.reset();
    this.metrics = new FrameMetrics();
    this.lastFrame = this.lastLabel = 0;
    this.startContext = null;
  }
  private syncContext() {
    const current = this.readContext();
    if (this.observedGame !== current.identity) {
      this.reset();
      this.observedGame = current.identity;
    }
    this.context = { mission: current.mission, wave: current.wave };
  }
  snapshot() {
    this.syncContext();
    const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
    const loadMs = Number(this.parent.dataset.loadDurationMs);
    return {
      version: document.querySelector('[data-app-version]')?.textContent ?? null,
      capturedAt: new Date().toISOString(),
      context: this.context,
      recordingStart: this.startContext,
      ...this.recording.snapshot(),
      update: this.metrics.snapshot(),
      lastAssetLoadMs:
        Number.isFinite(loadMs) && this.parent.dataset.loadDurationMs ? loadMs : null,
      jsHeapBytes: memory && Number.isFinite(memory.usedJSHeapSize) ? memory.usedJSHeapSize : null,
      memoryScope:
        'JS heap if exposed by WebView; not total Android app memory. Null means unavailable.',
      userAgent: navigator.userAgent,
      deviceModel: null,
      androidVersion: null,
      physicalDeviceVerified: false,
    };
  }
  frame(now: number, updateMs: number, active = true) {
    this.syncContext();
    if (!active || document.hidden) this.lastFrame = 0;
    else {
      if (this.lastFrame) {
        this.metrics.record(now - this.lastFrame, updateMs);
        this.startContext ??= { ...this.context };
        this.recording.record(now - this.lastFrame);
      }
      this.lastFrame = now;
    }
    if (now - this.lastLabel < 500) return;
    const s = this.metrics.snapshot(),
      r = this.recording.snapshot();
    this.output.textContent = `${s.fps.toFixed(0)} FPS · méd. ${r.fpsMedian?.toFixed(0) ?? '—'} / min. ${r.fpsMin?.toFixed(0) ?? '—'} · Maj. ${s.updateP95Ms.toFixed(1)} ms p95`;
    this.output.dataset.activeMs = String(r.activeMs);
    this.lastLabel = now;
  }
  destroy() {
    this.panel.remove();
    this.modal.dispose();
    this.dialog.remove();
  }
}
