import { setText } from '../../i18n/dom.ts';
import { byId, make } from '../dom.ts';
import { TAP_HOLD_MS } from '../tapHold.ts';

export type VoyageView = 'map' | 'bonus' | 'arrived' | 'fallen' | 'gift' | 'roulotte';

/**
 * The page of the voyage (or of « La Grande Expédition », `name`) among the pages of the home: a title in the top row, one panel, and
 * its own record and note in the header and the footer. Built here, on first use, so that
 * the start page stays light; what the panel shows is drawn by each view.
 */
export function voyagePage(name: 'voyage' | 'expedition' = 'voyage') {
  const title = make('span');
  const step = make('em');
  const heading = make('h1', { className: 'voyage-title' }, title, step);
  heading.tabIndex = -1;
  const view = make('section', { className: 'voyage-view' });
  const panel = make('div', { className: 'voyage-panel' }, view);
  const page = make('section', { className: 'home-page' }, heading, panel);
  page.classList.add('voyage-page', `${name}-page`);
  page.dataset.homePage = name;
  page.hidden = true;
  const record = make('strong', { id: `${name}-record`, className: 'home-stars' });
  const note = make('span', { id: `${name}-note` });
  byId('home-screen').querySelector('.home-footer')!.before(page);
  byId('mission-total').after(record);
  byId('career-status').after(note);
  let held = 0;
  return {
    /** Draws one view: its name, the record, the note under the panel, then its content. */
    show(
      name: VoyageView,
      words: { title: string; step: string; record: string; note: string },
      content: Node[],
    ) {
      page.dataset.view = name;
      setText(title, words.title);
      setText(step, words.step);
      step.hidden = !words.step;
      setText(record, words.record);
      record.hidden = !words.record;
      setText(note, words.note);
      view.replaceChildren(...content);
      panel.scrollTop = 0;
    },
    /**
     * The view drawn under the child's finger takes no touch for a short while: a second tap
     * meant for the old button never lands on the new one in its place.
     */
    hold(ms = TAP_HOLD_MS) {
      view.inert = true;
      window.clearTimeout(held);
      held = window.setTimeout(() => (view.inert = false), ms);
    },
    /** The name of the screen takes the focus when the view changes under the child's finger. */
    focus: () => heading.focus({ preventScroll: true }),
  };
}
