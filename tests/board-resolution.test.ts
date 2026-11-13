import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  MAX_BOARD_SCALE,
  boardPixelsFor,
  boardPoint,
  boardScale,
  createFrameGovernor,
  terrainScale,
} from '../src/render/boardResolution.ts';
import { preparedPixels, rimLayout } from '../src/render/figurineLayout.ts';

type Scene = Parameters<typeof boardScale>[0];
const scene = (width: number) => ({ scale: { width } }) as unknown as Scene;

test('le canvas prend les pixels de l’écran, sans dépasser deux fois le plateau', () => {
  assert.equal(BOARD_WIDTH, 1100);
  assert.equal(BOARD_HEIGHT, 620);
  // Ordinateur 1280×800 : le plateau est montré sur 1066 px, le canvas en a 1066.
  assert.equal(boardPixelsFor(1066, 1, false), 1066);
  // Téléphone 812×375 à trois pixels par point : 580 px CSS, 1740 px réels.
  assert.equal(boardPixelsFor(580, 3, false), 1740);
  // Grand écran très dense : plafonné.
  assert.equal(boardPixelsFor(1600, 2, false), BOARD_WIDTH * MAX_BOARD_SCALE);
  // Vignette : jamais moins d'un demi-plateau.
  assert.equal(boardPixelsFor(200, 1, false), 550);
  // Plateau caché ou mesure absente : on garde le plateau simple.
  for (const [css, ratio] of [
    [0, 2],
    [NaN, 2],
    [800, 0],
    [800, NaN],
  ])
    assert.equal(boardPixelsFor(css, ratio, false), BOARD_WIDTH);
});

test('« Effets légers » ne dépasse jamais le plateau simple', () => {
  assert.equal(boardPixelsFor(580, 3, true), 1100);
  assert.equal(boardPixelsFor(1600, 2, true), 1100);
  // Montré plus petit que 1100 px : inutile de dessiner plus que l'écran, même en léger.
  assert.equal(boardPixelsFor(900, 1, true), 900);
});

test('le plafond mesuré par le régulateur borne la taille', () => {
  assert.equal(boardPixelsFor(580, 3, false, 1.2), 1320);
  assert.equal(boardPixelsFor(580, 3, false, 1), 1100);
  // Un plafond aberrant ne fait ni grossir ni rétrécir le plateau au-delà des bornes.
  assert.equal(boardPixelsFor(580, 3, false, 9), 1740);
  assert.equal(boardPixelsFor(2000, 3, false, 9), 2200);
  assert.equal(boardPixelsFor(580, 3, false, 0.2), 1100);
});

test('les coordonnées restent celles du plateau, quelle que soit la taille du canvas', () => {
  assert.equal(boardScale(scene(1100)), 1);
  assert.equal(boardScale(scene(1650)), 1.5);
  assert.deepEqual(boardPoint(scene(1100), { x: 900, y: 350 }), { x: 900, y: 350 });
  assert.deepEqual(boardPoint(scene(1650), { x: 1350, y: 525 }), { x: 900, y: 350 });
  assert.deepEqual(boardPoint(scene(2200), { x: 2200, y: 1240 }), { x: 1100, y: 620 });
});

const seconds = (
  governor: ReturnType<typeof createFrameGovernor>,
  count: number,
  ms: number,
  s: number,
) => {
  let cap = governor.cap;
  for (let i = 0; i < Math.ceil((count * 1000) / ms); i++) cap = governor.frame(ms, s);
  return cap;
};

test('régulateur : un appareil fluide garde toute la netteté', () => {
  const governor = createFrameGovernor();
  assert.equal(seconds(governor, 30, 16.7, 1.58), 2);
  // Deux secondes lentes puis une fluide : pas de baisse.
  seconds(governor, 2, 40, 1.58);
  seconds(governor, 1, 16.7, 1.58);
  assert.equal(seconds(governor, 2, 40, 1.58), 2);
});

test('régulateur : trois secondes lentes font essayer plus petit, et on garde si cela aide', () => {
  const governor = createFrameGovernor();
  const cap = seconds(governor, 3.1, 40, 1.58);
  assert.ok(Math.abs(cap - 1.08) < 1e-9, `plafond ${cap}`);
  // Plus petit, l'appareil suit : le plafond reste, pour toute la session.
  seconds(governor, 4, 18, 1.08);
  assert.ok(Math.abs(governor.cap - 1.08) < 1e-9);
  assert.ok(Math.abs(seconds(governor, 60, 16.7, 1.08) - 1.08) < 1e-9);
});

test('régulateur : si plus petit ne va pas plus vite, la netteté revient et ne bouge plus', () => {
  const governor = createFrameGovernor();
  // Économie d'énergie à 30 images par seconde : la taille du canvas n'y est pour rien.
  seconds(governor, 3.1, 33.3, 1.58);
  assert.ok(governor.cap < 2);
  seconds(governor, 3.2, 33.3, 1.08);
  assert.equal(governor.cap, 2);
  assert.equal(seconds(governor, 120, 33.3, 1.58), 2);
});

test('régulateur : le plateau simple, un onglet caché et une pause ne comptent pas', () => {
  const governor = createFrameGovernor();
  assert.equal(seconds(governor, 10, 40, 1), 2);
  assert.equal(seconds(governor, 10, 400, 1.58), 2);
  for (const delta of [0, -5, NaN]) assert.equal(governor.frame(delta, 1.58), 2);
  // Jamais sous le plateau simple.
  const low = createFrameGovernor();
  seconds(low, 3.1, 40, 1.2);
  assert.equal(low.cap, 1);
});

test('une figurine est préparée à deux fois sa taille d’écran, jamais plus que sa source', () => {
  // 72 unités sur un canvas à 1 px par unité : 144 px ; à 1,58 : 228 px (pas de 4).
  assert.equal(preparedPixels(72, 1, 512), 144);
  assert.equal(preparedPixels(72, 1.58, 512), 228);
  // Le roi à trois têtes sur un grand écran : la case entière, pas d'agrandissement.
  assert.equal(preparedPixels(132, 2, 512), 512);
  assert.equal(preparedPixels(72, 1, 100), 100);
});

test('le liseré reste collé au personnage : même point sous les pieds', () => {
  for (const [width, height, reach] of [
    [144, 144, 3],
    [228, 228, 4.75],
    [512, 600, 13.2],
  ]) {
    const layout = rimLayout(width, height, reach, 0.5, 0.82);
    assert.ok(layout.pad >= reach + 2, 'le liseré a la place de s’étendre');
    assert.equal(layout.fullWidth, width + layout.pad * 2);
    assert.equal(layout.fullHeight, height + layout.pad * 2);
    // Le point d'origine du liseré, en pixels, est celui du corps décalé de la marge.
    assert.ok(Math.abs(layout.originX * layout.fullWidth - (layout.pad + width * 0.5)) < 1e-9);
    assert.ok(Math.abs(layout.originY * layout.fullHeight - (layout.pad + height * 0.82)) < 1e-9);
    // Affiché à scaleX × la largeur du corps, un pixel du liseré couvre un pixel du corps.
    assert.ok(Math.abs(layout.scaleX * width - layout.fullWidth) < 1e-9);
    assert.ok(Math.abs(layout.scaleY * height - layout.fullHeight) < 1e-9);
    assert.equal(layout.originX, 0.5);
  }
});

test('le décor est mis en cache deux fois plus fin que le plateau, sauf en léger et en Canvas', () => {
  assert.equal(terrainScale(1, false, true, 8192), 2);
  assert.equal(terrainScale(0.97, false, true, 8192), 2);
  assert.equal(terrainScale(1.58, false, true, 8192), 2);
  assert.equal(terrainScale(2, false, true, 8192), 2);
  // « Effets légers » : le cache a la taille du canvas, comme avant.
  assert.equal(terrainScale(1, true, true, 8192), 1);
  // Rendu Canvas : ses tracés sont déjà lissés, un grand cache coûterait à chaque image.
  assert.equal(terrainScale(1.5, false, false, Infinity), 1.5);
  // Carte graphique limitée à 2048 px : on reste à la taille du canvas.
  assert.equal(terrainScale(1, false, true, 2048), 1);
});
