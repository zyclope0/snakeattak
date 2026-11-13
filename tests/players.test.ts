import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PLAYERS_KEY,
  PLAYER_CHARACTERS,
  PLAYER_KEYS,
  addPlayer,
  clearPlayerData,
  createPlayers,
  editPlayer,
  freePlayerId,
  loadPlayers,
  nicknameFromInput,
  playerKey,
  playerName,
  playerStars,
  playerStorage,
  readPlayers,
  removePlayer,
  savePlayers,
  selectPlayer,
  suggestedCharacter,
  validNickname,
  validatePlayers,
} from '../src/players.ts';
import type { Players } from '../src/players.ts';
import { kinds } from '../src/data.ts';
import { Game } from '../src/game.ts';
import { createPersistence, encodeCheckpoint } from '../src/checkpoints.ts';
import { createCareer } from '../src/progression.ts';
import { createFamilyPersistence } from '../src/familyPersistence.ts';
import { readFamilyBackup, writeFamilyBackup } from '../src/familyBackup.ts';
import { createMissionProgress } from '../src/missionProgress.ts';
import { createReminderMarkers } from '../src/ui/recruitmentReminder.ts';

const FAMILY = 'conquete-serpents:family:v1';
function memory(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  const touched = new Set<string>();
  let blocked = false;
  return {
    values,
    touched,
    set blocked(value: boolean) {
      blocked = value;
    },
    getItem(key: string) {
      touched.add(key);
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      if (blocked) throw Error('quota');
      touched.add(key);
      values.set(key, value);
    },
    removeItem(key: string) {
      if (blocked) throw Error('blocked');
      touched.add(key);
      values.delete(key);
    },
  };
}
const family = (stars: number) => {
  const missions = createMissionProgress();
  missions.bestStars.refuge = Math.min(3, stars);
  missions.bestStars['trois-ponts'] = Math.max(0, stars - 3);
  return writeFamilyBackup(null, createCareer().state, missions)!;
};

test('the first launch is one player, the Héros, with no nickname', () => {
  assert.deepEqual(createPlayers(), {
    version: 1,
    activeId: 'p1',
    players: [{ id: 'p1', character: 'hero', name: null }],
  });
  assert.deepEqual(loadPlayers(memory()), createPlayers());
  assert.deepEqual(loadPlayers(undefined), createPlayers());
  assert.equal(playerName(createPlayers().players[0]), 'Héros');
});

test('eight characters of the game can be chosen and none is special', () => {
  assert.deepEqual(
    [...PLAYER_CHARACTERS],
    ['hero', 'club', 'archer', 'ninja', 'knight', 'dragon', 'dino', 'triceratops'],
  );
  for (const kind of PLAYER_CHARACTERS) assert.ok(kinds[kind].name.length > 0);
});

test('stored players are rebuilt field by field; anything unexpected gives the default state', () => {
  const good: Players = {
    version: 1,
    activeId: 'p3',
    players: [
      { id: 'p1', character: 'hero', name: null },
      { id: 'p3', character: 'dragon', name: 'Lou <ami>' },
      { id: 'p2', character: 'dragon', name: null },
    ],
  };
  const read = readPlayers(JSON.stringify({ ...good, extra: 'ignored' }));
  assert.deepEqual(read, good);
  assert.notEqual(read.players, good.players);
  assert.deepEqual(Object.keys(validatePlayers({ ...good, extra: 1 })!), [
    'version',
    'activeId',
    'players',
  ]);
  const bad: unknown[] = [
    null,
    [],
    'text',
    { ...good, version: 2 },
    { ...good, activeId: 'p4' },
    { ...good, activeId: 'p9' },
    { ...good, players: [] },
    { ...good, players: {} },
    { ...good, players: [...good.players, good.players[0]] },
    {
      ...good,
      players: [
        ...good.players,
        { id: 'p4', character: 'ninja', name: null },
        { id: 'p5', character: 'ninja', name: null },
      ],
    },
    { ...good, players: [{ id: 'p0', character: 'hero', name: null }], activeId: 'p0' },
    { ...good, players: [{ id: 'p1', character: 'wall', name: null }], activeId: 'p1' },
    { ...good, players: [{ id: 'p1', character: 'trex', name: null }], activeId: 'p1' },
    { ...good, players: [{ id: 'p1', character: 'hero' }], activeId: 'p1' },
    { ...good, players: [{ id: 'p1', character: 'hero', name: '' }], activeId: 'p1' },
    { ...good, players: [{ id: 'p1', character: 'hero', name: ' Lou' }], activeId: 'p1' },
    { ...good, players: [{ id: 'p1', character: 'hero', name: 'a\nb' }], activeId: 'p1' },
    { ...good, players: [{ id: 'p1', character: 'hero', name: 'x'.repeat(17) }], activeId: 'p1' },
    { ...good, players: [{ id: 'p1', character: 'hero', name: 7 }], activeId: 'p1' },
    { ...good, players: [null], activeId: 'p1' },
  ];
  for (const value of bad) {
    assert.equal(validatePlayers(value), null, JSON.stringify(value));
    assert.deepEqual(readPlayers(JSON.stringify(value)), createPlayers());
  }
  // A sparse array or a getter never reaches the stored state.
  const sparse = { ...good, players: [good.players[0], , good.players[1]] };
  assert.equal(validatePlayers(sparse), null);
  assert.deepEqual(readPlayers('{not json'), createPlayers());
  assert.deepEqual(readPlayers(null), createPlayers());
  assert.deepEqual(readPlayers(' '.repeat(2001)), createPlayers());
  const throwing = {
    getItem() {
      throw Error('blocked');
    },
  };
  assert.deepEqual(loadPlayers(throwing), createPlayers());
});

test('the list of players is written under its own device-wide key, and refused when invalid', () => {
  const device = memory();
  const two = addPlayer(createPlayers(), 'dragon', 'Zoé')!;
  assert.equal(savePlayers(device, two), true);
  assert.deepEqual([...device.values.keys()], [PLAYERS_KEY]);
  assert.deepEqual(loadPlayers(device), two);
  assert.equal(savePlayers(device, { ...two, activeId: 'p4' }), false);
  assert.deepEqual(loadPlayers(device), two);
  device.blocked = true;
  assert.equal(savePlayers(device, createPlayers()), false);
  assert.equal(savePlayers(undefined, createPlayers()), false);
  assert.deepEqual(loadPlayers(device), two);
});

test('a nickname is optional, short, and kept as typed', () => {
  assert.equal(nicknameFromInput(''), null);
  assert.equal(nicknameFromInput('   '), null);
  assert.equal(nicknameFromInput(undefined), null);
  assert.equal(nicknameFromInput('  Lou  '), 'Lou');
  assert.equal(nicknameFromInput('Lou <ami>'), 'Lou <ami>');
  assert.equal(nicknameFromInput('Massue'), 'Massue');
  assert.equal(nicknameFromInput('Zoé  la  1re'), 'Zoé  la  1re');
  assert.equal(nicknameFromInput('Chevalier Léo 07'), 'Chevalier Léo 07');
  assert.equal(nicknameFromInput('Chevalier Léo 07 !'), 'Chevalier Léo 07');
  assert.equal(nicknameFromInput('a\u0000b\nc\u0085d'), 'abcd');
  assert.equal(nicknameFromInput('\n\t'), null);
  // Fifteen letters then an emoji of two code units: the emoji is not cut in half.
  assert.equal(nicknameFromInput('x'.repeat(15) + '🐍'), 'x'.repeat(15));
  assert.equal(nicknameFromInput('x'.repeat(14) + '🐍'), 'x'.repeat(14) + '🐍');
  for (const name of ['L', 'Lou', 'x'.repeat(16), 'Lou <ami>', '🐍'])
    assert.ok(validNickname(name));
  for (const name of ['', ' ', ' Lou', 'Lou ', 'x'.repeat(17), 'a\tb', 'a\u007fb', 3, null, []])
    assert.equal(validNickname(name), false, JSON.stringify(name));
});

test('player 1 keeps the historical keys; players 2 to 4 get a suffix; device keys never move', () => {
  assert.deepEqual(PLAYER_KEYS, [
    'conquete-serpents:family:v1',
    'conquete-serpents:camp:v1',
    'conquete-serpents:progress:v1',
    'conquete-serpents:recruitment-reminder:v1',
  ]);
  for (const key of PLAYER_KEYS) {
    assert.equal(playerKey(key, 'p1'), key);
    assert.equal(playerKey(key, 'p2'), key + ':p2');
    assert.equal(playerKey(key, 'p3'), key + ':p3');
    assert.equal(playerKey(key, 'p4'), key + ':p4');
  }
  for (const key of [
    PLAYERS_KEY,
    'conquete-serpents:sound:v1',
    'conquete-serpents:language:v1',
    'conquete-serpents:visual:v1',
    'something-else',
  ])
    for (const id of ['p1', 'p2', 'p3', 'p4'] as const) assert.equal(playerKey(key, id), key);
});

test('the persistence code only ever touches the four keys of its player', () => {
  for (const id of ['p1', 'p2', 'p4'] as const) {
    const device = memory();
    const storage = playerStorage(device, id);
    const game = new Game(7);
    createPersistence(storage).load();
    createPersistence(storage).sync(game);
    const career = createCareer(storage);
    career.sync(game);
    const persistence = createFamilyPersistence(storage);
    persistence.load();
    assert.equal(persistence.sync(encodeCheckpoint(game), career.state), true);
    createReminderMarkers(storage, []).mark('PONTS-1-0000-7X8R-A1');
    const expected = PLAYER_KEYS.map((key) => (id === 'p1' ? key : `${key}:${id}`)).sort();
    assert.deepEqual([...device.touched].sort(), expected);
    assert.deepEqual([...device.values.keys()].sort(), expected);
  }
});

test('a save from before the players is player 1, read without any migration', () => {
  const legacy = family(5);
  const device = memory({ [FAMILY]: legacy });
  const players = loadPlayers(device);
  assert.deepEqual(players, createPlayers());
  const loaded = createFamilyPersistence(playerStorage(device, players.activeId)).load()!;
  assert.deepEqual(loaded, readFamilyBackup(legacy));
  assert.equal(playerStars(device, 'p1'), 5);
  // Nothing was rewritten, renamed or added by reading it.
  assert.deepEqual([...device.values.entries()], [[FAMILY, legacy]]);
});

test('each player has an own adventure; stars are read without switching', () => {
  const device = memory({ [FAMILY]: family(5) });
  const second = playerStorage(device, 'p2');
  assert.equal(createFamilyPersistence(second).load(), null);
  second.setItem(FAMILY, family(2));
  assert.equal(device.values.get(FAMILY), family(5));
  assert.equal(device.values.get(FAMILY + ':p2'), family(2));
  assert.equal(playerStars(device, 'p1'), 5);
  assert.equal(playerStars(device, 'p2'), 2);
  assert.equal(playerStars(device, 'p3'), 0);
  assert.equal(playerStars(undefined, 'p1'), 0);
  device.values.set(FAMILY + ':p4', '{broken');
  assert.equal(playerStars(device, 'p4'), 0);
});

test('a closed storage neither reads nor writes: the page being left stays silent', () => {
  const device = memory({ [FAMILY]: 'kept' });
  const storage = playerStorage(device, 'p1');
  assert.equal(storage.getItem(FAMILY), 'kept');
  storage.close();
  assert.equal(storage.getItem(FAMILY), null);
  storage.setItem(FAMILY, 'rewritten');
  storage.removeItem(FAMILY);
  assert.equal(device.values.get(FAMILY), 'kept');
});

test('adding: up to four players, the same character twice, the new player becomes active', () => {
  let state = createPlayers();
  assert.equal(suggestedCharacter(state), 'club');
  state = addPlayer(state, 'hero', null)!;
  assert.deepEqual(state.players[1], { id: 'p2', character: 'hero', name: null });
  assert.equal(state.activeId, 'p2');
  state = addPlayer(state, 'dragon', 'Zoé')!;
  state = addPlayer(state, 'club', 'Chevalier Léo 07')!;
  assert.deepEqual(
    state.players.map((player) => player.id),
    ['p1', 'p2', 'p3', 'p4'],
  );
  assert.equal(state.activeId, 'p4');
  assert.equal(freePlayerId(state), null);
  assert.equal(addPlayer(state, 'ninja', null), null);
  assert.equal(suggestedCharacter(state), 'archer');
  assert.equal(addPlayer(createPlayers(), 'wall' as never, null), null);
  assert.equal(addPlayer(createPlayers(), 'hero', ' padded '), null);
  assert.equal(playerName(state.players[2]), 'Zoé');
  assert.equal(playerName(state.players[1]), 'Héros');
});

test('editing changes the character and the nickname only', () => {
  const state = addPlayer(addPlayer(createPlayers(), 'dragon', 'Zoé')!, 'ninja', null)!;
  const edited = editPlayer(state, 'p2', 'triceratops', null)!;
  assert.deepEqual(edited.players, [
    { id: 'p1', character: 'hero', name: null },
    { id: 'p2', character: 'triceratops', name: null },
    { id: 'p3', character: 'ninja', name: null },
  ]);
  assert.equal(edited.activeId, state.activeId);
  assert.equal(state.players[1].character, 'dragon');
  assert.equal(editPlayer(state, 'p4', 'hero', null), null);
  assert.equal(editPlayer(state, 'p2', 'hero', 'x'.repeat(17)), null);
  assert.equal(selectPlayer(state, 'p1')!.activeId, 'p1');
  assert.deepEqual(selectPlayer(state, 'p1')!.players, state.players);
  assert.equal(selectPlayer(state, 'p4'), null);
});

test('deleting removes that player and its four keys only; the last player stays', () => {
  const device = memory();
  for (const id of ['p1', 'p2', 'p3'] as const)
    for (const key of PLAYER_KEYS) device.values.set(playerKey(key, id), `${id}-data`);
  device.values.set(PLAYERS_KEY, 'players');
  device.values.set('conquete-serpents:sound:v1', '11');
  let state = addPlayer(addPlayer(createPlayers(), 'dragon', null)!, 'ninja', null)!;
  assert.equal(state.activeId, 'p3');

  assert.equal(clearPlayerData(device, 'p2'), true);
  state = removePlayer(state, 'p2')!;
  assert.deepEqual(
    state.players.map((player) => player.id),
    ['p1', 'p3'],
  );
  assert.equal(state.activeId, 'p3');
  for (const key of PLAYER_KEYS) {
    assert.equal(device.values.get(key), 'p1-data');
    assert.equal(device.values.has(key + ':p2'), false);
    assert.equal(device.values.get(key + ':p3'), 'p3-data');
  }
  assert.equal(device.values.get(PLAYERS_KEY), 'players');
  assert.equal(device.values.get('conquete-serpents:sound:v1'), '11');
  // The freed id serves again, and nothing of the former player is left under it.
  assert.equal(freePlayerId(state), 'p2');
  assert.equal(playerStars(device, 'p2'), 0);

  // Deleting the active player hands over to the first one left.
  state = removePlayer(state, 'p3')!;
  assert.deepEqual(state, createPlayers());
  assert.equal(removePlayer(state, 'p1'), null);
  assert.equal(removePlayer(state, 'p2'), null);

  // Deleting player 1 while another remains clears the historical keys.
  const others = addPlayer(createPlayers(), 'archer', null)!;
  assert.equal(clearPlayerData(device, 'p1'), true);
  const left = removePlayer(others, 'p1')!;
  assert.deepEqual(left, {
    version: 1,
    activeId: 'p2',
    players: [{ id: 'p2', character: 'archer', name: null }],
  });
  for (const key of PLAYER_KEYS) assert.equal(device.values.has(key), false);
  assert.equal(freePlayerId(left), 'p1');

  device.blocked = true;
  assert.equal(clearPlayerData(device, 'p3'), false);
  assert.equal(clearPlayerData(undefined, 'p3'), false);
});
