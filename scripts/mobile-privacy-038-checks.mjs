import { chooseLanguage, showHomePage } from '../tests/browser-entry.mjs';
import { PRIVACY_POLICY } from '../src/i18n/privacyPolicy.ts';
import { PUBLIC_PRIVACY_URL } from '../src/site.ts';

// Android's system margins as the other recipes simulate them: status bar, camera cut-out,
// gesture bar.
const systemBars = { top: 30, right: 48, bottom: 24, left: 48 };
const grid = [
  [568, 320, null],
  [780, 360, null],
  [780, 360, systemBars],
  [812, 375, null],
  [915, 412, null],
  [1280, 800, null],
];
const NAME = { fr: 'Confidentialité', en: 'Privacy policy' };
const CLOSE = { fr: 'Fermer', en: 'Close' };

/** What the window must show, block after block, straight from the approved source. */
function expected(language) {
  const policy = PRIVACY_POLICY[language];
  const words = (parts) =>
    parts.map((part) => (typeof part === 'string' ? part : (part.b ?? part.a))).join('');
  return [
    policy.title,
    words(policy.scope),
    policy.updated,
    ...policy.sections.flatMap((section) => [section.heading, ...section.paragraphs.map(words)]),
    policy.publicLink,
  ];
}

/**
 * « Confidentialité » on the parents' page, in the real game: a whole 48 px button beside the
 * others, loaded only when touched; a window that shows the approved words of the chosen
 * language, scrolls under a finger while its heading and its button stay in place, ends with
 * the link to the public page, closes with its button and with Escape, and asks nothing of
 * the network outside the game.
 */
export async function checkPrivacy({ pageAt, check, capture, url }) {
  const settle = (page) =>
    page.evaluate(
      () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
    );
  const doorState = (page) =>
    page.evaluate(() => {
      const door = document.querySelector('#home-privacy');
      const box = door.getBoundingClientRect();
      const overlap = (other) => {
        const o = other.getBoundingClientRect();
        return (
          box.left < o.right - 1 &&
          o.left < box.right - 1 &&
          box.top < o.bottom - 1 &&
          o.top < box.bottom - 1
        );
      };
      return {
        words: door.innerText.trim(),
        size: [Math.round(box.width), Math.round(box.height)],
        inside:
          box.left >= 0 && box.top >= 0 && box.right <= innerWidth && box.bottom <= innerHeight,
        cut: door.scrollWidth > door.clientWidth + 1 || door.scrollHeight > door.clientHeight + 1,
        over: [...door.parentElement.children]
          .filter((n) => n !== door && overlap(n))
          .map((n) => n.id),
        loaded: !!document.querySelector('#privacy-dialog'),
        pageOverflow: document.documentElement.scrollWidth - innerWidth,
      };
    });
  const windowState = (page) =>
    page.evaluate(() => {
      const dialog = document.querySelector('#privacy-dialog');
      const body = dialog.querySelector('#privacy-body');
      const article = body.querySelector('article');
      const close = dialog.querySelector('#privacy-close').getBoundingClientRect();
      const frame = dialog.getBoundingClientRect();
      const view = body.getBoundingClientRect();
      const style = getComputedStyle(document.documentElement);
      const safe = (side) => parseFloat(style.getPropertyValue(`--app-safe-${side}`)) || 0;
      const link = article.querySelector('.privacy-public a');
      const linkBox = link.getBoundingClientRect();
      return {
        open: dialog.open,
        modal: dialog.matches(':modal'),
        title: dialog.querySelector('#privacy-title').innerText.trim(),
        closeWords: dialog.querySelector('#privacy-close').innerText.trim(),
        language: article.lang,
        raw: article.hasAttribute('data-copy-raw'),
        blocks: [...article.children].map((node) => node.textContent),
        frameInside:
          frame.left >= safe('left') - 0.5 &&
          frame.top >= safe('top') - 0.5 &&
          frame.right <= innerWidth - safe('right') + 0.5 &&
          frame.bottom <= innerHeight - safe('bottom') + 0.5,
        closeSize: [Math.round(close.width), Math.round(close.height)],
        closeInside:
          close.top >= frame.top && close.bottom <= frame.bottom && close.right <= frame.right,
        closeAboveText: close.bottom <= view.top + 1,
        scrolls: body.scrollHeight - body.clientHeight,
        sideways: body.scrollWidth - body.clientWidth,
        top: Math.round(body.scrollTop),
        textSize: parseFloat(getComputedStyle(article.querySelector('h4 + p')).fontSize),
        link: {
          href: link.href,
          target: link.target,
          rel: link.rel,
          height: Math.round(linkBox.height),
          shown: linkBox.top >= view.top - 1 && linkBox.bottom <= view.bottom + 1,
        },
        links: [...article.querySelectorAll('a')].map((a) => [a.href, a.target, a.rel]),
        focus: document.activeElement?.id,
      };
    });
  /** A finger drags the text up, as on a phone. */
  async function swipeUp(page) {
    const box = await page.locator('#privacy-body').boundingBox();
    const client = await page.context().newCDPSession(page);
    const x = box.x + box.width / 2;
    const from = box.y + box.height * 0.8;
    const touch = (type, y) =>
      client.send('Input.dispatchTouchEvent', {
        type,
        touchPoints: type === 'touchEnd' ? [] : [{ x, y }],
      });
    await touch('touchStart', from);
    for (let step = 1; step <= 8; step++)
      await touch('touchMove', from - step * (box.height * 0.08));
    await touch('touchEnd');
    await client.detach();
    await page.waitForTimeout(250);
  }

  for (const language of ['fr', 'en'])
    for (const [w, h, insets] of grid) {
      const where = `${w}×${h}${insets ? ' with system bars' : ''} ${language}`;
      const page = await pageAt(w, h);
      const outside = [];
      page.on('request', (request) => {
        if (!request.url().startsWith(url) && !request.url().startsWith('data:'))
          outside.push(request.url());
      });
      if (insets)
        await page.evaluate((margins) => {
          for (const [side, value] of Object.entries(margins))
            document.documentElement.style.setProperty(`--safe-area-inset-${side}`, `${value}px`);
        }, insets);
      if (language === 'en') await chooseLanguage(page, 'en');
      await showHomePage(page, 'parents');
      await settle(page);

      const door = await doorState(page);
      check(
        door.words === NAME[language] && !door.cut && door.inside && !door.over.length,
        `privacy ${where}: the button is named and whole among the parents' buttons: ${JSON.stringify(door)}`,
      );
      check(
        door.size[0] >= 48 && door.size[1] >= 48 && door.pageOverflow <= 0,
        `privacy ${where}: the button is a 48 px target and the page does not overflow: ${JSON.stringify(door)}`,
      );
      check(!door.loaded, `privacy ${where}: the policy is not loaded before it is asked for`);

      await page.locator('#home-privacy').click();
      await page.locator('#privacy-dialog[open]').waitFor();
      await settle(page);
      let state = await windowState(page);
      check(
        state.open &&
          state.modal &&
          state.title === NAME[language] &&
          state.closeWords === CLOSE[language],
        `privacy ${where}: the window opens over the page with its name and its button: ${JSON.stringify(state)}`,
      );
      check(
        state.language === language &&
          state.raw &&
          JSON.stringify(state.blocks) === JSON.stringify(expected(language)),
        `privacy ${where}: the approved words of the chosen language, all of them: ${JSON.stringify(state.blocks)}`,
      );
      check(
        state.frameInside &&
          state.closeInside &&
          state.closeAboveText &&
          state.closeSize[0] >= 48 &&
          state.closeSize[1] >= 48,
        `privacy ${where}: the window keeps inside the screen, its button whole above the text: ${JSON.stringify(state)}`,
      );
      check(
        state.scrolls > 0 && state.sideways <= 1 && state.top === 0 && state.textSize >= 15,
        `privacy ${where}: the text starts at its top, scrolls down only, in readable size: ${JSON.stringify(state)}`,
      );
      check(
        state.focus === 'privacy-close',
        `privacy ${where}: the focus is on the button that closes: ${state.focus}`,
      );

      // A finger scrolls the text; the heading and the button do not move.
      await swipeUp(page);
      const moved = await windowState(page);
      check(
        moved.top > 0 && moved.closeInside && moved.closeAboveText && moved.frameInside,
        `privacy ${where}: a finger scrolls the text under a heading that stays: ${JSON.stringify(moved)}`,
      );
      // The end of the text: the link to the public page, a whole target, opened outside.
      await page.locator('#privacy-body').evaluate((body) => body.scrollTo(0, body.scrollHeight));
      await settle(page);
      state = await windowState(page);
      check(
        state.link.shown &&
          state.link.height >= 48 &&
          state.link.href === PUBLIC_PRIVACY_URL &&
          state.links.every(([, target, rel]) => target === '_blank' && /noopener/.test(rel)),
        `privacy ${where}: the text ends with the link to the public page: ${JSON.stringify(state.link)}`,
      );
      if (w === 780 && !insets) await capture(page, `privacy-end-${w}x${h}-${language}`);

      // Closed with its button, the focus goes back to the button of the page; then Escape.
      await page.locator('#privacy-close').click();
      await settle(page);
      check(
        !(await page.locator('#privacy-dialog').evaluate((dialog) => dialog.open)) &&
          (await page.evaluate(() => document.activeElement?.id)) === 'home-privacy',
        `privacy ${where}: « ${CLOSE[language]} » closes and gives the focus back`,
      );
      await page.locator('#home-privacy').click();
      await page.locator('#privacy-dialog[open]').waitFor();
      check(
        (await windowState(page)).top === 0,
        `privacy ${where}: opened again, the text is back at its top`,
      );
      await page.keyboard.press('Escape');
      await settle(page);
      check(
        !(await page.locator('#privacy-dialog').evaluate((dialog) => dialog.open)) &&
          (await page.locator('#home-screen').getAttribute('data-page')) === 'parents',
        `privacy ${where}: Escape closes the window and the parents' page is still there`,
      );

      // The other language, in the same window, once the game has changed language.
      if (w === 812) {
        const other = language === 'fr' ? 'en' : 'fr';
        await chooseLanguage(page, other);
        await page.locator('#home-privacy').click();
        await page.locator('#privacy-dialog[open]').waitFor();
        const turned = await windowState(page);
        check(
          turned.title === NAME[other] &&
            turned.language === other &&
            JSON.stringify(turned.blocks) === JSON.stringify(expected(other)) &&
            (await page.locator('#privacy-dialog').count()) === 1,
          `privacy ${where}: the window follows the language of the game: ${JSON.stringify(turned.blocks.slice(0, 3))}`,
        );
        await page.locator('#privacy-close').click();
      }
      check(!outside.length, `privacy ${where}: nothing is asked outside the game: ${outside}`);
      await page.close();
    }
}
