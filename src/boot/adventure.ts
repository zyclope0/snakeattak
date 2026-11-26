import type { createAppleBook } from '../appleBook.ts';
import type { createCampMemory } from '../campMemory.ts';
import type { createCapriceAlbumsController } from '../capriceAlbums.ts';
import type { createPersistence } from '../checkpoints.ts';
import type { createRecordBook } from '../endlessRecords.ts';
import type { createFamilyPersistence } from '../familyPersistence.ts';
import type { createMissionDone } from '../missionDone.ts';
import type { createMissionProgressController } from '../missionProgress.ts';
import type { playerStorage } from '../players.ts';
import type { createCareer } from '../progression.ts';
import type { Session } from '../session.ts';
import type { createStickers } from './stickers.ts';

/**
 * What holds the active player's adventure, gathered once by `src/bootstrap.ts` for the parts
 * that record it, replace it or put another game on the board. A type only: nothing of it is
 * in the build.
 */
export type Adventure = {
  session: Session;
  /** The active player's keys; undefined when the device keeps nothing. */
  storage: ReturnType<typeof playerStorage> | undefined;
  /** The classic camp under its own key. */
  persistence: ReturnType<typeof createPersistence>;
  family: ReturnType<typeof createFamilyPersistence>;
  records: ReturnType<typeof createRecordBook>;
  /** The apples found towards the hidden boss. */
  apples: ReturnType<typeof createAppleBook>;
  career: ReturnType<typeof createCareer>;
  missions: ReturnType<typeof createMissionProgressController>;
  albums: ReturnType<typeof createCapriceAlbumsController>;
  missionDone: ReturnType<typeof createMissionDone>;
  campMemory: ReturnType<typeof createCampMemory>;
  stickers: ReturnType<typeof createStickers>;
};
