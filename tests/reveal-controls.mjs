/** Follow the actual disclosure controls when older scenarios need advanced tools. */
export async function revealControl(page, selector) {
  const ancestors = page.locator('details').filter({ has: page.locator(selector) });
  for (const detail of await ancestors.all())
    if (!(await detail.evaluate((e) => e.open))) await detail.locator(':scope > summary').click();
}
