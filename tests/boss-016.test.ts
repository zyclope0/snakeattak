import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Game } from '../src/game.ts';

test('chaque campagne copie et gèle son réglage sans contaminer une autre partie', () => {
  const overrides = { bossShotDamage: 12 };
  const first = new Game(1, overrides);
  const second = new Game(1);
  overrides.bossShotDamage = 45;
  assert.equal(first.tuning.bossShotDamage, 12);
  assert.equal(second.tuning.bossShotDamage, DEFAULT_BALANCE.bossShotDamage);
  assert.ok(Object.isFrozen(first.tuning));
  assert.notEqual(first.tuning, second.tuning);
});

import { DEFAULT_BALANCE, LEGACY_BALANCE, makeBalanceTuning } from '../src/balanceTuning.ts';
import type { BalanceTuning } from '../src/balanceTuning.ts';
import type { Entity } from '../src/game.ts';
import type { Kind } from '../src/data.ts';
import { kinds } from '../src/data.ts';
import { incomingDamage, attackDamage } from '../src/unitRules.ts';
import { absorbBossHit, ensureBossState } from '../src/boss.ts';

test('un coup entièrement absorbé ne laisse aucune fuite de dégâts flottants', () => {
  for (const [damage, factor] of [
    [15, 0.55],
    [24, 1.4],
    [30, 0.45],
  ]) {
    const body = { boss: true, hp: 1000, maxHp: 1000, x: 700, y: 324 };
    const state = ensureBossState(body, { ...DEFAULT_BALANCE, bossShieldFraction: 0.1 })!;
    assert.equal(absorbBossHit(state, damage, factor), 0);
    assert.ok(state.shield > 0);
    assert.equal(state.shieldsBroken, 0);
    state.shield = damage * factor;
    assert.equal(absorbBossHit(state, damage, factor), 0);
    assert.equal(state.shield, 0);
    assert.equal(state.shieldsBroken, 1);
  }
});

const FIXTURE_BALANCE: BalanceTuning = {
  bossEnabled: true,
  tacticalRulesEnabled: false,
  bossHpMultiplier: 6.5,
  bossShieldFraction: 0.1,
  bossShieldRangedFactor: 0.55,
  bossShieldMeleeFactor: 1.4,
  bossShotDamage: 26,
  bossShotInterval: 6,
  bossShotWindup: 1.6,
  bossShotRadius: 42,
  bossShotRange: 260,
  splashSecondaryFactor: 0.75,
  mutantDamageFactor: 1,
};
function arena(kind: Kind = 'hero', tuning: Partial<BalanceTuning> = {}) {
  const g = new Game(94, { ...FIXTURE_BALANCE, ...tuning });
  g.startWave();
  g.step(1 / 30);
  g.remaining = 0;
  g.eggs = [];
  const u = g.units.find((v) => v.kind === 'hero')!;
  g.units = [u];
  Object.assign(u, { kind, x: 828, y: 324, homeX: 828, homeY: 324, cool: 0 });
  const e = g.enemies[0];
  Object.assign(e, {
    boss: true,
    x: 800,
    y: 324,
    stage: 4,
    path: [],
    nav: 0,
    hp: 1000,
    maxHp: 1000,
    cool: 99,
    broodCool: 99,
  });
  return { g, u, e };
}
const near = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} ≈ ${expected}`);
function advance(g: Game, seconds: number) {
  for (let i = 0; i < Math.round(seconds * 30); i++) g.step(1 / 30);
}
function mark(tuning: Partial<BalanceTuning> = {}) {
  const fixture = arena('archer', { bossShieldFraction: 0, ...tuning });
  fixture.e.x = 700;
  fixture.u.cool = 99;
  fixture.g.step(1 / 30);
  fixture.e.bossState!.shotCooldown = 0;
  fixture.g.step(1 / 30);
  return fixture;
}

test('les champs connus sont validés aux limites et les champs inconnus écartés', () => {
  for (const key of Object.keys(DEFAULT_BALANCE) as (keyof BalanceTuning)[]) {
    const bad = key === 'bossEnabled' ? 1 : NaN;
    assert.throws(() => makeBalanceTuning({ [key]: bad }));
    if (key !== 'bossEnabled') assert.throws(() => makeBalanceTuning({ [key]: -1 }));
  }
  assert.equal(Object.hasOwn(makeBalanceTuning({ extra: 42 } as never), 'extra'), false);
  assert.deepEqual(makeBalanceTuning(LEGACY_BALANCE), LEGACY_BALANCE);
});
test('la protection absorbe selon le rôle et convertit le débordement avant armure', () => {
  for (const kind of ['archer', 'hero'] as const) {
    const { g, e } = arena(kind);
    g.step(1 / 30);
    const factor =
      kind === 'archer' ? g.tuning.bossShieldRangedFactor : g.tuning.bossShieldMeleeFactor;
    near(e.hp, 1000);
    near(e.bossState!.shield, 100 - kinds[kind].damage * factor);
    e.bossState!.shield = 5;
    e.variant = 'armored';
    g.units[0].cool = 0;
    g.step(1 / 30);
    near(e.hp, 1000 - (kinds[kind].damage - 5 / factor) * 0.72);
    assert.equal(e.bossState!.shield, 0);
    assert.equal(e.bossState!.shieldsBroken, 1);
    assert.ok(e.bossState!.breakFlash > 0);
  }
});
test('trois protections finies aux seuils 60 et 25 pour cent, jamais de recharge', () => {
  const { g, u, e } = arena();
  u.cool = 99;
  g.step(1 / 30);
  assert.equal(e.bossState!.phase, 1);
  assert.equal(e.bossState!.shield, 100);
  for (const [hp, phase] of [
    [600, 2],
    [250, 3],
  ] as const) {
    e.bossState!.shield = 0;
    e.hp = hp;
    g.step(1 / 30);
    assert.equal(e.bossState!.phase, phase);
    assert.equal(e.bossState!.shield, 100);
    e.bossState!.shield = 0;
    advance(g, 0.5);
    assert.equal(e.bossState!.shield, 0);
  }
  e.hp = 0.1;
  g.step(1 / 30);
  assert.equal(e.hp, 0.1, 'toute santé positive reste vivante');
  e.hp = 0;
  g.step(1 / 30);
  assert.equal(g.enemies.length, 0);
  assert.equal(e.hp, 0, 'la transition de phase ne ressuscite pas');
});
test('le crachat annonce un point fixe, privilégie les tireurs puis frappe une seule fois', () => {
  const { g, u, e } = mark();
  assert.ok(e.bossState!.windup > 0);
  assert.equal(e.bossState!.shotsFired, 0);
  assert.equal(e.bossState!.shotTargetId, u.id);
  assert.equal(e.bossState!.targetX, 828);
  const hp = u.hp;
  advance(g, 1);
  assert.equal(u.hp, hp);
  advance(g, 0.7);
  assert.equal(e.bossState!.shotsFired, 1);
  near(u.hp, hp - 26);
  advance(g, 1);
  near(u.hp, hp - 26);
});
test('une marque reste après la mort de sa cible mais épargne un allié sorti du cercle', () => {
  const { g, u, e } = mark();
  const friend = { ...u, id: 998, x: 828, hp: 300, maxHp: 300 };
  g.units.push(friend);
  u.hp = 0;
  advance(g, 1.7);
  assert.equal(e.bossState!.shotsFired, 1);
  near(friend.hp, 300 - 26);
  const moving = mark();
  const hp = moving.u.hp;
  moving.u.x = moving.u.homeX = 984;
  advance(moving.g, 1.7);
  assert.equal(moving.u.hp, hp);
});
test('pause stricte et mort du lanceur annulent tout impact ultérieur', () => {
  const { g, e, u } = mark();
  g.paused = true;
  const before = JSON.stringify(g);
  advance(g, 3);
  assert.equal(JSON.stringify(g), before);
  g.paused = false;
  const hp = u.hp;
  e.hp = 0;
  advance(g, 2);
  assert.equal(u.hp, hp);
  assert.equal(e.bossState!.windup, 0);
  assert.equal(e.bossState!.shotTargetId, null);
  assert.equal(e.bossState!.shotsFired, 0);
});
test('le protecteur réduit un impact de zone puis respecte sa recharge de trois secondes', () => {
  const { g, e, u } = mark();
  const guard = {
    ...u,
    id: 998,
    kind: 'shield',
    x: 860,
    homeX: 860,
    confusedFor: 10,
    hp: 1000,
    maxHp: 1000,
  } as Entity;
  const friend = { ...u, id: 997, x: 804, homeX: 804 };
  g.units = [u, friend, guard];
  const hp = u.hp;
  advance(g, 1.7);
  near(u.hp, hp - 26 * 0.4);
  near(friend.hp, hp - 26);
  near(guard.hp, 1000 - incomingDamage('shield', 26));
  assert.ok(guard.guardCool > 2.8 && guard.guardCool <= 3);
  assert.equal(e.bossState!.shotsFired, 1);
});
test('souffle et obus gardent les dégâts principaux et réduisent seulement les voisins', () => {
  for (const kind of ['dragon', 'tank'] as const) {
    const { g, e } = arena(kind, { splashSecondaryFactor: 0.25 });
    e.boss = false;
    const neighbor = { ...e, id: 999, x: 790 };
    g.enemies.push(neighbor);
    g.step(1 / 30);
    near(e.hp, 1000 - kinds[kind].damage);
    near(neighbor.hp, 1000 - kinds[kind].damage * 0.25);
    assert.equal(e.bossState, undefined);
  }
});
test('le mode legacy conserve la santé, les attaques et les zones du moteur 0.15', () => {
  const { g, e } = arena('tank', LEGACY_BALANCE);
  const neighbor = { ...e, id: 999, x: 790 };
  g.enemies.push(neighbor);
  g.step(1 / 30);
  assert.equal(e.bossState, undefined);
  near(e.hp, 1000 - kinds.tank.damage);
  near(neighbor.hp, 1000 - kinds.tank.damage);
});

test('le roi attend x576 et choisit un tireur avant un voisin plus proche', () => {
  const { g, u, e } = arena('archer');
  e.x = 575;
  u.cool = 99;
  g.step(1 / 30);
  e.x = 575;
  e.bossState!.shotCooldown = 0;
  g.step(1 / 30);
  assert.equal(e.bossState!.windup, 0);
  e.x = 700;
  const guard = { ...u, id: 998, kind: 'club', x: 730, homeX: 730, confusedFor: 10 } as Entity;
  const farRanged = { ...u, id: 997, x: 900, homeX: 900 };
  g.units = [guard, farRanged, u];
  g.step(1 / 30);
  assert.equal(e.bossState!.shotTargetId, u.id);
  assert.equal(e.bossState!.targetX, 828);
});
test('un coup fatal ne donne aucune protection de phase ni dernier crachat', () => {
  const { g, u, e } = mark();
  const state = e.bossState!;
  e.hp = 1;
  e.x = 800;
  u.kind = 'hero';
  u.cool = 0;
  g.step(1 / 30);
  assert.ok(e.hp <= 0);
  assert.equal(g.enemies.length, 0);
  assert.equal(state.windup, 0);
  assert.equal(state.shotTargetId, null);
  assert.equal(state.shotsFired, 0);
});

test('un vrai combat casse exactement trois protections avant la mort, sans renouvellement', () => {
  const { g, u, e } = arena();
  for (let i = 0; i < 100 && e.hp > 0; i++) {
    u.cool = 0;
    e.cool = 99;
    g.step(1 / 30);
  }
  assert.ok(e.hp <= 0);
  assert.equal(e.bossState!.phase, 3);
  assert.equal(e.bossState!.shieldsBroken, 3);
  assert.equal(e.bossState!.shield, 0);
  assert.equal(g.kills, 1);
});
test('legacy reproduit 180 instantanés du moteur 0.15 conservé, dont le roi et les zones', () => {
  // Recorded against the preserved 0.15 source, not regenerated by this implementation.
  const expected = '18761719ae593f389cf84e34b1f96e97e50f0f7abfb5f553c5525f01ac2a0d1b';
  const hash = createHash('sha256');
  for (const seed of [1, 94, 2026])
    for (const completed of [0, 11]) {
      const g = new Game(seed, LEGACY_BALANCE);
      g.wave = completed;
      g.startWave();
      if (completed === 11) g.remaining = 1;
      for (let i = 0; i < 900; i++) {
        if (i === 5 && completed === 11) {
          Object.assign(g.enemies[0], { x: 800, y: 324, stage: 4, nav: 0, path: [] });
          g.units[2].kind = 'tank';
        }
        if (i === 90) g.offerFeast(1, 'sticky');
        g.step(1 / 30);
        if (i % 30 === 0) {
          const {
            mission: _mission,
            missionMinBase: _missionMinBase,
            tuning: _tuning,
            rewards: _rewards,
            campaign: _campaign,
            encouragementUsed: _encouragementUsed,
            encouragementRemaining: _encouragementRemaining,
            ...state
          } = g;
          hash.update(JSON.stringify(state) + '\n');
        }
      }
    }
  assert.equal(hash.digest('hex'), expected);
});

test('le facteur mutant est borné entre 1 et 2 et vaut explicitement 1 en legacy', () => {
  assert.equal(makeBalanceTuning().mutantDamageFactor, DEFAULT_BALANCE.mutantDamageFactor);
  assert.equal(LEGACY_BALANCE.mutantDamageFactor, 1);
  for (const factor of [1, 1.6, 2])
    assert.equal(makeBalanceTuning({ mutantDamageFactor: factor }).mutantDamageFactor, factor);
  for (const factor of [0.99, 2.01, NaN, Infinity])
    assert.throws(() => makeBalanceTuning({ mutantDamageFactor: factor }));
});
test('seuls les deux mutants multiplient leurs dégâts sortants, sans changer la charge', () => {
  for (const kind of Object.keys(kinds) as Kind[]) {
    const multiplier = kind === 'mutantRock' || kind === 'mutantStretch' ? 1.6 : 1;
    for (const charge of [0, 1]) {
      near(attackDamage(kind, charge, 1.6), attackDamage(kind, charge) * multiplier);
      near(attackDamage(kind, charge, 1), attackDamage(kind, charge));
    }
  }
});
test('deux combats mutants gardent des dégâts isolés sans modifier PV, prix ou cadence', () => {
  const catalogue = JSON.stringify(kinds);
  for (const kind of ['mutantRock', 'mutantStretch', 'hero'] as const) {
    const overrides = { mutantDamageFactor: 1.8 };
    const boosted = arena(kind, overrides);
    const regular = arena(kind, LEGACY_BALANCE);
    overrides.mutantDamageFactor = 2;
    for (const { g, e } of [boosted, regular]) {
      e.boss = false;
      g.step(1 / 30);
    }
    const factor = kind === 'hero' ? 1 : 1.8;
    near(1000 - boosted.e.hp, kinds[kind].damage * factor);
    near(1000 - regular.e.hp, kinds[kind].damage);
    assert.equal(boosted.g.tuning.mutantDamageFactor, 1.8);
    assert.equal(regular.g.tuning.mutantDamageFactor, 1);
    assert.equal(boosted.u.hp, regular.u.hp);
    assert.equal(boosted.u.maxHp, regular.u.maxHp);
    assert.equal(boosted.u.cool, regular.u.cool);
    assert.equal(boosted.g.gold, regular.g.gold);
  }
  assert.equal(JSON.stringify(kinds), catalogue);
});
