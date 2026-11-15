import { setText } from '../i18n/dom.ts';
import { byId, make } from './dom.ts';
import * as TEXT from '../texts/fr/home.ts';

const NAME = TEXT.confidentialite;

/**
 * « Confidentialité », among the parents' buttons. Only this button is loaded with the game:
 * the policy and its window come in a package of their own the first time it is touched. The
 * package ships inside the application, so the policy is read without a connection.
 */
export function bindPrivacyDoor() {
  const door = make('button', { id: 'home-privacy', text: NAME });
  door.type = 'button';
  door.setAttribute('aria-haspopup', 'dialog');
  // Last of the small buttons, after « Joueurs » when several children share the device.
  byId('home-family').before(door);
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
        setText(door, TEXT.confidentialiteIndisponible);
      },
    );
  };
}
