import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { createMissionRun } from '../src/missions.ts';
import { CURRENT_BALANCE_REVISION } from '../src/balanceRevision.ts';
import { NEWCOMERS } from '../src/waves.ts';
import { enemies } from '../src/enemies.ts';
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

/** The titles the board writes during `seconds`, in order, each with the time it stayed. */
function titles(p: Presentation, game: Game, seconds: number) {
  const seen: { title: string; shown: number }[] = [];
  for (let t = 0; t < seconds * 20; t++) {
    p.update(game, 50);
    const title = p.notice?.title;
    if (!title) continue;
    if (seen.at(-1)?.title === title) seen.at(-1)!.shown += 0.05;
    else seen.push({ title, shown: 0.05 });
  }
  return seen;
}
const snake = (game: Game, id: number, variant: string) =>
  (game.enemies as unknown[]).push({ ...game.units[0], id, variant, kind: 'snake', x: 60, y: 300 });

test('the new allies have their own banner, written as a title after the wave repelled', () => {
  const p = new Presentation();
  const game = adventure(1);
  game.status = 'fighting';
  p.update(game, 16);
  game.status = 'preparing';
  const snapshot = JSON.stringify(game);
  const seen = titles(p, game, 8);
  assert.equal(JSON.stringify(game), snapshot);
  // The board writes titles only: the allies must be one, not the subtitle of another.
  assert.deepEqual(
    seen.map((n) => n.title),
    ['Vague 1 repoussée !', 'Nouveaux alliés : Bouclier et Batteur !'],
  );
  assert.ok(seen[1].shown > 3);
});

test('the banner of the new allies waits until the bonus is chosen', () => {
  const p = new Presentation();
  const game = adventure(4);
  game.status = 'fighting';
  p.update(game, 16);
  game.status = 'preparing';
  game.rewards.pending = 4;
  const during = titles(p, game, 8).map((n) => n.title);
  assert.ok(!during.some((title) => title.startsWith('Nouveaux alliés')));
  game.rewards.pending = null;
  assert.match(titles(p, game, 2)[0].title, /^Nouveaux alliés : /);
});

test('new snakes let the title of the wave be read, then come one after the other', () => {
  const p = new Presentation();
  const game = adventure(7);
  game.status = 'preparing';
  p.update(game, 16);
  game.wave = 8;
  game.status = 'fighting';
  // The three newcomers of the eighth wave, out in the same frame as the title of the wave.
  snake(game, 9101, 'rare');
  snake(game, 9102, 'fang');
  snake(game, 9103, 'royal');
  const seen = titles(p, game, 16);
  assert.match(seen[0].title, /^Vague 8 · /);
  assert.ok(seen[0].shown > 2.5, `wave title shown ${seen[0].shown} s`);
  assert.deepEqual(
    seen.slice(1).map((n) => n.title),
    [
      'Nouveau serpent : Serpent rare !',
      'Nouveau serpent : Grands crocs !',
      'Nouveau serpent : Cobra royal !',
    ],
  );
  for (const banner of seen.slice(1))
    assert.ok(banner.shown > 3, `${banner.title} ${banner.shown}`);
});

test('the healer of the king is named once the entrance of King Snake has been read', () => {
  const p = new Presentation();
  const game = adventure(11);
  game.gold = 20000;
  game.normalizeCamp();
  p.update(game, 16);
  game.startWave();
  const seen: string[] = [];
  const look = () => {
    p.update(game, 1000 / 30);
    const title = p.notice?.title;
    if (title && seen.at(-1) !== title) seen.push(title);
  };
  for (let i = 0; i < 3000 && !game.enemies.some((e) => e.boss); i++) {
    game.step(1 / 30);
    look();
  }
  assert.ok(game.enemies.some((e) => e.boss));
  const before = JSON.stringify(game);
  for (let i = 0; i < 400; i++) look();
  assert.equal(JSON.stringify(game), before);
  const king = seen.findIndex((title) => /King Snake/i.test(title));
  const healer = seen.indexOf(`Nouveau serpent : ${enemies.courtHealer.name} !`);
  assert.ok(king >= 0 && healer > king, seen.join(' | '));
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

test('KSSS is written even when the rare snake falls in the frame of its bite', () => {
  const p = new Presentation();
  const game = adventure(8);
  p.update(game, 16);
  snake(game, 9001, 'rare');
  p.update(game, 16);
  // Bitten, then killed before the board looked again: the snake is gone, its word stays.
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
  game.enemies.length = 0;
  p.update(game, 16);
  assert.ok(p.floats.some((f) => f.text === 'KSSS' && f.x === 500));
  // Another snake never says it.
  const q = new Presentation();
  const other = adventure(8);
  q.update(other, 16);
  snake(other, 9002, 'fang');
  q.update(other, 16);
  other.effects.push({
    sourceId: 9002,
    targetId: other.units[0].id,
    x: 500,
    y: 300,
    tx: 520,
    ty: 300,
    kind: 'hit',
    life: 0.3,
  });
  q.update(other, 16);
  assert.ok(!q.floats.some((f) => f.text === 'KSSS'));
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
