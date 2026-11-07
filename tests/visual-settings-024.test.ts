import test from 'node:test';
import assert from 'node:assert/strict';
import { createVisualSettings, VISUAL_SETTINGS_KEY } from '../src/render/visualSettings.ts';

test('la préférence visuelle se conserve séparément des sauvegardes du jeu', () => {
  const entries = new Map<string, string>();
  const storage = {
    getItem: (k: string) => entries.get(k) ?? null,
    setItem: (k: string, v: string) => {
      entries.set(k, v);
    },
  };
  const first = createVisualSettings(storage);
  assert.equal(first.light, false);
  first.setLight(true);
  assert.equal(createVisualSettings(storage).light, true);
  assert.deepEqual([...entries.keys()], [VISUAL_SETTINGS_KEY]);
  first.setLight(false);
  assert.equal(createVisualSettings(storage).light, false);
});
test('les mouvements réduits du système restent prioritaires', () => {
  const s = createVisualSettings();
  assert.equal(s.reduced(false), false);
  assert.equal(s.reduced(true), true);
  s.setLight(true);
  assert.equal(s.reduced(false), true);
  s.setLight(false);
  assert.equal(s.reduced(true), true);
});
test('stockage refusé ou corrompu : le réglage reste utilisable en mémoire', () => {
  const broken = {
    getItem() {
      throw Error('blocked');
    },
    setItem() {
      throw Error('quota');
    },
  };
  const s = createVisualSettings(broken);
  s.setLight(true);
  assert.equal(s.light, true);
  const invalid = createVisualSettings({ getItem: () => '{bad}', setItem: () => {} });
  assert.equal(invalid.light, false);
});
