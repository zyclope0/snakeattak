// Labelled terminal QA fixtures, using the real UI and renderer. Never shipped.
import Phaser from 'phaser';
import { Session } from '../src/session.ts';
import { Game } from '../src/game.ts';
import { createMissionRun } from '../src/missions.ts';
import { bindControls } from '../src/ui/controls.ts';
import { BattleScene } from '../src/render/BattleScene.ts';
import { bindBoardResize } from '../src/render/boardResize.ts';
import { createMissionProgressController } from '../src/missionProgress.ts';
import { bindExpeditions } from '../src/ui/expeditions.ts';
import { createCapriceAlbumsController } from '../src/capriceAlbums.ts';
import { bindCapriceAlbums } from '../src/ui/capriceAlbums.ts';
import { loadGameFonts } from '../src/render/fonts.ts';
import { initializeLanguageControls } from '../src/i18n/controls.ts';
import '../src/style.css';
import '../src/ui/caprices.css';
await initializeLanguageControls();
await loadGameFonts();
const params = new URLSearchParams(location.search);
const status = params.get('status') === 'lost' ? 'lost' : 'won';
const run = {
  ...createMissionRun('refuge', 42),
  ...(params.has('caprice') ? { caprice: 'refuge-createur-petit' } : {}),
};
const session = new Session(42);
session.useGame(new Game(42, undefined, params.has('classic') ? undefined : run));
session.game.status = status;
session.game.wave = session.game.totalWaves;
if (status === 'lost') session.game.base = 0;
document.getElementById('home-screen')!.hidden = true;
document.getElementById('app')!.hidden = false;
let refreshExpeditions: (() => void) | undefined;
let book: ReturnType<typeof bindCapriceAlbums> | undefined;
const refresh = bindControls(session, () => {
  refreshExpeditions?.();
  book?.refresh();
});
const progress = createMissionProgressController();
progress.started(run);
progress.sync(session.game);
refreshExpeditions = bindExpeditions(session, progress, {
  home: () => {},
  canResume: () => false,
  resume: () => {},
  launchClassic: () => {},
  launch: () => false,
});
const albums = createCapriceAlbumsController();
albums.beginRun();
albums.record(session.game);
book = bindCapriceAlbums(session, albums, refresh, () => 'Controlled QA: memory only');
refresh();
const phaser = new Phaser.Game({
  type: Phaser.CANVAS,
  parent: 'game',
  width: 1100,
  height: 620,
  scene: [new BattleScene(session, refresh)],
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  audio: { noAudio: true },
});
bindBoardResize(phaser, document.getElementById('game')!);
Object.assign(window, { interfaceFixture: { session, refresh, phaser } });
