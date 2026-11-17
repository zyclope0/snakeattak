// This is a shipping guard, not a switch: ordinary builds cannot turn ads on.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const root = process.argv[2] ?? 'dist';
const preview = root === 'dist-ads-preview';
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
for (const file of files) {
  const content = readFileSync(join(root, file), 'utf8');
  assert.doesNotMatch(
    content,
    /pagead2\.googlesyndication|googletagservices|adsbygoogle|<ins\b|<iframe\b/i,
    `${root}/${file}: no ad delivery code`,
  );
  if (!preview)
    assert.doesNotMatch(
      content,
      /web-ad-preview|7092707633|data-ad-slot|data-tag-for-age-treatment/,
      `${root}/${file}: preparation must not ship`,
    );
  if (content.includes('web-ad-preview')) mock = true;
}
if (preview) assert.ok(mock, 'Local preview has the mock; it still has no Google runtime');
console.log(
  `${root}: ${files.length} HTML/JS/CSS files checked; ad delivery disabled${preview ? ', local mock only' : ', no mock shipped'}`,
);
