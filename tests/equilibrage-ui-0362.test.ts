import test from 'node:test';
import assert from 'node:assert/strict';
import { Session } from '../src/session.ts';
import { Game } from '../src/game.ts';
import { encodeDeparture, decodeDeparture } from '../src/departures.ts';
import { createMissionRun } from '../src/missions.ts';
import { capriceRows } from '../src/ui/capriceView.ts';
import { capriceDefinitionForRun } from '../src/caprices.ts';
import { capriceExplanation } from '../src/ui/capriceCopy.ts';
import { copy } from '../src/i18n/copy.ts';
import { setLanguage } from '../src/i18n/language.ts';

test('new session/restart opt into revision 2; explicit legacy and restored games keep their rules', () => {
  const session = new Session(0);
  assert.equal(session.game.balanceRevision, 2);
  assert.equal(session.game.recruitCost('trex'), 340);
  session.restart(0xffffffff, 1);
  assert.equal(session.game.balanceRevision, 1);
  assert.equal(session.game.recruitCost('trex'), 390);
  session.restart(0);
  assert.equal(session.game.balanceRevision, 2);
  const legacy = new Game(3);
  session.useGame(legacy);
  assert.equal(session.game, legacy);
  assert.equal(session.game.balanceRevision, 1);
  for (const balance of [undefined, 2] as const) {
    const code = encodeDeparture({ kind: 'classic', seed: 0, ...(balance ? { balance } : {}) });
    const result = decodeDeparture(code);
    assert.ok(result.ok && result.departure.kind === 'classic');
    session.restart(result.departure.seed, result.departure.balance ?? 1);
    assert.equal(session.game.balanceRevision, balance ?? 1);
  }
});

test('preparation cards and explanations resolve all five revised definitions without changing French identities', async () => {
  for (const [missionId, id] of [
    ['carrefour', 'carrefour-grand'],
    ['sonnette', 'sonnette-grand'],
    ['refuge', 'refuge-createur-moyen'],
    ['trois-ponts', 'trois-ponts-createur-moyen'],
    ['course', 'course-createur-moyen'],
  ] as const) {
    const run = { ...createMissionRun(missionId, 1, undefined, 2), caprice: id };
    const resolved = capriceDefinitionForRun(run)!;
    const card = capriceRows(run, 3)
      .flatMap((r) => r.cards)
      .find((c) => c.definition.id === id)!;
    assert.equal(card.definition, resolved);
    for (const lang of ['fr', 'en'] as const) {
      await setLanguage(lang);
      assert.equal(copy(resolved.name), resolved.name);
      assert.equal(copy(resolved.announce), resolved.announce);
      const explanation = copy(capriceExplanation(resolved.rules));
      if (resolved.rules.shellBite)
        assert.match(explanation, lang === 'fr' ? /morsures.*coquille/ : /bites.*shell/);
    }
  }
  await setLanguage('fr');
});

test('new UI copy is translated and successful recruitment alone increments the UI counter', async () => {
  await setLanguage('en');
  assert.equal(copy('Règles d’origine'), 'Original rules');
  assert.equal(copy('Tu as des pièces, recrute !'), 'You have coins, recruit an ally!');
  await setLanguage('fr');
  const session = new Session(88);
  session.selectUnit('club');
  assert.equal(session.placeSelected(0, 0), false);
  assert.equal(session.recruitmentCount, 0);
  assert.equal(session.placeSelected(900, 180), true);
  assert.equal(session.recruitmentCount, 1);
  assert.equal(session.placeSelected(900, 324), false);
  assert.equal(session.recruitmentCount, 1);
});
