import { SITE_HOST } from '../src/site.ts';

/** HTTP policy for a static host. The portable file:// export has no HTTP headers. */
export const webHeaders: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; media-src 'self' blob:; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
  'Cache-Control': 'no-cache',
};
export const legacyPolicy =
  "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'";
export const assetCache = 'public, max-age=31536000, immutable';
export function hostHeadersFile() {
  return (
    '/*\n' +
    Object.entries(webHeaders)
      .map(([k, v]) => `  ${k}: ${v}`)
      .join('\n') +
    `\n\n/assets/*\n  Cache-Control: ${assetCache}\n\n/prototype-v4.html\n  Content-Security-Policy: ${legacyPolicy}\n`
  );
}

/**
 * The same policy for an Apache host (`.htaccess` at the root of the site), with the one
 * address of the site: HTTPS, without « www ». Only directives every shared Apache accepts,
 * each inside the module it needs: a host without the module serves the site all the same.
 *
 * The HTTPS rule follows the host's own guide: `%{HTTPS}` tells the truth on a direct
 * server, `X-Forwarded-Proto` behind a proxy. Both are asked, so that neither setting loops.
 * The files of `assets/`, named with a hash of their content, never change and are kept by
 * the browser; the pages are asked again at every visit, which is how a new version arrives.
 */
export function apacheConfig() {
  const host = SITE_HOST.replace(/\./g, '\\.');
  const origin = `https://${SITE_HOST}`;
  const headers = Object.entries(webHeaders)
    .filter(([name]) => name !== 'Cache-Control')
    .map(([name, value]) => `  Header always set ${name} "${value}"`);
  return [
    '# Written by the build (deploy/policy.ts). Change it there, not on the server.',
    'DirectoryIndex index.html',
    '',
    '<IfModule mod_rewrite.c>',
    '  RewriteEngine On',
    `  RewriteCond %{HTTP_HOST} ^www\\.${host}$ [NC]`,
    `  RewriteRule ^ ${origin}%{REQUEST_URI} [R=301,L]`,
    '  RewriteCond %{HTTPS} off',
    '  RewriteCond %{HTTP:X-Forwarded-Proto} !https',
    `  RewriteRule ^ ${origin}%{REQUEST_URI} [R=301,L]`,
    '</IfModule>',
    '',
    '<IfModule mod_headers.c>',
    ...headers,
    `  Header set Cache-Control "${webHeaders['Cache-Control']}"`,
    '  <FilesMatch "-[A-Za-z0-9_-]{8,}\\.(js|css|webp|png|mp3|woff2)$">',
    `    Header set Cache-Control "${assetCache}"`,
    '  </FilesMatch>',
    '  <Files "prototype-v4.html">',
    `    Header always set Content-Security-Policy "${legacyPolicy}"`,
    '  </Files>',
    '</IfModule>',
    '',
  ].join('\n');
}
