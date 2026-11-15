import { setText } from '../i18n/dom.ts';
import { frenchLeaf } from './capriceCopy.ts';
import { FRIEND_ADVICE } from './capriceFriends.ts';
import { make } from './dom.ts';
import type { HelpTopicId } from './helpTopics.ts';
import * as TEXT from '../texts/fr/missionScreens.ts';

export type PreparationView = 'summary' | 'caprices' | 'friends' | 'scouting' | 'options';
type Find = (selector: string) => HTMLElement;
type ViewParts = { section: HTMLElement; tab: HTMLButtonElement };
type Views = Map<PreparationView, ViewParts>;

/** The views, in the order of their tabs. `capriceView.ts` writes the caprices tab itself. */
const VIEW_LABELS: Record<PreparationView, string> = {
  summary: TEXT.resume,
  caprices: TEXT.caprices,
  friends: TEXT.copains,
  scouting: TEXT.reperage,
  options: TEXT.options,
};

/** The view to show: a friends view with nothing to choose gives way to the summary. */
export function availableView(view: PreparationView, friendsOffered: boolean): PreparationView {
  return view === 'friends' && !friendsOffered ? 'summary' : view;
}

/** The section and the tab of a view; `capriceView.ts` has already made those of the caprices. */
function viewParts(find: Find, view: PreparationView, label: string): ViewParts {
  const made = view !== 'caprices';
  const section = made ? make('section', { id: `mission-${view}` }) : find('#mission-caprices');
  section.classList.add('preparation-view');
  const tab = made
    ? make('button', { text: label })
    : (find('#mission-caprices-entry') as HTMLButtonElement);
  tab.dataset.preparation = view;
  tab.setAttribute('aria-controls', section.id);
  return { section, tab };
}

/** The five views and their tabs, in the order of `VIEW_LABELS`. */
function preparationViews(find: Find, onShow: (view: PreparationView) => void): Views {
  const views: Views = new Map();
  for (const [view, label] of Object.entries(VIEW_LABELS) as [PreparationView, string][]) {
    const parts = viewParts(find, view, label);
    parts.tab.onclick = () => onShow(view);
    views.set(view, parts);
  }
  return views;
}

/**
 * The summary repeats what the other views hold: the caprice, the friends, the sticker book.
 * It reads them from those views, which remain the only owners of the choices.
 */
function missionSummary(find: Find, section: HTMLElement) {
  const caprice = frenchLeaf('strong', '');
  caprice.id = 'mission-summary-caprice';
  const friends = make('p', { id: 'mission-summary-friends' });
  const bookName = make('strong');
  bookName.dataset.copyRaw = '';
  const book = make(
    'p',
    { id: 'mission-summary-book' },
    make('span', { text: TEXT.carnetDeCetteNouvellePartie }),
    ' : ',
    bookName,
  );
  section.append(
    find('#mission-objective'),
    caprice,
    friends,
    book,
    find('#mission-budget'),
    find('#mission-party'),
    find('.mission-facts'),
    find('#mission-replacement-note'),
  );
  const showFriends = () => {
    const chosen = Array.from(
      find('#caprice-friends').querySelectorAll('[aria-pressed="true"] span:last-child'),
    );
    friends.hidden = find('#caprice-friend-advice').hidden;
    friends.replaceChildren();
    if (!chosen.length) {
      setText(friends, FRIEND_ADVICE);
      return;
    }
    for (const [index, node] of chosen.entries()) {
      if (index) friends.append(' · ');
      // The original name's translation binding remains the source.
      const name = node.getAttribute('data-friend-name') ?? node.textContent ?? '';
      friends.append(make('span', { text: name }));
    }
  };
  return () => {
    const selected = find('#caprice-detail');
    caprice.hidden = selected.hidden;
    caprice.textContent = selected.querySelector('h3')?.textContent ?? '';
    showFriends();
    const profile = find('#mission-caprice-profile') as HTMLSelectElement;
    book.hidden = profile.parentElement!.hidden;
    bookName.textContent = profile.selectedOptions[0]?.textContent ?? '';
  };
}

/** The other views receive the controls that the page and `capriceView.ts` already made. */
function fillViews(find: Find, section: (view: PreparationView) => HTMLElement) {
  section('friends').append(
    find('#caprice-friend-advice'),
    find('#caprice-friends'),
    find('#mission-caprice-profile').parentElement!,
  );
  section('scouting').append(find('.mission-overview'));
  const options = find('#mission-parent-options') as HTMLDetailsElement;
  section('options').append(find('#mission-reroll'), options);
  options.open = true;
  return options;
}

/**
 * One "?" per view that needs a word of explanation, where the eye looks for it and without
 * adding a row: beside the title, on the map, beside the button it explains.
 */
function placeHelpPoints(find: Find, help: (topic: HelpTopicId) => HTMLElement) {
  find('#mission-caprices-title').after(help('caprices'));
  const map = find('#mission-map');
  const frame = make('div', { className: 'mission-map-frame' });
  map.before(frame);
  frame.append(map, help('scouting'));
  find('#mission-reroll').after(help('departure'));
}

/**
 * Rearrange existing preparation controls; the expedition controller owns the draft.
 * `help` makes the small "?" of a view (`helpBubble.ts`); without it the views have none.
 */
export function bindMissionPreparation(
  dialog: HTMLDialogElement,
  help?: (topic: HelpTopicId) => HTMLElement,
) {
  const find: Find = (selector) => dialog.querySelector<HTMLElement>(selector)!;
  const body = find('.mission-dialog-body');
  const header = make(
    'header',
    { className: 'preparation-header' },
    find('.eyebrow'),
    find('#mission-title'),
    find('#mission-original-rules'),
  );
  const views = preparationViews(find, (view) => show(view));
  const section = (view: PreparationView) => views.get(view)!.section;
  const tab = (view: PreparationView) => views.get(view)!.tab;
  const nav = make('nav', { className: 'preparation-nav' });
  for (const parts of views.values()) {
    nav.append(parts.tab);
    body.append(parts.section);
  }
  const updateSummary = missionSummary(find, section('summary'));
  const options = fillViews(find, section);
  if (help) placeHelpPoints(find, help);
  header.append(nav);
  body.before(header);
  let current: PreparationView = 'summary';
  let friendsOffered = true;
  function show(requested: PreparationView) {
    const view = availableView(requested, friendsOffered);
    current = view;
    dialog.dataset.preparationView = view;
    for (const [key, parts] of views) {
      parts.section.hidden = key !== view;
      parts.tab.setAttribute('aria-pressed', String(key === view));
    }
    body.scrollTop = 0;
    updateSummary();
  }
  dialog.addEventListener('mission-preparation-change', updateSummary);
  dialog.addEventListener('change', updateSummary);
  dialog.addEventListener('cancel', (event) => {
    if (current === 'summary') return;
    event.preventDefault();
    show('summary');
    tab('summary').focus();
  });
  return {
    show,
    /** Show the friends tab only while its view has something to choose. */
    offerFriends(offered: boolean) {
      friendsOffered = offered;
      const friendsTab = tab('friends');
      const tabFocused = document.activeElement === friendsTab;
      const viewOpen = current === 'friends';
      friendsTab.hidden = !offered;
      if (offered) return;
      if (viewOpen) show('summary');
      // Focus never stays on a tab or in a view that has just disappeared.
      if (viewOpen || tabFocused) tab('summary').focus();
    },
    reset() {
      options.open = true;
      show('summary');
    },
  };
}
