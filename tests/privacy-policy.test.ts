import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { privacyPageHtml } from '../deploy/privacyPage.ts';
import {
  POLICY_APP,
  PRIVACY_POLICY,
  ANDROID_TEST_HEADING,
  WEB_ADS_HEADING,
  WEBSITE_HEADING,
} from '../src/i18n/privacyPolicy.ts';
import { PUBLIC_PRIVACY_URL, SITE_HOST } from '../src/site.ts';

const approvedSupport = JSON.parse(
  readFileSync('tests/fixtures/soutien-web-approuve-2026-11-16.json', 'utf8'),
);
/** Approved on 17 November 2026: a section about advertising, and two sentences reworded. */
const approvedAds: Record<
  'fr' | 'en',
  { section: { heading: string; paragraphs: unknown[] }; replaced: [string, string][] }
> = JSON.parse(readFileSync('tests/fixtures/publicite-web-approuvee-2026-11-17.json', 'utf8'));

/** Approved on 20 November 2026: a section about testing the Android app through a Google Group. */
const approvedTest: Record<'fr' | 'en', { heading: string; paragraphs: string[][] }> = JSON.parse(
  readFileSync('tests/fixtures/test-android-approuve-2026-11-20.json', 'utf8'),
);
/**
 * Approved on 22 November 2026: the paragraph about what the family save file contains, on
 * the website and in the Android app of the testers (the two no longer hold the same thing).
 */
const approvedFamilyFile: Record<'fr' | 'en', { replaced: [string, string][] }> = JSON.parse(
  readFileSync('tests/fixtures/fichier-familial-approuve-2026-11-22.json', 'utf8'),
);
/**
 * Approved the same day, when build 64 was prepared: the Android app 0.40.0 holds what the
 * website holds; what the paragraph says of app 0.39.0 stays while testers still have it.
 */
const approvedBuild64: Record<'fr' | 'en', { replaced: [string, string][] }> = JSON.parse(
  readFileSync('tests/fixtures/fichier-familial-approuve-build-64-2026-11-22.json', 'utf8'),
);
const published = readFileSync('tests/fixtures/confidentialite-publiee-2026-11-14.html', 'utf8');
/** What a reader sees of a piece of page: its markup, without the spaces between its tags. */
const tight = (html: string) => html.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
const between = (html: string, open: string, close: string) =>
  html.slice(html.indexOf(open), html.indexOf(close) + close.length);
/**
 * The page without what the publisher added to the words first published: the date of the
 * last change, the website section, the separately approved support section, the
 * advertising section and the two sentences it reworded, the section about the Android
 * test, then the paragraph about the family save file and its wording for build 64. The
 * latest wording is taken back first: each pair leads to the one approved before it.
 */
const asFirstPublished = (html: string) =>
  [...Object.values(WEBSITE_HEADING), ...Object.values(ANDROID_TEST_HEADING)].reduce(
    (page, heading) => page.replace(new RegExp(`<h[23]>${heading}</h[23]>\\s*<p>[^<]*</p>`), ''),
    [
      approvedBuild64.fr,
      approvedBuild64.en,
      ...Object.values(approvedAds),
      approvedFamilyFile.fr,
      approvedFamilyFile.en,
    ]
      .flatMap((approved) => approved.replaced)
      .reduce((page, [first, now]) => page.replace(now, first), html)
      .replace(/<p class="updated">[^<]*<\/p>/g, '')
      .replace(
        /\s*<h[23]>(?:Soutien facultatif sur le site Web|Optional support on the website)<\/h[23]>(?:\s*<p>[\s\S]*?<\/p>){3}/g,
        '',
      )
      .replace(
        /\s*<h[23]>(?:Publicité sur le site Web|Advertising on the website)<\/h[23]>(?:\s*<p>[\s\S]*?<\/p>){4}/g,
        '',
      ),
  );

test('the policy is word for word the one its publisher approved, in both languages', () => {
  const page = privacyPageHtml();
  // Only the Android release label can differ from the archived wording.
  const expected = between(published, '<main>', '</main>').replaceAll(
    /<strong>(Application Android|Android app) 0\.38\.0, build 60<\/strong>/g,
    `<strong>$1 ${POLICY_APP.version}, build ${POLICY_APP.build}</strong>`,
  );
  assert.equal(tight(asFirstPublished(between(page, '<main>', '</main>'))), tight(expected));
  // The way around the page and its name.
  assert.equal(
    tight(between(page, '<header>', '</header>')),
    tight(between(published, '<header>', '</header>')),
  );
  assert.equal(between(page, '<title>', '</title>'), between(published, '<title>', '</title>'));
});

test('the section about the website says what the publisher approved, in both languages', () => {
  const section = (language: 'fr' | 'en') =>
    PRIVACY_POLICY[language].sections.find(
      (candidate) => candidate.heading === WEBSITE_HEADING[language],
    )!;
  assert.deepEqual(section('fr').paragraphs, [
    [
      'Le site snakeattacktd.com est hébergé par Infomaniak, en Suisse. Comme tout serveur Web, l’hébergeur enregistre dans des journaux techniques l’adresse IP, la date, la page demandée et le navigateur des visiteurs, pour faire fonctionner et protéger le service. Ces journaux sont conservés quelques jours par l’hébergeur. zyclope ne les utilise pas pour suivre les visiteurs et ne dépose aucun cookie. Lorsque l’encart publicitaire s’affiche, Google en dépose un : voir « Publicité sur le site Web ».',
    ],
  ]);
  assert.deepEqual(section('en').paragraphs, [
    [
      'The snakeattacktd.com website is hosted by Infomaniak, in Switzerland. Like any web server, the host records visitors’ IP address, date, requested page, and browser in technical logs, to run and protect the service. The host keeps these logs for a few days. zyclope does not use them to track visitors and sets no cookies. When the ad box is shown, Google sets one: see “Advertising on the website”.',
    ],
  ]);
  // Hosting comes after Google Play, then advertising; optional Web support precedes the
  // contact.
  for (const language of ['fr', 'en'] as const) {
    const headings = PRIVACY_POLICY[language].sections.map((candidate) => candidate.heading);
    assert.equal(headings.indexOf(ANDROID_TEST_HEADING[language]), 3, language);
    assert.equal(headings.indexOf(WEBSITE_HEADING[language]), 4, language);
    assert.equal(headings.indexOf(WEB_ADS_HEADING[language]), 5, language);
    assert.equal(headings.length, 8, language);
  }
});

test('the paragraph about the family save file is the one approved for build 64', () => {
  for (const language of ['fr', 'en'] as const) {
    const [[first, forTesters]] = approvedFamilyFile[language].replaced;
    const [[before, now]] = approvedBuild64[language].replaced;
    const said = PRIVACY_POLICY[language].sections.flatMap((section) => section.paragraphs.flat());
    assert.ok(said.includes(now), `${language}: the approved paragraph, word for word`);
    // The wording for build 64 starts from the one approved for the testers' build.
    assert.equal(before, forTesters, language);
    for (const gone of [first, forTesters])
      assert.ok(!said.includes(gone), `${language}: the paragraphs it replaces are gone`);
    assert.notEqual(before, now);
  }
  // It names the application that is built and the one the testers still have: when another
  // build is prepared, it is read again (the test below says so too).
  const { version, build } = POLICY_APP;
  const [fr, en] = [approvedBuild64.fr.replaced[0][1], approvedBuild64.en.replaced[0][1]];
  assert.ok(fr.includes(`l’application Android ${version} (build ${build})`));
  assert.ok(en.includes(`the Android app ${version} (build ${build})`));
  assert.match(fr, /application Android 0\.39\.0 \(build 63\)/);
  assert.match(en, /Android app 0\.39\.0 \(build 63\)/);
});

test('the public page stands alone: no script, no outside resource, its own address', () => {
  const page = privacyPageHtml();
  assert.doesNotMatch(page, /<script|<img|<iframe|<link rel="stylesheet"|@import|url\(/);
  // Provider privacy links leave the site, in the order approved for each language.
  const outside = [...page.matchAll(/href="(https?:[^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(outside, [
    `${PUBLIC_PRIVACY_URL}/`,
    'https://policies.google.com/privacy?hl=fr',
    'https://policies.google.com/technologies/partner-sites?hl=fr',
    'https://www.paypal.com/ch/legalhub/paypal/privacy-full',
    'https://policies.google.com/privacy?hl=en',
    'https://policies.google.com/technologies/partner-sites',
    'https://www.paypal.com/ch/legalhub/paypal/privacy-full',
  ]);
  assert.match(page, /<html lang="fr">/);
  assert.match(page, /<article id="en" lang="en"/);
  assert.equal(PUBLIC_PRIVACY_URL, `https://${SITE_HOST}/confidentialite`);
});

test('each language tells when its words last changed and where the public page is', () => {
  assert.equal(PRIVACY_POLICY.fr.updated, 'Mise à jour : 22 novembre 2026');
  assert.equal(PRIVACY_POLICY.en.updated, 'Last updated: November 22, 2026');
  assert.equal(PRIVACY_POLICY.fr.publicLink, `Lire cette politique sur ${SITE_HOST}`);
  assert.equal(PRIVACY_POLICY.en.publicLink, `Read this policy on ${SITE_HOST}`);
  const page = privacyPageHtml();
  for (const { updated } of Object.values(PRIVACY_POLICY))
    assert.ok(page.includes(`<p class="updated">${updated}</p>`), updated);
  // Both languages say the same things in the same order.
  const shape = (language: 'fr' | 'en') =>
    PRIVACY_POLICY[language].sections.map((section) => section.paragraphs.length);
  assert.deepEqual(shape('fr'), shape('en'));
});

test('the policy names the application that is really built', () => {
  const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
  const gradle = readFileSync('android/app/build.gradle', 'utf8');
  const build = Number(/versionCode\s+(\d+)/.exec(gradle)?.[1]);
  assert.deepEqual(
    POLICY_APP,
    { version, build },
    'The policy names another version than the one built: read the policy again, then set ' +
      'POLICY_APP and the date of the last change in src/i18n/privacyPolicy.ts.',
  );
  assert.match(gradle, new RegExp(`versionName\\s+"${version.replace(/\./g, '\\.')}"`));
});

test('the Apache configuration sends every visitor to the one address and keeps the policy', async () => {
  const { apacheConfig, webHeaders, assetCache } = await import('../deploy/policy.ts');
  const config = apacheConfig();
  // The canonical address: HTTPS, without « www », asked in a way that cannot loop.
  assert.match(config, /RewriteCond %\{HTTP_HOST\} \^www\\\.snakeattacktd\\\.com\$ \[NC\]/);
  assert.match(
    config,
    /RewriteCond %\{HTTPS\} off\n\s*RewriteCond %\{HTTP:X-Forwarded-Proto\} !https\n\s*RewriteRule \^ https:\/\/snakeattacktd\.com%\{REQUEST_URI\} \[R=301,L\]/,
  );
  // Every header of the policy, and nothing a shared host may refuse.
  for (const [name, value] of Object.entries(webHeaders))
    assert.ok(config.includes(`${name} "${value}"`), name);
  assert.ok(config.includes(`Header set Cache-Control "${assetCache}"`));
  assert.doesNotMatch(config, /^\s*(Options|php_|SetHandler|<If )/m);
  // Only the hashed files of the build are kept for good by the browser.
  const kept = /<FilesMatch "([^"]+)">/.exec(config)![1];
  const hashed = new RegExp(kept);
  for (const name of ['bootstrap-BX3kd_9a.js', 'music-forest-Dk29sLq0.mp3', 'style-Bu7Gh7yP.css'])
    assert.match(name, hashed);
  for (const name of [
    'index.html',
    'asset-provenance.md',
    'FONT-LICENCES.txt',
    'prototype-v4.html',
  ])
    assert.doesNotMatch(name, hashed);
});

test('website support policy is exactly the bilingual text the publisher approved on November 16', () => {
  for (const language of ['fr', 'en'] as const) {
    assert.deepEqual(PRIVACY_POLICY[language].sections[6], approvedSupport[language]);
    assert.equal(PRIVACY_POLICY[language].sections.length, 8);
  }
});

test('website advertising policy is exactly the bilingual text the publisher approved on November 17', () => {
  const page = privacyPageHtml();
  for (const language of ['fr', 'en'] as const) {
    const { section, replaced } = approvedAds[language];
    assert.deepEqual(PRIVACY_POLICY[language].sections[5], section);
    assert.equal(section.heading, WEB_ADS_HEADING[language]);
    // Each reworded sentence is on the page once, and the sentence it replaces is gone.
    for (const [first, now] of replaced) {
      assert.equal(page.split(now).length, 2, now);
      assert.ok(!page.includes(first), first);
    }
  }
  // Nothing on the page says any longer that the site is free of ads or of cookies.
  assert.doesNotMatch(
    page,
    /ne contient ni publicité.*Cette version|le site ne dépose aucun cookie/,
  );
  assert.doesNotMatch(page, /the site sets no cookies|This version contains no ads/);
});

test('the Android test section is exactly the bilingual text the publisher approved on November 20', () => {
  for (const language of ['fr', 'en'] as const) {
    assert.deepEqual(PRIVACY_POLICY[language].sections[3], approvedTest[language]);
    assert.equal(approvedTest[language].heading, ANDROID_TEST_HEADING[language]);
  }
});
