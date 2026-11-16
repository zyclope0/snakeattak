// Checks generated files, so missing links or Android leakage fail the actual build.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { DISCOVERY_PAGES } from '../deploy/discoveryCopy.ts';
import { SUPPORT_URL } from '../deploy/discovery.ts';
import {
  ADSENSE_PUBLISHER_ID,
  adSenseAdsTxt,
  adSenseVerificationMeta,
} from '../deploy/adsenseVerification.ts';

const folder = process.argv[2] ?? 'dist';
const android = folder === 'dist-android';
const game = readFileSync(join(folder, 'index.html'), 'utf8');
if (android) {
  for (const name of ['fr', 'en', 'sitemap.xml', 'robots.txt', 'ads.txt'])
    assert.ok(!existsSync(join(folder, name)), `Android must not include ${name}`);
  assert.doesNotMatch(
    game,
    /data-support|google-adsense-account|href="\/(?:fr|en)\/"|rel="canonical"/,
  );
  for (const name of [
    'index.html',
    ...readdirSync(join(folder, 'assets'))
      .filter((n) => n.endsWith('.js'))
      .map((n) => `assets/${n}`),
  ]) {
    const content = readFileSync(join(folder, name), 'utf8');
    if (SUPPORT_URL)
      assert.ok(
        !content.includes(SUPPORT_URL),
        `${name}: Android must not contain the payment URL`,
      );
    assert.ok(
      !content.includes(ADSENSE_PUBLISHER_ID),
      `${name}: Android must not contain the AdSense account`,
    );
  }
  console.log('Android: no discovery pages, public metadata or payment URL in shipped code');
} else {
  assert.doesNotMatch(game, /data-support|paypal\.com\/ncp\/payment|adsbygoogle|googlesyndication/);
  assert.ok(game.includes(adSenseVerificationMeta()), 'Web: exact passive AdSense account meta');
  assert.equal(
    readFileSync(join(folder, 'ads.txt'), 'utf8'),
    adSenseAdsTxt(),
    'Web: exact publisher authorization',
  );
  assert.match(game, /href="\/fr\/"/);
  assert.match(game, /href="\/en\/"/);
  assert.ok(existsSync(join(folder, 'sitemap.xml')));
  assert.ok(existsSync(join(folder, 'robots.txt')));
  let links = 0;
  for (const page of DISCOVERY_PAGES) {
    const html = readFileSync(join(folder, page.path, 'index.html'), 'utf8');
    assert.ok(Buffer.byteLength(html) < 25000, `${page.path} stays lightweight`);
    assert.doesNotMatch(
      html,
      /<script[^>]+src=|<iframe|https?:\/\/(?:fonts\.google|www\.googletag)/,
    );
    if (!SUPPORT_URL) assert.doesNotMatch(html, /data-support/);
    else {
      const support = [
        ...html.matchAll(
          /<a data-support href="([^"]+)" target="_blank" rel="noopener noreferrer nofollow">([^<]+)<\/a>/g,
        ),
      ];
      assert.equal(
        support.length,
        page.key === 'parents' ? 2 : 1,
        `${page.path}: support placements`,
      );
      for (const link of support) assert.equal(link[1], SUPPORT_URL);
      assert.ok(
        html.includes(
          page.lang === 'fr' ? 'facultatif en CHF sur PayPal' : 'in CHF through PayPal',
        ),
      );
    }
    for (const match of html.matchAll(/(?:href|src)="(\/[^"#]*)"/g)) {
      const path = join(folder, decodeURI(match[1]));
      assert.ok(existsSync(path), `${page.path}: missing ${match[1]}`);
      if (statSync(path).isDirectory()) assert.ok(existsSync(join(path, 'index.html')));
      links++;
    }
    const structured = /<script type="application\/ld\+json">([^<]+)<\/script>/.exec(html)?.[1];
    assert.ok(structured);
    assert.equal(JSON.parse(structured).inLanguage, page.lang);
  }
  console.log(
    `Discovery: ${DISCOVERY_PAGES.length} pages, ${links} local links/resources checked; support ${SUPPORT_URL ? 'configured' : 'hidden'}`,
  );
}
