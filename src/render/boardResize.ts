import type Phaser from 'phaser';

/** CSS owns the board's size, including when a menu or drawer changes its parent. */
export function bindBoardResize(game: Phaser.Game, parent: HTMLElement) {
  let frame = 0;
  let active = true;
  const invalidate = () => {
    if (!active) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (parent.clientWidth <= 0 || parent.clientHeight <= 0) return;
      game.scale.getParentBounds();
      game.scale.refresh();
      game.scale.updateBounds();
    });
  };
  const observer = new ResizeObserver(([entry]) => {
    if (entry.contentRect.width > 0 && entry.contentRect.height > 0) invalidate();
  });
  observer.observe(parent);
  game.events.once('destroy', () => {
    active = false;
    observer.disconnect();
    cancelAnimationFrame(frame);
  });
  return invalidate;
}
