// What the Android application asks of the phone's WebView, read by capacitor.config.ts, by the
// build that writes the page below (vite.config.ts) and by the checks of the application.
// No import: the Capacitor command line reads this file on its own.

/**
 * The oldest WebView (its Chrome version) the game is written for. Below it, the layout breaks
 * without a word: Chrome 108 is the first to read `dvh`, the height of the screen the board is
 * laid out with (src/styles/01-base.css). The code itself runs from Chrome 93. Analysis of
 * 22 November 2026 (docs/analyse-2026-11-22/B-technique.md).
 */
export const MIN_WEBVIEW_VERSION = 108;

/**
 * The page Android shows instead of the game below that version: in the application only,
 * beside the game, with no script. Capacitor also shows it if the game's own page fails to
 * load, which a page read from the application itself should never do.
 */
export const OLD_WEBVIEW_PAGE = 'webview-trop-ancien.html';
