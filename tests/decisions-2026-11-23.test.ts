import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as FR from '../src/texts/fr/failure.ts';

// Words the parent approved one by one on 23 November 2026 (docs/DECISIONS-2026-11-23.md).
// The privacy policy has its own fixture; these are held here: a later edit is a new decision.

test('decision 6: the parents’ words when the device is full', () => {
  assert.equal(
    FR.lAppareilNASansDoutePlusAssezDePlace,
    'L’appareil n’a sans doute plus assez de place pour garder la partie. Libère de la place sans fermer le jeu, puis continue à jouer : il réessaiera et le dira.',
  );
});

test('decision 10: the application’s own words when storage is blocked', () => {
  assert.equal(
    FR.cetAppareilNeLaissePasLeJeuGarderLaPartie,
    'Cet appareil ne laisse pas le jeu garder la partie. Elle dure tant que le jeu reste ouvert.',
  );
});

test('decision 7: the public parents’ page says what the family file carries', () => {
  const copy = readFileSync('deploy/discoveryCopy.ts', 'utf8');
  assert.ok(
    copy.includes(
      'L’espace parents propose une sauvegarde familiale ; elle porte l’aventure du joueur en cours, avec son expédition, son voyage et ses records ; elle ne porte pas les autres joueurs.',
    ),
  );
  assert.ok(!copy.includes('n’exporte pas tout'), 'the old sentence is gone');
});
