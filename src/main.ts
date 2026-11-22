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
  .catch(() => {
    setText(loading, TEXT.impossibleDeDemarrerLeJeuRecharge);
    // The home will not show, nor its way to export a save: hand the stored files over here.
    void import('./ui/failure/rescue.ts')
      .then(({ offerRescue }) => offerRescue(loading))
      .catch(() => {});
  });
