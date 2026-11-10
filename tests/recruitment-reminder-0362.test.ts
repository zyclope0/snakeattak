import test from 'node:test';
import assert from 'node:assert/strict';
import { Session } from '../src/session.ts';
import { Game } from '../src/game.ts';
import { REWARDS } from '../src/rewards.ts';
import { placementSuggestions } from '../src/placement.ts';
import { createMissionRun } from '../src/missions.ts';
import {
  createRecruitmentReminder,
  createReminderMarkers,
  REMINDER_TEXT,
} from '../src/ui/recruitmentReminder.ts';
const setup = (seed: number) => {
  const session = new Session(seed);
  session.game.startWave();
  session.game.gold = 800;
  const markers = createReminderMarkers(undefined, []);
  return { session, markers, reminder: createRecruitmentReminder(session, markers) };
};
const tick = (
  reminder: ReturnType<typeof createRecruitmentReminder>,
  ms: number,
  blocked = false,
) => {
  let result: string | null = null;
  for (let i = 0; i < ms / 100; i++) result = reminder.update(100, { visible: true, blocked });
  return result;
};
test('ten native active seconds independent of speed/simulation and four readable seconds, once per code', () => {
  const { session, reminder, markers } = setup(91001);
  session.speed = 2;
  const before = JSON.stringify(session.game);
  assert.equal(tick(reminder, 9900), null);
  assert.equal(tick(reminder, 100), REMINDER_TEXT);
  assert.equal(JSON.stringify(session.game), before);
  assert.equal(tick(reminder, 3900), REMINDER_TEXT);
  assert.equal(tick(reminder, 100), null);
  session.restart(91001);
  session.game.startWave();
  session.game.gold = 800;
  assert.equal(tick(createRecruitmentReminder(session, markers), 20000), null);
  session.restart(91002);
  session.game.startWave();
  session.game.gold = 800;
  assert.equal(tick(reminder, 10000), REMINDER_TEXT);
});
test('pause/home/hidden/placement and huge invalid frames contribute no time; threshold and purchase reset', () => {
  const { session, reminder } = setup(92001);
  tick(reminder, 5000);
  session.game.paused = true;
  tick(reminder, 10000);
  session.game.paused = false;
  session.screen = 'home';
  tick(reminder, 10000);
  session.screen = 'battle';
  session.selectUnit('club');
  tick(reminder, 10000);
  session.selectUnit(null);
  session.selectFeast('sticky');
  tick(reminder, 10000);
  session.selectFeast(null);
  for (const ms of [NaN, Infinity, -1, 10000])
    assert.equal(reminder.update(ms, { visible: true, blocked: false }), null);
  for (let i = 0; i < 100; i++) reminder.update(100, { visible: false, blocked: false });
  assert.equal(tick(reminder, 4900), null);
  session.game.gold = 499;
  tick(reminder, 100);
  session.game.gold = 800;
  assert.equal(tick(reminder, 9900), null);
  session.selectUnit('club');
  assert.ok(session.placeSelected(900, 180));
  assert.equal(tick(reminder, 9900), null);
  assert.equal(tick(reminder, 100), REMINDER_TEXT);
  session.selectUnit('club');
  assert.ok(session.placeSelected(900, 324));
  assert.equal(tick(reminder, 100), null);
});
test('priority defers acknowledgement and preserves the full readable window', () => {
  const { reminder, markers, session } = setup(93001);
  assert.equal(tick(reminder, 12000, true), null);
  assert.equal(markers.has(`AVENTURE-4-${'unused'}`), false);
  // A new observer of the same code remains eligible while the first has never displayed.
  assert.equal(tick(createRecruitmentReminder(session, markers), 10000), REMINDER_TEXT);
  assert.equal(tick(reminder, 100), null);
  const next = setup(93002);
  assert.equal(tick(next.reminder, 10000), REMINDER_TEXT);
  assert.equal(tick(next.reminder, 10000, true), null);
  assert.equal(tick(next.reminder, 3900), REMINDER_TEXT);
  assert.equal(tick(next.reminder, 100), null);
});
test('protected reserve is excluded from the 500 usable coins threshold', () => {
  const { session, reminder } = setup(94001);
  const run = {
    ...createMissionRun('refuge', 94002, undefined, 2),
    caprice: 'refuge-createur-petit',
  };
  session.useGame(new Game(run.seed, undefined, run));
  session.game.startWave();
  session.game.gold = 500 + session.game.caprice.reserve - 1;
  assert.equal(tick(reminder, 11000), null);
  session.game.gold = 500 + session.game.caprice.reserve;
  assert.equal(tick(reminder, 10000), REMINDER_TEXT);
});
test('markers persist only on display, are bounded to 64, survive reload and refused storage', () => {
  let raw = '';
  const storage = {
    getItem: () => raw || null,
    setItem: (_key: string, value: string) => {
      raw = value;
    },
  };
  const markers = createReminderMarkers(storage, []);
  for (let i = 0; i < 70; i++) markers.mark(`code-${i}`);
  assert.equal(JSON.parse(raw).length, 64);
  assert.equal(markers.has('code-0'), false);
  assert.equal(createReminderMarkers(storage, []).has('code-69'), true);
  const memory: string[] = [];
  const refused = {
    getItem: () => {
      throw Error('denied');
    },
    setItem: () => {
      throw Error('denied');
    },
  };
  createReminderMarkers(refused, memory).mark('same-code');
  assert.equal(createReminderMarkers(refused, memory).has('same-code'), true);
  assert.doesNotThrow(() => createReminderMarkers({ ...storage, getItem: () => '{invalid' }, []));
});

test('legal space uses real engine placement, including a saturated camp and a reopened gap', async () => {
  const { hasLegalRecruitment } = await import('../src/ui/recruitmentReminder.ts');
  const { session } = setup(95001);
  assert.ok(hasLegalRecruitment(session));
  const template = session.game.units[0];
  session.game.units = [];
  for (let y = 108; y <= 540; y += 24)
    for (let x = 600; x <= 984; x += 24)
      session.game.units.push({
        ...template,
        id: session.game.units.length + 100,
        x,
        y,
        homeX: x,
        homeY: y,
      });
  assert.ok(session.game.units.length < 512);
  assert.equal(hasLegalRecruitment(session), false);
  session.game.units = session.game.units.filter((u) => Math.hypot(u.x - 888, u.y - 180) >= 40);
  assert.ok(session.game.canRecruit('club', 888, 180));
  assert.ok(hasLegalRecruitment(session));
});

test('any observed purchase resets ten seconds even if usable gold stays above 500', () => {
  const { session, reminder } = setup(96001);
  session.game.gold = 600;
  assert.equal(tick(reminder, 8000), null);
  session.game.gold = 520;
  assert.equal(tick(reminder, 2000), null, '600→520 is still spendable but resets eligibility');
  assert.equal(tick(reminder, 7900), null);
  assert.equal(tick(reminder, 100), REMINDER_TEXT);
  session.game.gold = 510;
  assert.equal(tick(reminder, 100), null, 'spending cancels a visible reminder too');
});

test('a real free-voucher recruitment resets waiting although gold does not change', () => {
  const session = new Session(97001),
    game = session.game;
  game.wave = 4;
  game.rewards.pending = 4;
  const gift = game.rewardOffer.find((id) => REWARDS[id].kind);
  assert.ok(gift && game.chooseReward(gift));
  const kind = REWARDS[gift].kind;
  assert.ok(kind);
  game.gold = 600;
  game.startWave();
  const reminder = createRecruitmentReminder(session, createReminderMarkers(undefined, []));
  assert.equal(tick(reminder, 9900), null);
  const point = placementSuggestions(game, kind)[0];
  assert.ok(point);
  session.selectUnit(kind);
  assert.ok(session.placeSelected(point.x, point.y));
  assert.equal(game.gold, 600);
  assert.equal(session.recruitmentCount, 1);
  assert.equal(tick(reminder, 9900), null);
  assert.equal(tick(reminder, 100), REMINDER_TEXT);
});

test('unrecoverable legacy classic seeds share a conservative retained marker', () => {
  const session = new Session(98001);
  const markers = createReminderMarkers(undefined, []);
  const legacy = (seed: number) => {
    const game = new Game(seed);
    game.initialSeed = null;
    game.gold = 800;
    game.startWave();
    return game;
  };
  session.useGame(legacy(98001));
  const reminder = createRecruitmentReminder(session, markers);
  assert.equal(tick(reminder, 10000), REMINDER_TEXT);
  session.useGame(legacy(98002));
  assert.equal(tick(reminder, 20000), null);
});
