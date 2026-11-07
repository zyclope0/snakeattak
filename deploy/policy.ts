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
