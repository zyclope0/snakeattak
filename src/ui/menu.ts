import {
  setText as setDisplayText,
  setTitle as setDisplayTitle,
  setAttribute as setDisplayAttribute,
} from '../i18n/dom.ts';
import type { Session } from '../session.ts';
import type { Game } from '../game.ts';
import type { createCareer } from '../progression.ts';
import { ROSTER_NAMES } from '../roster.ts';
import { kinds, unlockWave } from '../data.ts';
import type { Kind } from '../data.ts';
import { portraitStyle, GROUND_ART } from '../art.ts';
import { levelForWave } from '../levels.ts';
import { chapterIdentityForWave } from '../waves.ts';
import type { BalanceRevision } from '../balanceRevision.ts';
type Career = ReturnType<typeof createCareer>;
export function bindMenu(
  session: Session,
  career: Career,
  actions: {
    hasCamp: () => boolean;
    restore: () => Game | null;
    started: () => void;
    view: (home: boolean) => void;
    refresh: () => void;
    progressStatus?: () => string;
  },
) {
  const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
  let draft: Kind[] = [],
    slot = 0,
    pending: (() => void) | null = null;
  const confirm = el<HTMLDialogElement>('journey-confirm');
  const rosterButtons = new Map<Kind, HTMLButtonElement>();
  const enter = () => {
    session.screen = 'battle';
    actions.started();
    actions.view(false);
    actions.refresh();
    requestAnimationFrame(() => el('start').focus({ preventScroll: true }));
  };
  const showHome = () => {
    session.selectUnit(null);
    session.screen = 'home';
    if (!session.game.mission) career.sync(session.game);
    actions.view(true);
    el('home-main').hidden = false;
    el('army-editor').hidden = true;
    refresh();
    el(actions.hasCamp() ? 'home-continue' : 'home-play').focus({ preventScroll: true });
  };
  const replace = (action: () => void) => {
    const g = session.game;
    if (g.wave > 0 || g.gold !== 300 || g.units.length !== 3 || session.hasPlaced) {
      pending = action;
      confirm.showModal();
    } else action();
  };
  el('journey-cancel').onclick = () => {
    pending = null;
    confirm.close();
  };
  confirm.addEventListener('cancel', () => {
    pending = null;
  });
  el('journey-replace').onclick = () => {
    const action = pending;
    pending = null;
    confirm.close();
    action?.();
  };
  el('menu-home').onclick = showHome;
  document.querySelector<HTMLAnchorElement>('#app .brand')!.onclick = (e) => {
    e.preventDefault();
    showHome();
  };
  el('home-new').onclick = () =>
    replace(() => {
      session.restart();
      enter();
    });
  el('home-continue').onclick = () => {
    if (session.game.mission || session.game.status === 'lost' || session.game.status === 'won') {
      const g = actions.restore();
      if (!g) return;
      session.useGame(g);
    }
    enter();
  };
  for (let i = 0; i < 3; i++) {
    const button = el<HTMLButtonElement>(`chapter-${i}`);
    const level = levelForWave(i * 4 + 1);
    const preview = () => button.style.setProperty('--chapter-art', `url("${GROUND_ART[i].url}")`);
    // Do not fetch later battle backgrounds merely to draw menu thumbnails.
    button.style.setProperty(
      '--chapter-art',
      i === 0
        ? 'var(--home-scene)'
        : i === 1
          ? 'linear-gradient(135deg, #486d58, #e6dcad)'
          : 'linear-gradient(135deg, #547b79, #dce7df)',
    );
    button.addEventListener('pointerenter', preview);
    button.addEventListener('focus', preview);
    setDisplayText(el(`chapter-focus-${i}`), chapterIdentityForWave(i * 4 + 1).focus);
    button.onclick = () => {
      if (i === 0) {
        el('home-new').click();
        return;
      }
      const g = career.chapterGame(i as 1 | 2);
      if (!g) return;
      replace(() => {
        session.useGame(g);
        enter();
      });
    };
  }
  el('home-help').onclick = () => el('help').click();
  el('home-guide').onclick = () => el('unit-guide').click();
  el('home-sound').onclick = () => {
    el('sound-toggle').click();
    refresh();
  };
  document.documentElement.style.setProperty('--home-scene', `url("${GROUND_ART[0].url}")`);
  const select = el<HTMLSelectElement>('roster-slot');
  ROSTER_NAMES.forEach((name, i) => {
    const o = document.createElement('option');
    o.value = String(i);
    setDisplayText(o, name);
    select.append(o);
  });
  const updateEditor = () => {
    for (const [k, b] of rosterButtons) {
      b.setAttribute('aria-pressed', String(draft.includes(k)));
      b.disabled = session.game.status === 'fighting';
    }
    setDisplayText(el('roster-count'), `${draft.length} / 8 alliés favoris`);
    el<HTMLButtonElement>('roster-save').disabled =
      draft.length !== 8 || session.game.status === 'fighting';
  };
  for (const [k, d] of Object.entries(kinds)) {
    if (k === 'hero') continue;
    const kind = k as Kind,
      b = document.createElement('button'),
      portrait = document.createElement('span'),
      name = document.createElement('strong'),
      arrival = document.createElement('small');
    b.dataset.rosterKind = kind;
    b.className = 'roster-card';
    portrait.className = 'portrait';
    portrait.style.cssText = portraitStyle(kind);
    portrait.setAttribute('aria-hidden', 'true');
    setDisplayText(name, d.name);
    setDisplayText(arrival, `Vague ${unlockWave[kind] ?? 1}`);
    b.append(portrait, name, arrival);
    b.onclick = () => {
      if (session.game.status === 'fighting') return;
      draft = draft.includes(kind)
        ? draft.filter((k) => k !== kind)
        : draft.length < 8
          ? [...draft, kind]
          : draft;
      updateEditor();
    };
    el('roster-grid').append(b);
    rosterButtons.set(kind, b);
  }
  const loadSlot = () => {
    slot = Number(select.value);
    draft = [...career.state.rosters[slot]];
    updateEditor();
  };
  select.onchange = loadSlot;
  el('home-army').onclick = () => {
    if (session.game.status === 'fighting') return;
    el('home-main').hidden = true;
    el('army-editor').hidden = false;
    select.value = String(career.state.activeRoster);
    loadSlot();
    select.focus();
  };
  el('roster-back').onclick = showHome;
  el('roster-save').onclick = () => {
    if (session.game.status === 'fighting' || !career.setRoster(slot, draft)) return;
    career.activateRoster(slot);
    session.selectUnit(null);
    actions.refresh();
    showHome();
  };
  function refresh() {
    const state = career.state,
      g = session.game;
    setDisplayText(el('home-stars'), `${state.bestStars.reduce((a, b) => a + b, 0)} / 9 étoiles`);
    setDisplayText(el('career-status'), actions.progressStatus?.() ?? career.status);
    el<HTMLButtonElement>('home-continue').hidden =
      !actions.hasCamp() || (!g.mission && g.status === 'won');
    setDisplayText(
      el('home-continue'),
      g.mission
        ? 'Reprendre mon aventure classique'
        : g.status === 'lost'
          ? 'Réessayer la vague'
          : g.status === 'fighting'
            ? `Continuer la bataille · vague ${g.wave}`
            : `Continuer · vague ${Math.min(12, g.wave + 1)}`,
    );
    el<HTMLButtonElement>('home-army').disabled = g.status === 'fighting';
    setDisplayTitle(
      el('home-army'),
      g.status === 'fighting'
        ? 'Les favoris se préparent entre les vagues.'
        : 'Préparer trois groupes de huit favoris.',
    );
    setDisplayText(el('home-active-team'), `Favoris · ${ROSTER_NAMES[state.activeRoster]}`);
    setDisplayText(
      el('home-sound'),
      el('sound-toggle').getAttribute('aria-pressed') === 'true'
        ? '♪ Sons activés'
        : '♪ Sons coupés',
    );
    for (let i = 0; i < 3; i++) {
      const n = state.bestStars[i];
      setDisplayText(el(`chapter-stars-${i}`), '★'.repeat(n) + '☆'.repeat(3 - n));
      setDisplayAttribute(el(`chapter-stars-${i}`), 'aria-label', `${n} étoiles sur 3`);
      const available = i === 0 || state.chapterCamps[i - 1] !== null;
      el<HTMLButtonElement>(`chapter-${i}`).disabled = !available;
      setDisplayText(
        el(`chapter-action-${i}`),
        i === 0
          ? 'Commencer ici'
          : available
            ? 'Rejouer depuis mon camp'
            : 'À découvrir dans l’aventure',
      );
    }
  }
  refresh();
  return {
    refresh,
    showHome,
    startFromSeed(seed: number, balanceRevision: BalanceRevision = 1) {
      replace(() => {
        session.restart(seed, balanceRevision);
        enter();
      });
    },
  };
}
