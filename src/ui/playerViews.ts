import { kinds } from '../data.ts';
import { NICKNAME_LIMIT, PLAYER_CHARACTERS, PLAYER_IDS } from '../players.ts';
import type { Player, PlayerCharacter, PlayerId, Players } from '../players.ts';
import { avatar, nameOf, part, playerCard, words } from './playerParts.ts';
import * as TEXT from '../texts/fr/players.ts';

type Stars = (id: PlayerId) => number;
type Pick = (id: PlayerId) => void;

/** « Qui joue ? » : touching a card plays as that player. */
export function whoView(state: Players, stars: Stars, play: Pick, edit: Pick, add: () => void) {
  const cards = part('div', 'player-cards');
  for (const player of state.players) {
    const { box, face, tool } = playerCard(player, stars(player.id), false);
    if (player.id === state.activeId) face.setAttribute('aria-current', 'true');
    face.onclick = () => play(player.id);
    tool.onclick = () => edit(player.id);
    cards.append(box);
  }
  if (state.players.length < PLAYER_IDS.length) cards.append(newPlayerCard(add));
  const note = words('p', TEXT.chaqueJoueurGardeSesEtoilesEtSon, 'players-note');
  return { cards, note };
}

function newPlayerCard(add: () => void) {
  const card = part('button', 'player-card');
  card.classList.add('player-new');
  card.id = 'player-new';
  const plus = part('span', 'player-avatar');
  plus.setAttribute('aria-hidden', 'true');
  plus.textContent = '+';
  card.append(
    plus,
    words('strong', TEXT.nouveauJoueur, 'player-name'),
    words('small', TEXT.choisisTonPersonnage),
  );
  card.onclick = () => add();
  return card;
}

/** « Choisis ton personnage » : for a new player, or to change one's own. */
export function pickView(
  player: Player | undefined,
  character: PlayerCharacter,
  submit: (kind: PlayerCharacter, nickname: string) => void,
  goBack: () => void,
) {
  const { grid, pressed, chosen } = characterGrid(character);
  const { field, input } = nicknameField(player?.name ?? '');
  const confirm = words('button', player ? TEXT.enregistrer : TEXT.cEstMoi, 'primary');
  confirm.id = 'player-save';
  const back = words('button', TEXT.retour, 'secondary');
  back.id = 'player-back';
  back.onclick = () => goBack();
  const send = () => submit(chosen(), input.value);
  confirm.onclick = send;
  input.onkeydown = (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    send();
  };
  const form = part('div', 'player-form');
  form.append(field, confirm, back);
  // The focus goes to the character already pressed.
  return { content: [grid, form], focus: pressed };
}

/** The characters to choose from; exactly one is pressed. */
function characterGrid(initial: PlayerCharacter) {
  let kind = initial;
  const grid = part('div', 'player-characters');
  grid.setAttribute('role', 'group');
  grid.setAttribute('aria-labelledby', 'players-title');
  const choices = PLAYER_CHARACTERS.map((entry) => {
    const choice = part('button', 'player-character');
    choice.dataset.character = entry;
    choice.append(avatar(entry), words('span', kinds[entry].name));
    choice.onclick = () => {
      kind = entry;
      mark();
    };
    return choice;
  });
  const mark = () =>
    choices.forEach((choice) =>
      choice.setAttribute('aria-pressed', String(choice.dataset.character === kind)),
    );
  mark();
  grid.append(...choices);
  return { grid, pressed: choices[PLAYER_CHARACTERS.indexOf(kind)], chosen: () => kind };
}

function nicknameField(value: string) {
  const field = part('label', 'player-nickname');
  const input = part('input');
  input.id = 'player-nickname';
  input.type = 'text';
  input.maxLength = NICKNAME_LIMIT;
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('autocapitalize', 'words');
  input.setAttribute('enterkeyhint', 'done');
  input.value = value;
  field.append(words('span', TEXT.tonSurnomSiTuVeux), input);
  return { field, input };
}

/** Parents: the players of this device, each with its « Supprimer ». */
export function manageView(state: Players, stars: Stars, remove: Pick) {
  const cards = part('div', 'player-cards');
  for (const player of state.players) {
    const { box, tool } = playerCard(player, stars(player.id), true);
    tool.onclick = () => remove(player.id);
    cards.append(box);
  }
  return cards;
}

/** « Supprimer ce joueur ? » : who goes and what is lost; « Annuler » takes the focus. */
export function confirmView(player: Player, remove: () => void, keep: () => void) {
  const who = part('div', 'player-card');
  const face = part('div', 'player-face');
  face.append(avatar(player.character), nameOf(player));
  who.append(face);
  const text = words('p', TEXT.sesEtoilesEtSonCarnetSerontEffaces);
  text.id = 'player-delete-text';
  const yes = words('button', TEXT.supprimer, 'danger');
  yes.id = 'player-delete';
  yes.onclick = () => remove();
  const no = words('button', TEXT.annuler, 'secondary');
  no.id = 'player-keep';
  no.onclick = () => keep();
  const actions = part('div', 'player-form');
  actions.append(yes, no);
  return { content: [who, text, actions], focus: no };
}
