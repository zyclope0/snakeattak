import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { privacyPageHtml } from '../deploy/privacyPage.ts';
import { POLICY_APP, PRIVACY_POLICY } from '../src/i18n/privacyPolicy.ts';
import { PUBLIC_PRIVACY_URL, SITE_HOST } from '../src/site.ts';

const published = readFileSync('tests/fixtures/confidentialite-publiee-2026-11-14.html', 'utf8');
/** What a reader sees of a piece of page: its markup, without the spaces between its tags. */
const tight = (html: string) => html.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
const between = (html: string, open: string, close: string) =>
  html.slice(html.indexOf(open), html.indexOf(close) + close.length);
const withoutDates = (html: string) => html.replace(/<p class="updated">[^<]*<\/p>/g, '');

test('the policy is word for word the one its publisher approved, in both languages', () => {
  const page = privacyPageHtml();
  // The words, the headings, the bold names and the links of both languages.
  assert.equal(
    tight(withoutDates(between(page, '<main>', '</main>'))),
    tight(between(published, '<main>', '</main>')),
  );
  // The way around the page and its name.
  assert.equal(
    tight(between(page, '<header>', '</header>')),
    tight(between(published, '<header>', '</header>')),
  );
  assert.equal(between(page, '<title>', '</title>'), between(published, '<title>', '</title>'));
});

test('the public page stands alone: no script, no outside resource, its own address', () => {
  const page = privacyPageHtml();
  assert.doesNotMatch(page, /<script|<img|<iframe|<link rel="stylesheet"|@import|url\(/);
  // Two links leave the site, both to the policy of Google, as approved.
  const outside = [...page.matchAll(/href="(https?:[^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(outside, [
    `${PUBLIC_PRIVACY_URL}/`,
    'https://policies.google.com/privacy?hl=fr',
    'https://policies.google.com/privacy?hl=en',
  ]);
  assert.match(page, /<html lang="fr">/);
  assert.match(page, /<article id="en" lang="en"/);
  assert.equal(PUBLIC_PRIVACY_URL, `https://${SITE_HOST}/confidentialite`);
});

test('each language tells when its words last changed and where the public page is', () => {
  assert.equal(PRIVACY_POLICY.fr.updated, 'Mise à jour : 14 novembre 2026');
  assert.equal(PRIVACY_POLICY.en.updated, 'Last updated: November 14, 2026');
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
