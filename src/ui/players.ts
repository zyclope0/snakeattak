import { setText } from '../i18n/dom.ts';
import { kinds } from '../data.ts';
import {
  NICKNAME_LIMIT,
  PLAYER_CHARACTERS,
  PLAYER_CHOSEN_KEY,
  PLAYER_IDS,
  PLAYERS_KEY,
  addPlayer,
  clearPlayerData,
  editPlayer,
  nicknameFromInput,
  playerStars,
  removePlayer,
  savePlayers,
  selectPlayer,
  storedPlayersFor,
  suggestedCharacter,
} from '../players.ts';
import type { Player, PlayerCharacter, PlayerId, Players } from '../players.ts';
import './players.css';
import { byId } from './dom.ts';

type Options = {
  /** The device's storage, undefined when the browser refuses it. */
  device: Storage | undefined;
  players: Players;
  /** Write the adventure in progress: the page is about to be left for another player. */
  save: () => void;
  /** Stop every later write of this page: its player is being deleted. */
  silence: () => void;
};
const make = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '') => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (tag === 'button') (node as HTMLButtonElement).type = 'button';
  return node;
};
const words = <K extends keyof HTMLElementTagNameMap>(tag: K, text: string, className = '') => {
  const node = make(tag, className);
  setText(node, text);
  return node;
};
const avatar = (kind: PlayerCharacter) => {
  const node = make('span', 'player-avatar');
  node.dataset.character = kind;
  node.setAttribute('aria-hidden', 'true');
  return node;
};
/** A character's name follows the language; a nickname is shown exactly as it was typed. */
const nameOf = (player: Player) => {
  const node = make('strong', 'player-name');
  if (player.name === null) setText(node, kinds[player.character].name);
  else {
    node.dataset.copyRaw = '';
    node.textContent = player.name;
  }
  return node;
};

/**
 * The players of this device: the chip of the home header, « Qui joue ? », the choice of a
 * character, and the parents' list. Everything is built here, so the page of the first
 * launch is not made heavier. Changing player writes the choice and reloads the page: every
 * controller is then rebuilt on that player's keys.
 */
export function bindPlayers({ device, players, save, silence }: Options) {
  let state = players;
  let forced = false;
  let opener: HTMLElement | null = null;
  let waiting = false;
  const me = () => state.players.find((player) => player.id === state.activeId)!;
  const several = () => state.players.length > 1;
  const chosen = () => {
    try {
      return sessionStorage.getItem(PLAYER_CHOSEN_KEY) === '1';
    } catch {
      return false;
    }
  };
  const remember = (value: boolean) => {
    try {
      if (value) sessionStorage.setItem(PLAYER_CHOSEN_KEY, '1');
      else sessionStorage.removeItem(PLAYER_CHOSEN_KEY);
    } catch {
      /* The question is then simply asked again. */
    }
  };

  const chip = make('button', 'player-chip');
  chip.id = 'player-chip';
  chip.setAttribute('aria-haspopup', 'dialog');
  document.querySelector('#home-screen .home-brand')!.after(chip);
  const manage = words('button', 'Joueurs');
  manage.id = 'home-players';
  manage.setAttribute('aria-haspopup', 'dialog');
  byId('home-sound').after(manage);
  const familyNote = make('p');
  familyNote.id = 'family-player-note';
  document.querySelector('#family-dialog > p')!.after(familyNote);

  const dialog = make('dialog', 'players-dialog');
  dialog.id = 'players-dialog';
  dialog.setAttribute('aria-labelledby', 'players-title');
  const head = make('div', 'players-head');
  const title = make('h2');
  title.id = 'players-title';
  const close = words('button', 'Fermer', 'secondary');
  close.id = 'players-close';
  close.onclick = () => shut();
  head.append(title, close);
  // The body alone is redrawn: the "turn your phone" notice may be lodged in the dialog.
  const body = make('div', 'players-body');
  const status = make('p', 'players-status');
  status.setAttribute('role', 'status');
  dialog.append(head, body, status);
  document.body.append(dialog);

  /** What follows the players outside the dialog: the chip, the parents' page, the save. */
  function drawOutside() {
    const text = make('span', 'player-chip-text');
    text.append(
      nameOf(me()),
      words('small', several() ? 'Changer de joueur' : 'Ajouter un joueur'),
    );
    const badge = make('span', 'player-chip-badge');
    badge.setAttribute('aria-hidden', 'true');
    chip.dataset.players = several() ? 'several' : 'one';
    chip.replaceChildren(avatar(me().character), text, badge);
    manage.hidden = !several();
    familyNote.hidden = !several();
    familyNote.replaceChildren(
      words('span', 'Ce fichier ne garde que l’aventure du joueur en cours :'),
      ' ',
      nameOf(me()),
    );
  }
  function show(view: string, heading: string, content: HTMLElement[], focus: HTMLElement) {
    dialog.dataset.view = view;
    setText(title, heading);
    setText(status, '');
    // The two lists close; a choice in progress goes back with its own button. At the
    // opening of the game the only way out is to say who plays.
    close.hidden = forced || (view !== 'who' && view !== 'manage');
    body.replaceChildren(...content);
    if (!dialog.open) dialog.showModal();
    waiting = true;
    focus.focus({ preventScroll: true });
  }
  /** Once per closing, at once for a button and at the `close` event for Escape. */
  function settle() {
    if (dialog.open || !waiting) return;
    // A second Escape can close a dialog whose first one was refused: ask again.
    if (forced) return drawWho();
    waiting = false;
    const back = [opener, chip, document.getElementById('home-back')].find(
      (node) => node?.getClientRects().length,
    );
    opener = null;
    back?.focus({ preventScroll: true });
  }
  function shut() {
    dialog.close();
    settle();
  }
  const fail = () => setText(status, 'Impossible d’enregistrer ce joueur sur cet appareil.');
  /**
   * Another tab may have changed the players: start again from what is stored. False when
   * this page's own player was deleted elsewhere; the page then reloads without writing
   * that adventure back.
   */
  function sync(): boolean {
    const stored = storedPlayersFor(device, state.activeId);
    if (!stored) {
      silence();
      window.location.reload();
      return false;
    }
    state = stored;
    return true;
  }

  function card(player: Player, managing: boolean) {
    const box = make('div', 'player-card');
    box.dataset.player = player.id;
    const name = nameOf(player);
    name.id = `player-name-${player.id}`;
    const stars = make('span', 'player-stars');
    const star = make('span');
    star.setAttribute('aria-hidden', 'true');
    star.textContent = '★';
    stars.append(star, words('span', `${playerStars(device, player.id)} / 18 étoiles`));
    const face = make(managing ? 'div' : 'button', 'player-face');
    face.append(avatar(player.character), name, stars);
    const tool = words('button', managing ? 'Supprimer' : 'Modifier', 'player-tool');
    tool.setAttribute('aria-describedby', name.id);
    if (managing) tool.onclick = () => drawConfirm(player.id);
    else {
      if (player.id === state.activeId) face.setAttribute('aria-current', 'true');
      face.onclick = () => play(player.id);
      tool.onclick = () => drawPick(player.id);
    }
    box.append(face, tool);
    return box;
  }
  const tool = (id: PlayerId) => `[data-player="${id}"] .player-tool`;

  /** « Qui joue ? » : touching a card plays as that player. */
  function drawWho(focus = `[data-player="${state.activeId}"] .player-face`) {
    const cards = make('div', 'player-cards');
    for (const player of state.players) cards.append(card(player, false));
    if (state.players.length < PLAYER_IDS.length) {
      const fresh = make('button', 'player-card');
      fresh.classList.add('player-new');
      fresh.id = 'player-new';
      const plus = make('span', 'player-avatar');
      plus.setAttribute('aria-hidden', 'true');
      plus.textContent = '+';
      fresh.append(
        plus,
        words('strong', 'Nouveau joueur', 'player-name'),
        words('small', 'Choisis ton personnage'),
      );
      fresh.onclick = () => drawPick(null);
      cards.append(fresh);
    }
    const note = words(
      'p',
      'Chaque joueur garde ses étoiles et son carnet sur cet appareil.',
      'players-note',
    );
    show(
      'who',
      'Qui joue ?',
      [cards, note],
      cards.querySelector<HTMLElement>(focus) ?? cards.querySelector<HTMLElement>('.player-face')!,
    );
  }

  /** « Choisis ton personnage » : for a new player, or to change one's own. */
  function drawPick(editing: PlayerId | null) {
    const player = state.players.find((entry) => entry.id === editing);
    let kind = player?.character ?? suggestedCharacter(state);
    const grid = make('div', 'player-characters');
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-labelledby', 'players-title');
    const choices = PLAYER_CHARACTERS.map((entry) => {
      const choice = make('button', 'player-character');
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
    const field = make('label', 'player-nickname');
    const input = make('input');
    input.id = 'player-nickname';
    input.type = 'text';
    input.maxLength = NICKNAME_LIMIT;
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.setAttribute('autocapitalize', 'words');
    input.setAttribute('enterkeyhint', 'done');
    input.value = player?.name ?? '';
    field.append(words('span', 'Ton surnom (si tu veux)'), input);
    const confirm = words('button', player ? 'Enregistrer' : 'C’est moi !', 'primary');
    confirm.id = 'player-save';
    const back = words('button', 'Retour', 'secondary');
    back.id = 'player-back';
    back.onclick = () => drawWho(player ? tool(player.id) : '#player-new');
    const submit = () => {
      if (!sync()) return;
      const name = nicknameFromInput(input.value);
      const next = player ? editPlayer(state, player.id, kind, name) : addPlayer(state, kind, name);
      if (!next || !savePlayers(device, next)) return fail();
      if (player) {
        state = next;
        drawOutside();
        drawWho(tool(player.id));
        return;
      }
      leave();
    };
    confirm.onclick = submit;
    input.onkeydown = (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      submit();
    };
    const form = make('div', 'player-form');
    form.append(field, confirm, back);
    show('pick', 'Choisis ton personnage', [grid, form], choices[PLAYER_CHARACTERS.indexOf(kind)]);
  }

  /** Parents: the players of this device, each with its « Supprimer ». */
  function drawManage(focus?: PlayerId) {
    const cards = make('div', 'player-cards');
    for (const player of state.players) cards.append(card(player, true));
    show(
      'manage',
      'Joueurs',
      [cards],
      (focus && cards.querySelector<HTMLElement>(tool(focus))) || close,
    );
  }
  function drawConfirm(id: PlayerId) {
    const player = state.players.find((entry) => entry.id === id);
    if (!player || !several()) return;
    const who = make('div', 'player-card');
    const face = make('div', 'player-face');
    face.append(avatar(player.character), nameOf(player));
    who.append(face);
    const text = words('p', 'Ses étoiles et son carnet seront effacés de cet appareil.');
    text.id = 'player-delete-text';
    const remove = words('button', 'Supprimer', 'danger');
    remove.id = 'player-delete';
    remove.onclick = () => erase(id);
    const keep = words('button', 'Annuler', 'secondary');
    keep.id = 'player-keep';
    keep.onclick = () => drawManage(id);
    const actions = make('div', 'player-form');
    actions.append(remove, keep);
    show('confirm', 'Supprimer ce joueur ?', [who, text, actions], keep);
  }

  /** The new choice is written: rebuild the whole page on that player's keys. */
  function leave() {
    remember(true);
    save();
    window.location.reload();
  }
  function play(id: PlayerId) {
    if (!sync()) return;
    if (id === state.activeId) {
      remember(true);
      forced = false;
      shut();
      return;
    }
    const next = selectPlayer(state, id);
    if (!next || !savePlayers(device, next)) return fail();
    leave();
  }
  function erase(id: PlayerId) {
    if (!sync()) return;
    const next = removePlayer(state, id);
    if (!next || !device) return fail();
    if (id === state.activeId) {
      // This page still holds the deleted adventure: it must not write it back while leaving.
      silence();
      if (clearPlayerData(device, id) && savePlayers(device, next)) remember(false);
      window.location.reload();
      return;
    }
    if (!clearPlayerData(device, id) || !savePlayers(device, next)) return fail();
    state = next;
    drawOutside();
    if (several()) drawManage();
    else shut();
  }

  dialog.addEventListener('cancel', (event) => {
    if (forced) event.preventDefault();
  });
  dialog.addEventListener('close', settle);
  chip.onclick = () => {
    if (!sync()) return;
    opener = chip;
    drawOutside();
    drawWho();
  };
  manage.onclick = () => {
    if (!sync()) return;
    opener = manage;
    drawOutside();
    drawManage();
  };
  // The list changed in another tab: follow it, and redraw the list this page is showing.
  window.addEventListener('storage', (event) => {
    if (event.key !== null && event.key !== PLAYERS_KEY) return;
    if (!sync()) return;
    drawOutside();
    if (!dialog.open) return;
    if (dialog.dataset.view === 'who') drawWho();
    else if (dialog.dataset.view === 'manage') {
      if (several()) drawManage();
      else shut();
    }
  });
  drawOutside();
  if (several() && !chosen()) {
    forced = true;
    drawWho();
  }
}
