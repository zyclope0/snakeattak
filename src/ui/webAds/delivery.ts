import { setText } from '../../i18n/dom.ts';
import { ADS_OFF_KEY } from '../../storageKeys.ts';
import { adsSwitchedOff } from './choice.ts';
import * as TEXT from '../../texts/fr/webAds.ts';
import { byId, make, setPressed } from '../dom.ts';
import { PREPARED_DISPLAY_ATTRIBUTES } from './contract.ts';
import { planAdPlacement, type AdPlacement } from './layout.ts';
import { adBlocked, adNodes, measureAd } from './measure.ts';
import './delivery.css';

/** A window wide enough for an ad box, with a mouse: the only place one is ever asked. */
export const AD_SCREEN = '(min-width: 1920px) and (pointer: fine)';
/** How often the page is looked at, until the one ad box has found its place. */
const LOOK_EVERY_MS = 1000;

const deviceStorage = (): Storage | null => {
  try {
    return localStorage;
  } catch {
    return null;
  }
};

type Options = { onBoardMoved: () => void; scriptUrl: string };

/**
 * One ad box beside the game, asked once per page: Google counts a box that is hidden, moved
 * or asked again as a fault. A parent can switch advertising off; nothing is then asked.
 */
export function bindWebAds({ onBoardMoved, scriptUrl }: Options): void {
  const nodes = adNodes();
  const screen = matchMedia(AD_SCREEN);
  const storage = deviceStorage();
  let frame: HTMLElement | null = null;
  let shift = 0;
  let timer = 0;

  const moveGame = (by: number) => {
    if (shift === by) return;
    shift = by;
    nodes.app.style.setProperty('--web-ad-shift', `${by}px`);
    nodes.app.classList.toggle('web-ad-shifted', by !== 0);
    onBoardMoved();
  };
  const place = (plan: AdPlacement) => {
    moveGame(plan.shiftX);
    const unit = make('ins', { className: 'adsbygoogle' });
    for (const [name, value] of Object.entries(PREPARED_DISPLAY_ATTRIBUTES))
      unit.setAttribute(name, value);
    unit.style.width = `${plan.creative.width}px`;
    unit.style.height = `${plan.creative.height}px`;
    frame = make(
      'aside',
      { id: 'web-ad' },
      make('div', { className: 'web-ad-label', text: TEXT.publicite }),
      unit,
    );
    frame.dataset.shift = String(plan.shiftX);
    Object.assign(frame.style, {
      left: `${plan.frame.x}px`,
      top: `${plan.frame.y}px`,
      width: `${plan.frame.width}px`,
      height: `${plan.frame.height}px`,
    });
    document.body.append(frame);
    const script = make('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = scriptUrl;
    document.head.append(script);
    const queue = ((window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle ??= []);
    queue.push({});
  };
  /** Looks for room, once the battle screen is there; stops for good when the box is placed. */
  const look = () => {
    if (frame || !screen.matches || adsSwitchedOff(storage) || adBlocked(nodes.app)) return;
    const plan = planAdPlacement(measureAd(nodes, 0));
    if (!plan) return;
    place(plan);
    clearInterval(timer);
  };
  const watch = () => {
    clearInterval(timer);
    if (!frame && !adsSwitchedOff(storage)) timer = window.setInterval(look, LOOK_EVERY_MS);
  };
  // A window made too narrow leaves no room: the box steps aside, and comes back with the room.
  screen.addEventListener('change', () => {
    if (frame) {
      frame.hidden = !screen.matches;
      moveGame(screen.matches ? Number(frame.dataset.shift) : 0);
    }
    door.hidden = !screen.matches;
  });

  const door = make('button', { id: 'home-ads' });
  door.type = 'button';
  const tell = () => {
    const off = adsSwitchedOff(storage);
    setText(door, off ? TEXT.publiciteCoupee : TEXT.publiciteAffichee);
    setPressed(door, !off);
  };
  door.hidden = !screen.matches;
  door.onclick = () => {
    if (!storage) return;
    const off = adsSwitchedOff(storage);
    try {
      if (off) storage.removeItem(ADS_OFF_KEY);
      else storage.setItem(ADS_OFF_KEY, '1');
    } catch {
      return;
    }
    // Google's script stays in a page that has asked for an ad: only a fresh page is free of it.
    if (!off && frame) return location.reload();
    tell();
    watch();
  };
  tell();
  byId('home-family').after(door);
  watch();
}
