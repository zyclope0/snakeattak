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
    // The catalogue has no pages and no family list: a card is shown as soon as its tab is.
    if (ally && !(await page.locator(selector).first().isVisible())) {
      const locked = await page
        .locator(selector)
        .first()
        .evaluate((e) => e.closest('.unit-card').dataset.state === 'locked');
      await page.locator(locked ? '#shop-future' : '#shop-ready').click();
    }
  }
  const ancestors = page.locator('details').filter({ has: page.locator(selector) });
  for (const detail of await ancestors.all())
    if (!(await detail.evaluate((e) => e.open))) await detail.locator(':scope > summary').click();
}

/**
 * What the open catalogue shows now: the cards of the pressed tab, all at once, with their
 * size and whether each sits whole inside the scrolling body; the number each tab announces;
 * how far the body can still scroll.
 */
export async function catalogueView(page) {
  return page.evaluate(() => {
    const body = document.querySelector('#reinforcements .catalog-body');
    const frame = body.getBoundingClientRect();
    const announced = (id) =>
      Number(document.getElementById(id).textContent.match(/\((\d+)\)/)?.[1]);
    return {
      tab: ['shop-ready', 'shop-future'].filter(
        (id) => document.getElementById(id).getAttribute('aria-pressed') === 'true',
      ),
      ready: announced('shop-ready'),
      future: announced('shop-future'),
      scrollRange: body.scrollHeight - body.clientHeight,
      scrollTop: body.scrollTop,
      columns: getComputedStyle(document.getElementById('shop')).gridTemplateColumns.split(' ')
        .length,
      cards: [...document.querySelectorAll('#shop .unit-card')]
        .filter((card) => card.getClientRects().length)
        .map((card) => {
          const r = card.getBoundingClientRect();
          return {
            kind: card.dataset.kind,
            state: card.dataset.state,
            width: r.width,
            height: r.height,
            inBody:
              r.top >= frame.top - 0.5 &&
              r.bottom <= frame.bottom + 0.5 &&
              r.left >= frame.left - 0.5 &&
              r.right <= frame.right + 0.5,
          };
        }),
    };
  });
}

/** The old pager and family list: none of them may come back. */
export const REMOVED_CATALOGUE_CONTROLS =
  '#shop-family, #catalog-previous, #catalog-page, #catalog-next, .catalog-pagination';
