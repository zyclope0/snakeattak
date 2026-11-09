import test from 'node:test';
import assert from 'node:assert/strict';
import { Session } from '../src/session.ts';
import { Game } from '../src/game.ts';
import { createMissionRun } from '../src/missions.ts';
import { coachFor } from '../src/ui/coaching.ts';

test('le cristal blessé reçoit un conseil seulement en préparation et avec le prix disponible', () => {
  const s = new Session(42);
  s.game.wave = 2;
  s.game.base = 75;
  const before = JSON.stringify(s.game);
  assert.match(coachFor(s).title, /réparer/i);
  assert.equal(JSON.stringify(s.game), before);
  s.game.gold = 79;
  assert.doesNotMatch(coachFor(s).title, /réparer/i);
  s.game.gold = 300;
  s.game.base = 100;
  assert.doesNotMatch(coachFor(s).title, /réparer/i);
  s.game.base = 75;
  s.game.startWave();
  assert.doesNotMatch(coachFor(s).title, /réparer/i);
});

test('l’entraînement prêt suit le vrai rang de mission et conserve la priorité du placement', () => {
  const s = new Session(42);
  s.useGame(new Game(42, undefined, createMissionRun('trois-ponts', 42)));
  s.game.wave = 1;
  const before = JSON.stringify(s.game);
  assert.match(coachFor(s).title, /entraîner/i);
  assert.equal(JSON.stringify(s.game), before);
  s.selected = 'club';
  assert.match(coachFor(s).title, /place ton/i);
  s.selected = null;
  s.selectedFeast = 'lure';
  assert.match(coachFor(s).title, /chemin/i);
  s.selectedFeast = null;
  s.game.base = 80;
  assert.match(coachFor(s).title, /réparer/i);
  s.game.base = 100;
  s.game.campaign.training = 'guard';
  assert.doesNotMatch(coachFor(s).title, /entraîner/i);
  s.game.campaign.training = 'none';
  s.game.units.find((u) => u.kind === 'hero')!.hp = 0;
  assert.doesNotMatch(coachFor(s).title, /entraîner/i);
});

test('les dangers, le contact et le miel gardent leur priorité en combat', () => {
  const s = new Session(42);
  s.game.wave = 1;
  s.game.base = 50;
  s.game.startWave();
  s.game.eggs[0].hatchIn = 1;
  assert.match(coachFor(s).title, /éclosion/i);
  s.game.eggs = [];
  assert.match(coachFor(s, true).title, /encourager/i);
  assert.match(coachFor(s, false).title, /gourmand/i);
});
