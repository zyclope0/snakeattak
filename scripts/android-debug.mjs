import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const win = process.platform === 'win32';
const npm = win ? 'npm.cmd' : 'npm';
const npx = win ? 'npx.cmd' : 'npx';
const run = (command, args, env = process.env, cwd = process.cwd()) => {
  const r = spawnSync(command, args, { stdio: 'inherit', env, cwd, shell: win });
  if (r.error || r.status !== 0)
    throw new Error(`${command} failed (${r.status}): ${r.error ?? ''}`);
};
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
run(npm, ['run', 'build']);
try {
  run(npx, ['cap', 'sync', 'android'], { ...process.env, SERPENTS_PERF: '1' });
  run(
    win ? 'gradlew.bat' : './gradlew',
    ['assembleDebug', '--no-daemon', '--max-workers=2'],
    process.env,
    resolve('android'),
  );
  mkdirSync('artifacts/android', { recursive: true });
  const target = `artifacts/android/conquete-serpents-v${version}-debug.apk`;
  copyFileSync('android/app/build/outputs/apk/debug/app-debug.apk', target);
  console.log(`Debug test APK: ${target}`);
} finally {
  // Keep ordinary sync/release configuration free of diagnostic startup options.
  run(npx, ['cap', 'sync', 'android'], { ...process.env, SERPENTS_PERF: '0' });
}
