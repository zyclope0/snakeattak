import { battleOver, type Game } from '../game.ts';

/**
 * Android's « retour » button, in the application only (src/main.ts starts this there, once the
 * game has started). Left to Android, it closed the application from any screen: a child who
 * wanted to close a window left the game instead. Here it does what the nearest button on the
 * screen would do, the first that applies:
 *
 *  1. a window is open: it is asked to close, as the Escape key asks. A window may answer by
 *     doing something else (the mission window goes back to its summary). One that says no
 *     and does nothing (« Qui joue ? » when the game opens, a failure that stays) keeps its
 *     place, and the application goes to the background: no window holds a child inside;
 *  2. a battle is on the board: its pause button (a second press plays on);
 *  3. a game won or lost is on the board: its way back home;
 *  4. a page of the home: back to the home's first screen;
 *  5. the home's first screen: the application goes to the background, nothing is closed.
 *
 * Only buttons the child could press are pressed: nothing here is a new way through the game.
 * Until this is bound, « retour » stays Android's own (`disableBackButtonHandler` in
 * capacitor.config.ts): a game that did not start, or the page that says the WebView is too
 * old, can still be left. A page that goes (the game reloads it after a change of player, an
 * import, « Relancer le jeu ») gives « retour » back to Android: Capacitor drops the listeners
 * of a page that leaves but would keep swallowing the button (read in its code, independent
 * attack of 24 November 2026), and the next page takes it again only once its game has started.
 */

/** What is on screen when « retour » is pressed. */
export type BackScene = {
  /** A window is open over the page. */
  window: boolean;
  /** The board is on screen, not the home. */
  board: boolean;
  /** The game on the board is won or lost. */
  over: boolean;
  /** The home shows one of its pages, not its first screen. */
  page: boolean;
};

/** What « retour » does. */
export type BackStep = 'window' | 'pause' | 'home' | 'page' | 'leave';

/** The first thing that applies, from the nearest to the farthest. */
export const backStep = (scene: BackScene): BackStep =>
  scene.window
    ? 'window'
    : scene.board
      ? scene.over
        ? 'home'
        : 'pause'
      : scene.page
        ? 'page'
        : 'leave';

function sceneOf(page: Document): BackScene {
  const app = page.getElementById('app');
  const back = page.getElementById('home-back');
  return {
    window: !!page.querySelector('dialog[open]'),
    board: !!app && !app.hidden,
    // The board writes the status of its game on `#app` (src/ui/hud.ts).
    over: battleOver({ status: app?.dataset.status as Game['status'] }),
    page: !!back && !back.hidden,
  };
}

/**
 * The window on top. A modal window covers the page, its veil included: with several open,
 * the one on top is what lies at the centre of the screen.
 */
function topWindow(page: Document): HTMLDialogElement | null {
  const open = Array.from(page.querySelectorAll<HTMLDialogElement>('dialog[open]'));
  if (open.length < 2) return open[0] ?? null;
  const view = page.defaultView;
  const centre = view && page.elementFromPoint(view.innerWidth / 2, view.innerHeight / 2);
  return centre?.closest('dialog') ?? open[open.length - 1];
}

/**
 * What a browser does for Escape: the window is asked, and closes unless it answered no.
 * True when it said no and did nothing else: it is still open and nothing in it changed.
 */
function refusesToClose(dialog: HTMLDialogElement): boolean {
  // What the window does when asked is done at once: the changes are there to be counted.
  const watch = new MutationObserver(() => {});
  watch.observe(dialog, { subtree: true, childList: true, attributes: true, characterData: true });
  const agreed = dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
  const answered = watch.takeRecords().length > 0;
  watch.disconnect();
  if (agreed && dialog.open) dialog.close();
  return !agreed && dialog.open && !answered;
}

/** Does what « retour » does on this page; says which, `leave` being left to the caller. */
export function pressBack(page: Document = document): BackStep {
  const step = backStep(sceneOf(page));
  if (step === 'window') {
    const dialog = topWindow(page);
    if (dialog && refusesToClose(dialog)) return 'leave';
  }
  // The ids are written where they are looked up: `tests/dom-ids.test.ts` checks each one.
  else if (step === 'pause') page.getElementById('pause')?.click();
  else if (step === 'home') page.getElementById('menu-home')?.click();
  else if (step === 'page') page.getElementById('home-back')?.click();
  return step;
}

/** What the Android application's native side says it offers, before any module is loaded. */
type Bridge = { PluginHeaders?: readonly { name: string }[] };
/**
 * True when the native side carries the module that hands « retour » over (as for the share
 * of a file, src/ui/download.ts). A native side without it keeps Android's own answer, and
 * nothing is loaded nor said: an application built before it, a browser that shows the
 * application's page.
 */
export const nativeBack = (bridge = (globalThis as { Capacitor?: Bridge }).Capacitor): boolean =>
  !!bridge?.PluginHeaders?.some((one) => one.name === 'App');

/**
 * Takes « retour » from Android: listens first, and only then tells Android to ask the game.
 * A listener that cannot be set leaves Android's own answer in place.
 */
export async function bindBackButton(page: Document = document): Promise<void> {
  if (!nativeBack()) return;
  const { App } = await import('@capacitor/app');
  await App.addListener('backButton', () => {
    if (pressBack(page) === 'leave') void App.minimizeApp();
  });
  await App.toggleBackButtonHandler({ enabled: true });
  // The page that goes gives « retour » back; the page that comes takes it when it listens.
  page.defaultView?.addEventListener('pagehide', () => {
    void App.toggleBackButtonHandler({ enabled: false });
  });
}
