import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { CURRENT_BALANCE_REVISION } from '../src/balanceRevision.ts';
import { decodeCheckpoint, encodeCheckpoint } from '../src/checkpoints.ts';
import { waveStats } from '../src/data.ts';
import { enemies } from '../src/enemies.ts';
import {
  ENDLESS_RULES,
  atKingCamp,
  endlessReached,
  endlessStats,
  endlessWave,
  playedWave,
  readEndlessRules,
} from '../src/endless.ts';
import { TOTAL_WAVES } from '../src/gameConstants.ts';
import { Game } from '../src/game.ts';
import { createMissionRun } from '../src/missions.ts';
import { BOON_MAX_LEVEL, BOON_PLACES, BOON_RULES, boonOffer, takeBoon } from '../src/boons.ts';
import { waveThreats } from '../src/ui/threatPreview.ts';
import type { Boons, LastingBoon } from '../src/boons.ts';

registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith('.webp'))
      return {
        format: 'module',
        source: `export default ${JSON.stringify(url)};`,
        shortCircuit: true,
      };
    return nextLoad(url, context);
  },
});

const RULES = ENDLESS_RULES[1];
const BOON_STEPS = BOON_RULES[1].steps;
const endless = (seed = 7) =>
  new Game(seed, undefined, undefined, CURRENT_BALANCE_REVISION, undefined, RULES);

/** Plays the wave `wave` as if every snake had fallen at once: the wave closes. */
function clearWave(game: Game, wave: number) {
  game.wave = wave - 1;
  game.status = 'preparing';
  game.rewards.pending = null;
  assert.ok(game.startWave(), `wave ${wave} starts`);
  game.remaining = 0;
  game.enemies = [];
  game.eggs = [];
  game.step(1 / 30);
}

test('l’aventure sans fin ne se joue qu’avec la révision courante, sans mission', () => {
  assert.throws(() => new Game(7, undefined, undefined, 6, undefined, RULES));
  assert.throws(
    () => new Game(7, undefined, createMissionRun('refuge', 7, null, 2), 2, undefined, RULES),
  );
  assert.throws(
    () =>
      new Game(7, undefined, undefined, CURRENT_BALANCE_REVISION, undefined, {
        ...RULES,
        hpStep: -1,
      }),
  );
  assert.equal(readEndlessRules({ ...RULES, version: 2 }), null);
  // Every other game stays at zero kings and has no endless rules.
  const classic = new Game(7);
  assert.equal(classic.endless, null);
  assert.throws(() => (classic.kings = 1));
});

test('après King Snake, le même camp repart à la vague 1 avec un roi de plus et un cadeau', () => {
  const game = endless();
  const allies = game.units.map((u) => u.id);
  game.campaign.training = 'force';
  clearWave(game, TOTAL_WAVES);
  assert.equal(game.status, 'preparing');
  assert.equal(game.kings, 1);
  assert.equal(game.wave, 0);
  assert.deepEqual(
    game.units.map((u) => u.id),
    allies,
  );
  assert.equal(game.campaign.training, 'force', 'the hero keeps his training');
  assert.deepEqual(game.campaign.chapterStars, [0, 0, 0]);
  assert.equal(game.rewards.pending, TOTAL_WAVES);
  assert.deepEqual(game.rewardOffer, [], 'the endless adventure offers gifts, not cards');
  assert.deepEqual(game.boonOffer, boonOffer(game.rewards.seed, 1, TOTAL_WAVES, []));
  assert.ok(game.chooseReward(game.boonOffer[0]));
  assert.equal(game.rewards.pending, null);
  assert.equal(endlessWave(game.kings, game.wave + 1), TOTAL_WAVES + 1);
});

test('chaque tour offre de nouveau un cadeau après les vagues 4 et 8, tiré à part', () => {
  const game = endless();
  clearWave(game, 4);
  const first = game.boonOffer;
  assert.equal(first.length, 3);
  assert.ok(game.skipReward());
  clearWave(game, 4);
  assert.equal(game.rewards.pending, null, 'one gift per camp and round');
  clearWave(game, TOTAL_WAVES);
  game.skipReward();
  clearWave(game, 4);
  assert.equal(game.rewards.pending, 4, 'the second round offers wave 4 again');
  assert.deepEqual(game.boonOffer, boonOffer(game.rewards.seed, 1, 4, []));
  assert.notDeepEqual(game.boonOffer, first);
});

test('un cadeau repris monte de niveau, trois au plus ; cinq places', () => {
  let boons: Boons = [];
  for (const id of ['forge', 'forge', 'forge'] as const) boons = takeBoon(boons, id)!;
  assert.deepEqual(boons, [{ id: 'forge', level: BOON_MAX_LEVEL }]);
  assert.equal(takeBoon(boons, 'forge'), null, 'never above the top level');
  assert.ok(!boonOffer(1, 0, 4, boons).includes('forge'), 'a full gift is not offered');
  for (const id of ['armure', 'marche', 'rente', 'solide'] as const) boons = takeBoon(boons, id)!;
  assert.equal(boons.length, BOON_PLACES);
  assert.equal(takeBoon(boons, 'vue'), null, 'five places: a sixth needs a place');
  assert.deepEqual(
    takeBoon(boons, 'vue', 'rente')!.map((b) => b.id),
    ['forge', 'armure', 'marche', 'vue', 'solide'],
  );
  assert.equal(takeBoon(boons, 'armure')![1].level, 2, 'climbing a level needs no place');
});

test('les cadeaux changent le camp : forge, armure, marché, rente, cristal, longue-vue, miel', () => {
  const game = endless();
  // Hands a gift as if it had been offered; the round goes back to the first one.
  const give = (id: LastingBoon) => {
    const taken = takeInGame(game, id);
    game.kings = 0;
    return taken;
  };
  const hero = game.units.find((u) => u.kind === 'hero')!;
  const life = hero.maxHp;
  assert.ok(give('armure'));
  assert.equal(hero.maxHp, life * (1 + BOON_STEPS.armure), 'allies in the camp grow');
  const price = game.recruitCost('archer');
  assert.ok(give('marche'));
  assert.equal(game.recruitCost('archer'), Math.round(price * (1 - BOON_STEPS.marche)));
  const honey = game.feastDuration;
  assert.ok(give('miel'));
  assert.equal(game.feastDuration, honey + BOON_STEPS.miel);
  assert.ok(give('rente'));
  assert.ok(give('solide'));
  game.base = 50;
  const gold = game.gold;
  clearWave(game, 1);
  assert.equal(game.gold, gold + waveStats(1).reward + BOON_STEPS.rente);
  assert.equal(game.base, 50 + BOON_STEPS.solide);
  // A classic game has no gift: level zero everywhere.
  assert.equal(new Game(7).boonLevel('forge'), 0);
});

/** Takes a gift through the game, drawing offers until it comes. */
function takeInGame(game: Game, id: LastingBoon): boolean {
  for (let round = 0; round < 400; round++) {
    game.rewards.pending = 4;
    if (game.boonOffer.includes(id)) return game.chooseReward(id);
    game.kings++;
  }
  return false;
}

test('les serpents d’un tour sont plus forts, jamais plus nombreux', () => {
  const base = waveStats(5);
  assert.deepEqual(endlessStats(base, RULES, 0), base);
  assert.deepEqual(endlessStats(base, null, 3), base);
  const strong = endlessStats(base, RULES, 2);
  assert.equal(strong.count, base.count);
  assert.equal(strong.hp, base.hp * (1 + RULES.hpStep) ** 2);
  assert.equal(strong.damage, base.damage * (1 + RULES.biteStep) ** 2);
  // In the game: the first snake of round two is as much stronger.
  const game = endless();
  clearWave(game, TOTAL_WAVES);
  game.rewards.pending = null;
  assert.ok(game.startWave());
  for (let i = 0; i < 60 && !game.enemies.length; i++) game.step(1 / 30);
  const snake = game.enemies[0];
  assert.ok(snake, 'a snake entered');
  const plain = new Game(7);
  assert.ok(plain.startWave());
  for (let i = 0; i < 60 && !plain.enemies.length; i++) plain.step(1 / 30);
  assert.equal(game.remaining, plain.remaining, 'same number of snakes');
  assert.ok(
    Math.abs(snake.maxHp / plain.enemies[0].maxHp - (1 + RULES.hpStep)) < 1e-9,
    'life grows by one step',
  );
});

test('un camp de l’aventure sans fin se sauvegarde et se relit tel quel', () => {
  const game = endless();
  clearWave(game, 4);
  assert.ok(game.chooseReward(game.boonOffer[0]));
  clearWave(game, TOTAL_WAVES);
  assert.ok(game.chooseReward(game.boonOffer[0]));
  clearWave(game, 4);
  const raw = encodeCheckpoint(game)!;
  assert.ok(raw, 'an endless camp is saved');
  const saved = JSON.parse(raw);
  assert.equal(saved.version, 15);
  assert.equal(saved.kings, 1);
  const back = decodeCheckpoint(raw)!;
  assert.ok(back, 'and read back');
  assert.equal(back.kings, 1);
  assert.deepEqual(back.boons, game.boons);
  assert.equal(back.rewards.pending, 4);
  assert.deepEqual(back.boonOffer, game.boonOffer);
  assert.equal(encodeCheckpoint(back), raw, 'the same camp, written the same way');
  // A save that claims more gifts than camps answered, or a level too high, is refused.
  const tamper = (change: (save: Record<string, unknown>) => void) => {
    const copy = JSON.parse(raw);
    change(copy);
    return decodeCheckpoint(JSON.stringify(copy));
  };
  assert.equal(
    tamper(
      (s) =>
        (s.boons = [
          { id: 'forge', level: 3 },
          { id: 'armure', level: 3 },
        ]),
    ),
    null,
  );
  assert.equal(
    tamper((s) => (s.boons = [{ id: 'forge', level: 4 }])),
    null,
  );
  assert.equal(
    tamper((s) => (s.kings = -1)),
    null,
  );
  assert.equal(
    tamper((s) => (s.endless = 3)),
    null,
  );
  // A camp of a classic game is never read as an endless one.
  const classic = new Game(7);
  clearWave(classic, 4);
  classic.skipReward();
  assert.equal(decodeCheckpoint(encodeCheckpoint(classic)!)!.endless, null);
});

test('le camp d’après un roi : cadeau choisi, on continue ou on rentre ; le record retenu', () => {
  const game = endless();
  assert.equal(atKingCamp(game), false, 'not before a king');
  assert.equal(endlessReached(game), 0);
  clearWave(game, TOTAL_WAVES);
  assert.equal(atKingCamp(game), false, 'not before the gift is chosen');
  assert.equal(endlessReached(game), TOTAL_WAVES, 'the king is already a record');
  assert.ok(game.skipReward());
  assert.ok(atKingCamp(game));
  assert.ok(game.startWave(), 'the game goes on');
  game.base = 0;
  game.step(1 / 30);
  assert.equal(game.status, 'lost');
  assert.equal(endlessReached(game), TOTAL_WAVES + 1, 'fallen at wave 13');
});

test('un héros entraîné : le camp d’après le roi se relit', () => {
  const game = endless();
  clearWave(game, 4);
  game.skipReward();
  game.campaign.training = 'guard';
  clearWave(game, TOTAL_WAVES);
  game.skipReward();
  const back = decodeCheckpoint(encodeCheckpoint(game)!);
  assert.ok(back, 'read back at wave 0 of the second round');
  assert.equal(back.campaign.training, 'guard');
});

test('après un roi, tous les alliés restent ouverts ; un renfort offert se place', () => {
  const game = endless();
  assert.equal(game.isUnlocked('trex'), false);
  clearWave(game, TOTAL_WAVES);
  for (const kind of ['raptor', 'shield', 'trex', 'spinosaurus', 'tank'] as const)
    assert.ok(game.isUnlocked(kind), kind);
  game.skipReward();
  game.gold = 10_000;
  assert.ok(game.recruit('raptor', 756, 324));
});

test('la forge frappe plus fort, la longue-vue porte plus loin', () => {
  const game = endless();
  const plain = endless();
  for (const g of [game, plain]) {
    g.rewards.pending = 4;
  }
  assert.ok(takeInGame(game, 'forge'));
  assert.ok(takeInGame(game, 'vue'));
  game.kings = 0;
  assert.equal(game.boonGain('forge'), BOON_STEPS.forge);
  assert.equal(game.boonGain('vue'), BOON_STEPS.vue);
  // A blow of the hero on the same snake, with and without the forge.
  const blow = (g: Game) => {
    g.wave = 0;
    g.status = 'preparing';
    g.rewards.pending = null;
    assert.ok(g.startWave());
    for (let i = 0; i < 4000 && !g.enemies.some((e) => e.hp < e.maxHp); i++) g.step(1 / 30);
    const hurt = g.enemies.find((e) => e.hp < e.maxHp)!;
    return hurt.maxHp - hurt.hp;
  };
  const strong = blow(game),
    weak = blow(plain);
  assert.ok(strong > weak, `forge ${strong} > ${weak}`);
});

// ——— Version 2 (formula F1 of the council report, lot C, 27 November 2026) ———
const RULES_2 = ENDLESS_RULES[2];
const endless2 = (seed = 7) =>
  new Game(seed, undefined, undefined, CURRENT_BALANCE_REVISION, undefined, RULES_2);

test('version 2 : dès le 2e tour, la vague w se joue comme la vague min(11, 6 + ⌈w/2⌉)', () => {
  const round = (kings: number) =>
    Array.from({ length: TOTAL_WAVES }, (_, i) => playedWave(RULES_2, kings, i + 1));
  assert.deepEqual(round(0), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 'the first round');
  assert.deepEqual(round(1), [7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 11, 12]);
  assert.deepEqual(round(5), round(1), 'every later round');
  // Version 1 and every other game: the wave itself, round after round.
  assert.deepEqual(
    Array.from({ length: TOTAL_WAVES }, (_, i) => playedWave(RULES, 3, i + 1)),
    round(0),
  );
  assert.equal(playedWave(null, 3, 2), 2);
  assert.equal(playedWave(RULES_2, 1, 0), 0, 'no wave yet in the camp');
  // Never more than the eleventh wave's snakes before the king: 18.
  assert.equal(
    Math.max(
      ...round(1)
        .slice(0, -1)
        .map((w) => waveStats(w).count),
    ),
    18,
  );
  // The same growth at each king as version 1.
  assert.equal(RULES_2.hpStep, RULES.hpStep);
  assert.equal(RULES_2.biteStep, RULES.biteStep);
  assert.equal(RULES_2.coinStep, RULES.coinStep);
});

test('version 2 : des règles relues telles quelles, ou refusées', () => {
  assert.deepEqual(readEndlessRules(RULES_2), RULES_2);
  assert.deepEqual(readEndlessRules(RULES), RULES);
  assert.equal(Object.hasOwn(readEndlessRules(RULES)!, 'roundStart'), false);
  assert.equal(readEndlessRules({ ...RULES, version: 2 }), null, 'version 2 names its start');
  assert.equal(readEndlessRules({ ...RULES_2, roundStart: TOTAL_WAVES - 1 }), null);
  assert.equal(readEndlessRules({ ...RULES_2, roundStart: 1.5 }), null);
  assert.equal(readEndlessRules({ ...RULES_2, version: 3 }), null);
});

test('version 2 : les serpents suivent la vague jouée, la carte et les cadeaux la vague du tour', () => {
  const game = endless2();
  const before = new Game(7, undefined, undefined, CURRENT_BALANCE_REVISION, undefined, RULES);
  // The first round is the great adventure, as in version 1.
  game.wave = 0;
  assert.ok(game.startWave());
  assert.equal(game.remaining, waveStats(1).count);
  assert.ok(before.startWave());
  assert.equal(game.remaining, before.remaining);
  clearWave(game, TOTAL_WAVES);
  assert.equal(game.kings, 1);
  assert.ok(game.chooseReward(game.boonOffer[0]));
  // Round two, wave 1: the snakes of the seventh wave, one king stronger; the map of wave 1.
  assert.equal(game.difficultyWave, 7, 'the camp foretells the seventh wave');
  const map = game.level;
  assert.ok(game.startWave());
  assert.equal(game.wave, 1);
  assert.equal(game.snakeWave, 7);
  assert.equal(game.remaining, waveStats(7).count);
  assert.equal(game.level, map, 'the map of the first wave of a round');
  for (let i = 0; i < 90 && !game.enemies.length; i++) game.step(1 / 30);
  const snake = game.enemies[0];
  assert.ok(snake, 'a snake entered');
  assert.ok(
    Math.abs(
      snake.maxHp / enemies[snake.variant].hp / (waveStats(7).hp * (1 + RULES_2.hpStep)) - 1,
    ) < 1e-9,
    'the life of the seventh wave, one king stronger',
  );
  // The gifts still come after the fourth and the eighth wave of the round.
  clearWave(game, 4);
  assert.equal(game.rewards.pending, 4);
  // The king's wave stays the king's: twenty snakes, the king among them.
  game.skipReward();
  game.wave = TOTAL_WAVES - 1;
  game.status = 'preparing';
  game.rewards.pending = null;
  assert.ok(game.startWave());
  assert.equal(game.snakeWave, TOTAL_WAVES);
  assert.equal(game.remaining, waveStats(TOTAL_WAVES).count);
});

test('version 2 : un camp se relit en version 2, un camp de version 1 reste en version 1', () => {
  for (const rules of [RULES, RULES_2]) {
    const game = new Game(7, undefined, undefined, CURRENT_BALANCE_REVISION, undefined, rules);
    clearWave(game, TOTAL_WAVES);
    assert.ok(game.chooseReward(game.boonOffer[0]));
    clearWave(game, 2);
    const raw = encodeCheckpoint(game)!;
    assert.equal(JSON.parse(raw).endless, rules.version);
    const back = decodeCheckpoint(raw)!;
    assert.deepEqual(back.endless, rules);
    assert.equal(back.kings, 1);
    assert.equal(encodeCheckpoint(back), raw);
  }
});

test('version 2 : la prévision du camp montre les serpents de la vague jouée', () => {
  const game = endless2();
  clearWave(game, TOTAL_WAVES);
  game.skipReward();
  const plainGame = new Game(7, undefined, undefined, CURRENT_BALANCE_REVISION);
  const seventh = waveThreats(plainGame, 7);
  const shown = waveThreats(game, 1);
  assert.equal(shown.local, 1, 'the wave of the round');
  assert.deepEqual(shown.entries, seventh.entries);
  assert.equal(shown.eggs, seventh.eggs);
  // Version 1 shows the first wave again.
  const first = endless();
  clearWave(first, TOTAL_WAVES);
  assert.deepEqual(waveThreats(first, 1).entries, waveThreats(plainGame, 1).entries);
});
