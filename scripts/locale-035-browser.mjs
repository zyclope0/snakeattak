import { revealControl } from '../tests/reveal-controls.mjs';
import { closeSettings, openSettings, showHomePage } from '../tests/browser-entry.mjs';
import assert from 'node:assert/strict';
import { decodeDeparture, encodeDeparture } from '../src/departures.ts';
import { createServer } from 'vite';
import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';

const fixture = '.locale-035-test.html',
  root = 'http://127.0.0.1:4417',
  folder = process.env.LOCALE_REPORT_DIR ?? 'artifacts/locale-035',
  languageKey = 'conquete-serpents:language:v1',
  // The language now lives in one place: the settings window.
  picker = '#settings-dialog [data-language-picker]';
const checks = [],
  errors = [],
  unknowns = [],
  snapshots = [];
const sizes = [
  [1280, 800, false],
  [1366, 768, false],
  [812, 375, false],
  [780, 360, false],
  [568, 320, false],
  [568, 320, true],
  [375, 812, false],
];
const expectedNames = {
  club: 'Clubber',
  hero: 'Hero',
  ninja: 'Ninja',
  medic: 'Medic',
  archer: 'Archer',
  dragon: 'Baby Dragon',
  dino: 'Little Dinosaur',
  raptor: 'Velociraptor',
  triceratops: 'Triceratops',
  stegosaurus: 'Stegosaurus',
  trex: 'T. rex',
  spinosaurus: 'Spinosaurus',
  mutantRock: 'Rock Mutant',
  mutantStretch: 'Stretch Mutant',
  shield: 'Shield Guard',
  bat: 'Batter',
  nurse: 'Nurse',
  knight: 'Knight',
  cavalry: 'Rider',
  twohead: 'Two-Headed Knight',
  tank: 'Tank',
  wall: 'Palisade',
};
const french =
  /[éèêëàâùûçœ]|\b(?:et le|le mamba noir retire|Massue|Héros|Médecin|Infirmier|Batteur|Bouclier|Palissade|Chevalier|Cavalier|Vélociraptor|Tyrannosaure|Gardienne|Cracheuse|Mixte|alliés|cristal|vagues?|pièces|soigne|soins|portée|rapide|réserve|réparation|attirer|ralentir|départ|sauvegarde|rejouer|reprendre|choisis|gagnées|vaincus)\b/i;
let browser, server;
/**
 * The recipe sometimes stalled on the CI runner, silently, until the job's 30-minute limit
 * (19 November 2026). With no new check for this long, it stops and says where it was.
 */
const STALL_MS = 4 * 60 * 1000;
let lastProgress = 'start';
let stall;
function progress(label) {
  lastProgress = label;
  clearTimeout(stall);
  stall = setTimeout(() => {
    console.error(
      `locale-035: no progress for ${STALL_MS / 60000} min after « ${lastProgress} » (${checks.length} checks)`,
    );
    process.exit(1);
  }, STALL_MS);
  stall.unref();
}
progress('start');
function check(name, pass, detail) {
  progress(name);
  checks.push({ name, pass: !!pass, ...(detail === undefined ? {} : { detail }) });
  if (!pass) console.error('FINDING ' + JSON.stringify({ name, detail }));
}
async function scenario(name, run) {
  try {
    await run();
  } catch (error) {
    errors.push({ scenario: name, message: error.stack ?? String(error) });
    console.error('SCENARIO_ERROR ' + name + ': ' + error.message);
  }
}
async function fresh(language, viewport = { width: 1280, height: 800 }, options = {}) {
  const context = await browser.newContext({
    locale: language === 'en' ? 'en-GB' : 'fr-CH',
    viewport,
    hasTouch: viewport.width < 1000,
    reducedMotion: 'reduce',
    acceptDownloads: true,
    ...options,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  page.setDefaultNavigationTimeout(20000);
  page.on('pageerror', (error) => errors.push({ scenario: page.url(), message: error.message }));
  return { context, page };
}
async function ready(page, language, controlled = false) {
  await page.waitForFunction((language) => document.documentElement.lang === language, language);
  if (controlled) await page.waitForFunction(() => window.localeFixture?.ready);
  else await page.locator('#home-screen').waitFor({ state: 'visible' });
  await page.waitForFunction(
    () => [...document.querySelectorAll('[data-language-picker]')].length === 1,
  );
}
/** Settings window already open: pick a language and wait for the whole switch. */
async function select(page, language) {
  await page.locator(picker).selectOption(language);
  await page.waitForFunction(
    (language) =>
      document.documentElement.lang === language &&
      [...document.querySelectorAll('[data-language-picker]')].every(
        (s) => !s.disabled && s.value === language,
      ),
    language,
  );
}
/** From the home, the parents page or the pause: open settings, choose, close. */
async function choose(page, language) {
  await openSettings(page);
  await select(page, language);
  await closeSettings(page);
}
async function inspectEnglish(page, scope, name) {
  const copy = await page.locator(scope).evaluate((root) => {
    const result = [];
    const visible = (e) => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden';
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const p = node.parentElement;
      if (
        p &&
        visible(p) &&
        !p.closest('script,style,code,pre,textarea,[data-copy-raw],option[lang="fr"]') &&
        node.nodeValue.trim()
      )
        result.push(node.nodeValue.trim());
    }
    for (const e of [root, ...root.querySelectorAll('*')]) {
      if (!visible(e) || e.closest('[data-copy-raw]')) continue;
      for (const attr of ['aria-label', 'aria-description', 'alt', 'title', 'placeholder']) {
        const value = e.getAttribute(attr);
        if (value) result.push(value);
      }
    }
    return result;
  });
  const remnants = copy.filter((value) => french.test(value));
  check(
    `${name}: English visible text and accessibility attributes`,
    remnants.length === 0,
    remnants,
  );
  return copy;
}
async function collectUnknown(page, name) {
  const values = await page.evaluate(async () =>
    (await import('/src/i18n/copy.ts')).untranslatedCopy(),
  );
  unknowns.push({ name, keys: values });
}
async function fits(page, selector, viewport, safe, name) {
  const box = await page.locator(selector).boundingBox();
  check(
    name,
    box &&
      box.height >= 48 &&
      box.width >= 48 &&
      box.x >= -1 &&
      box.x + box.width <= viewport.width - (safe ? 32 : 0) + 1 &&
      box.y >= (safe ? 24 : 0) - 1 &&
      box.y + box.height <= viewport.height - (safe ? 16 : 0) + 1,
    box,
  );
}
const numericTokens = (text) =>
  (text.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => Number(n.replace(',', '.')));

try {
  await mkdir(folder, { recursive: true });
  const html = await readFile('index.html', 'utf8');
  assert.ok(html.includes('src="/src/main.ts"'), 'Actual app entry must be recognized');
  await writeFile(
    fixture,
    html.replace('src="/src/main.ts"', 'src="/tests/locale-035-harness.ts"'),
  );
  server = await createServer({ server: { host: '127.0.0.1', port: 4417, strictPort: true } });
  await server.listen();
  progress('server listening');
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  progress('browser launched');

  // Real entrypoint: fresh system-detected FR/EN, all requested viewports.
  for (const [width, height, safe] of sizes)
    for (const language of ['fr', 'en']) {
      const name = `actual-${language}-${width}x${height}${safe ? '-safe' : ''}`;
      await scenario(name, async () => {
        const viewport = { width, height },
          { context, page } = await fresh(language, viewport);
        try {
          if (safe)
            await page.addInitScript(() => {
              addEventListener('DOMContentLoaded', () => {
                for (const [side, value] of Object.entries({
                  top: 24,
                  right: 32,
                  bottom: 16,
                  left: 0,
                }))
                  document.documentElement.style.setProperty(
                    `--safe-area-inset-${side}`,
                    `${value}px`,
                  );
              });
            });
          await page.goto(root);
          await ready(page, language);
          const expected = language === 'en' ? 'Snake Attack TD' : 'La Conquête des Serpents';
          check(`${name}: document brand`, (await page.title()) === expected, await page.title());
          check(
            `${name}: visible brand`,
            (await page.locator('.home-brand').innerText()).replace(/\s+/g, ' ').includes(expected),
            await page.locator('.home-brand').innerText(),
          );
          check(
            `${name}: native settings selector`,
            await page.locator(picker).evaluate((e) => e.tagName === 'SELECT'),
          );
          await fits(page, '#home-settings', viewport, safe, `${name}: home settings button fits`);
          if (language === 'en') await inspectEnglish(page, '#home-screen', name);
          await page.screenshot({ path: `${folder}/${name}-home.png` });
          if (width > height) {
            // The portrait guard covers the whole app: settings open in landscape only.
            await openSettings(page);
            await fits(page, picker, viewport, safe, `${name}: home selector fits`);
            if (language === 'en')
              await inspectEnglish(page, '#settings-dialog', `${name}: home settings`);
            await page.screenshot({ path: `${folder}/${name}-home-settings.png` });
            await closeSettings(page);
          }
          if (width > height) {
            const navigationCount = await page.evaluate(
              () => performance.getEntriesByType('navigation').length,
            );
            await choose(page, language === 'en' ? 'fr' : 'en');
            await choose(page, language);
            check(
              `${name}: native switching keeps document`,
              (await page.evaluate(() => performance.getEntriesByType('navigation').length)) ===
                navigationCount,
            );
          }
          if (width < height) {
            // The existing portrait guard intentionally covers the entire app.
            // Inspect it directly rather than attempting to click through it.
            check(
              `${name}: portrait has rotation guidance`,
              await page.locator('#orientation-notice').isVisible(),
            );
            if (language === 'en') await inspectEnglish(page, '#orientation-notice', name);
            await page.screenshot({ path: `${folder}/${name}-portrait-guidance.png` });
          } else {
            await showHomePage(page, 'missions');
            await page.locator('#home-play').click();
            await page.locator('#mission-dialog').waitFor({ state: 'visible' });
            const code = await page.locator('#mission-departure-code').inputValue();
            const decoded = decodeDeparture(code);
            check(
              `${name}: first mission has canonical code`,
              decoded.ok &&
                decoded.departure.kind === 'mission' &&
                decoded.departure.run.missionId === 'refuge' &&
                decoded.departure.run.balance === 2 &&
                decoded.departure.run.rules === 2 &&
                !decoded.departure.run.caprice &&
                encodeDeparture(decoded.departure) === code,
            );
            if (language === 'en')
              await inspectEnglish(page, '#mission-dialog', `${name}: preview and threats`);
            await page.screenshot({ path: `${folder}/${name}-preview.png` });
            await page.locator('#mission-launch').click();
            await page.locator('#game canvas').waitFor();
            await page.locator('#pause').click();
            await page.locator('#pause-overlay').waitFor({ state: 'visible' });
            await fits(
              page,
              '#pause-settings',
              viewport,
              safe,
              `${name}: pause settings button fits`,
            );
            // On a phone the pause panel is the way home during a game.
            await fits(page, '#pause-home', viewport, safe, `${name}: pause home button fits`);
            await openSettings(page);
            await fits(page, picker, viewport, safe, `${name}: pause selector fits`);
            await select(page, language === 'en' ? 'fr' : 'en');
            await closeSettings(page);
            check(
              `${name}: switch preserves pause`,
              await page.locator('#pause-overlay').isVisible(),
            );
            await choose(page, language);
            check(
              `${name}: pause panel back after settings`,
              await page.locator('#pause-overlay').isVisible(),
            );
            if (language === 'en') await inspectEnglish(page, '#app', `${name}: paused battle`);
            await page.screenshot({ path: `${folder}/${name}-pause.png` });
          }
          if (language === 'en') await collectUnknown(page, name);
        } finally {
          await context.close();
        }
      });
    }

  await scenario('actual English guide/help/parents/save/codes', async () => {
    const { context, page } = await fresh('en');
    try {
      await page.goto(root);
      await ready(page, 'en');
      await showHomePage(page, 'parents');
      await page.locator('#home-guide').click();
      await page.locator('#unit-dialog').waitFor({ state: 'visible' });
      const values = await page
        .locator('#guide-select option')
        .evaluateAll((options) => options.map((o) => o.value));
      check('guide has all 22 canonical unit choices', values.length === 22, values);
      for (const value of values) {
        await page.locator('#guide-select').selectOption(value);
        const name = await page.locator('#guide-name').innerText();
        check(
          `guide ${value}: stable canonical value and English name`,
          name === expectedNames[value],
          name,
        );
        await inspectEnglish(page, '#unit-dialog', `guide ${value}`);
      }
      await page.screenshot({ path: `${folder}/actual-en-unit-guide.png` });
      await page.locator('#close-unit-guide').click();
      await showHomePage(page, 'parents');
      await page.locator('#home-help').click();
      await page.locator('#help-dialog').waitFor({ state: 'visible' });
      await page
        .locator('#help-dialog details')
        .evaluateAll((items) => items.forEach((e) => (e.open = true)));
      const help = await inspectEnglish(page, '#help-dialog', 'detailed English rules');
      const englishRules = await page.locator('#help-dialog').innerText();
      await page.evaluate(async () => (await import('/src/i18n/language.ts')).setLanguage('fr'));
      const frenchRules = await page.locator('#help-dialog').innerText();
      await page.evaluate(async () => (await import('/src/i18n/language.ts')).setLanguage('en'));
      check(
        'English rules preserve all source numeric claims',
        JSON.stringify(numericTokens(englishRules)) ===
          JSON.stringify(numericTokens(frenchRules)) && /12/.test(englishRules),
        { source: numericTokens(frenchRules), display: numericTokens(englishRules) },
      );
      await page.screenshot({ path: `${folder}/actual-en-help.png` });
      await page.locator('#close-help').click();
      await showHomePage(page, 'parents');
      await page.locator('#departure-input').fill('PONTS-1-0000-7X8R-A1');
      await choose(page, 'fr');
      await choose(page, 'en');
      check(
        'typed technical code survives language switches',
        (await page.locator('#departure-input').inputValue()) === 'PONTS-1-0000-7X8R-A1',
      );
      await page.locator('#departure-form button[type="submit"]').click();
      await inspectEnglish(page, '#home-parent-options', 'parent departure status');
      if (await page.locator('#mission-dialog').isVisible())
        await page.locator('#mission-close').click();
      await showHomePage(page, 'parents');
      await page.locator('#home-family').click();
      await page.locator('#family-dialog').waitFor({ state: 'visible' });
      await inspectEnglish(page, '#family-dialog', 'family save');
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.locator('#family-export').click(),
      ]);
      const downloadPath = await download.path();
      const exportedRaw = await readFile(downloadPath, 'utf8');
      const exported = JSON.parse(exportedRaw);
      check(
        'family export stays technical JSON',
        typeof exported === 'object' && !JSON.stringify(exported).includes('Snake Attack TD'),
        Object.keys(exported),
      );
      await page.evaluate(async () => (await import('/src/i18n/language.ts')).setLanguage('fr'));
      const [frenchDownload] = await Promise.all([
        page.waitForEvent('download'),
        page.locator('#family-export').click(),
      ]);
      const frenchExportedRaw = await readFile(await frenchDownload.path(), 'utf8');
      check(
        'FR/EN family exports are byte-identical',
        frenchExportedRaw === exportedRaw &&
          frenchDownload.suggestedFilename() === download.suggestedFilename(),
      );
      await page.evaluate(async () => (await import('/src/i18n/language.ts')).setLanguage('en'));
      await page.locator('#family-file').setInputFiles({
        name: 'roundtrip.json',
        mimeType: 'application/json',
        buffer: Buffer.from(exportedRaw),
      });
      await page.locator('#family-preview').waitFor({ state: 'visible' });
      await inspectEnglish(page, '#family-dialog', 'valid family import preview');
      check(
        'compatible family preview enables explicit replacement',
        await page.locator('#family-apply').isEnabled(),
      );
      await page.locator('#family-file').setInputFiles({
        name: 'invalid.json',
        mimeType: 'application/json',
        buffer: Buffer.from('{"broken":true}'),
      });
      await page.waitForFunction(
        () => document.querySelector('#family-status').textContent.trim() !== 'Reading file…',
      );
      await inspectEnglish(page, '#family-dialog', 'invalid family import');
      check(
        'invalid import cannot replace progress',
        await page.locator('#family-apply').isDisabled(),
      );
      await page.screenshot({ path: `${folder}/actual-en-family-invalid.png` });
      await collectUnknown(page, 'actual English detailed surfaces');
    } finally {
      await context.close();
    }
  });

  // Preference reload, denied storage and failed English module are real entrypoint cases.
  await scenario('language preference survives reload', async () => {
    const { context, page } = await fresh('en');
    try {
      await page.goto(root);
      await ready(page, 'en');
      await choose(page, 'fr');
      check(
        'preference is independent language key',
        (await page.evaluate((key) => localStorage.getItem(key), languageKey)) === 'fr',
      );
      await page.reload();
      await ready(page, 'fr');
      check(
        'stored French beats English system preference',
        (await page.title()) === 'La Conquête des Serpents',
      );
    } finally {
      await context.close();
    }
  });
  for (const denied of ['read', 'write'])
    await scenario(`storage ${denied} denied`, async () => {
      const { context, page } = await fresh('en');
      try {
        await page.addInitScript((denied) => {
          if (denied === 'read')
            Object.defineProperty(window, 'localStorage', {
              get() {
                throw new DOMException('Blocked test storage', 'SecurityError');
              },
            });
          else
            Storage.prototype.setItem = () => {
              throw new DOMException('Full test storage', 'QuotaExceededError');
            };
        }, denied);
        await page.goto(root);
        await ready(page, 'en');
        await choose(page, 'fr');
        await choose(page, 'en');
        check(
          `storage ${denied} denial leaves selector usable`,
          !(await page.locator(picker).isDisabled()),
        );
        await collectUnknown(page, `storage ${denied} denied`);
      } finally {
        await context.close();
      }
    });
  await scenario('unsupported system language and invalid preference', async () => {
    const { context, page } = await fresh('fr', undefined, { locale: 'de-DE' });
    try {
      await page.addInitScript((key) => localStorage.setItem(key, 'unknown'), languageKey);
      await page.goto(root);
      await ready(page, 'en');
      check(
        'unsupported primary locale and invalid preference fall back to English',
        (await page.title()) === 'Snake Attack TD',
      );
    } finally {
      await context.close();
    }
  });
  await scenario('failed English download falls back without crash', async () => {
    const { context, page } = await fresh('en');
    try {
      await page.route('**/src/i18n/english.ts*', (route) => route.abort('failed'));
      await page.goto(root);
      await ready(page, 'fr');
      check(
        'failed English module reports language status',
        /Langue indisponible/.test(
          await page
            .locator('[role="status"]')
            .allTextContents()
            .then((t) => t.join(' ')),
        ),
      );
      check(
        'failed English module retains usable French home',
        await page.locator('#home-play').isEnabled(),
      );
    } finally {
      await context.close();
    }
  });

  // Controlled states: exact whole-state/RNG witnesses and dormant cached canvas labels.
  for (const language of ['fr', 'en'])
    for (const mode of [
      'first-win',
      'first-loss',
      'last-win',
      'classic-win',
      'classic-loss',
      'preparing',
    ]) {
      const name = `fixture-${language}-${mode}`;
      await scenario(name, async () => {
        const { context, page } = await fresh(language);
        try {
          await page.goto(`${root}/${fixture}?case=${mode}`);
          await ready(page, language, true);
          if (language === 'en') await inspectEnglish(page, '#app', name);
          if (mode !== 'preparing') {
            check(`${name}: result visible`, await page.locator('#battle-result').isVisible());
            check(
              `${name}: stars match actual outcome`,
              (await page.locator('#battle-result-stars').isVisible()) === mode.endsWith('win'),
            );
            const witness = await page.evaluate(() => window.localeFixture.snapshot());
            await page.evaluate(
              async (next) => window.localeFixture.setLanguage(next),
              language === 'en' ? 'fr' : 'en',
            );
            await page.evaluate(async (next) => window.localeFixture.setLanguage(next), language);
            check(
              `${name}: outcome switching preserves entire canonical state`,
              JSON.stringify(await page.evaluate(() => window.localeFixture.snapshot())) ===
                JSON.stringify(witness),
            );
            await page.screenshot({ path: `${folder}/${name}.png` });
          } else {
            await page.locator('#pause').click();
            await page.locator('#pause-overlay').waitFor({ state: 'visible' });
            const witness = await page.evaluate(() => window.localeFixture.snapshot());
            await openSettings(page);
            await page.locator(picker).focus();
            const sourceNode = await page.locator(picker).elementHandle();
            await select(page, language === 'en' ? 'fr' : 'en');
            check(
              `${name}: focused pause selector node retained`,
              await sourceNode.evaluate((e) => e === document.activeElement && e.isConnected),
            );
            await select(page, language);
            await closeSettings(page);
            check(
              `${name}: game still paused after settings close`,
              (await page.locator('#pause-overlay').isVisible()) &&
                (await page.evaluate(
                  () => JSON.parse(window.localeFixture.snapshot().game).paused,
                )),
            );
            check(
              `${name}: pause switch preserves full JSON/RNG/time/checkpoint/code`,
              JSON.stringify(await page.evaluate(() => window.localeFixture.snapshot())) ===
                JSON.stringify(witness),
            );
            snapshots.push({ name, witness });
            await page.locator('#resume-game').click();
            await page.locator('#help').click();
            await page.locator('#close-help').focus();
            const dialogFocus = await page.locator('#close-help').elementHandle();
            const dialogWitness = await page.evaluate(() => window.localeFixture.snapshot());
            await page.evaluate(
              async (next) => window.localeFixture.setLanguage(next),
              language === 'en' ? 'fr' : 'en',
            );
            check(
              `${name}: dialog remains open on switch`,
              await page.locator('#help-dialog').isVisible(),
            );
            check(
              `${name}: dialog focus and node retained`,
              await dialogFocus.evaluate((e) => e.isConnected && e === document.activeElement),
            );
            check(
              `${name}: dialog switch preserves full state`,
              JSON.stringify(await page.evaluate(() => window.localeFixture.snapshot())) ===
                JSON.stringify(dialogWitness),
            );
            await page.locator('#close-help').click();
            await page.evaluate(() => window.localeFixture.setLanguage('fr'));
            const frenchCommands = await page.evaluate(() =>
              window.localeFixture.seededCommandWitness(),
            );
            await page.evaluate(() => window.localeFixture.setLanguage('en'));
            const englishCommands = await page.evaluate(() =>
              window.localeFixture.seededCommandWitness(),
            );
            check(
              `${name}: same seeded commands give byte-identical FR/EN states and codes`,
              JSON.stringify(frenchCommands) === JSON.stringify(englishCommands) &&
                frenchCommands.actions.every(Boolean),
              { actions: frenchCommands.actions },
            );
            snapshots.push({
              name: `${name}: independent seeded commands`,
              witness: frenchCommands,
            });
            await page.evaluate(() => window.localeFixture.setLanguage('fr'));
            await page.evaluate(() => window.localeFixture.setMedicalBossState());
            await page.waitForFunction(
              () =>
                document.getElementById('loading-overlay').hidden &&
                window.localeFixture
                  .canvasLabels()
                  .some((l) => l.visible && l.text.startsWith('Gardienne')),
            );
            await page.evaluate(() => window.localeFixture.freezeCanvas());
            const frLabels = await page.evaluate(() =>
              window.localeFixture
                .canvasLabels()
                .filter((l) => l.visible)
                .map((l) => l.text),
            );
            check(
              `${name}: fixture includes cached fort/medical/three heads`,
              frLabels.some((t) => /^CRISTAL · 83/.test(t)) &&
                frLabels.some((t) => /Réserve/.test(t)) &&
                ['Gardienne', 'Cracheuse', 'Mixte'].every((head) =>
                  frLabels.some((t) => t.startsWith(head)),
                ),
              frLabels,
            );
            const cachedWitness = await page.evaluate(() => window.localeFixture.snapshot());
            await page.evaluate(() => window.localeFixture.setLanguage('en'));
            const enLabels = await page.evaluate(() =>
              window.localeFixture
                .canvasLabels()
                .filter((l) => l.visible)
                .map((l) => l.text),
            );
            check(
              `${name}: frozen canvas labels refresh without redraw`,
              enLabels.every((t) => !french.test(t)) &&
                enLabels.some((t) => /83/.test(t)) &&
                enLabels.some((t) => /1.*3 s/.test(t)) &&
                enLabels.some((t) => /2\/4/.test(t)),
              enLabels,
            );
            check(
              `${name}: cached label switch preserves state/RNG/time`,
              JSON.stringify(await page.evaluate(() => window.localeFixture.snapshot())) ===
                JSON.stringify(cachedWitness),
            );
            await page.evaluate(() => window.localeFixture.renderForCapture());
            await page.screenshot({ path: `${folder}/${name}-medical-boss-en.png` });
            // Isolated fixture capture after the equality witness: suppress only
            // the HTML pause shade so the dormant canvas labels can be reviewed.
            await page.locator('#pause-overlay').evaluate((e) => (e.style.visibility = 'hidden'));
            try {
              await page
                .locator('#game canvas')
                .screenshot({ path: `${folder}/${name}-medical-boss-en-canvas.png` });
            } finally {
              await page
                .locator('#pause-overlay')
                .evaluate((e) => e.style.removeProperty('visibility'));
            }
            const catalog = await page.evaluate(() => window.localeFixture.canonicalCatalog());
            await page.locator('#unit-guide').evaluate((e) => e.click());
            for (const unit of catalog) {
              await page.locator('#guide-select').selectOption(unit.kind);
              const ability = await page.locator('#guide-ability').innerText();
              check(
                `${name}: ${unit.kind} ability preserves source numbers`,
                JSON.stringify(numericTokens(ability)) ===
                  JSON.stringify(numericTokens(unit.ability)),
                { source: unit.ability, display: ability },
              );
              const stats = await page.locator('#guide-stats').innerText();
              check(
                `${name}: ${unit.kind} health is the actual catalogue value`,
                new RegExp(`\\b${unit.hp} HP\\b`).test(stats),
                stats,
              );
            }
            await page.locator('#close-unit-guide').click();
            await page.evaluate(() => window.localeFixture.setRewardState());
            check(
              `${name}: three real reward choices`,
              (await page.locator('#reward-panel .reward-card:visible').count()) === 3,
            );
            await inspectEnglish(page, '#reward-panel', `${name}: rewards`);
            const reportText = await page.locator('#chapter-report').textContent();
            check(
              `${name}: chapter report preserves actual minimum/current health and kills`,
              !french.test(reportText) &&
                /72\/100 HP/.test(reportText) &&
                /83\/100 HP/.test(reportText) &&
                /17/.test(reportText),
              reportText,
            );
            await page.screenshot({ path: `${folder}/${name}-rewards-en.png` });
            // The catalog's two existing tabs partition the 20 recruitable kinds.
            await revealControl(page, '#shop-ready');
            const catalogKinds = [];
            for (const tab of ['shop-ready', 'shop-future']) {
              await page.locator(`#${tab}`).click();
              // No pages: the tab shows all its cards at once, as many as it announces.
              const cards = await page.locator('#shop .unit-card:visible').evaluateAll((cards) =>
                cards.map((card) => ({
                  kind: card.dataset.kind,
                  name: card.querySelector('strong').textContent,
                  title: card.title,
                  aria: card.getAttribute('aria-label'),
                })),
              );
              const announced = Number(
                (await page.locator(`#${tab}`).textContent()).match(/\((\d+)\)/)?.[1],
              );
              check(
                `${name}: ${tab} shows every card it announces at once`,
                cards.length === announced,
                { announced, shown: cards.length },
              );
              catalogKinds.push(...cards.map((card) => card.kind));
              check(
                `${name}: ${tab} English catalog cards`,
                cards.every(
                  (card) =>
                    card.name === expectedNames[card.kind] &&
                    !french.test(card.title + ' ' + card.aria),
                ),
                cards,
              );
            }
            check(
              `${name}: catalog tabs cover exactly 20 recruitable kinds`,
              catalogKinds.length === 20 && new Set(catalogKinds).size === 20,
              catalogKinds,
            );
            await page.locator('#reinforcements-close').click();
            const missions = await page.evaluate(() => window.localeFixture.missions);
            const missionNames = [
              'The Refuge',
              'The Three Bridges',
              'The Swift Run',
              'The First Eggs',
              'Dragon and Rattle',
              'Fern Crossroads',
            ];
            check(`${name}: six canonical mission previews`, missions.length === 6);
            for (const [i, mission] of missions.entries()) {
              const beforePreview = await page.evaluate(() => window.localeFixture.snapshot());
              await page.evaluate((id) => window.localeFixture.previewMission(id), mission.id);
              check(
                `${name}: mission ${mission.id} English name`,
                (await page.locator('#mission-title').innerText()) === missionNames[i],
              );
              check(
                `${name}: mission ${mission.id} retains canonical ID and wave count`,
                JSON.parse(await page.locator('#mission-dialog').getAttribute('data-run'))
                  .missionId === mission.id &&
                  numericTokens(await page.locator('#mission-budget').innerText()).includes(
                    mission.waves,
                  ),
              );
              // A normal mission of a family with one sticker book has nothing to choose
              // among friends: that tab is hidden, the four others are inspected.
              check(
                `${name}: mission ${mission.id} hides the empty friends tab`,
                (await page.locator('[data-preparation="friends"]').isHidden()) &&
                  (await page.locator('.preparation-nav button:visible').count()) === 4,
              );
              for (const view of ['summary', 'caprices', 'scouting', 'options']) {
                await page.locator(`[data-preparation="${view}"]`).click();
                await inspectEnglish(
                  page,
                  '#mission-dialog',
                  `${name}: mission ${mission.id} ${view}`,
                );
              }
              if (mission.id === 'sonnette') {
                // A caprice that limits the kinds of allies brings the friends tab back.
                await page.locator('[data-preparation="caprices"]').click();
                await page.locator('[data-caprice="sonnette-petit"]').click();
                check(
                  `${name}: mission ${mission.id} shows the friends tab for its caprice`,
                  await page.locator('[data-preparation="friends"]').isVisible(),
                );
                await page.locator('[data-preparation="friends"]').click();
                check(
                  `${name}: mission ${mission.id} friends view offers ally kinds`,
                  (await page.locator('[data-caprice-friend]:visible').count()) > 0,
                );
                await inspectEnglish(
                  page,
                  '#mission-dialog',
                  `${name}: mission ${mission.id} friends`,
                );
                await page.locator('[data-preparation="caprices"]').click();
                await page.locator('#mission-normal').click();
                check(
                  `${name}: mission ${mission.id} hides the friends tab again`,
                  await page.locator('[data-preparation="friends"]').isHidden(),
                );
              }
              check(
                `${name}: preview ${mission.id} preserves game/RNG`,
                JSON.stringify(await page.evaluate(() => window.localeFixture.snapshot())) ===
                  JSON.stringify(beforePreview),
              );
            }
            await page.locator('[data-preparation="scouting"]').click();
            const threatKinds = await page.evaluate(() => window.localeFixture.showAllThreats());
            const renderedThreatKinds = await page
              .locator('#mission-threats [data-threat]')
              .evaluateAll((cards) => cards.map((card) => card.dataset.threat));
            check(
              `${name}: all 17 threat identities rendered`,
              threatKinds.length === 17 &&
                JSON.stringify(threatKinds) === JSON.stringify(renderedThreatKinds),
              renderedThreatKinds,
            );
            await inspectEnglish(page, '#mission-threats', `${name}: all threat abilities`);
            await page.screenshot({ path: `${folder}/${name}-all-threats-en.png` });
            await page.locator('#mission-close').click();
          }
          if (await page.evaluate(() => document.documentElement.lang === 'en'))
            await collectUnknown(page, name);
        } finally {
          await context.close();
        }
      });
    }
} finally {
  await browser?.close();
  await server?.close();
  await unlink(fixture).catch(() => {});
  const unknownKeys = [...new Set(unknowns.flatMap((row) => row.keys))].sort();
  check(
    'No untranslated user copy encountered in English recipe',
    unknownKeys.length === 0,
    unknownKeys,
  );
  await writeFile(
    `${folder}/report.json`,
    JSON.stringify(
      {
        checks,
        errors,
        unknowns,
        unknownKeys,
        snapshots,
        method:
          'Actual application entrypoint and isolated controlled fixtures are labeled separately. Controlled canvas captures repaint only after dormant-label/state assertions, then temporarily hide the fixture HTML pause shade. Chromium emulation only; no physical S24 or child playtest claim.',
      },
      null,
      2,
    ) + '\n',
  );
}
clearTimeout(stall);
console.log(
  JSON.stringify(
    {
      checks: checks.length,
      failed: checks.filter((c) => !c.pass),
      errors,
      unknowns: [...new Set(unknowns.flatMap((row) => row.keys))],
    },
    null,
    2,
  ),
);
assert.deepEqual(errors, [], 'Locale recipe must have no unexpected runtime/scenario errors');
assert.deepEqual(
  checks.filter((c) => !c.pass),
  [],
  'Locale recipe findings must be addressed',
);
