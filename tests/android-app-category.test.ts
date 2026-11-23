import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// From Android 16, a screen of 600 dp or more ignores the orientation an app asks for, unless
// the app says it is a game. The board needs the landscape its activity asks for.
test('the application tells Android that it is a game', () => {
  const manifest = readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
  const application = /<application\b[^>]*>/.exec(manifest)?.[0] ?? '';
  assert.match(application, /\sandroid:appCategory="game"\s/);
  assert.match(manifest, /android:screenOrientation="sensorLandscape"/);
});
