import { setAttribute, setText } from '../i18n/dom.ts';
import { APPLES_TO_UNLOCK } from '../apples.ts';
import { byId, make } from './dom.ts';
import type { ClassicSnakePorts } from './classicSnake/classicSnakeBattle.ts';
import * as TEXT from '../texts/fr/home.ts';
import { fill } from '../texts/fill.ts';

/**
 * Le secret de l'antre (boss caché, lot 3, décisions du parent du 26 novembre 2026). Rien tant
 * que le joueur n'a trouvé aucune pomme ; puis une petite pomme et son compte, « 3 / 12 », dans
 * l'antre des serpents du premier écran ; à douze, le bouton « Classic Snake », qui lance le
 * combat. Seul ce bouton est dans le paquet de départ : le combat, ses images et ses mots
 * arrivent au premier toucher (`classicSnake/classicSnakeBattle.ts`). Answers what redraws it,
 * from the active player's apples (another player is another page).
 */
export function bindClassicSnakeDoor(found: () => number, ports: ClassicSnakePorts) {
  const count = make('span', { id: 'home-apples-count' });
  // A picture with its words: « Pommes trouvées : 3 sur 12 » for a screen reader.
  count.setAttribute('role', 'img');
  const name = make('span', { text: TEXT.classicSnake });
  const door = make('button', { id: 'home-classic-snake' }, name);
  door.type = 'button';
  const place = make('div', { id: 'home-apples' }, count, door);
  place.hidden = true;
  // In the den: right after its plaque, for the keyboard as for the eye.
  byId('home-classic').after(place);
  let opening: Promise<() => void> | undefined;
  door.onclick = () => {
    opening ??= import('./classicSnake/classicSnakeBattle.ts').then((module) =>
      module.bindClassicSnake(ports),
    );
    opening.then(
      (start) => {
        // After a touch that failed, the button says its own name again.
        delete door.dataset.failed;
        setText(name, TEXT.classicSnake);
        start();
      },
      () => {
        // The package or a picture did not arrive (a web page without network nor cache). A
        // browser keeps a module that failed once: the words say to reload the page.
        opening = undefined;
        door.dataset.failed = '';
        setText(name, TEXT.classicSnakeNAPasPuVenir);
      },
    );
  };
  return () => {
    const apples = Math.min(found(), APPLES_TO_UNLOCK);
    const open = apples === APPLES_TO_UNLOCK;
    place.hidden = !apples;
    count.hidden = open;
    door.hidden = !open;
    setText(count, fill(TEXT.nSurN, apples, APPLES_TO_UNLOCK));
    setAttribute(count, 'aria-label', fill(TEXT.pommesTrouveesNSurN, apples, APPLES_TO_UNLOCK));
  };
}
