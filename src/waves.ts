import type { EnemyKind } from './enemies.ts';
import type { BalanceRevision } from './balanceRevision.ts';
import { chapterIndexForWave } from './levels.ts';
import * as TEXT from './texts/fr/snakes.ts';
import { LANE_COUNT, TOTAL_WAVES, WAVES_PER_CHAPTER } from './gameConstants.ts';
export { TOTAL_WAVES };
/** A wave of the adventure lays one egg, then one more per chapter begun, three at most. */
export const MAX_WAVE_EGGS = 3;
export const waveEggCount = (wave: number): number =>
  Math.min(MAX_WAVE_EGGS, 1 + Math.floor(wave / WAVES_PER_CHAPTER));
export type ChapterIdentity = Readonly<{
  firstWave: number;
  lastWave: number;
  focus: string;
  tip: string;
}>;
const chapterIdentities: readonly ChapterIdentity[] = [
  { focus: TEXT.decouvrirLesTroisVoies, tip: TEXT.repartisTesGardiensRetiensLesVifs },
  { focus: TEXT.dejouerLesEscortes, tip: TEXT.lesPlaquesEtLesParapluiesProtegent },
  { focus: TEXT.tenirLeDernierRempart, tip: TEXT.ressortsEnTriosEspacesSoinsEn },
].map((identity, chapter) =>
  Object.freeze({
    firstWave: chapter * WAVES_PER_CHAPTER + 1,
    lastWave: (chapter + 1) * WAVES_PER_CHAPTER,
    ...identity,
  }),
);

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
  [TEXT.kingSnake, TEXT.gardienneAuContactCracheuseA],
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
  return wavePattern(wave) === 'pincer' ? index % LANE_COUNT : picked;
}
export function eggIncubation(wave: number, index: number, roll: number): number {
  return wavePattern(wave) === 'brood' ? 6 + index * 6 + roll * 3 : 7 + roll * 8;
}
/**
 * The newcomers of the fourth balance revision (ideas of the child; places and waves agreed
 * with the parent in the night of 15 to 16 November 2026 after 4 800 simulated games). Each takes one place of
 * a wave, counted as `variantFor` counts, and only from a plain snake: the specialists of a
 * wave and its briefing stay as they were.
 */
export const NEWCOMERS = Object.freeze({
  /** One ninja snake per wave from this wave on. */
  ninja: { place: 10, fromWave: 6 },
  /** One snake with big fangs per wave from this wave on. */
  fang: { place: 13, fromWave: 8 },
  /** The rare snake comes twice in an adventure. */
  rare: { place: 14, waves: [8, 11] as readonly number[] },
  /** One grasshopper snake per wave from this wave on, from the sixth revision. */
  grasshopper: { place: 9, fromWave: 7, revision: 6 },
});
const isPlain = (kind: EnemyKind) => kind === 'normal' || kind === 'runner' || kind === 'armored';
function newcomer(wave: number, index: number, revision: BalanceRevision): EnemyKind | null {
  const { ninja, fang, rare, grasshopper } = NEWCOMERS;
  if (index === rare.place && rare.waves.includes(wave)) return 'rare';
  if (
    revision >= grasshopper.revision &&
    index === grasshopper.place &&
    wave >= grasshopper.fromWave
  )
    return 'grasshopper';
  if (index === fang.place && wave >= fang.fromWave) return 'fang';
  if (index === ninja.place && wave >= ninja.fromWave) return 'shadow';
  return null;
}
/** The snake of one place of a wave; before the fourth revision, exactly `historicVariant`. */
export function variantFor(wave: number, index: number, revision: BalanceRevision = 1): EnemyKind {
  const base = historicVariant(wave, index);
  return revision >= 4 && isPlain(base) ? (newcomer(wave, index, revision) ?? base) : base;
}
function historicVariant(wave: number, index: number): EnemyKind {
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
