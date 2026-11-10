/** Use the real menu when a test targets the battle screen. No production bypass. */
export async function enterBattle(page, { allowDialog = false } = {}) {
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
  if (allowDialog) await button.evaluate((b) => b.click());
  else await button.click();
  await page.locator('#app').waitFor({ state: 'visible' });
}

/** Follow visible page navigation when a recipe needs an advanced home control. */
export async function showHomePage(page, target) {
  const screen = page.locator('#home-screen');
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
