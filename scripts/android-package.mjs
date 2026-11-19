// Reproducible Android candidate, never an upload or a declaration of device qualification.
import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  copyFileSync,
  rmSync,
} from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import {
  assertAndroidDistribution,
  assertSameFiles,
  fileInventory,
  embeddedInventory,
} from '../deploy/androidDistribution.ts';
import { readAndroidRelease } from '../deploy/buildInfo.ts';

const root = process.cwd();
const win = process.platform === 'win32';
const npmCli = process.env.npm_execpath;
assert.ok(npmCli && existsSync(npmCli), 'Run through npm run android:package');
const javaHome = process.env.JAVA_HOME;
const sdk = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT;
assert.ok(javaHome && sdk, 'JAVA_HOME (JDK21) and ANDROID_HOME are required');
const identity = readAndroidRelease(readFileSync('android/app/build.gradle', 'utf8'));
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
assert.equal(identity.versionName, version);
const stem = `conquete-serpents-v${version}-build${identity.versionCode}`;
const out = resolve(process.env.SERPENTS_RELEASE_DIR ?? `artifacts/android/${stem}`);
const keystore = process.env.SERPENTS_UPLOAD_KEYSTORE;
const alias = process.env.SERPENTS_UPLOAD_KEY_ALIAS;
const password = process.env.SERPENTS_UPLOAD_STORE_PASSWORD;
assert.ok(
  keystore && existsSync(keystore) && alias && password,
  'Set SERPENTS_UPLOAD_KEYSTORE, SERPENTS_UPLOAD_KEY_ALIAS and SERPENTS_UPLOAD_STORE_PASSWORD privately',
);
// Public fingerprint of the original upload key, preserved since the first Play bundle.
const expectedCertificate = 'ee50ed5894cdf4e67e44c289f05e11134db0acc365328fc39257778bc51fa4f4';
const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const clean = () =>
  assert.equal(
    execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim(),
    '',
    'Commit the source first; a release must name a clean, reproducible commit',
  );
clean();
mkdirSync(dirname(out), { recursive: true });
// Atomic reservation also rejects a second concurrent packaging into the same folder.
mkdirSync(out);
const toolsVersion = readdirSync(join(sdk, 'build-tools'))
  .filter((v) => /^\d+\.\d+\.\d+$/.test(v))
  .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
  .at(-1);
assert.ok(toolsVersion);
const tool = (name) => join(javaHome, 'bin', name + (win ? '.exe' : ''));
const env = {
  ...process.env,
  SERPENTS_PERF: '0',
  SERPENTS_RELEASE_DIR: out,
  SERPENTS_UPLOAD_KEYSTORE: resolve(keystore),
  SERPENTS_UPLOAD_KEY_PASSWORD: process.env.SERPENTS_UPLOAD_KEY_PASSWORD ?? password,
  SERPENTS_AAPT2: join(sdk, 'build-tools', toolsVersion, 'aapt2' + (win ? '.exe' : '')),
};
const run = (label, command, args, cwd = root) => {
  console.log(label);
  const result = spawnSync(command, args, {
    cwd,
    env,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    shell: false,
  });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  // Redact even an unexpected diagnostic that echoes a supplied credential.
  const safe = [password, env.SERPENTS_UPLOAD_KEY_PASSWORD].reduce(
    (s, key) => (key ? s.split(key).join('[REDACTED]') : s),
    output,
  );
  writeFileSync(join(out, `${label}.log`), safe);
  if (result.error || result.status !== 0)
    throw new Error(`${label} failed; inspect ${join(out, label + '.log')}`);
  return safe;
};
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const scratch = mkdtempSync(join(tmpdir(), 'serpents-release-'));
try {
  // This bundletool version supports file: passwords; JDK tools support env: directly.
  env.SERPENTS_UPLOAD_STORE_PASSWORD_FILE = join(scratch, 'store-password');
  env.SERPENTS_UPLOAD_KEY_PASSWORD_FILE = join(scratch, 'key-password');
  writeFileSync(env.SERPENTS_UPLOAD_STORE_PASSWORD_FILE, password, { mode: 0o600 });
  writeFileSync(env.SERPENTS_UPLOAD_KEY_PASSWORD_FILE, env.SERPENTS_UPLOAD_KEY_PASSWORD, {
    mode: 0o600,
  });
  const certificate = spawnSync(
    tool('keytool'),
    [
      '-exportcert',
      '-keystore',
      resolve(keystore),
      '-storepass:env',
      'SERPENTS_UPLOAD_STORE_PASSWORD',
      '-alias',
      alias,
    ],
    { env },
  );
  assert.equal(certificate.status, 0, 'Upload certificate cannot be read');
  assert.equal(
    createHash('sha256').update(certificate.stdout).digest('hex'),
    expectedCertificate,
    'Upload key differs from the original Play key',
  );
  run('verify', process.execPath, [npmCli, 'run', 'verify']);
  run('signature-regressions', process.execPath, [resolve('scripts/test-android-signatures.mjs')]);
  run('browser', process.execPath, [npmCli, 'run', 'test:browser']);
  run('sync', process.execPath, [npmCli, 'run', 'android:sync']);
  run('offline-android', process.execPath, [npmCli, 'run', 'test:android-web']);
  const { info, files } = assertAndroidDistribution('dist-android');
  assert.equal(info.source.commit, sourceCommit);
  assert.equal(info.source.dirty, false);
  clean();
  const wrapper = [
    '-classpath',
    resolve('android/gradle/wrapper/gradle-wrapper.jar'),
    'org.gradle.wrapper.GradleWrapperMain',
  ];
  const flags = [
    '--no-daemon',
    '--max-workers=2',
    '--console=plain',
    ...(process.env.SERPENTS_GRADLE_OFFLINE === '1' ? ['--offline'] : []),
  ];
  run(
    'gradle-release',
    tool('java'),
    [...wrapper, ':app:bundleRelease', ...flags],
    resolve('android'),
  );
  const bundle = join(out, 'play.aab');
  run('sign-bundle', tool('jarsigner'), [
    '-keystore',
    resolve(keystore),
    '-storepass:env',
    'SERPENTS_UPLOAD_STORE_PASSWORD',
    '-keypass:env',
    'SERPENTS_UPLOAD_KEY_PASSWORD',
    '-signedjar',
    bundle,
    resolve('android/app/build/outputs/bundle/release/app-release.aab'),
    alias,
  ]);
  run('verify-bundle-signature', tool('java'), [
    resolve('scripts/VerifyAndroidBundle.java'),
    bundle,
    expectedCertificate,
  ]);
  run(
    'bundletool',
    tool('java'),
    [
      ...wrapper,
      '--init-script',
      resolve('scripts/android-package.init.gradle'),
      ':app:validatePlayBundle',
      ':app:dumpPlayManifest',
      ':app:buildUniversal',
      ...flags,
    ],
    resolve('android'),
  );
  const manifest = readFileSync(join(out, 'android-manifest.xml'), 'utf8');
  assert.match(manifest, new RegExp(`package="${identity.applicationId.replaceAll('.', '\\.')}"`));
  assert.match(manifest, new RegExp(`android:versionCode="${identity.versionCode}"`));
  assert.match(
    manifest,
    new RegExp(`android:versionName="${identity.versionName.replaceAll('.', '\\.')}"`),
  );
  const expectedPermissions = [
    `${identity.applicationId}.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`,
  ];
  const permissions = [...manifest.matchAll(/<uses-permission\b[^>]*android:name="([^"]+)"/g)]
    .map((m) => m[1])
    .sort();
  assert.deepEqual(
    permissions,
    expectedPermissions,
    'Release permissions must stay exactly as in build62',
  );
  assert.match(manifest, /android:screenOrientation="sensorLandscape"/);
  assert.doesNotMatch(
    manifest,
    /android\.permission\.(?:INTERNET|CAMERA|RECORD_AUDIO|ACCESS_FINE_LOCATION)|android:debuggable="true"/,
  );
  const extracted = {};
  for (const [name, archive] of [
    ['bundle', bundle],
    ['apks', join(out, 'release.apks')],
  ]) {
    const folder = join(scratch, name);
    mkdirSync(folder);
    run(`extract-${name}`, tool('jar'), ['xf', archive], folder);
    extracted[name] = folder;
  }
  const apk = join(out, `${stem}-release.apk`);
  copyFileSync(join(extracted.apks, 'universal.apk'), apk);
  const apkFolder = join(scratch, 'apk');
  mkdirSync(apkFolder);
  run('extract-apk', tool('jar'), ['xf', apk], apkFolder);
  const bundledFiles = embeddedInventory(files);
  assertSameFiles(bundledFiles, fileInventory(join(extracted.bundle, 'base/assets/public')));
  assertSameFiles(bundledFiles, fileInventory(join(apkFolder, 'assets/public')));
  const configFile = 'android/app/src/main/assets/capacitor.config.json';
  const configHash = hash(configFile);
  assert.equal(hash(join(extracted.bundle, 'base/assets/capacitor.config.json')), configHash);
  assert.equal(hash(join(apkFolder, 'assets/capacitor.config.json')), configHash);
  const badging = run('apk-badging', env.SERPENTS_AAPT2, ['dump', 'badging', apk]);
  assert.match(badging, new RegExp(`versionCode='${identity.versionCode}'`));
  assert.match(badging, new RegExp(`versionName='${identity.versionName.replaceAll('.', '\\.')}'`));
  assert.deepEqual(
    [...badging.matchAll(/uses-permission[^:]*: name='([^']+)'/g)].map((m) => m[1]).sort(),
    expectedPermissions,
  );
  const apkSignature = run('verify-apk-signature', tool('java'), [
    '-jar',
    join(sdk, 'build-tools', toolsVersion, 'lib/apksigner.jar'),
    'verify',
    '--verbose',
    '--print-certs',
    apk,
  ]);
  assert.ok(
    apkSignature.replaceAll(':', '').toLowerCase().includes(expectedCertificate),
    'APK certificate differs from the upload key',
  );
  const mapping = join(out, `${stem}-mapping.txt`);
  copyFileSync(
    join(extracted.bundle, 'BUNDLE-METADATA/com.android.tools.build.obfuscation/proguard.map'),
    mapping,
  );
  assert.ok(readFileSync(mapping).length > 10000, 'Release R8 mapping missing');
  assert.equal(hash(mapping), hash('android/app/build/outputs/mapping/release/mapping.txt'));
  const aab = join(out, `${stem}-play.aab`);
  copyFileSync(bundle, aab);
  rmSync(bundle);
  const report = {
    ...info,
    uploadCertificateSha256: expectedCertificate,
    capacitorConfigSha256: configHash,
    permissions,
    webFiles: bundledFiles,
    artifacts: Object.fromEntries(
      [aab, apk, mapping].map((p) => [
        p.split(/[\\/]/).at(-1),
        { bytes: readFileSync(p).length, sha256: hash(p) },
      ]),
    ),
    checks: {
      signed: true,
      bundletool: true,
      identicalBundledWebFiles: true,
      noWebOnlyContent: true,
      noInternetPermission: true,
      r8MappingBundled: true,
    },
    nativeDeviceQualification:
      'PENDING: install and launch the optimized release; browser checks are not a native qualification',
  };
  writeFileSync(join(out, 'release-report.json'), JSON.stringify(report, null, 2) + '\n');
  writeFileSync(
    join(out, 'SHA256SUMS.txt'),
    Object.entries(report.artifacts)
      .map(([name, value]) => `${value.sha256}  ${name}`)
      .join('\n') + '\n',
  );
  clean();
  console.log(
    `Signed Android candidate ready in ${out}; native release qualification still required before Play upload.`,
  );
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
