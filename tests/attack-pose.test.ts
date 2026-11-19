import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

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
const { ALLY_ART, ENEMY_ART, ART_SHEETS, ATTACK_SHEETS, attackArt, portraitStyle } =
  await import('../src/art.ts');
const { poseArt, attackSheetsFor, ATTACK_POSE_SECONDS } =
  await import('../src/render/attackPose.ts');
const yes = () => true,
  no = () => false;
const blow = (age: number) => ({ age, kind: 'hit' as const });

test("la pose d'attaque dure un court instant après le coup, puis l'image de repos revient", () => {
  assert.ok(ATTACK_POSE_SECONDS >= 0.16 && ATTACK_POSE_SECONDS <= 0.24);
  for (const kind of ['hero', 'club', 'shield', 'bat'] as const) {
    const idle = ALLY_ART[kind];
    assert.deepEqual(poseArt(idle, blow(0), false, yes), {
      texture: 'allies-front-attack',
      frame: idle.frame,
    });
    assert.equal(poseArt(idle, blow(ATTACK_POSE_SECONDS - 0.01), false, yes).frame, idle.frame);
    assert.equal(poseArt(idle, blow(ATTACK_POSE_SECONDS), false, yes), idle);
    assert.equal(poseArt(idle, blow(0.5), false, yes), idle);
    assert.equal(poseArt(idle, undefined, false, yes), idle);
  }
});

test('effets légers : aucune image ne change', () => {
  assert.equal(poseArt(ALLY_ART.club, blow(0.05), true, yes), ALLY_ART.club);
});

test("planche d'attaque absente ou pas arrivée : le combattant garde son image de repos", () => {
  assert.equal(poseArt(ALLY_ART.club, blow(0.05), false, no), ALLY_ART.club);
  const asked: string[] = [];
  poseArt(ALLY_ART.hero, blow(0.05), false, (texture) => (asked.push(texture), false));
  assert.deepEqual(asked, ['allies-front-attack']);
  // Les planches sans pose d'attaque ne posent même pas la question.
  for (const idle of [
    { texture: 'strongholds', frame: 0 },
    { texture: 'miels-parapluie', frame: 1 },
    { texture: 'terrain-props', frame: 2 },
  ]) {
    assert.equal(attackArt(idle), undefined);
    assert.equal(
      poseArt(idle, blow(0.05), false, () => assert.fail('aucune texture à chercher')),
      idle,
    );
  }
});

test('la même image est rendue à chaque appel : aucune allocation par image', () => {
  assert.equal(
    poseArt(ALLY_ART.bat, blow(0.01), false, yes),
    poseArt(ALLY_ART.bat, blow(0.12), false, yes),
  );
});

test("une planche d'attaque a les cases de sa planche de repos", () => {
  assert.deepEqual(
    ATTACK_SHEETS.map((sheet) => [sheet.key, sheet.base]),
    [
      ['allies-front-attack', 'allies-front'],
      ['allies-support-attack', 'allies-support'],
      ['allies-elite-attack', 'allies-elite'],
      ['allies-creatures-attack', 'allies-creatures'],
      ['enemies-organic-attack', 'enemies-organic'],
      ['enemies-mechanical-attack', 'enemies-mechanical'],
      ['allies-dinosaurs-attack', 'allies-dinosaurs'],
      ['allies-spinosaure-attack', 'allies-spinosaure'],
      ['serpents-family-attack', 'serpents-family'],
      ['allies-mutants-attack', 'allies-mutants'],
      ['serpents-nouveaux-attack', 'serpents-nouveaux'],
    ],
  );
  // Chaque personnage et chaque serpent a sa pose ; les décors et les objets n'en ont pas.
  for (const idle of [ALLY_ART.archer, ALLY_ART.trex, ALLY_ART.mutantRock, ENEMY_ART.normal])
    assert.equal(attackArt(idle)?.frame, idle.frame);
  for (const sheet of ATTACK_SHEETS) {
    const base = ART_SHEETS.find((candidate) => candidate.key === sheet.base)!;
    assert.equal(sheet.frameWidth, base.frameWidth);
    assert.equal(sheet.frameHeight, base.frameHeight);
    assert.notEqual(sheet.url, base.url);
    assert.ok(!ART_SHEETS.some((candidate) => candidate.key === sheet.key));
  }
});

test("la planche d'attaque suit sa planche de repos, sans téléchargement inutile", () => {
  const front = new Set(['allies-front', 'strongholds']);
  // Repos pas encore arrivé : on ne demande rien, le jeu n'attend que le repos.
  assert.deepEqual(attackSheetsFor(front, no), []);
  assert.deepEqual(
    attackSheetsFor(front, (key) => key === 'allies-front').map((sheet) => sheet.key),
    ['allies-front-attack'],
  );
  // Déjà chargée : rien n'est redemandé.
  assert.deepEqual(attackSheetsFor(front, yes), []);
  // Une mission qui n'a pas besoin de la planche ne télécharge rien.
  assert.deepEqual(
    attackSheetsFor(new Set(['strongholds', 'miels-parapluie']), (key) => !key.endsWith('-attack')),
    [],
  );
  assert.deepEqual(
    attackSheetsFor(
      new Set(['allies-support', 'allies-elite']),
      (key) => !key.endsWith('-attack'),
    ).map((sheet) => sheet.key),
    ['allies-support-attack', 'allies-elite-attack'],
  );
});

test('les combattants du plateau et la vague qui vient passent avant les recrues possibles', () => {
  const keys = new Set(['allies-front', 'allies-support', 'allies-dinosaurs', 'enemies-organic']);
  const base = (key: string) => !key.endsWith('-attack');
  const order = (first?: Set<string>) =>
    attackSheetsFor(keys, base, first).map((sheet) => sheet.key);
  // Sans priorité : l'ordre des planches.
  assert.deepEqual(order(), [
    'allies-front-attack',
    'allies-support-attack',
    'enemies-organic-attack',
    'allies-dinosaurs-attack',
  ]);
  // Le héros et les massues sont posés, des serpents ordinaires arrivent : eux d'abord.
  assert.deepEqual(order(new Set(['allies-front', 'enemies-organic'])), [
    'allies-front-attack',
    'enemies-organic-attack',
    'allies-support-attack',
    'allies-dinosaurs-attack',
  ]);
  // La priorité ne fait rien télécharger de plus, ni avant la planche de repos.
  assert.deepEqual(
    attackSheetsFor(
      new Set(['allies-front']),
      base,
      new Set(['enemies-organic', 'serpents-family']),
    ).map((sheet) => sheet.key),
    ['allies-front-attack'],
  );
  assert.deepEqual(attackSheetsFor(keys, no, new Set(['allies-front'])), []);
});

test('les portraits du dock gardent la planche de repos', () => {
  for (const kind of ['hero', 'club', 'shield', 'bat'] as const)
    assert.doesNotMatch(portraitStyle(kind), /attack/);
});

test('le combattant garde le côté de son coup jusqu’à la fin du geste', async () => {
  const { blowFacing, SWING_SECONDS, characterMotion } =
    await import('../src/render/characterMotion.ts');
  // Les règles l'ont déjà retourné vers la gauche ; le coup, lui, est parti à droite.
  assert.equal(blowFacing(-1, { age: 0.05, kind: 'hit', facing: 1 }), 1);
  assert.equal(blowFacing(-1, { age: SWING_SECONDS - 0.01, kind: 'hit', facing: 1 }), 1);
  // Le geste fini, ou sans côté connu, il suit de nouveau les règles.
  assert.equal(blowFacing(-1, { age: SWING_SECONDS, kind: 'hit', facing: 1 }), -1);
  assert.equal(blowFacing(-1, { age: 0.05, kind: 'hit' }), -1);
  assert.equal(blowFacing(1, undefined), 1);
  // L'élan part du côté du coup, pas du côté où les règles l'ont retourné.
  const { Game } = await import('../src/game.ts');
  const game = new Game();
  const club = game.units.find((unit) => unit.kind === 'club')!;
  club.facing = -1;
  const towardBlow = characterMotion(club, 0, { age: 0.2, kind: 'hit', facing: 1 }, false);
  const withoutSide = characterMotion(club, 0, { age: 0.2, kind: 'hit' }, false);
  assert.ok(towardBlow.dx > 0, 'élan vers la droite');
  assert.ok(withoutSide.dx < 0, 'sans côté connu, élan du côté des règles');
});

test('la présentation note le côté du coup à partir de l’effet, pas de l’orientation', async () => {
  const { Presentation } = await import('../src/render/presentation.ts');
  const { Game } = await import('../src/game.ts');
  const game = new Game(),
    presentation = new Presentation();
  presentation.update(game, 16);
  const club = game.units.find((unit) => unit.kind === 'club')!;
  club.facing = -1;
  game.effects.push({
    sourceId: club.id,
    x: club.x,
    y: club.y,
    tx: club.x + 30,
    ty: club.y,
    kind: 'hit',
    life: 0.2,
  });
  presentation.update(game, 16);
  assert.equal(presentation.actions.get(club.id)?.facing, 1);
  game.effects.push({
    sourceId: club.id,
    x: club.x,
    y: club.y,
    tx: club.x - 30,
    ty: club.y,
    kind: 'hit',
    life: 0.2,
  });
  presentation.update(game, 16);
  assert.equal(presentation.actions.get(club.id)?.facing, -1);
  // Un blocage vise l'allié protégé : il ne retourne pas le bouclier vers lui.
  game.effects.push({
    sourceId: club.id,
    x: club.x,
    y: club.y,
    tx: club.x + 30,
    ty: club.y,
    kind: 'block',
    life: 0.2,
  });
  presentation.update(game, 16);
  assert.equal(presentation.actions.get(club.id)?.facing, undefined);
});
