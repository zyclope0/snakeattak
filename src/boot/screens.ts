import type Phaser from 'phaser';
import { byId } from '../ui/dom.ts';

/**
 * The home and the board share the page: one of them is shown. The battle scene sleeps at
 * home and wakes on the board, once Phaser has made it (`attach`).
 */
export function createScreens(watchKeeping: () => void) {
  let phaser: Phaser.Game | undefined;
  return {
    attach(game: Phaser.Game) {
      phaser = game;
    },
    /** The home or the board. The scene sleeps at home and wakes with fresh bounds. */
    show(home: boolean) {
      byId('home-screen').hidden = !home;
      // Going home saves nothing: what could not be kept is told here too (a child who leaves the
      // gifts of a wave unchosen is never told on the board).
      if (home) watchKeeping();
      byId('app').hidden = home;
      // Both screens share a document: never inherit the map/menu scroll in battle.
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      requestAnimationFrame(() => {
        if (!phaser) return;
        if (home && phaser.scene.keys.Battle && phaser.scene.isActive('Battle'))
          phaser.scene.sleep('Battle');
        if (!home) {
          if (phaser.scene.keys.Battle && phaser.scene.isSleeping('Battle'))
            phaser.scene.wake('Battle');
          phaser.scale.getParentBounds();
          phaser.scale.refresh();
          phaser.scale.updateBounds();
        }
      });
    },
  };
}
