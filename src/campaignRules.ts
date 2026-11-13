import {
  isArrayOfLength,
  isIntegerIn,
  isNumberIn,
  isOneOf,
  isRecord,
  isStarCount,
} from './plainData.ts';
export const HERO_FORCE_FACTOR = 1.15;
export type CampaignState = {
  training: 'none' | 'force' | 'guard';
  chapterMin: [number, number, number];
  chapterStars: [number, number, number];
};

export const freshCampaign = (): CampaignState => ({
  training: 'none',
  chapterMin: [100, 100, 100],
  chapterStars: [0, 0, 0],
});

/** Wave numbers are one-based; wave zero belongs to the first camp. */
export const chapterIndex = (wave: number): 0 | 1 | 2 =>
  Math.max(0, Math.min(2, Math.floor((wave - 1) / 4))) as 0 | 1 | 2;
export const chapterStars = (minBase: number): 1 | 2 | 3 =>
  minBase >= 90 ? 3 : minBase >= 60 ? 2 : 1;

const TRAININGS = ['none', 'force', 'guard'] as const;

/** Read a prepared camp without granting future scores or an early training. */
export function readCampaign(raw: unknown, wave: number): CampaignState | null {
  if (!isRecord(raw) || !isIntegerIn(wave, 0, 12)) return null;
  if (
    !isOneOf(raw.training, TRAININGS) ||
    // The hero trains at the first chapter camp at the earliest.
    (raw.training !== 'none' && wave < 4) ||
    !isArrayOfLength(raw.chapterMin, 3, 3) ||
    !raw.chapterMin.every((hp) => isNumberIn(hp, 0, 100)) ||
    !isArrayOfLength(raw.chapterStars, 3, 3) ||
    // A chapter scores only once its fourth wave is won.
    !raw.chapterStars.every(
      (stars, chapter) => isStarCount(stars) && ((chapter + 1) * 4 <= wave || stars === 0),
    )
  )
    return null;
  return {
    training: raw.training,
    chapterMin: [...raw.chapterMin] as CampaignState['chapterMin'],
    chapterStars: [...raw.chapterStars] as CampaignState['chapterStars'],
  };
}
