import test from 'node:test';
import assert from 'node:assert/strict';
import { HELP_CLOSE, HELP_TOPICS, type HelpTopicId } from '../src/ui/helpTopics.ts';
import { CAPRICES, CREATOR_CHALLENGES, CAPRICE_UNLOCK_STARS } from '../src/caprices.ts';
import { chapterStars } from '../src/campaignRules.ts';
import { english } from '../src/i18n/english.ts';
import { copy } from '../src/i18n/copy.ts';
import { setLanguage } from '../src/i18n/language.ts';

const topics = Object.entries(HELP_TOPICS) as [HelpTopicId, (typeof HELP_TOPICS)[HelpTopicId]][];
const phrases = [
  HELP_CLOSE,
  ...topics.flatMap(([, help]) => [help.label, help.title, ...help.text]),
];

test('cinq points d’aide : un nom pour le bouton, un titre court, un ou deux paragraphes courts', () => {
  assert.deepEqual(
    topics.map(([id]) => id),
    ['caprices', 'scouting', 'departure', 'family', 'code'],
  );
  for (const [id, help] of topics) {
    assert.match(help.label, /^Aide : \S/, id);
    assert.ok(help.title.length > 0 && help.title.length <= 30, `${id} : titre court`);
    assert.ok(help.text.length >= 1 && help.text.length <= 2, `${id} : un ou deux paragraphes`);
    for (const paragraph of help.text) {
      assert.ok(paragraph.length <= 180, `${id} : paragraphe court`);
      for (const sentence of paragraph.split(/(?<=[.!?])\s+/))
        assert.ok(sentence.split(/\s+/).length <= 22, `${id} : phrase courte « ${sentence} »`);
    }
  }
  assert.equal(new Set(topics.map(([, help]) => help.label)).size, topics.length);
});

test('les aides parlent en mots d’enfant : ni chiffre technique, ni mot du code', () => {
  for (const [id, help] of topics)
    for (const text of [help.title, ...help.text]) {
      // Les seuls nombres permis sont des étoiles à compter.
      assert.equal(text.replace(/\b[1-3] étoiles?\b/g, '').match(/\d/), null, `${id} : ${text}`);
      assert.doesNotMatch(text, /%|\bPV\b|graine|seed|révision|format|JSON|pixel/i, id);
    }
});

test('la phrase sur les caprices suit les règles d’ouverture du jeu', () => {
  assert.deepEqual({ ...CAPRICE_UNLOCK_STARS }, { petit: 1, moyen: 2, grand: 3 });
  // « Quand tu gagnes la mission » : une mission gagnée vaut toujours au moins une étoile.
  for (const base of [1, 30, 59, 60, 89, 90, 100])
    assert.ok(chapterStars(base) >= CAPRICE_UNLOCK_STARS.petit, `cristal à ${base}`);
  const rule = HELP_TOPICS.caprices.text[1];
  assert.match(
    rule,
    new RegExp(
      `Le petit .*gagnes la mission.*Le moyen avec ${CAPRICE_UNLOCK_STARS.moyen} étoiles.*` +
        `Le grand avec ${CAPRICE_UNLOCK_STARS.grand} étoiles`,
    ),
  );
});

test('aucune aide ne reprend ni ne traduit un nom ou une annonce de caprice', () => {
  const protectedWords = [...CAPRICES, ...CREATOR_CHALLENGES].flatMap((c) => [c.name, c.announce]);
  assert.equal(protectedWords.length, 72);
  for (const phrase of phrases)
    for (const word of protectedWords)
      assert.ok(!phrase.includes(word), `« ${word} » dans « ${phrase} »`);
});

test('chaque texte d’aide a son anglais, sans reste de français', async () => {
  const french =
    /[éèêëàâùûçœ«»]|\b(?:aide|caprices? des|repérage|dangers|départ|sauvegarde|alliés|étoiles?|carnet|autocollant|vagues?|chemin|serpents?|œufs)\b/i;
  await setLanguage('en');
  try {
    for (const phrase of phrases) {
      const target = english[phrase];
      assert.ok(target, `anglais manquant : ${phrase}`);
      assert.notEqual(target, phrase);
      assert.doesNotMatch(target, french, phrase);
      // Le même chemin que l'écran : la copie affichée est l'entrée du dictionnaire.
      assert.equal(copy(phrase), target);
    }
    assert.equal(copy(HELP_CLOSE), 'Got it');
    assert.equal(copy(HELP_TOPICS.departure.title), 'Another setup');
  } finally {
    await setLanguage('fr');
  }
  for (const phrase of phrases) assert.equal(copy(phrase), phrase);
});
