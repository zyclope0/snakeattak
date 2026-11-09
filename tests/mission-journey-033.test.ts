import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MISSIONS } from '../src/missions.ts';
import { createMissionProgress, createMissionProgressController } from '../src/missionProgress.ts';
import { missionJourney } from '../src/ui/missionJourney.ts';

test('empty journey has six real missions and only the first next step', () => {
  const progress = createMissionProgressController();
  const journey = missionJourney(progress.state.bestStars, progress.unlocked);
  assert.deepEqual(
    journey.map((step) => step.id),
    MISSIONS.map((mission) => mission.id),
  );
  assert.deepEqual(
    journey.map((step) => step.status),
    ['next', ...Array(5).fill('locked')],
  );
  assert.deepEqual(
    journey.map((step) => step.disabled),
    [false, ...Array(5).fill(true)],
  );
  assert.ok(journey.every((step) => step.stars === 0 && step.starLabel === '0 étoile sur 3'));
});
test('partial journey uses earned stars without mutating the profile', () => {
  const state = createMissionProgress();
  state.bestStars.refuge = 3;
  state.bestStars['trois-ponts'] = 1;
  const progress = createMissionProgressController(state);
  const before = JSON.stringify(progress.state);
  const journey = missionJourney(progress.state.bestStars, progress.unlocked);
  assert.deepEqual(
    journey.map((step) => step.status),
    ['complete', 'complete', 'next', 'locked', 'locked', 'locked'],
  );
  assert.deepEqual(
    journey.map((step) => step.stars),
    [3, 1, 0, 0, 0, 0],
  );
  assert.equal(journey[0].starLabel, '3 étoiles sur 3');
  assert.equal(JSON.stringify(progress.state), before);
  assert.equal(state.bestStars.course, 0);
});
test('completed journey does not invent a next mission or reward', () => {
  const state = createMissionProgress();
  for (const { id } of MISSIONS) state.bestStars[id] = 2;
  const progress = createMissionProgressController(state);
  const before = JSON.stringify(progress.state);
  const journey = missionJourney(progress.state.bestStars, progress.unlocked);
  assert.ok(
    journey.every((step) => step.status === 'complete' && step.stars === 2 && !step.disabled),
  );
  assert.equal(JSON.stringify(progress.state), before);
});
test('irregular valid profile keeps controller locks even with earned stars', () => {
  const state = createMissionProgress();
  state.bestStars.course = 2;
  const progress = createMissionProgressController(state);
  const journey = missionJourney(progress.state.bestStars, progress.unlocked);
  assert.equal(journey[2].disabled, true);
  assert.equal(journey[2].status, 'locked');
  assert.equal(journey[2].stars, 2);
  assert.equal(journey[3].disabled, false);
  assert.equal(journey[3].status, 'available');
  assert.equal(journey.filter((step) => step.status === 'next').length, 1);
});
