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
  const button = (await page.locator('#home-continue').isVisible())
    ? page.locator('#home-continue')
    : page.locator('#home-new');
  if (allowDialog) await button.evaluate((b) => b.click());
  else await button.click();
  await page.locator('#app').waitFor({ state: 'visible' });
}
