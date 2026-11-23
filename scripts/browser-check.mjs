import { withGameUrl } from './lib/recipe.mjs';
await withGameUrl(4179, () => import('../tests/browser.mjs'));
