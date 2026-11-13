import { setText as setDisplayText } from '../i18n/dom.ts';
import { decodeDeparture, encodeDeparture, departureForGame } from '../departures.ts';
import type { MissionRun } from '../missions.ts';
import type { Session } from '../session.ts';
import type { BalanceRevision } from '../balanceRevision.ts';
import { helpPoint } from './helpBubble.ts';
import { byId } from './dom.ts';
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
  const classicDialog = byId<HTMLDialogElement>('departure-dialog');
  // Page des parents : un « ? » au bout de la ligne du code dit ce qu'un code retrouve.
  input.parentElement!.append(helpPoint('code'));
  let pending: { seed: number; balanceRevision: BalanceRevision } | null = null;
  const legacyLabel = document.createElement('small');
  legacyLabel.id = 'departure-original-rules';
  setDisplayText(legacyLabel, 'Règles d’origine');
  byId('departure-preview-code').after(legacyLabel);
  const currentLegacy = legacyLabel.cloneNode() as HTMLElement;
  currentLegacy.id = 'current-original-rules';
  setDisplayText(currentLegacy, 'Règles d’origine');
  byId('current-departure').after(currentLegacy);
  function copyButton(fieldId: string, buttonId: string, messageId: string) {
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
  copyButton('mission-departure-code', 'mission-departure-copy', 'mission-departure-message');
  copyButton('current-departure-code', 'current-departure-copy', 'current-departure-message');
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
    const departure = decoded.departure;
    if (departure.kind === 'mission') {
      if (!actions.unlocked(departure.run)) {
        setDisplayText(
          message,
          'Cette mission est encore verrouillée. Termine d’abord la précédente.',
        );
        return;
      }
      actions.previewMission(departure.run);
    } else {
      pending = { seed: departure.seed, balanceRevision: departure.balance ?? 1 };
      legacyLabel.hidden = departure.balance === 2;
      setDisplayText(byId('departure-preview-code'), encodeDeparture(departure));
      classicDialog.showModal();
    }
  };
  input.oninput = () => {
    input.removeAttribute('aria-invalid');
    setDisplayText(message, '');
  };
  byId('departure-cancel').onclick = () => {
    pending = null;
    classicDialog.close();
  };
  classicDialog.addEventListener('cancel', () => {
    pending = null;
  });
  byId('departure-start').onclick = () => {
    if (pending === null) return;
    const { seed, balanceRevision } = pending;
    pending = null;
    classicDialog.close();
    actions.launchClassic(seed, balanceRevision);
  };
  function setCode(fieldId: string, messageId: string, code: string) {
    const field = byId<HTMLInputElement>(fieldId);
    if (field.value !== code) {
      field.value = code;
      setDisplayText(byId(messageId), '');
    }
  }
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
