import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { Game } from '../src/game.ts';
import { createMissionRun } from '../src/missions.ts';
import { encodeCheckpoint, decodeCheckpoint } from '../src/checkpoints.ts';
import { replayDeparture } from './tutoiement-replay.ts';

const forbidden =
  /\b(?:vous|votre|vos|retenez|surveillez|achetez|utilisez|protégez|défendez|gardez|interceptez|résistez|surmontez|tenez|préparez|choisissez|touchez|consultez|répartissez|renforcez|réparez|observez|combinez|rechargez|pouvez|commencez|placez)\b/giu;

test('les sources et le HTML tutoient directement, y compris les impératifs sans pronom', () => {
  const files = [
    'index.html',
    ...readdirSync('src', { recursive: true })
      .filter((p) => /\.(ts|css|html|json|svg|txt)$/.test(String(p)))
      .map((p) => 'src/' + p)
      // The privacy policy speaks to parents, in the words its publisher approved: « vous ».
      .filter((file) => file !== 'src/i18n/privacyPolicy.ts'),
  ];
  const matches = files.flatMap((file) =>
    [...readFileSync(file, 'utf8').matchAll(forbidden)].map((m) => `${file}: ${m[0]}`),
  );
  assert.deepEqual(matches, []);
});

test('le moteur fournit lui-même les textes de préparation et de vague déjà lisibles', () => {
  const g = new Game(2026);
  assert.equal(g.message, 'Choisis un allié.');
  g.startWave();
  assert.equal(g.message, 'Vague 1 : défends le camp !');
});

test('les sept formats reconstruisent des messages familiers sans modifier les champs du camp', () => {
  const classic = JSON.parse(encodeCheckpoint(new Game(33))!);
  const { rules: _rules, ...oldMission } = createMissionRun('refuge', 33);
  const mission5 = JSON.parse(
    encodeCheckpoint(new Game(33, { tacticalRulesEnabled: false }, oldMission))!,
  );
  const mission7 = JSON.parse(
    encodeCheckpoint(new Game(33, undefined, createMissionRun('refuge', 33)))!,
  );
  for (const version of [1, 2, 3, 4, 5, 6, 7])
    for (const wave of [0, 1]) {
      const saved = {
        ...(version === 5 ? mission5 : version === 7 ? mission7 : classic),
        version,
        wave,
      };
      const g = decodeCheckpoint(JSON.stringify(saved));
      assert.ok(g, `schema ${version}, wave ${wave}`);
      assert.equal(
        g.message,
        wave ? 'Camp retrouvé ! Prépare la prochaine vague.' : 'Ton camp est prêt.',
      );
      assert.deepEqual(
        { wave: g.wave, gold: g.gold, base: g.base, rng: g.rng, hp: g.units.map((u) => u.hp) },
        {
          wave: saved.wave,
          gold: saved.gold,
          base: saved.base,
          rng: saved.rng,
          hp: saved.units.map((u: { hp: number }) => u.hp),
        },
      );
    }
});

test('les départs classiques, anciens et actuels reproduisent tous leurs états et camps avant la réécriture', () => {
  const fixture = JSON.parse(
    readFileSync(new URL('./fixtures/tutoiement-0323-replays.json', import.meta.url), 'utf8'),
  ) as { results: ReturnType<typeof replayDeparture>[] };
  for (const expected of fixture.results)
    assert.deepEqual(replayDeparture(expected.code), expected, expected.code);
});
