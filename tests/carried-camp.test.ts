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

test('the bounds of a carried camp are accepted on both sides', () => {
  const accepted = (change: (c: ReturnType<typeof plain>) => void, why: string) => {
    const forged = plain();
    change(forged);
    assert.ok(readCarriedCamp(forged, 1), why);
  };
  accepted((c) => (c.gold = 0), 'an empty purse');
  accepted((c) => (c.gold = GOLD_LIMIT), 'a purse at its limit');
  accepted((c) => (c.base = 1), 'a crystal about to break');
  accepted((c) => (c.base = 55.5), 'a crystal between two whole numbers');
  accepted((c) => (c.base = CRYSTAL_MAX), 'a whole crystal');
  // As many allies as a camp holds, each with its own number; one more is refused for the
  // count alone.
  const crowd = (count: number) => {
    const forged = plain();
    const model = forged.units.find((u) => u.kind !== 'hero');
    forged.units = Array.from({ length: count }, (_, index) => ({ ...model, id: index + 1 }));
    return readCarriedCamp(forged, 1);
  };
  assert.equal(crowd(UNIT_LIMIT)?.units.length, UNIT_LIMIT);
  assert.equal(crowd(UNIT_LIMIT + 1), null);
});

test('an ally keeps its home and a healer its supplies', () => {
  const forged = plain();
  const model = forged.units.find((u) => u.kind !== 'hero');
  forged.units[forged.units.indexOf(model)] = {
    ...model,
    homeX: model.x + 30,
    homeY: model.y + 24,
  };
  forged.units.push({
    id: 500,
    kind: 'medic',
    x: model.x,
    y: model.y,
    hp: 1,
    homeX: model.x,
    homeY: model.y,
    medical: { bandages: 2, phase: 'ready', remaining: 0 },
    medicalCool: 0,
  });
  const read = readCarriedCamp(forged, 1)!;
  const moved = read.units.find((u) => u.id === model.id)!;
  assert.deepEqual([moved.homeX, moved.homeY], [model.x + 30, model.y + 24]);
  assert.equal(read.units.find((u) => u.id === 500)!.medical?.bandages, 2);
  // Supplies that cannot be trusted refuse the whole camp.
  forged.units.at(-1).medical = { bandages: 99, phase: 'ready', remaining: 0 };
  assert.equal(readCarriedCamp(forged, 1), null);
});

test('the saved expedition and the game read a camp with the same reader; the game also knows its allies', () => {
  const state = X.skipGift(X.winBattle(plan, start, won)!)!;
  assert.ok(X.readExpeditionState(JSON.parse(JSON.stringify(state))));
  const twoHeroes = plain();
  twoHeroes.units.push({ ...twoHeroes.units.find((u) => u.kind === 'hero'), id: 400 });
  assert.equal(X.readExpeditionState({ ...state, camp: twoHeroes }), null);
  const refusing = X.createExpeditionGame(plan, start)!;
  const before = JSON.stringify(refusing);
  assert.equal(refusing.receiveCamp({ ...twoHeroes, boons: [] }), false);
  // An ally of a later revision of the rules is in the catalogue, so the reader takes it; the
  // game of this expedition does not know it and refuses the camp without touching anything.
  const stranger = plain();
  stranger.units.push({
    ...stranger.units.find((u) => u.kind !== 'hero'),
    id: 600,
    kind: 'spinosaurus',
    hp: 1,
  });
  assert.ok(readCarriedCamp(stranger, 1), 'the reader knows the catalogue');
  assert.equal(refusing.knowsAlly('spinosaurus'), false);
  assert.equal(refusing.receiveCamp({ ...stranger, boons: [] }), false);
  assert.equal(JSON.stringify(refusing), before, 'a refused camp changes nothing');
  // A camp received: its coins, its crystal, and the next ally recruited takes a new number.
  const carried = plain();
  carried.base = 55.5;
  carried.units[0].id = 900;
  const game = X.createExpeditionGame(plan, start)!;
  assert.equal(game.receiveCamp({ ...carried, boons: [] }), true);
  assert.equal(game.gold, camp.gold);
  assert.equal(game.base, 55.5);
  assert.equal(game.nextId, 901);
  // A camp whose allies carry low numbers never brings the game's own counter down.
  const low = X.createExpeditionGame(plan, start)!;
  const counter = low.nextId;
  const few = plain();
  few.units = [{ ...few.units.find((u) => u.kind !== 'hero'), id: 1 }];
  assert.equal(low.receiveCamp({ ...few, boons: [] }), true);
  assert.equal(low.nextId, Math.max(counter, 2));
});
