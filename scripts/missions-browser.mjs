import { withGameUrl } from './lib/recipe.mjs';
await withGameUrl(
  4192,
  () =>
    import(
      process.env.MISSION_TEST === 'regressions' || process.argv.includes('--regressions')
        ? '../tests/missions-regressions-021-browser.mjs'
        : '../tests/missions-021-browser.mjs'
    ),
);
