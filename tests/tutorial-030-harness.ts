import Phaser from 'phaser';
import { Session } from '../src/session.ts';
import { Game } from '../src/game.ts';
import { createMissionRun } from '../src/missions.ts';
import { BattleScene } from '../src/render/BattleScene.ts';
import { bindControls } from '../src/ui/controls.ts';
import { bindBoardResize } from '../src/render/boardResize.ts';
import '../src/style.css';
import '../src/ui/mobileMenus.css';
// This fixture enters battle directly, without main.ts and its screen switch.
document.getElementById('app')!.hidden = false;
const session = new Session(2026),
  run = createMissionRun('refuge', 2026);
const { rules, ...legacy } = run;
session.useGame(
  new Game(2026, undefined, new URLSearchParams(location.search).has('legacy') ? legacy : run),
);
session.advance = () => {};
const refresh = bindControls(session);
refresh();
const phaser = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 1100,
  height: 620,
  scene: [new BattleScene(session, refresh)],
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  audio: { noAudio: true },
});
bindBoardResize(phaser, document.getElementById('game')!);
Object.assign(window, {
  tutorialFixture: {
    session,
    phaser,
    wave(n: number) {
      session.game.wave = n - 1;
      session.game.status = 'preparing';
      session.game.paused = false;
      session.game.eggs = [];
      session.game.enemies = [];
      refresh();
    },
  },
});
