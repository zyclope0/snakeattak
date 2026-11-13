import assert from 'node:assert/strict';
import { chooseLanguage, leaveBattle, showHomePage } from '../tests/browser-entry.mjs';
import { HELP_CLOSE, HELP_TOPICS } from '../src/ui/helpTopics.ts';
import { english } from '../src/i18n/english.ts';

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
// The three "?" of the preparation, each in its view.
const preparationHelp = [
  ['caprices', 'caprices'],
  ['scouting', 'scouting'],
  ['options', 'departure'],
];

/**
 * The small "?" help points, in the real game: each one is a whole 48 px target inside the
 * safe area, opens its bubble over the screen below, the bubble fits and closes with its
 * button and with Escape, the focus returns to the "?", and the preparation, the parents
 * page and a pause are found exactly as they were left.
 */
export async function checkHelpPoints({ pageAt, check, capture, portrait }) {
  const settle = (page) =>
    page.evaluate(
      () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
    );
  async function openAt(w, h, insets, language) {
    const page = await pageAt(w, h);
    if (insets)
      await page.evaluate((margins) => {
        for (const [side, value] of Object.entries(margins))
          document.documentElement.style.setProperty(`--safe-area-inset-${side}`, `${value}px`);
      }, insets);
    if (language === 'en') await chooseLanguage(page, 'en');
    return page;
  }
  const preparationState = (page) =>
    page.locator('#mission-dialog').evaluate((dialog) => {
      const body = dialog.querySelector('.mission-dialog-body');
      const launch = dialog.querySelector('#mission-launch').getBoundingClientRect();
      const hit = document.elementFromPoint(
        launch.left + launch.width / 2,
        launch.top + launch.height / 2,
      );
      return {
        open: dialog.open,
        modal: dialog.matches(':modal'),
        view: dialog.dataset.preparationView,
        run: dialog.dataset.run,
        overflow: body.scrollHeight - body.clientHeight,
        sideways: body.scrollWidth - body.clientWidth,
        frame: dialog.getBoundingClientRect().toJSON(),
        launch: launch.toJSON(),
        launchOnTop: hit?.id === 'mission-launch',
      };
    });
  const parentsState = (page) =>
    page.evaluate(() => {
      const options = document.querySelector('#home-parent-options');
      return {
        page: document.querySelector('#home-screen').dataset.page,
        overflow: options.scrollHeight - options.clientHeight,
        family: document.querySelector('#home-family').getBoundingClientRect().toJSON(),
        code: document.querySelector('#departure-input').getBoundingClientRect().toJSON(),
        dialogs: document.querySelectorAll('dialog[open]').length,
      };
    });

  /** One "?": its target, its bubble, both ways out, and the screen below left untouched. */
  async function exercise(page, topic, { where, language, safe, under, state }) {
    const help = HELP_TOPICS[topic];
    const say = (text) => (language === 'en' ? english[text] : text);
    const point = page.locator(`.help-point[data-help="${topic}"]`);
    check((await point.count()) === 1 && (await point.isVisible()), `${where}: one "?" in view`);
    const target = await point.evaluate((node) => {
      const r = node.getBoundingClientRect();
      const mine = ([fx, fy]) => {
        const hit = document.elementFromPoint(r.left + r.width * fx, r.top + r.height * fy);
        return !!hit && node.contains(hit);
      };
      return {
        rect: r.toJSON(),
        // The centre, the four corners and the middle of each edge all answer to the "?".
        whole: [
          [0.5, 0.5],
          [0.1, 0.1],
          [0.9, 0.1],
          [0.1, 0.9],
          [0.9, 0.9],
          [0.5, 0.03],
          [0.5, 0.97],
          [0.03, 0.5],
          [0.97, 0.5],
        ].every(mine),
        name: node.getAttribute('aria-label'),
        type: node.type,
        mark: node.textContent,
      };
    });
    const inSafeArea = (r) =>
      r.left >= safe.left - 0.5 &&
      r.top >= safe.top - 0.5 &&
      r.right <= safe.right + 0.5 &&
      r.bottom <= safe.bottom + 0.5;
    check(
      target.rect.width >= 47.99 && target.rect.height >= 47.99,
      `${where}: "?" is a 48 px target: ${JSON.stringify(target.rect)}`,
    );
    check(inSafeArea(target.rect), `${where}: "?" fully inside the safe area`);
    check(target.whole, `${where}: nothing covers or cuts the "?" target`);
    check(
      target.name === say(help.label) && target.type === 'button' && target.mark === '?',
      `${where}: "?" is a named button: ${target.name}`,
    );
    const before = await state(page);
    for (const way of ['button', 'Escape']) {
      await point.click();
      await page.locator('#help-bubble[open]').waitFor();
      const open = await page.evaluate(() => {
        const bubble = document.querySelector('#help-bubble');
        const frame = bubble.getBoundingClientRect();
        const close = bubble.querySelector('#help-bubble-close');
        const c = close.getBoundingClientRect();
        const hit = document.elementFromPoint(c.left + c.width / 2, c.top + c.height / 2);
        return {
          bubbles: document.querySelectorAll('#help-bubble').length,
          modal: bubble.matches(':modal'),
          opened: [...document.querySelectorAll('dialog[open]')].map((node) => node.id),
          topic: bubble.dataset.help,
          frame: frame.toJSON(),
          scroll: bubble.scrollHeight - bubble.clientHeight,
          title: bubble.querySelector('#help-bubble-title').textContent,
          named: bubble.getAttribute('aria-labelledby'),
          text: [...bubble.querySelectorAll('#help-bubble-text p')].map((p) => p.textContent),
          buttons: bubble.querySelectorAll('button').length,
          close: {
            text: close.textContent,
            rect: c.toJSON(),
            onTop: close.contains(hit),
            inFrame:
              c.top >= frame.top &&
              c.bottom <= frame.bottom &&
              c.left >= frame.left &&
              c.right <= frame.right,
          },
          focus: document.activeElement?.id,
        };
      });
      check(
        open.bubbles === 1 && open.modal && open.topic === topic,
        `${where}: a single modal bubble opens on its topic`,
      );
      assert.deepEqual(open.opened, [...under, 'help-bubble'], `${where}: windows open`);
      check(true, `${where}: the bubble opens over what was open, closing nothing`);
      check(
        open.title === say(help.title) && open.named === 'help-bubble-title',
        `${where}: bubble title: ${open.title}`,
      );
      assert.deepEqual(open.text, help.text.map(say), `${where}: bubble text`);
      check(open.text.length >= 1 && open.text.length <= 2, `${where}: one or two paragraphs`);
      check(
        inSafeArea(open.frame) && open.scroll <= 1,
        `${where}: bubble fits inside the safe area without scrolling: ${JSON.stringify(open.frame)}`,
      );
      check(
        open.buttons === 1 &&
          open.close.text === say(HELP_CLOSE) &&
          open.close.onTop &&
          open.close.inFrame &&
          open.close.rect.width >= 48 &&
          open.close.rect.height >= 48,
        `${where}: the only button closes the bubble and is a reachable 48 px target`,
      );
      check(open.focus === 'help-bubble-close', `${where}: focus enters the bubble`);
      if (way === 'button') await page.locator('#help-bubble-close').click();
      else await page.keyboard.press('Escape');
      await page.locator('#help-bubble').waitFor({ state: 'hidden' });
      await settle(page);
      check(
        await point.evaluate((node) => node === document.activeElement),
        `${where}: ${way} returns the focus to the "?"`,
      );
      assert.deepEqual(await state(page), before, `${where}: screen below after ${way}`);
      check(true, `${where}: ${way} leaves the screen below as it was`);
    }
  }

  for (const language of ['fr', 'en'])
    for (const [w, h, insets] of grid) {
      const size = `${w}×${h}${insets ? ' with system margins' : ''} ${language}`;
      const safe = {
        left: insets?.left ?? 0,
        top: insets?.top ?? 0,
        right: w - (insets?.right ?? 0),
        bottom: h - (insets?.bottom ?? 0),
      };
      const page = await openAt(w, h, insets, language);
      await showHomePage(page, 'parents');
      for (const topic of ['family', 'code'])
        await exercise(page, topic, {
          where: `parents ${topic} ${size}`,
          language,
          safe,
          under: [],
          state: parentsState,
        });
      if (!insets) await capture(page, `help-parents-${w}x${h}-${language}`);
      await showHomePage(page, 'home');
      await showHomePage(page, 'missions');
      await page.locator('#home-play').click();
      await page.locator('#mission-dialog[open]').waitFor();
      for (const [view, topic] of preparationHelp) {
        await page.locator(`#mission-dialog [data-preparation="${view}"]`).click();
        await exercise(page, topic, {
          where: `preparation ${view} ${size}`,
          language,
          safe,
          under: ['mission-dialog'],
          state: preparationState,
        });
        const after = await preparationState(page);
        check(
          after.open && after.modal && after.view === view && after.launchOnTop,
          `preparation ${view} still open on its view with its departure in reach at ${size}`,
        );
        if (!insets) await capture(page, `help-preparation-${view}-${w}x${h}-${language}`);
      }
      if (w === 812 && language === 'fr') {
        await page.locator('.help-point[data-help="departure"]').click();
        await page.locator('#help-bubble[open]').waitFor();
        await capture(page, 'help-bubble-812x375-fr');
        await page.locator('#help-bubble-close').click();
      }
      if (w === 780 && !insets) {
        // A phone turned upright while a bubble is open over the preparation: the notice
        // covers both windows, nothing closes, and the bubble does not keep the notice.
        await page.locator('[data-preparation="caprices"]').click();
        await page.locator('.help-point[data-help="caprices"]').click();
        await page.locator('#help-bubble[open]').waitFor();
        await portrait(page, '#help-bubble', 'help-bubble-' + language);
        check(
          await page.locator('#mission-dialog').evaluate((d) => d.open),
          'preparation stays open under the bubble during rotation ' + language,
        );
        await page.locator('#help-bubble-close').click();
        await settle(page);
        check(
          await page
            .locator('.help-point[data-help="caprices"]')
            .evaluate((node) => node === document.activeElement),
          'focus returns to the "?" after a rotation ' + language,
        );
        check(
          await page.evaluate(
            () =>
              !document.querySelector('#orientation-notice').closest('dialog') &&
              document.querySelector('#help-bubble').children.length === 3,
          ),
          'the turn-your-phone notice leaves the closed bubble ' + language,
        );
        check(
          (await preparationState(page)).view === 'caprices',
          'preparation keeps its view after a rotation under a bubble ' + language,
        );
      }
      // The preparation still does its job: the departure starts the mission.
      await page.locator('#mission-launch').click();
      await page.locator('#start').waitFor({ state: 'visible' });
      check(
        (await page.locator('dialog[open]').count()) === 0,
        `preparation launches its mission after the help at ${size}`,
      );
      await page.close();
    }

  // A pause is never lost nor created by the help: a paused mission left for the home is
  // still paused after bubbles were opened on the parents page and over the preparation.
  const phone = await openAt(780, 360, null, 'fr');
  await phone.locator('#home-primary').click();
  await phone.locator('#start').waitFor({ state: 'visible' });
  await phone.locator('#pause').click();
  check(await phone.locator('#pause-overlay').isVisible(), 'mission paused before the help');
  await leaveBattle(phone);
  const phase = () => phone.locator('#phase').evaluate((node) => node.textContent);
  check((await phase()) === 'EN PAUSE', 'pause kept on the way home');
  await showHomePage(phone, 'parents');
  for (const way of ['button', 'Escape']) {
    await phone.locator('.help-point[data-help="family"]').click();
    await phone.locator('#help-bubble[open]').waitFor();
    check((await phase()) === 'EN PAUSE', 'opening a bubble keeps the pause');
    if (way === 'button') await phone.locator('#help-bubble-close').click();
    else await phone.keyboard.press('Escape');
    await phone.locator('#help-bubble').waitFor({ state: 'hidden' });
    await settle(phone);
    check((await phase()) === 'EN PAUSE', `closing a bubble with ${way} keeps the pause`);
  }
  await showHomePage(phone, 'home');
  await showHomePage(phone, 'missions');
  await phone.locator('#home-play').click();
  await phone.locator('#mission-dialog[open]').waitFor();
  await phone.locator('[data-preparation="scouting"]').click();
  await phone.locator('.help-point[data-help="scouting"]').click();
  await phone.locator('#help-bubble[open]').waitFor();
  await phone.keyboard.press('Escape');
  await phone.locator('#help-bubble').waitFor({ state: 'hidden' });
  check(
    (await phone.locator('#mission-dialog').getAttribute('data-preparation-view')) === 'scouting',
    'Escape closes the bubble only, not the view below',
  );
  await phone.locator('#mission-close').click();
  check((await phase()) === 'EN PAUSE', 'pause kept under the preparation and its bubble');
  await showHomePage(phone, 'home');
  await phone.locator('#home-primary').click();
  await phone.locator('#app').waitFor({ state: 'visible' });
  check(
    (await phone.locator('#pause-overlay').isVisible()) && (await phase()) === 'EN PAUSE',
    'the mission resumes still paused after the help',
  );
  await phone.close();
  // And the other way round: a mission that was not paused is not paused by the help.
  const desk = await openAt(1280, 800, null, 'fr');
  await desk.locator('#home-primary').click();
  await desk.locator('#start').waitFor({ state: 'visible' });
  await leaveBattle(desk);
  const deskPhase = () => desk.locator('#phase').evaluate((node) => node.textContent);
  check((await deskPhase()) === 'PRÉPARATION', 'mission left for the home without a pause');
  await showHomePage(desk, 'parents');
  await desk.locator('.help-point[data-help="code"]').click();
  await desk.locator('#help-bubble[open]').waitFor();
  check((await deskPhase()) === 'PRÉPARATION', 'opening a bubble does not pause');
  await desk.locator('#help-bubble-close').click();
  await settle(desk);
  await showHomePage(desk, 'home');
  await desk.locator('#home-primary').click();
  await desk.locator('#app').waitFor({ state: 'visible' });
  check(
    !(await desk.locator('#pause-overlay').isVisible()) && (await deskPhase()) === 'PRÉPARATION',
    'the mission resumes unpaused after the help',
  );
  await desk.close();
}
