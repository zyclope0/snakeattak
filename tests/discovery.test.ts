import test from 'node:test';
import assert from 'node:assert/strict';
import { DISCOVERY_PAGES } from '../deploy/discoveryCopy.ts';
import {
  discoveryPageHtml,
  discoverySitemap,
  discoveryRobots,
  augmentGamePage,
  resolveSupportUrl,
  SUPPORT_URL,
} from '../deploy/discovery.ts';
import { SITE_ORIGIN } from '../src/site.ts';

const assets = {
  css: '/assets/discovery-12345678.css',
  icon: '/assets/site-icon-12345678.png',
  hero: '/assets/site-hero-12345678.webp',
  characters: ['/assets/site-club-12345678.webp', '/assets/site-ninja-12345678.webp'],
};

test('discovery has five genuine pages in both languages and reciprocal language links', () => {
  assert.equal(DISCOVERY_PAGES.length, 10);
  assert.equal(new Set(DISCOVERY_PAGES.map((p) => p.path)).size, 10);
  for (const page of DISCOVERY_PAGES) {
    const html = discoveryPageHtml(page, assets);
    const other = DISCOVERY_PAGES.find((p) => p.key === page.key && p.lang !== page.lang)!;
    assert.ok(other);
    assert.match(html, new RegExp(`<html lang="${page.lang}">`));
    assert.ok(html.includes(`rel="canonical" href="${SITE_ORIGIN}${page.path}"`));
    assert.ok(html.includes(`hreflang="${other.lang}" href="${SITE_ORIGIN}${other.path}"`));
    assert.match(html, /<meta name="description" content="[^"]+"/);
    assert.match(html, /property="og:image"/);
    assert.equal((html.match(/<h1[ >]/g) ?? []).length, 1);
    assert.ok(page.blocks.length >= 2);
    assert.match(html, /href="\/"/);
    assert.doesNotMatch(html, /<iframe|<form|<script(?! type="application\/ld\+json")|\son\w+=/);
    assert.doesNotMatch(html, /aggregateRating|reviewCount|adsbygoogle|googletagmanager/);
    assert.match(html, /href="\/confidentialite\/"/);
  }
});

test('sitemap exposes actual public pages with language pairs, no player or seed data', () => {
  const xml = discoverySitemap();
  for (const page of DISCOVERY_PAGES)
    assert.ok(xml.includes(`<loc>${SITE_ORIGIN}${page.path}</loc>`));
  assert.ok(xml.includes(`<loc>${SITE_ORIGIN}/</loc>`));
  assert.ok(xml.includes(`<loc>${SITE_ORIGIN}/confidentialite/</loc>`));
  assert.doesNotMatch(xml, /lastmod|departure|player|seed|prototype/);
  assert.match(discoveryRobots(), /Disallow: \/prototype-v4.html/);
  assert.ok(discoveryRobots().includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`));
});

test('approved support is active only in public footers and parents; null still disables it', () => {
  assert.equal(SUPPORT_URL, 'https://www.paypal.com/ncp/payment/XXQ7BEAZQ3QZL');
  assert.equal(resolveSupportUrl(null), null);
  assert.equal(resolveSupportUrl(''), null);
  for (const page of DISCOVERY_PAGES) {
    assert.doesNotMatch(
      discoveryPageHtml(page, assets, null),
      /data-support|Soutenir le développement|Support development/,
    );
    const enabled = discoveryPageHtml(page, assets);
    assert.ok(enabled.includes(`href="${SUPPORT_URL}"`));
    assert.ok(
      enabled.includes(page.lang === 'fr' ? 'Soutenir le développement' : 'Support development'),
    );
    assert.ok(
      enabled.includes(
        page.lang === 'fr' ? 'facultatif en CHF sur PayPal' : 'in CHF through PayPal',
      ),
    );
    assert.equal((enabled.match(/data-support/g) ?? []).length, page.key === 'parents' ? 2 : 1);
    assert.match(enabled, /rel="noopener noreferrer nofollow"/);
    assert.match(enabled, /data-support/);
    if (page.key !== 'parents') {
      const main = enabled.split('<main')[1].split('</main>')[0];
      assert.doesNotMatch(main, /data-support/);
    }
  }
});

test('support rejects unsafe URLs, credentials, and unsafe HTML payloads', () => {
  for (const value of [
    'javascript:alert(1)',
    'http://example.com',
    'data:text/html,hello',
    'https://user:pass@example.com',
    '//example.com',
    'not a url',
  ])
    assert.throws(() => resolveSupportUrl(value));
  const url = 'https://example.com/support?label="<img src=x onerror=alert(1)>';
  const html = discoveryPageHtml(DISCOVERY_PAGES[0], assets, url);
  assert.doesNotMatch(html, /<img src=x|"<img/);
});

test('only the Web gets public metadata and links; game markup and saves remain in place', () => {
  const shell =
    '<html><head><title>Game</title></head><body><details id="home-parent-options"></details><footer class="home-footer"><span id="career-status">Local</span></footer></body></html>';
  const html = augmentGamePage(shell);
  assert.match(html, /name="description"/);
  assert.ok(html.includes(`rel="canonical" href="${SITE_ORIGIN}/"`));
  assert.match(html, /href="\/fr\/"/);
  assert.match(html, /href="\/en\/"/);
  assert.match(html, /id="career-status">Local/);
  assert.doesNotMatch(html, /data-support|localStorage|<script/);
});

test('discovery leaves the compact parents content intact', () => {
  const parents = '<details id="home-parent-options"><section>Parents</section></details>';
  const footer = '<footer class="home-footer"><span id="career-status">Local</span></footer>';
  const html = augmentGamePage(`<html><head></head><body>${parents}${footer}</body></html>`);
  assert.ok(html.includes(parents), 'no extra row in the tightly fitted parents screen');
  assert.match(html, /id="career-status">Local/);
});

test('Web verification identifies the approved AdSense account without ad delivery or layout changes', () => {
  const body = '<body><main id="game">Game</main></body>';
  const html = augmentGamePage('<html><head></head>' + body + '</html>');
  assert.ok(
    html.includes('<meta name="google-adsense-account" content="ca-pub-8498417364292905">'),
  );
  assert.equal((html.match(/google-adsense-account/g) ?? []).length, 1);
  assert.ok(html.includes(body));
  assert.doesNotMatch(html, /adsbygoogle|googlesyndication|<iframe|<ins/);
});
