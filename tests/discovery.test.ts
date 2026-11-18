import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { imageMetadata } from '../deploy/imageMetadata.ts';
import { MISSIONS } from '../src/missions.ts';
import { TOTAL_WAVES } from '../src/gameConstants.ts';
import { CURRENT_VOYAGE_VERSION, VOYAGE_TUNINGS } from '../src/voyageTuning.ts';
import { CURRENT_BALANCE_REVISION, lateEggRule } from '../src/balanceRevision.ts';
import { NINJA_DODGES } from '../src/enemyAbilities.ts';
import { PLAYER_IDS } from '../src/players.ts';
import * as FR from '../src/texts/fr/page.ts';
import * as EN from '../src/texts/en/page.ts';
import { DISCOVERY_PAGES } from '../deploy/discoveryCopy.ts';
import {
  discoveryPageHtml,
  discoverySitemap,
  discoveryRobots,
  augmentGamePage,
  notFoundPageHtml,
  GAME_PAGE,
  WEB_HEAD_BUDGET,
  webHeadBytes,
  resolveSupportUrl,
  SUPPORT_URL,
  SHARE_PICTURE,
} from '../deploy/discovery.ts';
import { CONTACT_EMAIL, SITE_ORIGIN } from '../src/site.ts';
import { PRIVACY_POLICY } from '../src/i18n/privacyPolicy.ts';

const assets = {
  css: '/assets/discovery-12345678.css',
  share: '/assets/site-share-12345678.jpg',
  tab: '/assets/site-tab-12345678.png',
  touch: '/assets/site-touch-12345678.png',
  logo: '/assets/site-logo-12345678.png',
  hero: '/assets/site-hero-12345678.webp',
  characters: ['/assets/site-club-12345678.webp', '/assets/site-ninja-12345678.webp'],
};

const pictures = { share: assets.share, touch: assets.touch };
const policyText = (language: 'fr' | 'en') => JSON.stringify(PRIVACY_POLICY[language]);

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
    // A small picture for the tab and the logo, a light one for the hero, a wide battle
    // for a shared link only.
    assert.ok(
      html.includes(`<link rel="icon" type="image/png" sizes="48x48" href="${assets.tab}">`),
    );
    assert.ok(html.includes(`<link rel="apple-touch-icon" href="${assets.touch}">`));
    assert.ok(html.includes(`property="og:image" content="${SITE_ORIGIN}${assets.share}"`));
    assert.ok(html.includes(`<img src="${assets.logo}" alt="" width="48" height="48">`));
    assert.ok(html.includes(`<img class="hero" src="${assets.hero}"`));
    assert.equal(html.split(assets.share).length, 2, 'the shared picture is not on the page');
    assert.ok(html.includes(`property="og:image:width" content="${SHARE_PICTURE.width}"`));
    assert.ok(html.includes(`property="og:image:height" content="${SHARE_PICTURE.height}"`));
    assert.ok(html.includes('name="twitter:card" content="summary_large_image"'));
  }
});

test('the new snakes carry their English names on the English pages', () => {
  const updates = DISCOVERY_PAGES.find((p) => p.lang === 'en' && p.key === 'updates')!;
  const html = discoveryPageHtml(updates, assets);
  for (const name of ['Big Fangs', 'The Rare Snake', 'The Ninja Snake'])
    assert.ok(html.includes(name), name);
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

test('the payment link is on the parents page only; other footers lead there; null disables it', () => {
  assert.equal(SUPPORT_URL, 'https://www.paypal.com/ncp/payment/XXQ7BEAZQ3QZL');
  assert.equal(resolveSupportUrl(null), null);
  assert.equal(resolveSupportUrl(''), null);
  for (const page of DISCOVERY_PAGES) {
    assert.doesNotMatch(
      discoveryPageHtml(page, assets, null),
      /data-support|Soutenir le développement|Support development|paypal/i,
    );
    const enabled = discoveryPageHtml(page, assets);
    const parents = page.key === 'parents';
    const way = page.lang === 'fr' ? '/fr/parents/#soutien' : '/en/parents/#support';
    const label = page.lang === 'fr' ? 'Soutenir le développement' : 'Support development';
    // Every other footer names the support and leads to the block written for adults; the
    // parents page shows the block itself.
    const footer = enabled.split('<footer')[1];
    assert.equal(footer.includes(`<a href="${way}">${label}</a>`), !parents);
    assert.doesNotMatch(footer, /data-support|paypal/i);
    // PayPal is named, and reached, in that block alone.
    assert.equal((enabled.match(/data-support/g) ?? []).length, parents ? 1 : 0);
    assert.equal(enabled.includes(`href="${SUPPORT_URL}"`), parents);
    assert.equal(/paypal/i.test(enabled), parents);
    if (!parents) continue;
    const block = enabled.split('<section class="support-note"')[1].split('</section>')[0];
    assert.ok(block.startsWith(` id="${way.split('#')[1]}">`));
    assert.match(block, /data-support/);
    // A screen reader reads the sentence written for adults with the link.
    const note = `${way.split('#')[1]}-note`;
    assert.ok(block.includes(`<p id="${note}">`) && block.includes(`aria-describedby="${note}"`));
    assert.match(block, /rel="noopener noreferrer nofollow"/);
    assert.ok(
      block.includes(page.lang === 'fr' ? 'facultatif en CHF sur PayPal' : 'in CHF through PayPal'),
    );
  }
});

test('the parents page says who made the game, with the contact of the policy', () => {
  for (const page of DISCOVERY_PAGES.filter((p) => p.key === 'parents')) {
    const html = discoveryPageHtml(page, assets);
    assert.ok(html.includes(page.lang === 'fr' ? 'Qui a fait ce jeu ?' : 'Who made this game?'));
    assert.ok(html.includes('zyclope'));
    assert.ok(html.includes(CONTACT_EMAIL));
    assert.ok(policyText(page.lang).includes(CONTACT_EMAIL), 'the address the policy gives');
    assert.match(
      html,
      page.lang === 'fr'
        ? /<a href="\/confidentialite\/">Lire la politique de confidentialité<\/a><\/section>/
        : /<a href="\/confidentialite\/#en">Read the privacy policy<\/a><\/section>/,
    );
  }
  // Only a block that names a link gets one.
  const home = discoveryPageHtml(DISCOVERY_PAGES[0], assets);
  assert.doesNotMatch(home.split('<div class="stories">')[1].split('</main>')[0], /<a /);
});

test('each home page names the game in the other language once, and says who it is for', () => {
  const fr = DISCOVERY_PAGES.find((p) => p.key === 'home' && p.lang === 'fr')!;
  const en = DISCOVERY_PAGES.find((p) => p.key === 'home' && p.lang === 'en')!;
  assert.match(fr.title, /tower defense gratuit pour enfants/);
  assert.match(en.title, /free tower defense game for kids/);
  const words = (page: typeof fr) => [page.lead, ...page.blocks.map((b) => b.text)].join(' ');
  assert.equal(words(fr).split('Snake Attack TD').length, 2);
  assert.equal(words(en).split('La Conquête des Serpents').length, 2);
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
    '<html><head><title>Game</title></head><body><nav class="parent-actions" aria-label="Aide"><button id="home-family">Sauvegarde</button></nav><details id="home-parent-options"></details><footer class="home-footer"><span id="career-status">Local</span></footer></body></html>';
  const html = augmentGamePage(shell, pictures);
  assert.match(html, /name="description"/);
  // The title stays the game's own, in the player's language; the description holds both.
  assert.match(html, /<title>Game<\/title>/);
  assert.match(GAME_PAGE.description, /^Jeu de défense gratuit .* Free defense game: /);
  assert.ok(html.includes(`<link rel="apple-touch-icon" href="${pictures.touch}">`));
  assert.ok(html.includes(`property="og:image" content="${SITE_ORIGIN}${pictures.share}"`));
  assert.match(html, /property="og:site_name" content="Snake Attack TD"/);
  // A shared link to the game shows the wide picture, named in both languages.
  assert.ok(html.includes(`property="og:title" content="${GAME_PAGE.title}"`));
  assert.match(GAME_PAGE.title, /Snake Attack TD/);
  assert.match(GAME_PAGE.title, /La Conquête des Serpents/);
  assert.ok(html.includes(`property="og:image:width" content="${SHARE_PICTURE.width}"`));
  assert.ok(html.includes(`property="og:image:height" content="${SHARE_PICTURE.height}"`));
  assert.ok(html.includes('name="twitter:card" content="summary_large_image"'));
  assert.ok(html.includes(`property="og:url" content="${SITE_ORIGIN}/"`));
  assert.ok(html.includes('property="og:type" content="website"'));
  assert.ok(html.includes(`property="og:image:alt" content="${GAME_PAGE.shareAlt}"`));
  // One link per language, after the buttons of the parents screen: no inline style, and
  // nothing in the footer of the game.
  assert.ok(
    html.includes(
      '<button id="home-family">Sauvegarde</button><a class="about" data-copy-raw href="/fr/" lang="fr">À propos du jeu</a><a class="about" data-copy-raw href="/en/" lang="en">About the game</a></nav>',
    ),
  );
  assert.ok(
    html.includes('<footer class="home-footer"><span id="career-status">Local</span></footer>'),
  );
  assert.doesNotMatch(html, /style=/);
  assert.ok(html.includes(`rel="canonical" href="${SITE_ORIGIN}/"`));
  assert.match(html, /href="\/fr\/"/);
  assert.match(html, /href="\/en\/"/);
  assert.match(html, /id="career-status">Local/);
  assert.doesNotMatch(html, /data-support|localStorage|<script/);
});

test('what the website adds to the game page is counted and bounded', () => {
  const added = webHeadBytes(pictures);
  assert.ok(added > 0 && added <= WEB_HEAD_BUDGET, `${added} octets`);
  assert.equal(WEB_HEAD_BUDGET, 1280);
  // The count is exact on a real page: the same bytes whatever the page holds.
  const page =
    '<html><head><title>Jeu</title></head><body><main>Jeu</main><nav class="parent-actions"><button>Aide</button></nav></body></html>';
  assert.equal(Buffer.byteLength(augmentGamePage(page, pictures)) - Buffer.byteLength(page), added);
});

test('the link to the public pages lands in the real parents screen, or the build stops', () => {
  // The template the game is assembled from, not a shell written for the test.
  const template = readFileSync('src/html/home.html', 'utf8');
  const html = augmentGamePage(`<html><head></head><body>${template}</body></html>`, pictures);
  const row = html.split('<nav class="parent-actions"')[1].split('</nav>')[0];
  assert.match(
    row,
    /id="home-family">[^<]*<\/button>\s*<a class="about" data-copy-raw href="\/fr\/"/,
  );
  assert.equal(html.split('class="about"').length, 3, 'one link per language, nowhere else');
  // A template that lost the row, or its head, is refused instead of shipping no link.
  for (const broken of [
    '<html><head></head><body><div class="parent-actions"></div></body></html>',
    '<html><body><nav class="parent-actions"></nav></body></html>',
  ])
    assert.throws(() => augmentGamePage(broken, pictures), /parents screen/);
});

test('an address that leads nowhere gets a page of its own, and the server is told', async () => {
  const html = notFoundPageHtml(assets);
  assert.match(html, /<meta name="robots" content="noindex">/);
  // No script and no redirection (the answer stays a 404), nothing read back from the
  // address, no canonical; both languages; absolute paths, since it is served anywhere.
  assert.doesNotMatch(html, /<script|http-equiv|rel="canonical"|og:url|google-adsense-account/);
  assert.doesNotMatch(html, /(?:href|src)="(?!\/)[^"]/);
  assert.ok(
    html.includes('Cette page n’existe pas.') && html.includes('This page does not exist.'),
  );
  for (const way of ['href="/"', 'href="/fr/"', 'href="/en/"']) assert.ok(html.includes(way), way);
  assert.doesNotMatch(discoverySitemap(), /404/);
  const { apacheConfig, hostHeadersFile, NOT_FOUND_PAGE } = await import('../deploy/policy.ts');
  const config = apacheConfig();
  assert.match(config, new RegExp(`^ErrorDocument 404 /${NOT_FOUND_PAGE}$`, 'm'));
  assert.ok(
    config.includes(`<Files "${NOT_FOUND_PAGE}">\n    Header always set X-Robots-Tag "noindex"`),
  );
  assert.ok(hostHeadersFile().includes(`/${NOT_FOUND_PAGE}\n  X-Robots-Tag: noindex`));
  // Texts travel compressed where the host has not seen to it, behind both modules.
  assert.match(
    config,
    /<IfModule mod_deflate\.c>\n {2}<IfModule mod_filter\.c>\n {4}AddOutputFilterByType DEFLATE text\/html/,
  );
  // Every picture of the site is kept by the browser, the shared one too.
  assert.match(config, /FilesMatch "[^"]*\(js\|css\|webp\|png\|jpg\|mp3\|woff2\)\$"/);
});

test('the shared picture is the size the pages announce, light enough for a messenger', () => {
  const bytes = readFileSync(SHARE_PICTURE.source);
  const info = imageMetadata(bytes);
  assert.ok(info);
  assert.equal(info.width, SHARE_PICTURE.width);
  assert.equal(info.height, SHARE_PICTURE.height);
  assert.ok(bytes.length <= 300_000, `${bytes.length} octets`);
});

test('the public pages tell the game as it is', () => {
  const words = (key: string, lang: string) => {
    const page = DISCOVERY_PAGES.find((p) => p.key === key && p.lang === lang)!;
    return [page.lead, ...page.blocks.map((b) => b.text)].join(' ');
  };
  // The numbers written in words are those of the game.
  assert.equal(MISSIONS.length, 6);
  assert.match(words('home', 'fr'), /Six missions/);
  assert.equal(TOTAL_WAVES, 12);
  assert.match(words('home', 'fr'), /douze vagues/);
  assert.match(words('home', 'en'), /twelve waves/);
  assert.equal(VOYAGE_TUNINGS[CURRENT_VOYAGE_VERSION].stages.length, 5);
  assert.match(words('updates', 'fr'), /Cinq étapes/);
  assert.match(words('updates', 'en'), /Five stages/);
  const late = lateEggRule(CURRENT_BALANCE_REVISION)!;
  assert.deepEqual([late.most, late.count], [2, 2]);
  assert.match(words('updates', 'fr'), /Puis un deuxième\. Deux serpents sortent de chaque œuf/);
  assert.equal(NINJA_DODGES, 1);
  assert.match(words('updates', 'fr'), /le premier coup le rate/);
  assert.equal(PLAYER_IDS.length, 4);
  assert.match(words('updates', 'fr'), /jusqu’à quatre joueurs/);
  // The buttons a page names are the buttons of the game, in its own words.
  assert.ok(words('guide', 'fr').includes(`« ${FR.dangers} »`));
  assert.ok(words('guide', 'en').includes(`“${EN.dangers}”`));
  assert.ok(words('updates', 'fr').includes(`« ${FR.aventureClassique} »`));
  // Nothing says a novelty was tried with the family before it was.
  for (const lang of ['fr', 'en'])
    assert.doesNotMatch(words('updates', lang), /en famille|family tries/);
});

test('Web verification identifies the approved AdSense account without ad delivery or layout changes', () => {
  const body = '<body><main id="game">Game</main><nav class="parent-actions"></nav></body>';
  const html = augmentGamePage('<html><head></head>' + body + '</html>', pictures);
  assert.ok(
    html.includes('<meta name="google-adsense-account" content="ca-pub-8498417364292905">'),
  );
  assert.equal((html.match(/google-adsense-account/g) ?? []).length, 1);
  assert.ok(html.includes('<main id="game">Game</main>'));
  assert.doesNotMatch(html, /adsbygoogle|googlesyndication|<iframe|<ins/);
});
