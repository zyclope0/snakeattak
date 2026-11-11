// Controlled QA states only. No production hooks, no game-rule overrides.
import { bindHomeNavigation } from '../src/ui/homeNavigation.ts';
import { Session } from '../src/session.ts';
import { Game } from '../src/game.ts';
import { createMissionRun, MISSIONS } from '../src/missions.ts';
import { createMissionProgress, createMissionProgressController } from '../src/missionProgress.ts';
import { createCapriceAlbumsController } from '../src/capriceAlbums.ts';
import { createCareer } from '../src/progression.ts';
import { bindControls } from '../src/ui/controls.ts';
import { bindExpeditions } from '../src/ui/expeditions.ts';
import { bindCapriceAlbums } from '../src/ui/capriceAlbums.ts';
import { prepareMissionLaunch } from '../src/ui/capriceLaunch.ts';
import { initializeLanguageControls } from '../src/i18n/controls.ts';
import '../src/style.css';
import '../src/ui/caprices.css';
import '../src/ui/mobileMenus.css';
await initializeLanguageControls();
const navigation = bindHomeNavigation();
const mode = new URLSearchParams(location.search).get('case') ?? 'friends';
const session = new Session(42);
document.getElementById('app')!.hidden = false;
document.getElementById('home-screen')!.hidden = true;
const caprice =
  mode === 'bank'
    ? 'carrefour-createur-petit'
    : mode === 'honey'
      ? 'carrefour-petit'
      : mode === 'shell'
        ? 'refuge-createur-moyen'
        : 'sonnette-petit';
const missionId =
  mode === 'bank' || mode === 'honey' ? 'carrefour' : mode === 'shell' ? 'refuge' : 'sonnette';
const run = { ...createMissionRun(missionId, 42), caprice };
const game = new Game(42, undefined, run);
session.useGame(game);
if (mode === 'bank') {
  game.gold = 500;
  game.base = 60;
}
if (mode === 'honey') game.startWave();
if (mode === 'loss') {
  game.status = 'lost';
  game.base = 0;
}
if (mode === 'win') {
  game.status = 'won';
  game.wave = game.totalWaves;
}
const initial = createMissionProgress();
for (const m of MISSIONS) initial.bestStars[m.id] = 3;
const progress = createMissionProgressController(initial);
progress.started(run);
progress.sync(game);
const albums = createCapriceAlbumsController();
albums.beginRun();
const career = createCareer();
let expeditions: (() => void) | undefined;
let book: ReturnType<typeof bindCapriceAlbums> | undefined;
const refresh = bindControls(
  session,
  () => {
    albums.record(session.game);
    expeditions?.();
    book?.refresh();
  },
  career,
);
book = bindCapriceAlbums(session, albums, refresh, () => 'Controlled QA: memory only');
function home() {
  navigation.show('home', false);
  session.screen = 'home';
  document.getElementById('app')!.hidden = true;
  document.getElementById('home-screen')!.hidden = false;
  refresh();
}
document.getElementById('menu-home')!.onclick = home;
let reject = false;
expeditions = bindExpeditions(
  session,
  progress,
  {
    home,
    showMissions: () => navigation.show('missions'),
    canResume: () => true,
    resume: () => {},
    launchClassic: () => {},
    launch: (next, kinds = []) => {
      const proposed = prepareMissionLaunch(next, kinds, progress);
      if (reject || !proposed) return false;
      session.useGame(proposed);
      session.screen = 'battle';
      document.getElementById('app')!.hidden = false;
      document.getElementById('home-screen')!.hidden = true;
      refresh();
      return true;
    },
  },
  albums,
);
refresh();
if (mode === 'shell') {
  const { default: Phaser } = await import('phaser');
  const { BattleScene } = await import('../src/render/BattleScene.ts');
  const { bindBoardResize } = await import('../src/render/boardResize.ts');
  game.units = [];
  game.startWave();
  for (let i = 0; i < 300 && !game.enemies.some((e) => e.shell); i++) game.step(0.05);
  session.advance = () => {};
  const phaser = new Phaser.Game({
    type: new URLSearchParams(location.search).has('canvas') ? Phaser.CANVAS : Phaser.WEBGL,
    parent: 'game',
    width: 1100,
    height: 620,
    scene: [new BattleScene(session, refresh)],
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    audio: { noAudio: true },
  });
  bindBoardResize(phaser, document.getElementById('game')!);
  Object.assign(window, { shellPhaser: phaser });
}
Object.assign(window, {
  capricesFixture: {
    session,
    progress,
    albums,
    refresh,
    home,
    setReject(value: boolean) {
      reject = value;
    },
  },
});
