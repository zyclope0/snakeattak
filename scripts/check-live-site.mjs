// Reads the published site and tells whether it is the build of this commit, served as the
// policy asks. Only reads: nothing is sent but ordinary page requests.
//   node scripts/check-live-site.mjs [origin] [commit]
import { readFile } from 'node:fs/promises';
import { webHeaders, assetCache } from '../deploy/policy.ts';
import { privacyPageHtml } from '../deploy/privacyPage.ts';
import { PRIVACY_FOLDER, SITE_HOST, SITE_ORIGIN } from '../src/site.ts';
import { DISCOVERY_PAGES } from '../deploy/discoveryCopy.ts';
import { discoveryRobots, discoverySitemap } from '../deploy/discovery.ts';

const origin = (process.argv[2] ?? SITE_ORIGIN).replace(/\/$/, '');
const commit = process.argv[3] ?? '';
const { version } = JSON.parse(await readFile('package.json', 'utf8'));
const failures = [];
const notes = [];
const expect = (ok, label) => {
  if (!ok) failures.push(label);
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`);
};
const get = (url, redirect = 'follow') => fetch(url, { redirect, cache: 'no-store' });
const location = (response) => response.headers.get('location') ?? '';
const moved = (response) => [301, 302, 307, 308].includes(response.status);

// The game: its page, its version, its script kept for good by the browser.
const home = await get(`${origin}/`);
const page = await home.text();
expect(home.status === 200, `${origin}/ answers 200 (${home.status})`);
expect(page.includes(`v${version}`), `the page is version ${version}`);
for (const [name, value] of Object.entries(webHeaders))
  expect(home.headers.get(name) === value, `header ${name} on the page`);
const script = /src="\.\/(assets\/[^"]+\.js)"/.exec(page)?.[1];
if (script) {
  const asset = await get(`${origin}/${script}`);
  expect(asset.status === 200, `${script} answers 200 (${asset.status})`);
  expect(asset.headers.get('cache-control') === assetCache, `${script} is kept by the browser`);
} else expect(false, 'the page names its script');

// The build that is online is the one that was meant.
if (commit) {
  const stamp = await get(`${origin}/version.json`);
  const told = stamp.ok ? await stamp.json() : {};
  expect(told.commit === commit, `version.json names commit ${commit} (${told.commit})`);
}

// The privacy policy: reachable without an account, and word for word the one of this commit.
const policy = await get(`${origin}/${PRIVACY_FOLDER}/`);
expect(policy.status === 200, `/${PRIVACY_FOLDER}/ answers 200 (${policy.status})`);
expect((await policy.text()) === privacyPageHtml(), 'the public policy is the one of this commit');
const bare = await get(`${origin}/${PRIVACY_FOLDER}`, 'manual');
expect(
  bare.status === 200 || (moved(bare) && /\/confidentialite\/$/.test(location(bare))),
  `/${PRIVACY_FOLDER} without its slash leads to the policy (${bare.status} ${location(bare)})`,
);

// One address: HTTPS, without « www ». Checked only on the real site.
if (origin === SITE_ORIGIN) {
  const plain = await get(`http://${SITE_HOST}/`, 'manual').catch(() => null);
  expect(
    !!plain && moved(plain) && location(plain).startsWith(`${SITE_ORIGIN}/`),
    `http:// is sent to https:// (${plain?.status} ${plain ? location(plain) : 'no answer'})`,
  );
  const www = await get(`https://www.${SITE_HOST}/`, 'manual').catch(() => null);
  if (!www) notes.push(`www.${SITE_HOST} does not answer: nothing to redirect.`);
  else
    expect(
      moved(www) && location(www).startsWith(`${SITE_ORIGIN}/`),
      `www is sent to the address without www (${www.status} ${location(www)})`,
    );
}

// The site sets no cookie of its own.
for (const response of [home, policy])
  expect(!response.headers.get('set-cookie'), `no cookie set by ${new URL(response.url).pathname}`);

// Public discovery pages are deployed with the game, never by another hosting system.
for (const item of DISCOVERY_PAGES) {
  const response = await get(origin + item.path);
  const body = await response.text();
  expect(response.status === 200, `${item.path} answers 200`);
  expect(
    body === (await readFile(`dist${item.path}index.html`, 'utf8')),
    `${item.path} matches this build`,
  );
  expect(!response.headers.get('set-cookie'), `${item.path} sets no cookie`);
}
for (const [path, expected] of [
  ['/sitemap.xml', discoverySitemap()],
  ['/robots.txt', discoveryRobots()],
]) {
  const response = await get(origin + path);
  expect(
    response.status === 200 && (await response.text()) === expected,
    `${path} matches this build`,
  );
}

for (const note of notes) console.log(`note ${note}`);
if (failures.length) {
  console.error(`\n${failures.length} check(s) failed on ${origin}.`);
  process.exit(1);
}
console.log(`\nThe site at ${origin} is the expected build.`);
