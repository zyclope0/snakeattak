import { decodeDeparture, encodeDeparture, departureForGame } from '../departures.ts';
import type { MissionRun } from '../missions.ts';
import type { Session } from '../session.ts';

/** Codes carry setup data only. Preview and launch remain two separate actions. */
export function bindDepartureControls(
  session: Session,
  actions: {
    unlocked: (run: MissionRun) => boolean;
    previewMission: (run: MissionRun) => void;
    launchClassic: (seed: number) => void;
  },
) {
  const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
  const input = el<HTMLInputElement>('departure-input');
  const message = el('departure-message');
  const classicDialog = el<HTMLDialogElement>('departure-dialog');
  let pendingSeed: number | null = null;
  function copyButton(fieldId: string, buttonId: string, messageId: string) {
    const field = el<HTMLInputElement>(fieldId),
      button = el<HTMLButtonElement>(buttonId),
      status = el(messageId);
    button.onclick = async () => {
      const code = field.value;
      if (!code) return;
      try {
        if (!navigator.clipboard?.writeText) throw Error('clipboard unavailable');
        await navigator.clipboard.writeText(code);
        status.textContent =
          field.value === code ? 'Code copié.' : 'Le départ a changé ; copie son nouveau code.';
      } catch {
        field.focus();
        field.select();
        status.textContent = 'Code sélectionné : copie-le avec le menu de ton appareil.';
      }
    };
  }
  copyButton('mission-departure-code', 'mission-departure-copy', 'mission-departure-message');
  copyButton('current-departure-code', 'current-departure-copy', 'current-departure-message');
  el<HTMLFormElement>('departure-form').onsubmit = (e) => {
    e.preventDefault();
    const decoded = decodeDeparture(input.value);
    message.textContent = '';
    if (!decoded.ok) {
      message.textContent =
        decoded.reason === 'version'
          ? 'Ce code utilise une autre version des règles. Vérifie la version du jeu.'
          : 'Code incomplet ou incorrect. Vérifie les lettres et les chiffres.';
      input.setAttribute('aria-invalid', 'true');
      return;
    }
    input.removeAttribute('aria-invalid');
    const departure = decoded.departure;
    if (departure.kind === 'mission') {
      if (!actions.unlocked(departure.run)) {
        message.textContent =
          'Cette mission est encore verrouillée. Termine d’abord la précédente.';
        return;
      }
      actions.previewMission(departure.run);
    } else {
      pendingSeed = departure.seed;
      el('departure-preview-code').textContent = encodeDeparture(departure);
      classicDialog.showModal();
    }
  };
  input.oninput = () => {
    input.removeAttribute('aria-invalid');
    message.textContent = '';
  };
  el('departure-cancel').onclick = () => {
    pendingSeed = null;
    classicDialog.close();
  };
  classicDialog.addEventListener('cancel', () => {
    pendingSeed = null;
  });
  el('departure-start').onclick = () => {
    if (pendingSeed === null) return;
    const seed = pendingSeed;
    pendingSeed = null;
    classicDialog.close();
    actions.launchClassic(seed);
  };
  function setCode(fieldId: string, messageId: string, code: string) {
    const field = el<HTMLInputElement>(fieldId);
    if (field.value !== code) {
      field.value = code;
      el(messageId).textContent = '';
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
      const departure = departureForGame(session.game);
      el('current-departure').hidden = !departure;
      el('departure-unavailable').hidden = !!departure;
      if (departure)
        setCode('current-departure-code', 'current-departure-message', encodeDeparture(departure));
    },
  };
}
