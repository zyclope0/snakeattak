// Controlled QA states only. No production hooks, no game-rule overrides.
// A mission that has just ended, with the stars and the stickers the address asks for:
// ?mission=refuge&caprice=refuge-petit&stars=3,2,1,0,0,0&stickers=a,b&base=70&status=won
import { bindHomeNavigation } from '../src/ui/homeNavigation.ts';
import { Session } from '../src/session.ts';
import { Game } from '../src/game.ts';
import { createMissionRun, MISSIONS, type MissionId } from '../src/missions.ts';
import { createMissionProgress, createMissionProgressController } from '../src/missionProgress.ts';
import { createCapriceAlbums, createCapriceAlbumsController } from '../src/capriceAlbums.ts';
import { createCareer } from '../src/progression.ts';
import { bindControls } from '../src/ui/controls.ts';
import { bindExpeditions } from '../src/ui/expeditions.ts';
import { bindCapriceAlbums } from '../src/ui/capriceAlbums.ts';
import { prepareMissionLaunch } from '../src/ui/capriceLaunch.ts';
import { initializeLanguageControls } from '../src/i18n/controls.ts';
import { bindSettingsDialog } from '../src/ui/settingsDialog.ts';
import '../src/style.css';
import '../src/ui/caprices.css';
import '../src/ui/mobileMenus.css';
import '../src/ui/homeScene.css';
import '../src/ui/homePages.css';
import '../src/ui/dialogPages.css';
import '../src/ui/mainActions.css';
await initializeLanguageControls();
const navigation = bindHomeNavigation();
const query = new URLSearchParams(location.search);
const list = (name: string) => (query.get(name) ?? '').split(',').filter(Boolean);
const missionId = (query.get('mission') ?? 'refuge') as MissionId;
const caprice = query.get('caprice') ?? undefined;
const session = new Session(42);
document.getElementById('app')!.hidden = false;
document.getElementById('home-screen')!.hidden = true;
const run = { ...createMissionRun(missionId, 42, undefined, 2), ...(caprice ? { caprice } : {}) };
const game = new Game(42, undefined, run);
session.useGame(game);
session.screen = 'battle';
// The crystal's lowest health decides the stars of the game that ends here.
game.missionMinBase = Number(query.get('base') ?? 100);
game.base = game.missionMinBase;
game.status = query.get('status') === 'lost' ? 'lost' : 'won';
if (game.status === 'won') game.wave = game.totalWaves;
else game.base = 0;
const initial = createMissionProgress();
for (const [index, stars] of list('stars').entries())
  initial.bestStars[MISSIONS[index]!.id] = Number(stars);
const progress = createMissionProgressController(initial);
progress.started(run);
progress.sync(game);
const book = createCapriceAlbums();
book.children[0]!.completed = list('stickers');
const albums = createCapriceAlbumsController(book);
albums.beginRun();
let expeditions: (() => void) | undefined;
let albumUI: ReturnType<typeof bindCapriceAlbums> | undefined;
// As in production: a caprice won earns its sticker once, and the result says so.
const awarded = new WeakMap<Game, boolean>();
const refresh = bindControls(
  session,
  () => {
    const played = session.game;
    if (played.mission?.caprice && played.status === 'won' && !awarded.has(played))
      awarded.set(played, albums.record(played));
    expeditions?.();
    albumUI?.refresh();
  },
  createCareer(),
);
albumUI = bindCapriceAlbums(
  session,
  albums,
  refresh,
  () => 'Controlled QA: memory only',
  (played) => awarded.get(played),
);
function home() {
  navigation.show('home', false);
  session.screen = 'home';
  document.getElementById('app')!.hidden = true;
  document.getElementById('home-screen')!.hidden = false;
  refresh();
}
document.getElementById('menu-home')!.onclick = home;
expeditions = bindExpeditions(
  session,
  progress,
  {
    home,
    showMissions: () => navigation.show('missions'),
    canResume: () => false,
    resume: () => {},
    launchClassic: () => {},
    launch: (next, kinds = []) => {
      const proposed = prepareMissionLaunch(next, kinds, progress);
      if (!proposed) return false;
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
// Same binding as production: the settings buttons open the window that holds the language.
bindSettingsDialog(() => refresh());
Object.assign(window, { replayFixture: { session, progress, albums } });
