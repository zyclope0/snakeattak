import {
  getLanguage,
  LANGUAGE_KEY,
  onLanguageChange,
  selectInitialLanguage,
  setLanguage,
} from './language.ts';
import { bindCopyTree, setAttribute, setText } from './dom.ts';
import { settingsDialog } from '../ui/settingsDialog.ts';
import './language.css';

/** A preference only: no session, game, persistence envelope, audio or clock. */
export async function initializeLanguageControls() {
  let storage: Storage | undefined,
    stored: string | null = null;
  try {
    storage = localStorage;
    stored = storage.getItem(LANGUAGE_KEY);
  } catch {
    /* Remains usable without storage. */
  }
  let initialError = false;
  try {
    await setLanguage(selectInitialLanguage(stored, navigator.languages ?? [navigator.language]));
  } catch {
    await setLanguage('fr');
    initialError = true;
  }
  bindCopyTree(document.documentElement);
  const selectors: HTMLSelectElement[] = [];
  const status = document.createElement('span');
  status.className = 'sr-only';
  status.setAttribute('role', 'status');
  document.body.append(status);
  if (initialError) setText(status, 'Langue indisponible. Réessaie.');
  // Un seul endroit pour la langue : la fenêtre des réglages.
  for (const parent of [settingsDialog().querySelector('.settings-list')]) {
    if (!parent) continue;
    const label = document.createElement('label'),
      text = document.createElement('span'),
      select = document.createElement('select');
    label.className = 'language-picker';
    text.className = 'setting-label';
    setText(text, 'Langue');
    select.className = 'language-select';
    select.dataset.languagePicker = '';
    setAttribute(select, 'aria-label', 'Choisir la langue');
    for (const [code, name] of [
      ['fr', 'Français'],
      ['en', 'English'],
    ]) {
      const option = document.createElement('option');
      option.value = code;
      option.lang = code;
      option.dataset.copyRaw = '';
      option.textContent = name;
      select.append(option);
    }
    label.append(text, select);
    parent.append(label);
    selectors.push(select);
    select.onchange = async () => {
      const next = select.value === 'en' ? 'en' : 'fr';
      const hadFocus = document.activeElement === select;
      selectors.forEach((s) => {
        s.disabled = true;
      });
      try {
        await setLanguage(next);
        try {
          storage?.setItem(LANGUAGE_KEY, getLanguage());
        } catch {
          /* In-memory choice still works. */
        }
        setText(status, '');
      } catch {
        setText(status, 'Langue indisponible. Réessaie.');
      } finally {
        selectors.forEach((s) => {
          s.disabled = false;
          s.value = getLanguage();
        });
        if (
          hadFocus &&
          select.getClientRects().length &&
          document.activeElement === document.body &&
          document.querySelector('dialog[open]') === select.closest('dialog')
        )
          select.focus({ preventScroll: true });
      }
    };
  }
  const update = () => {
    document.documentElement.lang = getLanguage();
    selectors.forEach((s) => {
      s.value = getLanguage();
    });
  };
  onLanguageChange(update);
  update();
}
