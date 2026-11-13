import type { Session } from '../session.ts';
import type { createCareer } from '../progression.ts';
import { ROSTER_NAMES } from '../roster.ts';
import { addOption, byId } from './dom.ts';
/** The favourite team in use: it can be changed in camp, never during a wave. */
export function bindSquadControls(
  session: Session,
  career: ReturnType<typeof createCareer> | undefined,
  refresh: () => void,
) {
  const panel = byId('quick-army');
  if (!career) {
    panel.hidden = true;
    return () => {};
  }
  const select = byId<HTMLSelectElement>('quick-slot');
  ROSTER_NAMES.forEach((name, i) => addOption(select, String(i), name));
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
