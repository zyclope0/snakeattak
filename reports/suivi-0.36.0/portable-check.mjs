import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const errors = [], requests = [], checks = [];
try {
 const context = await browser.newContext({ offline: true, viewport: { width: 1280, height: 800 }, locale: 'fr-CH' });
 const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message)); page.on('request', r => { if (r.url().startsWith('http')) requests.push(r.url()); });
 await page.goto('file://' + resolve('dist-portable/index.html'));
 await page.locator('#home-caprice-album').waitFor(); checks.push('file browser boots French portable offline');
 await page.locator('[data-language-picker]').first().selectOption('en'); await page.waitForFunction(() => document.documentElement.lang === 'en'); checks.push('English dictionary available in same offline file');
 await page.locator('#home-caprice-album').click(); assert.equal(await page.locator('[data-sticker]').count(), 36); await page.locator('#caprice-album-close').click(); checks.push('English notebook opens offline');
 await page.locator('#home-play').click(); await page.locator('#mission-launch').click(); await page.waitForFunction(() => document.querySelector('#game')?.getAttribute('aria-busy') === 'false'); await page.locator('#start').click(); await page.waitForFunction(() => document.querySelector('#wave').textContent === '1'); await page.locator('#pause').click(); checks.push('native tutorial wave starts and pauses from file');
 assert.deepEqual(errors, []); assert.deepEqual(requests, []);
 await writeFile('reports/suivi-0.36.0/portable.json', JSON.stringify({ version:'0.36.0', source:'Chromium file://, network offline, actual production portable entrypoint; no physical device', checks, errors, requests }, null, 2)+'\n'); console.log(JSON.stringify({checks,errors,requests}));
} finally { await browser.close(); }
