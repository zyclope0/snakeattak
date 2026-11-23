import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import config from '../capacitor.config.ts';
import { MIN_WEBVIEW_VERSION, OLD_WEBVIEW_PAGE } from '../deploy/androidWebView.ts';
import { assertAppConfig, assertOldWebViewPage } from '../deploy/androidDistribution.ts';
import { oldWebViewPageHtml } from '../deploy/oldWebViewPage.ts';
import * as FR from '../src/texts/fr/oldWebView.ts';
import * as EN from '../src/texts/en/oldWebView.ts';

const info = { android: { applicationId: 'com.conqueteserpents.famille' } };
const packaged = { 'index.html': 'game', [OLD_WEBVIEW_PAGE]: 'page' };
/** The configuration as Capacitor copies it into the application. */
const copied = () => JSON.parse(JSON.stringify(config));

test('below Chrome 108 the application shows its page for an old WebView', () => {
  assert.equal(MIN_WEBVIEW_VERSION, 108);
  assert.equal(config.android?.minWebViewVersion, MIN_WEBVIEW_VERSION);
  assert.equal(config.server?.errorPath, OLD_WEBVIEW_PAGE);
  assert.match(OLD_WEBVIEW_PAGE, /^[a-z-]+\.html$/);
  assertAppConfig(copied(), info, packaged, false);
});

test('the copied configuration keeps the page, the floor and nothing else in a release', () => {
  const { [OLD_WEBVIEW_PAGE]: _page, ...withoutPage } = packaged;
  const cases: [string, (value: ReturnType<typeof copied>) => void, unknown?][] = [
    ['remote server', (value) => (value.server.url = 'https://example.org')],
    ['diagnostic start', (value) => (value.server.appStartPath = '/?perf=1')],
    ['no page', (value) => delete value.server.errorPath],
    ['other page', (value) => (value.server.errorPath = 'index.html')],
    ['no floor', (value) => delete value.android],
    ['lower floor', (value) => (value.android.minWebViewVersion = 60)],
    ['other application', (value) => (value.appId = 'com.example')],
  ];
  for (const [name, change] of cases) {
    const value = copied();
    change(value);
    assert.throws(() => assertAppConfig(value, info, packaged, false), name);
  }
  assert.throws(() => assertAppConfig(copied(), info, withoutPage, false), /packaged/);
  // The diagnostic build starts on the performance panel, with the same page.
  const diagnostic = copied();
  diagnostic.server.appStartPath = '/?perf=1';
  assertAppConfig(diagnostic, info, packaged, true);
});

test('the page says it in both languages, with the words of the catalogue', () => {
  const page = oldWebViewPageHtml();
  const escape = (value: string) => value.replaceAll('&', '&amp;');
  for (const words of [FR, EN])
    for (const value of Object.values(words)) assert.ok(page.includes(escape(value)), value);
  assert.deepEqual(Object.keys(EN).sort(), Object.keys(FR).sort());
  assert.match(page, /<html lang="fr">/);
  assert.match(page, /<h1 class="title">Le jeu ne peut pas s’ouvrir<\/h1>/);
  assert.match(page, /<section lang="en">\n<h2 class="title">The game cannot open<\/h2>/);
  assert.equal(page.match(/<h1\b/g)?.length, 1);
  assert.match(FR.androidSystemWebViewEstTropAncien, /« Android System WebView »/);
  assert.match(EN.androidSystemWebViewEstTropAncien, /“Android System WebView”/);
});

test('the page stands alone: no script, nothing to fetch', () => {
  const root = mkdtempSync(join(tmpdir(), 'serpents-webview-'));
  try {
    writeFileSync(join(root, OLD_WEBVIEW_PAGE), oldWebViewPageHtml());
    assertOldWebViewPage(root);
    for (const extra of [
      '<script src="./assets/index.js"></script>',
      '<link rel="stylesheet" href="./assets/index.css">',
      '<img src="./icon.png" alt="">',
      '<style>body { background: url(./paper.webp) }</style>',
    ]) {
      writeFileSync(join(root, OLD_WEBVIEW_PAGE), oldWebViewPageHtml().replace('</body>', extra));
      assert.throws(() => assertOldWebViewPage(root), /stands alone/, extra);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
  assert.throws(() => assertOldWebViewPage(tmpdir() + '/serpents-nowhere'), /ENOENT/);
});
