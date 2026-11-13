import { visualSettings } from '../render/visualSettings.ts';
import { settingsList } from './settingsDialog.ts';

export function bindVisualSettings() {
  const checkbox = document.getElementById('light-effects') as HTMLInputElement | null;
  if (!checkbox) return;
  // A setting of the device: it belongs in the settings, not at the bottom of "how to play".
  const row = checkbox.closest('label');
  if (row) settingsList().append(row);
  checkbox.checked = visualSettings.light;
  checkbox.onchange = () => visualSettings.setLight(checkbox.checked);
}
