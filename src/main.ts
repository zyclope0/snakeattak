import { initializeLanguageControls } from './i18n/controls.ts';
import { setText } from './i18n/dom.ts';
import { loadGameFonts } from './render/fonts.ts';
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
    // These few words stay if even the window's own files do not come.
    setText(loading, TEXT.oupsLeJeuNArrivePasADemarrer);
    void import('./ui/failure/rescue.ts')
      .then(({ showStartFailure }) => {
        showStartFailure();
        loading.remove();
      })
      .catch(() => {});
  });
