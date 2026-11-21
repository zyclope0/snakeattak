import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { createMissionRun } from '../src/missions.ts';
import { copy } from '../src/i18n/copy.ts';
import { setLanguage } from '../src/i18n/language.ts';
import { REWARDS, type RewardId } from '../src/rewards.ts';
import { defeatCopy, earnedStars, victoryCopy } from '../src/render/resultCopy.ts';
import { planVoyage, stageCaprice } from '../src/voyage.ts';
import { decodeVoyage, encodeVoyage } from '../src/voyageCode.ts';
import { CURRENT_VOYAGE_VERSION } from '../src/voyageTuning.ts';
import {
  chooseBonus,
  readVoyageState,
  stageGame,
  startVoyage,
  voyagePlanOf,
  type VoyageState,
} from '../src/voyageState.ts';
import { createVoyageLog, logVoyage } from '../src/voyageStorage.ts';
import { waveThreats } from '../src/ui/threatPreview.ts';
import { voyageDoor, voyageToFinish } from '../src/ui/voyageDoor.ts';
import {
  bagLabel,
  battleMark,
  bonusWords,
  exitsLine,
  fallenSentence,
  keepingNote,
  kingPurseLine,
  recordLine,
  stageOutcome,
  startLabel,
  stopStates,
  stopWords,
  surpriseLabel,
  voyageHeading,
  voyagePromise,
} from '../src/ui/voyage/voyageWords.ts';

const SEED = 12345;
const plan = planVoyage(SEED)!;
/** The voyage of the seed with `won` stages won, the first card of each offer kept. */
function voyage(won: number, cards = won, status: VoyageState['status'] = 'travelling') {
  const bag = Array.from({ length: cards }, (_, index) => plan.stages[index].offer[0]);
  const state = readVoyageState({ version: 1, seed: SEED, won, bag, status });
  assert.ok(state, `a voyage with ${won} stages won and ${cards} cards exists`);
  return state;
}
const start = voyage(0);
const midway = voyage(2);
const choosing = voyage(2, 1);
const arrived = voyage(5, 4, 'arrived');
const fallen = voyage(2, 2, 'fallen');
const fallenAtOnce = voyage(0, 0, 'fallen');

test('the door of the home: a voyage begun to finish, then « La Grande Expédition »', () => {
  const log = (state: VoyageState) => logVoyage(createVoyageLog(), state)!;
  const none = createVoyageLog();
  assert.deepEqual(voyageDoor(none, 'none'), { label: 'La Grande Expédition', fresh: true });
  assert.deepEqual(voyageDoor(none, 'opened'), { label: 'La Grande Expédition', fresh: false });
  assert.deepEqual(voyageDoor(none, 'under-way'), {
    label: 'Reprendre l’expédition',
    fresh: false,
  });
  // A voyage begun before the expedition took its place is finished first.
  assert.deepEqual(voyageDoor(log(midway), 'none'), {
    label: 'Reprendre le voyage',
    fresh: false,
  });
  assert.deepEqual(voyageDoor(log(choosing), 'under-way'), {
    label: 'Reprendre le voyage',
    fresh: false,
  });
  // A voyage drawn but never played, over or fallen, leads to the expedition.
  for (const state of [start, arrived, fallen])
    assert.equal(voyageDoor(log(state), 'none').label, 'La Grande Expédition');
});

test('each screen has its name, and the map says which stage is to play', () => {
  assert.deepEqual(voyageHeading(start), { title: 'Le voyage', step: 'Étape 1 sur 5' });
  assert.deepEqual(voyageHeading(midway), { title: 'Le voyage', step: 'Étape 3 sur 5' });
  assert.deepEqual(voyageHeading(choosing), { title: 'Étape 2 réussie !', step: '' });
  assert.deepEqual(voyageHeading(arrived), { title: 'Bravo, tu as fini le voyage !', step: '' });
  assert.deepEqual(voyageHeading(fallen), {
    title: 'Ton voyage s’arrête à l’étape 3',
    step: '',
  });
  // The parent's wording: nothing that agrees with the child, girl or boy.
  for (const state of [start, midway, choosing, arrived, fallen, fallenAtOnce])
    assert.doesNotMatch(voyageHeading(state).title + fallenSentence(state), /allée?\b|arrivée?\b/);
});

test('the record counts stages, in the singular and the plural, and is silent at zero', () => {
  assert.equal(recordLine(0), '');
  assert.equal(recordLine(1), 'Ton plus long voyage : 1 étape');
  assert.equal(recordLine(3), 'Ton plus long voyage : 3 étapes');
  assert.equal(recordLine(5), 'Ton plus long voyage : 5 étapes');
  assert.equal(voyagePromise(start), '5 étapes jusqu’à King Snake');
});

test('the stops of the path: won, to play, ahead, and where the camp fell', () => {
  assert.deepEqual(stopStates(start), ['next', 'ahead', 'ahead', 'ahead', 'ahead']);
  assert.deepEqual(stopStates(midway), ['done', 'done', 'next', 'ahead', 'ahead']);
  assert.deepEqual(stopStates(arrived), ['done', 'done', 'done', 'done', 'done']);
  assert.deepEqual(stopStates(fallen), ['done', 'done', 'fallen', 'ahead', 'ahead']);
  assert.deepEqual(stopStates(fallenAtOnce), ['fallen', 'ahead', 'ahead', 'ahead', 'ahead']);
  assert.deepEqual(stopWords(2, 'La course des vifs', 'next'), {
    name: 'Étape 3 : La course des vifs',
    state: 'Étape à jouer',
  });
  assert.equal(stopWords(0, 'Le refuge', 'done').state, 'Étape réussie');
  assert.equal(stopWords(4, 'Le refuge', 'ahead').state, 'Étape à venir');
  assert.equal(stopWords(2, 'Le refuge', 'fallen').state, 'Le camp est tombé ici');
  assert.equal(exitsLine(1), 'Première vague : les serpents sortent de 1 antre');
  assert.equal(exitsLine(3), 'Première vague : les serpents sortent de 3 antres');
  // The king's stage has a smaller purse: the map says so, with the number of the table.
  const last = planVoyage(SEED)!.stages.at(-1)!;
  assert.equal(last.king && last.coins, -300);
  assert.equal(kingPurseLine(-last.coins), 'Le roi t’a pris 300 pièces.');
});

test('a stage left halfway says that it starts again, where the child comes back', () => {
  assert.equal(startLabel(false), 'C’est parti !');
  assert.equal(startLabel(true), 'Recommencer l’étape');
  assert.match(keepingNote(true), /Une étape quittée repart de son début\./);
  assert.match(keepingNote(false), /ne garde pas ton voyage/);
});

test('every bonus card keeps its title and says that it counts at every stage', () => {
  const coins = plan.tuning.bonusCoins;
  for (const id of Object.keys(REWARDS) as RewardId[]) {
    const words = bonusWords(id, coins);
    assert.equal(words.title, REWARDS[id].title);
    assert.match(words.detail, /à chaque étape\.$/, id);
  }
  assert.equal(bonusWords('pieces', coins).detail, `+${coins} pièces à chaque étape.`);
  assert.equal(bagLabel(1, 4), 'Ton sac de voyage : 1 bonus sur 4');
});

test('a fallen camp says how far the voyage went, and that it can start again', () => {
  assert.equal(
    fallenSentence(fallen),
    'Tu as réussi 2 étapes sur 5. La Grande Expédition t’attend !',
  );
  assert.equal(
    fallenSentence(voyage(1, 1, 'fallen')),
    'Tu as réussi 1 étape sur 5. La Grande Expédition t’attend !',
  );
  assert.equal(
    fallenSentence(fallenAtOnce),
    'Le camp est tombé à la première étape. La Grande Expédition t’attend !',
  );
});

test('only a voyage with a stage won and more to play is still to finish', () => {
  const log = (state: VoyageState) => logVoyage(createVoyageLog(), state)!;
  assert.equal(voyageToFinish(createVoyageLog()), false);
  assert.equal(voyageToFinish(log(start)), false);
  assert.equal(voyageToFinish(log(midway)), true);
  assert.equal(voyageToFinish(log(choosing)), true);
  assert.equal(voyageToFinish(log(arrived)), false);
  assert.equal(voyageToFinish(log(fallen)), false);
});

test('an old voyage code stays readable, a wrong one is refused with its reason', () => {
  const code = encodeVoyage(SEED)!;
  assert.deepEqual(decodeVoyage(code), { ok: true, seed: SEED, version: CURRENT_VOYAGE_VERSION });
  const reason = (typed: string) => {
    const read = decodeVoyage(typed);
    return read.ok ? null : read.reason;
  };
  assert.equal(reason('bonjour'), 'format');
  assert.equal(reason('PONTS-1-0000-7X8R-A1'), 'format');
  const wrongCheck = code.slice(0, -1) + (code.endsWith('A') ? 'B' : 'A');
  assert.equal(reason(wrongCheck), 'checksum');
  assert.equal(reason(code.replace(/^VOYAGE-\d/, 'VOYAGE-9')), 'version');
});

test('the end of a stage offers one way on: the bonus, the end, or the fallen camp', () => {
  assert.equal(battleMark(3, 5), 'Le voyage · Étape 3 sur 5');
  assert.deepEqual(stageOutcome(choosing, 2), {
    note: 'Étape 2 sur 5 réussie. Choisis maintenant un bonus pour la suite.',
    button: 'Continuer le voyage',
  });
  assert.deepEqual(stageOutcome(arrived, 5), {
    note: 'King Snake est battu. Tu as fini le voyage !',
    button: 'Continuer le voyage',
  });
  assert.deepEqual(stageOutcome(fallen, 3), {
    note: 'Le camp est tombé à l’étape 3.',
    button: 'Voir mon voyage',
  });
});

test('a stage on the board is neither a mission nor a caprice: no star, its own words', () => {
  const stage = stageGame(voyage(2))!;
  assert.ok(stage.mission?.caprice, 'the third stage of this voyage has a caprice');
  stage.status = 'won';
  assert.equal(earnedStars(stage), null);
  assert.equal(victoryCopy(stage).title, 'Étape réussie !');
  stage.status = 'lost';
  assert.deepEqual(defeatCopy(stage), {
    title: 'Le voyage s’arrête ici',
    subtitle: 'La Grande Expédition t’attend.',
  });
  // A mission keeps its stars and its own words.
  const mission = new Game(7, undefined, createMissionRun('refuge', 7, undefined, 2));
  mission.status = 'won';
  assert.equal(earnedStars(mission)?.maximum, 3);
  assert.equal(victoryCopy(mission).title, 'Bravo !');
  assert.equal(defeatCopy(mission).title, 'On réessaie ?');
});

test('the dangers of the last stage announce the king, whatever its caprice', () => {
  const kingless = Array.from({ length: 400 }, (_, seed) => seed).find((seed) => {
    const last = planVoyage(seed)!.stages.at(-1)!;
    return !stageCaprice(last)?.rules.king;
  })!;
  const kinglessPlan = planVoyage(kingless)!;
  const bag = kinglessPlan.stages.slice(0, 4).map((stage) => stage.offer[0]);
  const last = stageGame(
    readVoyageState({ version: 1, seed: kingless, won: 4, bag, status: 'travelling' })!,
  )!;
  assert.equal(last.stage?.king, true);
  const kinds = (game: Game, wave: number) => waveThreats(game, wave).entries.map((e) => e.kind);
  assert.ok(kinds(last, last.totalWaves).includes('king'));
  assert.ok(!kinds(last, 1).includes('king'));
  // The same mission outside a voyage has no king to announce.
  const mission = new Game(last.mission!.seed, undefined, last.mission!, 2);
  assert.ok(!kinds(mission, mission.totalWaves).includes('king'));
});

test('in a voyage of version 2 the dangers of the last wave show the king with his court', () => {
  const bag = plan.stages.slice(0, 4).map((stage) => stage.offer[0]);
  const lastGame = (version: 1 | 2) =>
    stageGame(readVoyageState({ version, seed: SEED, won: 4, bag, status: 'travelling' })!)!;
  const entries = (game: Game) => waveThreats(game, game.totalWaves).entries;
  const counted = (game: Game) => entries(game).reduce((sum, entry) => sum + entry.count, 0);
  const kinds = (game: Game) => entries(game).map((entry) => entry.kind);
  const withCourt = lastGame(2);
  const alone = lastGame(1);
  assert.equal(withCourt.stage?.court, true);
  assert.ok(kinds(withCourt).includes('king'));
  assert.ok(kinds(withCourt).includes('courtHealer'));
  assert.ok(!kinds(alone).includes('courtHealer'));
  // The court takes places of the wave: it never adds snakes to it.
  assert.equal(counted(withCourt), counted(alone));
  // The other waves of the stage do not change.
  for (let wave = 1; wave < withCourt.totalWaves; wave++)
    assert.deepEqual(waveThreats(withCourt, wave), waveThreats(alone, wave));
});

test('a bonus chosen through the model joins the bag the screens show', () => {
  const offer = voyagePlanOf(choosing).stages[1].offer;
  const kept = chooseBonus(choosing, offer[2])!;
  assert.deepEqual(kept.bag, [plan.stages[0].offer[0], offer[2]]);
  assert.equal(voyageHeading(kept).step, 'Étape 3 sur 5');
  assert.equal(chooseBonus(choosing, 'skip'), null);
  assert.equal(startVoyage(SEED)!.bag.length, 0);
});

test('every sentence of the voyage reads in English, the caprice names stay French', async () => {
  await setLanguage('en');
  try {
    const english: [string, string][] = [
      [voyageDoor(createVoyageLog(), 'none').label, 'The Great Expedition'],
      ['Reprendre le voyage', 'Resume the voyage'],
      [voyageHeading(midway).step, 'Stage 3 of 5'],
      [voyageHeading(choosing).title, 'Stage 2 complete!'],
      [voyageHeading(arrived).title, 'Well done, you finished the voyage!'],
      [voyageHeading(fallen).title, 'Your voyage stops at stage 3'],
      [recordLine(1), 'Your longest voyage: 1 stage'],
      [recordLine(3), 'Your longest voyage: 3 stages'],
      [voyagePromise(start), '5 stages to King Snake'],
      [stopWords(2, 'La course des vifs', 'next').name, 'Stage 3: The Swift Run'],
      [exitsLine(1), 'First wave: snakes come out of 1 lair'],
      [exitsLine(3), 'First wave: snakes come out of 3 lairs'],
      [startLabel(true), 'Start the stage again'],
      [bagLabel(1, 4), 'Your travel bag: 1 of 4 bonuses'],
      [bonusWords('pieces', 100).detail, '+100 coins at every stage.'],
      [bonusWords('renfort-bouclier', 100).detail, 'A free Shield Guard at every stage.'],
      [
        fallenSentence(fallen),
        'You completed 2 stages out of 5. The Great Expedition is waiting for you!',
      ],
      [battleMark(3, 5), 'The Voyage · Stage 3 of 5'],
      [
        stageOutcome(choosing, 2).note,
        'Stage 2 of 5 complete. Now choose a bonus for the rest of the voyage.',
      ],
      [stageOutcome(fallen, 3).note, 'The camp fell at stage 3.'],
      [stageOutcome(fallen, 3).button, 'See my voyage'],
      [surpriseLabel('Grosse fringale'), 'Surprise caprice: Grosse fringale'],
      [kingPurseLine(300), 'The king took 300 of your coins.'],
    ];
    for (const [french, expected] of english) assert.equal(copy(french), expected, french);
    for (const saved of [true, false])
      assert.doesNotMatch(copy(keepingNote(saved)), /[éèêàç]|voyage est/);
  } finally {
    await setLanguage('fr');
  }
});
