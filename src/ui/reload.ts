/**
 * The one way the game reloads its own page (a change of player, an imported family file,
 * « Relancer le jeu »). What must be put back before the page goes is done first, from a page
 * that still lives: the Android application gives its « retour » button back to Android
 * (src/ui/backButton.ts). A message sent while the page is already leaving may be dropped by
 * the WebView (read in Chromium's code by an independent attack, 24 November 2026), and a
 * game that then failed to start would leave « retour » taken with nobody listening.
 */

/** The longest the reload waits for what comes before it: it is never held for long. */
const RELOAD_WAIT_MS = 300;

let before: (() => Promise<unknown>) | undefined;

/** What to do before the page is reloaded; the last one said replaces the others. */
export const beforeReload = (task: () => Promise<unknown>): void => {
  before = task;
};

/**
 * Reloads the page: at once when nothing is to be done first (the website), else once it is
 * done, or after a short wait at most.
 */
export function reloadPage(page: Pick<Location, 'reload'> = window.location): void {
  if (!before) return page.reload();
  const go = () => page.reload();
  // What could not be put back is not a reason to keep a page that must be rebuilt.
  void Promise.race([before(), new Promise((done) => setTimeout(done, RELOAD_WAIT_MS))]).then(
    go,
    go,
  );
}
