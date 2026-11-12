import { visualSettings } from '../render/visualSettings.ts';
import { settingsDialog } from './settingsDialog.ts';

export function bindVisualSettings() {
  const checkbox = document.getElementById('light-effects') as HTMLInputElement | null;
  if (!checkbox) return;
  // Un réglage de l'appareil : sa place est dans Réglages, pas au bas de « Comment jouer ».
  const row = checkbox.closest('label');
  if (row) settingsDialog().querySelector('.settings-list')?.append(row);
  checkbox.checked = visualSettings.light;
  checkbox.onchange = () => visualSettings.setLight(checkbox.checked);
}
