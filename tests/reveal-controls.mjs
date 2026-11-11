/** Follow the actual disclosure controls when older scenarios need advanced tools. */
export async function revealControl(page, selector) {
  if (
    (await page.locator(selector).count()) &&
    (await page.locator('#reinforcements[open]').count()) &&
    !(await page.locator(selector).evaluate((e) => !!e.closest('#reinforcements, dialog[open]')))
  )
    await page.locator('#reinforcements-close').click();
  if (
    (await page.locator(selector).count()) &&
    (await page.locator(selector).evaluate((e) => !!e.closest('#reinforcements'))) &&
    !(await page.locator('#reinforcements').isVisible())
  )
    await page
      .locator('#dock-catalogue:visible, #result-allies:visible, #reinforcements-toggle:visible')
      .first()
      .click();
  if (await page.locator(selector).count()) {
    const view = await page
      .locator(selector)
      .first()
      .evaluate((e) => e.closest('.preparation-view')?.id);
    if (view && !(await page.locator('#' + view).isVisible()))
      await page.locator(`[data-preparation][aria-controls="${view}"]`).click();
    const ally = await page
      .locator(selector)
      .first()
      .evaluate((e) => e.closest('#shop .unit-card')?.dataset.kind);
    if (ally && !(await page.locator(selector).first().isVisible())) {
      await page.locator('#shop-family').selectOption('all');
      const locked = await page
        .locator(selector)
        .first()
        .evaluate((e) => e.closest('.unit-card').dataset.state === 'locked');
      await page.locator(locked ? '#shop-future' : '#shop-ready').click();
      while (
        !(await page.locator(selector).first().isVisible()) &&
        !(await page.locator('#catalog-next').isDisabled())
      )
        await page.locator('#catalog-next').click();
    }
  }
  const ancestors = page.locator('details').filter({ has: page.locator(selector) });
  for (const detail of await ancestors.all())
    if (!(await detail.evaluate((e) => e.open))) await detail.locator(':scope > summary').click();
}
