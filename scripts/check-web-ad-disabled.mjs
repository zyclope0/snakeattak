// A shipping guard: a build holds ad code only where the one switch says so
// (`WEB_AD_DELIVERY`, src/ui/webAds/contract.ts), and never anywhere else.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { AD_SCRIPT_URL, WEB_AD_DELIVERY } from '../src/ui/webAds/contract.ts';

const root = process.argv[2] ?? 'dist';
const preview = root === 'dist-ads-preview';
// The recipe's own build: the ad box is on and asks a stand-in script, never Google.
const standIn = root === 'dist-ads-test';
// The published site, once advertising is switched on. The application, the portable copy
// and the local preview never carry it, whatever the switch says.
const live = root === 'dist' && WEB_AD_DELIVERY === 'enabled';
const files = [
  'index.html',
  ...(existsSync(join(root, 'assets'))
    ? readdirSync(join(root, 'assets'), { recursive: true })
    : []
  )
    .filter((n) => /\.(?:js|css)$/.test(n))
    .map((n) => `assets/${n}`),
];
let mock = false;
const holders = { script: [], unit: [] };
for (const file of files) {
  const content = readFileSync(join(root, file), 'utf8');
  // Never in any build: an ad frame written in the page, the older Google tag, automatic ads.
  assert.doesNotMatch(
    content,
    /googletagservices|<iframe\b|enable_page_level_ads|data-ad-format/i,
    `${root}/${file}: no automatic ads, no ad frame written in the page`,
  );
  if (content.includes(AD_SCRIPT_URL)) holders.script.push(file);
  if (content.includes('data-ad-slot')) holders.unit.push(file);
  if (live) {
    // The page itself asks nothing: the box and its script come from the game's code,
    // once there is room and unless a parent switched advertising off.
    if (file === 'index.html')
      assert.doesNotMatch(
        content,
        /googlesyndication|adsbygoogle|<ins\b/i,
        'the page asks nothing',
      );
    assert.doesNotMatch(content, /web-ad-preview/, `${root}/${file}: the mock must not ship`);
    continue;
  }
  assert.doesNotMatch(
    content,
    standIn ? /pagead2\.googlesyndication/i : /pagead2\.googlesyndication|adsbygoogle|<ins\b/i,
    `${root}/${file}: no ad delivery code`,
  );
  if (!preview && !standIn)
    assert.doesNotMatch(
      content,
      /web-ad-preview|7092707633|data-ad-slot|data-tag-for-age-treatment/,
      `${root}/${file}: preparation must not ship`,
    );
  if (content.includes('web-ad-preview')) mock = true;
}
if (preview) assert.ok(mock, 'Local preview has the mock; it still has no Google runtime');
if (live) {
  // Google's script is named once, by the first script of the game; the unit lives in the
  // package loaded only for advertising, with the child treatment.
  assert.equal(holders.script.length, 1, `one file names the ad script: ${holders.script}`);
  assert.match(holders.script[0], /^assets\/bootstrap-/);
  assert.equal(holders.unit.length, 1, `one file holds the ad unit: ${holders.unit}`);
  assert.match(holders.unit[0], /^assets\/delivery-/);
  assert.match(
    readFileSync(join(root, holders.unit[0]), 'utf8'),
    /data-tag-for-age-treatment["']?:\s*["']1["']/,
    'the unit asks for the child treatment',
  );
}
const state = live
  ? 'advertising switched on: one unit, child treatment, asked by the game only'
  : standIn
    ? 'ad box on, stand-in script only, no Google host'
    : `ad delivery disabled${preview ? ', local mock only' : ', no mock shipped'}`;
console.log(`${root}: ${files.length} HTML/JS/CSS files checked; ${state}`);
