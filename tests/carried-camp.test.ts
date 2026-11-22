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
const { readCarriedCamp, UNIT_LIMIT } = await import('../src/checkpointUnits.ts');
const { CRYSTAL_MAX, ENTITY_ID_LIMIT, GOLD_LIMIT } = await import('../src/gameConstants.ts');
const { kinds } = await import('../src/data.ts');

// The camp an expedition carries from one battle to the next is read in one place, for the
// game that receives it (`game.receiveCamp`) and for the saved expedition
// (`readExpeditionState`). What it accepts and refuses is held here.
const start = X.startExpedition(4242)!;
const plan = X.expeditionPlanOf(start);
const won = X.createExpeditionGame(plan, start)!;
won.status = 'won';
const camp = X.skipGift(X.winBattle(plan, start, won)!)!.camp!;
const plain = () =>
  JSON.parse(JSON.stringify(camp)) as { units: any[]; gold: number; base: number };

test('a carried camp is read back whole: its allies, its coins, its crystal', () => {
  const read = readCarriedCamp(plain(), 1)!;
  assert.equal(read.units.length, camp.units.length);
  assert.equal(read.gold, camp.gold);
  assert.equal(read.base, camp.base);
  assert.equal(read.nextId, Math.max(...camp.units.map((u) => u.id)));
  assert.deepEqual(
    read.units.map((u) => [u.id, u.kind, u.hp]),
    camp.units.map((u) => [u.id, u.kind, u.hp]),
  );
  // The armour makes the full life of an ally: one hurt keeps its wounds under the new maximum.
  const armoured = readCarriedCamp(plain(), 1.3)!;
  for (const unit of armoured.units) assert.equal(unit.maxHp, kinds[unit.kind as 'club'].hp * 1.3);
  // An empty camp is a camp: every ally fell, the coins and the crystal remain.
  assert.deepEqual(readCarriedCamp({ ...plain(), units: [] }, 1), {
    units: [],
    gold: camp.gold,
    base: camp.base,
    nextId: 0,
  });
});

test('a carried camp out of bounds is refused whole', () => {
  const refused = (change: (c: ReturnType<typeof plain>) => void, why: string) => {
    const forged = plain();
    change(forged);
    assert.equal(readCarriedCamp(forged, 1), null, why);
  };
  refused((c) => (c.gold = -1), 'coins under zero');
  refused((c) => (c.gold = GOLD_LIMIT + 1), 'more coins than a purse holds');
  refused((c) => (c.gold = 1.5), 'half a coin');
  refused((c) => (c.base = 0), 'a crystal already broken');
  refused((c) => (c.base = CRYSTAL_MAX + 1), 'a crystal over its maximum');
  refused((c) => ((c as any).units = null), 'no list of allies');
  refused(
    (c) => (c.units = Array(UNIT_LIMIT + 1).fill(c.units[0])),
    'more allies than a camp holds',
  );
  refused((c) => c.units.push({ ...c.units[0] }), 'two allies with the same number');
  refused((c) => (c.units[0].id = 0), 'an ally without a number');
  refused((c) => (c.units[0].kind = 'licorne'), 'an ally the game does not know');
  refused((c) => (c.units[0].hp = 0), 'a fallen ally: never brought back');
  refused((c) => (c.units[0].x = 0), 'an ally outside the camp');
  refused(
    (c) => c.units.push({ ...c.units.find((u) => u.kind === 'hero'), id: 400 }),
    'two heroes',
  );
  // A number over the limit is not counted as the highest: the ally that carries it is refused.
  refused((c) => (c.units[0].id = ENTITY_ID_LIMIT + 1), 'a number over the limit');
  const atLimit = plain();
  atLimit.units[0].id = ENTITY_ID_LIMIT;
  assert.equal(readCarriedCamp(atLimit, 1)?.nextId, ENTITY_ID_LIMIT, 'a number at the limit');
});

test('the saved expedition and the game that receives the camp agree on what a camp is', () => {
  const state = X.skipGift(X.winBattle(plan, start, won)!)!;
  assert.ok(X.readExpeditionState(JSON.parse(JSON.stringify(state))));
  const twoHeroes = plain();
  twoHeroes.units.push({ ...twoHeroes.units.find((u) => u.kind === 'hero'), id: 400 });
  assert.equal(X.readExpeditionState({ ...state, camp: twoHeroes }), null);
  const game = X.createExpeditionGame(plan, start)!;
  assert.equal(game.receiveCamp({ ...twoHeroes, boons: [] }), false);
  assert.equal(game.receiveCamp({ ...plain(), boons: [] }), true);
  assert.equal(game.gold, camp.gold);
});
