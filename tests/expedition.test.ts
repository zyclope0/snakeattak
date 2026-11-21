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
const { kinds } = await import('../src/data.ts');

const SEED = 4242;
const plan = X.planExpedition(SEED)!;

/** Wins the battle that waits, as if every snake had fallen: the camp is kept as it stands. */
function win(state: ReturnType<typeof X.startExpedition>, path?: 'calm' | 'brave') {
  const game = X.createExpeditionGame(plan, state!, path)!;
  assert.ok(game, 'a game for the battle');
  game.status = 'won';
  return { game, next: X.winBattle(plan, state!, game, path) };
}

test('trois tableaux de sept pas : première mission, chemins, haltes, gardien', () => {
  assert.equal(plan.tableaux.length, 3);
  for (const tableau of plan.tableaux) {
    assert.deepEqual(
      tableau.map((s) => s.kind),
      ['battle', 'fork', 'halt', 'fork', 'fork', 'halt', 'battle'],
    );
    const guardian = tableau.at(-1)!;
    assert.ok(guardian.kind === 'battle' && guardian.battle.king, 'a guardian closes it');
    for (const step of tableau)
      if (step.kind === 'halt') assert.notEqual(step.halts[0], step.halts[1]);
  }
  const last = plan.tableaux[2].at(-1)!;
  assert.ok(last.kind === 'battle' && last.battle.court, 'King Snake comes with his court');
  // The same seed draws the same expedition: a code shares it.
  assert.deepEqual(X.planExpedition(SEED), plan);
  assert.notDeepEqual(X.planExpedition(SEED + 1), plan);
  assert.equal(X.planExpedition(-1), null);
});

test('le camp suit l’enfant dans un tableau : alliés debout, pièces, cristal', () => {
  const start = X.startExpedition(SEED)!;
  const { game, next } = win(start);
  assert.ok(next);
  assert.equal(next.pending?.kind, 'gift');
  assert.equal(next.camp!.units.length, game.units.length);
  const after = X.skipGift(next)!;
  const second = X.createExpeditionGame(plan, after, 'calm')!;
  assert.deepEqual(
    second.units.map((u) => u.kind).sort(),
    game.units.map((u) => u.kind).sort(),
    'the same allies',
  );
  assert.equal(second.gold, next.camp!.gold + X.tuningOf(after).stipend);
  // A battle lost changes nothing: it is tried again from the same camp.
  const lost = X.createExpeditionGame(plan, after, 'calm')!;
  lost.status = 'lost';
  assert.equal(X.winBattle(plan, after, lost, 'calm'), null);
});

test('un allié tombé ne revient pas', () => {
  const start = X.startExpedition(SEED)!;
  const game = X.createExpeditionGame(plan, start)!;
  game.units = game.units.filter((u) => u.kind !== 'hero');
  game.status = 'won';
  const next = X.skipGift(X.winBattle(plan, start, game)!)!;
  const second = X.createExpeditionGame(plan, next, 'brave')!;
  assert.ok(!second.units.some((u) => u.kind === 'hero'), 'the hero stays fallen');
});

test('chemin brave : le cadeau rare arrive au niveau 2 ; une relance, une seule', () => {
  let state = X.skipGift(win(X.startExpedition(SEED)!).next!)!;
  state = win(state, 'brave').next!;
  assert.deepEqual(state.pending, { kind: 'gift', rare: true, rerolled: false });
  const first = X.giftOffer(state);
  const rerolled = X.rerollGifts(state)!;
  assert.notDeepEqual(X.giftOffer(rerolled), first);
  assert.equal(X.rerollGifts(rerolled), null, 'one reroll');
  const lasting = X.giftOffer(rerolled).find(
    (id) => id !== 'pieces' && !id.startsWith('renfort') && id !== 'cristal',
  );
  if (lasting) {
    const taken = X.chooseGift(rerolled, lasting)!;
    assert.equal(taken.boons.find((b) => b.id === lasting)!.level, 2);
  }
});

test('les haltes : feu de camp, roulotte, œuf', () => {
  let state = X.skipGift(win(X.startExpedition(SEED)!).next!)!;
  state = X.skipGift(win(state, 'calm').next!)!;
  assert.equal(plan.tableaux[0][state.step].kind, 'halt');
  const halts = (plan.tableaux[0][state.step] as { halts: readonly string[] }).halts;
  const hurt = { ...state, camp: { ...state.camp!, base: 30 } };
  const feu = halts.indexOf('feu');
  if (feu >= 0) {
    const rested = X.chooseHalt(plan, hurt, feu as 0 | 1)!;
    assert.equal(rested.camp!.base, 30 + X.tuningOf(hurt).campfire.crystal);
    for (const u of rested.camp!.units) assert.ok(u.hp <= kinds[u.kind as keyof typeof kinds].hp);
  }
  const roulotte = halts.indexOf('roulotte');
  if (roulotte >= 0) {
    const rich = { ...state, camp: { ...state.camp!, gold: 1000 } };
    const open = X.chooseHalt(plan, rich, roulotte as 0 | 1)!;
    assert.equal(open.pending?.kind, 'roulotte');
    const item = X.roulotteOffer(open).buy[0];
    const bought = X.buyAtRoulotte(open, item.id)!;
    assert.equal(bought.camp!.gold, 1000 - item.price);
    assert.equal(X.leaveRoulotte(bought)!.pending, null);
  }
  assert.equal(X.nextBattle(plan, state), null, 'no battle at a halt');
});

test('une expédition entière gagnée arrive', () => {
  let state = X.startExpedition(SEED)!;
  for (let guard = 0; guard < 100 && state.status === 'travelling'; guard++) {
    if (state.pending?.kind === 'gift') state = X.skipGift(state)!;
    else if (state.pending?.kind === 'roulotte') state = X.leaveRoulotte(state)!;
    else if (plan.tableaux[state.tableau][state.step].kind === 'halt')
      state = X.chooseHalt(plan, state, 0)!;
    else state = win(state, 'calm').next!;
  }
  assert.equal(state.status, 'arrived');
});

test('relecture Codex : armure remplacée, roulotte, camp vide qui gagne', () => {
  // Armour taken then given away: the carried allies keep their share of life and the next
  // mission still opens.
  let state = X.skipGift(win(X.startExpedition(SEED)!).next!)!;
  const five = ['armure', 'forge', 'marche', 'rente', 'solide'].map((id) => ({
    id: id as 'armure',
    level: id === 'armure' ? 3 : 1,
  }));
  const armoured = { ...state, boons: five };
  const strong = X.createExpeditionGame(plan, armoured, 'calm')!;
  strong.status = 'won';
  let next = X.winBattle(plan, armoured, strong, 'calm')!;
  const offer = X.giftOffer(next);
  const fresh = offer.find((id) => ['vue', 'miel'].includes(id));
  if (fresh) {
    const swapped = X.chooseGift(next, fresh, 'armure')!;
    assert.ok(swapped, 'the armour gives its place');
    for (const u of swapped.camp!.units)
      assert.ok(u.hp <= kinds[u.kind as keyof typeof kinds].hp, 'life back to a plain ally');
    next = swapped;
  }
  assert.ok(next.camp);
  // The roulotte offers a gift already held only to climb, at the price of a level.
  const rich = {
    ...state,
    boons: [{ id: 'forge' as const, level: 1 }],
    camp: { ...state.camp!, gold: 1000 },
    pending: { kind: 'roulotte' as const },
  };
  const shop = X.roulotteOffer(rich);
  assert.ok(!shop.buy.some((item) => item.id === 'forge'));
  assert.ok(shop.climb.some((item) => item.id === 'forge'));
  // A camp that wins with no ally standing goes on, and recruits.
  const game = X.createExpeditionGame(plan, state, 'calm')!;
  game.units = [];
  game.status = 'won';
  state = X.skipGift(X.winBattle(plan, state, game, 'calm')!)!;
  assert.deepEqual(state.camp!.units, []);
  while (plan.tableaux[0][state.step].kind === 'halt') state = X.chooseHalt(plan, state, 0)!;
  if (state.pending?.kind === 'roulotte') state = X.leaveRoulotte(state)!;
  const empty = X.createExpeditionGame(plan, state, 'calm')!;
  assert.ok(empty, 'the next mission opens');
  assert.equal(empty.units.length, 0);
});

test('une expédition gardée se relit telle quelle, à chaque pas ; une fausse est refusée', () => {
  let state = X.startExpedition(SEED)!;
  const seen: (typeof state)[] = [state];
  for (let guard = 0; guard < 100 && state.status === 'travelling'; guard++) {
    const phase = X.expeditionPhase(state);
    if (phase === 'gift') {
      const offer = X.giftOffer(state);
      state = X.chooseGift(state, offer[0]) ?? X.skipGift(state)!;
    } else if (phase === 'roulotte') state = X.leaveRoulotte(state)!;
    else if (phase === 'halt') state = X.chooseHalt(plan, state, (guard % 2) as 0 | 1)!;
    else state = win(state, guard % 2 ? 'brave' : 'calm').next!;
    seen.push(state);
  }
  assert.equal(state.status, 'arrived');
  assert.equal(X.battlesWon(state), X.EXPEDITION_BATTLES);
  for (const one of seen) {
    const back = X.readExpeditionState(JSON.parse(JSON.stringify(one)));
    assert.deepEqual(back, JSON.parse(JSON.stringify(one)), `step ${one.tableau}:${one.step}`);
  }
  const middle = JSON.parse(JSON.stringify(seen[4]));
  assert.equal(X.readExpeditionState({ ...middle, picks: [] }), null, 'picks must match');
  assert.equal(X.readExpeditionState({ ...middle, camp: null }), null, 'a camp after step 0');
  assert.equal(X.readExpeditionState({ ...middle, seed: -1 }), null);
  assert.equal(
    X.readExpeditionState({ ...middle, pending: { kind: 'gift', rare: true, rerolled: false } }),
    null,
  );
});

test('version 2 : un défi fixe par étape, le même à chaque expédition ; la version 1 se relit', () => {
  const defis = (seed: number) =>
    X.planExpedition(seed)!.tableaux.map((tableau) =>
      tableau.flatMap((step) =>
        step.kind === 'halt'
          ? []
          : step.kind === 'battle'
            ? [step.battle.run.caprice]
            : [step.calm.run.caprice, step.brave.run.caprice],
      ),
    );
  assert.equal(X.CURRENT_EXPEDITION_VERSION, 2);
  // The challenges never change with the seed; the setup and the fight do.
  assert.deepEqual(defis(SEED), defis(SEED + 7));
  assert.deepEqual(defis(SEED)[0], [
    'refuge-petit',
    'refuge-createur-petit',
    'refuge-moyen',
    'course-petit',
    'sonnette-moyen',
    'coquilles-petit',
    'refuge-createur-moyen',
    'trois-ponts-createur-moyen',
  ]);
  // King Snake waits at the end with « Plus de miel ! »; the snakes grow a little faster.
  assert.equal(defis(SEED)[2].at(-1), 'carrefour-petit');
  assert.deepEqual(X.EXPEDITION_TUNINGS[2].strength, { hpStep: 0.07, biteStep: 0.035 });
  assert.deepEqual(X.EXPEDITION_TUNINGS[1].strength, { hpStep: 0.06, biteStep: 0.03 });
  const setups = new Set(
    [SEED, SEED + 1, SEED + 2, SEED + 3].map((seed) => {
      const first = X.planExpedition(seed)!.tableaux[0][0];
      return first.kind === 'battle' ? `${first.battle.run.layout}-${first.battle.run.seed}` : '';
    }),
  );
  assert.ok(setups.size > 1, 'the terrain and the fight change');
  // An expedition begun in version 1 reads back and keeps its own draws.
  const old = { ...X.startExpedition(SEED)!, version: 1 };
  assert.equal(X.readExpeditionState(old)?.version, 1);
  assert.notDeepEqual(X.planExpedition(SEED, 1), X.planExpedition(SEED, 2));
  assert.equal(X.readExpeditionState({ ...old, version: '1' }), null);
  assert.equal(X.readExpeditionState({ ...old, version: 3 }), null);
});

test('chaque défi fixe joue vraiment là où il est placé', async () => {
  const { capriceById } = await import('../src/caprices.ts');
  for (const version of [2] as const) {
    const tuning = X.EXPEDITION_TUNINGS[version];
    tuning.tableaux.forEach((table, t) => {
      const places = [
        ['first', [table.first]],
        ['calm', table.calm],
        ['brave', table.brave],
        ['guardian', [table.guardian]],
      ] as const;
      for (const [where, draws] of places) {
        const list = (Array.isArray(draws) ? draws : [draws]) as readonly object[];
        if (where === 'calm' || where === 'brave') assert.equal(list.length, 3, `${t} ${where}`);
        for (const draw of list) {
          const id = (draw as { defi?: string }).defi;
          const caprice = capriceById(id);
          assert.ok(caprice, `${version}:${t} ${where} ${id}`);
          // The allies of the camp carried along take the places a limit of kinds counts.
          assert.ok(!tuning.excluded.includes(caprice.id), `${t} ${where} ${id}: kinds`);
          assert.equal(caprice.rules.kinds, 0, `${t} ${where} ${id}: kinds`);
          // A camp carried along brings its own purse: a smaller purse only plays at a first.
          if (where !== 'first')
            assert.equal(caprice.rules.budget, 1, `${t} ${where} ${id}: purse`);
        }
      }
    });
  }
});
