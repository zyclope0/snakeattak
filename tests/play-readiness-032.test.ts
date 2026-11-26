import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  validatePlayPreparation,
  safeAssetPath,
  GAME_LANGUAGE_DISCLOSURES,
  PLAY_LIMITS,
} from '../deploy/playReadiness.ts';
import type { PlayEvidence } from '../deploy/playReadiness.ts';
import { nativePlugins, ADS_SDK, BILLING_SDK, ANALYTICS_SDK } from '../deploy/publicationInputs.ts';

const json = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const draft = () => json('../docs/publication/configuration.json');
const listings = () => json('../docs/publication/fiches.json');
const version: string = json('../package.json').version;
const evidence = (): PlayEvidence => ({
  appVersion: version,
  manifest: null,
  files: [],
  runtime: {
    adsSdkInstalled: false,
    billingSdkInstalled: false,
    analyticsSdkInstalled: false,
    internetPermission: false,
    nativePlugins: ['@capacitor/app', '@capacitor/filesystem', '@capacitor/share'],
  },
});

test('The current draft is valid but blocked: nothing authorizes an automatic publication', () => {
  const result = validatePlayPreparation(draft(), listings(), evidence());
  assert.deepEqual(result.errors, []);
  for (const code of [
    'publisher',
    'privacy',
    'data-safety',
    'audience',
    'iarc',
    'copies',
    'asset-review',
    'merged-manifest',
    'android-device',
    'aab',
    'closed-test',
    'assets',
    'icon',
  ])
    assert.ok(
      result.blockers.some((i) => i.code === code),
      code,
    );
  // The abandoned model's blockers are gone; the package is fixed by Play.
  for (const code of ['sdk', 'billing', 'purchase-design', 'package-id'])
    assert.equal(
      result.blockers.some((i) => i.code === code),
      false,
      code,
    );
  assert.equal(result.automaticPublicationAuthorized, false);
  assert.equal(result.state, 'blocked');
});

test('Ticking every human step still never authorizes an automatic publication', () => {
  const d = draft();
  Object.assign(d.publisher, {
    name: 'Éditeur',
    email: 'contact@example.org',
    accountType: 'personal',
    accountVerified: true,
  });
  for (const section of ['legal', 'review'])
    for (const [k, v] of Object.entries(d[section])) if (v === false) d[section][k] = true;
  const copies = listings();
  for (const c of Object.values(copies) as { status: string }[]) c.status = 'reviewed';
  const result = validatePlayPreparation(d, copies, evidence());
  assert.deepEqual(result.errors, []);
  assert.deepEqual(
    result.blockers.map((i) => i.code),
    ['assets', 'icon'],
  );
  assert.equal(result.automaticPublicationAuthorized, false);
});

test('An ads, billing or analytics SDK in the runtime is an error, whatever the configuration says', () => {
  for (const [flag, code] of [
    ['adsSdkInstalled', 'runtime.ads'],
    ['billingSdkInstalled', 'runtime.billing'],
    ['analyticsSdkInstalled', 'runtime.analytics'],
  ] as const) {
    const e = evidence();
    e.runtime[flag] = true;
    const result = validatePlayPreparation(draft(), listings(), e);
    assert.ok(
      result.errors.some((i) => i.code === code),
      code,
    );
    assert.equal(result.automaticPublicationAuthorized, false);
  }
  // Even with an unreadable configuration, the SDK is still reported.
  const e = evidence();
  e.runtime.adsSdkInstalled = true;
  assert.ok(
    validatePlayPreparation(null, listings(), e).errors.some((i) => i.code === 'runtime.ads'),
  );
});

test('The SDK detectors recognise common libraries and leave the real Android files alone', () => {
  for (const name of [
    'com.google.android.gms:play-services-ads:23.0.0',
    '@capacitor-community/admob',
    'com.applovin:applovin-sdk',
  ])
    assert.ok(ADS_SDK.test(name), name);
  for (const name of [
    'com.android.billingclient:billing:7.0.0',
    'cordova-plugin-purchase',
    'revenuecat',
  ])
    assert.ok(BILLING_SDK.test(name), name);
  for (const name of ['com.google.firebase:firebase-analytics', '@sentry/capacitor'])
    assert.ok(ANALYTICS_SDK.test(name), name);
  const shipped = [
    Object.keys(json('../package.json').dependencies).join(' '),
    readFileSync(new URL('../android/app/build.gradle', import.meta.url), 'utf8'),
    readFileSync(new URL('../android/app/capacitor.build.gradle', import.meta.url), 'utf8'),
    readFileSync(new URL('../android/capacitor.settings.gradle', import.meta.url), 'utf8'),
    readFileSync(new URL('../android/app/src/main/AndroidManifest.xml', import.meta.url), 'utf8'),
  ].join('\n');
  for (const detector of [ADS_SDK, BILLING_SDK, ANALYTICS_SDK])
    assert.equal(detector.test(shipped), false, String(detector));
  assert.doesNotMatch(
    readFileSync(new URL('../android/app/src/main/AndroidManifest.xml', import.meta.url), 'utf8'),
    /android\.permission\.INTERNET/,
  );
});

test('The declared native modules must be the real ones', () => {
  assert.deepEqual(
    nativePlugins(
      ['@capacitor/core', '@capacitor/android', '@capacitor/share', 'phaser'],
      "implementation project(':capacitor-filesystem')\nimplementation project(':capacitor-android')",
    ),
    ['@capacitor/filesystem', '@capacitor/share'],
  );
  const e = evidence();
  e.runtime.nativePlugins = [...e.runtime.nativePlugins, '@capacitor/geolocation'];
  assert.ok(
    validatePlayPreparation(draft(), listings(), e).errors.some(
      (i) => i.code === 'runtime.plugins',
    ),
  );
  e.runtime.nativePlugins = evidence().runtime.nativePlugins;
  e.runtime.internetPermission = true;
  assert.ok(
    validatePlayPreparation(draft(), listings(), e).errors.some(
      (i) => i.code === 'runtime.internet',
    ),
  );
});

test('A model that announces ads, purchases, accounts or paid advantages is an error', () => {
  for (const change of [
    { kind: 'free_ads_remove_ads_cosmetics' },
    { purchases: ['remove_ads'] },
    { purchases: 'none' },
    { subscriptions: true },
    { inAppAds: true },
    { paidCombatAdvantages: true },
    { paidRandomItems: true },
    { accounts: true },
  ]) {
    const d = draft();
    Object.assign(d.model, change);
    assert.ok(
      validatePlayPreparation(d, listings(), evidence()).errors.length,
      JSON.stringify(change),
    );
  }
  const old = draft();
  old.schemaVersion = 1;
  assert.ok(
    validatePlayPreparation(old, listings(), evidence()).errors.some(
      (i) => i.code === 'configuration.schema',
    ),
  );
});

test('The configuration names the real version, languages and privacy address', () => {
  for (const [change, code] of [
    [{ version: '0.30.1' }, 'app.version'],
    [{ gameLanguages: ['fr'] }, 'app.languages'],
    [{ gameLanguages: ['fr', 'en', 'de'] }, 'app.languages'],
  ] as const) {
    const d = draft();
    Object.assign(d.app, change);
    assert.ok(
      validatePlayPreparation(d, listings(), evidence()).errors.some((i) => i.code === code),
      code,
    );
  }
  const d = draft();
  d.legal.privacyPublishedUrl = 'https://example.org/privacy';
  assert.ok(
    validatePlayPreparation(d, listings(), evidence()).errors.some((i) => i.code === 'privacy.url'),
  );
});

test('A listing that announces the game in one language only, or breaks a limit, is an error', () => {
  for (const root of [null, {}, [], { schemaVersion: 99 }])
    assert.ok(validatePlayPreparation(root, listings(), evidence()).errors.length);
  const oneLanguage = listings();
  oneLanguage.en.gameLanguageDisclosure = 'The game is currently available in French.';
  oneLanguage.en.fullDescription = oneLanguage.en.fullDescription.replace(
    GAME_LANGUAGE_DISCLOSURES.en,
    'The game is currently available in French.',
  );
  oneLanguage.fr.fullDescription = oneLanguage.fr.fullDescription.replace(
    GAME_LANGUAGE_DISCLOSURES.fr,
    'Le jeu est disponible en français.',
  );
  const languages = validatePlayPreparation(draft(), oneLanguage, evidence());
  assert.ok(languages.errors.some((i) => i.code === 'copy.en.language'));
  assert.ok(languages.errors.some((i) => i.code === 'copy.fr.language'));

  const long = listings();
  long.de.shortDescription = 'x'.repeat(PLAY_LIMITS.shortDescription + 1);
  long.it.title = 'x'.repeat(PLAY_LIMITS.title + 1);
  long.fr.fullDescription += 'x'.repeat(PLAY_LIMITS.fullDescription);
  const limits = validatePlayPreparation(draft(), long, evidence());
  assert.ok(limits.errors.some((i) => i.code === 'copy.de.short'));
  assert.ok(limits.errors.some((i) => i.code === 'copy.it.title'));
  assert.ok(limits.errors.some((i) => i.code === 'copy.fr.full'));

  const missing = listings();
  delete missing.it;
  assert.ok(
    validatePlayPreparation(draft(), missing, evidence()).errors.some(
      (i) => i.code === 'copy.it.schema',
    ),
  );
});

test('Listings never announce the abandoned paid cosmetics and cannot hide a missing review', () => {
  const cosmetics = listings();
  cosmetics.en.fullDescription += ' Cosmetic skins coming soon.';
  assert.ok(
    validatePlayPreparation(draft(), cosmetics, evidence()).errors.some(
      (i) => i.code === 'copy.en.model',
    ),
  );
  const d = draft();
  d.legal.localizedCopiesReviewed = true;
  assert.ok(
    validatePlayPreparation(d, listings(), evidence()).errors.some(
      (i) => i.code === 'copy.fr.status',
    ),
  );
  for (const c of Object.values(listings()) as { status: string; fullDescription: string }[]) {
    assert.equal(c.status, 'draft-not-reviewed');
    assert.doesNotMatch(c.fullDescription, /cosm[eé]ti|kosmeti/i);
  }
});

test('Capture manifest must match real files, build version, geometry and unique gameplay shots', () => {
  const e: any = evidence();
  e.buildHtmlSha256 = 'build';
  e.manifest = {
    appVersion: version,
    buildHtmlSha256: 'build',
    assets: [
      { file: 'assets/one.png', kind: 'phone', width: 1920, height: 1080, bytes: 100, sha256: 'a' },
    ],
  };
  e.files = [{ ...e.manifest.assets[0] }];
  assert.ok(
    validatePlayPreparation(draft(), listings(), e).blockers.some((i) => i.code === 'assets.phone'),
  );
  e.files[0].sha256 = 'changed';
  assert.ok(
    validatePlayPreparation(draft(), listings(), e).errors.some((i) => i.code === 'asset.hash'),
  );
  e.files[0].sha256 = 'a';
  e.files[0].width = 4000;
  assert.ok(
    validatePlayPreparation(draft(), listings(), e).errors.some(
      (i) => i.code === 'asset.dimensions',
    ),
  );
  e.files[0].width = 1920;
  e.buildHtmlSha256 = 'another-build';
  assert.ok(
    validatePlayPreparation(draft(), listings(), e).errors.some((i) => i.code === 'assets.build'),
  );
  delete e.buildHtmlSha256;
  assert.ok(
    validatePlayPreparation(draft(), listings(), e).blockers.some(
      (i) => i.code === 'assets.build-missing',
    ),
  );
  // Captures of an older version are to be redone, and count for nothing meanwhile.
  e.manifest.appVersion = '0.30.1';
  const stale = validatePlayPreparation(draft(), listings(), e);
  assert.ok(stale.blockers.some((i) => i.code === 'assets.stale'));
  assert.equal(
    stale.blockers.some((i) => i.code === 'assets.phone'),
    false,
  );
  e.files[0].sha256 = 'changed';
  assert.ok(
    validatePlayPreparation(draft(), listings(), e).errors.some((i) => i.code === 'asset.hash'),
  );
});

test('Publication asset paths cannot escape their folder or reference a URL', () => {
  for (const bad of [
    '../secret',
    '/etc/passwd',
    'assets/../../secret',
    'https://example.org/a',
    'assets\\secret',
    './assets/a.png',
    'assets//a.png',
  ])
    assert.equal(safeAssetPath(bad), false, bad);
  assert.equal(safeAssetPath('assets/phone/01-battle.png'), true);
  const e = evidence();
  e.manifest = { appVersion: version, assets: [{ file: '../secret.png', kind: 'phone' }] };
  assert.ok(
    validatePlayPreparation(draft(), listings(), e).errors.some((i) => i.code === 'asset.path'),
  );
});

test('Malformed capture entries and non-array manifests return errors instead of throwing', () => {
  for (const assets of [[null], [false, 'bad', {}], {}]) {
    const e = { ...evidence(), manifest: { appVersion: version, assets } };
    assert.doesNotThrow(() => validatePlayPreparation(draft(), listings(), e));
    assert.ok(validatePlayPreparation(draft(), listings(), e).errors.length);
  }
});
