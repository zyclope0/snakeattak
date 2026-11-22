import { make } from './dom.ts';

/** The name of a family file; one saved from the start-up failure carries its player's number. */
export const familyFileName = (player?: number) =>
  `conquete-serpents-famille${player ? `-${player}` : ''}.json`;

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
