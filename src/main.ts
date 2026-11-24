import { initializeLanguageControls } from './i18n/controls.ts';
import { loadGameFonts } from './render/fonts.ts';
// With the page itself, never fetched later: what is shown when the game cannot start must
// not depend on a file that may not come either.
import { showStartFailure } from './ui/failure/rescue.ts';
import './style.css';
import * as TEXT from './texts/fr/boot.ts';

const loading = document.createElement('div');
loading.className = 'boot-loading';
loading.setAttribute('role', 'status');
loading.textContent = TEXT.chargementLoading;
document.body.append(loading);
void Promise.all([initializeLanguageControls(), loadGameFonts()])
  .then(() => import('./bootstrap.ts'))
  .then(() => loading.remove())
  .catch((error: unknown) => {
    // Said where a developer looks; the child and the parent get the window below.
    console.error(error);
    try {
      showStartFailure();
      loading.remove();
    } catch {
      // Even the window failed: these few words are what is left to say.
      loading.textContent = TEXT.oupsLeJeuNArrivePasADemarrer;
    }
  });
// The Android application keeps the screen on while a battle plays by itself. The build decides
// `__APP_BUILD__`: the website holds none of this, and its screen sleeps as usual.
if (__APP_BUILD__)
  void import('./ui/screenAwake.ts')
    .then(({ keepScreenAwake }) => keepScreenAwake())
    .catch((error: unknown) => console.error(error));
