// Browser-only fixture for the apples of the hidden boss: the real board, the real book of the
// player over the browser's storage, a mission of three waves. Never imported by production.
import Phaser from 'phaser';
import { Session } from '../src/session.ts';
import { Game } from '../src/game.ts';
import { createMissionRun } from '../src/missions.ts';
import { BattleScene } from '../src/render/BattleScene.ts';
import { bindControls } from '../src/ui/controls.ts';
import { bindBoardResize } from '../src/render/boardResize.ts';
import { createAppleBook } from '../src/appleBook.ts';
import { playerStorage } from '../src/players.ts';
import '../src/style.css';
import '../src/ui/mobileMenus.css';
// This fixture enters battle directly, without main.ts and its screen switch.
document.getElementById('app')!.hidden = false;

const query = new URLSearchParams(location.search);
const seed = Number(query.get('seed') ?? 33);
const session = new Session(seed);
const game = new Game(seed, undefined, createMissionRun('refuge', seed));
// `?from=2`: the camp before the third wave, as a camp brought back would be.
game.wave = Number(query.get('from') ?? 0);
session.useGame(game);
const apples = createAppleBook(playerStorage(localStorage, 'p1'));
const refresh = bindControls(session);
refresh();
let sounds = 0;
const phaser = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 1100,
  height: 620,
  scene: [
    new BattleScene(session, refresh, undefined, undefined, {
      has: apples.has,
      collect: apples.add,
      sound: () => sounds++,
    }),
  ],
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  audio: { noAudio: true },
});
bindBoardResize(phaser, document.getElementById('game')!);

/** Seconds of play added at each frame, on top of the real clock: waves go by fast. */
let fast = 0;
const run = () => {
  for (let i = 0; i < fast * 20; i++) session.game.step(0.05);
  requestAnimationFrame(run);
};
requestAnimationFrame(run);
Object.assign(window, {
  appleFixture: {
    session,
    phaser,
    apples,
    get sounds() {
      return sounds;
    },
    fast(seconds: number) {
      fast = seconds;
    },
  },
});
