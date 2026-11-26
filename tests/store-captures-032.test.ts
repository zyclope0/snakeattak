import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { validatePlayPreparation } from '../deploy/playReadiness.ts';
import type { PlayEvidence } from '../deploy/playReadiness.ts';
import { imageMetadata } from '../deploy/imageMetadata.ts';

const root = new URL('../docs/publication/', import.meta.url);
const read = (name: string) => JSON.parse(readFileSync(new URL(name, root), 'utf8'));
const version: string = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
).version;

function realEvidence(manifest: Record<string, unknown> & { assets: { file: string }[] }) {
  return {
    appVersion: version,
    buildHtmlSha256: manifest.buildHtmlSha256 as string,
    manifest,
    runtime: {
      adsSdkInstalled: false,
      billingSdkInstalled: false,
      analyticsSdkInstalled: false,
      internetPermission: false,
      nativePlugins: ['@capacitor/app', '@capacitor/filesystem', '@capacitor/share'],
    },
    files: manifest.assets.map((a) => {
      const b = readFileSync(new URL(a.file, root));
      const info = imageMetadata(b);
      assert.ok(info);
      return {
        ...info,
        file: a.file,
        bytes: b.length,
        sha256: createHash('sha256').update(b).digest('hex'),
      };
    }),
  } satisfies PlayEvidence;
}

test('The dossier captures are older than the game: they are to be redone, not an error', () => {
  const manifest = read('captures.json');
  assert.notEqual(manifest.appVersion, version);
  const result = validatePlayPreparation(
    read('configuration.json'),
    read('fiches.json'),
    realEvidence(manifest),
  );
  assert.deepEqual(result.errors, []);
  assert.ok(result.blockers.some((i) => i.code === 'assets.stale'));
  assert.equal(result.automaticPublicationAuthorized, false);
});

test('Actual store captures match their hashes and color formats; alpha images and a different build are rejected', () => {
  // The real files, as if they had been taken from this version: their hashes, sizes and
  // formats must still hold.
  const manifest = { ...read('captures.json'), appVersion: version };
  const evidence = realEvidence(manifest);
  const config = read('configuration.json');
  const copies = read('fiches.json');
  const result = validatePlayPreparation(config, copies, evidence);
  assert.deepEqual(result.errors, []);
  assert.equal(
    result.blockers.some((i) => i.code.startsWith('assets.')),
    false,
  );
  assert.ok(result.blockers.some((i) => i.code === 'icon'));
  const first = { ...evidence.files[0] };
  Object.assign(evidence.files[0], { format: 'png', channels: 4 });
  assert.ok(
    validatePlayPreparation(config, copies, evidence).errors.some((i) => i.code === 'asset.format'),
  );
  Object.assign(evidence.files[0], first);
  evidence.buildHtmlSha256 = 'a-different-build';
  assert.ok(
    validatePlayPreparation(config, copies, evidence).errors.some((i) => i.code === 'assets.build'),
  );
});
