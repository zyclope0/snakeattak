import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import type { Entity } from '../src/game.ts';
import { enemies } from '../src/enemies.ts';
import { variantFor, waveBriefing } from '../src/waves.ts';
import { encodeCheckpoint, decodeCheckpoint } from '../src/checkpoints.ts';

function duel(kind = 'hero') {
  const g = new Game(94);
  g.startWave();
  g.step(1 / 30);
  g.remaining = 0;
  g.eggs = [];
  const u = g.units.find((v) => v.kind === 'hero')!;
  g.units = [u];
  Object.assign(u, { kind, x: 828, y: 324, homeX: 828, homeY: 324, cool: 0 });
  const e = g.enemies[0];
  Object.assign(e, { x: 800, y: 324, stage: 4, path: [], nav: 0, hp: 1, maxHp: 100, cool: 10 });
  return { g, u, e };
}
test('cobra royal et mamba retirent exactement 2 et 3 PV au seul tueur, une seule fois', () => {
  for (const [variant, damage] of [
    ['royal', 2],
    ['mamba', 3],
  ] as const) {
    const { g, u, e } = duel('shield');
    e.variant = variant as never;
    const bystander = { ...u, id: 999, x: 900, cool: 99 };
    g.units.push(bystander);
    const hp = u.hp;
    g.step(1 / 30);
    assert.equal(u.hp, hp - damage);
    assert.equal(bystander.hp, hp);
    assert.equal(g.kills, 1);
    g.step(1 / 30);
    assert.equal(u.hp, hp - damage);
    assert.equal(g.kills, 1);
  }
});
test('les réactions de mort attribuent aussi les victimes du souffle et du deuxième coup', () => {
  for (const kind of ['dragon', 'tank', 'twohead']) {
    const { g, u, e } = duel(kind);
    e.variant = 'royal' as never;
    const second = { ...e, id: 998, x: 795, y: 330, variant: 'mamba' } as Entity;
    g.enemies.push(second);
    const hp = u.hp;
    g.step(1 / 30);
    assert.equal(g.kills, 2, kind);
    assert.equal(u.hp, hp - 5, kind);
  }
});
test('un tueur fragile peut mourir de la réaction, sans perdre le crédit de sa victoire', () => {
  const { g, u, e } = duel('archer');
  u.hp = 2;
  e.variant = 'mamba' as never;
  g.step(1 / 30);
  assert.equal(g.units.length, 0);
  assert.equal(g.kills, 1);
});
test('un serpent enfui et le roi ne déclenchent aucune réaction de cobra', () => {
  for (const boss of [false, true]) {
    const { g, u, e } = duel();
    e.variant = 'royal' as never;
    e.boss = boss;
    if (!boss) Object.assign(e, { x: 1018, y: 324, hp: 100, stage: 6 });
    const hp = u.hp;
    g.step(1 / 30);
    assert.equal(u.hp, hp);
  }
});
test('la sonnette provoque une hésitation locale, visible, bornée et sans tir ami', () => {
  const { g, u, e } = duel();
  Object.assign(e, { variant: 'rattlesnake', hp: 10000, maxHp: 10000, cool: 99 });
  const far = { ...u, id: 999, x: 984, y: 468, homeX: 984, homeY: 468 };
  g.units.push(far);
  const hp = u.hp;
  g.step(1 / 30);
  assert.ok(u.confusedFor > 0);
  assert.equal(far.confusedFor, 0);
  assert.equal(e.hp, 10000, 'le défenseur hésite au lieu de frapper');
  assert.equal(u.hp, hp, 'aucun dégât de confusion');
  const before = JSON.stringify(g);
  g.paused = true;
  g.step(0.05);
  g.paused = false;
  assert.equal(JSON.stringify(g), before);
  for (let i = 0; i < 30; i++) g.step(1 / 30);
  assert.equal(u.confusedFor, 0);
  assert.ok(e.hp < 10000, 'le défenseur reprend ses attaques');
});
test('plusieurs sonnettes ne peuvent pas maintenir une confusion permanente', () => {
  const { g, u, e } = duel();
  Object.assign(e, { variant: 'rattlesnake', hp: 10000, maxHp: 10000, cool: 99 });
  g.enemies.push({ ...e, id: 997, x: 805, rattleCool: 1 } as Entity);
  let clearSteps = 0;
  for (let i = 0; i < 90; i++) {
    g.step(1 / 30);
    if (u.confusedFor === 0) clearSteps++;
  }
  assert.ok(clearSteps >= 60, `reprise d'activité : ${clearSteps}/90 pas`);
});
test('la sonnette fonctionne aussi contre un gardien au débouché du pont', () => {
  const { g, u, e } = duel();
  Object.assign(e, { variant: 'rattlesnake', x: 590, hp: 10000, maxHp: 10000, cool: 99 });
  Object.assign(u, { x: 628, homeX: 628 });
  g.step(1 / 30);
  assert.ok(u.confusedFor > 0);
});
test('un cracheur fait un seul impact par tir et aucun dégât périodique après', () => {
  const { g, u, e } = duel('shield');
  Object.assign(e, { variant: 'spitter', x: 700, hp: 10000, maxHp: 10000, cool: 0 });
  u.cool = 99;
  g.step(1 / 30);
  const after = u.hp;
  assert.ok(after < u.maxHp);
  e.cool = 99;
  for (let i = 0; i < 30; i++) g.step(1 / 30);
  assert.equal(u.hp, after);
});
test('les nouvelles races arrivent progressivement et le boss à trois têtes reste distinct', () => {
  for (const [variant, start] of [
    ['rattlesnake', 4],
    ['royal', 8],
    ['mamba', 10],
  ] as const) {
    assert.ok(variant in enemies);
    for (let wave = 1; wave <= 12; wave++)
      assert.equal(
        Array.from({ length: 24 }, (_, i) => variantFor(wave, i)).includes(variant as never),
        wave >= start,
      );
  }
  assert.match(waveBriefing(12).title, /King Snake/);
  const { g } = duel();
  g.wave = 12;
  g.remaining = 1;
  g.spawnTimer = 0;
  g.step(1 / 30);
  const boss = g.enemies.find((v) => v.boss)!;
  assert.equal(boss.variant, 'normal');
});
test('la sonnette reste un spécialiste unique par vague pour éviter les hésitations répétitives', () => {
  for (let wave = 4; wave <= 12; wave++)
    assert.equal(
      Array.from({ length: 24 }, (_, i) => variantFor(wave, i)).filter((v) => v === 'rattlesnake')
        .length,
      1,
    );
});
test('un camp rechargé ne conserve ni confusion ni immunité de combat', () => {
  const g = new Game();
  g.units[0].confusedFor = 0.8;
  g.units[0].confusionImmunity = 4;
  const restored = decodeCheckpoint(encodeCheckpoint(g)!)!;
  assert.equal(restored.units[0].confusedFor, 0);
  assert.equal(restored.units[0].confusionImmunity, 0);
});
