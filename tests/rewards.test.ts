import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { encodeCheckpoint, decodeCheckpoint } from '../src/checkpoints.ts';

function finish(g: Game, wave: number) {
  g.wave = wave - 1;
  assert.equal(g.startWave(), true);
  g.remaining = 0;
  g.enemies = [];
  g.eggs = [];
  g.step(1 / 30);
}
function offered(id: string, wave = 4) {
  for (let seed = 1; seed <= 100; seed++) {
    const g = new Game(seed);
    finish(g, wave);
    if (g.rewardOffer.includes(id as never)) return g;
  }
  throw Error('Expected offer not found');
}
test('les deux vraies fins de chapitre proposent trois cartes et attendent une décision', () => {
  const g = new Game(17);
  assert.equal(g.rewardOffer?.length ?? 0, 0);
  finish(g, 3);
  assert.equal(g.rewardOffer?.length ?? 0, 0);
  finish(g, 4);
  assert.equal(g.rewardOffer?.length, 3);
  assert.equal(new Set(g.rewardOffer).size, 3);
  assert.equal(g.startWave(), false);
  assert.equal(g.skipReward(), true);
  assert.equal(g.skipReward(), false);
  assert.equal(g.startWave(), true);
  g.status = 'preparing';
  finish(g, 8);
  assert.equal(g.rewardOffer.length, 3);
});
test('le choix est offert, unique, refuse les entrées forgées et ne change pas le hasard du combat', () => {
  const g = offered('pieces'),
    rng = g.rng,
    gold = g.gold;
  const before = JSON.stringify(g);
  assert.equal(g.chooseReward('inconnu'), false);
  assert.equal(JSON.stringify(g), before);
  g.paused = true;
  assert.equal(g.chooseReward('pieces'), false);
  g.paused = false;
  assert.equal(g.chooseReward('pieces'), true);
  assert.equal(g.gold, gold + 100);
  assert.equal(g.rng, rng);
  assert.equal(g.chooseReward('pieces'), false);
  assert.equal(g.gold, gold + 100);
});
test('un bon de renfort respecte le placement et se consomme seulement après réussite', () => {
  const g = new Game(23);
  finish(g, 4);
  const id = g.rewardOffer.find((id) => id.startsWith('renfort-'))!;
  const kinds = {
    'renfort-bouclier': 'shield',
    'renfort-ninja': 'ninja',
    'renfort-raptor': 'raptor',
  } as const;
  const kind = kinds[id as keyof typeof kinds];
  const gold = g.gold,
    count = g.units.length;
  assert.equal(g.chooseReward(id), true);
  assert.equal(g.recruitCost(kind), 0);
  assert.equal(g.recruit(kind, -2, 0), false);
  assert.equal(g.recruitCost(kind), 0);
  const point = Array.from({ length: 16 }, (_, i) => ({ x: 612 + i * 24, y: 324 })).find((p) =>
    g.canRecruit(kind, p.x, p.y),
  )!;
  assert.ok(point);
  g.paused = true;
  assert.equal(g.recruit(kind, point.x, point.y), false);
  g.paused = false;
  assert.equal(g.recruit(kind, point.x, point.y), true);
  assert.equal(g.gold, gold);
  assert.equal(g.units.length, count + 1);
  assert.ok(g.recruitCost(kind) > 0);
});
test('le miel amélioré utilise sa vraie durée et les deux bonus sont plafonnés par les jalons', () => {
  const g = offered('miel');
  assert.equal(g.chooseReward('miel'), true);
  assert.equal(g.feastDuration, 18);
  assert.equal(g.startWave(), true);
  assert.equal(g.offerFeast(1, 'sticky'), true);
  assert.equal(g.feast!.remaining, 18);
  g.paused = true;
  g.step(1);
  assert.equal(g.feast!.remaining, 18);
});
test('la protection absorbe deux passages ordinaires mais jamais l’entrée du roi', () => {
  for (const boss of [false, true]) {
    const g = offered('cristal');
    assert.equal(g.chooseReward('cristal'), true);
    assert.equal(g.rewards.ward, 18);
    g.startWave();
    g.step(1 / 30);
    g.remaining = 0;
    g.eggs = [];
    g.units = [];
    const enemy = g.enemies[0];
    Object.assign(enemy, {
      boss,
      x: 1005,
      y: 324,
      stage: 4,
      hp: 10000,
      maxHp: 10000,
      path: [],
      nav: 99,
      cool: 99,
    });
    g.step(1 / 30);
    if (boss) {
      assert.equal(g.base, 0);
      assert.equal(g.status, 'lost');
    } else {
      assert.equal(g.base, 100);
      assert.equal(g.rewards.ward, 9);
      g.status = 'fighting';
      g.enemies = [{ ...enemy, id: 999, hp: 10000, maxHp: 10000, x: 1005 }];
      g.step(1 / 30);
      assert.equal(g.base, 100);
      assert.equal(g.rewards.ward, 0);
    }
  }
});
test('les recharges conservent offre, graine, décision et bon utilisé sans dupliquer le cadeau', () => {
  const g = offered('pieces');
  const before = decodeCheckpoint(encodeCheckpoint(g)!)!;
  assert.deepEqual(before.rewardOffer, g.rewardOffer);
  assert.equal(before.rng, g.rng);
  assert.equal(before.chooseReward('pieces'), true);
  const restored = decodeCheckpoint(encodeCheckpoint(before)!)!;
  assert.equal(restored.gold, before.gold);
  assert.deepEqual(restored.rewards, before.rewards);
  assert.equal(restored.chooseReward('pieces'), false);
  assert.equal(restored.startWave(), true);
});
test('les camps anciens migrent au jalon exact, jamais rétroactivement', () => {
  for (const wave of [3, 4, 5, 8, 9]) {
    const g = new Game(27);
    g.wave = wave;
    const raw = JSON.parse(encodeCheckpoint(g)!);
    raw.version = 2;
    delete raw.rewards;
    const restored = decodeCheckpoint(JSON.stringify(raw))!;
    assert.ok(restored);
    assert.equal(restored.rewardOffer.length, wave === 4 || wave === 8 ? 3 : 0);
  }
});
test('les états de bonus corrompus et les récompenses doublées sont refusés', () => {
  const g = offered('cristal');
  g.chooseReward('cristal');
  const raw = JSON.parse(encodeCheckpoint(g)!);
  for (const rewards of [
    { ...raw.rewards, ward: 19 },
    { ...raw.rewards, seed: -1 },
    { ...raw.rewards, pending: 8 },
    { ...raw.rewards, choices: [...raw.rewards.choices, ...raw.rewards.choices] },
    { ...raw.rewards, choices: [{ milestone: 4, id: 'licorne', used: true }] },
  ]) {
    assert.equal(decodeCheckpoint(JSON.stringify({ ...raw, rewards })), null);
  }
});

test('le bon utilisé et la protection restante persistent sans restaurer ce qui est dépensé', () => {
  const g = new Game(23);
  finish(g, 4);
  const id = g.rewardOffer.find((id) => id.startsWith('renfort-'))!;
  g.chooseReward(id);
  const kinds = {
    'renfort-bouclier': 'shield',
    'renfort-ninja': 'ninja',
    'renfort-raptor': 'raptor',
  } as const;
  const kind = kinds[id as keyof typeof kinds];
  const point = Array.from({ length: 16 }, (_, i) => ({ x: 612 + i * 24, y: 324 })).find((p) =>
    g.canRecruit(kind, p.x, p.y),
  )!;
  g.recruit(kind, point.x, point.y);
  const restored = decodeCheckpoint(encodeCheckpoint(g)!)!;
  assert.ok(restored.recruitCost(kind) > 0);
  assert.equal(restored.units.length, g.units.length);
  assert.equal(restored.gold, g.gold);
  const ward = offered('cristal');
  ward.chooseReward('cristal');
  ward.rewards.ward = 9;
  assert.equal(decodeCheckpoint(encodeCheckpoint(ward)!)!.rewards.ward, 9);
});

test('une absorption du cristal explique au joueur que sa protection a servi', () => {
  const g = offered('cristal');
  g.chooseReward('cristal');
  g.startWave();
  g.step(1 / 30);
  g.units = [];
  g.remaining = 1;
  g.eggs = [];
  Object.assign(g.enemies[0], { x: 1005, y: 324, stage: 4, path: [], nav: 99 });
  g.step(1 / 30);
  assert.match(g.message, /protection/i);
});

test('un camp de chapitre sans décision ni offre est refusé au chargement', () => {
  const g = offered('pieces');
  const raw = JSON.parse(encodeCheckpoint(g)!);
  raw.rewards.pending = null;
  assert.equal(decodeCheckpoint(JSON.stringify(raw)), null);
});
