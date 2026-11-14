import { setText } from '../i18n/dom.ts';
import type { Game } from '../game.ts';
import type { Session } from '../session.ts';
import { loadVoyageLog } from '../voyageStorage.ts';
import type { VoyageLog } from '../voyageStorage.ts';
import { byId, make } from './dom.ts';
import type { HomePage } from './homeNavigation.ts';

/** What the page lends to the voyage: the game on screen, the player's storage, the way around. */
export type VoyagePorts = {
  session: Session;
  /** The active player's storage; nothing where the browser refuses one. */
  storage?: Pick<Storage, 'getItem' | 'setItem'>;
  /** Puts a stage on the board; the game that was there is set aside as for a mission. */
  play: (game: Game) => void;
  /** Leaves the board for the home screen, as its own button does. */
  home: () => void;
  navigate: (page: HomePage) => void;
};
type Screens = {
  open: () => void;
  refresh: () => void;
  restartStage: () => void;
};

/**
 * What the door of the home says. « Reprendre » only when there is something to take up
 * again, a stage won; « Nouveau » until this player has opened a first voyage.
 */
export function voyageDoor(log: VoyageLog): { label: string; fresh: boolean } {
  const current = log.current;
  const resume = current?.status === 'travelling' && current.won > 0;
  return { label: resume ? 'Reprendre le voyage' : 'Le voyage', fresh: !current };
}

/**
 * The entry of « Le voyage » on the home, beside « Jouer ». Only this button is loaded with
 * the game: the screens of the voyage arrive in a package of their own the first time it is
 * touched, and take over from there.
 */
export function bindVoyageDoor(ports: VoyagePorts) {
  const label = make('span');
  const tag = make('small', { className: 'voyage-new', text: 'Nouveau' });
  const door = make('button', { id: 'home-voyage' }, label, tag);
  byId('home-primary').after(door);
  let screens: Screens | undefined;
  let loading: Promise<Screens> | undefined;
  let log = loadVoyageLog(ports.storage);
  const show = (next: VoyageLog) => {
    log = next;
    const { label: words, fresh } = voyageDoor(log);
    setText(label, words);
    tag.hidden = !fresh;
  };
  const load = () =>
    (loading ??= import('./voyage/voyageScreens.ts').then(
      (module) => (screens = module.bindVoyageScreens(ports, show)),
    ));
  door.onclick = () => {
    load().then(
      (loaded) => {
        // After a touch that failed, the door says its own words again.
        show(log);
        loaded.open();
      },
      () => {
        // The package did not arrive (no network, no cache): the next touch asks again.
        loading = undefined;
        setText(label, 'Le voyage n’a pas pu s’ouvrir. Réessaie.');
      },
    );
  };
  show(log);
  return {
    /** With every redraw of the page; nothing to do until a voyage has been opened. */
    refresh: () => screens?.refresh(),
    /** « Recommencer » during a stage: the stage starts again from its beginning. */
    restartStage: () => screens?.restartStage(),
  };
}
