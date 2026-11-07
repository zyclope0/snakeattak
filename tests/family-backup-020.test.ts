import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { decodeCheckpoint, encodeCheckpoint } from '../src/checkpoints.ts';
import { createCareer, readCareerState } from '../src/progression.ts';
import { createCampMemory } from '../src/campMemory.ts';
import * as family from '../src/familyBackup.ts';

function camp(wave = 0) {
  const game = new Game(123);
  game.wave = wave;
  game.gold = 777;
  game.units.shift();
  game.units[0].hp = 41;
  if (wave === 4 || wave === 8) game.rewards.pending = wave;
  return encodeCheckpoint(game)!;
}

test('family round trip preserves the exact survivors, economy, RNG and pending reward', () => {
  const career = createCareer();
  const game = decodeCheckpoint(camp(4))!;
  game.campaign.chapterStars[0] = 3;
  career.sync(game);
  const raw = family.writeFamilyBackup(encodeCheckpoint(game), career.state)!;
  assert.ok(raw);
  const restored = family.readFamilyBackup(raw)!;
  const loaded = decodeCheckpoint(restored.camp!)!;
  assert.equal(loaded.units.length, 2);
  assert.equal(loaded.units[0].hp, 41);
  assert.equal(loaded.gold, 777);
  assert.equal(loaded.rng, 123);
  assert.equal(loaded.rewards.pending, 4);
  assert.deepEqual(loaded.rewards.choices, []);
  assert.deepEqual(family.backupSummary(restored), {
    wave: 4,
    allies: 2,
    gold: 777,
    bestStars: [3, 0, 0],
  });
});

test('profile-only import is explicit and final stars do not invent a won checkpoint', () => {
  const career = createCareer();
  const game = new Game(123);
  game.status = 'won';
  game.wave = 12;
  game.campaign.chapterStars = [3, 2, 3];
  career.sync(game);
  assert.equal(family.writeFamilyBackup(encodeCheckpoint(game), career.state) !== null, true);
  const data = family.readFamilyBackup(family.writeFamilyBackup(null, career.state)!)!;
  assert.equal(data.camp, null);
  assert.deepEqual(family.backupSummary(data), {
    wave: null,
    allies: 0,
    gold: null,
    bestStars: [3, 2, 3],
  });
});

test('legacy camps become canonical with unknown keys removed at every boundary', () => {
  const legacy = { ...JSON.parse(camp(4)), version: 1, ignored: 'payload' };
  delete legacy.campaign;
  delete legacy.rewards;
  for (const unit of legacy.units) delete unit.homeX;
  const career = { ...createCareer().state, ignored: 'payload' };
  career.chapterCamps[0] = JSON.stringify(legacy);
  const data = family.readFamilyBackup(
    JSON.stringify({
      format: 'conquete-serpents-family',
      version: 1,
      camp: JSON.stringify(legacy),
      career,
      ignored: 'payload',
    }),
  )!;
  assert.ok(data);
  assert.equal(Object.hasOwn(data, 'ignored'), false);
  assert.equal(Object.hasOwn(data.career, 'ignored'), false);
  assert.equal(JSON.parse(data.camp!).version, 6);
  assert.equal(Object.hasOwn(JSON.parse(data.camp!), 'ignored'), false);
  assert.equal(JSON.parse(data.career.chapterCamps[0]!).version, 6);
  assert.equal(decodeCheckpoint(data.camp!)!.gold, 777);
});

test('family reader and writer reject malformed, incompatible, oversized and sparse data', () => {
  const good = {
    format: 'conquete-serpents-family',
    version: 1,
    camp: camp(),
    career: createCareer().state,
  };
  for (const bad of [
    null,
    [],
    {},
    { ...good, version: 2 },
    { ...good, format: 'other' },
    { ...good, camp: 'bad' },
    { ...good, camp: 3 },
    { ...good, career: { ...good.career, bestStars: [3, null, 0] } },
    { ...good, career: { ...good.career, chapterCamps: [null, camp(4)] } },
    { ...good, ignored: 'x'.repeat(500000) },
    { ...good, ignored: '界'.repeat(340000) },
  ])
    assert.equal(family.readFamilyBackup(JSON.stringify(bad)), null);
  assert.equal(family.readFamilyBackup('{'), null);
  assert.equal(family.writeFamilyBackup('bad', good.career), null);
  const sparse = createCareer().state;
  Reflect.deleteProperty(sparse.bestStars, '0');
  assert.equal(family.writeFamilyBackup(null, sparse), null);
  assert.equal(family.writeFamilyBackup(null, { ...good.career, activeRoster: 9 } as never), null);
});

test('career replacement validates before modifying, makes defensive copies and never writes legacy storage', () => {
  let writes = 0;
  const storage = {
    getItem: () => null,
    setItem: () => {
      writes++;
    },
  };
  const imported = createCareer().state;
  imported.bestStars = [3, 2, 1];
  const career = createCareer(storage, imported);
  imported.bestStars[0] = 0;
  assert.deepEqual(career.state.bestStars, [3, 2, 1]);
  const replacement = createCareer().state;
  replacement.activeRoster = 2;
  assert.equal(career.replaceState(replacement), true);
  replacement.rosters[0][0] = 'hero';
  assert.equal(career.state.activeRoster, 2);
  assert.equal(career.state.rosters[0][0], 'club');
  assert.equal(career.replaceState({ ...replacement, bestStars: [99, 0, 0] }), false);
  assert.equal(career.state.activeRoster, 2);
  assert.equal(writes, 0);
  assert.equal(readCareerState(JSON.stringify({ ...replacement, activeRoster: 9 })), null);
});

test('camp memory validates replacements and explicit null removes the old army', () => {
  const memory = createCampMemory(decodeCheckpoint(camp())!);
  const old = memory.raw();
  assert.ok(old);
  assert.equal(memory.replace('invalid'), false);
  assert.equal(memory.raw(), old);
  assert.equal(memory.replace(camp(4)), true);
  assert.equal(memory.load()!.wave, 4);
  assert.equal(memory.replace(null), true);
  assert.equal(memory.raw(), null);
  assert.equal(memory.load(), null);
});

test('character and UTF-8 byte boundaries are accepted exactly and rejected one over', () => {
  const envelope = {
    format: 'conquete-serpents-family',
    version: 1,
    camp: null,
    career: createCareer().state,
    ignored: '',
  };
  const base = JSON.stringify(envelope).length;
  envelope.ignored = 'x'.repeat(500000 - base);
  const characters = JSON.stringify(envelope);
  assert.equal(characters.length, 500000);
  assert.ok(family.readFamilyBackup(characters));
  envelope.ignored += 'x';
  assert.equal(family.readFamilyBackup(JSON.stringify(envelope)), null);
  const unicodeCount = Math.floor((1000000 - base) / 3);
  const remainder = (1000000 - base) % 3;
  envelope.ignored = '界'.repeat(unicodeCount) + 'x'.repeat(remainder);
  const bytes = JSON.stringify(envelope);
  assert.equal(new TextEncoder().encode(bytes).length, 1000000);
  assert.ok(family.readFamilyBackup(bytes));
  envelope.ignored += 'x';
  assert.equal(family.readFamilyBackup(JSON.stringify(envelope)), null);
});

test('all four camp formats load and already chosen coins are never awarded again', () => {
  const original = decodeCheckpoint(camp(4))!;
  while (!original.rewardOffer.includes('pieces')) original.rewards.seed++;
  assert.equal(original.chooseReward('pieces'), true);
  assert.equal(original.gold, 877);
  const raw = encodeCheckpoint(original)!;
  for (const version of [1, 2, 3, 4]) {
    const checkpoint = { ...JSON.parse(raw), version };
    if (version < 4) delete checkpoint.campaign;
    if (version < 3) delete checkpoint.rewards;
    if (version === 1) for (const unit of checkpoint.units) delete unit.homeX;
    const restored = family.readFamilyBackup(
      family.writeFamilyBackup(JSON.stringify(checkpoint), createCareer().state)!,
    )!;
    const game = decodeCheckpoint(restored.camp!)!;
    assert.equal(game.gold, 877);
    assert.equal(game.units.length, 2);
    assert.equal(game.units[0].hp, 41);
    if (version >= 3) {
      assert.equal(game.chooseReward('pieces'), false);
      assert.equal(game.gold, 877);
      assert.equal(game.rewards.choices[0].id, 'pieces');
    }
  }
});

test('malformed in-memory tuples, cycles and public snapshots cannot corrupt career or family state', () => {
  const career = createCareer();
  const original = career.state;
  for (const field of ['bestStars', 'rosters', 'chapterCamps'] as const) {
    const bad = createCareer().state;
    Reflect.deleteProperty(bad[field], '0');
    assert.equal(career.replaceState(bad), false);
    assert.equal(family.writeFamilyBackup(null, bad), null);
  }
  const cycle = createCareer().state as ReturnType<typeof createCareer>['state'] & {
    cycle?: unknown;
  };
  cycle.cycle = cycle;
  assert.equal(career.replaceState(cycle), false);
  assert.equal(family.writeFamilyBackup(null, cycle), null);
  assert.deepEqual(career.state, original);
  const valid = family.readFamilyBackup(family.writeFamilyBackup(null, original)!)!;
  const summary = family.backupSummary(valid);
  summary.bestStars[0] = 3;
  assert.deepEqual(valid.career.bestStars, [0, 0, 0]);
});
