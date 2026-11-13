import { setText } from '../i18n/dom.ts';
import { frenchLeaf } from './capriceCopy.ts';
import type { HelpTopicId } from './helpTopics.ts';

export type PreparationView = 'summary' | 'caprices' | 'friends' | 'scouting' | 'options';

/** The view to show: a friends view with nothing to choose gives way to the summary. */
export function availableView(view: PreparationView, friendsOffered: boolean): PreparationView {
  return view === 'friends' && !friendsOffered ? 'summary' : view;
}

/**
 * Rearrange existing preparation controls; the expedition controller owns the draft.
 * `help` makes the small "?" of a view (`helpBubble.ts`); without it the views have none.
 */
export function bindMissionPreparation(
  dialog: HTMLDialogElement,
  help?: (topic: HelpTopicId) => HTMLElement,
) {
  const find = (selector: string) => dialog.querySelector<HTMLElement>(selector)!;
  const body = find('.mission-dialog-body');
  const header = document.createElement('header');
  header.className = 'preparation-header';
  header.append(find('.eyebrow'), find('#mission-title'), find('#mission-original-rules'));
  const nav = document.createElement('nav');
  nav.className = 'preparation-nav';
  const sections = new Map<PreparationView, HTMLElement>();
  const buttons = new Map<PreparationView, HTMLButtonElement>();
  for (const [view, label] of Object.entries({
    summary: 'Résumé',
    caprices: 'Caprices',
    friends: 'Copains',
    scouting: 'Repérage',
    options: 'Options',
  }) as [PreparationView, string][]) {
    const section =
      view === 'caprices' ? find('#mission-caprices') : document.createElement('section');
    section.id = view === 'caprices' ? section.id : `mission-${view}`;
    section.classList.add('preparation-view');
    const button =
      view === 'caprices'
        ? (find('#mission-caprices-entry') as HTMLButtonElement)
        : document.createElement('button');
    button.dataset.preparation = view;
    button.setAttribute('aria-controls', section.id);
    if (view !== 'caprices') setText(button, label);
    button.onclick = () => show(view);
    sections.set(view, section);
    buttons.set(view, button);
    nav.append(button);
    body.append(section);
  }
  const summary = sections.get('summary')!;
  const caprice = frenchLeaf('strong', '');
  caprice.id = 'mission-summary-caprice';
  const friendSummary = document.createElement('p');
  friendSummary.id = 'mission-summary-friends';
  const book = document.createElement('p');
  book.id = 'mission-summary-book';
  const bookLabel = document.createElement('span');
  setText(bookLabel, 'Carnet de cette nouvelle partie');
  const bookName = document.createElement('strong');
  bookName.dataset.copyRaw = '';
  book.append(bookLabel, document.createTextNode(' : '), bookName);
  summary.append(
    find('#mission-objective'),
    caprice,
    friendSummary,
    book,
    find('#mission-budget'),
    find('#mission-party'),
    find('.mission-facts'),
    find('#mission-replacement-note'),
  );
  const friends = sections.get('friends')!;
  friends.append(
    find('#caprice-friend-advice'),
    find('#caprice-friends'),
    find('#mission-caprice-profile').parentElement!,
  );
  sections.get('scouting')!.append(find('.mission-overview'));
  const options = find('#mission-parent-options') as HTMLDetailsElement;
  sections.get('options')!.append(find('#mission-reroll'), options);
  options.open = true;
  if (help) {
    // One "?" per view that needs a word of explanation, where the eye looks for it and
    // without adding a row: beside the title, on the map, beside the button it explains.
    find('#mission-caprices-title').after(help('caprices'));
    const map = find('#mission-map');
    const frame = document.createElement('div');
    frame.className = 'mission-map-frame';
    map.before(frame);
    frame.append(map, help('scouting'));
    find('#mission-reroll').after(help('departure'));
  }
  header.append(nav);
  body.before(header);
  let current: PreparationView = 'summary';
  let friendsOffered = true;
  function updateSummary() {
    const selected = find('#caprice-detail');
    caprice.hidden = selected.hidden;
    caprice.textContent = selected.querySelector('h3')?.textContent ?? '';
    const chosen = Array.from(
      find('#caprice-friends').querySelectorAll('[aria-pressed="true"] span:last-child'),
    );
    friendSummary.hidden = find('#caprice-friend-advice').hidden;
    friendSummary.replaceChildren();
    if (chosen.length) {
      for (const [index, node] of chosen.entries()) {
        if (index) friendSummary.append(document.createTextNode(' · '));
        const name = document.createElement('span');
        // The original name's translation binding remains the source.
        setText(name, node.getAttribute('data-friend-name') ?? node.textContent ?? '');
        friendSummary.append(name);
      }
    } else
      setText(
        friendSummary,
        'Choisis tes sortes préférées ou laisse les premières recrues choisir les places libres.',
      );
    const profile = find('#mission-caprice-profile') as HTMLSelectElement;
    book.hidden = profile.parentElement!.hidden;
    bookName.textContent = profile.selectedOptions[0]?.textContent ?? '';
  }
  function show(requested: PreparationView) {
    const view = availableView(requested, friendsOffered);
    current = view;
    dialog.dataset.preparationView = view;
    for (const [key, section] of sections) {
      section.hidden = key !== view;
      buttons.get(key)!.setAttribute('aria-pressed', String(key === view));
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
    buttons.get('summary')!.focus();
  });
  return {
    show,
    /** Show the friends tab only while its view has something to choose. */
    offerFriends(offered: boolean) {
      friendsOffered = offered;
      const tab = buttons.get('friends')!;
      const tabFocused = document.activeElement === tab;
      const viewOpen = current === 'friends';
      tab.hidden = !offered;
      if (offered) return;
      if (viewOpen) show('summary');
      // Focus never stays on a tab or in a view that has just disappeared.
      if (viewOpen || tabFocused) buttons.get('summary')!.focus();
    },
    reset() {
      options.open = true;
      show('summary');
    },
  };
}
