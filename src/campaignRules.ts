import {
  isArrayOfLength,
  isIntegerIn,
  isNumberIn,
  isOneOf,
  isRecord,
  isStarCount,
} from './plainData.ts';
import {
  CHAPTER_COUNT,
  CRYSTAL_MAX,
  TOTAL_WAVES,
  WAVES_PER_CHAPTER,
  chapterOfWave,
} from './gameConstants.ts';
export const HERO_FORCE_FACTOR = 1.15;
export type CampaignState = {
  training: 'none' | 'force' | 'guard';
  chapterMin: [number, number, number];
  chapterStars: [number, number, number];
};

export const freshCampaign = (): CampaignState => ({
  training: 'none',
  chapterMin: [CRYSTAL_MAX, CRYSTAL_MAX, CRYSTAL_MAX],
  chapterStars: [0, 0, 0],
});

/** Wave numbers are one-based; wave zero belongs to the first camp. */
export const chapterIndex = (wave: number): 0 | 1 | 2 => chapterOfWave(wave) as 0 | 1 | 2;
export const chapterStars = (minBase: number): 1 | 2 | 3 =>
  minBase >= 90 ? 3 : minBase >= 60 ? 2 : 1;

const TRAININGS = ['none', 'force', 'guard'] as const;

/** Read a prepared camp without granting future scores or an early training. */
export function readCampaign(
  raw: unknown,
  wave: number,
  /** A later round of the endless adventure: the hero may have trained in an earlier one. */
  laterRound = false,
): CampaignState | null {
  if (!isRecord(raw) || !isIntegerIn(wave, 0, TOTAL_WAVES)) return null;
  if (
    !isOneOf(raw.training, TRAININGS) ||
    // The hero trains at the first chapter camp at the earliest.
    (raw.training !== 'none' && wave < WAVES_PER_CHAPTER && !laterRound) ||
    !isArrayOfLength(raw.chapterMin, CHAPTER_COUNT, CHAPTER_COUNT) ||
    !raw.chapterMin.every((hp) => isNumberIn(hp, 0, CRYSTAL_MAX)) ||
    !isArrayOfLength(raw.chapterStars, CHAPTER_COUNT, CHAPTER_COUNT) ||
    // A chapter scores only once its fourth wave is won.
    !raw.chapterStars.every(
      (stars, chapter) =>
        isStarCount(stars) && ((chapter + 1) * WAVES_PER_CHAPTER <= wave || stars === 0),
    )
  )
    return null;
  return {
    training: raw.training,
    chapterMin: [...raw.chapterMin] as CampaignState['chapterMin'],
    chapterStars: [...raw.chapterStars] as CampaignState['chapterStars'],
  };
}
