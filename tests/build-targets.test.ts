import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildTarget } from '../deploy/buildTargets.ts';
import { makeBuildInfo } from '../deploy/buildInfo.ts';
import {
  assertAndroidDistribution,
  fileInventory,
  assertSameFiles,
  embeddedInventory,
  assertAndroidManifest,
} from '../deploy/androidDistribution.ts';

const sha = 'a'.repeat(40);
const release = {
  applicationId: 'com.conqueteserpents.famille',
  versionName: '0.39.0',
  versionCode: 63,
};

test('only the production website can receive Google advertising, never Android or portable', () => {
  for (const enabled of [false, true]) {
    for (const mode of ['android', 'portable', 'ads-preview', 'development'])
      assert.equal(buildTarget(mode, enabled).googleAdvertising, false, mode);
    assert.equal(buildTarget('production', enabled).googleAdvertising, enabled);
    assert.equal(buildTarget('ads-test', enabled).standInAdvertising, true);
  }
  const android = buildTarget('android', true);
  assert.equal(android.website, false);
  assert.equal(android.outDir, 'dist-android');
  assert.throws(() => buildTarget('andriod', true), /Unknown build mode/);
});

test('each target names its own source without changing the shared game version', () => {
  const android = makeBuildInfo(buildTarget('android', true), '0.39.0', sha, false, release);
  const web = makeBuildInfo(buildTarget('production', false), '0.39.0', 'b'.repeat(40), false);
  assert.equal(android.target, 'android');
  assert.equal(android.version, web.version);
  assert.notEqual(android.source.commit, web.source.commit);
  assert.deepEqual(android.capabilities, {
    publicPages: false,
    webSupport: false,
    advertising: false,
    adPreview: false,
    standInAdvertising: false,
  });
  assert.deepEqual(android.android, release);
  assert.equal(web.android, undefined);
});

test('a renamed website, an old sync and extra or modified files are rejected', () => {
  const root = mkdtempSync(join(tmpdir(), 'serpents-target-'));
  try {
    mkdirSync(join(root, 'assets'));
    writeFileSync(join(root, 'index.html'), '<main>jeu</main>');
    writeFileSync(join(root, 'assets/game.js'), 'game()');
    const info = makeBuildInfo(buildTarget('android', false), '0.39.0', sha, false, release);
    const writeInfo = (value: unknown) =>
      writeFileSync(join(root, 'build-info.json'), JSON.stringify(value));
    writeInfo(info);
    assertAndroidDistribution(root);
    const expected = fileInventory(root);
    assertSameFiles(expected, fileInventory(root));
    writeInfo(makeBuildInfo(buildTarget('production', false), '0.39.0', sha, false));
    assert.throws(() => assertAndroidDistribution(root), /Android target/);
    writeInfo(info);
    for (const filename of [
      'sitemap.xml',
      'ads.txt',
      '.htaccess',
      '_headers',
      'prototype-v4.html',
    ]) {
      writeFileSync(join(root, filename), 'unneeded');
      assert.throws(() => assertAndroidDistribution(root), /Web-only/);
      rmSync(join(root, filename));
    }
    writeFileSync(
      join(root, 'assets/game.js'),
      'const p="https://www.paypal.com/ncp/payment/TEST"',
    );
    assert.throws(() => assertAndroidDistribution(root), /Web runtime/);
    writeFileSync(join(root, 'assets/game.js'), 'game()');
    writeFileSync(join(root, 'extra.js'), 'extra');
    assert.throws(() => assertSameFiles(expected, fileInventory(root)), /files differ/);
    rmSync(join(root, 'extra.js'));
    writeFileSync(join(root, 'assets/game.js'), 'old game()');
    assert.throws(() => assertSameFiles(expected, fileInventory(root)), /files differ/);
    writeFileSync(join(root, 'assets/game.js'), 'game()');
    writeInfo({ ...info, source: { ...info.source, commit: 'b'.repeat(40) } });
    assert.throws(() => assertSameFiles(expected, fileInventory(root)), /files differ/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('Capacitor permits only its two empty Cordova compatibility files', () => {
  const source = { 'index.html': 'abc' };
  const expected = embeddedInventory(source);
  assert.equal(Object.keys(expected).length, 3);
  assert.equal(expected['cordova.js'], expected['cordova_plugins.js']);
  assertSameFiles(expected, { ...expected });
  assert.throws(
    () => assertSameFiles(expected, { ...expected, 'cordova.js': 'unexpected plugin' }),
    /files differ/,
  );
  assert.throws(
    () => assertSameFiles(expected, { ...expected, 'new-plugin.js': 'unexpected' }),
    /files differ/,
  );
  assert.deepEqual(source, { 'index.html': 'abc' });
});

test('compiled Android enums preserve landscape and release identity without accepting new permissions', () => {
  const xml = `<manifest package="com.conqueteserpents.famille" android:versionCode="63" android:versionName="0.39.0"><uses-sdk android:minSdkVersion="24" android:targetSdkVersion="36"/><uses-permission android:name="com.conqueteserpents.famille.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION"/><application><activity android:screenOrientation="6"/></application></manifest>`;
  assertAndroidManifest(xml, release);
  assertAndroidManifest(
    xml.replace('screenOrientation="6"', 'screenOrientation="sensorLandscape"'),
    release,
  );
  for (const changed of [
    xml.replace('screenOrientation="6"', 'screenOrientation="1"'),
    xml.replace('targetSdkVersion="36"', 'targetSdkVersion="35"'),
    xml.replace('versionName="0.39.0"', 'versionName="0.38.0"'),
    xml.replace(
      '<application>',
      '<uses-permission android:name="com.google.android.gms.permission.AD_ID"/><application>',
    ),
  ])
    assert.throws(() => assertAndroidManifest(changed, release));
});
