import test from 'node:test';
import assert from 'node:assert/strict';
import { CAPRICES, CREATOR_CHALLENGES, NO_CAPRICE } from '../src/caprices.ts';
import { capriceExplanation } from '../src/ui/capriceCopy.ts';
import { capriceIconType } from '../src/ui/capriceIcons.ts';
import { setLanguage } from '../src/i18n/language.ts';
import { copy } from '../src/i18n/copy.ts';
import { placementAdvice } from '../src/ui/placementAdvice.ts';
import { kinds, type Kind } from '../src/data.ts';

const catalog = [...CAPRICES, ...CREATOR_CHALLENGES];
test('all 36 actual caprices explain every active lever in FR and EN without technical ratios', async () => {
  const before = JSON.stringify(catalog);
  assert.equal(catalog.length, 36);
  for (const language of ['fr', 'en'] as const) {
    await setLanguage(language);
    for (const caprice of catalog) {
      const text = copy(capriceExplanation(caprice.rules));
      assert.ok(text.length > 15, caprice.id);
      assert.doesNotMatch(text, /×|\d+[.,]\d+|\b(?:PV|HP|cadence|budget)\b/);
      assert.equal(text.match(/[.!?]/g)?.length, 1, 'one sentence');
      const expected =
        language === 'fr'
          ? {
              budget: 'moins de pièces',
              reserve: 'banque',
              kinds: caprice.rules.kinds === 1 ? 'sorte d’allié' : 'sortes d’alliés',
              noHoney: 'miel',
              noHealers: 'soignants',
              king: 'roi',
              shellEvery: 'coquille',
              cadence: 'plus près',
              count: 'plus nombreux',
              hp: caprice.rules.hp < 1 ? 'plus fragiles' : 'plus solides',
              speed: 'plus vite',
              bite: 'morsures',
              eggs: 'plus d’œufs',
              hatch: 'éclosent',
              smart: 'moins gardés',
            }
          : {
              budget: 'fewer coins',
              reserve: 'bank',
              kinds: caprice.rules.kinds === 1 ? 'type of ally' : 'types of allies',
              noHoney: 'honey',
              noHealers: 'healers',
              king: 'king',
              shellEvery: 'shell',
              cadence: 'closer together',
              count: 'more snakes',
              hp: caprice.rules.hp < 1 ? 'more fragile' : 'tougher',
              speed: 'faster',
              bite: 'bites',
              eggs: 'more eggs',
              hatch: 'hatch sooner',
              smart: 'least guarded',
            };
      for (const [flag, phrase] of Object.entries(expected)) {
        const value = caprice.rules[flag as keyof typeof caprice.rules];
        if (value !== NO_CAPRICE[flag as keyof typeof NO_CAPRICE])
          assert.ok(text.includes(phrase), `${language} ${caprice.id} ${flag}: ${text}`);
      }
      assert.equal(copy(caprice.name), caprice.name);
      assert.equal(copy(caprice.announce), caprice.announce);
    }
  }
  assert.equal(JSON.stringify(catalog), before, 'canonical identities and flags unchanged');
  await setLanguage('fr');
});
test('icons group true rule types deterministically across missions', () => {
  const expected: Record<string, string> = {
    'refuge-petit': 'speed',
    'refuge-moyen': 'crowd',
    'refuge-grand': 'storm',
    'trois-ponts-petit': 'purse',
    'trois-ponts-moyen': 'shield-fangs',
    'course-grand': 'king',
    'coquilles-petit': 'eggs',
    'coquilles-moyen': 'crowd',
    'sonnette-petit': 'friend-many',
    'sonnette-moyen': 'fangs',
    'sonnette-grand': 'shield',
    'carrefour-petit': 'honey-empty',
    'carrefour-moyen': 'friend-one',
  };
  for (const caprice of catalog) {
    const type = capriceIconType(caprice.rules);
    assert.equal(type, capriceIconType({ ...caprice.rules }));
    if (expected[caprice.id]) assert.equal(type, expected[caprice.id]);
    if (caprice.set === 'createur')
      assert.equal(type, { petit: 'bank', moyen: 'shell', grand: 'charge' }[caprice.tier]);
  }
  assert.ok(new Set(catalog.map((c) => capriceIconType(c.rules))).size >= 14);
});
test('placement labels are qualitative UI only and retain the actual data range', async () => {
  for (const language of ['fr', 'en'] as const) {
    await setLanguage(language);
    for (const kind of Object.keys(kinds) as Kind[]) {
      const advice = placementAdvice(kind);
      assert.equal(advice.range, kinds[kind].range);
      assert.doesNotMatch(advice.compactHint, /\d/);
      if (kinds[kind].range === 0) {
        assert.doesNotMatch(copy(advice.compactHint), /portée|range/);
        continue;
      }
      assert.match(
        copy(advice.compactHint),
        language === 'fr' ? /portée (courte|moyenne|longue)/ : /(short|medium|long) range/,
      );
    }
  }
  await setLanguage('fr');
});
