import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import {
  assertAndroidDistribution,
  assertSameFiles,
  fileInventory,
  embeddedInventory,
} from '../deploy/androidDistribution.ts';
const source = process.argv[2] ?? 'dist-android';
const embedded = process.argv[3] ?? 'android/app/src/main/assets/public';
const { info, files } = assertAndroidDistribution(source);
assert.equal(
  info.source.commit,
  execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  'Rebuild Android: the distribution comes from an older commit',
);
assertSameFiles(embeddedInventory(files), fileInventory(embedded));
const config = JSON.parse(
  readFileSync('android/app/src/main/assets/capacitor.config.json', 'utf8'),
);
assert.equal(config.appId, info.android.applicationId);
assert.equal(config.webDir, 'dist-android');
assert.ok(!config.server?.url, 'The application must use local bundled files');
if (process.env.SERPENTS_PERF !== '1')
  assert.ok(!config.server, 'Release starts without diagnostic server options');
console.log(
  `Capacitor sync verified: ${Object.keys(files).length} exact files, Android ${info.android.versionCode}, source ${info.source.commit}`,
);
