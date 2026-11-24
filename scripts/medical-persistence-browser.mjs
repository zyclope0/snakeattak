import { withGameUrl } from './lib/recipe.mjs';
await withGameUrl(4195, () => import('../tests/medical-persistence-022-browser.mjs'));
