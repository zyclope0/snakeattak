// Controlled QA states only. No production hooks, no game-rule overrides.
// The home, the battle screen and the voyage wired as in bootstrap.ts, without Phaser: the
// recipe ends a stage by hand (`voyageFixture.end('won' | 'lost')`) to reach the screens a
// real game takes many minutes to reach, the fifth stage won above all. The voyage log is
// read from and written to localStorage, which the recipe fills before the page loads.
import { bindHomeNavigation } from '../src/ui/homeNavigation.ts';
import { Session } from '../src/session.ts';
import { createCareer } from '../src/progression.ts';
import { bindControls } from '../src/ui/controls.ts';
import { bindVoyageDoor } from '../src/ui/voyageDoor.ts';
import { initializeLanguageControls } from '../src/i18n/controls.ts';
import { bindSettingsDialog } from '../src/ui/settingsDialog.ts';
import { byId } from '../src/ui/dom.ts';
import '../src/style.css';
import '../src/ui/mobileMenus.css';
import '../src/ui/homeScene.css';
import '../src/ui/homePages.css';
import '../src/ui/dialogPages.css';
import '../src/ui/mainActions.css';

await initializeLanguageControls();
const navigation = bindHomeNavigation();
const session = new Session(42);
session.screen = 'home';
let voyage: ReturnType<typeof bindVoyageDoor> | undefined;
const refresh = bindControls(session, () => voyage?.refresh(), createCareer(), {
  restart: () => voyage?.restartStage(),
});
function show(home: boolean) {
  session.screen = home ? 'home' : 'battle';
  byId('home-screen').hidden = !home;
  byId('app').hidden = home;
  refresh();
}
function home() {
  navigation.show('home', false);
  show(true);
}
byId('menu-home').onclick = home;
voyage = bindVoyageDoor({
  session,
  storage: localStorage,
  play: (game) => {
    session.useGame(game);
    show(false);
  },
  home,
  navigate: (page) => navigation.show(page),
  refresh,
});
bindSettingsDialog(() => refresh());
show(true);
Object.assign(window, {
  voyageFixture: {
    session,
    /** Ends the stage on the board as the engine would, then redraws the page. */
    end(status: 'won' | 'lost') {
      const game = session.game;
      game.status = status;
      if (status === 'won') game.wave = game.totalWaves;
      else game.base = 0;
      refresh();
    },
  },
});
