import { canSpend } from './capriceBudget.ts';
import { setText as setDisplayText, setAttribute as setDisplayAttribute } from '../i18n/dom.ts';
import type { Session } from '../session.ts';
import type { createCareer } from '../progression.ts';
import { ROSTER_NAMES } from '../roster.ts';
import { kinds, unlockWave } from '../data.ts';
import type { Kind } from '../data.ts';
import { portraitStyle } from '../art.ts';
export function bindSquadControls(
  session: Session,
  career: ReturnType<typeof createCareer> | undefined,
  refresh: () => void,
) {
  const panel = document.getElementById('quick-army')!;
  if (!career) {
    panel.hidden = true;
    return () => {};
  }
  const select = document.getElementById('quick-slot') as HTMLSelectElement;
  ROSTER_NAMES.forEach((n, i) => {
    const o = document.createElement('option');
    o.value = String(i);
    setDisplayText(o, n);
    select.append(o);
  });
  select.onchange = () => {
    if (session.game.status === 'fighting') {
      select.value = String(career.state.activeRoster);
      return;
    }
    career.activateRoster(Number(select.value));
    session.selectUnit(null);
    refresh();
  };
  const cards = Array.from({ length: 8 }, () => {
    const b = document.createElement('button'),
      p = document.createElement('span'),
      name = document.createElement('span'),
      cost = document.createElement('small');
    b.className = 'quick-card';
    p.className = 'portrait';
    p.setAttribute('aria-hidden', 'true');
    b.append(p, name, cost);
    b.onclick = () => {
      const kind = b.dataset.quickKind as Kind;
      if (!kind || b.disabled) return;
      session.selectUnit(session.selected === kind ? null : kind);
      session.game.message = `${kinds[kind].name} : touche un espace libre dans ton camp.`;
      refresh();
      if (matchMedia('(max-width:800px)').matches)
        document.getElementById('game')!.scrollIntoView({ block: 'center' });
    };
    document.getElementById('quick-cards')!.append(b);
    return { b, p, name, cost };
  });
  return () => {
    const state = career.state,
      g = session.game;
    select.value = String(state.activeRoster);
    select.disabled = g.status === 'fighting';
    state.rosters[state.activeRoster].forEach((kind, i) => {
      const c = cards[i],
        price = g.recruitCost(kind),
        locked = !g.isUnlocked(kind),
        reserveBlocked = !locked && g.caprice.reserve > 0 && !canSpend(g, price);
      if (c.b.dataset.quickKind !== kind) {
        c.b.dataset.quickKind = kind;
        c.p.style.cssText = portraitStyle(kind);
        setDisplayText(c.name, kinds[kind].name);
      }
      c.b.hidden = !g.capriceAllows(kind);
      const label = locked
        ? g.mission
          ? 'Autre mission'
          : `Vague ${unlockWave[kind]}`
        : price === 0
          ? 'Offert'
          : `${price} ●`;
      setDisplayText(c.cost, reserveBlocked ? 'Réserve bancaire protégée' : label);
      c.b.disabled =
        g.paused || locked || !canSpend(g, price) || g.status === 'won' || g.status === 'lost';
      c.b.setAttribute('aria-pressed', String(session.selected === kind));
      setDisplayAttribute(
        c.b,
        'aria-label',
        `${kinds[kind].name}, ${label}${reserveBlocked ? ', réserve bancaire protégée' : ''}`,
      );
    });
  };
}
