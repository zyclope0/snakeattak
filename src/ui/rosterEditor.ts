import { setText as setDisplayText } from '../i18n/dom.ts';
import type { Session } from '../session.ts';
import type { createCareer } from '../progression.ts';
import { ROSTER_NAMES } from '../roster.ts';
import { kinds, unlockWave } from '../data.ts';
import type { Kind } from '../data.ts';
import { byId, make } from './dom.ts';
import { portrait } from './gameParts.ts';
import * as TEXT from '../texts/fr/guide.ts';
import { fill } from '../texts/fill.ts';

type Career = ReturnType<typeof createCareer>;
const PAGE_SIZE = 6;
const ROSTER_SIZE = 8;

/** One ally of the « Favoris » page: portrait, name, and the wave that brings it. */
function rosterCard(kind: Kind) {
  const card = make('button');
  card.dataset.rosterKind = kind;
  card.className = 'roster-card';
  const face = portrait(kind);
  face.setAttribute('aria-hidden', 'true');
  card.append(
    face,
    make('strong', { text: kinds[kind].name }),
    make('small', { text: fill(TEXT.vagueN, unlockWave[kind] ?? 1) }),
  );
  return card;
}

/**
 * The « Favoris » page: three groups of eight allies, shown six per page. The draft lives
 * here until « Utiliser ces favoris »; nothing changes during a battle.
 */
export function bindRosterEditor(
  session: Session,
  career: Career,
  actions: { open: () => void; saved: () => void; back: () => void },
) {
  const select = byId<HTMLSelectElement>('roster-slot');
  const cards = new Map<Kind, HTMLButtonElement>();
  let draft: Kind[] = [],
    slot = 0,
    page = 0;
  const fighting = () => session.game.status === 'fighting';

  const update = () => {
    for (const [index, [kind, card]] of [...cards].entries()) {
      card.hidden = Math.floor(index / PAGE_SIZE) !== page;
      card.setAttribute('aria-pressed', String(draft.includes(kind)));
      card.disabled = fighting();
    }
    const pages = Math.ceil(cards.size / PAGE_SIZE);
    byId<HTMLButtonElement>('roster-page-previous').disabled = page === 0;
    byId<HTMLButtonElement>('roster-page-next').disabled = page >= pages - 1;
    setDisplayText(byId('roster-page-status'), `${page + 1} / ${pages}`);
    setDisplayText(byId('roster-count'), fill(TEXT.n8AlliesFavoris, draft.length));
    byId<HTMLButtonElement>('roster-save').disabled = draft.length !== ROSTER_SIZE || fighting();
  };
  const toggle = (kind: Kind) => {
    if (fighting()) return;
    if (draft.includes(kind)) draft = draft.filter((entry) => entry !== kind);
    else if (draft.length < ROSTER_SIZE) draft = [...draft, kind];
    update();
  };
  const loadSlot = () => {
    slot = Number(select.value);
    draft = [...career.state.rosters[slot]];
    update();
  };
  const turnPage = (step: number) => {
    const next = page + step;
    if (next >= 0 && next * PAGE_SIZE < cards.size) page = next;
    update();
  };

  ROSTER_NAMES.forEach((name, index) => {
    const option = make('option');
    // The value first: a text written on an option without one would become its value.
    option.value = String(index);
    setDisplayText(option, name);
    select.append(option);
  });
  for (const kind of Object.keys(kinds) as Kind[]) {
    if (kind === 'hero') continue;
    const card = rosterCard(kind);
    card.onclick = () => toggle(kind);
    byId('roster-grid').append(card);
    cards.set(kind, card);
  }
  select.onchange = loadSlot;
  byId('roster-page-previous').onclick = () => turnPage(-1);
  byId('roster-page-next').onclick = () => turnPage(1);
  byId('home-army').onclick = () => {
    if (fighting()) return;
    actions.open();
    page = 0;
    select.value = String(career.state.activeRoster);
    loadSlot();
    select.focus();
  };
  byId('roster-back').onclick = actions.back;
  byId('roster-save').onclick = () => {
    if (fighting() || !career.setRoster(slot, draft)) return;
    career.activateRoster(slot);
    session.selectUnit(null);
    actions.saved();
  };
}
