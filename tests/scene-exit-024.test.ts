import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { onSceneExit } from '../src/render/sceneExit.ts';

for (const first of ['shutdown', 'destroy'])
  test(`nettoyage unique à ${first}, sans garder l’autre écouteur`, () => {
    const events = new EventEmitter();
    let cleaned = 0;
    onSceneExit(events, () => cleaned++);
    events.emit(first);
    events.emit(first === 'shutdown' ? 'destroy' : 'shutdown');
    assert.equal(cleaned, 1);
    assert.equal(events.listenerCount('shutdown'), 0);
    assert.equal(events.listenerCount('destroy'), 0);
  });
test('les redémarrages ne gardent pas les anciennes fermetures de nettoyage', () => {
  const events = new EventEmitter();
  let cleaned = 0;
  for (let i = 0; i < 20; i++) {
    onSceneExit(events, () => cleaned++);
    events.emit('shutdown');
  }
  assert.equal(cleaned, 20);
  assert.equal(events.listenerCount('destroy'), 0);
});
