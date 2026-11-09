import { setMarkup as setDisplayMarkup } from '../i18n/dom.ts';
import './missionJourney.css';
import type { MissionId } from '../missions.ts';
const motifs: Record<MissionId, string> = {
  refuge:
    '<path fill="#84c2b4" d="m48 13 18 17-5 35-27 6-10-32Z"/><path fill="#d2e6ce" d="m48 13-4 28 22-11-18-17Zm-4 28-10 30-10-32Z"/><path d="m48 13-4 28 17 24M24 39l20 2 22-11"/>',
  'trois-ponts':
    '<path stroke="#7ba997" stroke-width="10" d="M8 28h80M8 48h80M8 68h80"/><path fill="#d6b174" d="M32 18h32v60H32Z"/><path d="M32 28h32M32 41h32M32 54h32M32 67h32M29 18v60m38-60v60"/>',
  course:
    '<path fill="#bca06e" d="M39 24c10-10 20 4 13 12s-21 1-13-12Zm16 25c9-12 23 0 17 10S48 60 55 49ZM23 55c7-8 16 2 11 8S17 62 23 55Z"/><path d="m17 35 9-5m39 4 8-5m-26 39 6 6"/>',
  coquilles:
    '<path fill="#eeddb3" d="M44 58c0 19-32 19-32 0 0-12 10-30 16-30s16 18 16 30Zm39-9c0 22-37 22-37 0 0-14 12-35 19-35s18 21 18 35Z"/><path d="m52 35 9 10-5 8 13 6M17 51l11 5-6 10"/>',
  sonnette:
    '<path fill="#c9a45b" d="M20 64c30 16 54-7 38-22-11-12-33-1-22 9 6 7 21-1 14-5"/><path fill="#e8ce91" d="m61 39 8-14 8 6-5 15Z"/><path d="m65 34 10 5m-7-11 9 5m-3-15 4-6m4 12 7-2M20 64l-6-8"/>',
  carrefour:
    '<path stroke="#b89966" stroke-width="15" d="M12 26h72M12 69h72M31 26l32 43m0-43L31 69"/><path stroke="#e5d4a8" stroke-width="3" d="M12 26h72M12 69h72M31 26l32 43m0-43L31 69"/><path fill="#7b9c65" d="m12 48 7-10 6 10-6 9Zm61 0 6-10 6 10-6 9Z"/>',
};
/** Tiny local emblems: no textures, filters or animation. */
export function missionEmblem(id: MissionId) {
  const emblem = document.createElement('span');
  emblem.className = 'mission-emblem';
  emblem.setAttribute('aria-hidden', 'true');
  setDisplayMarkup(
    emblem,
    `<svg viewBox="0 0 96 96" fill="none" stroke="#41634c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${motifs[id]}</svg>`,
  );
  return emblem;
}
/** The card's real status selects a rounded glyph; the readable label stays below. */
export function missionStatusBadge() {
  const badge = document.createElement('span');
  badge.className = 'mission-status-badge';
  badge.setAttribute('aria-hidden', 'true');
  setDisplayMarkup(
    badge,
    `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path class="status-complete" d="m7 16 6 7L26 9"/><path class="status-next" d="M6 16h19m-8-8 8 8-8 8"/><path class="status-locked" d="M10 14V9a6 6 0 0 1 12 0v5m-13 0h14a3 3 0 0 1 3 3v9H6v-9a3 3 0 0 1 3-3Zm7 6v2"/><path class="status-available" d="M25 16a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>`,
  );
  return badge;
}
