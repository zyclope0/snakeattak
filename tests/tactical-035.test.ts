import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { createMissionRun } from '../src/missions.ts';
import { kinds } from '../src/data.ts';
import { placementAdvice, weakLaneAdvice } from '../src/ui/placementAdvice.ts';
import { medicalReadout } from '../src/render/medicalReadout.ts';
import { defeatCopy, earnedStars } from '../src/render/resultCopy.ts';

test('placement advice explains real roles without changing ranges or model state', () => {
  const g = new Game(35),
    before = JSON.stringify(g);
  for (const kind of Object.keys(kinds) as (keyof typeof kinds)[]) {
    const hint = placementAdvice(kind);
    assert.equal(hint.range, kinds[kind].range);
    assert.ok(hint.hint.length > 20);
    assert.match(hint.hint, /^Touche une place libre à droite\./);
  }
  assert.match(placementAdvice('archer').hint, /derrière/);
  assert.match(placementAdvice('medic').hint, /bandages|stock/i);
  assert.match(placementAdvice('ninja').hint, /trois voies/);
  assert.match(placementAdvice('wall').hint, /reste|fixe/i);
  assert.equal(JSON.stringify(g), before);
});

test('weak lane advice ignores closed tutorial lanes and avoids fake urgency on tied lanes', () => {
  const g = new Game(35, undefined, createMissionRun('refuge', 35));
  assert.equal(weakLaneAdvice(g), null);
  g.wave = 1;
  g.units = g.units.filter((u) => u.kind === 'hero');
  Object.assign(g.units[0], { x: 800, y: 324, homeX: 800, homeY: 324 });
  const before = JSON.stringify(g),
    advice = weakLaneAdvice(g);
  assert.ok(advice);
  const open = g.enemyLanes;
  assert.equal(open.length, 2);
  assert.ok(advice!.includes(open.includes(0) ? 'Haut' : 'Bas'));
  assert.equal(JSON.stringify(g), before);
  g.units = [];
  assert.equal(weakLaneAdvice(g), null);
  g.status = 'fighting';
  assert.equal(weakLaneAdvice(g), null);
});

test('medical readout hides full stocks, groups true restocking timers and keeps partial stock visible', () => {
  const g = new Game(35);
  g.gold = 5000;
  assert.equal(g.recruit('medic', 900, 324), true);
  assert.equal(g.recruit('nurse', 900, 420), true);
  const medic = g.units.find((u) => u.kind === 'medic')!,
    nurse = g.units.find((u) => u.kind === 'nurse')!;
  assert.equal(medicalReadout(g.units).badges.length, 0);
  medic.medical = { phase: 'restocking', bandages: 0, remaining: 2.2 };
  nurse.medical = { phase: 'restocking', bandages: 0, remaining: 3.1 };
  const before = JSON.stringify(g),
    readout = medicalReadout(g.units);
  assert.equal(readout.badges.length, 0);
  assert.equal(readout.reserveLabel, 'Réserve · 2 · 4 s');
  assert.equal(JSON.stringify(g), before);
  nurse.medical = { phase: 'ready', bandages: 2, remaining: 0 };
  assert.equal(medicalReadout(g.units).badges[0].text, '+ 2/4');
  medic.medical = { phase: 'returning', bandages: 0, remaining: 0 };
  assert.ok(medicalReadout(g.units).badges.some((b) => b.text === '↩'));
});

test('result readout uses earned mission minimum and completed classic chapter scores', () => {
  const g = new Game(35, undefined, createMissionRun('refuge', 35));
  g.status = 'won';
  g.missionMinBase = 55;
  g.base = 100;
  assert.deepEqual(earnedStars(g), { count: g.missionStars, maximum: 3 });
  g.status = 'lost';
  assert.equal(earnedStars(g), null);
  assert.match(defeatCopy(g).subtitle, /même départ/);
  const classic = new Game(35);
  classic.status = 'won';
  classic.campaign.chapterStars = [3, 2, 1];
  assert.deepEqual(earnedStars(classic), { count: 6, maximum: 9 });
  assert.doesNotMatch(defeatCopy(classic).subtitle, /sauvegarde|reprendre/);
  assert.match(defeatCopy(classic).subtitle, /Rejoue.*puis.*alliés/);
});
