import test from 'node:test';
import assert from 'node:assert/strict';
import { kinds, waveStats } from '../src/data.ts';
import { enemies } from '../src/enemies.ts';
import { variantFor, waveBriefing } from '../src/waves.ts';
import { createMissionRun, MISSIONS, missionWave } from '../src/missions.ts';

// Catches a missing species and accidental reuse of a ground specialist's combat profile.
test('le volant est fragile et le soigneur royal reste incapable de mordre', () => {
  assert.ok('flying' in enemies, 'le catalogue doit décrire les volants');
  assert.ok('courtHealer' in enemies, 'le catalogue doit décrire le soigneur royal');
  const flying = enemies['flying' as keyof typeof enemies];
  const healer = enemies['courtHealer' as keyof typeof enemies];
  assert.ok(flying.hp < enemies.normal.hp);
  assert.ok(flying.speed > enemies.normal.speed);
  assert.equal(healer.damage, 0);
  assert.ok(healer.range > flying.range);
});

// Catches melee or a healer acquiring an air target simply because it is nearby.
test('seuls archers, dragons et tanks peuvent toucher les volants', async () => {
  const { canHitFlying, isFlying } = await import('../src/flying.ts');
  assert.deepEqual(
    Object.keys(kinds)
      .filter((kind) => canHitFlying(kind))
      .sort(),
    ['archer', 'dragon', 'tank'],
  );
  assert.equal(canHitFlying('snake'), false);
  assert.equal(isFlying({ kind: 'snake', variant: 'flying', boss: false }), true);
  assert.equal(isFlying({ kind: 'snake', variant: 'normal', boss: false }), false);
  assert.equal(isFlying({ kind: 'snake', variant: 'flying', boss: true }), false);
  assert.equal(isFlying({ kind: 'dragon', variant: 'flying', boss: false }), false);
});

// Catches an early introduction, periodic selection filling a wave, or lost death reactions.
test('la sélection aérienne remplace un puis deux emplacements et préserve les serpents réactifs', async () => {
  const { flyingVariant } = await import('../src/flying.ts');
  for (let rank = 1; rank <= 12; rank++) {
    const originals = Array.from({ length: waveStats(rank).count }, (_, i) =>
      variantFor(rank, i + 1),
    );
    const selected = originals.map((base, i) => flyingVariant(base, rank, i + 1));
    assert.equal(
      selected.filter((kind) => kind === 'flying').length,
      rank < 6 ? 0 : rank < 9 ? 1 : 2,
    );
    for (const special of ['rattlesnake', 'royal', 'mamba'] as const)
      assert.equal(
        selected.filter((kind) => kind === special).length,
        originals.filter((kind) => kind === special).length,
      );
    assert.equal(selected.includes('courtHealer'), false);
  }
  for (const protectedKind of ['rattlesnake', 'royal', 'mamba', 'courtHealer'] as const)
    for (const index of [4, 9])
      assert.equal(flyingVariant(protectedKind, 12, index), protectedKind);
  for (const bad of [-1, 0, 4.5, NaN, Infinity])
    assert.equal(flyingVariant('normal', 9, bad), 'normal');
  assert.equal(flyingVariant('normal', NaN, 4), 'normal');
  assert.equal(
    Array.from({ length: 1000 }, (_, i) => flyingVariant('normal', 100, i + 1)).filter(
      (kind) => kind === 'flying',
    ).length,
    2,
  );
});

// Catches applying air selection before assault overrides or changing deterministic hatch timers.
test('toutes les expéditions introduisent un volant au rang six sans changer leur tempo', () => {
  for (const definition of MISSIONS)
    for (const assault of ['balanced', 'rush', 'escort'] as const)
      for (let local = 1; local <= definition.waves.length; local++) {
        const run = { ...createMissionRun(definition.id, 42), assault };
        const wave = missionWave(run, local);
        const legacy = missionWave(run, local, false);
        assert.equal(
          wave.composition.filter((kind) => kind === 'flying').length,
          wave.rank >= 6 ? 1 : 0,
        );
        assert.equal(legacy.composition.includes('flying'), false);
        assert.equal(wave.composition.length, legacy.composition.length);
        assert.deepEqual(wave.cadence, legacy.cadence);
        assert.deepEqual(wave.eggs, legacy.eggs);
        assert.deepEqual(wave, missionWave(run, local));
        if (wave.rank >= 6) assert.match(wave.pattern.tip, /volant.*archer.*dragon.*tank/i);
      }
});

test('le briefing du premier rang aérien donne les trois contres avant le combat', () => {
  assert.match(waveBriefing(6).tip, /volant.*archer.*dragon.*tank/i);
});
