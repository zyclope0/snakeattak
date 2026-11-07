import { visualSettings } from '../render/visualSettings.ts';

export function bindVisualSettings() {
  const checkbox = document.getElementById('light-effects') as HTMLInputElement | null;
  if (!checkbox) return;
  checkbox.checked = visualSettings.light;
  checkbox.onchange = () => visualSettings.setLight(checkbox.checked);
}
