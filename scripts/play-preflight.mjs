import { readFile, writeFile, mkdir, realpath } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { imageMetadata } from '../deploy/imageMetadata.ts';
import { validatePlayPreparation, safeAssetPath } from '../deploy/playReadiness.ts';

const root = resolve('docs/publication');
const json = async (p) => JSON.parse(await readFile(p, 'utf8'));
const config = await json(root + '/configuration.json');
const copies = await json(root + '/fiches.json');
const pkg = await json('package.json');
let manifest = null;
try {
  manifest = await json(root + '/captures.json');
} catch (e) {
  if (e.code !== 'ENOENT') throw e;
}
const files = [];
for (const a of manifest?.assets ?? []) {
  if (!safeAssetPath(a.file)) continue;
  const file = resolve(root, a.file);
  let physical;
  try {
    physical = await realpath(file);
  } catch (e) {
    if (e.code === 'ENOENT') continue;
    throw e;
  }
  if (relative(root, physical).startsWith('..'))
    throw Error('Asset symlink escapes publication folder');
  const b = await readFile(physical);
  const info = imageMetadata(b) ?? { width: 0, height: 0, format: null, channels: 0, bitDepth: 0 };
  files.push({
    file: a.file,
    ...info,
    bytes: b.length,
    sha256: createHash('sha256').update(b).digest('hex'),
  });
}
const deps = Object.keys(pkg.dependencies ?? {}).join(' ');
const gradle = await readFile('android/app/build.gradle', 'utf8');
const androidManifest = await readFile('android/app/src/main/AndroidManifest.xml', 'utf8');
const result = validatePlayPreparation(config, copies, {
  appVersion: pkg.version,
  buildHtmlSha256: createHash('sha256')
    .update(await readFile('dist/index.html'))
    .digest('hex'),
  manifest,
  files,
  runtime: {
    adsSdkInstalled: /admob|play-services-ads/i.test(deps + gradle),
    billingSdkInstalled: /billing|purchases|revenuecat/i.test(deps + gradle),
    internetPermission: /android.permission.INTERNET/.test(androidManifest),
  },
});
const report = {
  ...result,
  appVersion: pkg.version,
  checkedAt: new Date().toISOString(),
  assetFilesChecked: files.length,
  scope:
    'Local source/artifact preparation only; no Play Console, SDK approval, policy certification or automatic publication',
  draft: process.argv.includes('--draft'),
};
await mkdir('reports', { recursive: true });
await writeFile('reports/store-preparation.json', JSON.stringify(report, null, 2) + '\n');
console.log(
  JSON.stringify({
    state: result.state,
    errors: result.errors.length,
    blockers: result.blockers.length,
    assetFilesChecked: files.length,
    automaticPublicationAuthorized: false,
  }),
);
for (const issue of [...result.errors, ...result.blockers])
  console.log(
    `${result.errors.includes(issue) ? 'ERROR' : 'TODO'} ${issue.code}: ${issue.message}`,
  );
process.exitCode =
  result.errors.length || (!process.argv.includes('--draft') && result.blockers.length) ? 2 : 0;
