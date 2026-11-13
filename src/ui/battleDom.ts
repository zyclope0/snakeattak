import { byId, narrowScreen } from './dom.ts';

/** Gives the keyboard back to the board, without moving the page. */
export const focusBoard = () => byId('game').focus({ preventScroll: true });

/** On a narrow screen the board may be out of view: bring it back for a placement. */
export function revealBoard() {
  if (narrowScreen()) byId('game').scrollIntoView({ block: 'center' });
}
