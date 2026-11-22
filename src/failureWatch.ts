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
  /** The latest error still waited on: its reason, the frame it was seen at, the frames left. */
  let pending: { reason: unknown; before: number; left: number } | null = null;
  const wait = () => {
    if (!pending) return;
    if (--pending.left > 0) return void host.requestAnimationFrame(wait);
    const { reason, before } = pending;
    pending = null;
    // A board put to sleep on purpose (the page is hidden) is not a board that failed.
    if (told || !board.running() || board.frame() !== before) return;
    told = true;
    stopped(describeFailure(reason));
  };
  const check = (reason: unknown) => {
    if (told) return;
    const waiting = pending !== null;
    // The frame that failed is already counted: a board that lives will pass this number. An
    // error that comes while another is waited on takes its place and starts the wait again:
    // the first may have been survived, and this one may be the one that stops the board.
    pending = { reason, before: board.frame(), left: FRAMES_OF_GRACE };
    if (!waiting) host.requestAnimationFrame(wait);
  };
  host.addEventListener('error', (event) => {
    const failure = event as ErrorEvent;
    check(failure.error ?? failure.message);
  });
  host.addEventListener('unhandledrejection', (event) =>
    check((event as PromiseRejectionEvent).reason),
  );
}
