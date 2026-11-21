// Première partie d'un profil neuf sur un petit téléphone couché (780×360, tactile) : on ne
// touche que le grand bouton proposé à chaque écran, comme un enfant qui ne lit pas tout, et
// on photographie chaque écran. Relève les cibles tactiles de moins de 48 px visibles.
//   node --experimental-strip-types scripts/hygiene/first-game.mjs [dossier]
import { mkdir, writeFile } from 'node:fs/promises';
import { open, start, status, boardReady, text, numbers } from './harness.mjs';

const [dir = 'dist-android'] = process.argv.slice(2);
await mkdir('artifacts/hygiene/premiere', { recursive: true });
const { browser, page, report } = await open({ dir, viewport: { width: 780, height: 360 } });
const steps = [];
let n = 0;
/** Visible controls smaller than a finger, and whether the page scrolls sideways. */
const audit = () =>
  page.evaluate(() => {
    const seen = (e) => {
      const r = e.getBoundingClientRect();
      if (!r.width || !r.height || getComputedStyle(e).visibility === 'hidden') return false;
      const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return !!top && (e.contains(top) || top.contains(e));
    };
    const small = [...document.querySelectorAll('button, a[href], select, input, summary')]
      .filter((e) => !e.disabled && seen(e))
      .map((e) => {
        const r = e.getBoundingClientRect();
        return [e.id || e.className || e.tagName, Math.round(r.width), Math.round(r.height)];
      })
      .filter(([, w, h]) => w < 48 || h < 48);
    return { small, sideways: document.documentElement.scrollWidth - innerWidth };
  });
async function shot(name) {
  const file = `artifacts/hygiene/premiere/${String(++n).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path: file });
  steps.push({
    step: name,
    ...(await audit()),
    primary: await text(page, '#home-primary').catch(() => ''),
  });
}
try {
  const t0 = Date.now();
  await start(page);
  steps.push({ step: 'démarrage', ms: Date.now() - t0 });
  await shot('accueil');
  await page.locator('#home-primary').tap();
  await page.waitForTimeout(900);
  await shot('apres-jouer');
  // Whatever window the big button opened, its own primary button goes on.
  for (const selector of ['#mission-launch', '#home-play', '#departure-start']) {
    if (
      await page
        .locator(selector)
        .isVisible()
        .catch(() => false)
    ) {
      await page.locator(selector).tap();
      await page.waitForTimeout(900);
      await shot(`apres-${selector.slice(1)}`);
    }
  }
  await boardReady(page);
  await page.waitForTimeout(1500);
  await shot('plateau');
  for (let wave = 1; wave <= 3 && (await status(page)) === 'preparing'; wave++) {
    await page.locator('#start').tap();
    await page.waitForTimeout(2500);
    await shot(`vague-${wave}-debut`);
    for (let i = 0; i < 240 && (await status(page)) === 'fighting'; i++)
      await page.waitForTimeout(1000);
    await page.waitForTimeout(1200);
    await shot(`vague-${wave}-fin`);
  }
  steps.push({ step: 'fin', ...(await numbers(page)) });
  await shot('resultat');
} finally {
  await writeFile(
    'artifacts/hygiene/first-game.json',
    JSON.stringify({ recipe: 'first-game', dir, steps, errors: report.errors }, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        steps: steps.map((s) => ({ ...s, small: s.small?.length ? s.small : undefined })),
        errors: report.errors,
      },
      null,
      1,
    ),
  );
  await browser.close();
}
