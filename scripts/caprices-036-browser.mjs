import { revealControl } from '../tests/reveal-controls.mjs';
import { chooseLanguage, leaveBattle, showHomePage } from '../tests/browser-entry.mjs';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';
import { Game } from '../src/game.ts';
import { createMissionRun, MISSIONS } from '../src/missions.ts';
import { createMissionProgress } from '../src/missionProgress.ts';
import { createCareer } from '../src/progression.ts';
import { createCapriceAlbumsController } from '../src/capriceAlbums.ts';
import { writeFamilyBackup } from '../src/familyBackup.ts';
import { encodeDeparture } from '../src/departures.ts';
const folder = process.env.CAPRICES_REPORT_DIR ?? 'artifacts/caprices-036';
const fixture = '.caprices-036-fixture.html';
let dev, preview, browser;
const errors = [];
let checks = 0;
const captures = [];
const check = (condition, label) => {
  assert.ok(condition, label);
  checks++;
};
async function ready(url) {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await delay(100);
  }
  throw Error('Server unavailable');
}
const familyKey = 'conquete-serpents:family:v1';
// Books can no longer be created or renamed in the interface: a family that already has
// several keeps them in its save, which is how these controlled states get theirs.
function controlled(moreBooks = []) {
  const progress = createMissionProgress();
  for (const m of MISSIONS) progress.bestStars[m.id] = 3;
  const albums = createCapriceAlbumsController();
  albums.rename('child-1', 'A');
  albums.add('B');
  for (const name of moreBooks) albums.add(name);
  albums.select('child-1');
  return writeFamilyBackup(null, createCareer().state, progress, albums.state);
}
async function pageAt(width = 1280, height = 800, locale = 'fr', controlledFamily = true) {
  const page = await browser.newPage({
    viewport: { width, height },
    locale: locale === 'en' ? 'en-GB' : 'fr-CH',
    hasTouch: width < 1000,
  });
  page.on('pageerror', (e) => errors.push(e.message));
  if (controlledFamily)
    await page.addInitScript(
      ({ key, raw, locale }) => {
        if (!sessionStorage.getItem('seeded')) {
          localStorage.setItem(key, raw);
          localStorage.setItem('conquete-serpents:language:v1', locale);
          sessionStorage.setItem('seeded', '1');
        }
      },
      {
        key: familyKey,
        raw: typeof controlledFamily === 'string' ? controlledFamily : controlled(),
        locale,
      },
    );
  await page.goto('http://127.0.0.1:4373');
  await page.locator('#home-screen').waitFor({ state: 'visible' });
  await page.locator('#home-caprice-album').waitFor();
  return page;
}
const saved = (page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), familyKey);
async function shot(page, name) {
  const path = `${folder}/${name}.png`;
  await page.screenshot({ path });
  captures.push(path);
}
async function onScreen(locator, page, label) {
  const box = await locator.boundingBox();
  const view = page.viewportSize();
  check(
    box &&
      box.x >= -1 &&
      box.y >= -1 &&
      box.x + box.width <= view.width + 1 &&
      box.y + box.height <= view.height + 1,
    label + ' reachable',
  );
  check(box.height >= 47, label + ' 48px');
}
async function prepare(page, id = 'refuge', caprice = 'refuge-petit') {
  await showHomePage(page, 'missions');
  await page.locator(`[data-mission-card="${id}"]`).click();
  await page.locator('[data-preparation="caprices"]').click();
  await page.locator(`[data-caprice="${caprice}"]`).click();
}
async function fixturePage(mode, width = 1280, height = 800, extra = '', locale = 'fr') {
  const page = await browser.newPage({ viewport: { width, height }, locale: 'fr-CH' });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(
    (language) => localStorage.setItem('conquete-serpents:language:v1', language),
    locale,
  );
  await page.goto(`http://127.0.0.1:4374/${fixture}?case=${mode}${extra}`);
  await page.waitForFunction(() => !!window.capricesFixture);
  return page;
}
try {
  await mkdir(folder, { recursive: true });
  const built = spawnSync('npm', ['run', 'build'], { encoding: 'utf8' });
  await writeFile(`${folder}/build.log`, built.stdout + built.stderr);
  assert.equal(built.status, 0, 'fresh production build');
  await writeFile(
    fixture,
    (await readFile('index.html', 'utf8')).replace(
      '/src/main.ts',
      '/tests/caprices-036-harness.ts',
    ),
  );
  preview = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '4373',
    '--strictPort',
  ]);
  dev = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    '--host',
    '127.0.0.1',
    '--port',
    '4374',
    '--strictPort',
  ]);
  await Promise.all([ready('http://127.0.0.1:4373'), ready('http://127.0.0.1:4374')]);
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  // Final F1/F2: test the actual presentation in both languages without advancing Game.
  const polishFailures = [];
  const polishCheck = (condition, label) => {
    if (!condition) polishFailures.push(label);
    else checks++;
  };
  for (const [width, height] of [
    [1280, 800],
    [568, 320],
  ])
    for (const locale of ['fr', 'en']) {
      const p = await pageAt(width, height, locale);
      await prepare(p, 'sonnette', 'sonnette-petit');
      const announce = p.locator('#caprice-announce');
      polishCheck(
        (await announce.textContent()) === "Choisis deux sortes d'alliés !",
        'F1 exact French announcement ' + width + locale,
      );
      polishCheck(
        (await announce.getAttribute('lang')) === 'fr',
        'F1 French language attribution ' + width + locale,
      );
      const icon = p.locator('.caprice-announcement > svg');
      polishCheck(
        (await icon.count()) === 1 && (await icon.getAttribute('aria-hidden')) === 'true',
        'F1 separate decorative icon ' + width + locale,
      );
      polishCheck(
        (await announce.locator('svg').count()) === 0,
        'F1 no graphic inside canonical text ' + width + locale,
      );
      if (await icon.count()) {
        await announce.scrollIntoViewIfNeeded();
        const a = await announce.boundingBox(),
          i = await icon.boundingBox();
        polishCheck(
          i &&
            a &&
            i.width >= 24 &&
            i.width <= 40 &&
            i.x + i.width <= a.x &&
            i.y < a.y + a.height &&
            a.y < i.y + i.height,
          'F1 compact icon beside visible announcement ' + width + locale,
        );
      }
      for (const id of ['mission-launch', 'mission-close'])
        await onScreen(p.locator('#' + id), p, 'F1 ' + id + width + locale);
      await p.locator('[data-preparation="options"]').click();
      await onScreen(p.locator('#mission-reroll'), p, 'reroll options ' + width + locale);
      await p.locator('[data-preparation="caprices"]').click();
      await shot(p, 'final-icon-' + width + '-' + locale);
      await p.close();
      const bank = await fixturePage('bank', width, height, '', locale);
      const dockClub = bank.locator('[data-dock-kind="club"]');
      polishCheck(
        (await dockClub.isVisible()) && (await dockClub.isDisabled()),
        'F2 dock reserve blocks purchase ' + width + locale,
      );
      polishCheck(
        (await dockClub.getAttribute('aria-label'))
          .toLowerCase()
          .includes(locale === 'en' ? 'protected bank reserve' : 'réserve bancaire protégée'),
        'F2 dock reserve reason ' + width + locale,
      );
      await bank.locator('#dock-catalogue:visible, #reinforcements-toggle:visible').first().click();
      const favorite = bank.locator('#shop [data-kind="club"]');
      await favorite.scrollIntoViewIfNeeded();
      polishCheck(
        (await favorite.isVisible()) && (await favorite.locator('small').isVisible()),
        'F2 favorite and status visible ' + width + locale,
      );
      await onScreen(favorite, bank, 'F2 favorite ' + width + locale);
      const reason = locale === 'en' ? 'Protected bank reserve' : 'Réserve bancaire protégée';
      polishCheck(await favorite.isDisabled(), 'F2 reserve blocks favorite ' + width + locale);
      polishCheck(
        (await favorite.getAttribute('aria-label')).toLowerCase().includes(reason.toLowerCase()),
        'F2 accessible reserve reason ' + width + locale,
      );
      polishCheck(
        (await favorite.locator('small').innerText()).includes(reason),
        'F2 visible reserve reason ' + width + locale,
      );
      polishCheck(
        (await favorite.getAttribute('aria-label')).includes('55'),
        'F2 accessible price retained ' + width + locale,
      );
      await shot(bank, 'final-reserve-favorites-' + width + '-' + locale);
      await bank.evaluate(() => {
        window.capricesFixture.session.game.gold = 600;
        window.capricesFixture.refresh();
      });
      polishCheck(
        (await favorite.isEnabled()) && !(await favorite.innerText()).includes(reason),
        'F2 reason clears when affordable ' + width + locale,
      );
      await bank.locator('#reinforcements-close').click();
      polishCheck(
        await dockClub.isEnabled(),
        'F2 dock enabled once reserve affordable ' + width + locale,
      );
      await bank.close();
    }
  assert.deepEqual(polishFailures, [], 'Final F1/F2 presentation regressions');
  // R1: pending choices must update preparation before launch; this fixture never advances Game.
  for (const locale of ['fr', 'en']) {
    const pending = await fixturePage('friends');
    const unchanged = await pending.evaluate(() =>
      JSON.stringify(window.capricesFixture.session.game),
    );
    await pending.evaluate(() => window.capricesFixture.home());
    if (locale === 'en') {
      await chooseLanguage(pending, 'en');
    }
    await prepare(pending, 'sonnette', 'sonnette-petit');
    check(
      (await pending.locator('#mission-advice').getAttribute('data-ally')) === 'archer',
      'R1 empty choice permits Archer ' + locale,
    );
    await pending.locator('[data-preparation="friends"]').click();
    await pending.locator('[data-caprice-friend="ninja"]').click();
    check(
      (await pending.locator('#mission-advice').getAttribute('data-ally')) === 'archer',
      'R1 partial choice permits Archer ' + locale,
    );
    await pending.locator('[data-preparation="friends"]').click();
    await pending.locator('[data-caprice-friend="medic"]').click();
    check(
      (await pending.locator('#mission-advice').getAttribute('data-ally')) === 'ninja',
      'R1 full Ninja Medic excludes Archer ' + locale,
    );
    await pending.locator('[data-preparation="options"]').click();
    check(
      /volants|Flying snakes/.test(await pending.locator('#mission-plan').innerText()),
      'R1 generic flying plan visible ' + locale,
    );
    check(
      !/archer|dragon|tank/i.test(await pending.locator('#mission-plan').innerText()),
      'R1 full generic flying plan excludes forbidden friends ' + locale,
    );
    check(
      (await pending.locator('#caprice-announce').innerText()) === "Choisis deux sortes d'alliés !",
      'R1 French announcement retained ' + locale,
    );
    await shot(pending, 'r1-advice-full-' + locale);
    await pending.locator('[data-preparation="friends"]').click();
    await pending.locator('[data-caprice-friend="medic"]').click();
    check(
      (await pending.locator('#mission-advice').getAttribute('data-ally')) === 'archer',
      'R1 deselection refreshes partial advice ' + locale,
    );
    await pending.locator('[data-preparation="options"]').click();
    check(
      /Archer|archers/.test(await pending.locator('#mission-plan').innerText()),
      'R1 partial generic plan restores permitted Archer ' + locale,
    );
    await pending.locator('[data-preparation="friends"]').click();
    await pending.locator('[data-caprice-friend="ninja"]').click();
    check(
      (await pending.locator('#mission-advice').getAttribute('data-ally')) === 'archer',
      'R1 cleared choice refreshes advice ' + locale,
    );
    check(
      (await pending.evaluate(() => JSON.stringify(window.capricesFixture.session.game))) ===
        unchanged,
      'R1 pending choices never mutate retained Game ' + locale,
    );
    await pending.close();
  }
  // Check visual regression first using a controlled completed fixture, not a played win.
  const resultVisual = await fixturePage('win');
  check(
    (await resultVisual.locator('#caprice-sticker-result svg').count()) === 1,
    'earned result shows actual sticker graphic',
  );
  check(
    (await resultVisual.locator('#caprice-sticker-result [lang="fr"]').innerText()) ===
      'Deux copains seulement',
    'result shows exact French challenge name',
  );
  const wonBook = await resultVisual.evaluate(() =>
    JSON.stringify(window.capricesFixture.albums.state.children),
  );
  await resultVisual.evaluate(() => {
    window.capricesFixture.refresh();
    window.capricesFixture.refresh();
  });
  check(
    (await resultVisual.evaluate(() =>
      JSON.stringify(window.capricesFixture.albums.state.children),
    )) === wonBook,
    'repeated refresh cannot duplicate sticker',
  );
  await resultVisual.close();
  const lossVisual = await fixturePage('loss');
  check(
    (await lossVisual.locator('#mission-result [lang="fr"]').innerText()) ===
      "Choisis deux sortes d'alliés !",
    'defeat repeats exact original French announcement',
  );
  check(
    await lossVisual.evaluate(() =>
      window.capricesFixture.albums.state.children.every((c) => c.completed.length === 0),
    ),
    'defeat earns no sticker',
  );
  await lossVisual.evaluate(() => window.capricesFixture.home());
  await chooseLanguage(lossVisual, 'en');
  check(
    (await lossVisual.locator('#mission-result [lang="fr"]').innerText()) ===
      "Choisis deux sortes d'alliés !",
    'English defeat keeps raw French announcement',
  );
  await lossVisual.close();
  const pauseBook = await fixturePage('honey');
  await pauseBook.locator('#pause').click();
  await pauseBook.locator('#menu-home').click();
  // A standalone fixture supplies home(), so exercise modal pause from battle directly.
  await pauseBook.evaluate(() => {
    window.capricesFixture.session.screen = 'battle';
    document.getElementById('app').hidden = false;
    document.getElementById('home-screen').hidden = true;
    window.capricesFixture.refresh();
  });
  await pauseBook.locator('#home-caprice-album').evaluate((n) => n.click());
  await pauseBook.keyboard.press('Escape');
  check(
    await pauseBook.evaluate(() => window.capricesFixture.session.game.paused),
    'closing notebook retains manual pause',
  );
  const beforeLocale = await pauseBook.evaluate(() =>
    JSON.stringify(window.capricesFixture.session.game),
  );
  // The pause panel leads to the settings window, where the language now lives.
  await chooseLanguage(pauseBook, 'en');
  check(
    (await pauseBook.locator('#pause-overlay').isVisible()) &&
      (await pauseBook.evaluate(() => window.capricesFixture.session.game.paused)),
    'settings opened from pause leave the game paused',
  );
  check(
    (await pauseBook.evaluate(() => JSON.stringify(window.capricesFixture.session.game))) ===
      beforeLocale,
    'locale change never mutates live game',
  );
  await pauseBook.locator('#pause').click();
  check(
    !(await pauseBook.evaluate(() => window.capricesFixture.session.game.paused)),
    'manual resume after notebook',
  );
  await pauseBook.close();
  // Production assembly, controlled valid family progression. All commands are native UI.
  if (!process.env.CAPRICES_SKIP_NATIVE) {
    const page = await pageAt();
    await prepare(page);
    check((await page.locator('.caprice-row').count()) === 2, 'two rows');
    const original = JSON.parse(await page.locator('#mission-dialog').getAttribute('data-run'));
    await page.locator('[data-preparation="options"]').click();
    await page.locator('#mission-reroll').click();
    check(
      JSON.parse(await page.locator('#mission-dialog').getAttribute('data-run')).caprice ===
        'refuge-petit',
      'reroll preserves caprice',
    );
    console.log('production preparation okay');
    // Known deterministic playable code; no battle state injection.
    await page.locator('#mission-close').click();
    await showHomePage(page, 'parents');
    await page.locator('#departure-input').fill(
      encodeDeparture({
        kind: 'mission',
        run: { ...createMissionRun('refuge', 42), caprice: 'refuge-petit' },
      }),
    );
    await page.locator('#departure-form button[type=submit]').click();
    await page.locator('#mission-launch').click();
    check(
      (await saved(page)).albums.campProfileId === 'child-1',
      'new A expedition captures owner',
    );
    await page.locator('#menu-home').click();
    await page.locator('#home-caprice-album').click();
    check((await page.locator('[data-sticker]').count()) === 36, '36 sticker slots');
    await page.locator('#caprice-album-profile').selectOption('child-2');
    await page.locator('#caprice-album-close').click();
    await showHomePage(page, 'classic');
    await page.locator('#home-new').click();
    if (await page.locator('#journey-confirm').isVisible())
      await page.locator('#journey-replace').click();
    check(
      (await saved(page)).albums.campProfileId === 'child-1',
      'classic retains A owner with B active',
    );
    await page.reload();
    await page.locator('#home-caprice-album').waitFor();
    await showHomePage(page, 'missions');
    await page.locator('#mission-continue').click();
    check((await saved(page)).albums.campProfileId === 'child-1', 'reload resume retains A');
    console.log('production owner survived classic/reload/resume');
    await page.locator('#speed').click();
    // Native clock drives the real Scene and Game. Initial trio can win refuge seed42.
    await page.clock.install();
    for (let wave = 0; wave < 3; wave++) {
      console.log('playing wave', wave + 1);
      await page.locator('#start').click();
      for (let step = 0; step < 120; step++) {
        await page.clock.runFor(1000);
        const status = await page.locator('#app').getAttribute('data-status');
        if (status !== 'fighting') break;
      }
    }
    check(
      (await page.locator('#app').getAttribute('data-status')) === 'won',
      'actual native A caprice win',
    );
    let backup = await saved(page);
    check(
      backup.albums.children[0].completed.includes('refuge-petit') &&
        !backup.albums.children[1].completed.length,
      'win credits retained A only',
    );
    check(
      (await page.locator('#battle-result-title').innerText()) === 'Caprice réussi !',
      'caprice result title',
    );
    check(
      await page.locator('#mission-next').isHidden(),
      'caprice does not promise next normal mission',
    );
    // The book of the game that was played (A) decides what is left, whichever book is active.
    check(
      (await page.locator('#mission-caprice-replay').innerText()) === 'Un autre caprice' &&
        (await page.locator('#mission-sticker-hint').innerText()).trim() ===
          'Il te reste 5 autocollants à gagner ici.',
      'played caprice win counts the stickers left and offers another caprice',
    );
    await shot(page, 'production-A-win');
    await page.locator('#result-caprice-album').click();
    check(
      (await page.locator('#caprice-album-profile').inputValue()) === 'child-1',
      'result opens owner book',
    );
    await page.locator('#caprice-album-close').click();
    await page.locator('#mission-again').click();
    check((await saved(page)).albums.campProfileId === 'child-1', 'retry retains owner');
    await page.locator('#menu-home').click();
    await prepare(page);
    await page.locator('#mission-launch').click();
    backup = await saved(page);
    check(backup.albums.campProfileId === 'child-2', 'new B launch credits B owner');
    await writeFile(`${folder}/native-owner.json`, JSON.stringify(backup, null, 2) + '\n');
    console.log('production native ownership and played victory passed');
    await page.close();
  }
  // Locked codes use both mission and caprice gates in production.
  const locked = await pageAt(1280, 800, 'fr', false);
  await showHomePage(locked, 'parents');
  await locked.locator('#departure-input').fill(
    encodeDeparture({
      kind: 'mission',
      run: { ...createMissionRun('refuge', 42), caprice: 'refuge-grand' },
    }),
  );
  await locked.locator('#departure-form button[type=submit]').click();
  check(await locked.locator('#mission-dialog').isHidden(), 'locked code cannot preview or launch');
  await locked.close();
  // The preparation no longer shows its code but still makes it, and the parents' page
  // still finds the same departure from it.
  const coded = await pageAt();
  await prepare(coded);
  await coded.locator('[data-preparation="options"]').click();
  const codedRun = JSON.parse(await coded.locator('#mission-dialog').getAttribute('data-run'));
  const hiddenCode = await coded.locator('#mission-departure-code').inputValue();
  check(
    hiddenCode === encodeDeparture({ kind: 'mission', run: codedRun }),
    'preparation still makes the code of its departure',
  );
  check(
    (await coded.locator('.departure-share:visible').count()) === 0 &&
      (await coded.locator('#mission-departure-code').isHidden()) &&
      (await coded.locator('#mission-departure-copy').isHidden()),
    'preparation hides the departure code and its copy button',
  );
  check(
    (await coded.locator('#mission-plan').isVisible()) &&
      (await coded.locator('#mission-reroll').isVisible()),
    'options keep the plan and another departure',
  );
  await coded.locator('#mission-close').click();
  await showHomePage(coded, 'parents');
  check(
    (await coded.locator('#departure-form').isVisible()) &&
      (await coded.locator('#departure-input').isVisible()),
    'parents page keeps its form to find a departure',
  );
  await coded.locator('#departure-input').fill(hiddenCode);
  await coded.locator('#departure-form button[type=submit]').click();
  check(await coded.locator('#mission-dialog').isVisible(), 'parents form accepts that code');
  assert.deepEqual(
    JSON.parse(await coded.locator('#mission-dialog').getAttribute('data-run')),
    codedRun,
    'parents form finds the very same departure',
  );
  checks++;
  await coded.close();
  for (const [width, height] of [
    [1280, 800],
    [1366, 768],
    [812, 375],
    [780, 360],
    [568, 320],
    [375, 812],
  ])
    for (const locale of ['fr', 'en']) {
      const p = await pageAt(width, height, locale);
      if (width === 375) {
        check(
          await p.locator('#orientation-notice').isVisible(),
          'portrait keeps rotate instruction',
        );
        await shot(p, `portrait-${locale}`);
        await p.close();
        continue;
      }
      await p.evaluate(() => {
        for (const [key, value] of Object.entries({ top: 12, right: 24, bottom: 12, left: 0 }))
          document.documentElement.style.setProperty('--safe-area-inset-' + key, value + 'px');
      });
      await prepare(p, 'sonnette', 'sonnette-petit');
      check(
        (await p.locator('#caprice-announce').innerText()) === "Choisis deux sortes d'alliés !",
        'French announcement ' + locale,
      );
      check(
        (await p.locator('#caprice-announce').getAttribute('lang')) === 'fr',
        'French leaf lang',
      );
      check(
        (await p.locator('[data-caprice-friend] .portrait').count()) ===
          (await p.locator('[data-caprice-friend]').count()),
        'friends use existing unit portraits',
      );
      await p.locator('[data-preparation="friends"]').click();
      await p.locator('[data-caprice-friend="archer"]').click();
      check(
        (await p.locator('[data-caprice-friend="archer"]').getAttribute('aria-pressed')) === 'true',
        'partial friend choice',
      );
      for (const id of ['mission-launch', 'mission-close'])
        await onScreen(p.locator('#' + id), p, id + width);
      await p.locator('[data-preparation="options"]').click();
      await onScreen(p.locator('#mission-reroll'), p, 'reroll options ' + width + locale);
      await p.locator('[data-preparation="friends"]').click();
      await shot(p, `preparation-${width}x${height}-${locale}`);
      await p.locator('#mission-launch').click();
      const state = await saved(p);
      check(JSON.parse(state.camp).capriceKindsChosen?.includes('archer'), 'chosen friend saved');
      if (width === 1280 && locale === 'fr') {
        await p.reload();
        await p.locator('#home-screen').waitFor({ state: 'visible' });
        await showHomePage(p, 'missions');
        await p.locator('#mission-continue').click();
        check(
          JSON.parse((await saved(p)).camp).capriceKindsChosen.includes('archer'),
          'native reload/resume retains partial choices',
        );
      }
      await leaveBattle(p);
      await p.locator('#home-caprice-album').click();
      check(
        (await p.locator('#caprice-album-hint').isVisible()) &&
          (await p.locator('#caprice-album-hint').innerText()) ===
            (locale === 'en'
              ? 'Complete a caprice to earn its sticker.'
              : 'Réussis un caprice pour gagner son autocollant.'),
        'notebook says what it is for ' + width + locale,
      );
      check(
        (await p.locator('#caprice-album-previous').innerText()) ===
          (locale === 'en' ? '← Previous page' : '← Page précédente') &&
          (await p.locator('#caprice-album-next').innerText()) ===
            (locale === 'en' ? 'Next page →' : 'Page suivante →'),
        'notebook page buttons are named for what they do ' + width + locale,
      );
      await p.locator('.caprice-album-slots').evaluate((n) => (n.scrollTop = n.scrollHeight));
      await onScreen(p.locator('#caprice-album-close'), p, 'notebook close ' + width);
      await shot(p, `album-scrolled-${width}x${height}-${locale}`);
      await p.locator('#caprice-album-close').click();
      await p.close();
    }
  // Production import/export and language actions; controlled valid file input.
  // The third book comes from the family's save: the notebook no longer creates any.
  const familyPage = await pageAt(1280, 800, 'fr', controlled(['Café <ami>']));
  await familyPage.locator('#home-caprice-album').click();
  check(
    (await familyPage
      .locator(
        '#caprice-album-manage, #caprice-album-name, #caprice-album-add, #caprice-album-rename',
      )
      .count()) === 0,
    'notebook offers no way to add or rename a book',
  );
  check(
    (await familyPage.locator('#caprice-album-profile').isVisible()) &&
      (await familyPage.locator('#caprice-album-profile option').count()) === 3,
    'books already saved stay selectable',
  );
  await familyPage.locator('#caprice-album-profile').selectOption('child-3');
  check(
    (await familyPage.locator('#caprice-album-profile').inputValue()) === 'child-3' &&
      (await saved(familyPage)).albums.activeId === 'child-3',
    'select saved local child',
  );
  await familyPage.keyboard.press('Escape');
  check(
    await familyPage.locator('#home-caprice-album').evaluate((n) => document.activeElement === n),
    'notebook keyboard focus returns',
  );
  await chooseLanguage(familyPage, 'en');
  await familyPage.locator('#home-caprice-album').click();
  check(
    (await familyPage.locator('#caprice-album-profile option').last().innerText()) === 'Café <ami>',
    'local name remains raw in English',
  );
  check(
    (await familyPage.locator('#caprice-album-profile').count()) === 1,
    'locale switch retains profile select',
  );
  await shot(familyPage, 'album-en');
  await familyPage.locator('#caprice-album-close').click();
  await showHomePage(familyPage, 'parents');
  await familyPage.locator('#home-family').click();
  await familyPage.locator('#family-dialog[open]').waitFor();
  const downloadPromise = familyPage.waitForEvent('download');
  await familyPage.locator('#family-export').click();
  const download = await downloadPromise;
  const exported = JSON.parse(await readFile(await download.path(), 'utf8'));
  check(
    exported.version === 4 && exported.albums.children.length === 3,
    'native export includes all books',
  );
  await familyPage.locator('#family-file').setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":4}'),
  });
  check(await familyPage.locator('#family-apply').isDisabled(), 'malformed import cannot apply');
  const old = writeFamilyBackup(null, createCareer().state, createMissionProgress());
  await familyPage
    .locator('#family-file')
    .setInputFiles({ name: 'old.json', mimeType: 'application/json', buffer: Buffer.from(old) });
  await familyPage.locator('#family-apply').waitFor({ state: 'visible' });
  check(
    (await familyPage.locator('#family-preview-summary').innerText()).includes(
      'replaced by an empty book',
    ),
    'old import warns exact collection replacement',
  );
  await familyPage.locator('#family-apply').click();
  check(
    (await saved(familyPage)).albums.children.length === 1,
    'old import replaces books with default',
  );
  // A single book: nothing to choose in the notebook nor in the preparation.
  await showHomePage(familyPage, 'home');
  await familyPage.locator('#home-caprice-album').click();
  check(
    (await familyPage.locator('#caprice-album-profile').count()) === 1 &&
      (await familyPage.locator('.caprice-profile-tools').isHidden()),
    'single book hides the notebook book choice and its label',
  );
  await familyPage.locator('#caprice-album-close').click();
  await showHomePage(familyPage, 'missions');
  await familyPage.locator('[data-mission-card="refuge"]').click();
  check(
    (await familyPage.locator('[data-preparation="friends"]').isHidden()) &&
      (await familyPage.locator('#mission-caprice-profile').isHidden()) &&
      (await familyPage.locator('.preparation-nav button:visible').count()) === 4,
    'single book and normal mission hide the empty friends tab',
  );
  await familyPage.locator('#mission-close').click();
  // A file with several books still imports, and the choice comes back with them.
  await showHomePage(familyPage, 'parents');
  await familyPage.locator('#home-family').click();
  await familyPage.locator('#family-dialog[open]').waitFor();
  await familyPage.locator('#family-file').setInputFiles({
    name: 'family.json',
    mimeType: 'application/json',
    buffer: Buffer.from(controlled()),
  });
  await familyPage.locator('#family-apply').click();
  check(
    (await saved(familyPage)).albums.children.map((child) => child.name).join() === 'A,B',
    'import of a file with several books keeps every book',
  );
  await showHomePage(familyPage, 'home');
  await familyPage.locator('#home-caprice-album').click();
  check(
    (await familyPage.locator('#caprice-album-profile').isVisible()) &&
      (await familyPage.locator('#caprice-album-profile option').count()) === 2,
    'several imported books bring the notebook book choice back',
  );
  await familyPage.locator('#caprice-album-close').click();
  await showHomePage(familyPage, 'missions');
  await familyPage.locator('[data-mission-card="refuge"]').click();
  check(
    await familyPage.locator('[data-preparation="friends"]').isVisible(),
    'several books show the friends tab for its book choice',
  );
  await familyPage.locator('[data-preparation="friends"]').click();
  await familyPage.locator('#mission-caprice-profile').selectOption('child-2');
  check(
    (await saved(familyPage)).albums.activeId === 'child-2',
    'preparation book choice still selects a saved book',
  );
  await familyPage.locator('[data-preparation="summary"]').click();
  check(
    (await familyPage.locator('#mission-summary-book strong').innerText()) === 'B',
    'summary names the chosen book',
  );
  await familyPage.locator('#mission-close').click();
  await familyPage.close();
  const blocked = await pageAt();
  const retained = await saved(blocked);
  await blocked.evaluate(() => {
    Storage.prototype.setItem = function () {
      throw new DOMException('Blocked', 'QuotaExceededError');
    };
  });
  await showHomePage(blocked, 'parents');
  await blocked.locator('#home-family').click();
  await blocked.locator('#family-dialog[open]').waitFor();
  await blocked.locator('#family-file').setInputFiles({
    name: 'family.json',
    mimeType: 'application/json',
    buffer: Buffer.from(controlled()),
  });
  await blocked.locator('#family-apply').click();
  check(await blocked.locator('#family-dialog').isVisible(), 'blocked storage import remains open');
  check(
    JSON.stringify(await saved(blocked)) === JSON.stringify(retained),
    'blocked storage preserves persisted family',
  );
  check(
    (await blocked.locator('#family-status').innerText()).includes('actuelle reste intacte'),
    'blocked storage explains unchanged adventure',
  );
  await blocked.close();
  // Controlled fixture exercises readiness and render-only states without production test hooks.
  for (const count of [0, 1, 2]) {
    const p = await fixturePage('friends');
    await p.evaluate(() => window.capricesFixture.home());
    await prepare(p, 'sonnette', 'sonnette-petit');
    await p.locator('[data-preparation="friends"]').click();
    for (const kind of ['archer', 'ninja'].slice(0, count))
      await p.locator(`[data-caprice-friend="${kind}"]`).click();
    await p.locator('#mission-launch').click();
    check(
      (await p.evaluate(() => window.capricesFixture.session.game.capriceKindsChosen.length)) ===
        count,
      'optional choice ' + count,
    );
    await p.close();
  }
  for (const [width, height] of [
    [812, 375],
    [568, 320],
  ]) {
    const mobileBank = await fixturePage('bank', width, height);
    check(await mobileBank.locator('#caprice-bank').isVisible(), 'mobile bank visible ' + width);
    const totalBox = await mobileBank.locator('#gold').boundingBox();
    check(totalBox && totalBox.y >= 0, 'mobile reserve keeps total gold on screen ' + width);
    await shot(mobileBank, `controlled-bank-${width}x${height}`);
    await mobileBank.close();
  }
  const bank = await fixturePage('bank');
  check(await bank.locator('#caprice-bank').isVisible(), 'bank visible');
  await bank.locator('#dock-catalogue:visible, #reinforcements-toggle:visible').first().click();
  await revealControl(bank, '#repair');
  check(await bank.locator('#repair').isDisabled(), 'reserve blocks repair at gold500 reserve450');
  check(
    await bank.locator('[data-training]').first().isDisabled(),
    'reserve blocks training despite unlock',
  );
  await shot(bank, 'controlled-bank');
  await bank.close();
  const honey = await fixturePage('honey');
  check(await honey.locator('[data-dock-feast]').first().isDisabled(), 'no honey dock');
  await honey.close();
  const reject = await fixturePage('friends');
  await reject.evaluate(() => {
    window.capricesFixture.home();
    window.capricesFixture.setReject(true);
  });
  await prepare(reject, 'sonnette', 'sonnette-petit');
  const before = await reject.evaluate(() =>
    JSON.stringify([window.capricesFixture.progress.state, window.capricesFixture.albums.state]),
  );
  await reject.locator('#mission-launch').click();
  check(await reject.locator('#mission-dialog').isVisible(), 'rejected transaction remains open');
  check(
    (await reject.evaluate(() =>
      JSON.stringify([window.capricesFixture.progress.state, window.capricesFixture.albums.state]),
    )) === before,
    'rejected transaction leaves owner progress',
  );
  await reject.close();
  for (const canvas of [false, true]) {
    const p = await fixturePage('shell', 1280, 800, canvas ? '&canvas=1' : '');
    await p.waitForFunction(() => window.shellPhaser?.scene.isActive('Battle'));
    await p.waitForTimeout(300);
    check(
      await p.evaluate(() => window.capricesFixture.session.game.enemies.some((e) => e.shell)),
      'actual third snake shell',
    );
    const before = await p.evaluate(() => JSON.stringify(window.capricesFixture.session.game));
    await shot(p, 'controlled-shell-' + (canvas ? 'canvas' : 'webgl'));
    check(
      (await p.evaluate(() => JSON.stringify(window.capricesFixture.session.game))) === before,
      'shell render no mutation',
    );
    await p.close();
  }
  check(errors.length === 0, JSON.stringify(errors));
  await writeFile(
    `${folder}/report.json`,
    JSON.stringify(
      {
        nativePlayed: !process.env.CAPRICES_SKIP_NATIVE,
        version: JSON.parse(await readFile('package.json', 'utf8')).version,
        checks,
        captures,
        errors,
        controlled:
          'Family stars/profiles injected; production A launch, native classic/reload/resume and real clock-driven win. Separate fixture readiness, outcomes, actual shell birth/render.',
      },
      null,
      2,
    ) + '\n',
  );
  console.log(JSON.stringify({ checks, captures: captures.length, errors }));
} finally {
  await browser?.close();
  preview?.kill();
  dev?.kill();
  await rm(fixture, { force: true });
}
