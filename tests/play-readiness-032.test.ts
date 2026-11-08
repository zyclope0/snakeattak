import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validatePlayPreparation, safeAssetPath } from '../deploy/playReadiness.ts';

const draft = () =>
  JSON.parse(
    readFileSync(new URL('../docs/publication/configuration.json', import.meta.url), 'utf8'),
  );
const listings = () =>
  JSON.parse(readFileSync(new URL('../docs/publication/fiches.json', import.meta.url), 'utf8'));
const evidence = () => ({
  appVersion: '0.30.1',
  manifest: null,
  files: [],
  runtime: { adsSdkInstalled: false, billingSdkInstalled: false, internetPermission: false },
});

test('Play draft is honest: valid preparation does not authorize publication or pretend ads and purchases work', () => {
  const result = validatePlayPreparation(draft(), listings(), evidence());
  assert.deepEqual(result.errors, []);
  assert.ok(result.blockers.some((i) => i.code === 'publisher'));
  assert.ok(result.blockers.some((i) => i.code === 'sdk'));
  assert.ok(result.blockers.some((i) => i.code === 'assets'));
  assert.ok(result.blockers.some((i) => i.code === 'icon'));
  assert.equal(result.automaticPublicationAuthorized, false);
  assert.equal(result.state, 'blocked');
});

test('Approved ad limits and cosmetic-only model reject combat ads, shorter intervals and paid advantages', () => {
  for (const change of [
    { windowSeconds: 599 },
    { maxAdsPerWindow: 2 },
    { missionsBetweenAds: 1 },
    { adsInCombat: true },
    { campaignFree: false },
    { paidCombatAdvantages: true },
    { paidRandomItems: true },
    { personalizedAds: true },
    { closeableAfterSeconds: 6 },
    { purchases: ['remove_ads', 'extra_life'] },
  ]) {
    const d = draft();
    Object.assign(d.model, change);
    assert.ok(
      validatePlayPreparation(d, listings(), evidence()).errors.length,
      JSON.stringify(change),
    );
  }
});

test('Flags cannot conceal missing runtime SDKs or a privacy draft for the wrong build', () => {
  const d = draft();
  d.implementation.adsEnabled = true;
  d.implementation.billingEnabled = true;
  d.legal.privacyForAdsReviewed = true;
  const result = validatePlayPreparation(d, listings(), evidence());
  assert.ok(result.errors.some((i) => i.code === 'runtime.ads'));
  assert.ok(result.errors.some((i) => i.code === 'runtime.billing'));
  assert.ok(result.errors.some((i) => i.code === 'privacy.scope'));
});

test('Store copies enforce actual game language and character budgets; malformed configuration is rejected', () => {
  for (const root of [null, {}, [], { schemaVersion: 99 }])
    assert.ok(validatePlayPreparation(root, listings(), evidence()).errors.length);
  const copies = listings();
  copies.en.fullDescription = 'A fully translated English game.';
  copies.de.shortDescription = 'x'.repeat(81);
  const result = validatePlayPreparation(draft(), copies, evidence());
  assert.ok(result.errors.some((i) => i.code === 'copy.en.language'));
  assert.ok(result.errors.some((i) => i.code === 'copy.de.short'));
});

test('Capture manifest must match real files, build version, geometry and unique gameplay shots', () => {
  const e: any = evidence();
  e.manifest = {
    appVersion: '0.30.1',
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
  e.manifest.appVersion = 'old';
  assert.ok(
    validatePlayPreparation(draft(), listings(), e).errors.some((i) => i.code === 'assets.version'),
  );
});

test('Publication asset paths cannot escape their folder or reference a URL', () => {
  for (const bad of [
    '../secret',
    '/etc/passwd',
    'assets/../../secret',
    'https://example.org/a',
    'assets\\secret',
  ])
    assert.equal(safeAssetPath(bad), false, bad);
  assert.equal(safeAssetPath('assets/phone/01-battle.png'), true);
});
