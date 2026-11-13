import {
  createTextNode as copyTextNode,
  setTitle as setDisplayTitle,
  setText as setDisplayText,
} from '../i18n/dom.ts';
import { LANE_NAMES } from '../ai.ts';
import type { Session } from '../session.ts';
import type { FeastFlavor } from '../tactics.ts';
import { ART_SHEETS } from '../art.ts';
import { byId } from './dom.ts';
export const FEAST_CHOICES: ReadonlyArray<{
  value: FeastFlavor;
  label: string;
  hint: string;
}> = [
  {
    value: 'lure',
    label: 'Attirer',
    hint: 'Attire les gourmands vers cette voie aux prochaines jonctions.',
  },
  {
    value: 'sticky',
    label: 'Ralentir',
    hint: 'Pose une flaque de miel collant sur le passage choisi.',
  },
];
export function feastIconStyle(flavor: FeastFlavor) {
  const sheet = ART_SHEETS.find((s) => s.key === 'miels-parapluie')!;
  return `background-image:url("${sheet.url}");background-position:${flavor === 'sticky' ? 100 : 0}% 100%`;
}
export function feastPot(flavor: FeastFlavor) {
  const icon = document.createElement('span');
  icon.className = 'feast-pot';
  icon.setAttribute('aria-hidden', 'true');
  icon.style.cssText = feastIconStyle(flavor);
  return icon;
}
export function bindFeastControls(
  session: Session,
  onChange: () => void,
  isPaused = () => session.game.paused,
) {
  const container = byId('feast-controls');
  const flavorContainer = byId('feast-flavors');
  const hint = byId('feast-hint');
  const status = byId('feast-status');
  let selected: FeastFlavor = 'lure';
  let observed = session.game;
  const canChoose = () =>
    !isPaused() &&
    !session.game.caprice.noHoney &&
    !session.game.feastUsed &&
    (session.game.status === 'preparing' || session.game.status === 'fighting');
  const flavorButtons = FEAST_CHOICES.map((flavor) => {
    const button = document.createElement('button');
    const icon = feastPot(flavor.value);
    button.append(icon, copyTextNode(flavor.label));
    button.dataset.feastFlavor = flavor.value;
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-describedby', 'feast-hint');
    setDisplayTitle(button, flavor.hint);
    button.onclick = () => {
      if (!canChoose()) return;
      selected = flavor.value;
      session.selectFeast(selected);
      onChange();
    };
    flavorContainer.append(button);
    return button;
  });
  const buttons = LANE_NAMES.map((name, lane) => {
    const button = document.createElement('button');
    setDisplayText(button, name);
    button.dataset.feastLane = String(lane);
    button.setAttribute('aria-pressed', 'false');
    button.onclick = () => {
      if (session.game.offerFeast(lane, session.selectedFeast ?? selected))
        session.selectUnit(null);
      onChange();
    };
    container.append(button);
    return button;
  });
  return () => {
    const game = session.game;
    if (observed !== game) {
      observed = game;
      selected = 'lure';
    }
    if (game.feast) selected = game.feast.flavor;
    if (session.selectedFeast) selected = session.selectedFeast;
    if (
      session.selectedFeast &&
      (game.caprice.noHoney || game.feastUsed || game.status === 'won' || game.status === 'lost')
    )
      session.selectFeast(null);
    for (const [index, button] of flavorButtons.entries()) {
      const active = FEAST_CHOICES[index].value === selected;
      button.disabled = !canChoose();
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    }
    const lanes = game.enemyLanes;
    hint.classList.toggle('tutorial-hint', game.mission?.rules === 2 && lanes.length < 3);
    setDisplayText(
      hint,
      game.caprice.noHoney
        ? 'Pas de miel dans ce caprice'
        : 'Touche un chemin pour poser le miel, ou utilise les boutons ci-dessous. ' +
            FEAST_CHOICES.find((flavor) => flavor.value === selected)!.hint +
            (game.mission?.rules === 2 && lanes.length < 3
              ? ` Voie${lanes.length > 1 ? 's' : ''} attaquée${lanes.length > 1 ? 's' : ''} : ${lanes.map((l) => LANE_NAMES[l]).join(' et ')}. « — » : paisible.`
              : ''),
    );
    for (const [lane, button] of buttons.entries()) {
      button.disabled =
        isPaused() ||
        game.caprice.noHoney ||
        game.status !== 'fighting' ||
        game.feastUsed ||
        !game.enemyLanes.includes(lane);
      button.classList.toggle('active', game.feast?.lane === lane);
      button.setAttribute('aria-pressed', String(game.feast?.lane === lane));
      setDisplayTitle(
        button,
        !game.enemyLanes.includes(lane)
          ? 'Cette voie reste paisible pendant cette vague.'
          : `${selected === 'sticky' ? 'Ralentir les serpents sur le passage' : 'Attirer les serpents vers la voie'} ${LANE_NAMES[lane].toLowerCase()} pendant ${game.feastDuration} secondes`,
      );
    }
    const turns = `${game.honeyTurns} détour${game.honeyTurns > 1 ? 's' : ''}`;
    setDisplayText(
      status,
      game.caprice.noHoney
        ? 'Pas de miel dans ce caprice'
        : game.status === 'won' || game.status === 'lost'
          ? 'À retrouver dans la prochaine partie'
          : game.feast
            ? game.feast.flavor === 'sticky'
              ? `Miel collant · ${LANE_NAMES[game.feast.lane]} · ${Math.ceil(game.feast.remaining)} s · ralentit sur le passage`
              : `Miel attirant · ${LANE_NAMES[game.feast.lane]} · ${Math.ceil(game.feast.remaining)} s · ${turns}`
            : game.feastUsed
              ? `${selected === 'sticky' ? 'Miel collant' : 'Miel attirant'} utilisé${selected === 'lure' ? ` · ${turns}` : ''} · revient à la prochaine vague`
              : game.status === 'preparing'
                ? `Un pot gratuit par vague · ${game.feastDuration} s · choisis ton miel`
                : `Prêt ! Choisis la voie à ${selected === 'sticky' ? 'ralentir' : 'attirer'}`,
    );
  };
}
