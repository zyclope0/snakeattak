import floodUrl from './assets/illustrated/scenery-flood.webp';
import marshUrl from './assets/illustrated/scenery-marsh.webp';
import frontUrl from './assets/illustrated/allies-front.webp';
import supportUrl from './assets/illustrated/allies-support.webp';
import eliteUrl from './assets/illustrated/allies-elite.webp';
import creaturesUrl from './assets/illustrated/allies-creatures.webp';
import organicUrl from './assets/illustrated/enemies-organic.webp';
import mechanicalUrl from './assets/illustrated/enemies-mechanical.webp';
import propsUrl from './assets/illustrated/terrain-props.webp';
import uiUrl from './assets/illustrated/interface-craft.webp';
import groundUrl from './assets/illustrated/ground-three-bridges.webp';
import groveUrl from './assets/illustrated/ground-grove-refined.webp';
import ruinsUrl from './assets/illustrated/ground-ruins-refined.webp';
import strongholdsUrl from './assets/illustrated/strongholds.webp';
import tacticsUrl from './assets/illustrated/miels-parapluie.webp';
import dinosaursUrl from './assets/illustrated/allies-dinosaurs.webp';
import serpentsUrl from './assets/illustrated/serpents-family.webp';
import mutantsUrl from './assets/illustrated/allies-mutants.webp';
import threeBridgesPropsUrl from './assets/illustrated/props-three-bridges.webp';
import type { Kind } from './data.ts';
import type { EnemyKind } from './enemies.ts';
export type ArtFrame = { texture: string; frame: number };
export const ART_SHEETS = [
  { key: 'allies-front', url: frontUrl, frameWidth: 512, frameHeight: 512 },
  { key: 'allies-support', url: supportUrl, frameWidth: 512, frameHeight: 512 },
  { key: 'allies-elite', url: eliteUrl, frameWidth: 512, frameHeight: 512 },
  { key: 'allies-creatures', url: creaturesUrl, frameWidth: 512, frameHeight: 512 },
  { key: 'enemies-organic', url: organicUrl, frameWidth: 512, frameHeight: 512 },
  { key: 'enemies-mechanical', url: mechanicalUrl, frameWidth: 512, frameHeight: 512 },
  { key: 'terrain-props', url: propsUrl, frameWidth: 512, frameHeight: 512 },
  { key: 'interface-craft', url: uiUrl, frameWidth: 512, frameHeight: 512 },
  { key: 'strongholds', url: strongholdsUrl, frameWidth: 512, frameHeight: 512 },
  { key: 'miels-parapluie', url: tacticsUrl, frameWidth: 512, frameHeight: 512 },
  { key: 'allies-dinosaurs', url: dinosaursUrl, frameWidth: 512, frameHeight: 512 },
  { key: 'serpents-family', url: serpentsUrl, frameWidth: 512, frameHeight: 512 },
  // Two taller figures occupy the upper row; the unused lower icons stay outside frames.
  { key: 'allies-mutants', url: mutantsUrl, frameWidth: 512, frameHeight: 600 },
  { key: 'props-three-bridges', url: threeBridgesPropsUrl, frameWidth: 512, frameHeight: 512 },
] as const;
export const GROUND_ART_URL = groundUrl;
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
const frame = (texture: string, frame: number): ArtFrame => ({ texture, frame });
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
export const PROP_ART = {
  bridge: frame('terrain-props', 0),
  bramble: frame('terrain-props', 1),
  beacon: frame('terrain-props', 2),
  boulder: frame('terrain-props', 3),
};
export function portraitStyle(kind: Kind): string {
  const art = ALLY_ART[kind],
    sheet = ART_SHEETS.find((s) => s.key === art.texture)!;
  return `background-image:url("${sheet.url}");background-size:200% ${(1024 / sheet.frameHeight) * 100}%;background-repeat:no-repeat;background-position:${art.frame % 2 ? 100 : 0}% ${art.frame >= 2 ? 100 : 0}%`;
}

/** Same atlas crops as actors; flying/healer portraits get a capability badge in UI. */
export function enemyPortraitStyle(kind: EnemyKind | 'king' | 'egg'): string {
  const art = kind === 'king' ? KING_ART : kind === 'egg' ? EGG_ART : ENEMY_ART[kind];
  const sheet = ART_SHEETS.find((s) => s.key === art.texture)!;
  return `background-image:url("${sheet.url}");background-size:200% ${(1024 / sheet.frameHeight) * 100}%;background-repeat:no-repeat;background-position:${art.frame % 2 ? 100 : 0}% ${art.frame >= 2 ? 100 : 0}%`;
}
