import { make } from './dom.ts';

/**
 * The name of a family file. One saved from the start-up failure carries its player's number;
 * a copy the game kept beside the save carries what it is.
 */
export const familyFileName = (which?: number | 'mis-de-cote') =>
  `conquete-serpents-famille${which ? `-${which}` : ''}.json`;

/** What became of a file the family asked for. */
export type Handover = 'saved' | 'unavailable' | 'failed';

/**
 * Whether this build can hand a file over. A website can: the browser saves it. The Android
 * application cannot yet: nothing in it receives a download, so asking for one did nothing at
 * all (tried by the parent on build 64, 22 November 2026). There, no button offers a file and
 * no sentence says that one is ready.
 */
export const canHandOver = (mode: string = import.meta.env ? import.meta.env.MODE : ''): boolean =>
  mode !== 'android';

/**
 * Hands a text over as a file to save, and says what became of it. « saved » means the
 * browser took it; a browser does not tell the page where the file went, nor whether the
 * family kept it.
 */
export function handOver(raw: string, name: string): Handover {
  if (!canHandOver()) return 'unavailable';
  try {
    const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
    const link = make('a');
    link.href = url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return 'saved';
  } catch {
    return 'failed';
  }
}
