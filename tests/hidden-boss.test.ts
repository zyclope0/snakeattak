import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { Game } from '../src/game.ts';
import { HiddenBossGame } from '../src/hiddenBoss.ts';
import {
  CURRENT_HIDDEN_BOSS_VERSION,
  HIDDEN_BOSS_CANDIDATES,
  HIDDEN_BOSS_VERSIONS,
  hiddenBossTuning,
} from '../src/hiddenBossTuning.ts';
import type { HiddenBossTuning } from '../src/hiddenBossTuning.ts';
import { ringsOf } from '../src/engine/bossChain.ts';
import { createMissionRun } from '../src/missions.ts';
import { ENDLESS_RULES } from '../src/endless.ts';
import { LANES } from '../src/ai.ts';
import { feastPoint } from '../src/tactics.ts';
import { CRYSTAL_X } from '../src/boardLandmarks.ts';
import { START_TEAM_SIZE } from '../src/gameConstants.ts';
import { playStage } from '../scripts/lab/players.ts';
import * as TEXT from '../src/texts/fr/hiddenBoss.ts';
import { fill } from '../src/texts/fill.ts';

// Le combat du boss caché (lot 2) : grandir en avalant un allié ou du miel, raccourcir quand
// un anneau casse, gagner quand il ne reste que la tête, perdre au cristal, la même partie pour
// la même graine, un nombre d'anneaux borné — et rien de changé pour les autres parties.
const MOYEN = HIDDEN_BOSS_CANDIDATES.moyen;
const STEP = 1 / 30;

/** A battle whose boss has just left its den, with only the allies `keep` accepts. */
function fighting(seed = 7, trial?: HiddenBossTuning, keep = (_kind: string) => false) {
  const game = new HiddenBossGame(seed, undefined, trial);
  assert.equal(game.startWave(), true);
  game.units = game.units.filter((u) => keep(u.kind));
  return { game, chain: game.hiddenBoss.chain! };
}
/** Puts the head at (x, y) on `lane`, walking the lane towards the crystal. */
function placeHead(game: HiddenBossGame, x: number, lane: number, stage: number) {
  const head = game.hiddenBoss.chain!.head;
  Object.assign(head, { x, y: LANES[lane], lane, stage, turnY: null, path: [], nav: 0 });
  return head;
}

test('la version 1 est le réglage « moyen », et une version inconnue est refusée', () => {
  assert.equal(CURRENT_HIDDEN_BOSS_VERSION, 1);
  assert.equal(hiddenBossTuning(1), HIDDEN_BOSS_CANDIDATES.moyen);
  assert.deepEqual(Object.keys(HIDDEN_BOSS_VERSIONS), ['1']);
  assert.deepEqual(Object.keys(HIDDEN_BOSS_CANDIDATES), ['doux', 'moyen', 'costaud']);
  for (const bad of [0, 2, '1', null, undefined, 1.5])
    assert.throws(() => hiddenBossTuning(bad), RangeError, String(bad));
  assert.throws(() => new HiddenBossGame(7, 2 as 1), RangeError);
  // Retyped on purpose: a value of version 1 that changes is a fight that changes.
  assert.deepEqual(
    { ...HIDDEN_BOSS_VERSIONS[1] },
    {
      balance: 7,
      terrainWave: 1,
      startGold: 1200,
      startRings: 18,
      maxRings: 30,
      ringHp: 450,
      ringCoins: 20,
      ringSpacing: 22,
      headSpeed: 24,
      biteDamage: 14,
      biteInterval: 1,
      biteReach: 44,
      swallowReach: 60,
      allyGulp: 1.5,
      honeyGulp: 4,
      honeyReach: 12,
    },
  );
  assert.ok(Object.isFrozen(HIDDEN_BOSS_VERSIONS[1]));
});

test('un réglage d’essai est vérifié et la partie qui le joue n’a pas de version', () => {
  assert.equal(new HiddenBossGame(7).hiddenBoss.version, 1);
  assert.equal(new HiddenBossGame(7, 1, MOYEN).hiddenBoss.version, null);
  for (const bad of [
    { ringHp: -1 },
    { headSpeed: Number.NaN },
    { startRings: 0 },
    { startRings: 2.5 },
    { maxRings: 3, startRings: 4 },
    { balance: 9 },
    { terrainWave: 0 },
    { honeyReach: undefined },
  ])
    assert.throws(
      () => new HiddenBossGame(7, 1, { ...MOYEN, ...bad } as HiddenBossTuning),
      RangeError,
    );
});

test('la préparation : la bourse du réglage, le camp de départ, toute la boutique, pas de boss', () => {
  const game = new HiddenBossGame(7);
  assert.equal(game.status, 'preparing');
  assert.equal(game.gold, MOYEN.startGold);
  assert.equal(game.units.length, START_TEAM_SIZE);
  assert.equal(game.hiddenBoss.chain, null);
  assert.equal(game.totalWaves, 1);
  assert.equal(game.level.id, 'clearing');
  assert.deepEqual([...game.enemyLanes], [0, 1, 2]);
  assert.equal(game.caprice.smart, true);
  // The boss comes after the adventure: the shop holds every ally of its balance revision.
  for (const kind of ['tank', 'trex', 'spinosaurus', 'twohead'] as const)
    assert.equal(game.isUnlocked(kind), true, kind);
  assert.equal(game.recruit('archer', 900, 324), true);
  assert.equal(game.gold, MOYEN.startGold - game.recruitCost('archer'));
});

test('la vague : la tête sort de l’antre, ses anneaux derrière elle, hors de portée des coups', () => {
  const { game, chain } = fighting();
  assert.equal(game.status, 'fighting');
  assert.equal(game.message, fill(TEXT.nSortDeSonAntre, TEXT.leBossCache));
  assert.equal(ringsOf(game).length, MOYEN.startRings);
  assert.equal(game.enemies.length, MOYEN.startRings);
  assert.ok(!game.enemies.includes(chain.head), 'the head is never a target');
  assert.equal(chain.most, MOYEN.startRings);
  for (const ring of ringsOf(game)) {
    assert.equal(ring.hp, MOYEN.ringHp);
    assert.ok(ring.x < chain.head.x, 'the rings follow the head');
  }
  // A second wave never comes.
  assert.equal(game.startWave(), false);
  for (let i = 0; i < 300; i++) game.step(STEP);
  assert.ok(chain.head.x > 108 + 100, 'the head walks');
  const rings = ringsOf(game);
  for (let i = 1; i < rings.length; i++)
    assert.ok(Math.abs(Math.hypot(rings[i].x - rings[i - 1].x, rings[i].y - rings[i - 1].y)) < 30);
});

test('un anneau cassé quitte le corps, paie ses pièces, et ceux de derrière se rapprochent', () => {
  const { game, chain } = fighting();
  for (let i = 0; i < 400; i++) game.step(STEP);
  const before = ringsOf(game);
  const broken = before[3];
  const fifth = before[4];
  const place = { x: broken.x, y: broken.y };
  const gold = game.gold;
  broken.hp = 0;
  chain.gulp = 1; // the head stands still: the body does not move this step
  game.step(STEP);
  const after = ringsOf(game);
  assert.equal(after.length, before.length - 1);
  assert.ok(!after.includes(broken));
  assert.equal(after[3], fifth, 'the ring behind takes the broken one’s place');
  assert.deepEqual({ x: fifth.x, y: fifth.y }, place);
  assert.equal(game.gold, gold + MOYEN.ringCoins);
  assert.equal(chain.broken, 1);
  assert.equal(game.kills, 1);
});

test('la tête avale un allié tombé près d’elle : un anneau de plus, et il ne revient pas', () => {
  const { game, chain } = fighting(7, undefined, (kind) => kind === 'club');
  const head = placeHead(game, 640, 1, 2);
  const ally = game.units[0];
  Object.assign(ally, { x: head.x + 20, y: head.y, hp: 1 });
  game.units = [ally];
  const rings = ringsOf(game).length;
  game.step(STEP);
  assert.equal(ally.hp <= 0, true);
  assert.equal(game.units.length, 0, 'gone for good');
  assert.equal(ringsOf(game).length, rings + 1);
  assert.equal(chain.allies, 1);
  assert.equal(chain.grown, 1);
  assert.equal(chain.gulp, MOYEN.allyGulp);
  assert.equal(game.message, fill(TEXT.nAAvaleUnAllieUnAnneauDePlus, TEXT.leBossCache));
  // The new ring is the tail: the last of the body, with a full life.
  const tail = ringsOf(game).at(-1)!;
  assert.equal(tail.hp, MOYEN.ringHp);
  // While it swallows, the head stands still.
  const x = head.x;
  game.step(STEP);
  assert.equal(head.x, x);
});

test('une palissade qui tombe n’est pas avalée', () => {
  const { game, chain } = fighting();
  const head = placeHead(game, 640, 1, 2);
  game.units = [];
  assert.equal(game.recruit('wall', 700, LANES[1]), true);
  const wall = game.units[0];
  Object.assign(wall, { x: head.x + 20, y: head.y, hp: 1 });
  const rings = ringsOf(game).length;
  game.step(STEP);
  assert.equal(game.units.length, 0);
  assert.equal(ringsOf(game).length, rings);
  assert.equal(chain.allies, 0);
});

test('le miel posé sur sa voie : la tête le mange quand elle l’atteint, un anneau de plus', () => {
  for (const flavor of ['lure', 'sticky'] as const) {
    const { game, chain } = fighting();
    for (let i = 0; i < 5; i++) game.step(STEP);
    const lane = chain.head.lane;
    assert.equal(game.offerFeast(lane, flavor), true);
    const pot = feastPoint(game.feast!, game.level);
    // Just short of the pot, on the road of its lane.
    placeHead(game, pot.x - 6, lane, flavor === 'lure' ? 1 : 3);
    chain.head.y = pot.y;
    const rings = ringsOf(game).length;
    game.step(STEP);
    assert.equal(game.feast, null, flavor);
    assert.equal(chain.honey, 1, flavor);
    assert.equal(ringsOf(game).length, rings + 1, flavor);
    assert.equal(chain.gulp, MOYEN.honeyGulp, flavor);
    assert.equal(game.message, fill(TEXT.nAMangeLeMielUnAnneauDePlus, TEXT.leBossCache));
  }
});

test('le miel collant ralentit la tête avant d’être mangé', () => {
  const speedOver = (sticky: boolean) => {
    const { game, chain } = fighting();
    const lane = chain.head.lane;
    if (sticky) assert.equal(game.offerFeast(lane, 'sticky'), true);
    const head = placeHead(game, 700, lane, 4);
    head.y = feastPoint({ lane, remaining: 1, flavor: 'sticky' }, game.level).y;
    const x = head.x;
    for (let i = 0; i < 15; i++) game.step(STEP);
    return head.x - x;
  };
  assert.ok(speedOver(true) < speedOver(false) * 0.8);
});

test('le corps a un nombre d’anneaux borné : à son plus long, la tête avale sans grandir', () => {
  const trial = { ...MOYEN, startRings: 3, maxRings: 3 };
  const { game, chain } = fighting(7, trial, (kind) => kind === 'club');
  const head = placeHead(game, 640, 1, 2);
  const ally = game.units[0];
  Object.assign(ally, { x: head.x + 20, y: head.y, hp: 1 });
  game.units = [ally];
  game.step(STEP);
  assert.equal(game.units.length, 0);
  assert.equal(ringsOf(game).length, 3);
  assert.equal(chain.allies, 1);
  assert.equal(chain.grown, 0);
  assert.equal(chain.most, 3);
});

test('il ne reste que la tête : le boss s’enroule, la bataille est gagnée', () => {
  const { game, chain } = fighting();
  for (let i = 0; i < 60; i++) game.step(STEP);
  for (const ring of ringsOf(game)) ring.hp = 0;
  game.step(STEP);
  assert.equal(game.status, 'won');
  assert.equal(chain.asleep, true);
  assert.equal(game.enemies.length, 0);
  assert.equal(game.message, fill(TEXT.victoireNNAPlusQueSaTete, TEXT.leBossCache));
  const frozen = JSON.stringify(game);
  game.step(STEP);
  assert.equal(JSON.stringify(game), frozen, 'nothing moves after the end');
});

test('la tête au cristal : le camp tombe, comme dans toute bataille perdue', () => {
  const { game } = fighting();
  game.units = [];
  placeHead(game, CRYSTAL_X - 30, 1, 6);
  for (let i = 0; i < 300 && game.status === 'fighting'; i++) game.step(STEP);
  assert.equal(game.status, 'lost');
  assert.equal(game.base, 0);
});

test('la même graine joue la même bataille, pas à pas', () => {
  const trace = (seed: number) => {
    const game = new HiddenBossGame(seed);
    const hash = createHash('sha256');
    const step = game.step.bind(game);
    game.step = (dt: number) => {
      step(dt);
      hash.update(JSON.stringify(game));
    };
    const outcome = playStage(game, 'moyen');
    return { outcome, hash: hash.digest('hex') };
  };
  const first = trace(20261126);
  assert.deepEqual(trace(20261126), first);
  assert.notEqual(trace(20261127).hash, first.hash);
  assert.ok(['won', 'lost'].includes(first.outcome.status));
});

test('le boss est la seule chose nouvelle : les autres parties n’ont aucun champ de plus', () => {
  const games = [
    new Game(11),
    new Game(11, undefined, createMissionRun('refuge', 11)!),
    new Game(11, undefined, undefined, ENDLESS_RULES[1].balance, undefined, ENDLESS_RULES[1]),
  ];
  for (const game of games) {
    game.recruit('archer', 900, 324);
    game.startWave();
    for (let i = 0; i < 900; i++) game.step(STEP);
    const json = JSON.stringify(game);
    for (const word of ['hiddenBoss', 'chainRing', 'chain', 'trail', 'gulp'])
      assert.ok(!json.includes(`"${word}"`), word);
  }
});

/** Every TypeScript file under `dir`. */
function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? sources(path) : path.endsWith('.ts') ? [path] : [];
  });
}
test('aucun écran du jeu n’ouvre le combat du boss caché (lot 3)', () => {
  const allowed = new Set([
    join('src', 'hiddenBoss.ts'),
    join('src', 'hiddenBossTuning.ts'),
    join('src', 'engine', 'bossChain.ts'),
    join('src', 'render', 'hiddenBossLayer.ts'),
  ]);
  for (const file of sources('src')) {
    if (allowed.has(file)) continue;
    const code = readFileSync(file, 'utf8');
    assert.doesNotMatch(
      code,
      /['"][^'"]*\/(?:hiddenBoss(?:Tuning|Layer)?|bossChain)\.ts['"]/,
      file,
    );
  }
});
