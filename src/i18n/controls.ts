import { getLanguage, onLanguageChange, selectInitialLanguage, setLanguage } from './language.ts';
import { LANGUAGE_KEY } from '../storageKeys.ts';
import { bindCopyTree, setAttribute, setText } from './dom.ts';
import { make } from '../ui/dom.ts';
import { settingsList } from '../ui/settingsDialog.ts';
import './language.css';

const UNAVAILABLE = 'Langue indisponible. Recharge la page quand la connexion revient.';

/** The stored preference, when the browser lets the page read it. */
function readPreference() {
  let storage: Storage | undefined;
  let stored: string | null = null;
  try {
    storage = localStorage;
    stored = storage.getItem(LANGUAGE_KEY);
  } catch {
    /* Remains usable without storage. */
  }
  return { storage, stored };
}

/** False when the wanted language could not be loaded: the game then starts in French. */
async function applyInitialLanguage(stored: string | null) {
  try {
    await setLanguage(selectInitialLanguage(stored, navigator.languages ?? [navigator.language]));
    return true;
  } catch {
    await setLanguage('fr');
    return false;
  }
}

/** Spoken by screen readers only: the one thing that can go wrong here. */
function languageStatus() {
  const status = make('span', { className: 'sr-only' });
  status.setAttribute('role', 'status');
  document.body.append(status);
  return status;
}

/** The row of the settings: each language is written in its own tongue, never translated. */
function languagePicker() {
  const select = make('select', { className: 'language-select' });
  select.dataset.languagePicker = '';
  setAttribute(select, 'aria-label', 'Choisir la langue');
  for (const [code, name] of [
    ['fr', 'Français'],
    ['en', 'English'],
  ]) {
    const option = make('option');
    option.value = code;
    option.lang = code;
    option.dataset.copyRaw = '';
    option.textContent = name;
    select.append(option);
  }
  const text = make('span', { className: 'setting-label', text: 'Langue' });
  return { row: make('label', { className: 'language-picker' }, text, select), select };
}

/**
 * Disabling the picker takes the focus away from it. It may have it back only while it is
 * still on screen, in the window on top, and the focus has gone nowhere else.
 */
function canTakeFocusBack(select: HTMLSelectElement) {
  return (
    select.getClientRects().length > 0 &&
    document.activeElement === document.body &&
    document.querySelector('dialog[open]') === select.closest('dialog')
  );
}

/** The picker waits, disabled, while the other language loads; the choice is then stored. */
async function chooseLanguage(
  select: HTMLSelectElement,
  storage: Storage | undefined,
  status: HTMLElement,
) {
  const next = select.value === 'en' ? 'en' : 'fr';
  const hadFocus = document.activeElement === select;
  select.disabled = true;
  try {
    await setLanguage(next);
    try {
      storage?.setItem(LANGUAGE_KEY, getLanguage());
    } catch {
      /* In-memory choice still works. */
    }
    setText(status, '');
  } catch {
    setText(status, UNAVAILABLE);
  } finally {
    select.disabled = false;
    select.value = getLanguage();
    if (hadFocus && canTakeFocusBack(select)) select.focus({ preventScroll: true });
  }
}

/** A preference only: no session, game, persistence envelope, audio or clock. */
export async function initializeLanguageControls() {
  const { storage, stored } = readPreference();
  const loaded = await applyInitialLanguage(stored);
  bindCopyTree(document.documentElement);
  const status = languageStatus();
  if (!loaded) setText(status, UNAVAILABLE);
  // The language has a single place: the settings window.
  const { row, select } = languagePicker();
  settingsList().append(row);
  select.onchange = () => chooseLanguage(select, storage, status);
  const update = () => {
    document.documentElement.lang = getLanguage();
    select.value = getLanguage();
  };
  onLanguageChange(update);
  update();
}
