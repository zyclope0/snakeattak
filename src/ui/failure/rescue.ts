import './failure.css';
import { FAMILY_STORAGE_KEY } from '../../storageKeys.ts';
import { make } from '../dom.ts';
import { canHandOver, familyFileName, handOver } from '../download.ts';
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
    const raw = device.getItem(key);
    if (player && raw) files.push({ player, raw });
  }
  return files.sort((a, b) => a.player - b.player);
}

/** Adds, under the start-up message, one button for each family file the device holds. */
export function offerRescue(host: HTMLElement, device?: Device): void {
  let files: StoredFamilyFile[] = [];
  try {
    files = storedFamilyFiles(device ?? localStorage);
  } catch {
    // A storage that cannot be read holds nothing this page can give back.
  }
  if (!files.length) return;
  host.classList.add('boot-rescue');
  // The application cannot hand a file over: no button that does nothing. A parent is told
  // what is still there, and what would lose it.
  if (!canHandOver()) {
    host.append(
      make('div', { id: 'rescue' }, make('p', { text: TEXT.lesAventuresSontToujoursDansCet })),
    );
    return;
  }
  const buttons = files.map(({ player, raw }) => {
    // The number is added beside the words, not filled into them: this page must not need
    // the rules' file, which may be the very one that failed to load.
    const button = make(
      'button',
      { className: 'secondary', text: TEXT.enregistrerLaSauvegarde },
      ` ${player}`,
    );
    button.type = 'button';
    button.onclick = () => handOver(raw, familyFileName(player));
    return button;
  });
  host.append(
    make(
      'div',
      { id: 'rescue' },
      ...buttons,
      make('p', { text: TEXT.gardeCesFichiersAvantDEffacer }),
    ),
  );
}
