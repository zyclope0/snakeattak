import { FAMILY_STORAGE_KEY } from '../../storageKeys.ts';
import { make } from '../dom.ts';
import { canHandOver, familyFileName, handOver } from '../download.ts';
import { showTrouble } from './trouble.ts';
import * as BOOT from '../../texts/fr/boot.ts';
import * as TEXT from '../../texts/fr/failure.ts';

/**
 * When the game cannot start, the home never shows, and with it the way to export a save. If
 * the cause is in what the device holds, clearing the game's data is the only way out, and it
 * deletes the save. This gives the family files back first, exactly as they are stored: they
 * are read by nothing here, so a file that cannot be read is still handed over.
 */

type Device = Pick<Storage, 'length' | 'key' | 'getItem'>;
export type StoredFamilyFile = { player: number; raw: string };

/** The family file of each player the device holds, in the order of the players. */
export function storedFamilyFiles(device: Device): StoredFamilyFile[] {
  const files: StoredFamilyFile[] = [];
  for (let index = 0; index < device.length; index++) {
    const key = device.key(index);
    if (!key?.startsWith(FAMILY_STORAGE_KEY)) continue;
    // The first player's key is the bare one; the others end with « :p2 » to « :p4 ».
    const player =
      key === FAMILY_STORAGE_KEY
        ? 1
        : Number(/^:p([2-9])$/.exec(key.slice(FAMILY_STORAGE_KEY.length))?.[1]);
    // One text that cannot be read does not take the others with it.
    let raw: string | null = null;
    try {
      raw = device.getItem(key);
    } catch {
      continue;
    }
    if (player && raw) files.push({ player, raw });
  }
  return files.sort((a, b) => a.player - b.player);
}

/**
 * The window shown when the game could not start: the child is told to try again, then to
 * fetch a grown-up; a parent finds, folded underneath, the family files the device holds.
 */
export function showStartFailure(device?: Device): void {
  let files: StoredFamilyFile[] = [];
  try {
    files = storedFamilyFiles(device ?? localStorage);
  } catch {
    // A storage that cannot be read holds nothing this page can give back.
  }
  const parents: Node[] = [];
  // The application cannot hand a file over: no button that does nothing. A parent is told
  // what is still there, and what would lose it.
  if (files.length && !canHandOver())
    parents.push(make('p', { text: TEXT.desAventuresSontGardeesDansCetAppareil }));
  else if (files.length) {
    const buttons = files.map(({ player, raw }) => {
      // The number is added beside the words, not filled into them: this page must not need
      // the rules' file, which may be the very one that failed to load.
      const button = make(
        'button',
        { className: 'secondary', text: TEXT.garderLAventureDuJoueur },
        ` ${player}`,
      );
      button.type = 'button';
      button.onclick = () => handOver(raw, familyFileName(player));
      return button;
    });
    parents.push(
      make('p', { text: TEXT.lesAventuresGardeesSurCetAppareil }),
      make('div', { id: 'rescue' }, ...buttons),
    );
  }
  showTrouble({
    id: 'start',
    title: BOOT.oupsLeJeuNArrivePasADemarrer,
    words: TEXT.appuieSurReessayer,
    button: TEXT.reessayer,
    act: () => location.reload(),
    parents,
  });
}
