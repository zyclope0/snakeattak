import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { renderStoreDossier } from '../deploy/storeDossier.ts';

const config = () =>
  JSON.parse(
    readFileSync(new URL('../docs/publication/configuration.json', import.meta.url), 'utf8'),
  );
const copies = () =>
  JSON.parse(readFileSync(new URL('../docs/publication/fiches.json', import.meta.url), 'utf8'));
const report = () => ({
  state: 'blocked',
  errors: [],
  blockers: [],
  automaticPublicationAuthorized: false,
});

test('Dossier refuses malicious dimensions and escapes all untrusted display text', () => {
  const c = config();
  c.app.version = '<img src=x onerror=alert(1)>';
  const html = renderStoreDossier(
    c,
    copies(),
    {
      appVersion: '0.30.1',
      assets: [
        {
          file: 'assets/a.jpg',
          kind: 'phone',
          context: 'combat',
          width: '<script>globalThis.dossierInjection=true</script>',
          height: 1080,
        },
      ],
    },
    report(),
  );
  assert.doesNotMatch(html, /<script>/);
  assert.doesNotMatch(html, /<img src=x onerror/);
  assert.match(html, /&lt;img/);
  assert.match(html, /capture.*invalide/i);
});

test('Dossier shows technical errors and blocked state even when no commercial blockers are listed', () => {
  const html = renderStoreDossier(
    config(),
    copies(),
    { appVersion: '0.30.1', assets: [] },
    { ...report(), errors: [{ code: 'broken', message: 'TECHNICAL_ERROR_SHOULD_BE_VISIBLE' }] },
  );
  assert.match(html, /TECHNICAL_ERROR_SHOULD_BE_VISIBLE/);
  assert.match(html, /1 erreur technique/);
  assert.match(html, /Préparation bloquée/);
  assert.doesNotMatch(html, /0 points à finaliser avant publication/);
});

test('Malformed configuration and manifest replace a stale report with an explicit failure', () => {
  const folder = mkdtempSync(join(tmpdir(), 'serpents-play-invalid-'));
  const pub = join(folder, 'docs/publication'),
    reports = join(folder, 'reports');
  try {
    for (const path of [pub, reports, join(folder, 'dist'), join(folder, 'android/app/src/main')])
      mkdirSync(path, { recursive: true });
    writeFileSync(
      join(folder, 'package.json'),
      JSON.stringify({ version: '0.30.1', dependencies: {} }),
    );
    writeFileSync(join(folder, 'dist/index.html'), '<!doctype html>');
    writeFileSync(join(folder, 'android/app/build.gradle'), '');
    writeFileSync(join(folder, 'android/app/src/main/AndroidManifest.xml'), '<manifest/>');
    writeFileSync(join(pub, 'fiches.json'), JSON.stringify(copies()));
    for (const [configuration, assets] of [
      ['{', []],
      [JSON.stringify(config()), [null]],
      [JSON.stringify(config()), {}],
    ] as const) {
      writeFileSync(join(pub, 'configuration.json'), configuration);
      writeFileSync(join(pub, 'captures.json'), JSON.stringify({ appVersion: '0.30.1', assets }));
      writeFileSync(
        join(reports, 'store-preparation.json'),
        JSON.stringify({
          marker: 'OLD_READY_REPORT',
          state: 'manual-review-required',
          errors: [],
          blockers: [],
        }),
      );
      const run = spawnSync(
        process.execPath,
        [fileURLToPath(new URL('../scripts/play-preflight.mjs', import.meta.url)), '--draft'],
        { cwd: folder, encoding: 'utf8' },
      );
      assert.equal(run.status, 2, run.stderr);
      const failed = JSON.parse(readFileSync(join(reports, 'store-preparation.json'), 'utf8'));
      assert.equal(failed.state, 'blocked');
      assert.ok(failed.errors.length);
      assert.equal(failed.marker, undefined);
    }
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

const realFile = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

/** A copy of what the check reads, in a folder of its own, with a fresh empty capture set. */
function project(change: (folder: string) => void = () => {}) {
  const folder = mkdtempSync(join(tmpdir(), 'serpents-play-runtime-'));
  try {
    const pkg = JSON.parse(realFile('package.json'));
    for (const path of ['docs/publication', 'android/app/src/main'])
      mkdirSync(join(folder, path), { recursive: true });
    writeFileSync(
      join(folder, 'package.json'),
      JSON.stringify({ version: pkg.version, dependencies: pkg.dependencies }),
    );
    for (const path of [
      'android/app/build.gradle',
      'android/app/capacitor.build.gradle',
      'android/capacitor.settings.gradle',
      'android/app/src/main/AndroidManifest.xml',
      'docs/publication/configuration.json',
      'docs/publication/fiches.json',
    ])
      writeFileSync(join(folder, path), realFile(path));
    writeFileSync(
      join(folder, 'docs/publication/captures.json'),
      JSON.stringify({ appVersion: pkg.version, assets: [] }),
    );
    change(folder);
    const run = spawnSync(
      process.execPath,
      [fileURLToPath(new URL('../scripts/play-preflight.mjs', import.meta.url)), '--draft'],
      { cwd: folder, encoding: 'utf8' },
    );
    const written = JSON.parse(
      readFileSync(join(folder, 'reports/store-preparation.json'), 'utf8'),
    );
    return { run, report: written };
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
}
const has = (issues: { code: string }[], code: string) => issues.some((i) => i.code === code);

test('The draft check of the real Android files passes without dist/, with honest blockers', () => {
  const { run, report: written } = project();
  assert.equal(run.status, 0, run.stdout + run.stderr);
  assert.deepEqual(written.errors, []);
  assert.equal(written.automaticPublicationAuthorized, false);
  assert.equal(written.state, 'blocked');
  assert.ok(has(written.blockers, 'assets.build-missing'));
  assert.match(run.stdout, /"automaticPublicationAuthorized":false/);
});

test('An ads or billing library or a new native module fails the draft check', () => {
  const ads = project((folder) =>
    writeFileSync(
      join(folder, 'android/app/build.gradle'),
      realFile('android/app/build.gradle') +
        '\ndependencies { implementation "com.google.android.gms:play-services-ads:23.0.0" }\n',
    ),
  );
  assert.equal(ads.run.status, 2);
  assert.ok(has(ads.report.errors, 'runtime.ads'));
  const billing = project((folder) => {
    const pkg = JSON.parse(readFileSync(join(folder, 'package.json'), 'utf8'));
    pkg.dependencies['cordova-plugin-purchase'] = '13.0.0';
    writeFileSync(join(folder, 'package.json'), JSON.stringify(pkg));
  });
  assert.equal(billing.run.status, 2);
  assert.ok(has(billing.report.errors, 'runtime.billing'));
  const plugin = project((folder) =>
    writeFileSync(
      join(folder, 'android/app/capacitor.build.gradle'),
      realFile('android/app/capacitor.build.gradle').replace(
        "implementation project(':capacitor-share')",
        "implementation project(':capacitor-share')\n    implementation project(':capacitor-geolocation')",
      ),
    ),
  );
  assert.equal(plugin.run.status, 2);
  assert.ok(has(plugin.report.errors, 'runtime.plugins'));
});

test('The dossier describes the free model without ads or purchases and flags stale captures', () => {
  const html = renderStoreDossier(
    config(),
    copies(),
    { appVersion: '0.30.1', assets: [] },
    { ...report(), blockers: [{ code: 'x', message: 'y' }] },
  );
  assert.match(html, /sans publicité ni achat dans l'application/);
  assert.match(html, /viennent de la version 0\.30\.1/);
  assert.doesNotMatch(html, /pub entre missions|retirer les pubs|apparences sans avantage/);
});
