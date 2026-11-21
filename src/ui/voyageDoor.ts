import { setText } from '../i18n/dom.ts';
import type { Game } from '../game.ts';
import type { Session } from '../session.ts';
import { expeditionDoorState } from '../expeditionLog.ts';
import type { ExpeditionDoor } from '../expeditionLog.ts';
import { loadVoyageLog } from '../voyageStorage.ts';
import type { VoyageLog } from '../voyageStorage.ts';
import { byId, make } from './dom.ts';
import type { HomePage } from './homeNavigation.ts';
import * as TEXT from '../texts/fr/home.ts';

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
 * A voyage begun before « La Grande Expédition » took its place (decision of the parent,
 * 21 November 2026): it can be finished, and no new one starts.
 */
export const voyageToFinish = (log: VoyageLog): boolean =>
  log.current?.status === 'travelling' && log.current.won > 0;

/**
 * What the door of the home says: « Reprendre le voyage » while a voyage begun is still to
 * finish; then « La Grande Expédition », « Reprendre » once a battle of it is won, and
 * « Nouveau » until this player has opened a first one.
 */
export function voyageDoor(
  log: VoyageLog,
  expedition: ExpeditionDoor,
): { label: string; fresh: boolean } {
  if (voyageToFinish(log)) return { label: TEXT.reprendreLeVoyage, fresh: false };
  const resume = expedition === 'under-way';
  return {
    label: resume ? TEXT.reprendreLExpedition : TEXT.laGrandeExpedition,
    fresh: expedition === 'none',
  };
}

/**
 * The entry of « La Grande Expédition » on the home, beside « Jouer » (it took the place of
 * « Le voyage », whose screens it shares). Only this button is loaded with
 * the game: the screens of the voyage arrive in a package of their own the first time it is
 * touched, and take over from there.
 */
export function bindVoyageDoor(ports: VoyagePorts) {
  const label = make('span');
  const tag = make('small', { className: 'voyage-new', text: TEXT.nouveau });
  const door = make('button', { id: 'home-voyage' }, label, tag);
  byId('home-primary').after(door);
  let screens: Screens | undefined;
  let loading: Promise<Screens> | undefined;
  let log = loadVoyageLog(ports.storage);
  // Read from the storage until the screens are loaded; then they tell it from their own log,
  // which a device that refuses to save keeps all the same.
  let expedition = expeditionDoorState(ports.storage);
  /** With the voyage's log, or the state of the expedition, when either changes. */
  const show = (next: VoyageLog = log, state: ExpeditionDoor = expedition) => {
    log = next;
    expedition = state;
    const { label: words, fresh } = voyageDoor(log, expedition);
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
        tag.hidden = true;
        setText(
          label,
          voyageToFinish(log)
            ? TEXT.leVoyageNAPasPuSOuvrirReessaie
            : TEXT.laGrandeExpeditionNAPasPuSOuvrir,
        );
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
