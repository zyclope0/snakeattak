import { setText } from '../i18n/dom.ts';
import { byId } from './dom.ts';
import { canHandOver } from './download.ts';
import { helpPoint } from './helpBubble.ts';
import type { FamilyActions } from './familyControls.ts';
import * as TEXT from '../texts/fr/family.ts';
import * as PAGE from '../texts/fr/page.ts';

/**
 * « Sauvegarde familiale », among the parents' buttons. Only the button and its « ? » are loaded
 * with the game: the window, its preview and its copies come in a package of their own the
 * first time it is touched, to leave room in the main package (decision of the parent,
 * 26 November 2026). The package ships inside the application; on the site it stays in the
 * browser's cache once the game has been opened with a connection.
 */
export function bindFamilyDoor(actions: FamilyActions) {
  const door = byId('home-family');
  // Page des parents : un « ? » à côté du bouton dit à quoi sert ce fichier.
  // The help beside the window says to keep the file: not where no file can be handed over.
  if (canHandOver()) door.after(helpPoint('family'));
  let opening: Promise<() => void> | undefined;
  door.onclick = () => {
    opening ??= import('./familyControls.ts').then((module) => module.bindFamilyControls(actions));
    opening.then(
      (open) => {
        // After a touch that failed, the button says its own name again.
        setText(door, PAGE.sauvegardeFamiliale);
        open();
      },
      () => {
        // The package did not arrive (a web page without network nor cache). A browser keeps
        // a module that failed once: the next touch asks again, and reloading the page helps.
        opening = undefined;
        setText(door, TEXT.sauvegardeFamilialeIndisponible2);
      },
    );
  };
}
