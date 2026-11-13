import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import { CAPRICES, CREATOR_CHALLENGES } from '../src/caprices.ts';
import { capriceStickerName } from '../src/ui/capriceIcons.ts';

const folder = new URL('../src/assets/caprices/', import.meta.url);
const catalog = [...CAPRICES, ...CREATOR_CHALLENGES];

test('chaque caprice a sa vignette, et le fichier existe', () => {
  assert.equal(catalog.length, 36);
  for (const caprice of catalog) {
    const name = capriceStickerName(caprice.id);
    assert.ok(name, `vignette manquante pour ${caprice.id}`);
    assert.ok(existsSync(new URL(`${name}.webp`, folder)), `fichier manquant : ${name}.webp`);
  }
});

test('un même nom de caprice donne la même vignette, deux noms deux vignettes', () => {
  const byName = new Map<string, string>();
  for (const caprice of catalog) {
    const sticker = capriceStickerName(caprice.id)!;
    assert.equal(byName.get(caprice.name) ?? sticker, sticker, caprice.name);
    byName.set(caprice.name, sticker);
  }
  assert.equal(byName.size, 20);
  assert.equal(new Set(byName.values()).size, 20);
});

test('aucune image inutilisée dans le dossier des vignettes', () => {
  const used = new Set(catalog.map((caprice) => `${capriceStickerName(caprice.id)}.webp`));
  assert.deepEqual(readdirSync(folder).sort(), [...used].sort());
});

test('un caprice inconnu n’a pas de vignette : le dessin au trait reste le repli', () => {
  assert.equal(capriceStickerName('mission-inconnue-petit'), undefined);
});
