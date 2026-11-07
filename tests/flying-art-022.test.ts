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
test('volants et soigneur réutilisent une silhouette organique réellement chargée', async () => {
  const { ENEMY_ART, ART_SHEETS } = await import('../src/art.ts');
  for (const kind of ['flying', 'courtHealer'] as const) {
    const art = ENEMY_ART[kind];
    assert.ok(art, `${kind} doit posséder une silhouette`);
    assert.equal(art.texture, 'enemies-organic');
    const sheet = ART_SHEETS.find((candidate) => candidate.key === art.texture);
    assert.ok(sheet);
    assert.ok(Number.isInteger(art.frame) && art.frame >= 0 && art.frame < 4);
  }
});
