import { make } from './dom.ts';

/**
 * The name of a family file. One saved from the start-up failure carries its player's number;
 * a copy the game kept beside the save carries what it is.
 */
export const familyFileName = (which?: number | 'avant' | 'mis-de-cote') =>
  `conquete-serpents-famille${which ? `-${which}` : ''}.json`;

/** Hands a text to the browser as a file to save. */
export function downloadText(raw: string, name: string) {
  const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
  const link = make('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
