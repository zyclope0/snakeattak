import type { Player } from '../players.ts';
import { byId } from './dom.ts';
import { avatar, nameOf, part, words } from './playerParts.ts';
import * as TEXT from '../texts/fr/players.ts';

/**
 * What follows the players outside their window: the chip of the home header, the
 * « Joueurs » button of the parents' page, and the sentence of the family save.
 */
export function placePlayerMarks() {
  const chip = part('button', 'player-chip');
  chip.id = 'player-chip';
  chip.setAttribute('aria-haspopup', 'dialog');
  document.querySelector('#home-screen .home-brand')!.after(chip);
  const manage = words('button', TEXT.joueurs);
  manage.id = 'home-players';
  manage.setAttribute('aria-haspopup', 'dialog');
  byId('home-sound').after(manage);
  const familyNote = part('p');
  familyNote.id = 'family-player-note';
  document.querySelector('#family-dialog > p')!.after(familyNote);

  /** `several`: the device has more than one player, so there is someone to change to. */
  function draw(me: Player, several: boolean) {
    const text = part('span', 'player-chip-text');
    text.append(nameOf(me), words('small', several ? TEXT.changerDeJoueur : TEXT.ajouterUnJoueur));
    const badge = part('span', 'player-chip-badge');
    badge.setAttribute('aria-hidden', 'true');
    chip.dataset.players = several ? 'several' : 'one';
    chip.replaceChildren(avatar(me.character), text, badge);
    manage.hidden = !several;
    familyNote.hidden = !several;
    familyNote.replaceChildren(words('span', TEXT.ceFichierNeGardeQueLAventureDu), ' ', nameOf(me));
  }
  return { chip, manage, draw };
}
