import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { encodeCheckpoint, decodeCheckpoint } from '../src/checkpoints.ts';
import { createMissionRun } from '../src/missions.ts';
import {
  createMissionProgress,
  createMissionProgressController,
  validateMissionProgress,
} from '../src/missionProgress.ts';
import { CAPRICES, CREATOR_CHALLENGES } from '../src/caprices.ts';
import { createCareer } from '../src/progression.ts';
import { readFamilyBackup, writeFamilyBackup } from '../src/familyBackup.ts';
import { createFamilyPersistence } from '../src/familyPersistence.ts';
import { FAMILY_STORAGE_KEY } from '../src/storageKeys.ts';
import * as albumsModule from '../src/capriceAlbums.ts';
function albums() {
  return albumsModule.createCapriceAlbumsController();
}

const isFighting = (game: Game) => game.status === 'fighting';
const run = { ...createMissionRun('refuge', 42), caprice: 'refuge-petit' };
function victory() {
  const game = new Game(42, undefined, run);
  game.wave = game.totalWaves;
  game.status = 'won';
  return game;
}

test('caprice victory preserves existing shared star credit and retains the actual run', () => {
  const initial = createMissionProgress();
  initial.bestStars.refuge = 1;
  const progress = createMissionProgressController(initial);
  assert.equal(progress.record(victory()), true);
  assert.equal(progress.state.bestStars.refuge, 3);
  assert.deepEqual(progress.lastRun('refuge'), run);
  assert.equal(progress.record(victory()), false);
});

test('caprice starts require its tier stars and keep retry identity distinct', () => {
  const progress = createMissionProgressController();
  assert.equal(progress.started(run), false);
  const initial = createMissionProgress();
  initial.bestStars.refuge = 1;
  assert.equal(progress.replaceState(initial), true);
  assert.equal(progress.started({ ...run, caprice: 'refuge-moyen' }), false);
  assert.equal(progress.started({ ...run, caprice: 'refuge-grand' }), false);
  assert.equal(progress.started(run), true);
  const different = {
    ...initial,
    lastRuns: { refuge: { ...run, caprice: 'refuge-moyen' } },
    retryCamp: encodeCheckpoint(new Game(42, undefined, run)),
  };
  assert.equal(validateMissionProgress(different), null);
  different.lastRuns.refuge = run;
  assert.ok(validateMissionProgress(different));
});

test('independent albums retain expedition ownership after selecting another child', () => {
  const controller = albums();
  const a = controller.state.activeId;
  assert.equal(controller.state.campProfileId, null);
  assert.equal(controller.record(victory()), false);
  assert.equal(controller.beginRun(), true);
  const b = controller.add('B');
  assert.ok(b);
  assert.equal(controller.state.activeId, b);
  assert.equal(controller.state.campProfileId, a);
  assert.equal(controller.record(victory()), true);
  assert.equal(controller.record(victory()), false);
  assert.equal(controller.has('refuge-petit'), false);
  assert.equal(controller.has('refuge-petit', a), true);
  assert.equal(controller.beginRun(b), true);
  assert.equal(controller.record(victory()), true);
  assert.equal(controller.has('refuge-petit'), true);
  assert.equal(controller.state.children.length, 2);
});

test('only an actual complete caprice victory grants a sticker, once', () => {
  const controller = albums();
  controller.beginRun();
  const game = new Game(42, undefined, { ...run, rules: 2 });
  assert.equal(controller.record(game), false);
  for (let wave = 0; wave < game.totalWaves && game.status === 'preparing'; wave++) {
    assert.equal(game.startWave(), true);
    for (let frame = 0; frame < 12000 && isFighting(game); frame++) game.step(1 / 30);
  }
  assert.equal(game.status, 'won');
  assert.equal(controller.record(game), true);
  assert.equal(controller.record(game), false);
  assert.deepEqual(controller.state.children[0].completed, ['refuge-petit']);
  const before = controller.state;
  const invalids = [new Game(42), new Game(42, undefined, createMissionRun('refuge', 42))];
  for (const normal of invalids) {
    normal.status = 'won';
    normal.wave = normal.totalWaves;
  }
  for (const status of ['lost', 'fighting', 'preparing'] as const) {
    const invalid = victory();
    invalid.status = status;
    invalids.push(invalid);
  }
  const short = victory();
  short.wave--;
  invalids.push(short);
  const destroyed = victory();
  destroyed.base = 0;
  invalids.push(destroyed);
  const nonfinite = victory();
  nonfinite.base = NaN;
  invalids.push(nonfinite);
  const enemy = victory();
  enemy.enemies.push({} as never);
  invalids.push(enemy);
  const egg = victory();
  egg.eggs.push({} as never);
  invalids.push(egg);
  for (const invalid of invalids) {
    const rejecting = albums();
    rejecting.beginRun();
    assert.equal(rejecting.record(invalid), false);
    assert.deepEqual(rejecting.state.children[0].completed, []);
  }
  assert.deepEqual(controller.state, before);
});

test('album edits are bounded and rejected edits never mutate state', () => {
  const controller = albums();
  const a = controller.state.activeId;
  assert.equal(controller.rename(a, 'A'.repeat(24)), true);
  for (const name of ['', '  ', 'A'.repeat(25), 'A\nB', 'A\u0000B', 'A\u007fB']) {
    const before = controller.state;
    assert.equal(controller.add(name), null);
    assert.equal(controller.rename(a, name), false);
    assert.deepEqual(controller.state, before);
  }
  for (let i = 1; i < 8; i++) assert.ok(controller.add(`Carnet ${i}`));
  assert.equal(controller.add('Trop'), null);
  const before = controller.state;
  assert.equal(controller.select('missing'), false);
  assert.equal(controller.rename('missing', 'A'), false);
  assert.equal(controller.beginRun('missing'), false);
  assert.equal(controller.has('refuge-petit', 'missing'), false);
  assert.equal(controller.has('unknown'), false);
  assert.deepEqual(controller.state, before);
  assert.equal(controller.select(a), true);
  assert.equal(controller.beginRun(a), true);
  const copy = controller.state;
  copy.children[0].name = 'mutated';
  copy.children[0].completed.push('refuge-petit');
  assert.equal(controller.state.children[0].name, 'A'.repeat(24));
  assert.equal(controller.has('refuge-petit', a), false);
});

test('album validation rejects corrupt IDs, references and sticker lists atomically', () => {
  const controller = albums();
  const initial = controller.state;
  const child = initial.children[0];
  for (const invalid of [
    null,
    [],
    { ...initial, version: 2 },
    { ...initial, children: [] },
    { ...initial, children: [child, child] },
    { ...initial, activeId: 'missing' },
    { ...initial, campProfileId: 'missing' },
    { ...initial, nextId: NaN },
    { ...initial, nextId: 1 },
    { ...initial, children: [{ ...child, id: '' }] },
    { ...initial, children: [{ ...child, name: 'A\u0085B' }] },
    { ...initial, children: [{ ...child, completed: ['unknown'] }] },
    { ...initial, children: [{ ...child, completed: ['refuge-petit', 'refuge-petit'] }] },
    { ...initial, children: [{ ...child, completed: new Array(1) }] },
  ]) {
    assert.equal(albumsModule.validateCapriceAlbums(invalid), null);
    assert.equal(controller.replaceState(invalid as never), false);
    assert.deepEqual(controller.state, initial);
  }
  const complete = {
    ...initial,
    children: [{ ...child, completed: [...CAPRICES, ...CREATOR_CHALLENGES].map((c) => c.id) }],
  };
  assert.equal(controller.replaceState(complete), true);
  complete.children[0].completed.length = 0;
  assert.equal(controller.state.children[0].completed.length, 36);
});

function memory() {
  let stored: string | null = null;
  let blocked = false;
  let writes = 0;
  return {
    get stored() {
      return stored;
    },
    get writes() {
      return writes;
    },
    set blocked(value: boolean) {
      blocked = value;
    },
    getItem: (key: string) => (key === FAMILY_STORAGE_KEY ? stored : null),
    setItem(key: string, raw: string) {
      assert.equal(key, FAMILY_STORAGE_KEY);
      if (blocked) throw Error('quota');
      writes++;
      stored = raw;
    },
  };
}

test('family4 preserves expedition owner A across B selection, classic mode, reload and resume', () => {
  const controller = albums();
  const a = controller.state.activeId;
  controller.beginRun();
  const b = controller.add('B')!;
  const initial = createMissionProgress();
  initial.bestStars.refuge = 1;
  const missions = createMissionProgressController(initial);
  assert.equal(missions.started(run), true);
  const game = new Game(42, undefined, run);
  assert.equal(missions.sync(game), true);
  const expeditionCamp = missions.state.retryCamp!;
  const classic = new Game(17);
  assert.equal(missions.sync(classic), true);
  missions.switchMode('classic');
  const storage = memory();
  const persistence = createFamilyPersistence(storage);
  assert.equal(
    persistence.sync(
      encodeCheckpoint(classic),
      createCareer().state,
      missions.state,
      controller.state,
    ),
    true,
  );
  assert.equal(storage.writes, 1);
  const reloaded = createFamilyPersistence(storage).load()!;
  assert.equal(reloaded.version, 4);
  const restored = albumsModule.createCapriceAlbumsController(reloaded.albums);
  assert.equal(restored.state.activeId, b);
  assert.equal(restored.state.campProfileId, a);
  const resume = decodeCheckpoint(reloaded.missions!.retryCamp!)!;
  assert.equal(encodeCheckpoint(resume), expeditionCamp);
  resume.status = 'won';
  resume.wave = resume.totalWaves;
  assert.equal(restored.record(resume), true);
  assert.equal(restored.has('refuge-petit', a), true);
  assert.equal(restored.has('refuge-petit', b), false);
});

test('family1–4 remain readable, old camps initialize a default album, and no albums means no v4', () => {
  const career = createCareer().state;
  const missions = createMissionProgress();
  const controller = albums();
  const { rules: _rules, ...historicalRun } = run;
  for (const version of [1, 2, 3, 4]) {
    const raw = JSON.stringify({
      format: 'conquete-serpents-family',
      version,
      camp: encodeCheckpoint(
        new Game(42, undefined, version === 1 ? undefined : version === 2 ? historicalRun : run),
      ),
      career,
      ...(version > 1 ? { missions } : {}),
      ...(version === 4 ? { albums: controller.state } : {}),
    });
    const backup = readFamilyBackup(raw);
    assert.ok(backup, `family${version}`);
    assert.equal(backup.version, version);
    const restored = albumsModule.createCapriceAlbumsController(backup.albums);
    assert.equal(restored.state.children.length, 1);
    assert.equal(restored.state.campProfileId, null);
  }
  assert.equal(JSON.parse(writeFamilyBackup(null, career)!).version, 1);
  assert.equal(JSON.parse(writeFamilyBackup(null, career, missions)!).version, 2);
  assert.equal(writeFamilyBackup(null, career, undefined, controller.state), null);
  assert.equal(JSON.parse(writeFamilyBackup(null, career, missions, controller.state)!).version, 4);
});

test('old sync callers preserve loaded albums until an explicit legacy import replaces them', () => {
  const storage = memory();
  const career = createCareer().state;
  const controller = albums();
  controller.beginRun();
  controller.record(victory());
  const missions = createMissionProgress();
  const initial = createFamilyPersistence(storage);
  assert.equal(initial.sync(null, career, missions, controller.state), true);
  const persistence = createFamilyPersistence(storage);
  assert.equal(persistence.load()!.version, 4);
  assert.equal(persistence.sync(null, career), true);
  assert.equal(storage.writes, 1);
  assert.deepEqual(JSON.parse(storage.stored!).albums, controller.state);
  missions.bestStars.refuge = 2;
  assert.equal(persistence.sync(null, career, missions), true);
  assert.deepEqual(JSON.parse(storage.stored!).albums, controller.state);
  for (const version of [1, 2, 3]) {
    assert.equal(
      persistence.import(
        readFamilyBackup(writeFamilyBackup(null, career, missions, controller.state)!)!,
      ),
      true,
    );
    const legacy = {
      format: 'conquete-serpents-family',
      version,
      camp: null,
      career,
      ...(version > 1 ? { missions } : {}),
    };
    assert.equal(persistence.import(legacy as never), true);
    assert.equal(persistence.sync(null, career), true);
    const result = JSON.parse(storage.stored!);
    assert.equal(Object.hasOwn(result, 'albums'), false);
    assert.equal(result.version, version === 1 ? 1 : 2);
  }
});

test('corrupt v4 and refused storage leave the entire previous family and retained albums intact', () => {
  const storage = memory();
  const persistence = createFamilyPersistence(storage);
  const career = createCareer().state;
  const controller = albums();
  controller.beginRun();
  const missions = createMissionProgress();
  assert.equal(persistence.sync(null, career, missions, controller.state), true);
  const old = storage.stored!;
  for (const change of [
    { albums: undefined },
    { albums: null },
    { albums: { ...controller.state, activeId: 'missing' } },
    { missions: undefined },
    { missions: null },
    { version: 3 },
  ]) {
    const invalid = { ...JSON.parse(old), ...change };
    assert.equal(readFamilyBackup(JSON.stringify(invalid)), null);
    assert.equal(persistence.import(invalid), false);
    assert.equal(storage.stored, old);
    assert.equal(storage.writes, 1);
  }
  assert.equal(persistence.sync(null, career, missions, null as never), false);
  const invalid = JSON.parse(old);
  invalid.albums.children[0].completed = new Array(1);
  assert.equal(persistence.import(invalid), false);
  assert.equal(storage.stored, old);
  const next = JSON.parse(old);
  next.albums.children[0].name = 'Nouveau';
  storage.blocked = true;
  assert.equal(persistence.import(next), false);
  assert.equal(storage.stored, old);
  storage.blocked = false;
  assert.equal(persistence.import(JSON.parse(old)), true);
  assert.equal(persistence.sync(null, career), true);
  assert.deepEqual(JSON.parse(storage.stored!).albums, controller.state);
  assert.equal(createFamilyPersistence().sync(null, career, missions, controller.state), false);
});

test('explicit albums on legacy live imports cannot disappear during serialization', () => {
  const persistence = createFamilyPersistence(memory());
  const career = createCareer().state;
  for (const version of [1, 2, 3]) {
    const legacy = {
      format: 'conquete-serpents-family',
      version,
      camp: null,
      career,
      ...(version > 1 ? { missions: createMissionProgress() } : {}),
      albums: undefined,
    };
    assert.equal(persistence.import(legacy as never), false);
  }
});
