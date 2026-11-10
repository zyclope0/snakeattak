import type { createCapriceAlbumsController } from '../capriceAlbums.ts';
import type { Game } from '../game.ts';
import type { Session } from '../session.ts';
import { MISSIONS } from '../missions.ts';
import { capriceById, capricesForMission, CAPRICE_SET_NAMES } from '../caprices.ts';
import { setText, setAttribute, createTextNode } from '../i18n/dom.ts';
import { frenchLeaf } from './capriceCopy.ts';
import { stickerGraphic, paintSticker } from './capriceIcons.ts';
export { stickerGraphic } from './capriceIcons.ts';
import { pauseForDialog } from './dialogs.ts';
export type AlbumsController = ReturnType<typeof createCapriceAlbumsController>;
export function albumOptions(select: HTMLSelectElement, albums: AlbumsController) {
  const state = albums.state;
  const signature = JSON.stringify(state.children.map((c) => [c.id, c.name]));
  if (select.dataset.options !== signature) {
    select.replaceChildren(
      ...state.children.map((child) => {
        const o = document.createElement('option');
        o.value = child.id;
        o.dataset.copyRaw = '';
        o.textContent = child.name;
        return o;
      }),
    );
    select.dataset.options = signature;
  }
  select.value = state.activeId;
}
export function bindCapriceAlbums(
  session: Session,
  albums: AlbumsController,
  refresh: () => void,
  status: () => string,
  award: (game: Game) => boolean | undefined = () => undefined,
) {
  const dialog = document.createElement('dialog');
  dialog.id = 'caprice-album-dialog';
  dialog.className = 'caprice-album-dialog';
  dialog.setAttribute('aria-labelledby', 'caprice-album-title');
  const title = document.createElement('h2');
  title.id = 'caprice-album-title';
  setText(title, 'Mon carnet de caprices');
  const close = document.createElement('button');
  close.id = 'caprice-album-close';
  setText(close, 'Fermer');
  const tools = document.createElement('div');
  tools.className = 'caprice-profile-tools';
  const label = document.createElement('label');
  label.append(createTextNode('Carnet choisi'));
  const select = document.createElement('select');
  select.id = 'caprice-album-profile';
  label.append(select);
  const name = document.createElement('input');
  name.id = 'caprice-album-name';
  name.maxLength = 24;
  const add = document.createElement('button');
  add.id = 'caprice-album-add';
  setText(add, 'Ajouter un carnet');
  const rename = document.createElement('button');
  rename.id = 'caprice-album-rename';
  setText(rename, 'Renommer');
  const nameLabel = document.createElement('label');
  nameLabel.htmlFor = name.id;
  nameLabel.append(createTextNode('Nom du carnet'), name);
  const manage = document.createElement('details');
  manage.id = 'caprice-album-manage';
  const manageLabel = document.createElement('summary');
  setText(manageLabel, 'Gérer les carnets');
  const management = document.createElement('div');
  management.className = 'caprice-profile-management';
  management.append(nameLabel, add, rename);
  manage.append(manageLabel, management);
  tools.append(label, manage);
  const persistence = document.createElement('p');
  persistence.id = 'caprice-album-status';
  const slots = document.createElement('div');
  slots.className = 'caprice-album-slots';
  let missionPage = 0;
  const pagination = document.createElement('nav');
  pagination.className = 'caprice-album-pagination';
  setAttribute(pagination, 'aria-label', 'Missions du carnet');
  const previous = document.createElement('button');
  previous.id = 'caprice-album-previous';
  setText(previous, '← Mission précédente');
  const next = document.createElement('button');
  next.id = 'caprice-album-next';
  setText(next, 'Mission suivante →');
  const pageStatus = document.createElement('span');
  pageStatus.id = 'caprice-album-page';
  pageStatus.setAttribute('role', 'status');
  pagination.append(previous, pageStatus, next);
  const pages: HTMLElement[] = [];
  const leaves: { node: HTMLElement; id: string; status: HTMLElement }[] = [];
  for (const mission of MISSIONS) {
    const page = document.createElement('section');
    page.dataset.albumMission = mission.id;
    page.hidden = pages.length !== missionPage;
    pages.push(page);
    slots.append(page);
    const heading = document.createElement('h3');
    setText(heading, mission.name);
    heading.id = `album-mission-${mission.id}`;
    page.setAttribute('aria-labelledby', heading.id);
    page.append(heading);
    for (const set of ['serpents', 'createur'] as const) {
      page.append(frenchLeaf('h4', CAPRICE_SET_NAMES[set]));
      const grid = document.createElement('div');
      grid.className = 'caprice-album-grid';
      page.append(grid);
      for (const caprice of capricesForMission(mission.id, set)) {
        const node = document.createElement('div');
        node.className = 'caprice-sticker';
        node.dataset.sticker = caprice.id;
        // Original paper medallion drawn locally; no fetched assets or economic reward.
        const svg = stickerGraphic(caprice.rules);
        const earned = document.createElement('small');
        node.append(svg, frenchLeaf('span', caprice.name), earned);
        grid.append(node);
        leaves.push({ node, id: caprice.id, status: earned });
      }
    }
  }
  const header = document.createElement('header');
  header.className = 'caprice-album-header';
  header.append(title, close);
  dialog.append(header, tools, pagination, slots, persistence);
  document.body.append(dialog);
  const modal = pauseForDialog(dialog, session, refresh);
  let returnFocus: HTMLElement | null = null;
  let viewed: string | null = null;
  let signature = '';
  const home = document.createElement('button');
  home.id = 'home-caprice-album';
  setText(home, 'Mon carnet de caprices');
  document.getElementById('home-expeditions')?.after(home);
  const result = document.createElement('button');
  result.id = 'result-caprice-album';
  setText(result, 'Voir mon carnet');
  document.getElementById('mission-result')?.after(result);
  const note = document.createElement('p');
  note.id = 'caprice-sticker-result';
  note.className = 'caprice-result-note';
  result.before(note);
  const resultStatus = document.createElement('span');
  const resultName = frenchLeaf('strong', '');
  const resultGraphic = stickerGraphic();
  note.append(resultGraphic, resultName, resultStatus);
  function open(owner?: string | null) {
    viewed = owner ?? null;
    manage.open = false;
    if (owner && session.game.mission) {
      const index = MISSIONS.findIndex((m) => m.id === session.game.mission!.missionId);
      if (index >= 0) missionPage = index;
    }
    returnFocus = document.activeElement as HTMLElement;
    update(true);
    modal.open();
    close.focus();
  }
  home.onclick = () => open();
  result.onclick = () => open(albums.state.campProfileId);
  close.onclick = () => {
    modal.close();
    returnFocus?.focus({ preventScroll: true });
  };
  dialog.addEventListener('close', () => returnFocus?.focus({ preventScroll: true }));
  select.onchange = () => {
    albums.select(select.value);
    viewed = null;
    refresh();
    update(true);
  };
  add.onclick = () => {
    if (albums.add(name.value)) {
      name.value = '';
      viewed = null;
      refresh();
      update(true);
    }
  };
  rename.onclick = () => {
    if (albums.rename(viewed ?? albums.state.activeId, name.value)) {
      name.value = '';
      refresh();
      update(true);
    }
  };
  function showPage() {
    pages.forEach((page, index) => {
      page.hidden = index !== missionPage;
    });
    previous.disabled = missionPage === 0;
    next.disabled = missionPage === MISSIONS.length - 1;
    setText(pageStatus, `${missionPage + 1} / ${MISSIONS.length}`);
    slots.scrollTop = 0;
  }
  previous.onclick = () => {
    if (missionPage > 0) missionPage--;
    showPage();
  };
  next.onclick = () => {
    if (missionPage < MISSIONS.length - 1) missionPage++;
    showPage();
  };
  function update(force = false) {
    const state = albums.state;
    const ended = !!session.game.mission?.caprice && ['won', 'lost'].includes(session.game.status);
    result.hidden = !ended;
    note.hidden = !ended;
    if (ended) {
      const caprice = capriceById(session.game.mission?.caprice)!;
      resultName.textContent = caprice.name;
      paintSticker(resultGraphic, caprice.rules);
      resultGraphic.toggleAttribute('hidden', session.game.status !== 'won');
      setText(
        resultStatus,
        session.game.status === 'lost'
          ? 'Tu peux réessayer ce même caprice.'
          : award(session.game) === true
            ? 'Autocollant gagné !'
            : albums.has(session.game.mission!.caprice!, state.campProfileId ?? state.activeId)
              ? 'Cet autocollant est déjà dans le carnet de cette partie.'
              : 'Ce caprice attend encore son autocollant.',
      );
    }
    if (!dialog.open && !force) return;
    const next = JSON.stringify([state, viewed, status()]);
    if (next === signature) return;
    signature = next;
    albumOptions(select, albums);
    select.value = viewed ?? state.activeId;
    const child = state.children.find((c) => c.id === (viewed ?? state.activeId))!;
    for (const leaf of leaves) {
      const earned = child.completed.includes(leaf.id);
      leaf.node.dataset.earned = String(earned);
      setText(leaf.status, earned ? '✓ Autocollant gagné' : 'À découvrir');
    }
    showPage();
    add.disabled = state.children.length >= 8;
    setText(persistence, status());
  }
  return { refresh: () => update(), open };
}
