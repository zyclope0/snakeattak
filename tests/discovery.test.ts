import test from 'node:test';
import assert from 'node:assert/strict';
import { DISCOVERY_PAGES } from '../deploy/discoveryCopy.ts';
import {
  discoveryPageHtml,
  discoverySitemap,
  discoveryRobots,
  augmentGamePage,
  GAME_PAGE,
  WEB_HEAD_BUDGET,
  webHeadBytes,
  resolveSupportUrl,
  SUPPORT_URL,
} from '../deploy/discovery.ts';
import { SITE_ORIGIN } from '../src/site.ts';

const assets = {
  css: '/assets/discovery-12345678.css',
  share: '/assets/site-icon-12345678.png',
  tab: '/assets/site-tab-12345678.png',
  touch: '/assets/site-touch-12345678.png',
  logo: '/assets/site-logo-12345678.png',
  hero: '/assets/site-hero-12345678.webp',
  characters: ['/assets/site-club-12345678.webp', '/assets/site-ninja-12345678.webp'],
};

const pictures = { share: assets.share, touch: assets.touch };

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
    // The policy is one page in both languages: an English page opens its English half.
    assert.ok(html.includes(`href="/confidentialite/${page.lang === 'en' ? '#en' : ''}"`));
    // A small picture for the tab and the logo, a light one for the hero, the icon of
    // 512 px for a shared link only.
    assert.ok(
      html.includes(`<link rel="icon" type="image/png" sizes="48x48" href="${assets.tab}">`),
    );
    assert.ok(html.includes(`<link rel="apple-touch-icon" href="${assets.touch}">`));
    assert.ok(html.includes(`property="og:image" content="${SITE_ORIGIN}${assets.share}"`));
    assert.ok(html.includes(`<img src="${assets.logo}" alt="" width="48" height="48">`));
    assert.ok(html.includes(`<img class="hero" src="${assets.hero}"`));
    assert.equal(html.split(assets.share).length, 2, 'the heavy icon is not shown on the page');
  }
});

test('the new snakes carry their English names on the English pages', () => {
  const updates = DISCOVERY_PAGES.find((p) => p.lang === 'en' && p.key === 'updates')!;
  const html = discoveryPageHtml(updates, assets);
  assert.match(html, /Big Fangs, the Rare Snake and the Ninja Snake/);
  assert.doesNotMatch(html, /Grands crocs|serpent rare|serpent ninja/);
});

test('sitemap exposes actual public pages with language pairs, no player or seed data', () => {
  const xml = discoverySitemap();
  for (const page of DISCOVERY_PAGES)
    assert.ok(xml.includes(`<loc>${SITE_ORIGIN}${page.path}</loc>`));
  assert.ok(xml.includes(`<loc>${SITE_ORIGIN}/</loc>`));
  assert.ok(xml.includes(`<loc>${SITE_ORIGIN}/confidentialite/</loc>`));
  assert.doesNotMatch(xml, /lastmod|departure|player|seed|prototype/);
  // A search engine must be able to read the prototype to see its « noindex » header.
  assert.doesNotMatch(discoveryRobots(), /Disallow/);
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
  const html = augmentGamePage(shell, pictures);
  assert.match(html, /name="description"/);
  // Both names and both languages, kept as written whatever language the game switches to.
  assert.ok(html.includes(`<title data-copy-raw>${GAME_PAGE.title}</title>`));
  assert.equal(GAME_PAGE.title, 'La Conquête des Serpents · Snake Attack TD');
  assert.match(GAME_PAGE.description, /^Jeu de défense gratuit .* Free defense game: /);
  assert.ok(html.includes(`<link rel="apple-touch-icon" href="${pictures.touch}">`));
  assert.ok(html.includes(`property="og:image" content="${SITE_ORIGIN}${pictures.share}"`));
  assert.match(html, /property="og:site_name" content="Snake Attack TD"/);
  // One link per language in a classed list: no inline style, no extra row.
  assert.match(html, /<nav class="about" data-home-page="home" data-copy-raw aria-label=/);
  assert.doesNotMatch(html, /style=/);
  assert.ok(html.includes(`rel="canonical" href="${SITE_ORIGIN}/"`));
  assert.match(html, /href="\/fr\/"/);
  assert.match(html, /href="\/en\/"/);
  assert.match(html, /id="career-status">Local/);
  assert.doesNotMatch(html, /data-support|localStorage|<script/);
});

test('what the website adds to the game page is counted and bounded', () => {
  const title = 'La Conquête des Serpents';
  const added = webHeadBytes(title, pictures);
  assert.ok(added > 0 && added <= WEB_HEAD_BUDGET, `${added} octets`);
  assert.equal(WEB_HEAD_BUDGET, 1024);
  // The count is exact on a real page: the same bytes whatever the page holds.
  const page = `<html><head><title>${title}</title></head><body><main>Jeu</main><footer class="home-footer"><span>Local</span></footer></body></html>`;
  assert.equal(Buffer.byteLength(augmentGamePage(page, pictures)) - Buffer.byteLength(page), added);
});

test('discovery leaves the compact parents content intact', () => {
  const parents = '<details id="home-parent-options"><section>Parents</section></details>';
  const footer = '<footer class="home-footer"><span id="career-status">Local</span></footer>';
  const html = augmentGamePage(
    `<html><head></head><body>${parents}${footer}</body></html>`,
    pictures,
  );
  assert.ok(html.includes(parents), 'no extra row in the tightly fitted parents screen');
  assert.match(html, /id="career-status">Local/);
});

test('Web verification identifies the approved AdSense account without ad delivery or layout changes', () => {
  const body = '<body><main id="game">Game</main></body>';
  const html = augmentGamePage('<html><head></head>' + body + '</html>', pictures);
  assert.ok(
    html.includes('<meta name="google-adsense-account" content="ca-pub-8498417364292905">'),
  );
  assert.equal((html.match(/google-adsense-account/g) ?? []).length, 1);
  assert.ok(html.includes(body));
  assert.doesNotMatch(html, /adsbygoogle|googlesyndication|<iframe|<ins/);
});
