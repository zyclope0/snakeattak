import {
  setMarkup as setDisplayMarkup,
  setText as setDisplayText,
  setAttribute as setDisplayAttribute,
} from '../i18n/dom.ts';
import './missionJourney.css';
import type { MissionDefinition, MissionId } from '../missions.ts';
import { make } from './dom.ts';
import { starRow } from './homeDom.ts';
import type { missionJourney } from './missionJourney.ts';

/** Un objet du jeu par mission ; l'image est choisie par la feuille de style. */
function missionEmblem(id: MissionId) {
  const emblem = make('span', { className: 'mission-emblem' });
  emblem.dataset.mission = id;
  emblem.setAttribute('aria-hidden', 'true');
  return emblem;
}
/** The card's real status selects a rounded glyph; the readable label stays below. */
function missionStatusBadge() {
  const badge = make('span', { className: 'mission-status-badge' });
  badge.setAttribute('aria-hidden', 'true');
  setDisplayMarkup(
    badge,
    `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path class="status-complete" d="m7 16 6 7L26 9"/><path class="status-next" d="M6 16h19m-8-8 8 8-8 8"/><path class="status-locked" d="M10 14V9a6 6 0 0 1 12 0v5m-13 0h14a3 3 0 0 1 3 3v9H6v-9a3 3 0 0 1 3-3Zm7 6v2"/><path class="status-available" d="M25 16a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>`,
  );
  return badge;
}

/** A mission of the map: its emblem, its number and waves, its name, its goal, its stars. */
export function missionCard(mission: MissionDefinition, index: number) {
  const button = make('button', { className: 'mission-card' });
  button.dataset.missionCard = mission.id;
  const stars = make('span', { className: 'mission-stars' });
  stars.setAttribute('role', 'img');
  const availability = make('small');
  button.append(
    missionEmblem(mission.id),
    missionStatusBadge(),
    make('small', {
      text: `${String(index + 1).padStart(2, '0')} · ${mission.waves.length} vagues`,
    }),
    make('strong', { text: mission.name }),
    make('span', { text: mission.objective }),
    stars,
    availability,
  );
  return { button, stars, availability };
}

/** Each card follows its step of the journey; returns the stars won in all. */
export function showJourney(
  cards: readonly ReturnType<typeof missionCard>[],
  journey: ReturnType<typeof missionJourney>,
): number {
  let total = 0;
  for (const [index, card] of cards.entries()) {
    const step = journey[index];
    total += step.stars;
    setDisplayText(card.stars, starRow(step.stars));
    setDisplayAttribute(card.stars, 'aria-label', step.starLabel);
    card.button.disabled = step.disabled;
    card.button.dataset.journeyStatus = step.status;
    if (step.status === 'next') card.button.setAttribute('aria-current', 'step');
    else card.button.removeAttribute('aria-current');
    setDisplayText(card.availability, `${step.symbol} ${step.label}`);
  }
  return total;
}
