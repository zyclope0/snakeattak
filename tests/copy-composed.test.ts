import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { REWARDS } from '../src/rewards.ts';
import type { RewardId } from '../src/rewards.ts';
import { kinds } from '../src/data.ts';
import type { Kind } from '../src/data.ts';
import { LANE_NAMES } from '../src/ai.ts';
import { setLanguage } from '../src/i18n/language.ts';
import { copy } from '../src/i18n/copy.ts';
import { english } from '../src/i18n/dictionary.en.ts';
import { fill } from '../src/texts/fill.ts';
import { allyPriceLabel, dockAllyLabel } from '../src/ui/allyLabel.ts';
import { placementAdvice } from '../src/ui/placementAdvice.ts';
import * as ADVICE from '../src/texts/fr/advice.ts';
import * as GUIDE from '../src/texts/fr/guide.ts';
import * as SCREENS from '../src/texts/fr/battleScreens.ts';
import * as BATTLE_EN from '../src/texts/en/battle.ts';
import * as RECRUIT_EN from '../src/texts/en/recruiting.ts';

/** The English interface for one test: copy() reads the dictionary only then. */
async function inEnglish(check: () => void) {
  await setLanguage('en');
  try {
    check();
  } finally {
    await setLanguage('fr');
  }
}
/** The English of a French text of the catalogue, as the dictionary holds it. */
function englishOf(french: string) {
  const translated = english[french];
  assert.ok(translated, `no English for « ${french} »`);
  return translated;
}
/** The message under the board once the card `id` is taken, in a real game. */
function takeCard(id: RewardId): string {
  for (let seed = 1; seed <= 200; seed++) {
    const g = new Game(seed);
    g.wave = 3;
    assert.equal(g.startWave(), true);
    g.remaining = 0;
    g.enemies = [];
    g.eggs = [];
    g.step(1 / 30);
    if (!g.rewardOffer.includes(id)) continue;
    assert.equal(g.chooseReward(id), true);
    return g.message;
  }
  throw Error(`the card ${id} is never offered`);
}

test('the message of each reward card is read whole in English, the French unchanged', async () => {
  const messages = (Object.keys(REWARDS) as RewardId[]).map((id) => {
    const { title, detail } = REWARDS[id];
    const message = takeCard(id);
    // The French the parent approved, byte for byte as it was glued before.
    assert.equal(message, `${title} ! ${detail}`);
    return { message, title, detail };
  });
  assert.equal(messages.length, 6);
  await inEnglish(() => {
    for (const { message, title, detail } of messages) {
      const shown = copy(message);
      // Each part comes from the English catalogue: no French word is left over.
      assert.equal(shown, fill(BATTLE_EN.nExclamationN, englishOf(title), englishOf(detail)));
      assert.doesNotMatch(shown, /Protège|cristal|roi|dégâts|offert|pièces| ! /, shown);
    }
    // The crystal card, the one the child met in French: « Protège ton cristal… ».
    assert.equal(
      copy(takeCard('cristal')),
      'The Crystal Guard! Blocks 18 damage to your Crystal. The King still gets through.',
    );
  });
});

test('a join with no word of its own is used only between texts the dictionary knows', async () => {
  await inEnglish(() => {
    assert.equal(copy('La garde du cristal ! Massue'), 'The Crystal Guard! Clubber');
    // « Bonjour » is no text of the game: the join is not used, the sentence is translated
    // as it was before the join existed, sentence by sentence.
    assert.equal(copy('Massue ! Bonjour'), 'Clubber ! Bonjour');
  });
});

test('every ally card says its price and why it waits, in French as before and in English', async () => {
  // The French of the dock, unchanged.
  assert.equal(dockAllyLabel('Massue', 80, true, false), 'Massue, 80 pièces');
  assert.equal(dockAllyLabel('Massue', 80, false, false), 'Massue, 80 pièces, pas assez de pièces');
  assert.equal(
    dockAllyLabel('Massue', 80, false, true),
    'Massue, 80 pièces, réserve bancaire protégée',
  );
  assert.equal(dockAllyLabel('Massue', 0, true, false), 'Massue, offert');
  assert.equal(
    dockAllyLabel('Massue', 0, false, true),
    'Massue, offert, réserve bancaire protégée',
  );
  assert.equal(allyPriceLabel('Massue', 80), 'Massue, 80 pièces');
  const names = Object.values(kinds).map((unit) => unit.name);
  assert.equal(names.length, 22);
  await inEnglish(() => {
    for (const name of names) {
      const ally = englishOf(name);
      for (const cost of [0, 80]) {
        const price = cost ? fill(RECRUIT_EN.nNPieces, ally, cost) : fill(RECRUIT_EN.nOffert, ally);
        assert.equal(copy(dockAllyLabel(name, cost, true, false)), price);
        assert.equal(
          copy(dockAllyLabel(name, cost, false, false)),
          fill(RECRUIT_EN.nPasAssezDePieces, price),
        );
        assert.equal(
          copy(dockAllyLabel(name, cost, false, true)),
          fill(RECRUIT_EN.nReserveBancaireProtegee, price),
        );
      }
    }
    assert.equal(
      copy(dockAllyLabel('Massue', 80, false, false)),
      'Clubber, 80 coins, not enough coins',
    );
  });
});

test('the words taken out of the code keep the English the child already saw', async () => {
  const hint = (kind: Kind) => placementAdvice(kind).compactHint;
  const lanes = [LANE_NAMES[0], LANE_NAMES[2]].join(ADVICE.et);
  assert.equal(fill(SCREENS.iaN, SCREENS.attentive), 'IA : attentive');
  assert.equal(hint('archer'), 'Touche à droite · derrière les combattants · portée longue');
  assert.equal(fill(GUIDE.nPv, 140), '140 PV');
  assert.equal(lanes, 'Haut et Bas');
  await inEnglish(() => {
    assert.equal(copy(fill(SCREENS.iaN, SCREENS.exploratrice)), 'AI: exploring');
    assert.equal(copy(fill(SCREENS.iaN, SCREENS.attentive)), 'AI: watchful');
    assert.equal(copy(fill(SCREENS.iaN, SCREENS.tacticienne)), 'AI: tactical');
    assert.match(copy(hint('club')), / · short range$/);
    assert.match(copy(hint('medic')), / · medium range$/);
    assert.match(copy(hint('archer')), / · long range$/);
    assert.equal(copy(fill(GUIDE.nPv, 140)), '140 HP');
    assert.equal(
      copy(fill(ADVICE.vagueNNN, 3, lanes, ADVICE.lesAutresVoiesRestentPaisibles)),
      'Wave 3: Top and Bottom. The other lanes stay peaceful.',
    );
  });
});
