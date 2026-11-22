import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith('.webp') || url.includes('.mp3'))
      return { format: 'module', source: 'export default "x";', shortCircuit: true };
    return nextLoad(url, context);
  },
});
const X = await import('../src/expedition.ts');
const S = await import('../src/expeditionStorage.ts');
const W = await import('../src/ui/voyage/expedition/expeditionWords.ts');
const { copy } = await import('../src/i18n/copy.ts');
const { setLanguage } = await import('../src/i18n/language.ts');
const { defeatCopy, victoryCopy } = await import('../src/render/resultCopy.ts');
const { expeditionDoorState } = await import('../src/expeditionLog.ts');

const SEED = 4242;
const plan = X.planExpedition(SEED)!;
type State = NonNullable<ReturnType<typeof X.startExpedition>>;
const win = (state: State, path?: 'calm' | 'brave') => {
  const game = X.createExpeditionGame(plan, state, path)!;
  game.status = 'won';
  return { game, next: X.winBattle(plan, state, game, path)! };
};
const start = X.startExpedition(SEED)!;
const { game: firstGame, next: gift } = win(start);
const fork = X.skipGift(gift)!;
const brave = win(fork, 'brave').next;
const halt = X.skipGift(brave)!;
/** The fifth battle of the first tableau, its guardian beaten: the gift that opens the second. */
let walk: State = halt;
while (walk.tableau === 0) {
  const phase = X.expeditionPhase(walk);
  if (phase === 'gift') walk = X.skipGift(walk)!;
  else if (phase === 'roulotte') walk = X.leaveRoulotte(walk)!;
  else if (phase === 'halt') walk = X.chooseHalt(plan, walk, 0)!;
  else walk = win(walk, 'calm').next;
}
const guardianBeaten = walk;
while (walk.status === 'travelling') {
  const phase = X.expeditionPhase(walk);
  if (phase === 'gift') walk = X.skipGift(walk)!;
  else if (phase === 'roulotte') walk = X.leaveRoulotte(walk)!;
  else if (phase === 'halt') walk = X.chooseHalt(plan, walk, 0)!;
  else walk = win(walk, 'calm').next;
}
const arrivedState = walk;

test('le titre, le chemin des sept pas et ce que dit le plateau suivent l’expédition', () => {
  assert.deepEqual(W.expeditionHeading(start), {
    title: 'La Vallée des Sifflements',
    step: 'Étape 1 sur 5',
  });
  assert.deepEqual(W.expeditionHeading(gift), { title: 'Étape gagnée !', step: '' });
  assert.deepEqual(W.expeditionHeading(fork).step, 'Étape 2 sur 5');
  assert.deepEqual(W.expeditionHeading(halt).step, 'Où t’arrêtes-tu ?');
  assert.deepEqual(W.expeditionHeading(guardianBeaten), {
    title: 'Capitaine Zigzag est vaincu !',
    step: '',
  });
  // The road: one stop, or two where it splits; the stops passed are the ones chosen.
  const states = (state: State) => W.roadColumns(state).map((c) => c.map((s) => s.state).join('/'));
  assert.deepEqual(states(fork), [
    'done',
    'next/next',
    'ahead/ahead',
    'ahead/ahead',
    'ahead/ahead',
    'ahead/ahead',
    'ahead',
  ]);
  assert.deepEqual(states(halt).slice(0, 3), ['done', 'skipped/done', 'next/next']);
  assert.equal(states(gift)[1], 'ahead/ahead', 'a gift waits: nothing to play yet');
  const road = W.roadColumns(fork);
  assert.equal(road[6][0].name, 'Le gardien : Capitaine Zigzag');
  assert.deepEqual(
    road[1].map((s) => [s.name, s.detail, s.said]),
    [
      ['Le Chemin Tranquille', 'Étape 2', 'à jouer'],
      ['Le Chemin des Braves', 'Étape 2', 'à jouer'],
    ],
  );
  assert.equal(W.roadColumns(halt)[2][0].said, 'à choisir', 'a halt is chosen');
  assert.equal(road[2][0].said, 'à venir');
  assert.equal(road[3][0].mission, 3);
  assert.equal(W.battleMark(fork), 'Expédition · étape 2 sur 5');
  assert.equal(W.battleOutcome(gift).note, 'Ton camp te suit à l’étape suivante.');
  assert.equal(
    W.battleOutcome(guardianBeaten).note,
    'Capitaine Zigzag est vaincu ! Un nouveau tableau t’attend.',
  );
  assert.equal(W.battleOutcome(null).button, 'Revenir à l’expédition');
  assert.equal(W.recordLine(0), '');
  assert.equal(W.recordLine(2), 'Ta plus longue expédition : 2 étapes');
  assert.equal(X.underWay(start), false);
  assert.equal(X.underWay(fork), true);
  assert.deepEqual(W.campWords(start), ['Un nouveau camp t’attend : recrute tes alliés.']);
  assert.equal(W.campWords(fork)[0], `Alliés : ${fork.camp!.units.length}`);
});

test('les cadeaux disent ce qu’ils donneront ; un rare arrive au niveau 2', () => {
  const owned = { ...gift, boons: [{ id: 'forge' as const, level: 1 }] };
  assert.deepEqual(W.giftWords(owned, 'forge', false), {
    title: 'La forge',
    detail: 'Tes alliés frappent plus fort : +30 %',
    action: 'Monter au niveau 2',
    plain: false,
  });
  assert.equal(W.giftWords(gift, 'forge', true).detail, 'Tes alliés frappent plus fort : +30 %');
  assert.equal(W.giftWords(gift, 'forge', true).action, 'Choisir · niveau 2');
  assert.equal(W.giftWords(gift, 'pieces', true).detail, '200 pièces pour recruter tes alliés.');
  assert.equal(W.giftWords(gift, 'pieces', false).detail, '100 pièces pour recruter tes alliés.');
  assert.equal(W.campWords(fork)[2], `Ton cristal : ${Math.round(fork.camp!.base)} %`);
  assert.match(W.giftWords(gift, 'renfort-ninja', false).detail, /Pour la prochaine étape\.$/);
  const egg = X.chooseHalt(plan, { ...halt, boons: [] }, 0)!;
  const step = plan.tableaux[0][halt.step];
  const said = W.haltNotice(halt, egg, step.kind === 'halt' ? step.halts[0] : 'feu');
  assert.ok(said === '' || /Feu|cristal|Œuf/.test(said), said);
});

test('une bataille de l’expédition se nomme sur le plateau ; perdue, on réessaie', () => {
  assert.equal(victoryCopy(firstGame).title, 'Étape gagnée !');
  const lost = X.createExpeditionGame(plan, start)!;
  assert.deepEqual(defeatCopy(lost), {
    title: 'On réessaie ?',
    subtitle: 'Ton camp revient comme avant l’étape.',
  });
});

test('le carnet de l’expédition : gardé par joueur, record qui suit, rien de faux', () => {
  const stored = new Map<string, string>();
  const port = {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => void stored.set(key, value),
  };
  assert.deepEqual(S.loadExpeditionLog(port), S.createExpeditionLog());
  const log = S.logExpedition(S.createExpeditionLog(), fork)!;
  assert.equal(log.best, 1);
  assert.ok(S.saveExpeditionLog(port, log));
  assert.deepEqual(S.loadExpeditionLog(port), JSON.parse(JSON.stringify(log)));
  // A new expedition keeps the record of the old one.
  assert.equal(S.logExpedition(log, start)!.best, 1);
  assert.equal(S.validateExpeditionLog({ version: 1, best: 0, current: fork }), null);
  assert.equal(S.validateExpeditionLog({ version: 1, best: 99, current: null }), null);
  stored.set('conquete-serpents:expedition:v1', '{"version":1,"best":2,"current":{"seed":1}}');
  assert.deepEqual(
    S.loadExpeditionLog(port),
    { version: 1, best: 2, current: null },
    'the record stays',
  );
  stored.set('conquete-serpents:expedition:v1', '{"version":1,"best":"x","current":null}');
  assert.deepEqual(S.loadExpeditionLog(port), S.createExpeditionLog());
});

test('every sentence of the expedition reads in English', async () => {
  await setLanguage('en');
  try {
    const english: [string, string][] = [
      [W.expeditionHeading(start).title, 'The Valley of Hisses'],
      [W.expeditionHeading(start).step, 'Stage 1 of 5'],
      [W.expeditionHeading(guardianBeaten).title, 'Captain Zigzag is beaten!'],
      [W.battleMark(fork), 'Expedition · stage 2 of 5'],
      [W.recordLine(2), 'Your longest expedition: 2 stages'],
      [
        W.replaceSentence(fork),
        'You have already won 1 stage. If you change, you start again from the beginning.',
      ],
      [W.giftsLabel(2), 'Your gifts: 2 of 5 spots'],
      [W.arrivedLine(), 'You won all 15 stages!'],
      [W.coinsLine(420), 'You have 420 coins'],
      [W.haltPromise(start, 'feu'), 'Your crystal mends by 40 and your allies get some rest.'],
      [victoryCopy(firstGame).title, 'Stage won!'],
      [W.campWords(fork)[2], `Your crystal: ${Math.round(fork.camp!.base)}%`],
      [W.expeditionHeading(arrivedState).title, 'Well done! You finished The Great Expedition'],
    ];
    for (const [french, expected] of english) assert.equal(copy(french), expected, french);
  } finally {
    await setLanguage('fr');
  }
});

test('la porte lit l’expédition sans ses règles ; pickAt suit les choix du tableau', () => {
  const port = (value: unknown) => ({
    getItem: () => (value === undefined ? null : JSON.stringify(value)),
  });
  const logOf = (current: State) => S.logExpedition(S.createExpeditionLog(), current)!;
  assert.equal(expeditionDoorState(undefined), 'none');
  assert.equal(expeditionDoorState(port(undefined)), 'none');
  assert.equal(expeditionDoorState(port({ version: 1, best: 0, current: null })), 'none');
  assert.equal(expeditionDoorState({ getItem: () => '{nope' }), 'none');
  assert.equal(expeditionDoorState(port(logOf(start))), 'opened');
  assert.equal(expeditionDoorState(port(logOf(fork))), 'under-way');
  assert.equal(expeditionDoorState(port(logOf(guardianBeaten))), 'under-way');
  assert.equal(expeditionDoorState(port(logOf(arrivedState))), 'opened');
  // The fork of mission 2 taken brave, then the first halt: the choices read back in order.
  assert.equal(X.pickAt(brave, 1), 1);
  assert.equal(X.pickAt(brave, 0), undefined, 'the first mission is no choice');
  assert.equal(X.pickAt(fork, 1), undefined, 'not passed yet');
});

// Ce que les écrans demandent au modèle au lieu de le recopier (22 novembre 2026). Chaque
// règle est tenue à son ancienne écriture, retapée ici.
test('les règles que les écrans demandent au modèle valent ce qu’ils recopiaient', async () => {
  const B = await import('../src/boons.ts');
  const TEXT = await import('../src/texts/fr/expedition.ts');
  const lasting = ['miel', 'forge', 'armure', 'marche', 'rente', 'solide', 'vue'] as const;
  const others = [
    'pieces',
    'renfort-bouclier',
    'renfort-ninja',
    'renfort-raptor',
    'cristal',
  ] as const;
  const places = B.BOON_RULES[1].places;
  for (let held = 0; held <= places; held++) {
    const boons = lasting.slice(0, held).map((id, i) => ({ id, level: 1 + (i % 3) }));
    const state = { ...gift, boons };
    for (const id of [...lasting, ...others]) {
      // A place to free: a lasting gift not held, every place taken.
      const full = boons.length >= places;
      const before = B.isLastingBoon(id) && full && !B.boonLevel(boons, id);
      assert.equal(X.needsPlace(state, id), before, `${id} with ${held} gifts`);
      assert.equal(X.countsTwice(id), B.isLastingBoon(id) || id === 'pieces', id);
      for (const rare of [false, true]) {
        // « Choisir ce cadeau » and nothing else: what the low screen may hide.
        const words = W.giftWords(state, id, rare);
        assert.equal(words.plain, words.action === TEXT.choisirCeCadeau, `${id} ${held} ${rare}`);
      }
    }
    for (const b of boons)
      assert.equal(
        X.levelAfterPurchase(state, b.id),
        (boons.find((x) => x.id === b.id)?.level ?? 0) + 1,
      );
  }
  // Paying: the camp's coins, or the purse of a camp still to come.
  for (const coins of [0, 59, 60, 61, 500]) {
    const withCamp = { ...fork, camp: { ...fork.camp!, gold: coins } };
    const withPurse = { ...start, camp: null, purse: coins };
    for (const price of [0, 60, 120]) {
      assert.equal(X.canPay(withCamp, price), coins >= price);
      assert.equal(X.canPay(withPurse, price), coins >= price);
    }
  }
  // The snakes have grown from the second battle on; an expedition is under way once a battle
  // is won and more remain.
  assert.equal(X.snakesHaveGrown(start), false);
  assert.equal(X.snakesHaveGrown(fork), true);
  assert.equal(X.snakesHaveGrown({ ...start, tableau: 1 }), true);
  assert.equal(X.underWay(null), false);
  assert.equal(X.underWay(arrivedState), false);
  // No gift after King Snake, the guardian of the last tableau; one after every other battle.
  const tableaux = plan.tableaux.length;
  for (let tableau = 0; tableau < tableaux; tableau++)
    for (const [step, stop] of plan.tableaux[tableau].entries()) {
      if (stop.kind === 'halt') continue;
      const battles = stop.kind === 'fork' ? [stop.calm, stop.brave] : [stop.battle];
      for (const battle of battles)
        assert.equal(
          X.endsExpedition({ ...start, tableau, step }, battle),
          battle.king && tableau === tableaux - 1,
          `tableau ${tableau} step ${step}`,
        );
    }
  const last = plan.tableaux[tableaux - 1].at(-1)!;
  assert.ok(last.kind === 'battle' && last.battle.king, 'King Snake closes the last tableau');
  assert.ok(X.endsExpedition({ ...start, tableau: tableaux - 1 }, last.battle));
  assert.ok(!X.endsExpedition({ ...start, tableau: 0 }, last.battle));
});
