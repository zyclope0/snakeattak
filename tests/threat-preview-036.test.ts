import type { Entity } from '../src/game.ts';
import { umbrellaCover } from '../src/combatRules.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { MISSIONS, createMissionRun, readMissionRun } from '../src/missions.ts';
import type { MissionRun } from '../src/missions.ts';
import { activeEnemyLanes } from '../src/tutorial.ts';
import {
  waveThreats,
  currentWaveThreats,
  missionThreats,
  threatAdvice,
  THREAT_DETAILS,
} from '../src/ui/threatPreview.ts';
import type { ThreatKind } from '../src/ui/threatPreview.ts';

// Observe real births. Test-only empty defenders avoid casualties obscuring arrivals.
function actualEntries(game: Game, local: number) {
  game.wave = local - 1;
  game.units = [];
  game.base = 1e7;
  assert.equal(game.startWave(), true);
  const seen = new Set<number>();
  const entries = new Map<ThreatKind, number>();
  for (let step = 0; game.remaining > 0 && step < 3000; step++) {
    game.step(0.05);
    for (const e of game.enemies) {
      if (seen.has(e.id)) continue;
      seen.add(e.id);
      if (e.x >= 160) continue; // Eggs hatch farther down the route.
      const kind = e.boss ? 'king' : e.variant;
      entries.set(kind, (entries.get(kind) ?? 0) + 1);
    }
  }
  assert.equal(game.remaining, 0);
  return [...entries].sort(([a], [b]) => a.localeCompare(b));
}
const sorted = (entries: { kind: ThreatKind; count: number }[]) =>
  entries.map(({ kind, count }) => [kind, count] as const).sort(([a], [b]) => a.localeCompare(b));

for (const tacticalRulesEnabled of [true, false]) {
  test(`Les annonces classiques correspondent aux naissances réelles, règles tactiques ${tacticalRulesEnabled}`, () => {
    for (let local = 1; local <= 12; local++) {
      const game = new Game(36, { tacticalRulesEnabled });
      const preview = waveThreats(game, local);
      assert.deepEqual(sorted(preview.entries), actualEntries(game, local), `vague ${local}`);
      assert.equal(preview.eggs, Math.min(3, 1 + Math.floor(local / 4)));
    }
  });
}
for (const definition of MISSIONS) {
  test(`Prévision fidèle pour ${definition.name}, tous assauts/couvées`, () => {
    for (const assault of ['balanced', 'rush', 'escort'] as const)
      for (const nest of ['spread', 'clustered'] as const) {
        const run: MissionRun = { ...createMissionRun(definition.id, 36), assault, nest };
        const all = new Set<ThreatKind>();
        for (let local = 1; local <= definition.waves.length; local++) {
          const game = new Game(36, undefined, run);
          const p = waveThreats(game, local);
          assert.deepEqual(
            sorted(p.entries),
            actualEntries(game, local),
            `${assault}/${nest}/${local}`,
          );
          assert.deepEqual(p.lanes, activeEnemyLanes(run, local));
          for (const e of p.entries) all.add(e.kind);
          assert.ok(p.eggs > 0);
        }
        assert.deepEqual(new Set(missionThreats(run)), all);
        assert.ok(!all.has('king'));
        const game = new Game(36, undefined, run);
        assert.ok(game.isUnlocked(threatAdvice([...all], (k) => game.isUnlocked(k)).kind));
      }
  });
}
test('Lecture répétée et état actuel : aucun RNG ni champ Game modifié', () => {
  const game = new Game(36, undefined, createMissionRun('refuge', 36));
  for (let wave = 0; wave < 3; wave++) {
    game.wave = wave;
    const before = JSON.stringify(game);
    for (let i = 0; i < 10; i++) assert.equal(currentWaveThreats(game)!.local, wave + 1);
    assert.equal(JSON.stringify(game), before);
  }
  game.status = 'fighting';
  assert.equal(currentWaveThreats(game), null);
  game.status = 'won';
  assert.equal(currentWaveThreats(game), null);
  game.status = 'lost';
  assert.equal(currentWaveThreats(game), null);
});
test('Les anciens départs gardent trois voies, les nouveaux le masque progressif', () => {
  const run = createMissionRun('refuge', 36);
  const old = readMissionRun({ ...run, rules: undefined });
  assert.equal(old, null);
  const { rules: _, ...legacy } = run;
  const oldGame = new Game(36, undefined, legacy);
  assert.deepEqual(waveThreats(oldGame, 1).lanes, [0, 1, 2]);
  const game = new Game(36, undefined, run);
  assert.deepEqual(waveThreats(game, 1).lanes, [1]);
  assert.equal(waveThreats(game, 2).lanes.length, 2);
  assert.deepEqual(waveThreats(game, 3).lanes, [0, 1, 2]);
  assert.throws(() => waveThreats(game, 4), RangeError);
});
test('Conseils : volants, distance, disponibilité, sans achat automatique', () => {
  assert.equal(threatAdvice(['flying'], (k) => k === 'archer').kind, 'archer');
  assert.equal(threatAdvice(['spitter'], (k) => k === 'ninja').kind, 'ninja');
  assert.equal(threatAdvice(['flying'], (k) => k === 'club').kind, 'club');
  for (const kind of Object.keys(THREAT_DETAILS) as ThreatKind[]) {
    assert.ok(THREAT_DETAILS[kind].ability.length > 0);
    assert.ok(!/poison.*durée/i.test(THREAT_DETAILS[kind].ability));
  }
});

// A misleading area-protection claim must fail even when the combat helpers are unchanged.
test('La fiche parapluie décrit seulement ses flèches frontales, jamais ses voisins', () => {
  const game = new Game(36);
  const source: Entity = { ...game.units[0], kind: 'archer', x: 800 };
  const target: Entity = {
    ...game.units[0],
    kind: 'snake',
    variant: 'umbrella' as const,
    state: 'move' as const,
    x: 300,
    facing: 1 as const,
  };
  assert.equal(umbrellaCover(source, target), true);
  assert.equal(umbrellaCover(source, { ...target, variant: 'normal' }), false);
  assert.equal(umbrellaCover({ ...source, kind: 'tank' }, target), false);
  assert.equal(umbrellaCover({ ...source, x: 100 }, target), false);
  assert.equal(umbrellaCover(source, { ...target, state: 'attack' }), false);
  const copy = THREAT_DETAILS.umbrella.ability;
  assert.doesNotMatch(copy, /voisin|projectile|tirs/i);
  assert.match(copy, /flèches/i);
  assert.match(copy, /face|frontal/i);
  assert.match(copy, /marche|marchant/i);
});
