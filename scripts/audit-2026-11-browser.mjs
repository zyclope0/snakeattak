import { revealControl } from '../tests/reveal-controls.mjs';
// Audit 2026-11 : mesures d'interface reprises de l'audit du 7 novembre 2026.
// Usage : npm run build && node scripts/audit-2026-11-browser.mjs [--strict]
// Sans --strict : écrit le rapport et liste les écarts. Avec --strict : code de sortie 1 au premier écart.
import { visibleWords } from './visible-words.mjs';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright-core';
const strict = process.argv.includes('--strict');
const lot1Only = process.argv.includes('--lot1');
const PORT = 4310;
const URL = `http://127.0.0.1:${PORT}/`;
const report = { date: new Date().toISOString(), checks: [] };
const check = (name, ok, value, target) => {
  report.checks.push({
    name,
    ok,
    value,
    target,
    lot: /mots visibles|vouvoiement/.test(name) ? 2 : 1,
  });
  console.log(`${ok ? 'OK  ' : 'ÉCART'} ${name} : ${JSON.stringify(value)} (cible : ${target})`);
};
async function toBattle(page) {
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForSelector('#home-screen:not([hidden])');
  await page.click('#home-expeditions');
  await page.waitForTimeout(300);
  await page.locator('#mission-cards button').first().click();
  await page.waitForSelector('#mission-dialog[open]');
  await page.waitForTimeout(300);
  await page.locator('#mission-launch').click();
  await page.waitForFunction(
    () => document.getElementById('game')?.getAttribute('aria-busy') === 'false',
  );
  await page.waitForTimeout(800);
}
let server, browser;
try {
  server = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    String(PORT),
    '--strictPort',
  ]);
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(URL)).ok) break;
    } catch {}
    if (server.exitCode !== null || i > 100)
      throw Error('Preview indisponible : lancer npm run build avant');
    await delay(100);
  }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const errors = [];
  // 1-2. Ordinateur : défilement remis en haut et plateau entier visible
  for (const [w, h] of [
    [1280, 800],
    [1366, 768],
    [1920, 1080],
  ]) {
    const ctx = await browser.newContext({
      locale: 'fr-CH',
      viewport: { width: w, height: h },
    });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    await toBattle(page);
    const m = await page.evaluate(() => {
      const r = document.querySelector('#game').getBoundingClientRect();
      return {
        scrollY: Math.round(scrollY),
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        innerHeight,
      };
    });
    check(`défilement après lancement ${w}x${h}`, m.scrollY === 0, m.scrollY, '0 px');
    check(
      `plateau entier visible ${w}x${h}`,
      m.top >= 0 && m.bottom <= m.innerHeight,
      m,
      'top ≥ 0 et bottom ≤ hauteur de fenêtre',
    );
    if (w === 1280) {
      // 3. Mots visibles avant la 1re vague, mission 1
      const words = await page.evaluate(visibleWords, '#app');
      check(
        'mots visibles avant la 1re vague (mission 1, 1280x800)',
        words <= 60,
        words,
        '≤ 60 (lot 2)',
      );
      // vouvoiement
      const vous = await page.evaluate(
        () =>
          (document.getElementById('app').innerText.match(/\b(vous|votre|vos)\b/gi) || []).length,
      );
      check('aucun vouvoiement visible', vous === 0, vous, '0 (lot 2)');
    }
    await ctx.close();
  }
  // 4. Téléphone paysage : cibles tactiles du HUD
  {
    const ctx = await browser.newContext({
      locale: 'fr-CH',
      viewport: { width: 812, height: 375 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    await toBattle(page);
    await page.evaluate(() => scrollTo(0, 0));
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('button, a[href], select, input')]
        .filter((e) => {
          const r = e.getBoundingClientRect();
          const s = getComputedStyle(e);
          return (
            r.width > 0 &&
            r.height > 0 &&
            r.top < innerHeight &&
            r.bottom > 0 &&
            r.left < innerWidth &&
            r.right > 0 &&
            s.visibility !== 'hidden'
          );
        })
        .map((e) => {
          const r = e.getBoundingClientRect();
          return {
            t: (e.innerText || e.getAttribute('aria-label') || e.id).trim().slice(0, 24),
            w: Math.round(r.width),
            h: Math.round(r.height),
          };
        })
        .filter((r) => Math.min(r.w, r.h) < 48),
    );
    check(
      'cibles tactiles < 48 px (812x375, plateau)',
      small.length === 0,
      small,
      'aucune (Android 48 dp)',
    );
    const board = await page.evaluate(() => {
      const r = document.querySelector('#game canvas').getBoundingClientRect();
      return {
        h: Math.round((r.height / innerHeight) * 100),
        w: Math.round((r.width / innerWidth) * 100),
      };
    });
    check('plateau en paysage téléphone (% hauteur)', board.h >= 85, board, '≥ 85 % de la hauteur');
    await ctx.close();
  }
  // 5. Portrait : consigne de rotation
  {
    const ctx = await browser.newContext({
      locale: 'fr-CH',
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'load' });
    await page.waitForTimeout(500);
    const notice = await page.evaluate(() => {
      const n = document.getElementById('orientation-notice');
      return !!n && !n.hidden && getComputedStyle(n).display !== 'none';
    });
    check('consigne « Tourne ton téléphone » en portrait', notice, notice, 'visible');
    await ctx.close();
  }
  // 6. Nouveau tirage : terrain toujours différent
  {
    const ctx = await browser.newContext({
      locale: 'fr-CH',
      viewport: { width: 1280, height: 800 },
    });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'load' });
    await page.waitForSelector('#home-screen:not([hidden])');
    await page.click('#home-expeditions');
    await page.locator('#mission-cards button').first().click();
    await page.waitForSelector('#mission-dialog[open]');
    const lands = [];
    for (let i = 0; i < 10; i++) {
      lands.push((await page.locator('#mission-land').innerText()).trim());
      await revealControl(page, '#mission-reroll');
      await page.locator('#mission-reroll').click();
      await page.waitForTimeout(60);
    }
    const repeats = lands.filter((t, i) => i && t === lands[i - 1]).length;
    check('nouveau tirage : terrain répété', repeats === 0, repeats, '0 sur 10');
    await ctx.close();
  }
  check('erreurs JavaScript', errors.length === 0, errors.slice(0, 5), 'aucune');
  await mkdir('artifacts/reports', { recursive: true });
  await writeFile(
    'artifacts/reports/audit-2026-11-after-lot2.json',
    JSON.stringify(report, null, 2),
  );
  const gaps = report.checks.filter((c) => !c.ok).length;
  console.log(
    `\n${report.checks.length - gaps}/${report.checks.length} contrôles OK — rapport : artifacts/reports/audit-2026-11-after-lot2.json`,
  );
  const blocking = report.checks.filter((c) => !c.ok && (!lot1Only || c.lot === 1));
  console.log(
    `${blocking.length} écart(s) bloquant(s) pour ${lot1Only ? 'le lot 1 ; objectifs du lot 2 conservés dans le rapport' : 'les contrôles d’interface audités'}`,
  );
  if (strict && blocking.length) process.exitCode = 1;
} finally {
  await browser?.close();
  server?.kill();
}
