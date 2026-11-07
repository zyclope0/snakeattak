import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import type { Entity } from '../src/game.ts';
import { kinds } from '../src/data.ts';
import { freshCampaign, readCampaign, chapterIndex, chapterStars } from '../src/campaignRules.ts';
import { decodeCheckpoint, encodeCheckpoint } from '../src/checkpoints.ts';

const near = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
function finish(g: Game) {
  g.remaining = 0;
  g.enemies = [];
  g.eggs = [];
  g.step(0.05);
}
function duel(training: 'none' | 'force' | 'guard' = 'none') {
  const g = new Game(94);
  g.wave = 4;
  if (training !== 'none') assert.equal(g.trainHero(training), true);
  assert.equal(g.startWave(), true);
  g.step(0.05);
  g.remaining = 1;
  g.spawnTimer = 999;
  g.eggs = [];
  const u = g.units.find((v) => v.kind === 'hero')!;
  g.units = [u];
  Object.assign(u, { x: 828, y: 324, homeX: 828, homeY: 324, cool: 0 });
  const e = g.enemies[0];
  Object.assign(e, {
    x: 800,
    y: 324,
    stage: 4,
    path: [],
    nav: 0,
    hp: 10000,
    maxHp: 10000,
    cool: 99,
    variant: 'normal',
  });
  return { g, u, e };
}

test('campaign rules: isolated defaults, chapter boundaries, score thresholds and bounded decoding', () => {
  assert.deepEqual(freshCampaign(), {
    training: 'none',
    chapterMin: [100, 100, 100],
    chapterStars: [0, 0, 0],
  });
  const a = freshCampaign();
  a.chapterMin[0] = 20;
  assert.equal(freshCampaign().chapterMin[0], 100);
  assert.deepEqual([1, 4, 5, 8, 9, 12].map(chapterIndex), [0, 0, 1, 1, 2, 2]);
  assert.deepEqual([0, 59.99, 60, 89.99, 90, 100].map(chapterStars), [1, 1, 2, 2, 3, 3]);
  const valid = { training: 'force', chapterMin: [58, 90, 100], chapterStars: [1, 0, 0] };
  assert.deepEqual(readCampaign(valid, 5), valid);
  for (const patch of [
    { training: 'magic' },
    { chapterMin: [100, 100] },
    { chapterMin: [-1, 100, 100] },
    { chapterMin: [NaN, 100, 100] },
    { chapterStars: [4, 0, 0] },
    { chapterStars: [1.5, 0, 0] },
    { chapterStars: [1, 3, 0] },
  ])
    assert.equal(readCampaign({ ...valid, ...patch }, 5), null);
  assert.equal(readCampaign(valid, 3), null, 'training cannot predate wave four');
});

test('hero training: exact cost, one permanent branch, living hero and command refusal without mutation', () => {
  const g = new Game();
  for (const setup of [
    () => {
      g.wave = 3;
    },
    () => {
      g.wave = 4;
      g.paused = true;
    },
    () => {
      g.paused = false;
      g.status = 'fighting';
    },
    () => {
      g.status = 'preparing';
      g.gold = 89;
    },
    () => {
      g.gold = 300;
      g.units.find((u) => u.kind === 'hero')!.hp = 0;
    },
  ]) {
    setup();
    const before = JSON.stringify(g);
    assert.equal(g.trainHero('force'), false);
    assert.equal(JSON.stringify(g), before);
  }
  g.units.find((u) => u.kind === 'hero')!.hp = 80;
  assert.equal(g.trainHero('invalid' as never), false);
  const gold = g.gold;
  const rng = g.rng;
  assert.equal(g.trainHero('guard'), true);
  assert.equal(g.gold, gold - 90);
  assert.equal(g.rng, rng);
  assert.equal(g.campaign.training, 'guard');
  assert.equal(g.trainHero('force'), false);
  assert.equal(g.gold, gold - 90);
});

test('force modifies only hero outgoing damage; guard modifies bites and spit without touching fixed death reactions', () => {
  for (const training of ['none', 'force', 'guard'] as const) {
    const { g, u, e } = duel(training);
    const hp = e.hp;
    g.step(0.05);
    near(hp - e.hp, kinds.hero.damage * (training === 'force' ? 1.15 : 1));
    for (const variant of ['normal', 'spitter'] as const) {
      const plain = duel();
      const trained = duel(training);
      for (const arena of [plain, trained]) {
        arena.u.cool = 99;
        arena.e.cool = 0;
        arena.e.variant = variant;
        arena.g.step(0.05);
      }
      near(
        trained.u.maxHp - trained.u.hp,
        (plain.u.maxHp - plain.u.hp) * (training === 'guard' ? 0.85 : 1),
      );
    }
    for (const [variant, damage] of [
      ['royal', 2],
      ['mamba', 3],
    ] as const) {
      const arena = duel(training);
      arena.e.hp = 1;
      arena.e.variant = variant;
      const before = arena.u.hp;
      arena.g.step(0.05);
      assert.equal(arena.u.hp, before - damage);
    }
    const club = duel(training);
    club.u.kind = 'club';
    club.g.step(0.05);
    near(10000 - club.e.hp, kinds.club.damage);
    assert.equal(u.kind, 'hero');
  }
});

test('guard also reduces a real boss shot, preserving its targets and cooldown', () => {
  const plain = duel();
  const guarded = duel('guard');
  for (const { g, u, e } of [plain, guarded]) {
    u.cool = 99;
    e.boss = true;
    g.step(0.05);
    Object.assign(e.bossState!, { shotTargetId: u.id, targetX: u.x, targetY: u.y, windup: 0.01 });
    g.step(0.05);
  }
  near(guarded.u.maxHp - guarded.u.hp, (plain.u.maxHp - plain.u.hp) * 0.85);
  assert.equal(guarded.e.bossState!.shotsFired, 1);
});

test('encouragement is once per live wave, exact eight-second timer, strict pause and transient checkpoint state', () => {
  const g = new Game();
  assert.equal(g.encourage(), false);
  assert.equal(g.startWave(), true);
  g.paused = true;
  assert.equal(g.encourage(), false);
  g.paused = false;
  assert.equal(g.encourage(), true);
  assert.equal(g.encouragementUsed, true);
  assert.equal(g.encouragementRemaining, 8);
  assert.equal(g.encourage(), false);
  g.paused = true;
  g.step(0.05);
  assert.equal(g.encouragementRemaining, 8);
  g.paused = false;
  for (let i = 0; i < 159; i++) g.step(0.05);
  near(g.encouragementRemaining, 0.05);
  g.step(0.05);
  assert.equal(g.encouragementRemaining, 0);
  assert.equal(g.encourage(), false);
  finish(g);
  assert.equal(g.encouragementRemaining, 0);
  const raw = encodeCheckpoint(g)!;
  assert.equal(Object.hasOwn(JSON.parse(raw), 'encouragementUsed'), false);
  const restored = decodeCheckpoint(raw)!;
  assert.equal(restored.encouragementUsed, false);
  assert.equal(restored.encouragementRemaining, 0);
  assert.equal(g.startWave(), true);
  assert.equal(g.encouragementUsed, false);
  assert.equal(g.encourage(), true);
  const wall = { ...g.units[0], kind: 'wall' } as Entity;
  g.units = [wall, { ...wall, id: 999, kind: 'hero', hp: 0 }];
  g.encouragementUsed = false;
  assert.equal(g.encourage(), false);
});

test('encouragement changes allied strike cadence only, never healing or enemy cadence', () => {
  const { g, u, e } = duel();
  const nurse = { ...u, id: 998, kind: 'nurse', x: 850, cool: 0, path: [] } as Entity;
  u.hp -= 30;
  g.units.push(nurse);
  e.cool = 0;
  assert.equal(g.encourage(), true);
  g.step(0.05);
  near(u.cool, kinds.hero.rate * 0.85);
  near(nurse.cool, kinds.nurse.rate);
  near(e.cool, 1.05);
});

test('chapter minimum survives repairs and scores only on four-wave victories, including final chapter', () => {
  const g = new Game();
  g.gold = 10000;
  for (let wave = 1; wave <= 12; wave++) {
    if (g.rewards.pending !== null) g.skipReward();
    assert.equal(g.startWave(), true);
    const index = chapterIndex(wave);
    if (wave === 1 || wave === 5 || wave === 9) assert.equal(g.campaign.chapterMin[index], g.base);
    if ([2, 6, 10].includes(wave)) {
      g.step(0.05);
      g.remaining = 1;
      g.spawnTimer = 999;
      g.eggs = [];
      g.units = [];
      g.base = [59, 89, 90][index] + 9;
      Object.assign(g.enemies[0], { x: 1005, y: 324, stage: 5, path: [], nav: 99 });
      g.step(0.05);
      assert.equal(g.campaign.chapterMin[index], [59, 89, 90][index]);
      assert.equal(g.repair(), true);
      assert.equal(g.campaign.chapterMin[index], [59, 89, 90][index]);
    }
    finish(g);
    if (wave % 4 === 0) assert.equal(g.campaign.chapterStars[index], index + 1);
    else assert.equal(g.campaign.chapterStars[index], 0);
    if (wave < 12 && g.base < 100) assert.equal(g.repair(), true);
  }
  assert.equal(g.status, 'won');
  assert.deepEqual(g.campaign.chapterStars, [1, 2, 3]);
});

test('checkpoint v6 persists campaign and v3 reward decisions without replaying a gift; versions 1/2/3 migrate conservatively', () => {
  const g = new Game(27);
  g.wave = 3;
  g.startWave();
  finish(g);
  g.trainHero('force');
  g.chooseReward(g.rewardOffer[0]);
  g.campaign.chapterMin[0] = 58;
  g.campaign.chapterStars[0] = 1;
  const raw = JSON.parse(encodeCheckpoint(g)!);
  assert.equal(raw.version, 6);
  const restored = decodeCheckpoint(JSON.stringify(raw))!;
  assert.deepEqual(restored.campaign, g.campaign);
  assert.deepEqual(restored.rewards, g.rewards);
  assert.equal(restored.gold, g.gold);
  for (const version of [1, 2, 3])
    for (const wave of [0, 3, 4, 5, 8, 11]) {
      const old = { ...raw, version, wave, base: 73 };
      delete old.campaign;
      if (version < 3) delete old.rewards;
      else if (wave !== 4) {
        old.rewards = { seed: 27, pending: wave === 8 ? 8 : null, choices: [], ward: 0 };
      }
      if (version === 1)
        old.units = old.units.map(({ homeX: _homeX, ...unit }: Record<string, unknown>) => unit);
      const loaded = decodeCheckpoint(JSON.stringify(old))!;
      assert.ok(loaded, `v${version} wave${wave}`);
      assert.equal(loaded.campaign.training, 'none');
      assert.deepEqual(loaded.campaign.chapterStars, [wave >= 4 ? 1 : 0, wave >= 8 ? 1 : 0, 0]);
      assert.equal(loaded.campaign.chapterMin[Math.min(2, Math.floor(wave / 4))], 73);
      if (version === 3 && wave === 4) assert.deepEqual(loaded.rewards, g.rewards);
    }
  for (const campaign of [null, {}, { ...raw.campaign, chapterMin: [101, 100, 100] }]) {
    assert.equal(decodeCheckpoint(JSON.stringify({ ...raw, campaign })), null);
  }
});
