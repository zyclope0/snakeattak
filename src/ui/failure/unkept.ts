import { byId, dialogOpen, make } from '../dom.ts';
import { showTrouble } from './trouble.ts';
import { buildIsApp } from '../download.ts';
import * as TEXT from '../../texts/fr/failure.ts';

/**
 * When what is played is not being kept on the device. The child is told by a window, once
 * for each time it happens and at a quiet moment only; a mark stays on the home for as long
 * as it lasts, for the parent who comes after the child has pressed the button; and the day
 * the device keeps the game again, the home says so. Loaded only the first time it happens.
 */

/** Why nothing is kept: no storage for the game, a write refused, a file the game cannot build. */
type Cause = 'blocked' | 'full' | 'broken';
/** What the game is doing, asked at the moment something is about to be shown. */
type Where = {
  home(): boolean;
  fighting(): boolean;
  /** True once the game in hand has something to lose: a wave of it was won. */
  played(): boolean;
};

const PARENTS: Record<Cause, string> = {
  full: TEXT.lAppareilNASansDoutePlusAssezDePlace,
  // The application has no private browsing and no such setting: its own words (the parent,
  // 23 November 2026).
  blocked: buildIsApp()
    ? TEXT.cetAppareilNeLaissePasLeJeuGarderLaPartie
    : TEXT.cetAppareilNeLaissePasLeJeuGarder,
  broken: TEXT.leJeuNArrivePasAGarderCettePartie,
};

let cause: Cause | null = null;
/** True once the window was shown for what is happening now. */
let told = false;
let mark: HTMLElement | null = null;

function show(now: Cause): void {
  showTrouble({
    id: 'unkept',
    title: TEXT.taPartieNEstPasGardee,
    words: TEXT.tuPeuxContinuerAJouerSiTuFermes,
    button: TEXT.jAiCompris,
    act: () => {},
    parents: [make('p', { text: PARENTS[now] })],
    stays: false,
  });
}

/** Puts on the home, beside the stars, the mark or the sentence that takes its place. */
function place(next: HTMLElement | null): void {
  mark?.remove();
  mark = next;
  if (next) byId('mission-total').after(next);
}

/**
 * It was not kept and now is: said on the home, where the mark was, until the player has seen
 * it there and gone on.
 */
function sayKeptAgain(): void {
  const healed = make('span', {
    id: 'unkept-mark',
    text: TEXT.cEstRepareTaPartieEstDeNouveauGardee,
  });
  healed.setAttribute('role', 'status');
  place(healed);
  const home = byId('home-screen');
  let seen = !home.hidden;
  const leaving = new MutationObserver(() => {
    if (!home.hidden) seen = true;
    else if (seen) {
      leaving.disconnect();
      if (mark === healed) place(null);
    }
  });
  leaving.observe(home, { attributes: true, attributeFilter: ['hidden'] });
}

/**
 * Called each time the game has tried to keep what is played: `now` says why it could not,
 * or null when it is kept.
 */
export function keepingChanged(now: Cause | null, where: Where): void {
  if (!now) {
    if (cause) sayKeptAgain();
    cause = null;
    told = false;
    return;
  }
  if (now !== cause || !(mark instanceof HTMLButtonElement)) {
    const button = make('button', {
      id: 'unkept-mark',
      className: 'secondary',
      text: TEXT.partieNonGardee,
    });
    button.type = 'button';
    // The parent who comes after the child pressed « J'ai compris » finds the window again.
    button.onclick = () => cause && show(cause);
    place(button);
  }
  cause = now;
  if (told || dialogOpen()) return;
  // Never over a fight, nor over the gifts a wave offers (a panel, not a window): the window
  // comes at the next save, once the gift is chosen. And not before there is something to
  // lose: a child who has just arrived, on a device that keeps nothing, is not stopped at the
  // door. The mark is there.
  if (!where.home() && where.fighting()) return;
  const gifts = document.getElementById('reward-panel');
  if (!where.home() && gifts && !gifts.hidden) return;
  if (!where.played()) return;
  told = true;
  show(now);
}
