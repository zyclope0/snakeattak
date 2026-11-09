/** Follow the actual disclosure controls when older scenarios need advanced tools. */
export async function revealControl(page, selector) {
  if (
    (await page.locator(selector).count()) &&
    (await page.locator(selector).evaluate((e) => !!e.closest('#reinforcements'))) &&
    !(await page.locator('#reinforcements').isVisible())
  )
    await page
      .locator('#dock-catalogue:visible, #result-allies:visible, #reinforcements-toggle:visible')
      .first()
      .click();
  const ancestors = page.locator('details').filter({ has: page.locator(selector) });
  for (const detail of await ancestors.all())
    if (!(await detail.evaluate((e) => e.open))) await detail.locator(':scope > summary').click();
}
