import { helpPoint } from '../ui/helpBubble.ts';
import { byId } from '../ui/dom.ts';
import { canHandOver } from '../ui/download.ts';
import type { bindFamilyFile } from './familyFile.ts';

/**
 * « Sauvegarde familiale », among the parents' buttons. Only the button and its « ? » are
 * loaded with the game: the window of the family file (`familyFile.ts` and
 * `ui/familyControls.ts`) is a file of its own, asked for as the game starts, beside the rest
 * of the page, as the players' views are. By the first tap it is there, and a family that must
 * take its adventure out of a device that keeps nothing still finds it after the network went.
 */
export function bindFamilyDoor(...wiring: Parameters<typeof bindFamilyFile>) {
  // Page des parents : un « ? » à côté du bouton dit à quoi sert ce fichier.
  // The help beside the window says to keep the file: not where no file can be handed over.
  if (canHandOver()) byId('home-family').after(helpPoint('family'));
  let loading: Promise<() => void> | undefined;
  const load = () =>
    (loading ??= import('./familyFile.ts').then((module) => module.bindFamilyFile(...wiring)));
  byId('home-family').onclick = () => {
    load().then(
      // Two taps while the file arrives open the window once (`bindFamilyControls`).
      (open) => open(),
      // The file did not arrive (a web page that lost its network): nothing opens, the game
      // stays as it is, and the next tap asks again.
      () => (loading = undefined),
    );
  };
  void load().catch(() => (loading = undefined));
}
