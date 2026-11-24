// Le bouton « retour » d'Android (src/ui/backButton.ts), sur le vrai paquet de l'application,
// avec un faux côté Android : Chromium n'en a pas, il est remplacé par un module « App » qui
// répond comme Android et garde ce que le jeu lui demande.
//  1. le jeu écoute d'abord, et seulement ensuite demande « retour » à Android ;
//  2. au premier écran de l'accueil, « retour » met l'application en arrière-plan ;
//  3. sur une page de l'accueil, il revient au premier écran ;
//  4. une fenêtre ouverte se ferme, et la page derrière elle reste ;
//  5. en partie, il met en pause, puis reprend ; une fenêtre ouverte se ferme d'abord ;
//  6. une partie finie : retour à l'accueil, jamais hors de l'application ;
//  7. un jeu qui ne démarre pas laisse « retour » à Android : on peut encore sortir ;
//  8. une application sans le module (construite avant lui) ne demande rien et ne dit rien ;
//  9. le site ne porte rien de tout cela.
//   node --experimental-strip-types scripts/hygiene/back-button.mjs
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { open, start, status, boardReady, playOut } from './harness.mjs';
import { showHomePage } from '../../tests/browser-entry.mjs';

const checks = [];
const SIZES = [
  { width: 780, height: 360 },
  { width: 812, height: 375 },
  { width: 1280, height: 800 },
];

/** Android's side, as the « App » module sees it: it keeps what the game asks of it. */
const ANDROID = () => {
  window.android = { asked: [], left: 0 };
  window.Capacitor = {
    PluginHeaders: [
      {
        name: 'App',
        methods: [
          { name: 'addListener', rtype: 'callback' },
          { name: 'removeListener', rtype: 'callback' },
          { name: 'minimizeApp', rtype: 'promise' },
          { name: 'toggleBackButtonHandler', rtype: 'promise' },
        ],
      },
    ],
    nativeCallback: (plugin, method, options, callback) => {
      if (plugin !== 'App' || method !== 'addListener') return;
      window.android.asked.push(`listen:${options.eventName}`);
      if (options.eventName === 'backButton') window.android.back = callback;
    },
    nativePromise: (plugin, method, options) => {
      if (method === 'toggleBackButtonHandler')
        window.android.asked.push(`takes:${options.enabled}`);
      if (method === 'minimizeApp') window.android.left += 1;
      return Promise.resolve();
    },
  };
};
/** The game has taken « retour ». */
const bound = (page) => page.waitForFunction(() => window.android.asked.includes('takes:true'));
/** A press on « retour », as Android sends it to the game. */
const back = async (page) => {
  await page.evaluate(() => window.android.back({ canGoBack: false }));
  await page.waitForTimeout(60);
};
const left = (page) => page.evaluate(() => window.android.left);
const homePage = (page) => page.locator('#home-screen').getAttribute('data-page');
const onHome = async (page) =>
  (await page.locator('#home-screen').isVisible()) && !(await page.locator('#app').isVisible());
const paused = (page) => page.locator('#pause-overlay').isVisible();

for (const viewport of SIZES) {
  const tag = `${viewport.width}x${viewport.height}`;
  const { browser, page, report } = await open({ viewport, touch: viewport.width < 1000 });
  try {
    await page.context().addInitScript(ANDROID);
    await page.clock.install();
    await start(page);
    await bound(page);
    // 1. Listening first: until the game listens, Android answers « retour » itself.
    assert.deepEqual(
      await page.evaluate(() => window.android.asked),
      ['listen:backButton', 'takes:true'],
      `${tag}: the game listens, then takes « retour »`,
    );

    // 2. The first screen of the home: the application goes to the background, once a press.
    await back(page);
    assert.equal(await left(page), 1, `${tag}: « retour » at home leaves the application`);
    assert.ok(await onHome(page), `${tag}: and the home is still there behind`);

    // 3. A page of the home: back to its first screen, not out of the application.
    for (const target of ['missions', 'classic', 'parents', 'favorites']) {
      await showHomePage(page, target);
      assert.equal(await homePage(page), target);
      await back(page);
      assert.equal(await homePage(page), 'home', `${tag}: « retour » leaves the page ${target}`);
    }
    assert.equal(await left(page), 1, `${tag}: no page of the home leaves the application`);

    // 4. A window over a page: it closes, the page stays; then the page.
    await showHomePage(page, 'parents');
    await page.locator('#home-family').click();
    await page.locator('#family-dialog[open]').waitFor({ state: 'visible' });
    await back(page);
    assert.equal(await page.locator('#family-dialog[open]').count(), 0, `${tag}: window closed`);
    assert.equal(await homePage(page), 'parents', `${tag}: the page behind the window stays`);
    await back(page);
    assert.equal(await homePage(page), 'home');
    // The settings, a window opened from the first screen.
    await page.locator('#home-settings').click();
    await page.locator('#settings-dialog[open]').waitFor({ state: 'visible' });
    await back(page);
    assert.equal(await page.locator('#settings-dialog[open]').count(), 0);
    assert.equal(await left(page), 1, `${tag}: a window closed is not the application left`);

    // 5. A game: « retour » pauses, a second press plays on. In the camp, then in a battle.
    await showHomePage(page, 'classic');
    await page.locator('#home-new').click();
    await boardReady(page);
    // A window may greet a new game: « retour » closes it like any other.
    for (let i = 0; i < 4 && (await page.locator('dialog[open]').count()); i++) await back(page);
    assert.equal(await page.locator('dialog[open]').count(), 0, `${tag}: greeting windows closed`);
    assert.equal(await status(page), 'preparing');
    await back(page);
    assert.ok(await paused(page), `${tag}: « retour » in the camp opens the pause`);
    await back(page);
    assert.ok(!(await paused(page)), `${tag}: a second press plays on`);
    await page.locator('#start').click();
    await page.clock.runFor(1500);
    assert.equal(await status(page), 'fighting');
    await back(page);
    assert.ok(await paused(page), `${tag}: « retour » in a battle pauses it`);
    // The settings over the pause: the window closes first, the pause stays.
    await page.locator('#pause-settings').click();
    await page.locator('#settings-dialog[open]').waitFor({ state: 'visible' });
    await back(page);
    assert.equal(await page.locator('#settings-dialog[open]').count(), 0);
    assert.ok(await paused(page), `${tag}: the pause stays behind the window closed`);
    await back(page);
    assert.ok(!(await paused(page)), `${tag}: the battle plays on`);
    assert.equal(await status(page), 'fighting');
    assert.ok(await page.locator('#app').isVisible(), `${tag}: still on the board`);
    assert.equal(await left(page), 1, `${tag}: a game is never left by « retour »`);

    if (viewport !== SIZES[0]) {
      assert.deepEqual(report.errors, []);
      checks.push(`${tag}: home, pages, windows, pause, battle`);
      continue;
    }
    // 6. A game won or lost: its windows close, then « retour » goes home. A whole adventure
    // is long to play: once, at the first size.
    for (let i = 0; i < 600 && (await status(page)) === 'fighting'; i++)
      await page.clock.runFor(1000);
    // Between two waves the adventure offers a bonus: the first card, like a child in a hurry.
    const takeBonus = async () => {
      if (!(await page.locator('#start[data-state="reward"]').count())) return;
      await page.locator('#reward-cards [data-reward]').first().click();
      await page.clock.runFor(300);
    };
    const end = await playOut(page, { onWave: takeBonus });
    assert.ok(end === 'won' || end === 'lost', `${tag}: the game is over (${end})`);
    for (let i = 0; i < 8 && !(await onHome(page)); i++) await back(page);
    assert.ok(await onHome(page), `${tag}: « retour » after a game ${end} goes home`);
    assert.equal(await left(page), 1, `${tag}: and not out of the application`);
    await back(page);
    assert.equal(await left(page), 2, `${tag}: from the home, the application is left again`);
    assert.deepEqual(report.errors, []);
    checks.push(`${tag}: home, pages, windows, pause, battle, game ${end}`);
  } finally {
    await browser.close();
  }
}

// 7. A game that does not start: « retour » stays Android's own, the application can be left.
{
  const { browser, page, report } = await open();
  try {
    await page.context().addInitScript(ANDROID);
    await page.route(/\/assets\/bootstrap-[\w-]+\.js$/, (route) => route.abort());
    await page.goto('https://localhost/');
    await page.locator('dialog[open]').waitFor({ state: 'visible' });
    await page.waitForTimeout(500);
    assert.deepEqual(
      await page.evaluate(() => window.android.asked),
      [],
      'a game that did not start asks Android for nothing',
    );
    checks.push(`start-up failure: « retour » left to Android (${report.missing.length} missing)`);
  } finally {
    await browser.close();
  }
}

// 8. A native side without the module (an application built before it, or the share's two
// modules alone): nothing is asked, nothing is loaded, no error is written.
{
  const { browser, page, report } = await open();
  try {
    await page.context().addInitScript(() => {
      window.android = { asked: [] };
      window.Capacitor = {
        PluginHeaders: [
          { name: 'Filesystem', methods: [] },
          { name: 'Share', methods: [] },
        ],
        nativeCallback: (plugin, method) => window.android.asked.push(`${plugin}.${method}`),
        nativePromise: (plugin, method) => {
          window.android.asked.push(`${plugin}.${method}`);
          return Promise.resolve();
        },
      };
    });
    const asked = [];
    page.on('request', (request) => asked.push(request.url()));
    await start(page);
    await page.waitForTimeout(800);
    assert.deepEqual(await page.evaluate(() => window.android.asked), []);
    assert.deepEqual(report.errors, [], 'no error is written without the module');
    assert.ok(
      asked.some((url) => /backButton-/.test(url)),
      'the « retour » file is asked for, and finds no module to bind',
    );
    checks.push('native side without the module: nothing asked, no error');
  } finally {
    await browser.close();
  }
}

// 9. The website holds none of it; the application leaves « retour » to Android until told.
{
  const site = await readdir('dist/assets');
  assert.deepEqual(
    site.filter((name) => /^backButton-/.test(name)),
    [],
    'the website has no « retour » file',
  );
  const app = await readdir('dist-android/assets');
  assert.equal(app.filter((name) => /^backButton-[\w-]+\.js$/.test(name)).length, 1);
  const config = await import('../../capacitor.config.ts');
  assert.equal(
    config.default.plugins?.App?.disableBackButtonHandler,
    true,
    "« retour » is Android's own until the game takes it",
  );
  const first = /src="\.\/assets\/(index-[\w-]+\.js)"/.exec(
    await readFile('dist-android/index.html', 'utf8'),
  )[1];
  assert.match(
    await readFile(`dist-android/assets/${first}`, 'utf8'),
    /backButton-/,
    'the first script asks for the « retour » file',
  );
  checks.push('website: no « retour » file; application: one, asked for after the game');
}

for (const line of checks) console.log(`ok  ${line}`);
