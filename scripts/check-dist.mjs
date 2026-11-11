import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
const html = await readFile('dist/index.html', 'utf8');
assert.ok(Buffer.byteLength(html) < 32768, 'HTML shell exceeds 32 KiB');
assert.match(html, /<script[^>]+src="\.\/assets\//);
assert.doesNotMatch(html, /data:image\//, 'Images must be separately cached');
const files = await readdir('dist/assets');
const report = {};
for (const name of files) {
  const bytes = (await stat(`dist/assets/${name}`)).size;
  report[name] = bytes;
  assert.match(name, /-[\w-]{8,}\./, 'Every cached asset must have a content hash');
  // Les musiques ne sont chargées qu'après activation du son, une à la fois.
  const limit = name.startsWith('phaser-')
    ? 2_000_000
    : name.endsWith('.js')
      ? 200_000
      : /^music-.*\.mp3$/.test(name)
        ? 3_200_000
        : 1_500_000;
  assert.ok(bytes <= limit, `${name} exceeds asset budget ${limit}`);
}
assert.ok(
  files.some((f) => f.startsWith('phaser-')),
  'Missing independent Phaser chunk',
);
assert.ok(!files.some((f) => f === 'references'), 'Design references do not belong in production');
console.log(JSON.stringify({ htmlBytes: Buffer.byteLength(html), assets: report }, null, 2));
