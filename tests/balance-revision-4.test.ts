import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import {
  BALANCE_REVISIONS,
  CURRENT_BALANCE_REVISION,
  balanceRecruitPrice,
  lateEggRule,
} from '../src/balanceRevision.ts';
import { decodeCheckpoint, encodeCheckpoint } from '../src/checkpoints.ts';
import { checkDigits } from '../src/codeText.ts';
import { kinds, waveStats } from '../src/data.ts';
import type { Kind } from '../src/data.ts';
import { decodeDeparture, departureForGame, encodeDeparture } from '../src/departures.ts';
import { enemies } from '../src/enemies.ts';
import type { EnemyKind } from '../src/enemies.ts';
import { NINJA_DODGES, RARE_BITE, biteDamage, dodgesOf } from '../src/enemyAbilities.ts';
import { damageAlly, hitEnemy } from '../src/engine/damage.ts';
import { readFamilyBackup, writeFamilyBackup } from '../src/familyBackup.ts';
import { Game } from '../src/game.ts';
import { TOTAL_WAVES } from '../src/gameConstants.ts';
import { createMissionProgress } from '../src/missionProgress.ts';
import { MISSIONS, createMissionRun, missionWave } from '../src/missions.ts';
import { createCareer } from '../src/progression.ts';
import { createCapriceAlbumsController } from '../src/capriceAlbums.ts';
import { english } from '../src/i18n/english.ts';
import { NEWCOMERS, variantFor } from '../src/waves.ts';
import { snakeEntries } from '../src/ui/snakeIndex/snakeEntries.ts';
import { THREAT_DETAILS, threatAdvice, waveThreats } from '../src/ui/threatPreview.ts';
import * as BOARD from '../src/texts/fr/board.ts';

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

// Fourth balance revision, 16 November 2026: three snakes imagined by the child (big fangs, a
// very rare and fragile one that fells a club fighter in one bite, a ninja). The parent chose
// what the ninja does (it dodges) and accepted an expert winning about one game in two.
// Every number below is retyped on purpose.
const NEW: readonly EnemyKind[] = ['fang', 'rare', 'shadow'];
const classic = (revision: 1 | 2 | 3 | 4, seed = 7) =>
  new Game(seed, undefined, undefined, revision);

test('la révision 4 garde les prix et l’œuf de la révision 3', () => {
  assert.ok(BALANCE_REVISIONS.includes(4));
  // The fifth revision (18 November) follows it: tests/balance-revision-5.test.ts.
  assert.ok(CURRENT_BALANCE_REVISION >= 4);
  for (const kind of Object.keys(kinds) as Kind[])
    assert.equal(balanceRecruitPrice(kind, 4), balanceRecruitPrice(kind, 3), kind);
  assert.deepEqual(lateEggRule(4), lateEggRule(3));
  assert.equal(classic(4).balanceRevision, 4);
  assert.throws(() => new Game(7, undefined, createMissionRun('refuge', 7, undefined, 2), 4));
});

test('les trois nouveaux ont les valeurs convenues', () => {
  const { fang, rare, shadow } = enemies;
  assert.deepEqual([fang.hp, fang.speed, fang.damage], [1, 0.85, 2]);
  assert.deepEqual([rare.hp, rare.speed, rare.damage], [0.3, 1.1, 1]);
  assert.deepEqual([shadow.hp, shadow.speed, shadow.damage], [0.8, 1.4, 0.9]);
  assert.equal(RARE_BITE, 140);
  assert.equal(RARE_BITE, kinds.club.hp, 'une morsure vaut toute la vie d’une Massue');
  assert.equal(NINJA_DODGES, 1);
  assert.deepEqual(
    { ...NEWCOMERS },
    {
      ninja: { place: 10, fromWave: 6 },
      fang: { place: 13, fromWave: 8 },
      rare: { place: 14, waves: [8, 11] },
      grasshopper: { place: 9, fromWave: 7, revision: 6 },
    },
  );
});

test('avant la révision 4, aucune vague ne change ; après, seuls des serpents simples cèdent leur place', () => {
  const met: Record<string, number[]> = { fang: [], rare: [], shadow: [] };
  for (let wave = 1; wave <= TOTAL_WAVES; wave++)
    for (let place = waveStats(wave).count; place >= 1; place--) {
      const before = variantFor(wave, place);
      for (const revision of [1, 2, 3] as const)
        assert.equal(variantFor(wave, place, revision), before, `vague ${wave}, place ${place}`);
      const now = variantFor(wave, place, 4);
      if (now === before) continue;
      assert.ok(NEW.includes(now), now);
      assert.ok(['normal', 'runner', 'armored'].includes(before), `${before} garde sa place`);
      met[now].push(wave);
    }
  assert.deepEqual(met.shadow, [6, 7, 8, 9, 10, 11, 12], 'un ninja par vague dès la vague 6');
  assert.deepEqual(met.fang, [8, 9, 10, 11, 12], 'des grands crocs par vague dès la vague 8');
  assert.deepEqual(met.rare, [8, 11], 'le serpent rare vient deux fois');
});

test('les missions et le voyage ne reçoivent aucun nouveau serpent', () => {
  for (const mission of MISSIONS) {
    const run = createMissionRun(mission.id, 4242, undefined, 2);
    for (let local = 1; local <= mission.waves.length; local++)
      for (const kind of missionWave(run, local).composition)
        assert.ok(!NEW.includes(kind), `${mission.id} vague ${local} : ${kind}`);
  }
});

/** Plays a wave of the fourth revision until a snake of this kind is on the board. */
function meet(kind: EnemyKind, wave: number): { game: Game; snake: Game['enemies'][number] } {
  const game = classic(4, 31);
  game.wave = wave - 1;
  game.gold = 20000;
  game.normalizeCamp();
  assert.ok(game.startWave());
  for (let step = 0; step < 30 * 60; step++) {
    game.step(1 / 30);
    const snake = game.enemies.find((e) => e.variant === kind && e.hp > 0);
    if (snake) return { game, snake };
  }
  throw new Error(`aucun ${kind} dans la vague ${wave}`);
}

test('le serpent ninja esquive le premier coup, pas le suivant', () => {
  assert.equal(dodgesOf('shadow'), 1);
  for (const kind of Object.keys(enemies) as EnemyKind[])
    if (kind !== 'shadow') assert.equal(dodgesOf(kind), 0, kind);
  const { game, snake } = meet('shadow', 6);
  const hero = game.units.find((u) => u.kind === 'hero')!;
  const full = snake.hp;
  assert.equal(snake.dodges, 1);
  hitEnemy(game, hero, snake, 10);
  assert.equal(snake.hp, full, 'le premier coup le rate');
  assert.equal(snake.dodges, 0);
  hitEnemy(game, hero, snake, 10);
  assert.equal(snake.hp, full - 10, 'le second le touche');
});

test('le plateau dit « Esquive ! » quand le ninja laisse passer un coup', async () => {
  const { Presentation } = await import('../src/render/presentation.ts');
  const { game, snake } = meet('shadow', 6);
  const board = new Presentation();
  board.update(game, 16);
  board.update(game, 16);
  assert.ok(!board.floats.some((f) => f.text === BOARD.esquive));
  hitEnemy(
    game,
    game.units.find((u) => u.kind === 'hero')!,
    snake,
    10,
  );
  board.update(game, 16);
  assert.ok(board.floats.some((f) => f.text === BOARD.esquive));
  assert.equal(english[BOARD.esquive], 'Dodge!');
});

test('une morsure du serpent rare fait tomber une Massue en pleine forme', () => {
  assert.equal(biteDamage('rare', 12), 140, 'au moins la vie d’une Massue');
  assert.equal(biteDamage('rare', 200), 200, 'jamais moins que la morsure de la vague');
  assert.equal(biteDamage('fang', 10), 20);
  assert.equal(biteDamage('normal', 10), 10);
  const { game, snake } = meet('rare', 8);
  assert.ok(snake.maxHp < waveStats(8).hp * 0.5, 'il est très fragile');
  const club = game.units.find((u) => u.kind === 'club')!;
  assert.equal(club.hp, 140);
  damageAlly(game, snake, club, biteDamage('rare', waveStats(8).damage), false);
  assert.ok(club.hp <= 0, 'la Massue tombe');
  // A sturdier ally survives the same bite.
  assert.ok(game.recruit('knight', 912, 408));
  const knight = game.units.find((u) => u.kind === 'knight')!;
  damageAlly(game, snake, knight, biteDamage('rare', waveStats(8).damage), false);
  assert.ok(knight.hp > 0);
});

test('« Dangers » et l’index montrent les trois nouveaux, avec leur vague', () => {
  const kindsAt = (game: Game, wave: number) => waveThreats(game, wave).entries.map((e) => e.kind);
  assert.ok(kindsAt(classic(4), 6).includes('shadow'));
  for (const kind of NEW) assert.ok(kindsAt(classic(4), 8).includes(kind), kind);
  for (const kind of NEW) assert.ok(!kindsAt(classic(3), 8).includes(kind), kind);
  const first = new Map(snakeEntries().map((entry) => [entry.kind, entry.firstWave]));
  assert.deepEqual([first.get('shadow'), first.get('fang'), first.get('rare')], [6, 8, 8]);
  assert.deepEqual(
    NEW.map((kind) => THREAT_DETAILS[kind].name),
    ['Grands crocs', 'Serpent rare', 'Serpent ninja'],
  );
  for (const kind of NEW) {
    assert.ok(english[THREAT_DETAILS[kind].name], kind);
    assert.ok(english[THREAT_DETAILS[kind].ability], kind);
  }
  assert.equal(threatAdvice(['rare'], () => true).kind, 'archer');
  assert.equal(threatAdvice(['fang'], () => true).kind, 'shield');
});

test('les trois nouveaux ont chacun une image provisoire, au repos et à l’attaque', async () => {
  const { ENEMY_ART, ART_SHEETS, attackArt, enemyPortraitStyle } = await import('../src/art.ts');
  const frames = NEW.map((kind) => ENEMY_ART[kind]);
  assert.deepEqual(
    frames.map((art) => [art.texture, art.frame]),
    [
      ['serpents-nouveaux', 0],
      ['serpents-nouveaux', 1],
      ['serpents-nouveaux', 2],
    ],
  );
  assert.ok(ART_SHEETS.some((sheet) => sheet.key === 'serpents-nouveaux'));
  for (const [index, kind] of NEW.entries()) {
    assert.equal(attackArt(frames[index])?.texture, 'serpents-nouveaux-attack', kind);
    assert.match(enemyPortraitStyle(kind), /serpents-nouveaux\.webp/);
  }
});

test('un camp de la révision 4 s’écrit en version 11 ; la version 10 reste la révision 3', () => {
  const game = classic(4, 2026);
  game.initialSeed = 2026;
  const raw = encodeCheckpoint(game);
  assert.ok(raw);
  const saved = JSON.parse(raw);
  assert.equal(saved.version, 11);
  assert.equal(saved.balance, 4);
  const back = decodeCheckpoint(raw);
  assert.ok(back);
  assert.equal(back.balanceRevision, 4);
  assert.equal(encodeCheckpoint(back), raw);
  for (const wrong of [
    { ...saved, balance: 3 },
    { ...saved, version: 10 },
    { ...saved, version: 12 },
    { ...saved, mission: createMissionRun('refuge', 7, undefined, 2) },
  ])
    assert.equal(decodeCheckpoint(JSON.stringify(wrong)), null);
  const third = classic(3, 2026);
  third.initialSeed = 2026;
  assert.equal(JSON.parse(encodeCheckpoint(third)!).version, 10);
  assert.equal(decodeCheckpoint(encodeCheckpoint(third)!)!.balanceRevision, 3);
});

test('le code de départ de la révision 4 porte la règle 6, pour la grande aventure seulement', () => {
  const code = encodeDeparture({ kind: 'classic', seed: 2026, balance: 4 });
  assert.match(code, /^AVENTURE-6-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{2}$/);
  const decoded = decodeDeparture(code);
  assert.ok(decoded.ok);
  assert.deepEqual({ ...decoded.departure }, { kind: 'classic', seed: 2026, balance: 4 });
  assert.match(encodeDeparture({ kind: 'classic', seed: 2026, balance: 3 }), /^AVENTURE-5-/);
  const game = classic(4, 2026);
  game.initialSeed = 2026;
  assert.equal(encodeDeparture(departureForGame(game)!), code);
  const mission = encodeDeparture({ kind: 'mission', run: createMissionRun('trois-ponts', 7) });
  const [word, , a, b] = mission.split('-');
  const forged = `${word}-6-${a}-${b}-${checkDigits(`${word}-6-${a}${b}`)}`;
  assert.deepEqual(decodeDeparture(forged), { ok: false, reason: 'setup' });
  assert.deepEqual(decodeDeparture(code.replace('-6-', '-0-')), { ok: false, reason: 'version' });
});

test('la sauvegarde familiale emporte un camp de la révision 4', () => {
  const game = classic(4, 2026);
  game.initialSeed = 2026;
  const raw = writeFamilyBackup(
    encodeCheckpoint(game)!,
    createCareer().state,
    createMissionProgress(),
    createCapriceAlbumsController().state,
  );
  assert.ok(raw);
  const read = readFamilyBackup(raw);
  assert.ok(read);
  assert.equal(read.version, 5);
  assert.equal(decodeCheckpoint(read.camp!)!.balanceRevision, 4);
});
