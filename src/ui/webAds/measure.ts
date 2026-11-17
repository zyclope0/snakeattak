import type { AdMeasurement, AdRect } from './layout.ts';

/** The parts of the page an ad box stays clear of. */
export type AdNodes = Record<'app' | 'board' | 'battle' | 'dock' | 'hud', HTMLElement>;
export function adNodes(): AdNodes {
  return {
    app: document.getElementById('app')!,
    board: document.getElementById('game')!,
    battle: document.querySelector<HTMLElement>('.battle')!,
    dock: document.querySelector<HTMLElement>('.battle-dock')!,
    hud: document.querySelector<HTMLElement>('.dashboard')!,
  };
}
const rect = (node: HTMLElement, undo = 0): AdRect => {
  const r = node.getBoundingClientRect();
  return { x: r.x - undo, y: r.y, width: r.width, height: r.height };
};
/** The page as the layout rule reads it; `offset` is how far the game is already moved. */
export function measureAd(nodes: AdNodes, offset: number): AdMeasurement {
  return {
    width: innerWidth,
    height: innerHeight,
    app: rect(nodes.app, offset),
    board: rect(nodes.board, offset),
    battle: rect(nodes.battle, offset),
    dock: rect(nodes.dock, offset),
    hud: rect(nodes.hud, offset),
  };
}
/** No ad box now: another screen, a window over the game, a touch screen, a zoom, a scroll. */
export function adBlocked(app: HTMLElement): boolean {
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
    (!!viewport &&
      (Math.abs(viewport.scale - 1) > 0.01 ||
        Math.abs(viewport.offsetLeft) > 1 ||
        Math.abs(viewport.offsetTop) > 1))
  );
}
