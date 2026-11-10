import { setText as setDisplayText } from '../i18n/dom.ts';
import type { Session } from '../session.ts';
import type { createCareer } from '../progression.ts';
import { ROSTER_NAMES } from '../roster.ts';
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
  return () => {
    select.value = String(career.state.activeRoster);
    select.disabled = session.game.status === 'fighting';
  };
}
