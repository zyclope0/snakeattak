import type { createRecordBook } from '../endlessRecords.ts';
import type { createFamilyPersistence } from '../familyPersistence.ts';
import type { Session } from '../session.ts';

/**
 * Tells the family when what is played is not on the device, and when it is again. What is
 * shown, and when, is decided where the screens are; on a device that keeps the game nothing
 * is fetched.
 */
export function createWatchKeeping(
  session: Session,
  family: ReturnType<typeof createFamilyPersistence>,
  records: ReturnType<typeof createRecordBook>,
) {
  /** The screens that say what is played is not being kept: fetched the first time it happens. */
  let keeping: Promise<typeof import('../ui/failure/unkept.ts')> | undefined;
  return function watchKeeping() {
    // A record the device refused is tried again at each save, as the family file is.
    records.retry();
    const cause = family.unkept ?? (records.unkept ? 'full' : null);
    if (!cause && !keeping) return;
    keeping ??= import('../ui/failure/unkept.ts');
    void keeping
      .then(({ keepingChanged }) =>
        keepingChanged(cause, {
          home: () => session.screen === 'home',
          fighting: () => session.game.status === 'fighting',
          // Something won since this game was put in play: a camp found at the door, however
          // far, is not yet something this child would lose by closing the game.
          played: () => session.wonSinceStart,
        }),
      )
      .catch(() => (keeping = undefined));
  };
}
