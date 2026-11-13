import { setText as setDisplayText } from '../i18n/dom.ts';
import { decodeDeparture, encodeDeparture, departureForGame } from '../departures.ts';
import type { Departure } from '../departures.ts';
import type { MissionRun } from '../missions.ts';
import type { Session } from '../session.ts';
import type { BalanceRevision } from '../balanceRevision.ts';
import { helpPoint } from './helpBubble.ts';
import { byId } from './dom.ts';
import { originalRulesLabel } from './gameParts.ts';
import { bindPendingConfirm } from './pendingConfirm.ts';

type ClassicDeparture = Extract<Departure, { kind: 'classic' }>;

/** The « Copier » button of a code. Without a clipboard, the code is selected instead. */
function bindCopyButton(fieldId: string, buttonId: string, messageId: string) {
  const field = byId<HTMLInputElement>(fieldId),
    button = byId<HTMLButtonElement>(buttonId),
    status = byId(messageId);
  button.onclick = async () => {
    const code = field.value;
    if (!code) return;
    try {
      if (!navigator.clipboard?.writeText) throw Error('clipboard unavailable');
      await navigator.clipboard.writeText(code);
      setDisplayText(
        status,
        field.value === code ? 'Code copié.' : 'Le départ a changé ; copie son nouveau code.',
      );
    } catch {
      field.focus();
      field.select();
      setDisplayText(status, 'Code sélectionné : copie-le avec le menu de ton appareil.');
    }
  };
}
/** Shows a code; the message about the previous one goes away with it. */
function setCode(fieldId: string, messageId: string, code: string) {
  const field = byId<HTMLInputElement>(fieldId);
  if (field.value === code) return;
  field.value = code;
  setDisplayText(byId(messageId), '');
}

/** The form of a code: says what is wrong with what was typed, or hands the departure over. */
function bindCodeForm(
  input: HTMLInputElement,
  message: HTMLElement,
  open: (departure: Departure) => void,
) {
  byId<HTMLFormElement>('departure-form').onsubmit = (e) => {
    e.preventDefault();
    const decoded = decodeDeparture(input.value);
    setDisplayText(message, '');
    if (!decoded.ok) {
      setDisplayText(
        message,
        decoded.reason === 'version'
          ? 'Ce code utilise une autre version des règles. Vérifie la version du jeu.'
          : 'Code incomplet ou incorrect. Vérifie les lettres et les chiffres.',
      );
      input.setAttribute('aria-invalid', 'true');
      return;
    }
    input.removeAttribute('aria-invalid');
    open(decoded.departure);
  };
  input.oninput = () => {
    input.removeAttribute('aria-invalid');
    setDisplayText(message, '');
  };
}

/** Codes carry setup data only. Preview and launch remain two separate actions. */
export function bindDepartureControls(
  session: Session,
  actions: {
    unlocked: (run: MissionRun) => boolean;
    previewMission: (run: MissionRun) => void;
    launchClassic: (seed: number, balanceRevision: BalanceRevision) => void;
  },
) {
  const input = byId<HTMLInputElement>('departure-input');
  const message = byId('departure-message');
  // Page des parents : un « ? » au bout de la ligne du code dit ce qu'un code retrouve.
  input.parentElement!.append(helpPoint('code'));
  const legacyLabel = originalRulesLabel(
    'departure-original-rules',
    byId('departure-preview-code'),
  );
  const currentLegacy = originalRulesLabel('current-original-rules', byId('current-departure'));
  bindCopyButton('mission-departure-code', 'mission-departure-copy', 'mission-departure-message');
  bindCopyButton('current-departure-code', 'current-departure-copy', 'current-departure-message');
  const askClassic = bindPendingConfirm<ClassicDeparture>(
    byId<HTMLDialogElement>('departure-dialog'),
    byId('departure-cancel'),
    byId('departure-start'),
    (departure) => actions.launchClassic(departure.seed, departure.balance ?? 1),
  );

  /** A mission code opens its preparation; a classic one is confirmed in its own window. */
  function open(departure: Departure) {
    if (departure.kind === 'classic') {
      legacyLabel.hidden = departure.balance === 2;
      setDisplayText(byId('departure-preview-code'), encodeDeparture(departure));
      return askClassic(departure);
    }
    if (actions.unlocked(departure.run)) return actions.previewMission(departure.run);
    setDisplayText(message, 'Cette mission est encore verrouillée. Termine d’abord la précédente.');
  }
  bindCodeForm(input, message, open);

  return {
    preview(run: MissionRun) {
      setCode(
        'mission-departure-code',
        'mission-departure-message',
        encodeDeparture({ kind: 'mission', run }),
      );
    },
    refresh() {
      currentLegacy.hidden = session.game.balanceRevision !== 1;
      const departure = departureForGame(session.game);
      byId('current-departure').hidden = !departure;
      byId('departure-unavailable').hidden = !!departure;
      if (departure)
        setCode('current-departure-code', 'current-departure-message', encodeDeparture(departure));
    },
  };
}
