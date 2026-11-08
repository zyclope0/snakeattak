import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { createMissionRun, readMissionRun } from '../src/missions.ts';
import { encodeDeparture, decodeDeparture } from '../src/departures.ts';
import { encodeCheckpoint, decodeCheckpoint } from '../src/checkpoints.ts';
import { createMissionProgressController } from '../src/missionProgress.ts';
import { createCareer } from '../src/progression.ts';
import { writeFamilyBackup, readFamilyBackup } from '../src/familyBackup.ts';
const legacy = {
  missionId: 'refuge',
  seed: 2026,
  layout: 0,
  assault: 'balanced',
  nest: 'spread',
} as const;

test('nouveaux refuges identifiés, anciens codes et autres missions gardent leurs règles', () => {
  const run = createMissionRun('refuge', 2026);
  assert.equal((run as Record<string, unknown>).rules, 2);
  const next = encodeDeparture({ kind: 'mission', run });
  assert.match(next, /^REFUGE-2-/);
  assert.deepEqual(decodeDeparture(next), { ok: true, departure: { kind: 'mission', run } });
  const old = encodeDeparture({ kind: 'mission', run: legacy });
  assert.equal(old, 'REFUGE-1-0000-7X81-EP');
  assert.deepEqual(decodeDeparture(old), { ok: true, departure: { kind: 'mission', run: legacy } });
  assert.notEqual(old, next);
  assert.equal((createMissionRun('trois-ponts', 2026) as Record<string, unknown>).rules, undefined);
  for (const rules of [0, 1, 3, null, '2', undefined])
    assert.equal(readMissionRun({ ...legacy, rules }), null);
  assert.equal(readMissionRun({ ...legacy, missionId: 'course', rules: 2 }), null);
});
test('camp7 conserve règles, achats et bandages ; downgrade refusé', () => {
  const game = new Game(2026, undefined, createMissionRun('refuge', 2026));
  assert.ok(game.recruit('medic', 960, 468));
  const medic = game.units.find((u) => u.kind === 'medic')!;
  medic.medical!.bandages--;
  medic.cool = 0.5;
  const raw = encodeCheckpoint(game)!;
  assert.ok(raw);
  assert.equal(JSON.parse(raw).version, 7);
  const loaded = decodeCheckpoint(raw)!;
  assert.ok(loaded);
  assert.deepEqual(loaded.mission, game.mission);
  assert.equal(loaded.gold, game.gold);
  assert.equal(loaded.units.length, 4);
  assert.deepEqual(loaded.units.find((u) => u.kind === 'medic')!.medical, medic.medical);
  assert.equal(loaded.units.find((u) => u.kind === 'medic')!.cool, 0.5);
  const downgraded = JSON.parse(raw);
  downgraded.version = 6;
  assert.equal(decodeCheckpoint(JSON.stringify(downgraded)), null);
  const missing = JSON.parse(raw);
  delete missing.mission.rules;
  assert.equal(decodeCheckpoint(JSON.stringify(missing)), null);
  const old = new Game(2026, undefined, legacy);
  assert.equal(JSON.parse(encodeCheckpoint(old)!).version, 6);
  assert.deepEqual(decodeCheckpoint(encodeCheckpoint(old)!)!.mission, legacy);
});
test('export familial3 protège aussi un profil sans camp ; v1/v2 restent lisibles', () => {
  const career = createCareer().state;
  const progress = createMissionProgressController();
  progress.started(createMissionRun('refuge', 2026));
  const raw = writeFamilyBackup(null, career, progress.state)!;
  assert.ok(raw);
  assert.equal(JSON.parse(raw).version, 3);
  const decoded = readFamilyBackup(raw)!;
  assert.ok(decoded);
  assert.ok('missions' in decoded);
  assert.equal(decoded.missions!.lastRuns.refuge?.rules, 2);
  const wrong = JSON.parse(raw);
  wrong.version = 2;
  assert.equal(readFamilyBackup(JSON.stringify(wrong)), null);
  const old = createMissionProgressController();
  old.started(legacy);
  const oldRaw = writeFamilyBackup(null, career, old.state)!;
  assert.equal(JSON.parse(oldRaw).version, 2);
  assert.ok(readFamilyBackup(oldRaw));
  assert.equal(readFamilyBackup(writeFamilyBackup(null, career)!)!.version, 1);
});
test('progression distingue même terrain/graines avec règles différentes', () => {
  const p = createMissionProgressController();
  p.started(legacy);
  const game = new Game(2026, undefined, { ...legacy, rules: 2 });
  assert.ok(p.rememberCamp(game));
  const state = p.state;
  assert.equal(state.lastRuns.refuge?.rules, 2);
});
