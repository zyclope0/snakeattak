/**
 * The one switch of advertising on the website. It stays on `disabled` until the parent says
 * go and Google has approved the site (`docs/publication/PUBLICITE-WEB-PROPOSITION.md`).
 * While it is, the build ships no ad code at all: `scripts/check-web-ad-disabled.mjs`.
 */
export const WEB_AD_DELIVERY = 'disabled' as 'disabled' | 'enabled';
export const PREPARED_DISPLAY_ATTRIBUTES = Object.freeze({
  'data-ad-client': 'ca-pub-8498417364292905',
  'data-ad-slot': '7092707633',
  'data-tag-for-age-treatment': '1',
  'data-full-width-responsive': 'false',
});
/** Google's own script for a display unit, named with the account. */
export const AD_SCRIPT_URL = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PREPARED_DISPLAY_ATTRIBUTES['data-ad-client']}`;
