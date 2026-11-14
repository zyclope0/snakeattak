import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { createStageGame, planVoyage } from '../src/voyage.ts';
import {
  bonusOffer,
  chooseBonus,
  readVoyageState,
  recordStage,
  stageGame,
  startVoyage,
  voyagePhase,
  voyagePlanOf,
} from '../src/voyageState.ts';
import type { VoyageState } from '../src/voyageState.ts';
import { decodeVoyage, encodeVoyage } from '../src/voyageCode.ts';
import { decodeDeparture, encodeDeparture } from '../src/departures.ts';
import {
  VOYAGE_STORAGE_KEY,
  createVoyageLog,
  loadVoyageLog,
  logVoyage,
  saveVoyageLog,
  validateVoyageLog,
} from '../src/voyageStorage.ts';
import { PLAYER_KEYS, clearPlayerData, playerStorage } from '../src/players.ts';
import { fight, memory } from './voyage-helpers.ts';

const SEED = 31337;
const plan = planVoyage(SEED)!;
const start = startVoyage(SEED)!;

/** Wins the stage that is due, on the real engine. */
const winStage = (state: VoyageState) => recordStage(state, fight(stageGame(state)!, 'won'))!;
/** A voyage with `won` stages behind it and a card kept after each of them. */
function travelled(won: number, seed = SEED): VoyageState {
  const voyage = planVoyage(seed)!;
  return readVoyageState({
    version: 1,
    seed,
    won,
    bag: voyage.stages.slice(0, won).map((stage) => stage.offer[0]),
    status: 'travelling',
  })!;
}

test('a voyage starts at its first stage with an empty bag', () => {
  assert.deepEqual(start, { version: 1, seed: SEED, won: 0, bag: [], status: 'travelling' });
  assert.ok(Object.isFrozen(start) && Object.isFrozen(start.bag));
  assert.equal(voyagePhase(start), 'stage');
  assert.deepEqual(bonusOffer(start), []);
  assert.deepEqual(voyagePlanOf(start), plan);
  for (const seed of [-1, 1 << 20, 0.5, NaN, '3', null])
    assert.equal(startVoyage(seed as number), null);
  assert.equal(startVoyage(SEED, 2 as 1), null);
});

test('a whole voyage: stage, card, stage, card… until the king', () => {
  let state = start;
  for (let index = 0; index < 5; index++) {
    assert.equal(voyagePhase(state), 'stage');
    assert.equal(state.won, index);
    const game = stageGame(state)!;
    assert.deepEqual(game.mission, plan.stages[index].run);
    assert.deepEqual(game.stage!.bag, state.bag);
    // Nothing is recorded while the stage is still being played.
    assert.equal(recordStage(state, game), null);
    assert.equal(chooseBonus(state, plan.stages[index].offer[0]), null);
    state = recordStage(state, fight(game, 'won'))!;
    assert.equal(state.won, index + 1);
    if (index === 4) break;
    assert.equal(voyagePhase(state), 'bonus');
    assert.deepEqual(bonusOffer(state), plan.stages[index].offer);
    // The next stage waits for the card.
    assert.equal(stageGame(state), null);
    const card = plan.stages[index].offer[index % 3];
    state = chooseBonus(state, card)!;
    assert.equal(state.bag[index], card);
  }
  assert.deepEqual(state, {
    version: 1,
    seed: SEED,
    won: 5,
    bag: [0, 1, 2, 3].map((index) => plan.stages[index].offer[index % 3]),
    status: 'arrived',
  });
  assert.equal(voyagePhase(state), 'arrived');
  assert.equal(stageGame(state), null);
  assert.deepEqual(bonusOffer(state), []);
  assert.equal(chooseBonus(state, 'pieces'), null);
});

test('a card must be one of the three offered, and is chosen once', () => {
  const state = winStage(start);
  const offer = bonusOffer(state);
  assert.equal(offer.length, 3);
  const notOffered = (
    ['miel', 'cristal', 'pieces', 'renfort-ninja', 'renfort-raptor'] as const
  ).find((card) => !offer.includes(card))!;
  for (const card of [notOffered, 'skip', '', null, undefined, 0, ['miel']])
    assert.equal(chooseBonus(state, card), null, String(card));
  const chosen = chooseBonus(state, offer[1])!;
  assert.deepEqual(chosen.bag, [offer[1]]);
  assert.equal(chooseBonus(chosen, offer[0]), null);
  // The state is a value: choosing never changed the one before.
  assert.deepEqual(state.bag, []);
});

test('a fallen camp ends the voyage where it stands', () => {
  const state = travelled(2);
  const fallen = recordStage(state, fight(stageGame(state)!, 'lost'))!;
  assert.deepEqual(fallen, { ...state, status: 'fallen' });
  assert.equal(voyagePhase(fallen), 'fallen');
  assert.equal(stageGame(fallen), null);
  assert.deepEqual(bonusOffer(fallen), []);
  assert.equal(chooseBonus(fallen, plan.stages[2].offer[0]), null);
  assert.equal(recordStage(fallen, fight(createStageGame(plan, 2, fallen.bag)!, 'won')), null);
  // The same voyage can be started again from its seed.
  assert.deepEqual(startVoyage(fallen.seed), start);
});

test('only the stage that is due can be recorded', () => {
  const state = travelled(1);
  const due = stageGame(state)!;
  const strangers = [
    new Game(due.mission!.seed, undefined, due.mission!),
    createStageGame(plan, 0, [])!,
    createStageGame(plan, 2, state.bag)!,
    createStageGame(plan, 1, [])!,
    createStageGame(plan, 1, [plan.stages[0].offer[1]])!,
    createStageGame(planVoyage(SEED + 1)!, 1, [planVoyage(SEED + 1)!.stages[0].offer[0]])!,
    new Game(7),
  ];
  for (const game of strangers) {
    game.status = 'won';
    game.wave = game.totalWaves;
    assert.equal(recordStage(state, game), null);
    game.status = 'lost';
    assert.equal(recordStage(state, game), null);
  }
  // A stage marked won before its last wave is not a stage won.
  due.status = 'won';
  assert.equal(recordStage(state, due), null);
  due.wave = due.totalWaves;
  assert.equal(recordStage(state, due)!.won, 2);
});

test('every state a voyage goes through reads back the same, and nothing else does', () => {
  const reachable: VoyageState[] = [start];
  for (let won = 1; won <= 4; won++) {
    const picked = travelled(won);
    reachable.push(picked, readVoyageState({ ...picked, bag: picked.bag.slice(0, -1) })!);
    reachable.push(readVoyageState({ ...picked, status: 'fallen' })!);
  }
  reachable.push(readVoyageState({ ...start, status: 'fallen' })!);
  reachable.push(readVoyageState({ ...travelled(4), won: 5, status: 'arrived' })!);
  for (const state of reachable) {
    assert.ok(state);
    assert.deepEqual(readVoyageState(JSON.parse(JSON.stringify(state))), state);
  }
  const good = travelled(3);
  const stranger = planVoyage(SEED)!.stages[1].offer;
  const neverOffered = (['miel', 'cristal', 'pieces'] as const).find((c) => !stranger.includes(c))!;
  const damaged: unknown[] = [
    null,
    undefined,
    7,
    'voyage',
    [],
    {},
    { ...good, version: 0 },
    { ...good, version: 2 },
    { ...good, version: '1' },
    { ...good, seed: -1 },
    { ...good, seed: 1 << 20 },
    { ...good, seed: 2.5 },
    { ...good, seed: String(SEED) },
    { ...good, won: -1 },
    { ...good, won: 2.5 },
    { ...good, won: 6 },
    { ...good, won: 5, status: 'arrived' },
    { ...good, status: 'arrived' },
    { ...good, status: 'lost' },
    { ...good, status: null },
    { ...good, bag: null },
    { ...good, bag: 'miel' },
    { ...good, bag: [] },
    { ...good, bag: [...good.bag, good.bag[0]] },
    { ...good, bag: [good.bag[0], neverOffered, good.bag[2]] },
    { ...good, bag: [good.bag[0], 'skip', good.bag[2]] },
    { ...good, bag: [good.bag[0], 3, good.bag[2]] },
    { ...good, bag: good.bag.slice(0, 2), status: 'fallen' },
    { ...travelled(4), won: 5, status: 'travelling' },
    { ...travelled(4), won: 5, status: 'fallen' },
    { ...start, won: 0, bag: [plan.stages[0].offer[0]] },
    { version: 1, seed: SEED, won: 0, status: 'travelling' },
  ];
  for (const raw of damaged) assert.equal(readVoyageState(raw), null, JSON.stringify(raw));
  // Reading rebuilds the state: a field the game does not know is dropped, not kept.
  assert.deepEqual(readVoyageState({ ...good, coins: 999, bag: [...good.bag] }), good);
});

test('a voyage code names the seed and reads back, however a child types it', () => {
  const pattern = /^VOYAGE-1-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{2}$/;
  for (let seed = 0; seed <= 0xfffff; seed += 997) {
    const code = encodeVoyage(seed)!;
    assert.match(code, pattern);
    assert.deepEqual(decodeVoyage(code), { ok: true, seed, version: 1 });
  }
  // The writing is part of the format: these codes must keep their exact text.
  assert.equal(encodeVoyage(0), 'VOYAGE-1-0000-ND');
  assert.equal(encodeVoyage(SEED), 'VOYAGE-1-0YK9-AY');
  assert.equal(encodeVoyage(0xfffff), 'VOYAGE-1-ZZZZ-5X');
  const code = encodeVoyage(SEED)!;
  for (const typed of [
    code.toLowerCase(),
    `  ${code}  `,
    code.replace(/-/g, ' - '),
    code.replace('VOYAGE', 'Voyagé'),
    code.replace(/0/g, 'O'),
    code.replace(/0/g, 'o'),
    // The dashes help to read the code aloud; a child may leave them out.
    code.replace(/-/g, ''),
    code.replace(/-/g, ' ').toLowerCase(),
    code.replace(/-/g, '_'),
    code.replace('-', ''),
  ])
    assert.deepEqual(decodeVoyage(typed), { ok: true, seed: SEED, version: 1 }, typed);
  // Seed 33 is written 0011: an l or an I typed for a 1 is read as the 1 it looks like.
  const [word, version, signs, check] = encodeVoyage(33)!.split('-');
  assert.equal(signs, '0011');
  const lookalike = `${word}-${version}-${signs.replace(/1/g, 'l')}-${check.replace(/1/g, 'I')}`;
  assert.deepEqual(decodeVoyage(lookalike), { ok: true, seed: 33, version: 1 });
  for (const seed of [-1, 1 << 20, 1.5, NaN]) assert.equal(encodeVoyage(seed), null);
  assert.equal(encodeVoyage(SEED, 2 as 1), null);
});

test('a damaged code is refused with a reason, never with an exception', () => {
  const code = encodeVoyage(SEED)!;
  const [word, version, signs, check] = code.split('-');
  const refusals: [unknown, string][] = [
    [`${word}-2-${signs}-${check}`, 'version'],
    [`${word}-0-${signs}-${check}`, 'version'],
    [`${word}-9-${signs}-${check}`, 'version'],
    [`${word}-${version}-${signs}-00`, 'checksum'],
    [`${word}-${version}-${signs.slice(0, 3)}${signs[3] === '7' ? '8' : '7'}-${check}`, 'checksum'],
    [`VOYAGES-${version}-${signs}-${check}`, 'format'],
    [`AVENTURE-${version}-${signs}-${check}`, 'format'],
    [`${word}-${version}-${signs}`, 'format'],
    [`${word}-${version}-${signs}-${check}-${check}`, 'format'],
    [`${word}-${version}-${signs}X-${check}`, 'format'],
    [`${word}-${version}-${signs.slice(1)}-${check}`, 'format'],
    [`${word}-${version}-U${signs.slice(1)}-${check}`, 'format'],
    [`${word}${version}${signs}${check}${check}`, 'format'],
    [`${word}${signs}${check}`, 'format'],
    [`${word}-A-${signs}-${check}`, 'format'],
    [code + ' '.repeat(80), 'format'],
    ['', 'format'],
    ['VOYAGE', 'format'],
    [SEED, 'format'],
    [null, 'format'],
    [undefined, 'format'],
    [{ seed: SEED }, 'format'],
    [[code], 'format'],
  ];
  for (const [typed, reason] of refusals)
    assert.deepEqual(decodeVoyage(typed), { ok: false, reason }, String(typed));
  // One wrong sign is caught, bar the rare text that still adds up (two check signs).
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  let tried = 0;
  let accepted = 0;
  for (const position of [9, 10, 11, 12, 14, 15])
    for (const sign of alphabet) {
      if (sign === code[position]) continue;
      const typed = code.slice(0, position) + sign + code.slice(position + 1);
      const read = decodeVoyage(typed);
      tried++;
      if (read.ok) accepted++;
      assert.ok(!read.ok || read.seed !== SEED, typed);
    }
  assert.ok(accepted <= tried * 0.02, `${accepted} wrong codes accepted out of ${tried}`);
});

test('voyage codes and departure codes never read each other', () => {
  assert.equal(decodeDeparture(encodeVoyage(SEED)).ok, false);
  const departure = encodeDeparture({ kind: 'classic', seed: SEED, balance: 2 });
  assert.equal(decodeVoyage(departure).ok, false);
  assert.equal(decodeVoyage(encodeDeparture({ kind: 'classic', seed: 5 })).ok, false);
});

test('the log keeps the voyage under way and a personal record that never goes down', () => {
  let log = createVoyageLog();
  assert.deepEqual(log, { version: 1, best: 0, current: null });
  log = logVoyage(log, start)!;
  assert.deepEqual(log, { version: 1, best: 0, current: start });
  log = logVoyage(log, travelled(3))!;
  assert.equal(log.best, 3);
  // A new voyage replaces the current one; the record stays.
  const other = startVoyage(77)!;
  log = logVoyage(log, other)!;
  assert.deepEqual(log, { version: 1, best: 3, current: other });
  log = logVoyage(log, readVoyageState({ ...travelled(1, 77), status: 'fallen' })!)!;
  assert.equal(log.best, 3);
  log = logVoyage(log, readVoyageState({ ...travelled(4), won: 5, status: 'arrived' })!)!;
  assert.equal(log.best, 5);
  assert.equal(logVoyage(log, { ...start, won: 9 }), null);
});

test('the log is saved and read back; damaged or refused storage is a fresh log', () => {
  const device = memory();
  const log = logVoyage(createVoyageLog(), travelled(2))!;
  assert.deepEqual(loadVoyageLog(device), createVoyageLog());
  assert.equal(device.values.size, 0, 'reading writes nothing');
  assert.equal(saveVoyageLog(device, log), true);
  assert.deepEqual([...device.values.keys()], [VOYAGE_STORAGE_KEY]);
  assert.deepEqual(loadVoyageLog(device), log);
  assert.deepEqual(JSON.parse(device.values.get(VOYAGE_STORAGE_KEY)!), log);

  assert.deepEqual(loadVoyageLog(undefined), createVoyageLog());
  assert.equal(saveVoyageLog(undefined, log), false);
  const stored = device.values.get(VOYAGE_STORAGE_KEY)!;
  for (const damaged of [
    '',
    '{',
    'null',
    '[]',
    '7',
    '"voyage"',
    stored.slice(0, -1),
    stored.replace('"best":2', '"best":1'),
    stored.replace('"best":2', '"best":6'),
    stored.replace('"best":2', '"best":"2"'),
    stored.replace('"version":1,"best"', '"version":2,"best"'),
    stored.replace('"won":2', '"won":3'),
    stored.replace('"current":', '"current":[],"other":'),
    JSON.stringify({ version: 1, best: 0 }),
    JSON.stringify({ ...log, current: { ...log.current, bag: ['skip', 'skip'] } }),
    ' '.repeat(2001),
    stored + ' '.repeat(2000),
  ]) {
    device.values.set(VOYAGE_STORAGE_KEY, damaged);
    assert.deepEqual(loadVoyageLog(device), createVoyageLog(), damaged.slice(0, 60));
  }
  for (const invalid of [
    null,
    {},
    { ...log, best: 1 },
    { ...log, best: 6 },
    { ...log, version: 2 },
  ])
    assert.equal(validateVoyageLog(invalid), null);
  assert.equal(saveVoyageLog(device, { ...log, best: 1 }), false);

  device.values.set(VOYAGE_STORAGE_KEY, stored);
  device.blocked = true;
  assert.deepEqual(loadVoyageLog(device), createVoyageLog());
  assert.equal(saveVoyageLog(device, log), false);
  device.blocked = false;
  assert.equal(device.values.get(VOYAGE_STORAGE_KEY), stored, 'a refused write changes nothing');
});

test('each player has an own voyage, and never writes in the voyage of another', () => {
  assert.ok(PLAYER_KEYS.includes(VOYAGE_STORAGE_KEY));
  const device = memory();
  const logs = {
    p1: logVoyage(createVoyageLog(), travelled(1))!,
    p2: logVoyage(createVoyageLog(), travelled(3, 77))!,
    p4: logVoyage(createVoyageLog(), startVoyage(4)!)!,
  };
  const ids = ['p1', 'p2', 'p4'] as const;
  for (const [turn, id] of ids.entries()) {
    assert.equal(saveVoyageLog(playerStorage(device, id), logs[id]), true);
    // After each write, every player reads exactly what that player wrote, or nothing yet.
    for (const [index, other] of ids.entries())
      assert.deepEqual(
        loadVoyageLog(playerStorage(device, other)),
        index <= turn ? logs[other] : createVoyageLog(),
      );
  }
  assert.deepEqual(
    [...device.values.keys()].sort(),
    [VOYAGE_STORAGE_KEY, `${VOYAGE_STORAGE_KEY}:p2`, `${VOYAGE_STORAGE_KEY}:p4`].sort(),
  );
  assert.deepEqual(loadVoyageLog(playerStorage(device, 'p3')), createVoyageLog());
  // Deleting a player removes that player's voyage and nothing else.
  assert.equal(clearPlayerData(device, 'p2'), true);
  assert.deepEqual(loadVoyageLog(playerStorage(device, 'p2')), createVoyageLog());
  assert.deepEqual(loadVoyageLog(playerStorage(device, 'p1')), logs.p1);
  assert.deepEqual(loadVoyageLog(playerStorage(device, 'p4')), logs.p4);
  // A closed storage, left behind by a player who was just deleted, stays silent.
  const closed = playerStorage(device, 'p4');
  closed.close();
  saveVoyageLog(closed, logs.p1);
  assert.deepEqual(loadVoyageLog(playerStorage(device, 'p4')), logs.p4);
});
