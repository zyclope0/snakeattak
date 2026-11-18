import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { createMissionRun } from '../src/missions.ts';
import { CURRENT_BALANCE_REVISION } from '../src/balanceRevision.ts';
import { NEWCOMERS } from '../src/waves.ts';
import { Presentation } from '../src/render/presentation.ts';
import { medicalReadout } from '../src/render/medicalReadout.ts';
import { newAlliesLine, newSnakeBanner, recruitableKinds } from '../src/render/newcomers.ts';

const adventure = (wave: number) => {
  const game = new Game(31, undefined, undefined, CURRENT_BALANCE_REVISION);
  game.wave = wave;
  return game;
};

test('a snake is announced as new in the wave where the great adventure first sends it', () => {
  const ninja = NEWCOMERS.ninja.fromWave;
  const banner = newSnakeBanner(adventure(ninja), 'shadow');
  assert.deepEqual(banner, {
    title: 'Nouveau serpent : Serpent ninja !',
    subtitle: banner?.subtitle,
  });
  assert.ok(banner!.subtitle.length > 0);
  // Not in a later wave, never for the ordinary snake, and not in a mission.
  assert.equal(newSnakeBanner(adventure(ninja + 1), 'shadow'), null);
  assert.equal(newSnakeBanner(adventure(1), 'normal'), null);
  const mission = new Game(1, undefined, createMissionRun('coquilles', 4646, null, 2));
  mission.wave = ninja;
  assert.equal(newSnakeBanner(mission, 'shadow'), null);
});

test('the allies that become recruitable are named, up to three', () => {
  assert.equal(newAlliesLine([]), null);
  assert.equal(newAlliesLine(['tank']), 'Nouvel allié : Tank !');
  assert.equal(newAlliesLine(['shield', 'bat']), 'Nouveaux alliés : Bouclier et Batteur !');
  assert.match(
    newAlliesLine(['dragon', 'knight', 'mutantStretch'])!,
    /^Nouveaux alliés : .+, .+ et .+ !$/,
  );
  const before = recruitableKinds(adventure(0));
  const game = adventure(1);
  game.status = 'preparing';
  const fresh = recruitableKinds(game).filter((kind) => !before.includes(kind));
  assert.deepEqual([...fresh].sort(), ['bat', 'shield']);
});

test('a wave repelled names the new allies, and a new clearing lets them wait their turn', () => {
  const p = new Presentation();
  const game = adventure(1);
  game.status = 'fighting';
  p.update(game, 16);
  game.status = 'preparing';
  const snapshot = JSON.stringify(game);
  p.update(game, 16);
  assert.equal(p.notice?.subtitle, 'Nouveaux alliés : Bouclier et Batteur !');
  assert.equal(JSON.stringify(game), snapshot);
  // After the fourth wave the clearing is named first, then the allies.
  const q = new Presentation();
  const later = adventure(4);
  later.status = 'fighting';
  q.update(later, 16);
  later.status = 'preparing';
  q.update(later, 16);
  assert.match(q.notice!.subtitle, /clairière/i);
  for (let i = 0; i < 40 && !/^Nouveaux alliés/.test(q.notice?.title ?? ''); i++)
    q.update(later, 100);
  assert.match(q.notice!.title, /^Nouveaux alliés : /);
});

test('the bite of the rare snake is written KSSS, the word of the child', () => {
  const p = new Presentation();
  const game = adventure(8);
  p.update(game, 16);
  const snake = { id: 9001, variant: 'rare', x: 500, y: 300 };
  (game.enemies as unknown[]).push({ ...game.units[0], ...snake, kind: 'snake' });
  game.effects.push({
    sourceId: 9001,
    targetId: game.units[0].id,
    x: 500,
    y: 300,
    tx: 520,
    ty: 300,
    kind: 'hit',
    life: 0.3,
  });
  p.update(game, 16);
  assert.ok(p.floats.some((f) => f.text === 'KSSS'));
});

test('on a small board a medic shows its stock alone and the reserve its wait alone', () => {
  const g = new Game(35);
  g.gold = 5000;
  assert.equal(g.recruit('nurse', 900, 420), true);
  const nurse = g.units.find((u) => u.kind === 'nurse')!;
  nurse.medical = { phase: 'ready', bandages: 2, remaining: 0 };
  assert.equal(medicalReadout(g.units).badges[0].short, '+2');
  assert.equal(medicalReadout(g.units).reserveShort, '');
  nurse.medical = { phase: 'restocking', bandages: 0, remaining: 3.1 };
  assert.equal(medicalReadout(g.units).reserveShort, '4 s');
  nurse.medical = { phase: 'returning', bandages: 0, remaining: 0 };
  assert.equal(medicalReadout(g.units).badges[0].short, '↩');
});

test('two new snakes that come out together are announced one after the other', () => {
  const p = new Presentation();
  const game = adventure(8);
  game.status = 'fighting';
  p.update(game, 16);
  const model = game.units[0];
  for (const [id, variant] of [
    [9101, 'fang'],
    [9102, 'rare'],
  ] as const)
    (game.enemies as unknown[]).push({ ...model, id, variant, kind: 'snake', x: 60, y: 300 });
  p.update(game, 16);
  assert.equal(p.notice?.title, 'Nouveau serpent : Grands crocs !');
  const titles = new Set<string>();
  for (let i = 0; i < 80; i++) {
    p.update(game, 100);
    if (p.notice) titles.add(p.notice.title);
  }
  assert.ok(titles.has('Nouveau serpent : Serpent rare !'));
});
