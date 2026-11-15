import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { eggDepth, standingDepth } from '../src/render/boardDepth.ts';
import * as DEPTH from '../src/render/boardLayers.ts';

// Retyped on purpose: the order of the layers is what the player sees in front of what.
test('les couches du plateau gardent leur profondeur', () => {
  assert.deepEqual(
    { ...DEPTH },
    {
      terrain: 0,
      honeyZone: 7.5,
      eggs: 8,
      strongholdEffects: 9,
      honeyPot: 9,
      dens: 9.4,
      feastLabel: 9.5,
      refuge: 9.6,
      flightShadows: 9.65,
      groundMarks: 9.7,
      wings: 9.99,
      standing: 10,
      ink: 15,
      refugeDetails: 15.1,
      refugeLabel: 15.2,
      medicalStation: 15.4,
      warnings: 16,
      threatIcons: 16.1,
      threatCounts: 16.2,
      signalLabels: 17,
      sparks: 21,
      feedback: 22,
      feedbackLabels: 23,
      floatingWords: 24,
      resultOverlay: 100,
    },
  );
  // The file reads from the ground up: each layer is written under the one it covers.
  const written = [
    ...readFileSync('src/render/boardLayers.ts', 'utf8').matchAll(/= ([\d.]+);/g),
  ].map((match) => Number(match[1]));
  assert.deepEqual(
    written,
    [...written].sort((a, b) => a - b),
  );
  assert.equal(written.length, Object.keys(DEPTH).length);
});

test('ce qui est debout se range par sa hauteur, sans changer de couche', () => {
  for (const y of [0, 13.37, 108, 180, 324, 468, 540, 619.5]) {
    assert.equal(standingDepth(y), 10 + y / 1000);
    assert.equal(eggDepth(y), 8 + y / 1000);
    assert.ok(standingDepth(y) < DEPTH.ink && eggDepth(y) < DEPTH.strongholdEffects);
  }
});

test('aucune profondeur n’est écrite en chiffres hors de la table', () => {
  const files = readdirSync('src/render').filter((name) => name.endsWith('.ts'));
  for (const name of files) {
    if (name === 'boardLayers.ts') continue;
    const source = readFileSync(`src/render/${name}`, 'utf8');
    for (const [call] of source.matchAll(/\.setDepth\(\s*[-\d.][^)]*\)/g))
      assert.fail(`src/render/${name} : ${call} — passe par DEPTH (src/render/boardLayers.ts)`);
  }
});

test('les couleurs partagées du plateau gardent leur teinte', async () => {
  const BOARD_COLOR = await import('../src/render/palette.ts');
  const { cssColor } = await import('../src/render/cssColor.ts');
  assert.deepEqual(
    { ...BOARD_COLOR },
    {
      parchment: 0xe2c58a,
      confusion: 0xf4dcff,
      kingWarning: 0xffd58b,
      placement: 0xb2eaf4,
      coin: 0xffd66a,
      serpentRim: 0xd2552d,
    },
  );
  assert.equal(cssColor(BOARD_COLOR.confusion), '#f4dcff');
  assert.equal(cssColor(BOARD_COLOR.kingWarning), '#ffd58b');
  assert.equal(cssColor(0x00a0ff), '#00a0ff');
});

test('les planches nommées hors de art.ts existent', async () => {
  const { ART_SHEETS, SHEET, sheetUrl } = await import('../src/art.ts').catch(() => ({
    ART_SHEETS: null,
    SHEET: null,
    sheetUrl: null,
  }));
  // The sheets are images: outside the bundler this module cannot be loaded, and the
  // compiler already refuses a name that is not a sheet (`satisfies` in art.ts).
  if (!ART_SHEETS || !SHEET || !sheetUrl) return;
  const keys = new Set<string>(ART_SHEETS.map((sheet) => sheet.key));
  for (const key of Object.values(SHEET)) assert.ok(keys.has(key), key);
});
