import {
  createTextNode as copyTextNode,
  setTitle as setDisplayTitle,
  setText as setDisplayText,
} from '../i18n/dom.ts';
import { LANE_NAMES } from '../ai.ts';
import type { Game } from '../game.ts';
import type { Session } from '../session.ts';
import type { FeastFlavor } from '../tactics.ts';
import { ART_SHEETS } from '../art.ts';
import { byId, decoration, make, setPressed } from './dom.ts';
import { battleOver } from './battleState.ts';
import * as TEXT from '../texts/fr/camp.ts';
import { fill } from '../texts/fill.ts';

type FeastChoice = { value: FeastFlavor; label: string; hint: string };
export const FEAST_CHOICES: ReadonlyArray<FeastChoice> = [
  {
    value: 'lure',
    label: TEXT.attirer,
    hint: TEXT.attireLesGourmandsVersCetteVoieAux,
  },
  {
    value: 'sticky',
    label: TEXT.ralentir,
    hint: TEXT.poseUneFlaqueDeMielCollantSurLe,
  },
];
/** The sheet that holds both honey pots. */
export const honeySheetUrl = () => ART_SHEETS.find((s) => s.key === 'miels-parapluie')!.url;
export function feastIconStyle(flavor: FeastFlavor) {
  return `background-image:url("${honeySheetUrl()}");background-position:${flavor === 'sticky' ? 100 : 0}% 100%`;
}
export const feastName = (flavor: FeastFlavor) =>
  flavor === 'sticky' ? TEXT.mielCollant : TEXT.mielAttirant;
function feastPot(flavor: FeastFlavor) {
  const icon = decoration('span', 'feast-pot');
  icon.style.cssText = feastIconStyle(flavor);
  return icon;
}
/** A button that shows a pot and the name of what its honey does. */
export const feastButton = (choice: FeastChoice) =>
  make('button', {}, feastPot(choice.value), copyTextNode(choice.label));

/** The tutorial mission opens its lanes one after the other: some stay quiet. */
const someLanesQuiet = (game: Game) => game.mission?.rules === 2 && game.enemyLanes.length < 3;

/** One free pot per wave: its flavour, the lane it is poured on, and what became of it. */
export function bindFeastControls(
  session: Session,
  onChange: () => void,
  isPaused = () => session.game.paused,
) {
  const hint = byId('feast-hint');
  const status = byId('feast-status');
  let selected: FeastFlavor = 'lure';
  let observed = session.game;
  const canChoose = () =>
    !isPaused() &&
    !session.game.caprice.noHoney &&
    !session.game.feastUsed &&
    (session.game.status === 'preparing' || session.game.status === 'fighting');
  const flavorButtons = FEAST_CHOICES.map((choice) => {
    const button = flavorButton(choice);
    button.onclick = () => {
      if (!canChoose()) return;
      selected = choice.value;
      session.selectFeast(selected);
      onChange();
    };
    return button;
  });
  const laneButtons = LANE_NAMES.map((name, lane) => {
    const button = laneButton(name, lane);
    button.onclick = () => {
      if (session.game.offerFeast(lane, session.selectedFeast ?? selected))
        session.selectUnit(null);
      onChange();
    };
    return button;
  });
  /** The flavour the controls talk about: the pot in play, else the player's last choice. */
  const followGame = (game: Game) => {
    if (observed !== game) {
      observed = game;
      selected = 'lure';
    }
    if (game.feast) selected = game.feast.flavor;
    if (session.selectedFeast) selected = session.selectedFeast;
    if (session.selectedFeast && (game.caprice.noHoney || game.feastUsed || battleOver(game)))
      session.selectFeast(null);
  };
  return () => {
    const game = session.game;
    followGame(game);
    for (const [index, button] of flavorButtons.entries()) {
      const active = FEAST_CHOICES[index].value === selected;
      button.disabled = !canChoose();
      button.classList.toggle('active', active);
      setPressed(button, active);
    }
    hint.classList.toggle('tutorial-hint', someLanesQuiet(game));
    setDisplayText(hint, feastHint(game, selected));
    for (const [lane, button] of laneButtons.entries())
      showLane(button, lane, game, selected, isPaused());
    setDisplayText(status, feastStatus(game, selected));
  };
}

function flavorButton(choice: FeastChoice) {
  const button = feastButton(choice);
  button.dataset.feastFlavor = choice.value;
  button.setAttribute('aria-pressed', 'false');
  button.setAttribute('aria-describedby', 'feast-hint');
  setDisplayTitle(button, choice.hint);
  byId('feast-flavors').append(button);
  return button;
}

function laneButton(name: string, lane: number) {
  const button = make('button', { text: name });
  button.dataset.feastLane = String(lane);
  button.setAttribute('aria-pressed', 'false');
  byId('feast-controls').append(button);
  return button;
}

function showLane(
  button: HTMLButtonElement,
  lane: number,
  game: Game,
  flavor: FeastFlavor,
  paused: boolean,
) {
  const attacked = game.enemyLanes.includes(lane);
  button.disabled =
    paused || game.caprice.noHoney || game.status !== 'fighting' || game.feastUsed || !attacked;
  button.classList.toggle('active', game.feast?.lane === lane);
  setPressed(button, game.feast?.lane === lane);
  setDisplayTitle(
    button,
    !attacked
      ? TEXT.cetteVoieRestePaisiblePendantCette
      : fill(
          TEXT.nNPendantNSecondes,
          flavor === 'sticky'
            ? TEXT.ralentirLesSerpentsSurLePassage
            : TEXT.attirerLesSerpentsVersLaVoie,
          LANE_NAMES[lane].toLowerCase(),
          game.feastDuration,
        ),
  );
}

function feastHint(game: Game, flavor: FeastFlavor): string {
  if (game.caprice.noHoney) return TEXT.pasDeMielDansCeCaprice;
  const lanes = game.enemyLanes;
  return (
    TEXT.toucheUnCheminPourPoserLeMielOu +
    FEAST_CHOICES.find((choice) => choice.value === flavor)!.hint +
    (someLanesQuiet(game)
      ? fill(
          TEXT.voieNAttaqueeNNPaisible,
          lanes.length > 1 ? 's' : '',
          lanes.length > 1 ? 's' : '',
          lanes.map((l) => LANE_NAMES[l]).join(' et '),
        )
      : '')
  );
}

function feastStatus(game: Game, flavor: FeastFlavor): string {
  const turns = fill(TEXT.nDetourN, game.honeyTurns, game.honeyTurns > 1 ? 's' : '');
  if (game.caprice.noHoney) return TEXT.pasDeMielDansCeCaprice;
  if (battleOver(game)) return TEXT.aRetrouverDansLaProchainePartie;
  if (game.feast)
    return game.feast.flavor === 'sticky'
      ? fill(
          TEXT.mielCollantNNSRalentitSurLePassage,
          LANE_NAMES[game.feast.lane],
          Math.ceil(game.feast.remaining),
        )
      : fill(
          TEXT.mielAttirantNNSN,
          LANE_NAMES[game.feast.lane],
          Math.ceil(game.feast.remaining),
          turns,
        );
  if (game.feastUsed)
    return fill(
      TEXT.nUtiliseNRevientALaProchaineVague,
      feastName(flavor),
      flavor === 'lure' ? ` · ${turns}` : '',
    );
  if (game.status === 'preparing')
    return fill(TEXT.unPotGratuitParVagueNSChoisisTon, game.feastDuration);
  return fill(TEXT.pretChoisisLaVoieAN, flavor === 'sticky' ? 'ralentir' : 'attirer');
}
