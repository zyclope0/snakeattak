import {
  capriceById,
  capriceDefinitionForRun,
  capricesForMission,
  capriceUnlocked,
  CAPRICE_SET_NAMES,
  CAPRICE_UNLOCK_STARS,
  type CapriceDefinition,
  type CapriceSet,
} from '../caprices.ts';
import type { MissionRun } from '../missions.ts';
import type { Kind } from '../data.ts';
import { setText, createTextNode } from '../i18n/dom.ts';
import { albumChoiceShown, albumOptions, type AlbumsController } from './capriceAlbums.ts';
import { capriceExplanation, frenchLeaf } from './capriceCopy.ts';
import { friendPicker } from './capriceFriends.ts';
import { paintSticker, stickerGraphic } from './capriceIcons.ts';
import { capriceSpeech } from './capriceSpeech.ts';
import { make } from './dom.ts';
export { friendChoices } from './capriceFriends.ts';

export function capriceRows(run: MissionRun, stars: number) {
  return (['serpents', 'createur'] as CapriceSet[]).map((set) => ({
    title: CAPRICE_SET_NAMES[set],
    cards: capricesForMission(run.missionId, set).map((definition) => ({
      definition: capriceDefinitionForRun({ ...run, caprice: definition.id })!,
      stars: CAPRICE_UNLOCK_STARS[definition.tier],
      open: capriceUnlocked(definition.tier, stars),
    })),
  }));
}
type CapriceRow = ReturnType<typeof capriceRows>[number];
type CapriceCard = CapriceRow['cards'][number];

export function canLaunchCaprice(run: MissionRun, missionOpen: boolean, stars: number) {
  const caprice = run.caprice ? capriceById(run.caprice) : null;
  return (
    missionOpen &&
    (!run.caprice ||
      (!!caprice && caprice.missionId === run.missionId && capriceUnlocked(caprice.tier, stars)))
  );
}

/** The friends view exists only when it offers a choice: ally kinds, or several sticker books. */
export function friendsViewHasContent(run: MissionRun, albumCount: number) {
  return !!capriceDefinitionForRun(run)?.rules.kinds || albumChoiceShown(albumCount);
}

/** A caprice to choose: the child's name for it, and the stars that open it. */
function capriceCard(card: CapriceCard, onSelect: (id: string) => void) {
  const button = make('button');
  button.dataset.caprice = card.definition.id;
  button.classList.toggle('caprice-locked', !card.open);
  button.disabled = !card.open;
  const status = make('small', {
    text: card.open ? `${card.stars} ★ · Choisir` : `🔒 ${card.stars} ★ nécessaires`,
  });
  button.append(frenchLeaf('strong', card.definition.name), status);
  button.onclick = () => onSelect(card.definition.id);
  return button;
}

/** A row of three: its title in the child's words, then its cards. */
function capriceRow(row: CapriceRow, onSelect: (id: string) => void) {
  const cards = row.cards.map((card) => capriceCard(card, onSelect));
  return [frenchLeaf('h3', row.title), make('div', { className: 'caprice-row' }, ...cards)];
}

/** The two rows of a mission: the snakes' caprices, then the creator's challenge. */
function capriceCardRows(onSelect: (id: string) => void) {
  const node = make('div');
  let built = '';
  return {
    node,
    show(run: MissionRun, stars: number) {
      // The cards only change with the mission, the stars won and the rules revision.
      const key = JSON.stringify([run.missionId, stars, run.balance]);
      if (key !== built) {
        built = key;
        node.replaceChildren(
          ...capriceRows(run, stars).flatMap((row) => capriceRow(row, onSelect)),
        );
      }
      for (const button of Array.from(node.querySelectorAll<HTMLButtonElement>('[data-caprice]')))
        button.setAttribute('aria-pressed', String(button.dataset.caprice === run.caprice));
    },
  };
}

/** The chosen caprice as the child wrote it: name, sticker, announcement, what it changes. */
function capriceAnnouncement(speech: ReturnType<typeof capriceSpeech>) {
  const title = frenchLeaf('h3', '');
  const announce = frenchLeaf('p', '');
  announce.id = 'caprice-announce';
  const graphic = stickerGraphic();
  const announcement = make('div', { className: 'caprice-announcement' }, graphic, announce);
  const explanation = make('p');
  const listen = make('button', { id: 'caprice-listen', text: 'Écouter' });
  return {
    nodes: [title, announcement, explanation, listen],
    show(caprice: CapriceDefinition) {
      title.textContent = caprice.name;
      paintSticker(graphic, caprice);
      announce.textContent = caprice.announce;
      setText(explanation, capriceExplanation(caprice.rules));
      listen.hidden = !speech.available();
      listen.onclick = () => speech.speak(caprice.announce);
    },
  };
}

/** The sticker book that the new game will fill. */
function bookChoice(albums: AlbumsController | undefined, onChange: () => void) {
  const select = make('select', { id: 'mission-caprice-profile' });
  const label = make('label', {}, createTextNode('Carnet de cette nouvelle partie'), select);
  // With a single sticker book there is nothing to choose: the control stays out of the way.
  const showOrHide = () => {
    label.hidden = !albumChoiceShown(albums?.state.children.length ?? 0);
  };
  showOrHide();
  select.onchange = () => {
    albums?.select(select.value);
    onChange();
  };
  return {
    label,
    refresh() {
      if (albums) albumOptions(select, albums);
      showOrHide();
    },
  };
}

export function bindCapricePreparation(
  dialog: HTMLDialogElement,
  onSelect: (id?: string) => void,
  albums?: AlbumsController,
  onProfileChange: () => void = () => {},
  portraitStyle: (kind: Kind) => string = () => '',
  onFriendsChange: (chosen: readonly Kind[]) => void = () => {},
) {
  const region = make('section', { id: 'mission-caprices', className: 'caprice-rows' });
  const heading = make('h3', { id: 'mission-caprices-title', text: 'Caprices' });
  // Kept as the page has always had it; no code moves the focus to this title any more.
  heading.tabIndex = -1;
  region.setAttribute('aria-labelledby', heading.id);
  const availability = make('p');
  // The tab of this view: `missionPreparation.ts` moves it into its row and makes it work.
  const entry = make('button', { id: 'mission-caprices-entry' });
  entry.setAttribute('aria-controls', region.id);
  dialog.querySelector('#mission-title')!.after(entry);
  const normal = make('button', { id: 'mission-normal', text: 'Mission normale' });
  normal.onclick = () => onSelect();
  const speech = capriceSpeech();
  const cards = capriceCardRows(onSelect);
  const announcement = capriceAnnouncement(speech);
  const friends = friendPicker(portraitStyle, onFriendsChange);
  const book = bookChoice(albums, onProfileChange);
  const detail = make(
    'div',
    { id: 'caprice-detail', className: 'caprice-detail' },
    ...announcement.nodes,
    friends.advice,
    friends.list,
    book.label,
  );
  region.append(heading, availability, normal, cards.node, detail);
  dialog.querySelector('#mission-parent-options')!.before(region);
  dialog.addEventListener('close', speech.cancel);
  return {
    chosen: friends.chosen,
    update(run: MissionRun, stars: number) {
      speech.cancel();
      setText(entry, 'Caprices');
      availability.hidden = stars > 0;
      setText(availability, 'Caprices · gagne une étoile pour jouer');
      cards.show(run, stars);
      normal.setAttribute('aria-pressed', String(!run.caprice));
      const caprice = capriceDefinitionForRun(run);
      detail.hidden = !caprice;
      friends.show(run, caprice?.rules.kinds ?? 0);
      book.refresh();
      if (caprice) announcement.show(caprice);
    },
  };
}
