import { getLanguage, onLanguageChange } from '../../i18n/language.ts';
import { webAdPreviewCopy } from '../../i18n/webAdPreview.ts';
import { planAdPlacement, type AdRect } from './layout.ts';
import './preview.css';

type Options = { onBoardMoved: () => void };
/** A mock only: no ad service, identifiers, player data, storage, iframe or network API. */
export function bindWebAdPreview({ onBoardMoved }: Options): () => void {
  const app = document.getElementById('app')!;
  const board = document.getElementById('game')!;
  const battle = document.querySelector<HTMLElement>('.battle')!;
  const dock = document.querySelector<HTMLElement>('.battle-dock')!;
  const hud = document.querySelector<HTMLElement>('.dashboard')!;
  const frame = document.createElement('aside');
  frame.id = 'web-ad-preview';
  frame.hidden = true;
  frame.dataset.copyRaw = '';
  frame.setAttribute('role', 'note');
  const label = document.createElement('div');
  label.className = 'web-ad-preview-label';
  const creative = document.createElement('div');
  creative.id = 'web-ad-preview-creative';
  const title = document.createElement('span');
  const size = document.createElement('span');
  const inactive = document.createElement('span');
  creative.append(title, size, inactive);
  frame.append(label, creative);
  document.body.append(frame);
  let offset = 0;
  let pending = 0;
  let stopped = false;
  const originalOffset = app.style.getPropertyValue('--web-ad-preview-shift');
  const originalClass = app.classList.contains('web-ad-preview-shifted');
  const rect = (node: HTMLElement, undo = 0): AdRect => {
    const r = node.getBoundingClientRect();
    return { x: r.x - undo, y: r.y, width: r.width, height: r.height };
  };
  const setOffset = (value: number) => {
    if (offset === value) return;
    offset = value;
    app.style.setProperty('--web-ad-preview-shift', `${value}px`);
    app.classList.toggle('web-ad-preview-shifted', value !== 0);
    onBoardMoved();
  };
  const blocked = () => {
    const viewport = window.visualViewport;
    return (
      app.hidden ||
      !document.getElementById('pause-overlay')?.hidden ||
      document.hidden ||
      !!document.fullscreenElement ||
      !!document.querySelector('dialog[open], .game-expanded') ||
      app.classList.contains('showing-result') ||
      matchMedia('(pointer: coarse)').matches ||
      !!window.scrollX ||
      !!window.scrollY ||
      document.documentElement.scrollHeight > innerHeight + 1 ||
      (viewport &&
        (Math.abs(viewport.scale - 1) > 0.01 ||
          Math.abs(viewport.offsetLeft) > 1 ||
          Math.abs(viewport.offsetTop) > 1))
    );
  };
  const render = () => {
    pending = 0;
    if (stopped) return;
    const words = webAdPreviewCopy[getLanguage()];
    label.textContent = words.label;
    frame.setAttribute('aria-label', words.accessible);
    title.textContent = words.space;
    inactive.textContent = words.inactive;
    const p = blocked()
      ? null
      : planAdPlacement({
          width: innerWidth,
          height: innerHeight,
          app: rect(app, offset),
          board: rect(board, offset),
          battle: rect(battle, offset),
          dock: rect(dock, offset),
          hud: rect(hud, offset),
        });
    if (!p) {
      frame.hidden = true;
      setOffset(0);
      return;
    }
    setOffset(p.shiftX);
    frame.style.left = `${p.frame.x}px`;
    frame.style.top = `${p.frame.y}px`;
    frame.style.width = `${p.frame.width}px`;
    frame.style.height = `${p.frame.height}px`;
    creative.style.width = `${p.creative.width}px`;
    creative.style.height = `${p.creative.height}px`;
    creative.style.fontSize = p.creative.height < 100 ? '11px' : '13px';
    size.textContent = `${p.creative.width} × ${p.creative.height}`;
    frame.hidden = false;
  };
  const schedule = () => {
    if (!stopped && !pending) pending = requestAnimationFrame(render);
  };
  const resize = new ResizeObserver(schedule);
  for (const node of [app, board, battle, dock, hud]) resize.observe(node);
  const state = new MutationObserver(schedule);
  state.observe(app, { attributes: true, attributeFilter: ['hidden', 'class'] });
  state.observe(document.getElementById('pause-overlay')!, {
    attributes: true,
    attributeFilter: ['hidden'],
  });
  state.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  state.observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'class'] });
  const dialogState = new MutationObserver(schedule);
  const bindDialogs = () => {
    dialogState.disconnect();
    for (const dialog of Array.from(document.querySelectorAll('dialog'))) {
      dialogState.observe(dialog, { attributes: true, attributeFilter: ['open'] });
    }
  };
  bindDialogs();
  const tree = new MutationObserver((records) => {
    if (
      records.some((r) =>
        [...Array.from(r.addedNodes), ...Array.from(r.removedNodes)].some(
          (n) => n instanceof Element && (n.matches('dialog') || !!n.querySelector('dialog')),
        ),
      )
    ) {
      bindDialogs();
      schedule();
    }
  });
  tree.observe(document.body, { childList: true, subtree: true });
  const coarse = matchMedia('(pointer: coarse)');
  coarse.addEventListener('change', schedule);
  const unsubscribe = onLanguageChange(schedule);
  const events = ['resize', 'orientationchange', 'scroll'] as const;
  for (const event of events) window.addEventListener(event, schedule, { passive: true });
  document.addEventListener('visibilitychange', schedule);
  document.addEventListener('fullscreenchange', schedule);
  window.visualViewport?.addEventListener('resize', schedule);
  window.visualViewport?.addEventListener('scroll', schedule);
  schedule();
  return () => {
    stopped = true;
    cancelAnimationFrame(pending);
    resize.disconnect();
    state.disconnect();
    tree.disconnect();
    dialogState.disconnect();
    unsubscribe();
    coarse.removeEventListener('change', schedule);
    for (const event of events) window.removeEventListener(event, schedule);
    document.removeEventListener('visibilitychange', schedule);
    document.removeEventListener('fullscreenchange', schedule);
    window.visualViewport?.removeEventListener('resize', schedule);
    window.visualViewport?.removeEventListener('scroll', schedule);
    frame.remove();
    if (offset !== 0) onBoardMoved();
    if (originalOffset) app.style.setProperty('--web-ad-preview-shift', originalOffset);
    else app.style.removeProperty('--web-ad-preview-shift');
    app.classList.toggle('web-ad-preview-shifted', originalClass);
  };
}
