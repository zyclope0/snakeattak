import { setText } from '../i18n/dom.ts';
import { byId, make } from './dom.ts';

const NAME = 'Confidentialité';

/**
 * « Confidentialité », among the parents' buttons. Only this button is loaded with the game:
 * the policy and its window come in a package of their own the first time it is touched. The
 * package ships inside the application, so the policy is read without a connection.
 */
export function bindPrivacyDoor() {
  const door = make('button', { id: 'home-privacy', text: NAME });
  door.type = 'button';
  door.setAttribute('aria-haspopup', 'dialog');
  byId('home-sound').after(door);
  let opening: Promise<() => void> | undefined;
  door.onclick = () => {
    opening ??= import('./privacy/privacyWindow.ts').then((module) => module.privacyWindow());
    opening.then(
      (open) => {
        // After a touch that failed, the button says its own name again.
        setText(door, NAME);
        open();
      },
      () => {
        // The package did not arrive (a web page without network nor cache): ask again.
        opening = undefined;
        setText(door, 'Confidentialité indisponible. Réessaie.');
      },
    );
  };
}
