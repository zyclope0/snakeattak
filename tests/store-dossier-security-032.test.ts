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
