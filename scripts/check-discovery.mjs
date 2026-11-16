// Checks generated files, so missing links or Android leakage fail the actual build.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { DISCOVERY_PAGES } from '../deploy/discoveryCopy.ts';
import { SUPPORT_URL } from '../deploy/discovery.ts';

const folder = process.argv[2] ?? 'dist';
const android = folder === 'dist-android';
const game = readFileSync(join(folder, 'index.html'), 'utf8');
if (android) {
  for (const name of ['fr', 'en', 'sitemap.xml', 'robots.txt'])
    assert.ok(!existsSync(join(folder, name)), `Android must not include ${name}`);
  assert.doesNotMatch(game, /data-support|href="\/(?:fr|en)\/"|rel="canonical"/);
  console.log('Android: no discovery pages, public metadata or support links');
} else {
  assert.match(game, /href="\/fr\/"/);
  assert.match(game, /href="\/en\/"/);
  assert.ok(existsSync(join(folder, 'sitemap.xml')));
  assert.ok(existsSync(join(folder, 'robots.txt')));
  let links = 0;
  for (const page of DISCOVERY_PAGES) {
    const html = readFileSync(join(folder, page.path, 'index.html'), 'utf8');
    assert.ok(Buffer.byteLength(html) < 25000, `${page.path} stays lightweight`);
    assert.doesNotMatch(
      html,
      /<script[^>]+src=|<iframe|https?:\/\/(?:fonts\.google|www\.googletag)/,
    );
    if (!SUPPORT_URL) assert.doesNotMatch(html, /data-support/);
    for (const match of html.matchAll(/(?:href|src)="(\/[^"#]*)"/g)) {
      const path = join(folder, decodeURI(match[1]));
      assert.ok(existsSync(path), `${page.path}: missing ${match[1]}`);
      if (statSync(path).isDirectory()) assert.ok(existsSync(join(path, 'index.html')));
      links++;
    }
    const structured = /<script type="application\/ld\+json">([^<]+)<\/script>/.exec(html)?.[1];
    assert.ok(structured);
    assert.equal(JSON.parse(structured).inLanguage, page.lang);
  }
  console.log(
    `Discovery: ${DISCOVERY_PAGES.length} pages, ${links} local links/resources checked; support ${SUPPORT_URL ? 'configured' : 'hidden'}`,
  );
}
