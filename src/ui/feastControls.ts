import { LANE_NAMES } from '../ai.ts';
import type { Session } from '../session.ts';
import type { FeastFlavor } from '../tactics.ts';
import { ART_SHEETS } from '../art.ts';

const flavors: ReadonlyArray<{ value: FeastFlavor; label: string; hint: string }> = [
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

export function bindFeastControls(session: Session, onChange: () => void) {
  const container = document.getElementById('feast-controls')!;
  const flavorContainer = document.getElementById('feast-flavors')!;
  const hint = document.getElementById('feast-hint')!;
  const status = document.getElementById('feast-status')!;
  let selected: FeastFlavor = 'lure';
  let observed = session.game;
  const canChoose = () =>
    !session.game.paused &&
    !session.game.feastUsed &&
    (session.game.status === 'preparing' || session.game.status === 'fighting');
  const flavorButtons = flavors.map((flavor) => {
    const button = document.createElement('button');
    const icon = document.createElement('span');
    icon.className = 'feast-pot';
    icon.setAttribute('aria-hidden', 'true');
    const sheet = ART_SHEETS.find((s) => s.key === 'miels-parapluie')!;
    icon.style.backgroundImage = `url("${sheet.url}")`;
    icon.style.backgroundPosition = `${flavor.value === 'sticky' ? 100 : 0}% 100%`;
    button.append(icon, document.createTextNode(flavor.label));
    button.dataset.feastFlavor = flavor.value;
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-describedby', 'feast-hint');
    button.title = flavor.hint;
    button.onclick = () => {
      if (!canChoose()) return;
      selected = flavor.value;
      onChange();
    };
    flavorContainer.append(button);
    return button;
  });
  const buttons = LANE_NAMES.map((name, lane) => {
    const button = document.createElement('button');
    button.textContent = name;
    button.dataset.feastLane = String(lane);
    button.setAttribute('aria-pressed', 'false');
    button.onclick = () => {
      if (session.game.offerFeast(lane, selected)) session.selected = null;
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
    for (const [index, button] of flavorButtons.entries()) {
      const active = flavors[index].value === selected;
      button.disabled = !canChoose();
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    }
    hint.textContent = flavors.find((flavor) => flavor.value === selected)!.hint;
    for (const [lane, button] of buttons.entries()) {
      button.disabled = game.paused || game.status !== 'fighting' || game.feastUsed;
      button.classList.toggle('active', game.feast?.lane === lane);
      button.setAttribute('aria-pressed', String(game.feast?.lane === lane));
      button.title = `${selected === 'sticky' ? 'Ralentir les serpents sur le passage' : 'Attirer les serpents vers la voie'} ${LANE_NAMES[lane].toLowerCase()} pendant ${game.feastDuration} secondes`;
    }
    const turns = `${game.honeyTurns} détour${game.honeyTurns > 1 ? 's' : ''}`;
    status.textContent =
      game.status === 'won' || game.status === 'lost'
        ? 'À retrouver dans la prochaine partie'
        : game.feast
          ? game.feast.flavor === 'sticky'
            ? `Miel collant · ${LANE_NAMES[game.feast.lane]} · ${Math.ceil(game.feast.remaining)} s · ralentit sur le passage`
            : `Miel attirant · ${LANE_NAMES[game.feast.lane]} · ${Math.ceil(game.feast.remaining)} s · ${turns}`
          : game.feastUsed
            ? `${selected === 'sticky' ? 'Miel collant' : 'Miel attirant'} utilisé${selected === 'lure' ? ` · ${turns}` : ''} · revient à la prochaine vague`
            : game.status === 'preparing'
              ? `Un pot gratuit par vague · ${game.feastDuration} s · choisis ton miel`
              : `Prêt ! Choisis la voie à ${selected === 'sticky' ? 'ralentir' : 'attirer'}`;
  };
}
