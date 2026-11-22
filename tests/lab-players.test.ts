import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { createMissionRun } from '../src/missions.ts';
import { PROFILES, playStage } from '../scripts/lab/players.ts';

// Les joueurs automatiques des laboratoires (`npm run balance:expedition`). Une mesure
// d'équilibrage ne vaut que si la même partie, jouée deux fois, donne le même compte ; et ce
// fichier, hors de `src/`, n'est relu par le compilateur que parce qu'un test l'importe.
const battle = (seed: number) => new Game(seed, undefined, createMissionRun('refuge', seed)!);

test('chaque joueur automatique joue une bataille jusqu’au bout, deux fois de la même façon', () => {
  assert.deepEqual([...PROFILES], ['expert', 'moyen', 'apprenti', 'petit', 'massues', 'gros']);
  for (const profile of PROFILES) {
    const first = playStage(battle(7), profile);
    assert.deepEqual(playStage(battle(7), profile), first, profile);
    assert.ok(['won', 'lost', 'timeout'].includes(first.status), profile);
    assert.ok(first.seconds > 0 && first.wave >= 1, profile);
    assert.ok(first.minBase >= 0 && first.minBase <= first.base + 100, profile);
  }
  // The strongest player wins the first mission; the measures start from there.
  assert.equal(playStage(battle(7), 'expert').status, 'won');
});
