/** Use the real menu when a test targets the battle screen. No production bypass. */
export async function enterBattle(page) {
  // The language bootstrap is asynchronous: await the real screen, not an
  // initial hidden template. Direct battle fixtures still enter immediately.
  if (await page.locator('#home-screen').count())
    await page
      .locator('#home-screen:not([hidden]), #app:not([hidden])')
      .first()
      .waitFor({ state: 'visible' });
  if (
    !(await page.locator('#home-screen').count()) ||
    !(await page.locator('#home-screen').isVisible())
  )
    return;
  if (await page.locator('#home-classic').isVisible()) await page.locator('#home-classic').click();
  const button = (await page.locator('#home-continue').isVisible())
    ? page.locator('#home-continue')
    : page.locator('#home-new');
  await button.click();
  await page.locator('#app').waitFor({ state: 'visible' });
}

/** Follow visible page navigation when a recipe needs an advanced home control. */
export async function showHomePage(page, target) {
  const screen = page.locator('#home-screen');
  if (await page.locator('#home-primary').count())
    await page.locator('#home-screen[data-page]').waitFor({ state: 'visible' });
  if (!(await screen.getAttribute('data-page'))) return; // Older release/standalone fixtures.
  if ((await screen.getAttribute('data-page')) === target) return;
  if (await page.locator('#home-back').isVisible()) await page.locator('#home-back').click();
  if (target === 'home') return;
  const buttons = {
    missions: 'home-expeditions',
    classic: 'home-classic',
    parents: 'home-parents',
    favorites: 'home-army',
  };
  await page.locator('#' + buttons[target]).click();
}

const LANGUAGE_PICKER = '#settings-dialog [data-language-picker]';

/** Open the settings window from whichever real button is on screen (home, parents or pause). */
export async function openSettings(page) {
  if (!(await page.locator('#settings-dialog').evaluate((d) => d.open)))
    await page
      .locator('#home-settings:visible, #pause-settings:visible, #home-sound:visible')
      .first()
      .click();
  await page.locator(LANGUAGE_PICKER).waitFor({ state: 'visible' });
}

/** Close the settings window with its own button. */
export async function closeSettings(page) {
  await page.locator('#settings-close').click();
  await page.locator('#settings-dialog').waitFor({ state: 'hidden' });
}

/** The language lives in one place, the settings window: open it, choose, close it. */
export async function chooseLanguage(page, language) {
  await openSettings(page);
  await page.locator(LANGUAGE_PICKER).selectOption(language);
  await page.waitForFunction(
    ([language, picker]) =>
      document.documentElement.lang === language && !document.querySelector(picker).disabled,
    [language, LANGUAGE_PICKER],
  );
  await closeSettings(page);
}

/**
 * Leave a battle the way a player does. A computer keeps the home button in the menu; a
 * landscape phone shows it in the top bar only once the game is over, and during a game
 * offers it in the pause panel.
 */
export async function leaveBattle(page) {
  const direct = page.locator('#menu-home:visible, #mobile-home:visible');
  if (await direct.count()) return direct.first().click();
  if (!(await page.locator('#pause-home').isVisible())) await page.locator('#pause').click();
  await page.locator('#pause-home').click();
}
