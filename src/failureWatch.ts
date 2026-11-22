/**
 * Phaser asks for its next frame only once the current one has returned. An exception anywhere
 * in a frame therefore stops the board for good: the page stays, its buttons answer, nothing
 * moves and nothing says why. This watches for it. After any error the board is given a few
 * frames; if it has not drawn one while it should be running, `stopped` is told, once.
 */

/** How many frames the board is given to draw again after an error. */
const FRAMES_OF_GRACE = 3;
/** A line of detail never grows beyond this: it is shown to a parent, not logged. */
const DETAIL_LIMIT = 200;

type Host = Pick<Window, 'addEventListener' | 'requestAnimationFrame'>;
type Board = { frame(): number; running(): boolean };

/** What went wrong in a few words, for the parents' note: never a stack. */
export function describeFailure(reason: unknown): string {
  const words =
    reason instanceof Error
      ? `${reason.name}: ${reason.message}`
      : typeof reason === 'string'
        ? reason
        : // Anything else has no words of its own: the plain name of an error stands for it.
          Error.name;
  return words.slice(0, DETAIL_LIMIT);
}

export function watchBoard(
  board: Board,
  stopped: (detail: string) => void,
  host: Host = window,
): void {
  let told = false;
  let checking = false;
  const check = (reason: unknown) => {
    if (told || checking) return;
    checking = true;
    // The frame that failed is already counted: a board that lives will pass this number.
    const before = board.frame();
    let left = FRAMES_OF_GRACE;
    const wait = () => {
      if (--left > 0) return void host.requestAnimationFrame(wait);
      checking = false;
      // A board put to sleep on purpose (the page is hidden) is not a board that failed.
      if (told || !board.running() || board.frame() !== before) return;
      told = true;
      stopped(describeFailure(reason));
    };
    host.requestAnimationFrame(wait);
  };
  host.addEventListener('error', (event) => {
    const failure = event as ErrorEvent;
    check(failure.error ?? failure.message);
  });
  host.addEventListener('unhandledrejection', (event) =>
    check((event as PromiseRejectionEvent).reason),
  );
}
