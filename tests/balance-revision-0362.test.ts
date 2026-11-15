import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { Game } from '../src/game.ts';
import type { Entity } from '../src/game.ts';
import { kinds } from '../src/data.ts';
import type { Kind } from '../src/data.ts';
import { CURRENT_BALANCE_REVISION, balanceRecruitPrice } from '../src/balanceRevision.ts';
import {
  CAPRICES,
  CREATOR_CHALLENGES,
  NO_CAPRICE,
  capriceDefinitionForRun,
  capriceRules,
  defineCaprice,
} from '../src/caprices.ts';
import { createMissionRun, readMissionRun } from '../src/missions.ts';
import { encodeCheckpoint, decodeCheckpoint } from '../src/checkpoints.ts';
import { encodeDeparture, decodeDeparture, departureForGame } from '../src/departures.ts';
import {
  createMissionProgress,
  createMissionProgressController,
  validateMissionProgress,
} from '../src/missionProgress.ts';
import { createCareer } from '../src/progression.ts';
import { createCapriceAlbums, createCapriceAlbumsController } from '../src/capriceAlbums.ts';
import { readFamilyBackup, writeFamilyBackup } from '../src/familyBackup.ts';
import { createFamilyPersistence } from '../src/familyPersistence.ts';
const basic = createMissionRun('refuge', 42);
const modern = createMissionRun('refuge', 42, undefined, 2);
const hash = (x: unknown) => createHash('sha256').update(JSON.stringify(x)).digest('hex');
const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/balance-0362-legacy.json', import.meta.url), 'utf8'),
);

test('historical catalog, 75 deterministic traces, code and camp bytes and family envelopes are frozen', () => {
  assert.equal(hash([...CAPRICES, ...CREATOR_CHALLENGES]), fixture.catalogHash);
  for (const input of fixture.traces) {
    const g = new Game(input.seed, undefined, input.run);
    const snapshots = [];
    g.startWave();
    for (let i = 0; i < 900; i++) {
      g.step(1 / 30);
      if (i % 150 === 149) {
        const { balanceRevision, ...state } = g;
        snapshots.push(hash(state));
      }
    }
    assert.deepEqual(snapshots, input.snapshots);
  }
  for (const c of fixture.camps) {
    const g = new Game(42, { tacticalRulesEnabled: c.tactical }, c.run ?? undefined);
    assert.equal(encodeCheckpoint(g), c.raw);
    assert.equal(encodeDeparture(departureForGame(g)!), c.code);
    const restored = decodeCheckpoint(c.raw)!;
    assert.ok(restored);
    assert.equal(restored.balanceRevision, 1);
    if (JSON.parse(c.raw).version >= 6) assert.equal(encodeCheckpoint(restored), c.raw);
  }
  for (const raw of fixture.family) assert.equal(JSON.stringify(readFamilyBackup(raw)), raw);
});
test('prices opt in to revision 2, old defaults and free recruits survive', () => {
  // The current revision moved on (tests/balance-revision-3.test.ts); the second keeps its prices.
  assert.ok(CURRENT_BALANCE_REVISION >= 2);
  for (const kind of Object.keys(kinds) as Kind[]) {
    assert.equal(balanceRecruitPrice(kind), kinds[kind].cost);
    assert.equal(
      balanceRecruitPrice(kind, 2),
      ({ trex: 340, dragon: 210, tank: 440 } as Partial<Record<Kind, number>>)[kind] ??
        kinds[kind].cost,
    );
  }
  const g = new Game(42, undefined, undefined, 2);
  assert.equal(g.balanceRevision, 2);
  assert.equal(g.recruitCost('dragon'), 210);
  assert.equal(new Game().balanceRevision, 1);
  assert.equal(new Game(42, undefined, basic).balanceRevision, 1);
  assert.equal(new Game(42, undefined, modern).balanceRevision, 2);
  assert.throws(() => new Game(42, undefined, modern, 1));
  assert.throws(() => new Game(42, undefined, basic, 2));
  assert.throws(() => new Game(42, undefined, undefined, 4 as 2));
  assert.throws(() => balanceRecruitPrice('tank', 4 as 2));
  assert.equal(readMissionRun({ ...modern, balance: 1 }), null);
  assert.equal(readMissionRun({ ...modern, balance: 3 }), null);
  assert.equal(readMissionRun(modern)?.balance, 2);
  g.rewards.choices.push({ milestone: 4, id: 'renfort-ninja', used: false });
  assert.equal(g.recruitCost('ninja'), 0);
  g.wave = 7;
  assert.equal(g.isUnlocked('tank'), false);
  g.wave = 8;
  assert.equal(g.isUnlocked('tank'), true);
});
test('five revised caprices use cached contextual rules with untouched French identities', () => {
  const patches = {
    'carrefour-grand': { count: 1.2 },
    'sonnette-grand': { hp: 1.75 },
    'refuge-createur-moyen': {
      shellEvery: 2,
      shellHp: 5,
      shellArmor: 0.7,
      shellSpeed: 0.6,
      shellBite: 1.5,
    },
    'trois-ponts-createur-moyen': { shellEvery: 2, shellHp: 5, shellArmor: 0.6 },
    'course-createur-moyen': { shellEvery: 2, shellHp: 5, shellArmor: 0.6 },
  };
  for (const c of [...CAPRICES, ...CREATOR_CHALLENGES]) {
    const run = { ...createMissionRun(c.missionId, 42, undefined, 2), caprice: c.id };
    const expected = { ...c.rules, ...patches[c.id as keyof typeof patches] };
    assert.deepEqual(capriceRules(run), expected);
    const resolved = capriceDefinitionForRun(run)!;
    assert.equal(resolved.name, c.name);
    assert.equal(resolved.announce, c.announce);
    assert.equal(resolved.rules, capriceRules(run));
    assert.equal(resolved, capriceDefinitionForRun({ ...run }));
    assert.equal(capriceRules({ ...run, balance: undefined }), c.rules);
    assert.equal(Object.hasOwn(c.rules, 'shellBite'), false);
    assert.equal(Object.isFrozen(resolved.rules), true);
  }
  assert.equal(capriceRules(modern), NO_CAPRICE);
  assert.equal(Object.hasOwn(NO_CAPRICE, 'shellBite'), false);
  for (const shellBite of [0.99, 3.01, NaN])
    assert.throws(() =>
      defineCaprice({
        id: `bad-shell-${shellBite}`,
        missionId: 'refuge',
        set: 'createur',
        tier: 'moyen',
        name: 'x',
        announce: 'x',
        rules: { shellBite },
      }),
    );
});
test('revision 2 code4 round trips classic and all caprices with exact revision', () => {
  const departures = [
    { kind: 'classic', seed: 42, balance: 2 } as const,
    ...[...CAPRICES, ...CREATOR_CHALLENGES].map((c) => ({
      kind: 'mission' as const,
      run: { ...createMissionRun(c.missionId, 0xffffffff, undefined, 2), caprice: c.id },
    })),
    { kind: 'mission' as const, run: modern },
  ];
  for (const departure of departures) {
    const code = encodeDeparture(departure);
    assert.match(code, /-4-.*-(N0|[SC][123])-/);
    assert.deepEqual(decodeDeparture(code), { ok: true, departure });
    assert.equal(decodeDeparture(code.replace('-4-', '-3-')).ok, false);
    assert.equal(decodeDeparture(code.replace('-4-', '-5-')).ok, false);
  }
  assert.match(
    encodeDeparture(departureForGame(new Game(42, undefined, undefined, 2))!),
    /-4-.*-N0-/,
  );
});
test('camp9 requires revision, initial seed and consistent mission; preserves copains', () => {
  for (const run of [
    undefined,
    modern,
    { ...createMissionRun('sonnette', 42, undefined, 2), caprice: 'sonnette-petit' },
  ]) {
    const g = new Game(42, undefined, run, 2);
    if (run?.caprice) assert.equal(g.chooseCapriceKinds(['ninja', 'archer']), true);
    const raw = encodeCheckpoint(g)!;
    const d = JSON.parse(raw);
    assert.equal(d.version, 9);
    assert.equal(d.balance, 2);
    assert.equal(d.initialSeed, 42);
    const restored = decodeCheckpoint(raw)!;
    assert.ok(restored);
    assert.equal(restored.balanceRevision, 2);
    assert.equal(encodeCheckpoint(restored), raw);
    assert.deepEqual(restored.capriceKindsChosen, g.capriceKindsChosen);
    for (const patch of [
      { balance: undefined },
      { balance: 1 },
      { balance: 3 },
      { initialSeed: undefined },
      { initialSeed: -1 },
      { version: 10 },
      ...Array.from({ length: 8 }, (_, i) => ({ version: i + 1 })),
      ...(run ? [{ mission: { ...run, balance: undefined } }, { initialSeed: 43 }] : []),
    ])
      assert.equal(
        decodeCheckpoint(JSON.stringify({ ...d, ...patch })),
        null,
        JSON.stringify(patch),
      );
  }
  assert.equal(encodeCheckpoint(new Game(42, { tacticalRulesEnabled: false }, undefined, 2)), null);
});
test('mission progress promotes only when needed, rejects mislabeled data, keeps mixed revisions', () => {
  const c = createMissionProgressController();
  assert.equal(c.state.version, 1);
  assert.equal(c.started(modern), true);
  assert.equal(c.state.version, 2);
  assert.equal(c.rememberCamp(new Game(42, undefined, modern)), true);
  assert.deepEqual(validateMissionProgress(c.state), c.state);
  assert.equal(validateMissionProgress({ ...c.state, version: 1 }), null);
  const { balance, ...old } = modern;
  assert.equal(c.started(old), true);
  assert.equal(c.state.version, 2);
  assert.equal(c.state.lastRuns.refuge?.balance, undefined);
  const classic = createMissionProgressController();
  assert.equal(classic.rememberCamp(new Game(42, undefined, undefined, 2)), true);
  assert.equal(classic.state.version, 2);
  assert.equal(validateMissionProgress({ ...classic.state, version: 1 }), null);
  const mismatched = {
    ...c.state,
    lastRuns: { refuge: basic },
    retryCamp: encodeCheckpoint(new Game(42, undefined, modern)),
  };
  assert.equal(validateMissionProgress(mismatched), null);
});
test('family5 requires complete collections and guards every nested new revision before atomic import', () => {
  const career = createCareer().state,
    albums = createCapriceAlbums(),
    missions = createMissionProgressController();
  missions.started(modern);
  missions.rememberCamp(new Game(42, undefined, modern));
  const camp = encodeCheckpoint(new Game(42, undefined, undefined, 2));
  assert.equal(writeFamilyBackup(camp, career), null);
  assert.equal(writeFamilyBackup(camp, career, createMissionProgress()), null);
  for (const [rawCamp, state, careerState] of [
    [camp, createMissionProgress(), career],
    [null, missions.state, career],
    [
      null,
      createMissionProgress(),
      {
        ...career,
        chapterCamps: [
          (() => {
            const g = new Game(42, undefined, undefined, 2);
            g.wave = 4;
            return encodeCheckpoint(g);
          })(),
          null,
        ],
      },
    ],
  ] as const) {
    const raw = writeFamilyBackup(rawCamp, careerState as typeof career, state, albums)!;
    assert.ok(raw);
    const data = JSON.parse(raw);
    assert.equal(data.version, 5);
    assert.equal(JSON.stringify(readFamilyBackup(raw)), raw);
    for (const version of [1, 2, 3, 4, 6])
      assert.equal(readFamilyBackup(JSON.stringify({ ...data, version })), null);
    let writes = 0;
    const p = createFamilyPersistence({
      getItem: () => raw,
      setItem: () => {
        writes++;
      },
    });
    assert.ok(p.load());
    assert.equal(p.sync(rawCamp, careerState as typeof career), true);
    assert.equal(p.import({ ...data, version: 4 }), false);
    assert.equal(writes, 0);
  }
});
test('lab defaults revision2, records run and rejects invalid revision without simulation', () => {
  for (const revision of ['0', '3', 'x']) {
    const result = spawnSync(
      process.execPath,
      [
        '--experimental-strip-types',
        'scripts/caprices-lab.mjs',
        'catalogue',
        '',
        '0',
        '1',
        '0',
        revision,
      ],
      { encoding: 'utf8' },
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /révision/i);
  }
  const dir = mkdtempSync(join(tmpdir(), 'caprices-lab-'));
  try {
    for (const revision of ['1', '2', undefined]) {
      const out = join(dir, `result-${revision}.json`);
      const result = spawnSync(
        process.execPath,
        [
          '--experimental-strip-types',
          'scripts/caprices-lab.mjs',
          'catalogue',
          out,
          '0',
          '100000',
          '1',
          ...(revision ? [revision] : []),
        ],
        { encoding: 'utf8' },
      );
      assert.equal(result.status, 0, result.stderr);
      const report = JSON.parse(readFileSync(out, 'utf8'));
      assert.equal(report.revision, Number(revision ?? 2));
      assert.equal(report.results.length, 1);
      const row = report.results[0];
      assert.equal(row.revision, report.revision);
      assert.deepEqual(row.run, {
        ...createMissionRun('refuge', 20261109, undefined, report.revision === 2 ? 2 : undefined),
        layout: 0,
        assault: 'balanced',
        nest: 'spread',
      });
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

function arena(shell: boolean, variant: Entity['variant'] = 'normal', boss = false) {
  const g = new Game(42, undefined, { ...modern, caprice: 'refuge-createur-moyen' });
  const u = g.units[0];
  g.units = [u];
  Object.assign(u, { x: 750, y: 324, cool: 99, homeX: 750, homeY: 324 });
  const e: Entity = {
    ...u,
    id: 900,
    kind: 'snake',
    variant,
    hp: 1000,
    maxHp: 1000,
    x: 730,
    y: 324,
    cool: 0,
    path: [],
    ...(shell ? { shell: true as const } : {}),
    boss,
  };
  g.enemies = [e];
  g.wave = 1;
  g.status = 'fighting';
  g.remaining = 0;
  g.eggs = [];
  return { g, u, e };
}
test('only shell attackers multiply incoming damage, including one poison hit, never bosses', () => {
  for (const variant of ['normal', 'spitter'] as const) {
    const ordinary = arena(false, variant),
      shell = arena(true, variant);
    const hp = ordinary.u.hp;
    ordinary.g.step(1 / 30);
    shell.g.step(1 / 30);
    const normalLoss = hp - ordinary.u.hp;
    assert.ok(normalLoss > 0);
    assert.ok(Math.abs(hp - shell.u.hp - normalLoss * 1.5) < 1e-9);
    assert.equal(shell.e.cool, variant === 'spitter' ? 1.5 : 1.05);
    const after = shell.u.hp;
    for (let i = 0; i < 20; i++) shell.g.step(1 / 30);
    assert.equal(shell.u.hp, after, 'no poison damage over time');
  }
  const boss = arena(false, 'normal', true),
    shellBoss = arena(true, 'normal', true);
  boss.g.step(1 / 30);
  shellBoss.g.step(1 / 30);
  assert.equal(boss.u.hp, shellBoss.u.hp);
});
test('shell retaliation remains exactly 2 or 3, and crystal entry exactly 9', () => {
  for (const [variant, damage] of [
    ['royal', 2],
    ['mamba', 3],
  ] as const) {
    const { g, u, e } = arena(true, variant);
    u.cool = 0;
    e.cool = 99;
    e.hp = 0.01;
    const hp = u.hp;
    g.step(1 / 30);
    assert.equal(u.hp, hp - damage);
    assert.equal(g.enemies.length, 0);
  }
  const { g, e } = arena(true);
  g.units = [];
  e.x = 1001;
  e.stage = 7;
  const hp = g.base;
  g.step(1 / 30);
  assert.equal(g.base, hp - 9);
});

test('legacy versions cannot hide a revision2 marker in an ignored mission', () => {
  const raw = JSON.parse(encodeCheckpoint(new Game(42))!);
  for (const version of [1, 2, 3, 4])
    assert.equal(decodeCheckpoint(JSON.stringify({ ...raw, version, mission: modern })), null);
});

function packet4(word: string, value: number, suffix: string) {
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  let payload = '';
  for (let i = 0; i < 8; i++) {
    payload = alphabet[value % 32] + payload;
    value = Math.floor(value / 32);
  }
  let hash = 2166136261;
  for (const c of `${word}-4-${payload}-${suffix}`)
    hash = Math.imul(hash ^ c.charCodeAt(0), 16777619) >>> 0;
  return `${word}-4-${payload.slice(0, 4)}-${payload.slice(4)}-${suffix}-${alphabet[(hash & 1023) >>> 5]}${alphabet[hash & 31]}`;
}
test('code4 validates exact payload bits, suffix and valid checksums on invalid setups', () => {
  assert.equal(
    encodeDeparture({ kind: 'classic', seed: 42, balance: 2 }),
    packet4('AVENTURE', 42 * 256, 'N0'),
  );
  for (const invalid of [
    packet4('AVENTURE', 42 * 256 + 128, 'N0'),
    packet4('AVENTURE', 42 * 256, 'S1'),
    packet4('PONTS', 42 * 256 + 147, 'N0'),
    packet4('REFUGE', 42 * 256 + 109, 'N0'),
    packet4('REFUGE', 42 * 256 + 1, 'N1'),
    packet4('REFUGE', 42 * 256 + 1, 'S4'),
    packet4('REFUGE', 42 * 256 + 1, 'X1'),
    packet4('PONTS', 42 * 256 + 1, 'N0'),
    packet4('REFUGE', 42 * 256 + 1, 'N0').replace('-N0-', '-'),
  ])
    assert.equal(decodeDeparture(invalid).ok, false, invalid);
  for (const caprice of [...CAPRICES, ...CREATOR_CHALLENGES])
    for (const layout of [0, 1, 2] as const)
      for (const assault of ['balanced', 'rush', 'escort'] as const)
        for (const nest of ['spread', 'clustered'] as const)
          for (const seed of [0, 1, 0xffffffff])
            for (const rules of caprice.missionId === 'refuge'
              ? ([undefined, 2] as const)
              : [undefined]) {
              const run = readMissionRun({
                missionId: caprice.missionId,
                balance: 2,
                ...(rules ? { rules } : {}),
                seed,
                layout,
                assault,
                nest,
                caprice: caprice.id,
              })!;
              const departure = { kind: 'mission' as const, run };
              assert.deepEqual(decodeDeparture(encodeDeparture(departure)), {
                ok: true,
                departure,
              });
            }
});

test('lab play body remains byte-identical to 9d3dded', () => {
  const script = readFileSync(new URL('../scripts/caprices-lab.mjs', import.meta.url), 'utf8');
  const play = script.slice(script.indexOf('function play('), script.indexOf('\nconst jobs ='));
  assert.equal(
    createHash('sha256').update(play).digest('hex'),
    'c7f088c806f068d69725045c86656643b403f18a51153b196a741b605ccfa319',
  );
});

test('family5 retains album ownership, stickers and shared stars through one atomic import', () => {
  const albums = createCapriceAlbumsController();
  const owner = albums.state.activeId;
  albums.beginRun();
  albums.add('Autre enfant');
  const run = { ...modern, caprice: 'refuge-petit' };
  const game = new Game(42, undefined, run);
  game.status = 'won';
  game.wave = game.totalWaves;
  assert.equal(albums.record(game), true);
  assert.equal(albums.state.campProfileId, owner);
  assert.equal(albums.has('refuge-petit', owner), true);
  assert.equal(albums.has('refuge-petit'), false);
  const state = createMissionProgress();
  state.bestStars.refuge = 1;
  const progress = createMissionProgressController(state);
  assert.equal(progress.record(game), true);
  assert.equal(progress.state.bestStars.refuge, 3);
  const career = createCareer().state;
  const raw = writeFamilyBackup(null, career, progress.state, albums.state)!;
  const backup = readFamilyBackup(raw)!;
  assert.equal(backup.version, 5);
  assert.deepEqual(backup.albums, albums.state);
  const writes: string[] = [];
  const p = createFamilyPersistence({
    getItem: () => null,
    setItem: (_key, value) => {
      writes.push(value);
    },
  });
  assert.equal(p.import(backup), true);
  assert.deepEqual(writes, [raw]);
  const forged = JSON.parse(raw);
  forged.albums.campProfileId = 'missing';
  assert.equal(p.import(forged), false);
  assert.deepEqual(writes, [raw]);
  const blocked = createFamilyPersistence({
    getItem: () => null,
    setItem: () => {
      throw Error('quota');
    },
  });
  assert.equal(blocked.import(backup), false);
  assert.deepEqual(albums.state, backup.albums);
});

test('revision metadata is read-only and preserves historical own-state serialization', () => {
  const game = new Game(42, undefined, undefined, 2);
  assert.equal(Object.hasOwn(game, 'balanceRevision'), false);
  assert.throws(() => Object.assign(game, { balanceRevision: 1 }), TypeError);
  assert.equal(game.balanceRevision, 2);
});
