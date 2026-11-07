import type Phaser from 'phaser';

/** CSS owns the board's size, including when a menu or drawer changes its parent. */
export function bindBoardResize(game: Phaser.Game, parent: HTMLElement) {
  let frame = 0;
  const observer = new ResizeObserver(([entry]) => {
    if (entry.contentRect.width <= 0 || entry.contentRect.height <= 0) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      game.scale.getParentBounds();
      game.scale.refresh();
    });
  });
  observer.observe(parent);
  game.events.once('destroy', () => {
    observer.disconnect();
    cancelAnimationFrame(frame);
  });
}
