import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { createMissionRun } from '../src/missions.ts';
import { encodeDeparture, decodeDeparture } from '../src/departures.ts';
import {
  getLanguage,
  setLanguage,
  selectInitialLanguage,
  onLanguageChange,
} from '../src/i18n/language.ts';
import { copy } from '../src/i18n/copy.ts';

test('language selection honors a valid choice then supported system languages', () => {
  assert.equal(selectInitialLanguage('fr', ['en-US']), 'fr');
  assert.equal(selectInitialLanguage('en', ['fr-CH']), 'en');
  assert.equal(selectInitialLanguage('bad', ['en-US']), 'en');
  assert.equal(selectInitialLanguage(null, ['de-CH', 'fr-CH']), 'fr');
  assert.equal(selectInitialLanguage(null, []), 'fr');
});

test('English changes displayed copy, preserving canonical states and departure codes', async () => {
  await setLanguage('fr');
  const run = createMissionRun('refuge', 20261109),
    game = new Game(20261109, undefined, run);
  game.startWave();
  for (let i = 0; i < 60; i++) game.step(1 / 30);
  const before = JSON.stringify(game),
    code = encodeDeparture({ kind: 'mission', run });
  assert.equal(copy('Massue'), 'Massue');
  await setLanguage('en');
  assert.equal(getLanguage(), 'en');
  assert.equal(copy('La Conquête des Serpents'), 'Snake Attack TD');
  assert.equal(copy('Massue'), 'Clubber');
  assert.match(copy('Vague 3 : défends le camp !'), /Wave 3/);
  assert.match(copy('REFUGE · 82 %'), /REFUGE.*82/);
  assert.equal(copy(code), code);
  assert.deepEqual(decodeDeparture(code), { ok: true, departure: { kind: 'mission', run } });
  assert.equal(JSON.stringify(game), before);
  await setLanguage('fr');
  assert.equal(copy('Massue'), 'Massue');
  assert.equal(JSON.stringify(game), before);
});

test('language listeners run once per real change and can unsubscribe without resetting the game', async () => {
  await setLanguage('fr');
  let calls = 0;
  const off = onLanguageChange(() => calls++);
  await setLanguage('en');
  await setLanguage('en');
  assert.equal(calls, 1);
  off();
  await setLanguage('fr');
  assert.equal(calls, 1);
});

test('a newer French choice wins over an English module request still awaiting completion', async () => {
  await setLanguage('fr');
  const pending = setLanguage('en');
  await setLanguage('fr');
  await pending;
  assert.equal(getLanguage(), 'fr');
});

test('copy safely handles numbers, plurals, composite statuses and long unknown raw data', async () => {
  await setLanguage('en');
  assert.match(copy('Éclosion dans 2 s'), /2/);
  assert.doesNotMatch(copy('Éclosion dans 2 s'), /Éclosion/);
  assert.match(copy('150 PV'), /150 HP/);
  assert.equal(copy('1,5'), '1.5');
  const raw = '{"untrusted":"' + 'x'.repeat(10000) + '"}';
  assert.equal(copy(raw), raw);
  assert.match(copy('À renforcer : Haut'), /Top/);
  assert.doesNotMatch(
    copy('Bandages : 2 en réserve · 1 soignant refait son stock'),
    /réserve|soignant/,
  );
  await setLanguage('fr');
});

test('composed canonical UI sentences, symbols, lane statuses and rewards are fully English', async () => {
  await setLanguage('en');
  const samples = [
    '🔒 Verrouillée · termine la précédente',
    'Archer, 150 pièces. Distance.',
    'Haut : paisible pour cette vague',
    'Centre : attaquée',
    'Attirer : choisir le miel puis toucher un chemin',
    'Une idée avec Bouclier',
    'Gardienne KO',
    'La bourse des aventuriers. +100 pièces pour recruter les alliés de ton choix.',
    'Favoris et 0 étoiles seulement. Aucun camp de reprise : les anciens alliés seront remplacés. Expéditions : 0 / 18 étoiles. Le camp classique est conservé séparément.',
    'Touche un chemin pour poser le miel, ou utilise les boutons ci-dessous. Attire les gourmands vers cette voie aux prochaines jonctions. Voie attaquée : Centre. « — » : paisible.',
  ];
  const bad = samples
    .map(copy)
    .filter((text) =>
      /Verrouillée|termine|pièces|paisible|attaquée|choisir|avec|Gardienne|bourse|étoiles|alliés|utilise|touch[eé]/i.test(
        text,
      ),
    );
  assert.deepEqual(bad, []);
  assert.match(copy('Haut et Bas'), /Top and Bottom/);
  assert.match(copy('Gardienne KO'), /Guardian KO/);
  await setLanguage('fr');
});

test('counted army names use the same English identity as the unit guide', async () => {
  await setLanguage('en');
  assert.equal(copy('Massue × 2'), 'Clubber × 2');
  assert.equal(copy('Héros × 1'), 'Hero × 1');
  assert.equal(copy('Vélociraptor × 3'), 'Velociraptor × 3');
  await setLanguage('fr');
});
