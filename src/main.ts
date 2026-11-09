import { initializeLanguageControls } from './i18n/controls.ts';
import { setText } from './i18n/dom.ts';
import './style.css';

const loading = document.createElement('div');
loading.className = 'boot-loading';
loading.setAttribute('role', 'status');
loading.textContent = 'Chargement… / Loading…';
document.body.append(loading);
void initializeLanguageControls()
  .then(() => import('./bootstrap.ts'))
  .then(() => loading.remove())
  .catch(() => {
    setText(loading, 'Impossible de démarrer le jeu. Recharge la page.');
  });
