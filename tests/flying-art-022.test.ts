import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

// Vite turns imported assets into URL strings; preserve that boundary in Node.
registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith('.webp'))
      return {
        format: 'module',
        source: `export default ${JSON.stringify(url)};`,
        shortCircuit: true,
      };
    return nextLoad(url, context);
  },
});

// Catches new species disappearing because Actors cannot find a loaded atlas frame.
test('volants, soigneur et King Snake ont une silhouette réellement chargée', async () => {
  const { ENEMY_ART, KING_ART, ART_SHEETS } = await import('../src/art.ts');
  // The flying snake and King Snake have their own drawings since 26 November 2026; the
  // healer of the court still borrows the green snake.
  for (const [art, texture] of [
    [ENEMY_ART.flying, 'serpents-roi-volant'],
    [KING_ART, 'serpents-roi-volant'],
    [ENEMY_ART.courtHealer, 'enemies-organic'],
  ] as const) {
    assert.ok(art);
    assert.equal(art.texture, texture);
    const sheet = ART_SHEETS.find((candidate) => candidate.key === art.texture);
    assert.ok(sheet && 'attackUrl' in sheet, 'a sheet with its attack poses');
    assert.ok(Number.isInteger(art.frame) && art.frame >= 0 && art.frame < 4);
  }
  assert.notEqual(ENEMY_ART.flying.frame, KING_ART.frame);
});
