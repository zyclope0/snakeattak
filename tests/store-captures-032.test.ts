import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { validatePlayPreparation } from '../deploy/playReadiness.ts';
import type { PlayEvidence } from '../deploy/playReadiness.ts';
import { imageMetadata } from '../deploy/imageMetadata.ts';

test('Actual store captures match their hashes and color formats; alpha images and a different build are rejected', () => {
  const root = new URL('../docs/publication/', import.meta.url);
  const manifest = JSON.parse(readFileSync(new URL('captures.json', root), 'utf8'));
  const evidence: PlayEvidence = {
    appVersion: manifest.appVersion,
    buildHtmlSha256: manifest.buildHtmlSha256,
    manifest,
    runtime: { adsSdkInstalled: false, billingSdkInstalled: false, internetPermission: false },
    files: manifest.assets.map((a: { file: string }) => {
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
  };
  const config = JSON.parse(readFileSync(new URL('configuration.json', root), 'utf8'));
  config.app.version = manifest.appVersion;
  const copies = JSON.parse(readFileSync(new URL('fiches.json', root), 'utf8'));
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
