import { withGameUrl } from './lib/recipe.mjs';
await withGameUrl(4186, () => import('../tests/rewards-browser.mjs'));
