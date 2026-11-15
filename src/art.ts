import floodUrl from './assets/illustrated/scenery-flood.webp';
import marshUrl from './assets/illustrated/scenery-marsh.webp';
import frontUrl from './assets/illustrated/allies-front.webp';
import frontAttackUrl from './assets/illustrated/allies-front-attack.webp';
import supportUrl from './assets/illustrated/allies-support.webp';
import supportAttackUrl from './assets/illustrated/allies-support-attack.webp';
import eliteUrl from './assets/illustrated/allies-elite.webp';
import eliteAttackUrl from './assets/illustrated/allies-elite-attack.webp';
import creaturesUrl from './assets/illustrated/allies-creatures.webp';
import creaturesAttackUrl from './assets/illustrated/allies-creatures-attack.webp';
import organicUrl from './assets/illustrated/enemies-organic.webp';
import organicAttackUrl from './assets/illustrated/enemies-organic-attack.webp';
import mechanicalUrl from './assets/illustrated/enemies-mechanical.webp';
import mechanicalAttackUrl from './assets/illustrated/enemies-mechanical-attack.webp';
import propsUrl from './assets/illustrated/terrain-props.webp';
import uiUrl from './assets/illustrated/interface-craft.webp';
import groundUrl from './assets/illustrated/ground-three-bridges.webp';
import groveUrl from './assets/illustrated/ground-grove-refined.webp';
import ruinsUrl from './assets/illustrated/ground-ruins-refined.webp';
import strongholdsUrl from './assets/illustrated/strongholds.webp';
import tacticsUrl from './assets/illustrated/miels-parapluie.webp';
import dinosaursUrl from './assets/illustrated/allies-dinosaurs.webp';
import dinosaursAttackUrl from './assets/illustrated/allies-dinosaurs-attack.webp';
import serpentsUrl from './assets/illustrated/serpents-family.webp';
import serpentsAttackUrl from './assets/illustrated/serpents-family-attack.webp';
import mutantsUrl from './assets/illustrated/allies-mutants.webp';
import mutantsAttackUrl from './assets/illustrated/allies-mutants-attack.webp';
import threeBridgesPropsUrl from './assets/illustrated/props-three-bridges.webp';
import type { Kind } from './data.ts';
import type { EnemyKind } from './enemies.ts';
export type ArtFrame = { texture: string; frame: number };
/**
 * `attackUrl` is optional: a second sheet with the same cells and the same geometry,
 * shown for an instant when a fighter strikes. A sheet without it keeps its idle image.
 */
export const ART_SHEETS = [
  {
    key: 'allies-front',
    url: frontUrl,
    frameWidth: 512,
    frameHeight: 512,
    attackUrl: frontAttackUrl,
  },
  {
    key: 'allies-support',
    url: supportUrl,
    frameWidth: 512,
    frameHeight: 512,
    attackUrl: supportAttackUrl,
  },
  {
    key: 'allies-elite',
    url: eliteUrl,
    frameWidth: 512,
    frameHeight: 512,
    attackUrl: eliteAttackUrl,
  },
  {
    key: 'allies-creatures',
    url: creaturesUrl,
    frameWidth: 512,
    frameHeight: 512,
    attackUrl: creaturesAttackUrl,
  },
  {
    key: 'enemies-organic',
    url: organicUrl,
    frameWidth: 512,
    frameHeight: 512,
    attackUrl: organicAttackUrl,
  },
  {
    key: 'enemies-mechanical',
    url: mechanicalUrl,
    frameWidth: 512,
    frameHeight: 512,
    attackUrl: mechanicalAttackUrl,
  },
  { key: 'terrain-props', url: propsUrl, frameWidth: 512, frameHeight: 512 },
  { key: 'interface-craft', url: uiUrl, frameWidth: 512, frameHeight: 512 },
  { key: 'strongholds', url: strongholdsUrl, frameWidth: 512, frameHeight: 512 },
  { key: 'miels-parapluie', url: tacticsUrl, frameWidth: 512, frameHeight: 512 },
  {
    key: 'allies-dinosaurs',
    url: dinosaursUrl,
    frameWidth: 512,
    frameHeight: 512,
    attackUrl: dinosaursAttackUrl,
  },
  {
    key: 'serpents-family',
    url: serpentsUrl,
    frameWidth: 512,
    frameHeight: 512,
    attackUrl: serpentsAttackUrl,
  },
  // Two taller figures occupy the upper row; the unused lower icons stay outside frames.
  {
    key: 'allies-mutants',
    url: mutantsUrl,
    frameWidth: 512,
    frameHeight: 600,
    attackUrl: mutantsAttackUrl,
  },
  { key: 'props-three-bridges', url: threeBridgesPropsUrl, frameWidth: 512, frameHeight: 512 },
] as const;
export type SheetKey = (typeof ART_SHEETS)[number]['key'];
/**
 * The sheets that the code names outside this file. A key retyped elsewhere and gone astray
 * would load nothing and say nothing: these names do not compile if the sheet is not above.
 */
export const SHEET = {
  alliesFront: 'allies-front',
  enemiesOrganic: 'enemies-organic',
  enemiesMechanical: 'enemies-mechanical',
  strongholds: 'strongholds',
  honeyAndUmbrella: 'miels-parapluie',
  threeBridgesProps: 'props-three-bridges',
} as const satisfies Record<string, SheetKey>;
/** Where the browser finds a sheet. */
export const sheetUrl = (key: SheetKey): string =>
  ART_SHEETS.find((sheet) => sheet.key === key)!.url;
/** Attack sheets, loaded with their base sheet under the key `<base>-attack`. */
export const ATTACK_SHEETS = ART_SHEETS.flatMap((sheet) =>
  'attackUrl' in sheet
    ? [
        {
          key: `${sheet.key}-attack`,
          base: sheet.key as string,
          url: sheet.attackUrl,
          frameWidth: sheet.frameWidth,
          frameHeight: sheet.frameHeight,
        },
      ]
    : [],
);
const attackFrames = new Map<string, ArtFrame[]>(
  ATTACK_SHEETS.map((sheet) => [
    sheet.base,
    [0, 1, 2, 3].map((index) => ({ texture: sheet.key, frame: index })),
  ]),
);
/** Same cell on the attack sheet, if its atlas declares one. Shared objects: no allocation. */
export function attackArt(art: ArtFrame): ArtFrame | undefined {
  return attackFrames.get(art.texture)?.[art.frame];
}
export const GROUND_ART = [
  { key: 'ground-clearing', url: groundUrl },
  { key: 'ground-grove', url: groveUrl },
  { key: 'ground-ruins', url: ruinsUrl },
] as const;
export const SCENERY_ART = [
  { key: 'scenery-flood', url: floodUrl },
  { key: 'scenery-marsh', url: marshUrl },
] as const;
export const UI_ART_URL = uiUrl;
const frame = (texture: SheetKey, frame: number): ArtFrame => ({ texture, frame });
export const ALLY_ART: Record<Kind, ArtFrame> = {
  hero: frame('allies-front', 0),
  club: frame('allies-front', 1),
  shield: frame('allies-front', 2),
  bat: frame('allies-front', 3),
  archer: frame('allies-support', 0),
  nurse: frame('allies-support', 1),
  medic: frame('allies-support', 2),
  ninja: frame('allies-support', 3),
  knight: frame('allies-elite', 0),
  cavalry: frame('allies-elite', 1),
  twohead: frame('allies-elite', 2),
  tank: frame('allies-elite', 3),
  dragon: frame('allies-creatures', 0),
  dino: frame('allies-creatures', 1),
  wall: frame('allies-creatures', 2),
  raptor: frame('allies-dinosaurs', 0),
  triceratops: frame('allies-dinosaurs', 1),
  stegosaurus: frame('allies-dinosaurs', 2),
  trex: frame('allies-dinosaurs', 3),
  mutantRock: frame('allies-mutants', 0),
  mutantStretch: frame('allies-mutants', 1),
};
export const ENEMY_ART: Record<EnemyKind, ArtFrame> = {
  normal: frame('enemies-organic', 0),
  flying: frame('enemies-organic', 0),
  courtHealer: frame('enemies-organic', 0),
  runner: frame('enemies-organic', 1),
  armored: frame('enemies-organic', 2),
  spitter: frame('enemies-organic', 3),
  clockwork: frame('enemies-mechanical', 1),
  spring: frame('enemies-mechanical', 2),
  umbrella: frame('miels-parapluie', 0),
  rattlesnake: frame('serpents-family', 0),
  royal: frame('serpents-family', 1),
  mamba: frame('serpents-family', 2),
};
export const KING_ART = frame('serpents-family', 3);
export const EGG_ART = frame('enemies-mechanical', 3);
export const HONEY_ART = frame('miels-parapluie', 2);
export const HONEY_STICKY_ART = frame('miels-parapluie', 3);
export const UMBRELLA_CLOSED_ART = frame('miels-parapluie', 1);
/** Inline style that shows one cell of a 2 × 2 sheet as the background of an element. */
function cellStyle(art: ArtFrame): string {
  const sheet = ART_SHEETS.find((s) => s.key === art.texture)!;
  return `background-image:url("${sheet.url}");background-size:200% ${(1024 / sheet.frameHeight) * 100}%;background-repeat:no-repeat;background-position:${art.frame % 2 ? 100 : 0}% ${art.frame >= 2 ? 100 : 0}%`;
}
export function portraitStyle(kind: Kind): string {
  return cellStyle(ALLY_ART[kind]);
}

/** Same atlas crops as actors; flying/healer portraits get a capability badge in UI. */
export function enemyPortraitStyle(kind: EnemyKind | 'king' | 'egg'): string {
  return cellStyle(kind === 'king' ? KING_ART : kind === 'egg' ? EGG_ART : ENEMY_ART[kind]);
}
