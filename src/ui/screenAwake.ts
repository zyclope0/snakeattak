import type { Game } from '../game.ts';

/**
 * The screen kept on while a battle plays by itself, in the Android application only (src/main.ts
 * starts this there). The soldiers fight alone: a child who watches a wave without touching
 * would otherwise see the screen go dark, and the battle pause behind it. Everywhere else the
 * screen sleeps when Android decides: at home, in the camp, on a pause, behind a window, once the
 * battle is over, with the page in the background.
 *
 * It is the WebView's Screen Wake Lock: nothing to install, no permission to ask. A WebView
 * without it keeps its usual sleep. Android takes the lock back when the page is hidden; it is
 * asked for again when a battle plays on a visible page.
 */

/** What the page shows, as far as the screen is concerned. */
export type ScreenScene = {
  /** The page is on screen: Android lets only a visible page keep the screen on. */
  visible: boolean;
  /** The board is on screen, not the home. */
  board: boolean;
  /** The status of the game, as the board writes it on `#app` (`data-status`). */
  status: string | undefined;
  /** The battle waits: its pause panel is shown, or a window is open over the board. */
  paused: boolean;
};

const FIGHTING: Game['status'] = 'fighting';

/** True while a battle plays by itself on a visible board: the screen stays on. */
export const holdsScreen = (scene: ScreenScene): boolean =>
  scene.visible && scene.board && scene.status === FIGHTING && !scene.paused;

/** The part of `navigator.wakeLock` used here, and of the lock it gives. */
export type ScreenLock = { request(type: 'screen'): Promise<ScreenSentinel> };
export type ScreenSentinel = {
  release(): Promise<void>;
  addEventListener(type: 'release', listener: () => void): void;
};

/**
 * Asks for the lock when the scene wants it, gives it back when it does not. One question at a
 * time. A refusal, or a lock Android took back, is asked for again only once the scene has
 * stopped wanting it (pause, end of the wave, page hidden), never in a loop.
 */
export function screenKeeper(read: () => ScreenScene, lock: ScreenLock) {
  let held: ScreenSentinel | null = null;
  let asking = false;
  let refused = false;
  let stopped = false;
  const wanted = () => !stopped && holdsScreen(read());
  const sync = () => {
    if (!wanted()) {
      refused = false;
      const sentinel = held;
      held = null;
      void sentinel?.release();
      return;
    }
    if (held || asking || refused) return;
    asking = true;
    // A WebView that throws instead of answering is a refusal too.
    Promise.resolve()
      .then(() => lock.request('screen'))
      .then(
        (sentinel) => {
          asking = false;
          // The battle may have stopped while Android answered.
          if (!wanted()) return void sentinel.release();
          held = sentinel;
          sentinel.addEventListener('release', () => {
            if (held !== sentinel) return;
            held = null;
            refused = true;
          });
        },
        () => {
          asking = false;
          refused = true;
        },
      );
  };
  return {
    sync,
    stop() {
      stopped = true;
      sync();
    },
  };
}

/** Starts the keeper on the page of the game; returns how to stop it. */
export function keepScreenAwake(): () => void {
  const lock = 'wakeLock' in navigator ? navigator.wakeLock : undefined;
  const app = document.getElementById('app');
  const pause = document.getElementById('pause-overlay');
  if (!lock || !app || !pause) return () => {};
  const keeper = screenKeeper(
    () => ({
      visible: document.visibilityState === 'visible',
      board: !app.hidden,
      status: app.dataset.status,
      paused: !pause.hidden || !!document.querySelector('dialog[open]'),
    }),
    lock,
  );
  // The board writes its status at each change and a few times a second while it plays: each
  // writing is a moment to look again. A window opens and closes with such a writing too.
  const watcher = new MutationObserver(keeper.sync);
  watcher.observe(app, { attributeFilter: ['data-status', 'hidden'] });
  watcher.observe(pause, { attributeFilter: ['hidden'] });
  document.addEventListener('visibilitychange', keeper.sync);
  keeper.sync();
  return () => {
    watcher.disconnect();
    document.removeEventListener('visibilitychange', keeper.sync);
    keeper.stop();
  };
}
