import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync, lstatSync } from 'node:fs';
import { join } from 'node:path';
import type { AndroidRelease } from './buildInfo.ts';

export function fileInventory(root: string): Record<string, string> {
  const result: Record<string, string> = {};
  const visit = (prefix: string) => {
    for (const name of readdirSync(join(root, prefix)).sort()) {
      const relative = prefix ? `${prefix}/${name}` : name;
      const path = join(root, relative);
      const stat = lstatSync(path);
      assert.ok(!stat.isSymbolicLink(), `${relative}: no symlink in a packaged distribution`);
      if (stat.isDirectory()) visit(relative);
      else result[relative] = createHash('sha256').update(readFileSync(path)).digest('hex');
    }
  };
  visit('');
  return result;
}
/** Capacitor 8 adds these empty compatibility stubs even with no Cordova plugin. */
export function embeddedInventory(files: Record<string, string>): Record<string, string> {
  const empty = createHash('sha256').update('').digest('hex');
  return { ...files, 'cordova.js': empty, 'cordova_plugins.js': empty };
}
export function assertSameFiles(expected: Record<string, string>, actual: Record<string, string>) {
  assert.deepEqual(actual, expected, 'Packaged web files differ: stale, changed or extra files');
}
export function assertAndroidDistribution(root: string) {
  const info = JSON.parse(readFileSync(join(root, 'build-info.json'), 'utf8'));
  assert.equal(info.schema, 1);
  assert.equal(
    info.target,
    'android',
    'Android target required; a renamed website is not an app build',
  );
  assert.deepEqual(info.capabilities, {
    publicPages: false,
    webSupport: false,
    advertising: false,
    adPreview: false,
    standInAdvertising: false,
  });
  assert.equal(info.android?.applicationId, 'com.conqueteserpents.famille');
  for (const name of [
    'fr',
    'en',
    'sitemap.xml',
    'robots.txt',
    'ads.txt',
    '404.html',
    '.htaccess',
    '_headers',
    'prototype-v4.html',
    'fake-ads.js',
  ])
    assert.ok(!existsSync(join(root, name)), `Web-only file is forbidden in Android: ${name}`);
  const files = fileInventory(root);
  assert.ok(files['index.html'], 'Android game page required');
  for (const name of Object.keys(files)) {
    if (!/\.(?:html|js|css|json)$/.test(name)) continue;
    assert.doesNotMatch(
      readFileSync(join(root, name), 'utf8'),
      /adsbygoogle|pagead2\.googlesyndication|googletagmanager|google-analytics|ca-pub-\d|data-support|paypal\.com\/ncp\/payment|data-ad-slot|web-ad-preview|fake-ads\.js/i,
      `Web runtime forbidden in Android: ${name}`,
    );
  }
  return { info, files };
}

/** bundletool writes compiled enums as numbers; 6 is Android's sensorLandscape. */
export function assertAndroidManifest(manifest: string, identity: AndroidRelease): string[] {
  const escaped = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.match(manifest, new RegExp(`package="${escaped(identity.applicationId)}"`));
  assert.match(manifest, new RegExp(`android:versionCode="${identity.versionCode}"`));
  assert.match(manifest, new RegExp(`android:versionName="${escaped(identity.versionName)}"`));
  assert.match(manifest, /android:screenOrientation="(?:sensorLandscape|6)"/);
  assert.match(manifest, /android:minSdkVersion="24"/);
  assert.match(manifest, /android:targetSdkVersion="36"/);
  assert.doesNotMatch(manifest, /android:debuggable="(?:true|1)"/);
  const expected = [`${identity.applicationId}.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`];
  const actual = [
    ...manifest.matchAll(/<uses-permission(?:-sdk-\d+)?\b[^>]*android:name="([^"]+)"/g),
  ]
    .map((m) => m[1])
    .sort();
  assert.deepEqual(actual, expected, 'Release permissions must stay exactly as in build62');
  return actual;
}
