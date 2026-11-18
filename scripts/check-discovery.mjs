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
  assert.ok(existsSync(join(folder, 'favicon.ico')), 'Web: an icon for pages that name none');
  assert.match(game, /<link rel="apple-touch-icon" href="\/assets\/site-touch-/);
  assert.match(game, /property="og:image" content="https:\/\/[^"]+\/assets\/site-share-/);
  // A shared link to the game shows the wide picture, as the public pages do.
  assert.match(game, /property="og:title" content="[^"]+"/);
  assert.match(game, /property="og:image:width" content="1200"/);
  assert.match(game, /name="twitter:card" content="summary_large_image"/);
  // The link to the public pages sits among the buttons of the parents screen.
  assert.match(game, /<a class="about" data-copy-raw href="\/fr\/" lang="fr">[^<]+<\/a>/);
  assert.doesNotMatch(game, /<footer class="home-footer">[\s\S]*?class="about"[\s\S]*?<\/footer>/);
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
      // The payment link is on the parents page alone; every footer leads to its block.
      const parents = page.key === 'parents';
      const support = [
        ...html.matchAll(
          /<a data-support aria-describedby="[a-z]+-note" href="([^"]+)" target="_blank" rel="noopener noreferrer nofollow">([^<]+)<\/a>/g,
        ),
      ];
      assert.equal(support.length, parents ? 1 : 0, `${page.path}: support placements`);
      for (const link of support) assert.equal(link[1], SUPPORT_URL);
      assert.equal(/paypal/i.test(html), parents, `${page.path}: PayPal named for adults only`);
      // The parents page shows the block itself: its footer needs no way to it.
      const way = page.lang === 'fr' ? '/fr/parents/#soutien' : '/en/parents/#support';
      assert.equal(
        html.split('<footer')[1].includes(`<a href="${way}">`),
        !parents,
        `${page.path}: ${way}`,
      );
      if (parents) {
        assert.ok(html.includes(`<section class="support-note" id="${way.split('#')[1]}">`));
        assert.ok(
          html.includes(
            page.lang === 'fr' ? 'facultatif en CHF sur PayPal' : 'in CHF through PayPal',
          ),
        );
      }
    }
    // The picture of a shared link is wide, named with its size, and stays under what
    // messengers accept; no page shows it.
    const shared =
      /property="og:image" content="https:\/\/[^"/]+(\/assets\/site-share-[^"]+\.jpg)"/.exec(html);
    assert.ok(shared, `${page.path}: shared picture`);
    assert.ok(statSync(join(folder, shared[1])).size <= 300_000, 'shared picture under 300 KB');
    assert.match(html, /property="og:image:width" content="1200"/);
    assert.match(html, /name="twitter:card" content="summary_large_image"/);
    // The pictures a page shows are light.
    for (const match of html.matchAll(/<img[^>]+src="(\/[^"]+)"/g))
      assert.ok(
        statSync(join(folder, match[1])).size <= 60_000,
        `${page.path}: ${match[1]} is too heavy for a page`,
      );
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
