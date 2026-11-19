// Environment probe only: no game, fixture, network request or skipped test.
import { chromium } from '@playwright/test';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
await browser.close();
console.log('Chromium starts with the runner system libraries');
