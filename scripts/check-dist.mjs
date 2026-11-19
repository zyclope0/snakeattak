import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { WEB_HEAD_BUDGET, webHeadBytes } from '../deploy/discovery.ts';
import { gamePagePictures } from '../deploy/discoveryAssets.ts';

const root = process.argv[2] ?? 'dist';
const html = await readFile(`${root}/index.html`, 'utf8');
const target = JSON.parse(await readFile(`${root}/build-info.json`, 'utf8')).target;
// The website adds its own head to the page (names for search engines, icons, a link to
// the public pages). It is counted apart: the page of the game keeps its 32 KiB.
const webHead = existsSync(`${root}/sitemap.xml`) ? webHeadBytes(gamePagePictures()) : 0;
assert.ok(webHead <= WEB_HEAD_BUDGET, `Website head exceeds ${WEB_HEAD_BUDGET} bytes`);
const shellBytes = Buffer.byteLength(html) - webHead;
assert.ok(shellBytes < 32768, 'HTML shell exceeds 32 KiB');
assert.match(html, /<script[^>]+src="\.\/assets\//);
assert.doesNotMatch(html, /data:image\//, 'Images must be separately cached');
const files = await readdir(`${root}/assets`);
const report = {};
for (const name of files) {
  const bytes = (await stat(`${root}/assets/${name}`)).size;
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
// The public privacy policy is a page of its own, readable without the game or JavaScript.
const policy = await readFile(`${root}/confidentialite/index.html`, 'utf8');
assert.match(
  policy,
  /<article id="fr"[\s\S]+<article id="en" lang="en"/,
  'Policy in both languages',
);
assert.doesNotMatch(policy, /<script|<link rel="stylesheet"/, 'The policy page stands alone');
if (target !== 'android') {
  assert.match(
    await readFile(`${root}/.htaccess`, 'utf8'),
    /RewriteEngine On/,
    'Apache configuration',
  );
} else {
  assert.ok(!existsSync(`${root}/.htaccess`), 'Android has no server configuration');
}

console.log(
  JSON.stringify(
    { htmlBytes: Buffer.byteLength(html), shellBytes, webHead, assets: report },
    null,
    2,
  ),
);
