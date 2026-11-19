import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { mkdtempSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
const suffix = process.platform === 'win32' ? '.exe' : '';
const tool = (name) =>
  process.env.JAVA_HOME ? join(process.env.JAVA_HOME, 'bin', name + suffix) : name;
const scratch = mkdtempSync(join(tmpdir(), 'serpents signatures '));
const env = { ...process.env, SERPENTS_TEST_KEY_PASS: randomBytes(24).toString('hex') };
const exec = (name, args) => {
  const r = spawnSync(tool(name), args, { env, cwd: scratch });
  assert.equal(r.status, 0, `${name} failed: ${r.stderr?.toString()}`);
  return r.stdout;
};
const check = (file, certificate, succeeds) => {
  const r = spawnSync(
    tool('java'),
    [resolve('scripts/VerifyAndroidBundle.java'), join(scratch, file), certificate],
    { env },
  );
  assert.equal(r.status === 0, succeeds, r.stderr?.toString());
};
try {
  writeFileSync(join(scratch, 'payload.txt'), 'Android contents');
  exec('jar', ['cf', 'unsigned.aab', 'payload.txt']);
  check('unsigned.aab', '0'.repeat(64), false);
  exec('keytool', [
    '-genkeypair',
    '-alias',
    'test',
    '-keyalg',
    'RSA',
    '-keysize',
    '2048',
    '-validity',
    '2',
    '-dname',
    'CN=Ephemeral test',
    '-keystore',
    'test.p12',
    '-storetype',
    'PKCS12',
    '-storepass:env',
    'SERPENTS_TEST_KEY_PASS',
    '-keypass:env',
    'SERPENTS_TEST_KEY_PASS',
    '-noprompt',
  ]);
  const certificate = createHash('sha256')
    .update(
      exec('keytool', [
        '-exportcert',
        '-alias',
        'test',
        '-keystore',
        'test.p12',
        '-storepass:env',
        'SERPENTS_TEST_KEY_PASS',
      ]),
    )
    .digest('hex');
  copyFileSync(join(scratch, 'unsigned.aab'), join(scratch, 'signed.aab'));
  exec('jarsigner', [
    '-keystore',
    'test.p12',
    '-storepass:env',
    'SERPENTS_TEST_KEY_PASS',
    '-keypass:env',
    'SERPENTS_TEST_KEY_PASS',
    'signed.aab',
    'test',
  ]);
  check('signed.aab', certificate, true);
  check('signed.aab', '0'.repeat(64), false);
  copyFileSync(join(scratch, 'signed.aab'), join(scratch, 'partial.aab'));
  writeFileSync(join(scratch, 'extra.txt'), 'Unsigned addition');
  exec('jar', ['uf', 'partial.aab', 'extra.txt']);
  check('partial.aab', certificate, false);
  copyFileSync(join(scratch, 'signed.aab'), join(scratch, 'tampered.aab'));
  writeFileSync(join(scratch, 'payload.txt'), 'Changed after signature');
  exec('jar', ['uf', 'tampered.aab', 'payload.txt']);
  check('tampered.aab', certificate, false);
  console.log(
    '5 signature controls passed: signed, unsigned, wrong key, partial signature, tampered content; paths contain spaces',
  );
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
