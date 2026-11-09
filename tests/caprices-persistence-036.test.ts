import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Game } from '../src/game.ts';
import { kinds } from '../src/data.ts';
import type { Kind } from '../src/data.ts';
import { CAPRICES, CREATOR_CHALLENGES, capricesForMission } from '../src/caprices.ts';
import { MISSIONS, readMissionRun } from '../src/missions.ts';
import type { MissionRun } from '../src/missions.ts';
import { encodeCheckpoint, decodeCheckpoint } from '../src/checkpoints.ts';
import { encodeDeparture, decodeDeparture, departureForGame } from '../src/departures.ts';
import { placementSuggestions } from '../src/placement.ts';

const basic = {
  missionId: 'refuge',
  seed: 42,
  layout: 0,
  assault: 'balanced',
  nest: 'spread',
} as const;
const copains = { ...basic, missionId: 'sonnette', caprice: 'sonnette-petit' } as const;
const allCaprices = [...CAPRICES, ...CREATOR_CHALLENGES];

// Losing any run field changes the restored rules or the deterministic retry.
test('checkpoint8 et code3 conservent les 36 caprices, leurs configurations et les règles du refuge', () => {
  assert.equal(allCaprices.length, 36);
  const codes = new Set<string>();
  for (const caprice of allCaprices)
    for (const rules of caprice.missionId === 'refuge' ? ([undefined, 2] as const) : [undefined])
      for (const layout of [0, 1, 2] as const)
        for (const assault of ['balanced', 'rush', 'escort'] as const)
          for (const nest of ['spread', 'clustered'] as const)
            for (const seed of [0, 1, 2026, 0xffffffff]) {
              const run = readMissionRun({
                missionId: caprice.missionId,
                caprice: caprice.id,
                ...(rules ? { rules } : {}),
                seed,
                layout,
                assault,
                nest,
              })!;
              const game = new Game(seed, undefined, run);
              game.rng = 123;
              const before = JSON.stringify(game);
              const raw = encodeCheckpoint(game)!;
              assert.equal(JSON.parse(raw).version, 8);
              assert.deepEqual(JSON.parse(raw).capriceKindsChosen, []);
              const restored = decodeCheckpoint(raw)!;
              assert.ok(restored);
              assert.deepEqual(restored.mission, run);
              assert.equal(restored.initialSeed, seed);
              assert.equal(restored.rng, 123);
              assert.equal(encodeCheckpoint(restored), raw);
              const code = encodeDeparture(departureForGame(game)!);
              assert.match(code, /^[A-Z]+-3-[A-Z0-9]{4}-[A-Z0-9]{4}-[SC][123]-[A-Z0-9]{2}$/);
              assert.deepEqual(decodeDeparture(code), {
                ok: true,
                departure: { kind: 'mission', run },
              });
              assert.deepEqual(decodeDeparture(`  ${code.toLowerCase()}  `), decodeDeparture(code));
              assert.ok(!codes.has(code));
              codes.add(code);
              assert.equal(JSON.stringify(game), before);
            }
  assert.equal(codes.size, 3024);
});

for (const chosen of [[], ['ninja'], ['ninja', 'archer']] as Kind[][]) {
  test(`checkpoint8 restaure ${chosen.length} choix sans compter les massues initiales`, () => {
    const game = new Game(42, undefined, copains);
    if (chosen.length) assert.equal(game.chooseCapriceKinds(chosen), true);
    const raw = encodeCheckpoint(game)!;
    const restored = decodeCheckpoint(raw)!;
    assert.ok(restored);
    assert.deepEqual(restored.capriceKindsChosen, chosen);
    assert.equal(restored.units.filter((u) => u.kind === 'club').length, 2);
    for (const kind of Object.keys(kinds) as Kind[])
      assert.equal(restored.capriceAllows(kind), game.capriceAllows(kind));
    assert.equal(restored.capriceAllows('medic'), chosen.length < 2);
    assert.equal(encodeCheckpoint(restored), raw);
  });
}

test('les choix recrutés restent retenus même après la mort de tous leurs alliés', () => {
  const game = new Game(42, undefined, copains);
  for (const kind of ['ninja', 'archer'] as const) {
    const point = placementSuggestions(game, kind)[0];
    assert.ok(point);
    assert.equal(game.recruit(kind, point.x, point.y), true);
  }
  game.units = game.units.filter((u) => u.kind !== 'ninja' && u.kind !== 'archer');
  const restored = decodeCheckpoint(encodeCheckpoint(game)!)!;
  assert.ok(restored);
  assert.deepEqual(restored.capriceKindsChosen, ['ninja', 'archer']);
  assert.equal(restored.capriceAllows('medic'), false);
});

test('checkpoint8 refuse choix absents, doublons, héros, inconnus, indisponibles et limites dépassées', () => {
  const raw = JSON.parse(encodeCheckpoint(new Game(42, undefined, copains))!);
  raw.version = 8;
  for (const choices of [
    undefined,
    null,
    {},
    'ninja',
    ['ninja', 'ninja'],
    ['hero'],
    ['unicorn'],
    ['tank'],
    [null],
    ['club', 'ninja', 'archer'],
  ])
    assert.equal(decodeCheckpoint(JSON.stringify({ ...raw, capriceKindsChosen: choices })), null);
  for (const mission of [
    undefined,
    null,
    basic,
    { ...copains, caprice: 'inconnu' },
    { ...copains, caprice: 'refuge-petit' },
    { ...copains, rules: 2 },
  ])
    assert.equal(
      decodeCheckpoint(JSON.stringify({ ...raw, capriceKindsChosen: [], mission })),
      null,
    );
  const single = { ...copains, missionId: 'carrefour', caprice: 'carrefour-moyen' } as const;
  const one = JSON.parse(encodeCheckpoint(new Game(42, undefined, single))!);
  one.version = 8;
  assert.equal(
    decodeCheckpoint(JSON.stringify({ ...one, capriceKindsChosen: ['ninja', 'archer'] })),
    null,
  );
  const unrestricted = JSON.parse(
    encodeCheckpoint(new Game(42, undefined, { ...basic, caprice: 'refuge-petit' }))!,
  );
  unrestricted.version = 8;
  assert.equal(
    decodeCheckpoint(JSON.stringify({ ...unrestricted, capriceKindsChosen: ['club'] })),
    null,
  );
});

test('anciens camps6/7 à caprice gardent un choix vide sans inférence des survivants', () => {
  for (const [version, run] of [
    [6, copains],
    [7, { ...basic, rules: 2, caprice: 'refuge-petit' }],
  ] as const) {
    const game = new Game(42, undefined, run);
    const raw = JSON.parse(encodeCheckpoint(game)!);
    raw.version = version;
    delete raw.capriceKindsChosen;
    raw.units = raw.units.filter((u: { kind: string }) => u.kind !== 'hero');
    const restored = decodeCheckpoint(JSON.stringify(raw))!;
    assert.ok(restored);
    assert.deepEqual(restored.mission, run);
    assert.deepEqual(restored.capriceKindsChosen, []);
    assert.equal(restored.capriceAllows('medic'), true);
    assert.equal(restored.units.length, 2);
  }
});

test('tous les checkpoints1–7 restent lisibles sans caprice', () => {
  for (const version of [1, 2, 3, 4, 5, 6, 7]) {
    const run = version === 5 ? basic : version === 7 ? { ...basic, rules: 2 as const } : undefined;
    const raw = JSON.parse(encodeCheckpoint(new Game(42, undefined, run))!);
    raw.version = version;
    if (version < 4) delete raw.campaign;
    if (version < 3) delete raw.rewards;
    for (const unit of raw.units) if (version === 1) delete unit.homeX;
    const restored = decodeCheckpoint(JSON.stringify(raw))!;
    assert.ok(restored);
    assert.deepEqual(restored.mission, run ?? null);
    assert.deepEqual(restored.capriceKindsChosen, []);
  }
});

test('les octets des checkpoints et codes sans caprice restent historiques', () => {
  const fixtures = [
    [new Game(42), '71e346fbd3689ff9ed292139533e8fb5054c023b6543707fe922bcbf6564e503'],
    [
      new Game(42, { tacticalRulesEnabled: false }),
      '2250c5698c71764bb8868866537c7259dde615d9b015cf295cc90f7d9a837c34',
    ],
    [
      new Game(42, { tacticalRulesEnabled: false }, basic),
      '7dd5bae871116b9fd459f9a259203457bb930b3154886dea72163ab2849789c4',
    ],
    [
      new Game(42, undefined, basic),
      '2d4f47db2cd96eeb3f3599efaac97b62d357bfb8c0d11688ea2f5c93042274e7',
    ],
    [
      new Game(42, undefined, { ...basic, rules: 2 }),
      '74228cba488ee39af525a5a1094457c57f88e4de0926d63a40e06d388b62406c',
    ],
  ] as const;
  for (const [game, hash] of fixtures)
    assert.equal(createHash('sha256').update(encodeCheckpoint(game)!).digest('hex'), hash);
  for (const [departure, code] of [
    [{ kind: 'classic', seed: 42 }, 'AVENTURE-1-0000-0580-HF'],
    [{ kind: 'mission', run: basic }, 'REFUGE-1-0000-0581-8T'],
    [{ kind: 'mission', run: { ...basic, rules: 2 } }, 'REFUGE-2-0000-0581-89'],
  ] as const) {
    assert.equal(encodeDeparture(departure), code);
    assert.deepEqual(decodeDeparture(code), { ok: true, departure });
  }
});

// Independent packet builder permits valid checksums around deliberately invalid setups.
function packet(word: string, value: number, suffix: string) {
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  let payload = '';
  for (let i = 0; i < 8; i++) {
    payload = alphabet[value % 32] + payload;
    value = Math.floor(value / 32);
  }
  let hash = 2166136261;
  for (const ch of `${word}-3-${payload}-${suffix}`)
    hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619) >>> 0;
  const check = alphabet[(hash & 1023) >>> 5] + alphabet[hash & 31];
  return `${word}-3-${payload.slice(0, 4)}-${payload.slice(4)}-${suffix}-${check}`;
}

test('code3 vérifie suffixe et drapeau exact des règles dans le checksum', () => {
  const run = { ...basic, caprice: 'refuge-petit' };
  const oldRules = encodeDeparture({ kind: 'mission', run });
  const newRules = encodeDeparture({ kind: 'mission', run: { ...run, rules: 2 } });
  assert.equal(oldRules, packet('REFUGE', 42 * 256 + 1, 'S1'));
  assert.equal(newRules, packet('REFUGE', 42 * 256 + 129, 'S1'));
  for (const altered of [
    oldRules.replace('-S1-', '-S2-'),
    oldRules.replace('-S1-', '-C1-'),
    newRules.slice(0, -2) + oldRules.slice(-2),
  ])
    assert.deepEqual(decodeDeparture(altered), { ok: false, reason: 'checksum' });
  for (const invalid of [
    packet('AVENTURE', 42 * 256, 'S1'),
    packet('REFUGE', 42 * 256 + 109, 'S1'),
    packet('PONTS', 42 * 256 + 147, 'S1'),
    packet('REFUGE', 42 * 256 + 19, 'S1'),
    packet('REFUGE', 42 * 256 + 1, 'S4'),
    packet('REFUGE', 42 * 256 + 1, 'X1'),
    packet('REFUGE', 0x100000000 * 256, 'S1'),
    oldRules.replace('-S1-', '-'),
  ])
    assert.equal(decodeDeparture(invalid).ok, false, invalid);
});

test('un code3 à caprice ne peut pas être rétrogradé en code1/2', () => {
  for (const mission of MISSIONS)
    for (const caprice of capricesForMission(mission.id)) {
      const run: MissionRun = { ...basic, missionId: mission.id, caprice: caprice.id };
      const code = encodeDeparture({ kind: 'mission', run });
      assert.equal(decodeDeparture(code.replace('-3-', '-1-')).ok, false);
      assert.equal(decodeDeparture(code.replace('-3-', '-2-')).ok, false);
    }
});
