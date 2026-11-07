/** Sticky parents and scrollIntoView move the canvas without a window resize. */
export function bindInputBounds(canvas: HTMLCanvasElement, update: () => void): () => void {
  const events = ['mousedown', 'mousemove', 'touchstart', 'touchmove'] as const;
  // Capture precedes Phaser's input listeners; bounds must be current for this very tap.
  for (const event of events)
    canvas.addEventListener(event, update, { capture: true, passive: true });
  window.addEventListener('scroll', update, { capture: true, passive: true });
  return () => {
    for (const event of events) canvas.removeEventListener(event, update, true);
    window.removeEventListener('scroll', update, true);
  };
}
