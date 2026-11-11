import {
  capriceById,
  capriceDefinitionForRun,
  capricesForMission,
  capriceUnlocked,
  CAPRICE_SET_NAMES,
  CAPRICE_UNLOCK_STARS,
  type CapriceSet,
} from '../caprices.ts';
import { missionById, type MissionRun } from '../missions.ts';
import { kinds, unlockWave, type Kind } from '../data.ts';
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
export function canLaunchCaprice(run: MissionRun, missionOpen: boolean, stars: number) {
  const caprice = run.caprice ? capriceById(run.caprice) : null;
  return (
    missionOpen &&
    (!run.caprice ||
      (!!caprice && caprice.missionId === run.missionId && capriceUnlocked(caprice.tier, stars)))
  );
}
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

import { setText, createTextNode } from '../i18n/dom.ts';
import { capriceExplanation, frenchLeaf } from './capriceCopy.ts';
import { paintSticker } from './capriceIcons.ts';
import { capriceSpeech } from './capriceSpeech.ts';
import { albumOptions, stickerGraphic, type AlbumsController } from './capriceAlbums.ts';
export function bindCapricePreparation(
  dialog: HTMLDialogElement,
  onSelect: (id?: string) => void,
  albums?: AlbumsController,
  onProfileChange: () => void = () => {},
  portraitStyle: (kind: Kind) => string = () => '',
  onFriendsChange: (chosen: readonly Kind[]) => void = () => {},
) {
  const region = document.createElement('section');
  region.id = 'mission-caprices';
  region.className = 'caprice-rows';
  const heading = document.createElement('h3');
  heading.id = 'mission-caprices-title';
  heading.tabIndex = -1;
  setText(heading, 'Caprices');
  region.setAttribute('aria-labelledby', heading.id);
  const availability = document.createElement('p');
  const entry = document.createElement('button');
  entry.id = 'mission-caprices-entry';
  entry.setAttribute('aria-controls', region.id);
  entry.onclick = () => {
    heading.scrollIntoView({ block: 'start' });
    heading.focus({ preventScroll: true });
  };
  dialog.querySelector('#mission-title')!.after(entry);
  const normal = document.createElement('button');
  normal.id = 'mission-normal';
  setText(normal, 'Mission normale');
  normal.onclick = () => onSelect();
  const rows = document.createElement('div');
  const detail = document.createElement('div');
  detail.id = 'caprice-detail';
  detail.className = 'caprice-detail';
  const title = frenchLeaf('h3', ''),
    announce = frenchLeaf('p', '');
  announce.id = 'caprice-announce';
  const announcement = document.createElement('div');
  announcement.className = 'caprice-announcement';
  const graphic = stickerGraphic();
  announcement.append(graphic, announce);
  const explanation = document.createElement('p');
  const listen = document.createElement('button');
  listen.id = 'caprice-listen';
  setText(listen, 'Écouter');
  const speech = capriceSpeech();
  const friendAdvice = document.createElement('p');
  friendAdvice.id = 'caprice-friend-advice';
  setText(
    friendAdvice,
    'Choisis tes sortes préférées ou laisse les premières recrues choisir les places libres.',
  );
  const friends = document.createElement('div');
  friends.className = 'caprice-friends';
  friends.id = 'caprice-friends';
  const profileLabel = document.createElement('label');
  profileLabel.append(createTextNode('Carnet de cette nouvelle partie'));
  const profile = document.createElement('select');
  profile.id = 'mission-caprice-profile';
  profileLabel.append(profile);
  profileLabel.hidden = !albums;
  profile.onchange = () => {
    albums?.select(profile.value);
    onProfileChange();
  };
  detail.append(title, announcement, explanation, listen, friendAdvice, friends, profileLabel);
  region.append(heading, availability, normal, rows, detail);
  dialog.querySelector('#mission-parent-options')!.before(region);
  let chosen = new Set<Kind>(),
    current: MissionRun | null = null;
  let rowKey = '';
  dialog.addEventListener('close', speech.cancel);
  return {
    chosen: () => [...chosen],
    update(run: MissionRun, stars: number) {
      speech.cancel();
      setText(entry, 'Caprices');
      availability.hidden = stars > 0;
      setText(availability, 'Caprices · gagne une étoile pour jouer');
      if (current?.missionId !== run.missionId || current?.caprice !== run.caprice)
        chosen = new Set();
      current = run;
      const key = JSON.stringify([run.missionId, stars, run.balance]);
      if (key !== rowKey) {
        rowKey = key;
        rows.replaceChildren();
        for (const row of capriceRows(run, stars)) {
          const heading = frenchLeaf('h3', row.title);
          const grid = document.createElement('div');
          grid.className = 'caprice-row';
          rows.append(heading, grid);
          for (const card of row.cards) {
            const b = document.createElement('button');
            b.dataset.caprice = card.definition.id;
            b.classList.toggle('caprice-locked', !card.open);
            b.disabled = !card.open;
            b.setAttribute('aria-pressed', String(run.caprice === card.definition.id));
            const status = document.createElement('small');
            setText(
              status,
              card.open ? `${card.stars} ★ · Choisir` : `🔒 ${card.stars} ★ nécessaires`,
            );
            b.append(frenchLeaf('strong', card.definition.name), status);
            b.onclick = () => onSelect(card.definition.id);
            grid.append(b);
          }
        }
      }
      for (const button of Array.from(rows.querySelectorAll<HTMLButtonElement>('[data-caprice]')))
        button.setAttribute('aria-pressed', String(button.dataset.caprice === run.caprice));
      normal.setAttribute('aria-pressed', String(!run.caprice));
      const caprice = capriceDefinitionForRun(run);
      detail.hidden = !caprice;
      friends.replaceChildren();
      friendAdvice.hidden = !caprice?.rules.kinds;
      if (albums) albumOptions(profile, albums);
      if (!caprice) return;
      title.textContent = caprice.name;
      paintSticker(graphic, caprice.rules);
      announce.textContent = caprice.announce;
      setText(explanation, capriceExplanation(caprice.rules));
      listen.hidden = !speech.available();
      listen.onclick = () => speech.speak(caprice.announce);
      if (caprice.rules.kinds) {
        for (const kind of friendChoices(run)) {
          const b = document.createElement('button');
          b.dataset.capriceFriend = kind;
          const portrait = document.createElement('span');
          portrait.className = 'portrait';
          portrait.setAttribute('aria-hidden', 'true');
          portrait.style.cssText = portraitStyle(kind);
          const name = document.createElement('span');
          name.dataset.friendName = kinds[kind].name;
          setText(name, kinds[kind].name);
          b.append(portrait, name);
          b.setAttribute('aria-pressed', String(chosen.has(kind)));
          b.disabled = !chosen.has(kind) && chosen.size >= caprice.rules.kinds;
          b.onclick = () => {
            if (chosen.has(kind)) chosen.delete(kind);
            else if (chosen.size < caprice.rules.kinds) chosen.add(kind);
            for (const button of Array.from(
              friends.querySelectorAll<HTMLButtonElement>('button'),
            )) {
              const selected = chosen.has(button.dataset.capriceFriend as Kind);
              button.setAttribute('aria-pressed', String(selected));
              button.disabled = !selected && chosen.size >= caprice.rules.kinds;
            }
            onFriendsChange([...chosen]);
          };
          friends.append(b);
        }
      }
    },
  };
}
