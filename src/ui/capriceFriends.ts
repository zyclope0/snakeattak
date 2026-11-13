import { capriceDefinitionForRun } from '../caprices.ts';
import { kinds, unlockWave, type Kind } from '../data.ts';
import { missionById, type MissionRun } from '../missions.ts';
import { setText } from '../i18n/dom.ts';
import { make } from './dom.ts';

/** Said in the friends view, and again in the summary while no friend is chosen. */
export const FRIEND_ADVICE =
  'Choisis tes sortes préférées ou laisse les premières recrues choisir les places libres.';

/** The ally kinds a mission offers to pick from: unlocked at its rank, allowed by its caprice. */
export function friendChoices(run: MissionRun): Kind[] {
  const rank = missionById(run.missionId)!.unlockRank;
  const rules = capriceDefinitionForRun(run)?.rules;
  return (Object.keys(kinds) as Kind[]).filter(
    (k) =>
      k !== 'hero' &&
      (unlockWave[k] ?? 1) <= rank &&
      !(rules?.noHealers && (k === 'nurse' || k === 'medic')),
  );
}

/**
 * The friends of a caprice that limits the ally kinds: the child may pick up to `limit` of
 * them before leaving. Picking is optional; the game fills the free places with the first
 * recruits.
 */
export function friendPicker(
  portraitStyle: (kind: Kind) => string,
  onChange: (chosen: readonly Kind[]) => void,
) {
  const advice = make('p', { id: 'caprice-friend-advice', text: FRIEND_ADVICE });
  // The class comes before the id, as the page has always written this element.
  const list = make('div', { className: 'caprice-friends' });
  list.id = 'caprice-friends';
  let chosen = new Set<Kind>();
  let shown: MissionRun | null = null;
  let limit = 0;
  /** Pressed for the chosen kinds; once the limit is reached the others cannot be added. */
  const mark = () => {
    for (const button of Array.from(list.querySelectorAll<HTMLButtonElement>('button'))) {
      const selected = chosen.has(button.dataset.capriceFriend as Kind);
      button.setAttribute('aria-pressed', String(selected));
      button.disabled = !selected && chosen.size >= limit;
    }
  };
  const toggle = (kind: Kind) => {
    if (chosen.has(kind)) chosen.delete(kind);
    else if (chosen.size < limit) chosen.add(kind);
    mark();
    onChange([...chosen]);
  };
  const friendButton = (kind: Kind) => {
    const button = make('button');
    button.dataset.capriceFriend = kind;
    const portrait = make('span', { className: 'portrait' });
    portrait.setAttribute('aria-hidden', 'true');
    portrait.style.cssText = portraitStyle(kind);
    const name = make('span');
    // The summary reads the French name here, so that its own copy can be translated.
    name.dataset.friendName = kinds[kind].name;
    setText(name, kinds[kind].name);
    button.append(portrait, name);
    button.onclick = () => toggle(kind);
    return button;
  };
  return {
    advice,
    list,
    chosen: () => [...chosen],
    /** `kindsAllowed` is the caprice's limit, 0 when it does not limit the ally kinds. */
    show(run: MissionRun, kindsAllowed: number) {
      // Another mission or another caprice starts from an empty choice.
      if (shown?.missionId !== run.missionId || shown?.caprice !== run.caprice) chosen = new Set();
      shown = run;
      limit = kindsAllowed;
      advice.hidden = !limit;
      list.replaceChildren(...(limit ? friendChoices(run).map(friendButton) : []));
      mark();
    },
  };
}
