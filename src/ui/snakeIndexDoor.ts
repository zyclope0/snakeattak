import { setText } from '../i18n/dom.ts';
import { make } from './dom.ts';
import type { BalanceRevision } from '../balanceRevision.ts';

/**
 * The way into the index of the snakes. Only this is loaded with the game: the index and its
 * window come in a package of their own the first time a door is touched.
 */
let opening: Promise<(revision?: BalanceRevision) => void> | undefined;

/**
 * A button that opens the index. `name` is what it says; `unavailable` is what it says when
 * the package did not arrive (a web page without network nor cache): to reload the page, for
 * a browser keeps a module that failed once and the next touch brings nothing more.
 * `revision`: the game the index is opened from, whose snakes it describes; the current
 * revision when it is opened outside a game.
 */
export function snakeIndexDoor(
  id: string,
  name: string,
  unavailable: string,
  revision?: () => BalanceRevision,
): HTMLButtonElement {
  const door = make('button', { id, className: 'secondary', text: name });
  door.type = 'button';
  door.setAttribute('aria-haspopup', 'dialog');
  door.onclick = () => {
    opening ??= import('./snakeIndex/snakeIndex.ts').then((module) => module.snakeIndexWindow());
    opening.then(
      (open) => {
        setText(door, name);
        open(revision?.());
      },
      () => {
        opening = undefined;
        setText(door, unavailable);
      },
    );
  };
  return door;
}
