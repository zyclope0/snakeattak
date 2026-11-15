import type { EnemyKind } from './enemies.ts';
import { chapterIndexForWave } from './levels.ts';
import * as TEXT from './texts/fr/snakes.ts';
export const TOTAL_WAVES = 12;
export type ChapterIdentity = Readonly<{
  firstWave: number;
  lastWave: number;
  focus: string;
  tip: string;
}>;
const chapterIdentities: readonly ChapterIdentity[] = [
  {
    firstWave: 1,
    lastWave: 4,
    focus: TEXT.decouvrirLesTroisVoies,
    tip: TEXT.repartisTesGardiensRetiensLesVifs,
  },
  {
    firstWave: 5,
    lastWave: 8,
    focus: TEXT.dejouerLesEscortes,
    tip: TEXT.lesPlaquesEtLesParapluiesProtegent,
  },
  {
    firstWave: 9,
    lastWave: 12,
    focus: TEXT.tenirLeDernierRempart,
    tip: TEXT.ressortsEnTriosEspacesSoinsEn,
  },
].map((identity) => Object.freeze(identity));

/** One-based wave; camp zero and nonfinite inputs describe the first chapter. */
export function chapterIdentityForWave(wave: number): ChapterIdentity {
  return chapterIdentities[chapterIndexForWave(wave)];
}
const chapters = [
  [TEXT.premiersVisiteurs, TEXT.quelquesSerpentsPrepareTes],
  [TEXT.parLesTroisPonts, TEXT.lesArriveesAlternentEntreLesTrois],
  [TEXT.laCourseDesVifs, TEXT.petitsGroupesDeRapidesPuisUne],
  [TEXT.laPremiereCouvee, TEXT.deuxEclosionsDecaleesLesSonnettes],
  [TEXT.lesRouagesDuBosquet, TEXT.leSerpentARouagesPorteUnePlaque],
  [TEXT.lesTroisFronts, TEXT.unSerpentVolantArriveArchers],
  [TEXT.attentionAuxCracheurs, TEXT.unCracheurADistanceSuitUnParapluie],
  [TEXT.laGrandeCouvee, TEXT.troisEclosionsDecaleesSurTrois],
  [TEXT.laGrandeCavalcade, TEXT.deuxRessortsEncadrentLaPremiere],
  [TEXT.lesPontsSAniment, TEXT.troisFrontsLeMambaNoirRetire3PvA],
  [TEXT.avantLeRoi, TEXT.prepareTesAlliesEtRepareTonCristal],
  [TEXT.leRoiATroisTetes, TEXT.gardienneAuContactCracheuseA],
];
export function waveBriefing(wave: number) {
  const [title, tip] = chapters[Math.max(0, Math.min(11, wave - 1))];
  return { title, tip };
}
export type WavePattern = 'steady' | 'pincer' | 'rush' | 'brood';
export function wavePattern(wave: number): WavePattern {
  return [2, 6, 10].includes(wave)
    ? 'pincer'
    : [3, 9].includes(wave)
      ? 'rush'
      : [4, 8].includes(wave)
        ? 'brood'
        : 'steady';
}
/** Seconds after spawn index; groups have the same approximate average cadence. */
export function spawnDelay(wave: number, index: number): number {
  if (wave === 9) return index % 3 === 2 ? 1.6 : 0.6;
  return wavePattern(wave) === 'rush' ? (index % 3 === 2 ? 2 : 0.4) : 0.95;
}
export function entryLane(wave: number, index: number, picked: number): number {
  return wavePattern(wave) === 'pincer' ? index % 3 : picked;
}
export function eggIncubation(wave: number, index: number, roll: number): number {
  return wavePattern(wave) === 'brood' ? 6 + index * 6 + roll * 3 : 7 + roll * 8;
}
export function variantFor(wave: number, index: number): EnemyKind {
  // Game passes the remaining count, so larger indices arrive first. Swapping
  // existing slots preserves specialist counts and each slot's x1.6 HP class.
  if (wave === 7) index = index === 8 ? 11 : index === 11 ? 8 : index;
  if (wave === 9) index = index === 11 ? 14 : index === 14 ? 11 : index;
  if (wave >= 10 && index % 17 === 5) return 'mamba';
  if (wave >= 8 && index % 13 === 7) return 'royal';
  if (wave >= 4 && index === 3) return 'rattlesnake';
  if (wave >= 6 && index % 5 === 2) return 'umbrella';
  if (wave >= 9 && index % 5 === 1) return 'spring';
  if (wave >= 5 && index % 6 === 0) return 'clockwork';
  if (wavePattern(wave) === 'rush' && index % 3 !== 0) return 'runner';
  if (wave >= 7 && index % 4 === 0) return 'spitter';
  if (wave >= 5 && index % 3 === 0) return 'armored';
  if (wave >= 3 && index % 2 === 0) return 'runner';
  return 'normal';
}
