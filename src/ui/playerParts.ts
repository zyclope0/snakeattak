import { setText } from '../i18n/dom.ts';
import { kinds } from '../data.ts';
import type { Player, PlayerCharacter } from '../players.ts';

type Tag = keyof HTMLElementTagNameMap;

/**
 * A new element of the players' screens. Not `make` of `dom.ts`: here a button never
 * submits anything, so it says `type="button"`, written after the class as it always was.
 */
export function part<K extends Tag>(tag: K, className = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (tag === 'button') (node as HTMLButtonElement).type = 'button';
  return node;
}
/** The same, with a text in the player's language. */
export function words<K extends Tag>(tag: K, text: string, className = '') {
  const node = part(tag, className);
  setText(node, text);
  return node;
}

/** The small portrait of a character; the style sheet picks the image. */
export function avatar(kind: PlayerCharacter) {
  const node = part('span', 'player-avatar');
  node.dataset.character = kind;
  node.setAttribute('aria-hidden', 'true');
  return node;
}

/** A character's name follows the language; a nickname is shown exactly as it was typed. */
export function nameOf(player: Player) {
  const node = part('strong', 'player-name');
  if (player.name === null) setText(node, kinds[player.character].name);
  else {
    node.dataset.copyRaw = '';
    node.textContent = player.name;
  }
  return node;
}

/** One player of a list: the portrait, the name and the stars, then one tool beside them. */
export function playerCard(player: Player, stars: number, managing: boolean) {
  const box = part('div', 'player-card');
  box.dataset.player = player.id;
  const name = nameOf(player);
  name.id = `player-name-${player.id}`;
  // In the parents' list the face is not a button: only « Supprimer » acts.
  const face = part(managing ? 'div' : 'button', 'player-face');
  face.append(avatar(player.character), name, starCount(stars));
  const tool = words('button', managing ? 'Supprimer' : 'Modifier', 'player-tool');
  tool.setAttribute('aria-describedby', name.id);
  box.append(face, tool);
  return { box, face, tool };
}

function starCount(stars: number) {
  const count = part('span', 'player-stars');
  const star = part('span');
  star.setAttribute('aria-hidden', 'true');
  star.textContent = '★';
  count.append(star, words('span', `${stars} / 18 étoiles`));
  return count;
}
