import { withGameUrl } from './lib/recipe.mjs';
await withGameUrl(4187, () => import('../tests/journey-browser.mjs'));
