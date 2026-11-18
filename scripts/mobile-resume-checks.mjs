// « Reprendre » sur l'accueil (décision 14 du parent, 18 novembre 2026) : une mission gagnée
// ne demande plus à être reprise, même après la fermeture du jeu ; une mission laissée en
// cours le demande toujours. Joué dans le vrai jeu : la mission 1 se gagne sans recruter.
import { leaveBattle } from '../tests/browser-entry.mjs';
import * as HOME from '../src/texts/fr/home.ts';
import { jouer } from '../src/texts/fr/missionScreens.ts';
import { LANGUAGE_KEY, MISSION_DONE_KEY } from '../src/storageKeys.ts';

const settle = (page) =>
  page.evaluate(
    () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
  );

export async function checkResume({ browser, url, check, capture }) {
  const errors = [];
  const context = await browser.newContext({
    viewport: { width: 780, height: 360 },
    locale: 'fr-CH',
    hasTouch: true,
  });
  await context.addInitScript((key) => localStorage.setItem(key, 'fr'), LANGUAGE_KEY);
  let page;
  const openPage = async () => {
    page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(url);
  };
  const home = async () => {
    await page.locator('#home-primary').waitFor({ state: 'visible' });
    await page.evaluate(() => document.fonts.ready);
    await settle(page);
    return {
      label: (await page.locator('#home-primary').innerText()).trim(),
      caption: (await page.locator('#home-next-mission').innerText()).trim(),
    };
  };
  const status = () => page.locator('#app').getAttribute('data-status');
  // The game closed and opened again: a new tab on the same device (the played tab keeps
  // its stopped clock).
  const reopen = async () => {
    await page.close();
    await openPage();
    return home();
  };

  await openPage();
  let shown = await home();
  check(shown.label === jouer, `resume: a new device offers to play: ${JSON.stringify(shown)}`);

  // A mission left in the middle still waits to be continued, before and after closing.
  await page.locator('#home-primary').click();
  await page.locator('#start').waitFor({ state: 'visible' });
  await page.locator('#start').click();
  await page.waitForFunction(() => document.querySelector('#app')?.dataset.status === 'fighting');
  await leaveBattle(page);
  shown = await home();
  check(shown.label === HOME.reprendre, `resume: a mission under way says « Reprendre »`);
  shown = await reopen();
  check(
    shown.label === HOME.reprendre && shown.caption === HOME.reprendreMaMission,
    `resume: after closing, the mission under way still says « Reprendre »: ${JSON.stringify(shown)}`,
  );

  // The same mission played to the end and won.
  await page.locator('#home-primary').click();
  await page.locator('#app').waitFor({ state: 'visible' });
  await page.locator('#speed').click();
  await page.clock.install();
  for (
    let wave = 0;
    wave < 6 && (await status()) !== 'won' && (await status()) !== 'lost';
    wave++
  ) {
    if ((await status()) === 'preparing') await page.locator('#start').click();
    for (let step = 0; step < 240 && (await status()) === 'fighting'; step++)
      await page.clock.runFor(1000);
  }
  await page.clock.runFor(400);
  check((await status()) === 'won', `resume: the first mission is really won`);
  check(
    (await page.evaluate((key) => localStorage.getItem(key), MISSION_DONE_KEY)) !== null,
    'resume: the mission won leaves its mark on the device',
  );
  await leaveBattle(page);
  shown = await home();
  check(shown.label === jouer, `resume: a mission just won is not offered again`);
  // The fix: closed and opened again, the home still knows it is finished.
  shown = await reopen();
  check(
    shown.label === jouer && shown.caption !== HOME.reprendreMaMission,
    `resume: after closing, a mission won does not say « Reprendre »: ${JSON.stringify(shown)}`,
  );
  await capture(page, 'resume-home-after-win-780x360');
  // « Reprendre ma mission » stays on the Missions page, as before closing.
  await page.locator('#home-expeditions').click();
  check(
    await page.locator('#mission-continue').isVisible(),
    'resume: the Missions page still offers to go back into the last camp',
  );
  // Going back into that camp makes it a mission under way again.
  await page.locator('#mission-continue').click();
  await page.locator('#app').waitFor({ state: 'visible' });
  check(
    (await page.evaluate((key) => localStorage.getItem(key), MISSION_DONE_KEY)) === null,
    'resume: going back into the camp won removes its mark',
  );
  await leaveBattle(page);
  shown = await home();
  check(shown.label === HOME.reprendre, `resume: the camp played again says « Reprendre »`);

  check(!errors.length, `resume: no page error: ${errors.join(' | ')}`);
  await context.close();
}
