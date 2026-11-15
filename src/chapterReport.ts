import type { Game } from './game.ts';
import type { Kind } from './data.ts';
import { kinds } from './data.ts';
import { levelForWave } from './levels.ts';
import { chapterStars } from './campaignRules.ts';
import { isMilestone } from './rewards.ts';
import { TOTAL_WAVES, WAVES_PER_CHAPTER } from './gameConstants.ts';

export type ChapterReport = Readonly<{
  chapter: 1 | 2 | 3;
  wave: 4 | 8 | 12;
  terrainName: string;
  stars: number;
  crystalMinimum: number | null;
  crystalCurrent: number;
  alliesPresent: number;
  killsSinceAdventureStart: number;
  army: readonly Readonly<{ kind: Kind; name: string; count: number }>[];
}>;

/** A factual view of an earned boundary, never the next camp's terrain or a career best. */
export function chapterReportFor(game: Game): ChapterReport | null {
  if (game.mission) return null;
  const wave = game.wave;
  if (!isMilestone(wave) && wave !== TOTAL_WAVES) return null;
  if (game.status !== (wave === TOTAL_WAVES ? 'won' : 'preparing')) return null;
  const chapter = (wave / WAVES_PER_CHAPTER) as 1 | 2 | 3;
  const stars = game.campaign.chapterStars[chapter - 1];
  if (!Number.isInteger(stars) || stars < 1 || stars > 3) return null;
  const counts = new Map<Kind, number>();
  for (const unit of game.units) {
    if (unit.hp > 0 && unit.kind !== 'snake')
      counts.set(unit.kind, (counts.get(unit.kind) ?? 0) + 1);
  }
  const army = (Object.keys(kinds) as Kind[]).flatMap((kind) => {
    const count = counts.get(kind) ?? 0;
    return count ? [{ kind, name: kinds[kind].name, count }] : [];
  });
  return {
    chapter,
    wave,
    terrainName: levelForWave(wave).name,
    stars,
    crystalMinimum:
      game.campaign.chapterMin[chapter - 1] <= game.base &&
      chapterStars(game.campaign.chapterMin[chapter - 1]) === stars
        ? game.campaign.chapterMin[chapter - 1]
        : null,
    crystalCurrent: game.base,
    alliesPresent: army.reduce((sum, unit) => sum + unit.count, 0),
    killsSinceAdventureStart: game.kills,
    army,
  };
}

/** Only a witnessed fighting → completed transition in the same Game is new. */
export function createChapterReportObserver() {
  let observed: Game | undefined;
  let status: Game['status'] = 'preparing';
  let wave = 0;
  return (game: Game): { report: ChapterReport | null; fresh: boolean } => {
    const report = chapterReportFor(game);
    const fresh =
      report !== null && observed === game && status === 'fighting' && wave === game.wave;
    observed = game;
    status = game.status;
    wave = game.wave;
    return { report, fresh };
  };
}
