import test from 'node:test';
import assert from 'node:assert/strict';
import { PLAYERS_KEY, PLAYER_CHOSEN_KEY, playerKey } from '../src/players.ts';
import type { Players } from '../src/players.ts';
import { createPlayerList } from '../src/ui/playerList.ts';

const FAMILY = 'conquete-serpents:family:v1';
const two: Players = {
  version: 1,
  activeId: 'p1',
  players: [
    { id: 'p1', character: 'hero', name: null },
    { id: 'p2', character: 'ninja', name: 'Lou' },
  ],
};

/** A device, a session and a page, with everything the list does to them in `log`. */
function stage(stored: Players | null = two, page: Players = two) {
  const log: string[] = [];
  const values = new Map<string, string>();
  if (stored) values.set(PLAYERS_KEY, JSON.stringify(stored));
  let blocked = false;
  const device = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem(key: string, value: string) {
      if (blocked) throw Error('quota');
      values.set(key, value);
      log.push(`write ${key === PLAYERS_KEY ? 'players' : key}`);
    },
    removeItem(key: string) {
      values.delete(key);
      log.push(`remove ${key}`);
    },
  } as unknown as Storage;
  const session = new Map<string, string>();
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => session.get(key) ?? null,
      setItem: (key: string, value: string) => void session.set(key, value),
      removeItem: (key: string) => void session.delete(key),
    },
  });
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { location: { reload: () => log.push('reload') } },
  });
  const list = createPlayerList({
    device,
    players: page,
    save: () => log.push('save adventure'),
    silence: () => log.push('silence'),
  });
  const active = () => (JSON.parse(values.get(PLAYERS_KEY)!) as Players).activeId;
  return {
    log,
    values,
    list,
    active,
    chosen: () => session.get(PLAYER_CHOSEN_KEY) === '1',
    choose: () => session.set(PLAYER_CHOSEN_KEY, '1'),
    block: () => (blocked = true),
  };
}

test('changing player writes the choice, saves the adventure, then reloads the page', () => {
  const { log, list, active, chosen } = stage();
  assert.equal(list.switchTo('p2'), true);
  assert.deepEqual(log, ['write players', 'save adventure', 'reload']);
  assert.equal(active(), 'p2');
  assert.equal(chosen(), true);
  // The page keeps its own player until it is rebuilt.
  assert.equal(list.state.activeId, 'p1');
});

test('a new player plays at once: written, then the page is left the same way', () => {
  const { log, list, active, values } = stage();
  assert.equal(list.join('club', 'Mia'), true);
  assert.deepEqual(log, ['write players', 'save adventure', 'reload']);
  assert.equal(active(), 'p3');
  const stored = JSON.parse(values.get(PLAYERS_KEY)!) as Players;
  assert.deepEqual(stored.players[2], { id: 'p3', character: 'club', name: 'Mia' });
});

test('when the device refuses the write nothing happens: no save, no reload, no change', () => {
  const { log, list, block, chosen } = stage();
  block();
  assert.equal(list.switchTo('p2'), false);
  assert.equal(list.join('club', null), false);
  assert.equal(list.edit('p1', 'ninja', 'Zoé'), false);
  assert.deepEqual(log, []);
  assert.equal(chosen(), false);
  assert.equal(list.me().character, 'hero');
});

test('editing changes the page and the device, and the page stays', () => {
  const { log, list } = stage();
  assert.equal(list.edit('p1', 'ninja', 'Zoé'), true);
  assert.deepEqual(log, ['write players']);
  assert.deepEqual(list.me(), { id: 'p1', character: 'ninja', name: 'Zoé' });
});

test('removing another player clears that adventure only, then the list', () => {
  const { log, list, values } = stage();
  values.set(playerKey(FAMILY, 'p2'), 'adventure of p2');
  values.set(FAMILY, 'adventure of p1');
  assert.equal(list.remove('p2'), 'removed');
  assert.equal(log.at(-1), 'write players');
  assert.equal(log.includes('reload'), false);
  assert.equal(log.includes('silence'), false);
  assert.equal(values.has(playerKey(FAMILY, 'p2')), false);
  assert.equal(values.get(FAMILY), 'adventure of p1');
  assert.equal(list.several(), false);
});

test('removing this page’s own player silences the page first, then reloads', () => {
  const { log, list, values, active, chosen, choose } = stage();
  choose();
  values.set(FAMILY, 'adventure of p1');
  assert.equal(list.remove('p1'), 'leaving');
  assert.equal(log[0], 'silence');
  assert.deepEqual(log.slice(-2), ['write players', 'reload']);
  assert.equal(log.includes('save adventure'), false);
  assert.equal(values.has(FAMILY), false);
  assert.equal(active(), 'p2');
  // « Qui joue ? » is asked again when the page comes back.
  assert.equal(chosen(), false);
});

test('the last player is never removed', () => {
  const alone: Players = { version: 1, activeId: 'p1', players: [two.players[0]] };
  const { log, list } = stage(alone, alone);
  assert.equal(list.remove('p1'), 'failed');
  assert.deepEqual(log, []);
});

test('sync follows what another tab wrote, keeping this page’s own player', () => {
  const elsewhere: Players = {
    version: 1,
    activeId: 'p2',
    players: [...two.players, { id: 'p3', character: 'club', name: null }],
  };
  const { log, list } = stage(elsewhere);
  assert.equal(list.sync(), true);
  assert.equal(list.state.players.length, 3);
  assert.equal(list.state.activeId, 'p1');
  assert.deepEqual(log, []);
});

test('a page whose player was deleted elsewhere goes silent and reloads', () => {
  const elsewhere: Players = { version: 1, activeId: 'p2', players: [two.players[1]] };
  const { log, list } = stage(elsewhere);
  assert.equal(list.sync(), false);
  assert.deepEqual(log, ['silence', 'reload']);
});

test('saying who plays is remembered for the session only', () => {
  const { list, chosen } = stage();
  assert.equal(list.chosenThisSession(), false);
  list.stay();
  assert.equal(chosen(), true);
  assert.equal(list.chosenThisSession(), true);
});
