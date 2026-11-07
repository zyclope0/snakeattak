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

/** Read a prepared camp without granting future scores or an early training. */
export function readCampaign(raw: unknown, wave: number): CampaignState | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const d = raw as Record<string, unknown>;
  if (
    !Number.isInteger(wave) ||
    wave < 0 ||
    wave > 12 ||
    (d.training !== 'none' && d.training !== 'force' && d.training !== 'guard') ||
    (d.training !== 'none' && wave < 4) ||
    !Array.isArray(d.chapterMin) ||
    d.chapterMin.length !== 3 ||
    !d.chapterMin.every((v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100) ||
    !Array.isArray(d.chapterStars) ||
    d.chapterStars.length !== 3 ||
    !d.chapterStars.every(
      (v, i) => Number.isInteger(v) && v >= 0 && v <= 3 && ((i + 1) * 4 <= wave || v === 0),
    )
  )
    return null;
  return {
    training: d.training,
    chapterMin: [...d.chapterMin] as CampaignState['chapterMin'],
    chapterStars: [...d.chapterStars] as CampaignState['chapterStars'],
  };
}
