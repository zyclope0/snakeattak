/** Geometry for the local Web ad study. No browser, renderer, storage or game rules. */
export type AdRect = { x: number; y: number; width: number; height: number };
export type AdMeasurement = {
  width: number;
  height: number;
  app: AdRect;
  board: AdRect;
  battle: AdRect;
  dock: AdRect;
  hud: AdRect;
};
export type AdPlacement = { frame: AdRect; creative: AdRect; shiftX: number };
const BUFFER = 150;
const EDGE = 20;
const FORMATS = [
  [200, 200],
  [180, 150],
  [234, 60],
] as const;
const right = (r: AdRect) => r.x + r.width;
const bottom = (r: AdRect) => r.y + r.height;
const moved = (r: AdRect, x: number): AdRect => ({ ...r, x: r.x + x });

export function rectGap(a: AdRect, b: AdRect): number {
  return Math.hypot(
    Math.max(a.x - right(b), b.x - right(a), 0),
    Math.max(a.y - bottom(b), b.y - bottom(a), 0),
  );
}
const frameFor = (creative: AdRect): AdRect => ({
  x: creative.x - 12,
  y: creative.y - 38,
  width: creative.width + 24,
  height: creative.height + 50,
});

export function planAdPlacement(m: AdMeasurement): AdPlacement | null {
  if (!Number.isFinite(m.width) || !Number.isFinite(m.height) || m.width < 1920 || m.height <= 0)
    return null;
  const protectedRects = [m.board, m.battle, m.dock, m.hud];
  for (const r of [m.app, ...protectedRects]) {
    if (
      !Object.values(r).every(Number.isFinite) ||
      r.width <= 0 ||
      r.height <= 0 ||
      r.x < 0 ||
      r.y < 0 ||
      right(r) > m.width + 1 ||
      bottom(r) > m.height + 1
    )
      return null;
  }
  const safe = (p: AdPlacement): boolean =>
    p.frame.x >= EDGE &&
    p.frame.y >= EDGE &&
    right(p.frame) <= m.width - EDGE &&
    bottom(p.frame) <= m.height - EDGE &&
    m.app.x + p.shiftX >= Math.min(12, m.app.x) &&
    protectedRects.every((r) => rectGap(moved(r, p.shiftX), p.creative) >= BUFFER - 0.01);

  for (const [width, height] of FORMATS) {
    const creative = { x: right(m.app) + BUFFER, y: m.board.y, width, height };
    const p = { creative, frame: frameFor(creative), shiftX: 0 };
    if (safe(p)) return p;
  }
  for (const [width, height] of FORMATS) {
    const initial = { x: right(m.battle) + BUFFER, y: bottom(m.dock) + BUFFER, width, height };
    const shiftX = -Math.max(0, right(frameFor(initial)) - (m.width - EDGE));
    const creative = moved(initial, shiftX);
    const p = { creative, frame: frameFor(creative), shiftX };
    if (safe(p)) return p;
  }
  return null;
}
