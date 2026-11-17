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
/**
 * The game page when advertising is switched on, and only that page. Google supports a
 * policy with a fresh token on every page, which a static host cannot issue; this list of
 * its domains is the next best thing and must be checked against a capture of the live site
 * (`docs/publication/PUBLICITE-WEB-PROPOSITION.md`). Its scripts need inline code and
 * `eval`: on this page the policy no longer stops a script from running.
 */
const AD_HOSTS =
  'https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://*.gstatic.com https://*.adtrafficquality.google';
export const adsGamePagePolicy = `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' ${AD_HOSTS}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self'; connect-src 'self' ${AD_HOSTS}; frame-src ${AD_HOSTS}; media-src 'self' blob:; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'`;
/** The game page and nothing else: the public pages and the policy keep the strict rule. */
export const isGamePage = (path: string): boolean => path === '/' || path === '/index.html';
export const legacyPolicy =
  "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'";
export const assetCache = 'public, max-age=31536000, immutable';
/** The first prototype stays playable from the help of the game, out of search results. */
export const PROTOTYPE_ROBOTS = 'noindex';
export function hostHeadersFile() {
  return (
    '/*\n' +
    Object.entries(webHeaders)
      .map(([k, v]) => `  ${k}: ${v}`)
      .join('\n') +
    `\n\n/assets/*\n  Cache-Control: ${assetCache}\n\n/prototype-v4.html\n  Content-Security-Policy: ${legacyPolicy}\n  X-Robots-Tag: ${PROTOTYPE_ROBOTS}\n`
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
export function apacheConfig(webAds = false) {
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
    ...(webAds
      ? [
          '<IfModule mod_setenvif.c>',
          '  SetEnvIf Request_URI "^/(index\\.html)?$" game_page',
          '</IfModule>',
          '',
        ]
      : []),
    '<IfModule mod_headers.c>',
    ...headers,
    `  Header set Cache-Control "${webHeaders['Cache-Control']}"`,
    '  <FilesMatch "-[A-Za-z0-9_-]{8,}\\.(js|css|webp|png|mp3|woff2)$">',
    `    Header set Cache-Control "${assetCache}"`,
    '  </FilesMatch>',
    ...(webAds
      ? [`  Header always set Content-Security-Policy "${adsGamePagePolicy}" env=game_page`]
      : []),
    '  <Files "prototype-v4.html">',
    `    Header always set Content-Security-Policy "${legacyPolicy}"`,
    `    Header always set X-Robots-Tag "${PROTOTYPE_ROBOTS}"`,
    '  </Files>',
    '</IfModule>',
    '',
  ].join('\n');
}
