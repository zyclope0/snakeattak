// UI-only outcome fixture, not a played match or an equilibrium simulation.
import Phaser from 'phaser';
import { Session } from '../src/session.ts';
import { Game } from '../src/game.ts';
import { createMissionRun, MISSIONS } from '../src/missions.ts';
import { createMissionProgress, createMissionProgressController } from '../src/missionProgress.ts';
import { bindControls } from '../src/ui/controls.ts';
import { bindExpeditions } from '../src/ui/expeditions.ts';
import { BattleScene } from '../src/render/BattleScene.ts';
import { bindBoardResize } from '../src/render/boardResize.ts';
import '../src/style.css';
const query = new URLSearchParams(location.search);
const mode = query.get('case') ?? 'first-win';
if (query.has('safe'))
  for (const [key, value] of Object.entries({ top: 24, right: 32, bottom: 16, left: 0 }))
    document.documentElement.style.setProperty('--safe-area-inset-' + key, value + 'px');
const classic = mode.startsWith('classic');
const preparing = mode === 'preparing';
const run = createMissionRun(mode === 'last-win' ? 'carrefour' : 'refuge', 20261109);
const game = new Game(20261109, undefined, classic ? undefined : run);
if (!preparing) {
  game.wave = game.totalWaves;
  game.status = mode.endsWith('loss') ? 'lost' : 'won';
  game.base = game.status === 'lost' ? 0 : 100;
  game.missionMinBase = game.base;
  game.enemies = [];
  game.eggs = [];
  game.remaining = 0;
}
const before = JSON.stringify(game);
const session = new Session(20261109);
session.useGame(game);
session.advance = () => {};
const initial = createMissionProgress();
if (mode === 'last-win') for (const m of MISSIONS.slice(0, -1)) initial.bestStars[m.id] = 1;
const progress = createMissionProgressController(initial);
progress.sync(game);
const app = document.getElementById('app')!;
const home = document.getElementById('home-screen')!;
app.hidden = false;
home.hidden = true;
let expeditions: (() => void) | undefined;
const refresh = bindControls(session, () => expeditions?.());
function showHome() {
  session.screen = 'home';
  app.hidden = true;
  home.hidden = false;
  refresh();
}
document.getElementById('menu-home')!.onclick = showHome;
let lastLaunch: unknown = null;
expeditions = bindExpeditions(session, progress, {
  home: showHome,
  canResume: () => false,
  resume: () => {},
  launchClassic: () => {},
  launch(nextRun) {
    lastLaunch = nextRun;
    session.useGame(new Game(nextRun.seed, undefined, nextRun));
    session.screen = 'battle';
    app.hidden = false;
    home.hidden = true;
    refresh();
  },
});
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
  resultFixture: {
    session,
    phaser,
    refresh,
    before,
    originalRun: run,
    get lastLaunch() {
      return lastLaunch;
    },
  },
});
