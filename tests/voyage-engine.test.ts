import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { kinds, waveStats } from '../src/data.ts';
import { LANES } from '../src/ai.ts';
import { missionById } from '../src/missions.ts';
import { capriceBudget, capriceRules } from '../src/caprices.ts';
import { balanceRecruitPrice } from '../src/balanceRevision.ts';
import { encodeCheckpoint } from '../src/checkpoints.ts';
import { createMissionProgressController, createMissionProgress } from '../src/missionProgress.ts';
import { createCapriceAlbumsController } from '../src/capriceAlbums.ts';
import { FEAST_DURATION } from '../src/tactics.ts';
import { readStageRules } from '../src/voyageRules.ts';
import type { StageRules } from '../src/voyageRules.ts';
import {
  createStageGame,
  drawVoyage,
  planVoyage,
  stageCaprice,
  stageRulesFor,
} from '../src/voyage.ts';
import { CURRENT_VOYAGE_VERSION, VOYAGE_TUNINGS, freezeTuning } from '../src/voyageTuning.ts';
import { fight } from './voyage-helpers.ts';

const tuning = VOYAGE_TUNINGS[CURRENT_VOYAGE_VERSION];
const plan = planVoyage(2026)!;
const bare: StageRules = { version: 1, king: false, coins: 0, ward: 0, bag: [] };

test('a stage is the expedition of the plan, in a new camp, with the stage rules', () => {
  for (const [index, stage] of plan.stages.entries()) {
    const game = createStageGame(plan, index, [])!;
    assert.deepEqual(game.mission, stage.run);
    assert.equal(game.balanceRevision, 2);
    // Version 2: the king of the last stage comes with his court.
    assert.deepEqual(game.stage, {
      version: 2,
      king: index === 4,
      court: index === 4,
      coins: stage.coins,
      ward: 0,
      bag: [],
    });
    const budget = missionById(stage.run.missionId)!.budget;
    assert.equal(game.gold, capriceBudget(budget, capriceRules(stage.run)) + stage.coins);
    assert.equal(game.units.length, 3);
    assert.equal(game.wave, 0);
    assert.equal(game.base, 100);
    assert.equal(game.rng, stage.run.seed);
  }
});

test('a voyage of version 1 keeps its rules: no court, the same stages as version 2', () => {
  const old = planVoyage(2026, 1)!;
  assert.deepEqual(old.stages, plan.stages);
  for (const index of old.stages.keys()) {
    const rules = stageRulesFor(old, index, ['pieces'])!;
    assert.equal(rules.version, 1);
    assert.equal('court' in rules, false);
    assert.equal(createStageGame(old, index, [])!.stage!.court, undefined);
  }
});

test('in version 2 King Snake brings his two guards and his healer; in version 1 he comes alone', () => {
  const met = (version: 1 | 2, index: number) => {
    const seen = new Map<number, string>();
    fight(createStageGame(planVoyage(2026, version)!, index, [])!, 'won', (game) => {
      for (const e of game.enemies)
        if (e.boss || e.court) seen.set(e.id, e.boss ? 'king' : e.court!.role);
    });
    return [...seen.values()].sort();
  };
  assert.deepEqual(met(2, 4), ['guard', 'guard', 'healer', 'king']);
  assert.deepEqual(met(1, 4), ['king']);
  // Before the last stage, no king and no court.
  assert.deepEqual(met(2, 3), []);
});

test('the rules of a stage are already canonical, key for key, in both versions', () => {
  // The voyage compares them as text with the rules of the game it records.
  for (const version of [1, 2] as const) {
    const drawn = planVoyage(2026, version)!;
    for (const index of drawn.stages.keys()) {
      const rules = stageRulesFor(drawn, index, ['cristal', 'pieces'])!;
      assert.equal(JSON.stringify(readStageRules(rules)), JSON.stringify(rules));
    }
  }
});

test('games outside a voyage have no stage, and their saved shape did not change', () => {
  const run = plan.stages[2].run;
  const plain = new Game(run.seed, undefined, run);
  const staged = createStageGame(plan, 2, [])!;
  assert.equal(new Game(7).stage, null);
  assert.equal(plain.stage, null);
  // The stage is private to the game object: nothing new is serialised.
  assert.deepEqual(Object.keys(staged), Object.keys(plain));
  assert.equal(JSON.stringify(staged), JSON.stringify(plain));
});

test('the bag is unpacked at the start of the stage, every card counted', () => {
  const bag = ['pieces', 'cristal', 'miel', 'pieces'] as const;
  const game = createStageGame(plan, 4, bag)!;
  const empty = createStageGame(plan, 4, [])!;
  assert.equal(game.gold, empty.gold + 2 * tuning.bonusCoins);
  assert.equal(game.rewards.ward, tuning.bonusWard);
  assert.equal(game.feastDuration, FEAST_DURATION + 4);
  assert.equal(empty.feastDuration, FEAST_DURATION);
  assert.equal(game.rewards.pending, null);
  assert.equal(game.rewards.choices.length, 4);
  assert.ok(game.rewards.choices.every((choice) => choice.used));
  assert.deepEqual(stageRulesFor(plan, 4, bag), {
    version: 2,
    king: true,
    court: true,
    coins: plan.stages[4].coins + 2 * tuning.bonusCoins,
    ward: tuning.bonusWard,
    bag: [...bag],
  });
});

test('an ally of the bag is free once per stage, then costs its price', () => {
  const stage = plan.stages.findIndex((entry) => !stageCaprice(entry)?.rules.kinds);
  const game = createStageGame(plan, stage, ['renfort-ninja', 'renfort-ninja', 'renfort-raptor'])!;
  const gold = game.gold;
  assert.equal(game.recruitCost('ninja'), 0);
  assert.ok(game.recruit('ninja', 660, LANES[0]));
  assert.equal(game.recruitCost('ninja'), 0);
  assert.ok(game.recruit('ninja', 660, LANES[1]));
  assert.equal(game.gold, gold);
  assert.equal(game.recruitCost('ninja'), balanceRecruitPrice('ninja', 2));
  assert.equal(game.recruitCost('raptor'), 0);
  assert.ok(game.recruit('raptor', 660, LANES[2]));
  assert.equal(game.recruitCost('raptor'), kinds.raptor.cost);
  assert.equal(game.gold, gold);
  // The next stage is a new camp: the same bag gives its allies again.
  const next = createStageGame(plan, stage, ['renfort-ninja'])!;
  assert.equal(next.recruitCost('ninja'), 0);
});

test('a stage may open with a smaller purse, and a purse never goes below zero', () => {
  const thrifty = freezeTuning({
    ...tuning,
    stages: tuning.stages.map((stage, index) => ({ ...stage, coins: index === 4 ? -250 : 0 })),
  });
  const voyage = drawVoyage(2026, thrifty)!;
  const run = voyage.stages[4].run;
  const purse = capriceBudget(missionById(run.missionId)!.budget, capriceRules(run));
  assert.equal(createStageGame(voyage, 4, [])!.gold, purse - 250);
  assert.equal(createStageGame(voyage, 4, ['pieces'])!.gold, purse - 250 + tuning.bonusCoins);
  assert.equal(createStageGame(voyage, 3, [])!.stage!.coins, 0);
  assert.equal(new Game(run.seed, undefined, run, 2, { ...bare, coins: -5000 }).gold, 0);
});

test('the crystal ward of the bag absorbs the first serpents that get through', () => {
  const game = createStageGame(plan, 0, ['cristal'])!;
  assert.equal(game.rewards.ward, tuning.bonusWard);
  fight(game, 'lost');
  assert.equal(game.rewards.ward, 0);
  const unprotected = fight(createStageGame(plan, 0, [])!, 'lost');
  assert.ok(game.kills === 0 && unprotected.kills === 0);
  assert.ok(game.time > unprotected.time, 'the ward delays the fall of the camp');
});

/** Plays a stage behind a full camp and reports the kings that came, wave by wave. */
function kingsOf(game: Game) {
  const kings = new Map<number, { wave: number; maxHp: number; remaining: number }>();
  const original = game.step.bind(game);
  game.step = (dt: number) => {
    original(dt);
    for (const enemy of game.enemies)
      if (enemy.boss && !kings.has(enemy.id))
        kings.set(enemy.id, { wave: game.wave, maxHp: enemy.maxHp, remaining: game.remaining });
  };
  fight(game, 'won');
  return [...kings.values()];
}

test('the king closes the last stage: one king, last of the last wave', () => {
  for (const seed of [2026, 7, 99]) {
    const voyage = planVoyage(seed)!;
    const last = voyage.stages[4];
    const game = createStageGame(voyage, 4, [])!;
    const kings = kingsOf(game);
    assert.equal(kings.length, 1, `seed ${seed}`);
    assert.equal(kings[0].wave, game.totalWaves);
    assert.equal(kings[0].remaining, 0);
    const rank = missionById(last.run.missionId)!.waves.at(-1)!;
    assert.equal(kings[0].maxHp, waveStats(rank).hp * capriceRules(last.run).hp * tuning.kingHp);
    // The same expedition outside the voyage has a king only if its caprice invites one.
    const plain = kingsOf(new Game(last.run.seed, undefined, last.run));
    assert.equal(plain.length, capriceRules(last.run).king ? 1 : 0);
  }
});

test('no king before the last stage', () => {
  for (const index of [0, 2, 3]) assert.deepEqual(kingsOf(createStageGame(plan, index, [])!), []);
});

test('a stage won gives a result, but neither stars nor sticker nor a saved camp', () => {
  const index = 2;
  const run = plan.stages[index].run;
  assert.ok(run.caprice);
  const unlocked = createMissionProgress();
  for (const id of Object.keys(unlocked.bestStars) as (keyof typeof unlocked.bestStars)[])
    unlocked.bestStars[id] = 3;
  const staged = createStageGame(plan, index, [])!;
  assert.equal(encodeCheckpoint(staged), null);
  staged.recruit('club', 660, LANES[1]);
  assert.equal(encodeCheckpoint(staged), null);
  fight(staged, 'won');
  const plain = fight(new Game(run.seed, undefined, run), 'won');
  assert.ok(staged.missionStars > 0 && plain.missionStars > 0);

  const progress = createMissionProgressController(unlocked);
  const before = JSON.stringify(progress.state);
  assert.equal(progress.record(staged), false);
  assert.equal(progress.sync(staged), false);
  assert.equal(JSON.stringify(progress.state), before);
  assert.equal(progress.record(plain), true);

  const albums = createCapriceAlbumsController();
  assert.ok(albums.beginRun());
  assert.equal(albums.record(staged), false);
  assert.equal(albums.has(run.caprice), false);
  assert.equal(albums.record(plain), true);
});

test('the engine refuses a stage that is not an expedition of the second revision', () => {
  const run = plan.stages[0].run;
  const first = {
    missionId: run.missionId,
    seed: run.seed,
    layout: run.layout,
    assault: run.assault,
    nest: run.nest,
  };
  assert.throws(() => new Game(7, undefined, undefined, undefined, bare), RangeError);
  assert.throws(() => new Game(7, undefined, undefined, 2, bare), RangeError);
  assert.throws(() => new Game(first.seed, undefined, first, undefined, bare), RangeError);
  for (const broken of [
    null,
    [],
    { ...bare, version: 3 },
    // Version 1 has no court; version 2 must say whether it comes.
    { ...bare, court: true },
    { ...bare, version: 2 },
    { ...bare, king: 1 },
    { ...bare, coins: -5001 },
    { ...bare, coins: 1.5 },
    { ...bare, coins: 5001 },
    { ...bare, ward: -1 },
    { ...bare, ward: 501 },
    { ...bare, bag: ['skip'] },
    { ...bare, bag: ['pieces', 'pieces', 'pieces', 'pieces', 'pieces'] },
    { ...bare, bag: 'pieces' },
    { version: 1, king: false, coins: 0, ward: 0 },
  ]) {
    assert.equal(readStageRules(broken), null, JSON.stringify(broken));
    assert.throws(
      () => new Game(run.seed, undefined, run, 2, broken as unknown as StageRules),
      RangeError,
    );
  }
  assert.ok(new Game(run.seed, undefined, run, 2, bare).stage);
});

test('the rules of a stage are copied and frozen: the caller cannot change a camp', () => {
  const bag: StageRules['bag'][number][] = ['miel'];
  const rules = { ...bare, bag };
  const game = new Game(plan.stages[0].run.seed, undefined, plan.stages[0].run, 2, rules);
  bag.push('miel');
  rules.king = true;
  assert.deepEqual(game.stage, { ...bare, bag: ['miel'] });
  assert.ok(Object.isFrozen(game.stage) && Object.isFrozen(game.stage!.bag));
});

test('a stage or a bag that does not exist gives no game', () => {
  assert.equal(createStageGame(plan, 5, []), null);
  assert.equal(createStageGame(plan, -1, []), null);
  assert.equal(stageRulesFor(plan, 0, ['pieces', 'pieces', 'pieces', 'pieces', 'pieces']), null);
  assert.equal(createStageGame(plan, 0, ['skip' as 'pieces']), null);
  assert.equal(createStageGame(plan, 0, 'pieces' as unknown as []), null);
});
