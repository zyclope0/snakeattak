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

test('le titre, le chemin des sept pas et ce que dit le plateau suivent l’expédition', () => {
  assert.deepEqual(W.expeditionHeading(start), {
    title: 'La Vallée des Sifflements',
    step: 'Mission 1 sur 5',
  });
  assert.deepEqual(W.expeditionHeading(gift), { title: 'Mission gagnée !', step: '' });
  assert.deepEqual(W.expeditionHeading(fork).step, 'Mission 2 sur 5');
  assert.deepEqual(W.expeditionHeading(halt).step, 'Où t’arrêtes-tu ?');
  assert.deepEqual(W.expeditionHeading(guardianBeaten), {
    title: 'Capitaine Zigzag est vaincu !',
    step: '',
  });
  assert.deepEqual(W.stepStates(fork), [
    'done',
    'next',
    'ahead',
    'ahead',
    'ahead',
    'ahead',
    'ahead',
  ]);
  assert.deepEqual(W.stepStates(gift)[1], 'ahead', 'a gift waits: nothing to play yet');
  assert.equal(W.stepWords(fork, 6, 'ahead').name, 'Le gardien : Capitaine Zigzag');
  assert.equal(W.stepWords(fork, 3, 'ahead').name, 'Mission 3');
  assert.equal(W.stepWords(fork, 2, 'ahead').name, 'Une halte');
  assert.equal(W.battleMark(fork), 'Expédition · mission 2 sur 5');
  assert.equal(W.battleOutcome(gift).note, 'Mission gagnée ! Ton camp te suit.');
  assert.equal(
    W.battleOutcome(guardianBeaten).note,
    'Capitaine Zigzag est vaincu ! Un nouveau tableau t’attend.',
  );
  assert.equal(W.battleOutcome(null).button, 'Revenir à l’expédition');
  assert.equal(W.recordLine(0), '');
  assert.equal(W.recordLine(2), 'Ta plus longue expédition : 2 missions');
  assert.equal(W.underWay(start), false);
  assert.equal(W.underWay(fork), true);
  assert.deepEqual(W.campWords(start), ['Un nouveau camp t’attend : recrute tes alliés.']);
  assert.equal(W.campWords(fork)[0], `Alliés : ${fork.camp!.units.length}`);
});

test('les cadeaux disent ce qu’ils donneront ; un rare arrive au niveau 2', () => {
  const owned = { ...gift, boons: [{ id: 'forge' as const, level: 1 }] };
  assert.deepEqual(W.giftWords(owned, 'forge', false), {
    title: 'La forge',
    detail: 'Tes alliés frappent plus fort : +30 %',
    action: 'Monter au niveau 2',
  });
  assert.equal(W.giftWords(gift, 'forge', true).detail, 'Tes alliés frappent plus fort : +30 %');
  assert.equal(W.giftWords(gift, 'forge', true).action, 'Choisir ce cadeau');
  assert.match(W.giftWords(gift, 'renfort-ninja', false).detail, /Pour la prochaine mission\.$/);
  const egg = X.chooseHalt(plan, { ...halt, boons: [] }, 0)!;
  const step = plan.tableaux[0][halt.step];
  const said = W.haltNotice(halt, egg, step.kind === 'halt' ? step.halts[0] : 'feu');
  assert.ok(said === '' || /Feu|cristal|Œuf/.test(said), said);
});

test('une bataille de l’expédition se nomme sur le plateau ; perdue, on réessaie', () => {
  assert.equal(victoryCopy(firstGame).title, 'Mission gagnée !');
  const lost = X.createExpeditionGame(plan, start)!;
  assert.deepEqual(defeatCopy(lost), {
    title: 'On réessaie ?',
    subtitle: 'Ton camp revient comme avant la mission.',
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
  assert.deepEqual(S.loadExpeditionLog(port), S.createExpeditionLog());
});

test('every sentence of the expedition reads in English', async () => {
  await setLanguage('en');
  try {
    const english: [string, string][] = [
      [W.expeditionHeading(start).title, 'The Valley of Hisses'],
      [W.expeditionHeading(start).step, 'Mission 1 of 5'],
      [W.expeditionHeading(guardianBeaten).title, 'Captain Zigzag is beaten!'],
      [W.battleMark(fork), 'Expedition · mission 2 of 5'],
      [W.recordLine(2), 'Your longest expedition: 2 missions'],
      [
        W.replaceSentence(fork),
        'You have already won 1 mission. If you change, you start again from the beginning.',
      ],
      [W.giftsLabel(2), 'Your gifts: 2 of 5 places'],
      [W.arrivedLine(), 'You won all 15 missions!'],
      [W.coinsLine(420), 'You have 420 coins'],
      [W.haltPromise('feu'), 'Your crystal mends by 40 and your allies get some rest.'],
      [victoryCopy(firstGame).title, 'Mission won!'],
    ];
    for (const [french, expected] of english) assert.equal(copy(french), expected, french);
  } finally {
    await setLanguage('fr');
  }
});
