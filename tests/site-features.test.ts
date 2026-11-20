import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ANDROID_TEST,
  PLAY_TEST_DAYS,
  PLAY_TESTERS,
  STORY,
  siteFeatures,
} from '../deploy/siteFeatures.ts';
import { DISCOVERY_PAGES, SITE_FEATURES, discoveryPages } from '../deploy/discoveryCopy.ts';
import {
  WEB_HEAD_BUDGET,
  augmentGamePage,
  discoveryPageHtml,
  discoverySitemap,
  webHeadBytes,
} from '../deploy/discovery.ts';
import { SITE_ORIGIN } from '../src/site.ts';

// Decisions of the parent, 20 November 2026: a public Google Group for the Android test, a
// button on every page of the website, the child's drawing and his age and nothing else.
// Each page waits for its values; until then the website does not change.
const assets = {
  css: '/assets/discovery-12345678.css',
  share: '/assets/site-share-12345678.jpg',
  tab: '/assets/site-tab-12345678.png',
  touch: '/assets/site-touch-12345678.png',
  logo: '/assets/site-logo-12345678.png',
  hero: '/assets/site-hero-12345678.webp',
  drawing: '/assets/site-drawing-12345678.jpg',
  characters: [],
};
const pictures = { share: assets.share, touch: assets.touch };
const links = {
  group: 'https://groups.google.com/g/snakeattack-testeurs',
  optIn: 'https://play.google.com/apps/testing/com.example.game',
};
// Any small picture stands for the drawing: only its size is read.
const png = readFileSync('resources/site/icon-48.png');
const told = { age: 8, drawing: 'dessin.png' };
const open = siteFeatures(links, told, () => png);

test('aujourd’hui, le test Android et l’histoire sont ouverts', () => {
  // The closed test « Alpha » created by the parent on 20 November 2026.
  assert.deepEqual(ANDROID_TEST, {
    group: 'https://groups.google.com/g/snakeattack-testeurs',
    optIn: 'https://play.google.com/apps/testing/com.conqueteserpents.famille',
  });
  assert.deepEqual(SITE_FEATURES.androidTest, ANDROID_TEST);
  // The photo of the drawing given on 20 November 2026, cut above the paper, 720 px wide
  // (the width the page shows it at), under the weight of a page picture.
  assert.equal(STORY.age, 8);
  assert.deepEqual(SITE_FEATURES.story, {
    age: 8,
    drawing: 'resources/site/dessin-du-jeu.jpg',
    width: 720,
    height: 722,
  });
  assert.equal(DISCOVERY_PAGES.length, 14);
  for (const page of DISCOVERY_PAGES) {
    const html = discoveryPageHtml(page, assets);
    assert.match(html, /class="test-android"/, page.path);
    assert.equal(html.includes('class="drawing"'), page.key === 'story', page.path);
  }
  assert.match(
    augmentGamePage('<head></head><nav class="parent-actions"></nav>', pictures),
    /href="\/fr\/tester-android\/"/,
  );
});

test('les réglages faux sont refusés avant d’arriver sur une page', () => {
  const none = () => null;
  assert.throws(() => siteFeatures({ ...links, group: 'https://example.com/g/x' }, STORY, none));
  assert.throws(() => siteFeatures({ ...links, optIn: 'http://play.google.com/x' }, STORY, none));
  assert.throws(() => siteFeatures({ group: links.group, optIn: '' }, STORY, none));
  assert.throws(() => siteFeatures(ANDROID_TEST, { age: 8.5, drawing: 'x' }, none));
  assert.throws(() => siteFeatures(ANDROID_TEST, { age: 40, drawing: 'x' }, none));
  assert.throws(() => siteFeatures(ANDROID_TEST, told, () => new Uint8Array([1, 2, 3])));
  // An age without its drawing yet: the story waits for the drawing.
  assert.equal(siteFeatures(ANDROID_TEST, told, none).story, null);
  assert.deepEqual(open.story, { age: 8, drawing: 'dessin.png', width: 48, height: 48 });
  assert.deepEqual(open.androidTest, links);
});

test('une fois ouvert, chaque page du site mène au test Android, qui mène à Google', () => {
  const pages = discoveryPages(open);
  assert.equal(pages.length, 14);
  for (const page of pages) {
    const html = discoveryPageHtml(page, assets, null, pages);
    const target = pages.find((p) => p.key === 'test' && p.lang === page.lang)!;
    assert.ok(html.includes(`class="test-android" href="${target.path}"`), page.path);
    // A button at the top, not a place in the list of pages.
    const nav = html.match(/<nav class="site-nav"[\s\S]*?<\/nav>/)![0];
    assert.ok(!nav.includes(target.path), page.path);
    assert.doesNotMatch(html, /<form|<iframe/);
  }
  for (const lang of ['fr', 'en'] as const) {
    const page = pages.find((p) => p.key === 'test' && p.lang === lang)!;
    const html = discoveryPageHtml(page, assets, null, pages);
    assert.ok(html.includes(`href="${links.group}"`) && html.includes(`href="${links.optIn}"`));
    assert.ok(html.includes(String(PLAY_TESTERS)) && html.includes(String(PLAY_TEST_DAYS)));
    assert.ok(
      html.includes(
        'aria-current="page">' + (lang === 'fr' ? 'Tester sur Android' : 'Test on Android'),
      ),
    );
  }
  const sitemap = discoverySitemap(pages);
  for (const path of ['/fr/tester-android/', '/en/test-android/', '/fr/histoire/', '/en/story/'])
    assert.ok(sitemap.includes(`<loc>${SITE_ORIGIN}${path}</loc>`), path);
  // The parents screen of the game page links there too, within its budget.
  const game = augmentGamePage('<head></head><nav class="parent-actions"></nav>', pictures, pages);
  assert.ok(
    game.includes('href="/fr/tester-android/"') && game.includes('href="/en/test-android/"'),
  );
  assert.ok(webHeadBytes(pictures, pages) <= WEB_HEAD_BUDGET);
});

test('la page de l’histoire montre le dessin et l’âge, rien d’autre sur l’enfant', () => {
  const pages = discoveryPages(open);
  for (const lang of ['fr', 'en'] as const) {
    const page = pages.find((p) => p.key === 'story' && p.lang === lang)!;
    const html = discoveryPageHtml(page, assets, null, pages);
    assert.ok(html.includes(`<img src="${assets.drawing}" width="48" height="48" alt="`));
    assert.ok(html.includes(lang === 'fr' ? 'Un enfant de 8 ans' : 'A 8-year-old child'));
  }
  // Right after the home page, in the list of pages of each language.
  assert.deepEqual(
    pages.filter((p) => p.lang === 'fr').map((p) => p.key),
    ['home', 'story', 'guide', 'characters', 'updates', 'parents', 'test'],
  );
});
