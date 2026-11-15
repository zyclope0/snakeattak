import { kinds, type Kind } from '../data.ts';
import { departureForGame, encodeDeparture } from '../departures.ts';
import type { Session } from '../session.ts';
import { availableGold } from './capriceBudget.ts';
import * as TEXT from '../texts/fr/recruiting.ts';

export const REMINDER_TEXT = TEXT.tuAsDesPiecesRecrute;
const STORAGE_KEY = 'conquete-serpents:recruitment-reminder:v1';
const LIMIT = 64;
/** Coins left unspent before the reminder is worth showing. */
const SPARE_COINS = 500;
/** How long the player is left alone, how long the line stays, how often a spot is sought. */
const PATIENCE_MS = 10000;
const SHOWN_MS = 4000;
const PROBE_EVERY_MS = 500;
const memory: string[] = [];
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;
/** UI preference only: bounded departure codes, never family/game save data. */
export function createReminderMarkers(storage?: StoragePort, fallback = memory) {
  let codes = fallback;
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed)) {
      codes = [
        ...new Set([
          ...parsed.filter((s): s is string => typeof s === 'string' && s.length <= 96),
          ...fallback,
        ]),
      ].slice(-LIMIT);
      fallback.splice(0, fallback.length, ...codes);
      codes = fallback;
    }
  } catch {
    /* Storage refusal or corruption must not interrupt play. */
  }
  return {
    has: (code: string) => codes.includes(code),
    mark(code: string) {
      if (code.length > 96) return;
      const next = [...codes.filter((c) => c !== code), code].slice(-LIMIT);
      codes.splice(0, codes.length, ...next);
      try {
        storage?.setItem(STORAGE_KEY, JSON.stringify(codes));
      } catch {
        /* Memory stays authoritative for this page. */
      }
    },
  };
}

/** Find a real legal purchase, including vouchers and caprice restrictions. */
export function hasLegalRecruitment(session: Session) {
  const game = session.game;
  const candidates = (Object.keys(kinds) as Kind[]).filter(
    (kind) =>
      kind !== 'hero' &&
      game.isUnlocked(kind) &&
      game.capriceAllows(kind) &&
      availableGold(game) >= game.recruitCost(kind),
  );
  const kind = candidates[0];
  if (!kind) return false;
  for (let y = 108; y <= 540; y += 12)
    for (let x = 600; x <= 984; x += 12) if (game.canRecruit(kind, x, y)) return true;
  return false;
}

/** Native frame deltas are separate from Session.speed and Game.time. */
export function createRecruitmentReminder(session: Session, markers = createReminderMarkers()) {
  let game = session.game;
  let purchases = session.purchaseCount;
  let previousGold = game.gold;
  let waited = 0;
  let remaining = 0;
  let probeAfter = 0;
  const departureCode = () => {
    const departure = departureForGame(session.game);
    return departure ? encodeDeparture(departure) : 'legacy-classic-without-seed';
  };
  let code = departureCode();
  const startOver = () => {
    waited = remaining = probeAfter = 0;
  };
  /** Another game, a purchase or too few coins: the wait starts again. */
  const observe = () => {
    if (game !== session.game) {
      game = session.game;
      code = departureCode();
      startOver();
      purchases = session.purchaseCount;
      previousGold = game.gold;
    }
    const spent = game.gold < previousGold;
    previousGold = game.gold;
    if (spent || purchases !== session.purchaseCount || availableGold(game) < SPARE_COINS) {
      purchases = session.purchaseCount;
      startOver();
    }
  };
  /** The player is watching a fight, with nothing in hand. */
  const watching = (visible: boolean) =>
    visible &&
    session.screen === 'battle' &&
    game.status === 'fighting' &&
    !game.paused &&
    !session.selected &&
    !session.selectedFeast;
  return {
    update(deltaMs: number, ports: { visible: boolean; blocked: boolean }): string | null {
      observe();
      // Discard suspended/invalid frames; no background time is caught up.
      if (!watching(ports.visible) || !Number.isFinite(deltaMs) || deltaMs <= 0 || deltaMs > 250)
        return null;
      if (availableGold(game) < SPARE_COINS) return null;
      if (remaining > 0) {
        if (ports.blocked) return null;
        remaining = Math.max(0, remaining - deltaMs);
        return remaining > 0 ? REMINDER_TEXT : null;
      }
      if (markers.has(code)) return null;
      waited = Math.min(PATIENCE_MS, waited + deltaMs);
      if (waited < PATIENCE_MS || ports.blocked) return null;
      probeAfter -= deltaMs;
      if (probeAfter > 0) return null;
      if (!hasLegalRecruitment(session)) {
        probeAfter = PROBE_EVERY_MS;
        return null;
      }
      // The caller has made the bottom line available, so this is an actual display.
      markers.mark(code);
      remaining = SHOWN_MS;
      return REMINDER_TEXT;
    },
  };
}
