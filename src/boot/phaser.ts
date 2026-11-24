import { bindBoardResize } from '../render/boardResize.ts';
import { watchBoard } from '../failureWatch.ts';
import { showFailure } from '../ui/failure/failureWindow.ts';
import { BOARD_WIDTH, BOARD_HEIGHT, bindBoardResolution } from '../render/boardResolution.ts';
import { visualSettings } from '../render/visualSettings.ts';
import Phaser from 'phaser';
import { byId } from '../ui/dom.ts';
import { FRAME_RATE_TARGET, limitFrames } from '../render/frameLimit.ts';

/**
 * The board: Phaser and its battle scene, the canvas fitted to the screen, the window shown
 * when a frame stops it, and the advertising of the website beside it.
 */
export function createPhaser(scene: Phaser.Scene): Phaser.Game {
  const phaser = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    // The board in world units; `bindBoardResolution` enlarges the canvas to the screen's pixels.
    width: BOARD_WIDTH,
    height: BOARD_HEIGHT,
    backgroundColor: '#6a8b59',
    scene: [scene],
    render: { antialias: true },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    audio: { noAudio: true },
    // A limit, so that Phaser steps through its limited path; `limitFrames` sets it to the screen.
    fps: { limit: FRAME_RATE_TARGET },
  });
  limitFrames(phaser.loop);
  const invalidateBoard = bindBoardResize(phaser, byId('game'));
  // A frame that throws stops the board for good: the child is told, and offered to start again.
  const { loop } = phaser;
  // The window comes with the page (`src/main.ts` holds its files): the day the board stops,
  // nothing has to be fetched.
  watchBoard({ frame: () => loop.frame, running: () => loop.running }, showFailure);
  if (import.meta.env.MODE === 'ads-preview') {
    let destroyed = false;
    let release: (() => void) | undefined;
    phaser.events.once('destroy', () => {
      destroyed = true;
      release?.();
    });
    void import('../ui/webAds/preview.ts').then(({ bindWebAdPreview }) => {
      if (!destroyed) release = bindWebAdPreview({ onBoardMoved: invalidateBoard });
    });
  }
  // Advertising on the website: nothing of it is in the build while it is switched off.
  if (__WEB_ADS__)
    void import('../ui/webAds/delivery.ts').then(({ bindWebAds }) =>
      bindWebAds({ onBoardMoved: invalidateBoard, scriptUrl: __WEB_AD_SCRIPT__ }),
    );
  bindBoardResolution(phaser, () => visualSettings.light);
  return phaser;
}
