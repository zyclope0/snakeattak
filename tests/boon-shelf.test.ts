// L'aventure sans fin, lot B (27 novembre 2026) : les mots des cartes de cadeau et les signes des
// cadeaux sur le plateau. Rendu seulement : rien ici ne change une règle.
import test from 'node:test';
import assert from 'node:assert/strict';
import type Phaser from 'phaser';
import type { Game } from '../src/game.ts';
import type { Presentation } from '../src/render/presentation.ts';
import { BOON_RULES, LASTING_BOONS, type LastingBoon } from '../src/boons.ts';
import { ENDLESS_RULES } from '../src/endless.ts';
import { boonNow, boonWords, giftCopy } from '../src/ui/boonCopy.ts';
import { boonLayer } from '../src/render/boonLayer.ts';
import * as DEPTH from '../src/render/boardLayers.ts';
import * as CAMP from '../src/texts/fr/camp.ts';
import { setLanguage } from '../src/i18n/language.ts';
import { copy } from '../src/i18n/copy.ts';

const RULES = BOON_RULES[1];
/** A game seen from the screens: its gifts at these levels, and what stands on the board. */
function seen(levels: Partial<Record<LastingBoon, number>>, more: Partial<Game> = {}): Game {
  return {
    endless: ENDLESS_RULES[1],
    boonRules: RULES,
    boonLevel: (id: LastingBoon) => levels[id] ?? 0,
    units: [],
    effects: [],
    ...more,
  } as unknown as Game;
}

test('une carte dit ce que fait le cadeau sans « % » ; reprise, elle montre ★★ → ★★★', () => {
  for (const id of LASTING_BOONS)
    for (let level = 1; level <= RULES.maxLevel; level++)
      assert.doesNotMatch(boonWords(id, level, RULES.steps), /%/, `${id} ${level}`);
  const climb = giftCopy(seen({ forge: 2 }), 'forge');
  assert.equal(climb.action, '★★ → ★★★');
  assert.equal(climb.detail, `★★★ ${CAMP.tesAlliesFrappentPlusFort}`);
  const fresh = giftCopy(seen({}), 'rente');
  assert.equal(fresh.action, CAMP.choisirCeCadeau);
  assert.equal(fresh.detail, '★ +40 pièces à chaque vague');
  assert.equal(boonNow(seen({ armure: 1 }), 'armure'), `★ ${CAMP.tesAlliesOntPlusDeVie}`);
  // A card taken once in the endless adventure is a gift too; the great adventure keeps « bonus ».
  assert.equal(giftCopy(seen({}), 'pieces').action, CAMP.choisirCeCadeau);
  assert.equal(giftCopy(seen({}, { endless: null }), 'pieces').action, CAMP.choisirCeBonus);
});

/** A drawing that remembers what it was asked since it was last cleared. */
function recorder() {
  const drawn: { depth: number; calls: [string, number[]][] } = { depth: 0, calls: [] };
  const graphics = new Proxy(drawn, {
    get(target, name: string) {
      if (name === 'setDepth') return (depth: number) => ((target.depth = depth), graphics);
      if (name === 'clear') return () => ((target.calls = []), graphics);
      return (...args: number[]) => (target.calls.push([name, args]), graphics);
    },
  });
  return { drawn, graphics };
}
function board() {
  const drawings: ReturnType<typeof recorder>['drawn'][] = [];
  const scene = {
    add: {
      graphics: () => {
        const one = recorder();
        drawings.push(one.drawn);
        return one.graphics;
      },
    },
  } as unknown as Phaser.Scene;
  const layer = boonLayer(scene);
  const at = (depth: number) => drawings.find((d) => d.depth === depth)!;
  const count = (depth: number, name: string) =>
    at(depth).calls.filter(([call]) => call === name).length;
  return { layer, at, count };
}
const clock = (seconds: number) => ({ clock: seconds }) as Presentation;

test('l’armure entoure chaque allié debout ; le cristal solide luit ; rien sans cadeau', () => {
  const { layer, count } = board();
  const units = [
    { id: 1, x: 700, y: 300, hp: 10 },
    { id: 2, x: 800, y: 300, hp: 0 },
    { id: 3, x: 900, y: 200, hp: 4 },
  ];
  layer.draw(seen({ armure: 2, solide: 1 }, { units } as Partial<Game>), clock(0), false);
  assert.equal(count(DEPTH.groundMarks, 'strokeEllipse'), 2, 'one ring an ally standing');
  assert.equal(count(DEPTH.strongholdEffects, 'fillEllipse'), 1, 'the glow of the refuge');
  layer.draw(seen({}, { units } as Partial<Game>), clock(0.1), false);
  assert.equal(count(DEPTH.groundMarks, 'strokeEllipse'), 0);
  assert.equal(count(DEPTH.strongholdEffects, 'fillEllipse'), 0);
  // A game of the great adventure holds no gift: nothing is drawn.
  layer.draw(seen({ armure: 3 }, { endless: null, units } as Partial<Game>), clock(0.2), false);
  assert.equal(count(DEPTH.groundMarks, 'strokeEllipse'), 0);
});

test('la forge fait jaillir des étincelles des coups des alliés, pas des morsures', () => {
  const { layer, count } = board();
  const units = [{ id: 1, x: 700, y: 300, hp: 10 }];
  const effects: object[] = [];
  const game = seen({ forge: 1 }, { units, effects } as unknown as Partial<Game>);
  layer.draw(game, clock(0), false);
  effects.push({ kind: 'hit', sourceId: 1, x: 700, y: 300, tx: 640, ty: 300, life: 0.3 });
  effects.push({ kind: 'hit', sourceId: 99, x: 640, y: 300, tx: 700, ty: 300, life: 0.3 });
  layer.draw(game, clock(0.05), false);
  // Three rays at level 1, each with its bright tip, for the ally's blow only.
  assert.equal(count(DEPTH.sparks, 'fillCircle'), 3);
  layer.draw(game, clock(0.1), false);
  assert.equal(count(DEPTH.sparks, 'fillCircle'), 3, 'a blow seen once makes one spark');
  layer.draw(game, clock(1), false);
  assert.equal(count(DEPTH.sparks, 'fillCircle'), 0, 'the spark fades');
});

test('« Effets légers » : l’étincelle reste où elle naît', () => {
  const reach = (reduced: boolean, later: number) => {
    const { layer, at } = board();
    const units = [{ id: 1, x: 700, y: 300, hp: 10 }];
    const effects = [{ kind: 'arrow', sourceId: 1, x: 700, y: 300, tx: 600, ty: 310, life: 0.3 }];
    const game = seen({ forge: 3 }, { units, effects } as unknown as Partial<Game>);
    layer.draw(game, clock(0), reduced);
    layer.draw(game, clock(later), reduced);
    const [, [, , x2, y2]] = at(DEPTH.sparks).calls.find(([call]) => call === 'lineBetween')!;
    return Math.hypot(x2 - 600, y2 - 300);
  };
  assert.equal(reach(true, 0.05), reach(true, 0.3));
  assert.ok(reach(false, 0.3) > reach(false, 0.05));
});

test('en anglais, les étoiles restent et les mots du cadeau se traduisent', async () => {
  await setLanguage('en');
  try {
    assert.equal(copy(boonNow(seen({ armure: 2 }), 'armure')), '★★ Your allies have more life.');
    assert.equal(
      copy(giftCopy(seen({ miel: 1 }), 'miel').detail),
      '★★ +8 seconds for every honey pot',
    );
  } finally {
    await setLanguage('fr');
  }
});
