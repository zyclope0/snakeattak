import { catalogueView, REMOVED_CATALOGUE_CONTROLS, revealControl } from './reveal-controls.mjs';
import { enterBattle } from './browser-entry.mjs';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';
await mkdir('artifacts', { recursive: true });
const gameUrl = process.env.GAME_URL;
if (!gameUrl) throw new Error('Use npm run test:browser');
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({
  locale: 'fr-CH',
  viewport: { width: 1440, height: 1000 },
});
page.setDefaultTimeout(15000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (message) => {
  if (message.type() === 'error' && /Content Security Policy|Refused to/.test(message.text()))
    errors.push(message.text());
});
const response = await page.goto(gameUrl);
await enterBattle(page);
await revealControl(page, '#reset');
await revealControl(page, '#encounter');
if (gameUrl.startsWith('http')) {
  const headers = await response.allHeaders();
  if (
    headers['x-content-type-options'] !== 'nosniff' ||
    !headers['content-security-policy']?.includes("script-src 'self'")
  )
    throw Error('En-têtes de sécurité absents');
  const scriptUrl = await page.locator('script[src]').getAttribute('src');
  const asset = await page.request.get(new URL(scriptUrl, gameUrl).href);
  if (!asset.headers()['cache-control']?.includes('immutable'))
    throw Error('Cache immutable absent');
}
await page.locator('canvas').waitFor();
await page.waitForTimeout(1500);
await page.screenshot({ path: 'artifacts/pilote-desktop.png', fullPage: true });
// A new great adventure (seventh revision): twenty allies and the spinosaurus.
if ((await page.locator('[data-kind]').count()) !== 21) throw Error('Catalogue incomplet');
if (await page.locator('[data-kind="dragon"]').isVisible())
  throw Error('Unité future affichée dans les disponibles');
await revealControl(page, '#shop-future');
await page.locator('#shop-future').click();
if (!(await page.locator('[data-kind="dragon"]').isVisible()))
  throw Error('Aperçu des futures unités absent');
await revealControl(page, '#shop-ready');
await page.locator('#shop-ready').click();
// Un seul écran : ni pages ni liste de familles, chaque onglet montre tous ses alliés d'un coup.
if (await page.locator(REMOVED_CATALOGUE_CONTROLS).count())
  throw Error('Pages ou liste de familles encore dans le catalogue');
const readyView = await catalogueView(page);
const readyKinds = readyView.cards.map((card) => card.kind);
if (readyKinds.length !== readyView.ready || readyView.cards.some((c) => c.state === 'locked'))
  throw Error('Les alliés disponibles ne sont pas tous montrés d’un coup');
if (readyView.cards.some((card) => !card.inBody || card.height < 48 || card.width < 48))
  throw Error('Carte d’allié disponible hors du catalogue ou trop petite');
for (const kind of ['mutantRock', 'mutantStretch'])
  if (readyKinds.includes(kind)) throw Error('Mutant recruté avant son déblocage');
await revealControl(page, '#shop-future');
await page.locator('#shop-future').click();
const futureView = await catalogueView(page);
const futureKinds = futureView.cards.map((card) => card.kind);
if (futureKinds.length !== futureView.future || futureView.cards.some((c) => c.state !== 'locked'))
  throw Error('Les alliés à découvrir ne sont pas tous montrés d’un coup');
if (futureView.cards.some((card) => !card.inBody || card.height < 48 || card.width < 48))
  throw Error('Carte d’allié à découvrir hors du catalogue ou trop petite');
if (
  new Set([...readyKinds, ...futureKinds]).size !== 21 ||
  readyView.ready + readyView.future !== 21
)
  throw Error('Les deux onglets ne montrent pas les vingt et un alliés');
for (const kind of ['mutantRock', 'mutantStretch'])
  if (!(await page.locator(`#shop [data-kind="${kind}"]`).isVisible()))
    throw Error(`Mutant à découvrir absent : ${kind}`);
for (const kind of ['raptor', 'triceratops', 'stegosaurus', 'trex', 'dino', 'dragon'])
  if (!(await page.locator(`#shop [data-kind="${kind}"]`).isVisible()))
    throw Error(`Créature alliée absente : ${kind}`);
// Une carte à découvrir dit sa vague d'arrivée ; une carte disponible ne garde que nom et prix.
if (!(await page.locator('#shop [data-kind="dragon"] small').isVisible()))
  throw Error('Vague d’arrivée absente d’une carte à découvrir');
await revealControl(page, '#shop-ready');
await page.locator('#shop-ready').click();
if (await page.locator('#shop .unit-card:visible small:visible').count())
  throw Error('Texte en trop sur une carte disponible');
await revealControl(page, '#unit-guide');
await page.locator('#unit-guide').click();
if ((await page.locator('#guide-select option').count()) !== 22)
  throw Error('Guide de nos 22 unités incomplet');
await page.locator('#guide-select').selectOption('ninja');
if (!(await page.locator('#guide-stats').innerText()).includes('Très rapide'))
  throw Error('Vitesse du ninja absente');
for (const kind of [
  'raptor',
  'triceratops',
  'stegosaurus',
  'trex',
  'mutantRock',
  'mutantStretch',
]) {
  await page.locator('#guide-select').selectOption(kind);
  if (!(await page.locator('#guide-stats').innerText()).includes('Nos alliés'))
    throw Error(`Nouvelle unité mal classée : ${kind}`);
}
await page.locator('#guide-select').selectOption('tank');
if (!(await page.locator('#guide-name').innerText()).includes('Tank'))
  throw Error('Fiche du tank absente');
await revealControl(page, '#close-unit-guide');
await page.locator('#close-unit-guide').click();
// Le son est activé au départ : on le coupe, puis on le remet.
if ((await page.locator('#sound-toggle').getAttribute('aria-pressed')) !== 'true')
  throw Error('Le son devrait être activé au départ');
await revealControl(page, '#sound-toggle');
await page.locator('#sound-toggle').click();
if ((await page.locator('#sound-toggle').getAttribute('aria-pressed')) !== 'false')
  throw Error('Son non coupé');
await revealControl(page, '#sound-toggle');
await page.locator('#sound-toggle').click();
if ((await page.locator('#sound-toggle').getAttribute('aria-pressed')) !== 'true')
  throw Error('Activation du son impossible');
await revealControl(page, '[data-kind="ninja"]');
await page.locator('[data-kind="ninja"]').click();
await page.waitForFunction(() => document.getElementById('encounter').dataset.tone === 'place');
const canvas = await page.locator('canvas').boundingBox();
await page.mouse.click(
  canvas.x + (canvas.width * 900) / 1100,
  canvas.y + (canvas.height * 350) / 620,
);
await page.waitForTimeout(250);
if ((await page.locator('#gold').innerText()) !== '150') throw Error('Recrutement desktop échoué');
await page.reload();
await enterBattle(page);
await revealControl(page, '#reset');
await revealControl(page, '#encounter');
await page.locator('canvas').waitFor();
await page.waitForFunction(() => document.getElementById('gold').textContent === '150');
if (!(await page.locator('[data-kind="dragon"]').isDisabled()))
  throw Error('Dragon débloqué trop tôt');
if (!(await page.locator('#brief-title').innerText()).includes('1 / 12'))
  throw Error('Préparation des douze vagues absente');
if (!(await page.locator('[data-feast-lane="1"]').isDisabled()))
  throw Error('Goûter actif avant la vague');
if ((await page.locator('[data-feast-flavor="lure"]').getAttribute('aria-pressed')) !== 'true')
  throw Error('Le miel attirant doit être sélectionné par défaut');
await revealControl(page, '#start');
await page.locator('#start').click();
await page.waitForTimeout(500);
if ((await page.locator('#wave').innerText()) !== '1') throw Error('Vague non lancée');
if ((await page.locator('#encounter').getAttribute('data-tone')) !== 'wave')
  throw Error('Annonce de vague absente');
await revealControl(page, '[data-feast-lane="1"]');
await page.locator('[data-feast-lane="1"]').click();
if (!(await page.locator('#feast-status').innerText()).includes('Centre'))
  throw Error('Goûter absent');
for (const button of await page.locator('[data-feast-lane]').all())
  if (!(await button.isDisabled())) throw Error('Goûter réutilisable');
for (const button of await page.locator('[data-feast-flavor]').all())
  if (!(await button.isDisabled())) throw Error('Type du pot modifiable après utilisation');
await revealControl(page, '#pause');
await page.locator('#pause').click();
if (
  !(await page
    .locator('#pause')
    .getAttribute('aria-label')
    .then((x) => x === 'Reprendre'))
)
  throw Error('Pause');
await revealControl(page, '#help');
await page.locator('#help').click();
await revealControl(page, '#play-help');
await page.locator('#play-help').click();
if ((await page.locator('#pause').getAttribute('aria-label')) !== 'Reprendre')
  throw Error('Aide a repris la partie en pause');
await revealControl(page, '#reset');
await page.locator('#reset').click();
if (await page.locator('#restart-dialog').isVisible()) {
  await revealControl(page, '#confirm-restart');
  await page.locator('#confirm-restart').click();
}
if ((await page.locator('#gold').innerText()) !== '300') throw Error('Reset');
await revealControl(page, '#help');
await page.locator('#help').click();
if (!(await page.locator('#help-dialog').isVisible())) throw Error('Aide');
await revealControl(page, '#play-help');
await page.locator('#play-help').click();
if ((await page.locator('[data-feast-flavor="lure"]').getAttribute('aria-pressed')) !== 'true')
  throw Error('Le redémarrage ne rétablit pas le miel attirant');
await revealControl(page, '#pause');
await page.locator('#pause').click();
for (const button of await page.locator('[data-feast-flavor]').all())
  if (!(await button.isDisabled())) throw Error('Type du miel modifiable en pause');
await revealControl(page, '#pause');
await page.locator('#pause').click();
await revealControl(page, '[data-feast-flavor="sticky"]');
await page.locator('[data-feast-flavor="sticky"]').click();
if ((await page.locator('[data-feast-flavor="sticky"]').getAttribute('aria-pressed')) !== 'true')
  throw Error('Miel collant non sélectionné');
if (!(await page.locator('[data-feast-lane="0"]').isDisabled()))
  throw Error('Miel collant utilisable avant le combat');
await revealControl(page, '#start');
await page.locator('#start').click();
await revealControl(page, '[data-feast-lane="0"]');
await page.locator('[data-feast-lane="0"]').click();
const stickyStatus = await page.locator('#feast-status').innerText();
if (
  !stickyStatus.includes('Miel collant') ||
  !stickyStatus.includes('Haut') ||
  stickyStatus.includes('détour')
)
  throw Error('Le statut du miel collant invente une attraction');
for (const button of await page.locator('[data-feast-flavor], [data-feast-lane]').all())
  if (!(await button.isDisabled())) throw Error('Deuxième pot possible après le miel collant');
await revealControl(page, '#reset');
await page.locator('#reset').click();
if (await page.locator('#restart-dialog').isVisible()) {
  await revealControl(page, '#confirm-restart');
  await page.locator('#confirm-restart').click();
}
if ((await page.locator('[data-feast-flavor="lure"]').getAttribute('aria-pressed')) !== 'true')
  throw Error('Le choix collant persiste après nouvelle partie');
for (const width of [1000, 820]) {
  const tablet = await browser.newPage({
    locale: 'fr-CH',
    viewport: { width, height: 900 },
  });
  await tablet.goto(gameUrl);
  await enterBattle(tablet);
  await tablet.locator('canvas').waitFor();
  if (await tablet.evaluate(() => document.documentElement.scrollWidth > innerWidth))
    throw Error(`Débordement tablette ${width}`);
  await tablet.close();
}
const mobile = await browser.newPage({
  locale: 'fr-CH',
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
mobile.on('pageerror', (e) => errors.push(e.message));
await mobile.goto(gameUrl);
if (!(await mobile.locator('#orientation-notice').isVisible()))
  throw Error('Écran portrait absent');
await mobile.setViewportSize({ width: 812, height: 375 });
await enterBattle(mobile);
await mobile.locator('canvas').waitFor();
await mobile.waitForTimeout(700);
if (await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth))
  throw Error('Débordement horizontal mobile');
await revealControl(mobile, '#dock-catalogue');
await mobile.locator('#dock-catalogue').tap();
await revealControl(mobile, '[data-kind="archer"]');
await mobile.locator('[data-kind="archer"]').tap();
const box = await mobile.locator('canvas').boundingBox();
if (box.height < 375 * 0.85 || box.width < 812 * 0.65 || box.y < 0 || box.y + box.height > 375)
  throw Error('Le camp n’est pas revenu à l’écran après sélection');
await mobile.touchscreen.tap(box.x + (box.width * 900) / 1100, box.y + (box.height * 350) / 620);
await mobile.waitForTimeout(250);
if ((await mobile.locator('#gold').innerText()) !== '150')
  throw Error('Recrutement tactile échoué');
await mobile.screenshot({ path: 'artifacts/pilote-mobile.png', fullPage: true });
await revealControl(mobile, '#dock-catalogue');
await mobile.locator('#dock-catalogue').tap();
await revealControl(mobile, '#feast-flavors');
await revealControl(mobile, '[data-feast-flavor="sticky"]');
await mobile.locator('[data-feast-flavor="sticky"]').tap();
await revealControl(mobile, '#start');
await mobile.locator('#start').tap();
await mobile.waitForTimeout(200);
if ((await mobile.locator('#wave').innerText()) !== '1') throw Error('Lancement mobile');
await revealControl(mobile, '[data-feast-lane="2"]');
await mobile.locator('[data-feast-lane="2"]').tap();
if (
  !(await mobile.locator('#feast-status').innerText()).includes('Bas') ||
  !(await mobile.locator('#feast-status').innerText()).includes('Miel collant')
)
  throw Error('Goûter tactile absent');
// The two games above have said all they had to: left running, they keep the machine busy
// while the next page loads.
await mobile.close();
await page.close();
// The voyage: its screens come in a package of their own, or inside the single file of the
// portable build. Either way its door opens the map and a first stage starts.
const voyage = await browser.newPage({
  locale: 'fr-CH',
  viewport: { width: 812, height: 375 },
  hasTouch: true,
});
voyage.setDefaultTimeout(15000);
voyage.on('pageerror', (e) => errors.push(e.message));
// The single file of the portable build is 27 MB to read again: on a slow machine of the
// CI, fifteen seconds were not enough beside two running games.
await voyage.goto(gameUrl, { timeout: 60000 });
await voyage.locator('#home-voyage').click();
await voyage.locator('#home-screen[data-page="voyage"]').waitFor();
if ((await voyage.locator('.voyage-stop').count()) !== 5) throw Error('Carte du voyage incomplète');
await voyage.locator('#voyage-go').click();
await voyage.locator('#start').waitFor({ state: 'visible' });
if ((await voyage.locator('#voyage-mark').innerText()) !== 'Le voyage · Étape 1 sur 5')
  throw Error('Repère du voyage absent');
console.log(
  JSON.stringify({
    desktop:
      'dock and full catalog on request, tank guide, sound toggle, recruit, checkpoint reload, unlocks, briefing, both honeys, flavour locking/pause/reset, help OK',
    mobile:
      'portrait guidance, 812×375 board >=85% height, drawer, touch recruit/start/sticky honey OK',
    voyage: 'door, map of five stops, first stage and its mark OK',
    pageErrors: errors,
  }),
);
await browser.close();
if (errors.length) process.exit(1);
