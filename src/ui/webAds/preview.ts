import { getLanguage, onLanguageChange } from '../../i18n/language.ts';
import { webAdPreviewCopy } from '../../i18n/webAdPreview.ts';
import { planAdPlacement } from './layout.ts';
import type { AdPlacement } from './layout.ts';
import { adBlocked, adNodes, measureAd } from './measure.ts';
import type { AdNodes } from './measure.ts';
import './preview.css';

type Options = { onBoardMoved: () => void };
/** The mock's box: a label, and a creative that says its size. */
type PreviewBox = Record<
  'frame' | 'label' | 'creative' | 'title' | 'size' | 'inactive',
  HTMLElement
>;

/** A mock only: no ad service, identifiers, player data, storage, iframe or network API. */
export function bindWebAdPreview({ onBoardMoved }: Options): () => void {
  const nodes = adNodes();
  const { app } = nodes;
  const box = previewBox();
  let offset = 0;
  let pending = 0;
  let stopped = false;
  const originalOffset = app.style.getPropertyValue('--web-ad-preview-shift');
  const originalClass = app.classList.contains('web-ad-preview-shifted');
  const setOffset = (value: number) => {
    if (offset === value) return;
    offset = value;
    app.style.setProperty('--web-ad-preview-shift', `${value}px`);
    app.classList.toggle('web-ad-preview-shifted', value !== 0);
    onBoardMoved();
  };
  const render = () => {
    pending = 0;
    if (stopped) return;
    writeWords(box);
    const p = adBlocked(app) ? null : planAdPlacement(measureAd(nodes, offset));
    if (!p) {
      box.frame.hidden = true;
      setOffset(0);
      return;
    }
    setOffset(p.shiftX);
    placeBox(box, p);
  };
  const schedule = () => {
    if (!stopped && !pending) pending = requestAnimationFrame(render);
  };
  const stopWatching = watchPage(nodes, schedule);
  const stopListening = listenToWindow(schedule);
  schedule();
  return () => {
    stopped = true;
    cancelAnimationFrame(pending);
    stopWatching();
    stopListening();
    box.frame.remove();
    if (offset !== 0) onBoardMoved();
    if (originalOffset) app.style.setProperty('--web-ad-preview-shift', originalOffset);
    else app.style.removeProperty('--web-ad-preview-shift');
    app.classList.toggle('web-ad-preview-shifted', originalClass);
  };
}

/** Builds the mock's box, hidden, at the end of the page. */
function previewBox(): PreviewBox {
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
  return { frame, label, creative, title, size, inactive };
}

/** The mock's words, in the language of the page. */
function writeWords(box: PreviewBox) {
  const words = webAdPreviewCopy[getLanguage()];
  box.label.textContent = words.label;
  box.frame.setAttribute('aria-label', words.accessible);
  box.title.textContent = words.space;
  box.inactive.textContent = words.inactive;
}

/** Puts the box where the plan found room, at the creative's size, and shows it. */
function placeBox({ frame, creative, size }: PreviewBox, p: AdPlacement) {
  frame.style.left = `${p.frame.x}px`;
  frame.style.top = `${p.frame.y}px`;
  frame.style.width = `${p.frame.width}px`;
  frame.style.height = `${p.frame.height}px`;
  creative.style.width = `${p.creative.width}px`;
  creative.style.height = `${p.creative.height}px`;
  creative.style.fontSize = p.creative.height < 100 ? '11px' : '13px';
  size.textContent = `${p.creative.width} × ${p.creative.height}`;
  frame.hidden = false;
}

/**
 * Asks for a new placement when the game's parts change size, when the page changes class or
 * language, when the pause shows, and when a window opens or closes. Returns what stops it.
 */
function watchPage(nodes: AdNodes, schedule: () => void): () => void {
  const { app, board, battle, dock, hud } = nodes;
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
  return () => {
    resize.disconnect();
    state.disconnect();
    tree.disconnect();
    dialogState.disconnect();
  };
}

/**
 * Asks for a new placement when the window moves, turns, scrolls, hides, goes full screen,
 * changes pointer or language. Returns what stops it.
 */
function listenToWindow(schedule: () => void): () => void {
  const coarse = matchMedia('(pointer: coarse)');
  coarse.addEventListener('change', schedule);
  const unsubscribe = onLanguageChange(schedule);
  const events = ['resize', 'orientationchange', 'scroll'] as const;
  for (const event of events) window.addEventListener(event, schedule, { passive: true });
  document.addEventListener('visibilitychange', schedule);
  document.addEventListener('fullscreenchange', schedule);
  window.visualViewport?.addEventListener('resize', schedule);
  window.visualViewport?.addEventListener('scroll', schedule);
  return () => {
    unsubscribe();
    coarse.removeEventListener('change', schedule);
    for (const event of events) window.removeEventListener(event, schedule);
    document.removeEventListener('visibilitychange', schedule);
    document.removeEventListener('fullscreenchange', schedule);
    window.visualViewport?.removeEventListener('resize', schedule);
    window.visualViewport?.removeEventListener('scroll', schedule);
  };
}
