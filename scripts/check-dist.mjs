import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { WEB_HEAD_BUDGET, webHeadBytes } from '../deploy/discovery.ts';
import { gamePagePictures } from '../deploy/discoveryAssets.ts';
import { OLD_WEBVIEW_PAGE } from '../deploy/androidWebView.ts';

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
// What is shown when the game breaks must not need what broke. The window of a start-up that
// failed ships with the page's first script, and that script may load, even through another
// file, only the few small files named here — never the rules, the start-up code or Phaser,
// any of which can be the one that failed to arrive. A list of what is allowed, not of what
// is refused: a file that changes its name, or a new one, is refused until someone adds it
// here on purpose.
/** Besides the first script itself, the only file it may load with it. */
const LIGHT = /^keys-[\w-]+\.js$/;
async function reaches(name, seen = new Set()) {
  if (seen.has(name)) return seen;
  seen.add(name);
  const code = await readFile(`${root}/assets/${name}`, 'utf8');
  // Only what is loaded with the file: `import … from` and bare `import "…"`. A file asked
  // for later, by `import(…)`, is not needed for this one to run.
  for (const [, next] of code.matchAll(/(?:from|import)\s*["']\.\/([\w.-]+\.js)["']/g))
    await reaches(next, seen);
  return seen;
}
{
  const entry = /<script type="module"[^>]* src="\.\/assets\/([\w.-]+\.js)"/.exec(html)?.[1];
  assert.ok(entry, 'The page has a first script');
  const loaded = await reaches(entry);
  const heavy = [...loaded].filter((f) => f !== entry && !LIGHT.test(f));
  assert.deepEqual(heavy, [], `${entry} must not need ${heavy.join(', ')}`);
  // The screen kept on during a battle is the application's (src/ui/screenAwake.ts), in a file
  // of its own asked for after the first script. The website holds none of it.
  const WAKE_LOCK = 'wakeLock';
  const waking = [];
  for (const name of files.filter((f) => f.endsWith('.js')))
    if ((await readFile(`${root}/assets/${name}`, 'utf8')).includes(WAKE_LOCK)) waking.push(name);
  if (target === 'android') {
    assert.ok(waking.length, 'The application keeps the screen on during a battle');
    const early = waking.filter((name) => name === entry || loaded.has(name));
    assert.deepEqual(early, [], 'The screen is kept on by a file of its own');
  } else assert.deepEqual(waking, [], 'The website lets its screen sleep');
  // The code of Capacitor and of its plugins (two hand a file over, one hands Android's
  // « retour » button over) is in the application only, in files of their own asked for
  // after the game has started: never with the first script, never with the game. Every plugin
  // needs Capacitor's core, and the core asks for `androidBridge`: a file that holds that
  // word holds the core, whatever its name or the file it was folded into.
  const CAPACITOR = 'androidBridge';
  const holding = [];
  for (const name of files.filter((f) => f.endsWith('.js')))
    if ((await readFile(`${root}/assets/${name}`, 'utf8')).includes(CAPACITOR)) holding.push(name);
  if (target === 'android') {
    // The word is still there to be found: a build that renamed it would pass for ever.
    assert.ok(holding.length, 'The application holds the code that hands a file over');
    const early = holding.filter((name) => loaded.has(name));
    assert.deepEqual(early, [], 'Capacitor is not loaded with the first script');
    // Nor with the game's own code: it is asked for apart, once the game has started (the
    // « retour » button) or when a file is asked for (the share).
    const start = files.find((f) => /^bootstrap-[\w-]+\.js$/.test(f));
    const game = start ? await reaches(start) : new Set();
    const withGame = holding.filter((name) => game.has(name));
    assert.deepEqual(withGame, [], 'Capacitor is not loaded with the game');
    // The start-up rescue hands files over with all of it: Capacitor, the two plugins (found by
    // the names they register) and the question for an adult (by its answer box). None may
    // need the rules, the game or Phaser, which may be what failed. Each may load only the
    // first script, the keys, and the others of its kind.
    const HANDS_OVER = /androidBridge|"Share"|"Filesystem"|adult-gate-answer/;
    const handing = new Set();
    let question = false;
    for (const name of files.filter((f) => f.endsWith('.js') && f !== entry)) {
      const code = await readFile(`${root}/assets/${name}`, 'utf8');
      if (HANDS_OVER.test(code)) handing.add(name);
      if (code.includes('adult-gate-answer')) question = true;
    }
    assert.ok(question, 'The application holds the question for an adult');
    for (const name of handing) {
      const needs = [...(await reaches(name))].filter(
        (f) => f !== entry && !LIGHT.test(f) && !handing.has(f),
      );
      assert.deepEqual(needs, [], `${name}, which hands a file over, must not need ${needs}`);
    }
  } else assert.deepEqual(holding, [], 'The website holds none of Capacitor');
  // The windows are in that script, not in files of their own asked for at the bad moment.
  const code = await readFile(`${root}/assets/${entry}`, 'utf8');
  assert.match(code, /start-dialog|["'`]start["'`]/, 'The start-up window ships with the page');
  assert.ok(
    !files.some((f) => /^(rescue|trouble|failureWindow)-[\w-]+\.js$/.test(f)),
    'The failure windows are not files fetched later',
  );
  // The window of a stopped board is in the game's own code, whatever its file is called:
  // the day the board stops, nothing is to be fetched.
  const game = files.find((f) => /^bootstrap-[\w-]+\.js$/.test(f));
  assert.ok(game, 'The game has its start-up file');
  assert.match(
    await readFile(`${root}/assets/${game}`, 'utf8'),
    /relaunchedAfterFailure/,
    'The window of a stopped board ships with the game',
  );
}
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
  // What Android shows when its WebView is too old is the application's only.
  assert.ok(
    !existsSync(`${root}/${OLD_WEBVIEW_PAGE}`),
    `${OLD_WEBVIEW_PAGE} is not on the website`,
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
