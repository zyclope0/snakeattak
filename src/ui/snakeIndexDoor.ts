import { setText } from '../i18n/dom.ts';
import { make } from './dom.ts';

/**
 * The way into the index of the snakes. Only this is loaded with the game: the index and its
 * window come in a package of their own the first time a door is touched.
 */
let opening: Promise<() => void> | undefined;

/**
 * A button that opens the index. `name` is what it says; `unavailable` is what it says when
 * the package did not arrive (a web page without network nor cache), until the next touch.
 */
export function snakeIndexDoor(id: string, name: string, unavailable: string): HTMLButtonElement {
  const door = make('button', { id, className: 'secondary', text: name });
  door.type = 'button';
  door.setAttribute('aria-haspopup', 'dialog');
  door.onclick = () => {
    opening ??= import('./snakeIndex/snakeIndex.ts').then((module) => module.snakeIndexWindow());
    opening.then(
      (open) => {
        setText(door, name);
        open();
      },
      () => {
        opening = undefined;
        setText(door, unavailable);
      },
    );
  };
  return door;
}
