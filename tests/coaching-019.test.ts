import test from 'node:test';
import assert from 'node:assert/strict';
import { Session } from '../src/session.ts';
import { coachFor } from '../src/ui/coaching.ts';
import { Presentation } from '../src/render/presentation.ts';

test('la préparation présente la décision du prochain chapitre après les vagues 4 et 8', () => {
  const s = new Session(42);
  s.game.campaign.training = 'force';
  for (const [wave, clue] of [
    [4, /escortes/i],
    [8, /rempart/i],
  ] as const) {
    s.game.wave = wave;
    const before = JSON.stringify(s.game);
    assert.match(coachFor(s).title, clue);
    assert.equal(JSON.stringify(s.game), before);
  }
});

test('le conseil d’encouragement attend une attaque réelle et disparaît après utilisation', () => {
  const s = new Session(42);
  s.game.startWave();
  assert.doesNotMatch(coachFor(s).title, /encourag/i);
  s.game.units[0].state = 'attack';
  assert.match(coachFor(s).title, /encourag/i);
  s.game.encourage();
  assert.match(coachFor(s).title, /courage/i);
  assert.match(coachFor(s).subtitle, /8 s/);
  s.game.encouragementRemaining = 0;
  assert.doesNotMatch(coachFor(s).title, /encourag/i);
});

test('l’éclosion imminente et l’hésitation restent expliquées hors du canvas miniature', () => {
  const s = new Session(42);
  s.game.startWave();
  s.game.eggs[0].hatchIn = 2;
  assert.match(coachFor(s).title, /éclosion/i);
  s.game.eggs = [];
  s.game.units[0].confusedFor = 0.8;
  assert.match(coachFor(s).title, /hésit/i);
  s.selected = 'club';
  assert.match(coachFor(s).title, /Place ton/i, 'le placement choisi garde priorité');
});

test('une annonce de mort ne masque pas une confusion qui expire avant elle', async () => {
  const { chooseBattleMessage } = await import('../src/ui/battleNotices.ts');
  const s = new Session(42),
    p = new Presentation();
  s.game.startWave();
  s.game.eggs = [];
  p.update(s.game, 16);
  s.game.units.pop();
  p.update(s.game, 16);
  assert.equal(p.notice?.kind, 'fallen');
  s.game.units[0].confusedFor = 0.8;
  assert.ok(p.notice!.remaining > s.game.units[0].confusedFor);
  const guide = coachFor(s);
  assert.match(chooseBattleMessage(p.notice, guide, false).content.title, /hésit/i);
  s.selected = 'club';
  const placing = chooseBattleMessage(p.notice, coachFor(s), true);
  assert.equal(placing.tone, 'place');
  assert.match(placing.content.title, /Place ton/i);
  s.selected = null;
  s.game.units[0].confusedFor = 0;
  assert.equal(chooseBattleMessage(p.notice, coachFor(s), false).content.title, p.notice!.title);
});

test('le conseil de premier contact reste lisible entre deux vrais coups puis se réinitialise', async () => {
  const { createCoach } = await import('../src/ui/coaching.ts');
  assert.equal(typeof createCoach, 'function');
  const s = new Session(42),
    coach = createCoach(s);
  s.game.startWave();
  s.game.eggs = [];
  let sawContact = false,
    quietSteps = 0;
  for (let tick = 0; tick < 1800 && s.game.status === 'fighting'; tick++) {
    s.game.step(1 / 30);
    const attack = s.game.units.some((u) => u.hp > 0 && u.state === 'attack');
    sawContact ||= attack;
    const message = coach();
    if (sawContact && s.game.status === 'fighting') {
      assert.match(message.title, /Encourager/);
      if (!attack) quietSteps++;
      if (quietSteps === 20) break;
    }
  }
  assert.ok(sawContact && quietSteps >= 20, 'observer les vrais intervalles entre coups');
  s.game.encourage();
  assert.doesNotMatch(coach().title, /pense à Encourager/);
  s.game.remaining = 0;
  s.game.enemies = [];
  s.game.eggs = [];
  s.game.step(1 / 30);
  assert.equal(s.game.status, 'preparing');
  coach();
  s.game.startWave();
  assert.doesNotMatch(
    coach().title,
    /pense à Encourager/,
    'les coups de la vague précédente ne sont pas un nouveau contact',
  );
  s.restart();
  s.game.startWave();
  assert.doesNotMatch(coach().title, /pense à Encourager/);
});

test('l’effet du dernier coup de la vague ne déclenche pas le conseil de la suivante', async () => {
  const { createCoach } = await import('../src/ui/coaching.ts');
  const s = new Session(42),
    coach = createCoach(s);
  s.game.startWave();
  coach();
  s.game.step(1 / 30);
  s.game.remaining = 0;
  s.game.eggs = [];
  const hero = s.game.units.find((u) => u.kind === 'hero')!;
  Object.assign(s.game.enemies[0], { x: hero.x - 25, y: hero.y, hp: 1, maxHp: 100, cool: 99 });
  hero.cool = 0;
  s.game.step(1 / 30);
  assert.equal(s.game.status, 'preparing');
  assert.ok(s.game.effects.some((e) => e.sourceId === hero.id && e.kind === 'hit'));
  coach();
  s.game.startWave();
  assert.doesNotMatch(coach().title, /pense à Encourager/);
});
