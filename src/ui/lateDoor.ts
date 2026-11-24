/**
 * A part of the page bound by a file of its own, asked for at once, as the game starts: by the
 * first tap it is there, and binds its button itself. A tap that comes before waits for the
 * file, then is passed on to the button once, however many taps there were. When the file
 * does not arrive (a web page that lost its network), nothing opens, the game stays as it is,
 * and the next tap asks again.
 */
export function lateDoor(button: HTMLElement, fetch: () => Promise<unknown>) {
  let loading: Promise<unknown> | undefined;
  let waiting = false;
  const load = () =>
    (loading ??= fetch().catch((error: unknown) => {
      loading = undefined;
      throw error;
    }));
  const early = () => {
    if (waiting) return;
    waiting = true;
    load().then(
      () => {
        waiting = false;
        // The file bound the button: the tap goes to what it does now.
        if (button.onclick !== early) button.click();
      },
      () => (waiting = false),
    );
  };
  button.onclick = early;
  void load().catch(() => undefined);
}
