/**
 * Phaser asks for its next frame only once the current one has returned. An exception anywhere
 * in a frame therefore stops the board for good: the page stays, its buttons answer, nothing
 * moves and nothing says why. This watches for it. After any error the board is given a few
 * frames; if it has not drawn one while it should be running, `stopped` is told, once, with
 * the first errors met since the board last drew: the one that stopped it is among them.
 */

/** How many frames the board is given to draw again after an error. */
const FRAMES_OF_GRACE = 3;
/** One error never takes more than this of the parents' note: it is shown, not logged. */
const DETAIL_LIMIT = 200;
/** How many different errors met on the same frame the note keeps, in the order they came. */
const ERRORS_KEPT = 3;

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
  stopped: (detail: string) => unknown,
  host: Host = window,
): void {
  let told = false;
  /**
   * The errors still waited on: their words, the number of frames drawn when the first came,
   * the frames left to wait.
   */
  let pending: { words: string[]; before: number; left: number } | null = null;
  const wait = () => {
    if (!pending) return;
    if (--pending.left > 0) return void host.requestAnimationFrame(wait);
    const { words, before } = pending;
    pending = null;
    // A board put to sleep on purpose (the page is hidden) is not a board that failed.
    if (told || !board.running() || board.frame() !== before) return;
    told = true;
    // Telling may fail later (the window's files did not come): then nothing was told, and
    // the next error is allowed to try again.
    const done = stopped(words.join(' · '));
    if (done instanceof Promise) done.catch(() => (told = false));
  };
  const check = (reason: unknown) => {
    if (told) return;
    const words = describeFailure(reason);
    // Phaser counts a frame once it is done: a frame that throws leaves the count where it
    // was. So the error that stopped the board carries the same count as one that came just
    // before it and was survived, and as every one that comes after: none of them can be told
    // apart from here. While the count has not moved they are kept together, the first ones
    // only, and the wait is not started again: errors that keep coming must neither put the
    // window off for ever, nor push out of the parents' line the one that stopped the board.
    if (pending && board.frame() === pending.before) {
      if (pending.words.length < ERRORS_KEPT && !pending.words.includes(words))
        pending.words.push(words);
      return;
    }
    const waiting = pending !== null;
    // The board has drawn since the errors waited on: they were survived. This one starts
    // over, from the count as it is now; a board that lives will pass it.
    pending = { words: [words], before: board.frame(), left: FRAMES_OF_GRACE };
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
