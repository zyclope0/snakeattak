import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Android wants the identifier of the application in six places of five files, and none can
// read it from another. It names the application on the store and holds the saves of the
// installed game: it never changes without the parent. This test only makes sure that the
// six stay the same one.
test('l’identifiant de l’application est le même partout', () => {
  const found = (file: string, pattern: RegExp): string[] =>
    [...readFileSync(file, 'utf8').matchAll(pattern)].map((match) => match[1]);
  const places = [
    ...found('capacitor.config.ts', /appId:\s*'([^']+)'/g),
    ...found('android/app/build.gradle', /namespace\s*=\s*"([^"]+)"/g),
    ...found('android/app/build.gradle', /applicationId\s+"([^"]+)"/g),
    ...found(
      'android/app/src/main/res/values/strings.xml',
      /<string name="(?:package_name|custom_url_scheme)">([^<]+)<\/string>/g,
    ),
  ];
  assert.equal(places.length, 5, 'un des cinq emplacements n’a pas été trouvé');
  const [identifier] = places;
  assert.deepEqual(places, Array(5).fill(identifier));
  const activity = `android/app/src/main/java/${identifier.replaceAll('.', '/')}/MainActivity.java`;
  assert.deepEqual(found(activity, /^package\s+([\w.]+);/gm), [identifier]);
});
