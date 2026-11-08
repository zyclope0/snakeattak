import test from 'node:test';
import assert from 'node:assert/strict';
import { childCopy } from '../src/ui/childCopy.ts';
import { Game } from '../src/game.ts';

test('la présentation tutoie sans réécrire les messages historiques du moteur', () => {
  const game = new Game(2026),
    original = game.message;
  assert.equal(childCopy(game.message), 'Choisis un allié.');
  assert.equal(game.message, original);
  assert.equal(
    childCopy('À vous de préparer votre armée prête pour les trois têtes.'),
    'À toi de préparer tes alliés prêts pour les trois têtes.',
  );
  assert.equal(
    childCopy('Protégez le cristal ; vos soldats agissent seuls.'),
    'Protège le cristal ; tes alliés agissent seuls.',
  );
  assert.equal(childCopy('Les trois ponts restent ouverts.'), 'Les trois ponts restent ouverts.');
});
