import { setMarkup as setDisplayMarkup } from '../i18n/dom.ts';
import './missionJourney.css';
import type { MissionId } from '../missions.ts';
/** Un objet du jeu par mission ; l'image est choisie par la feuille de style. */
export function missionEmblem(id: MissionId) {
  const emblem = document.createElement('span');
  emblem.className = 'mission-emblem';
  emblem.dataset.mission = id;
  emblem.setAttribute('aria-hidden', 'true');
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
