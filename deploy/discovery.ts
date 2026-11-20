import { SITE_ORIGIN } from '../src/site.ts';
import { adSenseVerificationMeta } from './adsenseVerification.ts';
import { DISCOVERY_PAGES, type DiscoveryPage } from './discoveryCopy.ts';

/** Public destination and bilingual privacy wording approved on 16 November 2026. */
export const SUPPORT_URL: string | null = 'https://www.paypal.com/ncp/payment/XXQ7BEAZQ3QZL';
/**
 * The picture a shared link shows: a real battle under the icon and both names of the game,
 * made by `scripts/export-share-image.mjs`. Wide, as social networks and messengers expect.
 */
export const SHARE_PICTURE = {
  source: 'resources/site/share-1200x630.jpg',
  width: 1200,
  height: 630,
} as const;
export type DiscoveryAssets = {
  css: string;
  /** The wide picture of a shared link (`SHARE_PICTURE`); no page shows it. */
  share: string;
  /** The child's drawing, on the page of the story once the parent has given it. */
  drawing?: string;
  /** Browser tab, 48 px; a phone's home screen, 180 px; the logo beside the title. */
  tab: string;
  touch: string;
  logo: string;
  hero: string;
  characters: string[];
};
const escape = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

export function resolveSupportUrl(value: string | null): string | null {
  if (!value?.trim()) return null;
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password)
    throw new Error('Support requires an HTTPS URL without credentials');
  return url.href;
}

const labels = {
  fr: {
    play: 'Jouer gratuitement',
    home: 'Le jeu',
    guide: 'Comment jouer',
    characters: 'Les personnages',
    updates: 'Nouveautés',
    parents: 'Pour les parents',
    story: 'L’histoire',
    test: 'Tester sur Android',
    privacy: 'Confidentialité',
    support: 'Soutenir le développement',
    supportPay: 'Soutenir sur PayPal (nouvel onglet)',
    supportAnchor: 'soutien',
    external:
      'Pour les adultes : soutien ponctuel et facultatif en CHF sur PayPal. Aucun avantage dans le jeu.',
    skip: 'Aller au contenu',
    alt: 'Un héros et un serpent en pâte à modeler, près du cristal',
    shareAlt:
      'Une bataille du jeu : des alliés défendent le cristal contre des serpents, sur trois chemins',
    title: 'La Conquête des Serpents',
    family: 'Imaginé par un enfant, partagé en famille.',
    back: 'Retour au jeu',
  },
  en: {
    play: 'Play for free',
    home: 'The game',
    guide: 'How to play',
    characters: 'Characters',
    updates: 'Updates',
    parents: 'For parents',
    story: 'The story',
    test: 'Test on Android',
    privacy: 'Privacy policy',
    support: 'Support development',
    supportPay: 'Support the game on PayPal (new tab)',
    supportAnchor: 'support',
    external:
      'For adults: an optional, one-off contribution in CHF through PayPal. No in-game benefits.',
    skip: 'Skip to content',
    alt: 'A clay hero and snake beside the crystal',
    shareAlt: 'A battle from the game: allies defend the crystal against snakes on three paths',
    title: 'Snake Attack TD',
    family: 'Imagined by a child, shared with the family.',
    back: 'Back to the game',
  },
} as const;

/** The sentence written for adults beside the payment link, which a screen reader reads with it. */
const supportNote = (language: 'fr' | 'en') => `${labels[language].supportAnchor}-note`;
function supportLink(language: 'fr' | 'en', value: string | null) {
  const url = resolveSupportUrl(value);
  return url
    ? `<a data-support aria-describedby="${supportNote(language)}" href="${escape(url)}" target="_blank" rel="noopener noreferrer nofollow">${labels[language].supportPay}</a>`
    : '';
}

export function discoveryPageHtml(
  page: DiscoveryPage,
  assets: DiscoveryAssets,
  supportUrl = SUPPORT_URL,
  pages: readonly DiscoveryPage[] = DISCOVERY_PAGES,
): string {
  const words = labels[page.lang];
  const equivalent = pages.find((p) => p.key === page.key && p.lang !== page.lang)!;
  const french = pages.find((p) => p.key === page.key && p.lang === 'fr')!;
  const english = pages.find((p) => p.key === page.key && p.lang === 'en')!;
  const canonical = SITE_ORIGIN + page.path;
  const support = supportLink(page.lang, supportUrl);
  // The payment link lives in one place, written for adults: the parents page. Every other
  // footer leads there, never to the payment itself; the parents page already shows it.
  const parents = pages.find((p) => p.key === 'parents' && p.lang === page.lang)!;
  const supportWay =
    support && page.key !== 'parents'
      ? `<a href="${parents.path}#${words.supportAnchor}">${words.support}</a>`
      : '';
  const story = (b: DiscoveryPage['blocks'][number]) =>
    `<section class="story"><h2>${escape(b.heading)}</h2><p>${escape(b.text)}</p>${b.link ? `<a href="${escape(b.link.href)}">${escape(b.link.label)}</a>` : ''}</section>`;
  // The Android test has its own button at the top of every page, not a place in this list.
  const navigation = pages
    .filter((p) => p.lang === page.lang && p.key !== 'test')
    .map(
      (p) =>
        `<a href="${p.path}"${p.key === page.key ? ' aria-current="page"' : ''}>${words[p.key]}</a>`,
    )
    .join('');
  const test = pages.find((p) => p.key === 'test' && p.lang === page.lang);
  const testButton = test
    ? `<a class="test-android" href="${test.path}"${page.key === 'test' ? ' aria-current="page"' : ''}>${words.test}</a>`
    : '';
  const drawing =
    page.figure && assets.drawing
      ? `<figure class="drawing"><img src="${assets.drawing}" width="${page.figure.width}" height="${page.figure.height}" alt="${escape(page.figure.alt)}" loading="lazy"><figcaption>${escape(page.figure.caption)}</figcaption></figure>`
      : '';
  const cards =
    page.key === 'characters'
      ? `<div class="figures" aria-hidden="true">${assets.characters.map((src) => `<img src="${src}" alt="" width="160" height="160" loading="lazy">`).join('')}</div>`
      : '';
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url: canonical,
    name: page.title,
    description: page.description,
    inLanguage: page.lang,
    isPartOf: { '@type': 'WebSite', name: 'Snake Attack TD', url: SITE_ORIGIN + '/' },
  };
  return `<!doctype html>
<html lang="${page.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#173e37">
<title>${escape(page.title)}</title>
<meta name="description" content="${escape(page.description)}">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="fr" href="${SITE_ORIGIN}${french.path}">
<link rel="alternate" hreflang="en" href="${SITE_ORIGIN}${english.path}">
<link rel="alternate" hreflang="x-default" href="${SITE_ORIGIN}${english.path}">
<link rel="icon" type="image/png" sizes="48x48" href="${assets.tab}">
<link rel="apple-touch-icon" href="${assets.touch}">
<link rel="stylesheet" href="${assets.css}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Snake Attack TD">
<meta property="og:title" content="${escape(page.title)}">
<meta property="og:description" content="${escape(page.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="${page.lang === 'fr' ? 'fr_FR' : 'en_US'}">
<meta property="og:locale:alternate" content="${page.lang === 'fr' ? 'en_US' : 'fr_FR'}">
<meta property="og:image" content="${SITE_ORIGIN}${assets.share}">
<meta property="og:image:width" content="${SHARE_PICTURE.width}">
<meta property="og:image:height" content="${SHARE_PICTURE.height}">
<meta property="og:image:alt" content="${escape(words.shareAlt)}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>
</head>
<body>
<a class="skip" href="#content">${words.skip}</a>
<header class="site-header"><a class="brand" href="/${page.lang}/"><img src="${assets.logo}" alt="" width="48" height="48">${words.title}</a><a class="language" lang="${equivalent.lang}" hreflang="${equivalent.lang}" href="${equivalent.path}">${equivalent.lang === 'en' ? 'English' : 'Français'}</a>${testButton}<a class="play small" href="/">${words.play}</a></header>
<nav class="site-nav" aria-label="${page.lang === 'fr' ? 'Découvrir le jeu' : 'Explore the game'}">${navigation}</nav>
<main id="content">
<section class="intro"><div><p class="eyebrow">${words.family}</p><h1>${escape(page.heading)}</h1><p class="lead">${escape(page.lead)}</p><a class="play" href="/">${words.play}<span aria-hidden="true"> →</span></a></div><img class="hero" src="${assets.hero}" width="512" height="512" alt="${escape(words.alt)}" fetchpriority="high"></section>
${cards}${drawing}
<div class="stories">${page.blocks.map(story).join('\n')}</div>
${page.key === 'parents' && support ? `<section class="support-note" id="${words.supportAnchor}"><h2>${words.support}</h2><p id="${supportNote(page.lang)}">${words.external}</p>${support}</section>` : ''}
</main>
<footer class="site-footer"><p>© zyclope · ${words.title}</p><nav aria-label="${page.lang === 'fr' ? 'Informations' : 'Information'}"><a href="/">${words.back}</a><a href="/confidentialite/${page.lang === 'en' ? '#en' : ''}">${words.privacy}</a>${supportWay}</nav></footer>
</body>
</html>\n`;
}

/**
 * The page of an address that does not exist: both languages, the way back to the game and
 * to the public pages. No script and no redirection (the answer must stay a 404), no
 * canonical and no address read back, absolute paths (it is served at any address), out of
 * search results and out of the sitemap.
 */
export function notFoundPageHtml(assets: DiscoveryAssets): string {
  const half = (lang: 'fr' | 'en', title: string, text: string) => {
    const words = labels[lang];
    // French opens the page with its only `h1`; English follows one level down.
    const tag = lang === 'fr' ? 'h1' : 'h2';
    return `<section class="intro" lang="${lang}"><div><${tag}>${title}</${tag}><p class="lead">${text}</p><a class="play" href="/">${words.play}<span aria-hidden="true"> →</span></a><p><a href="/${lang}/">${words.home}</a></p></div></section>`;
  };
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#173e37">
<meta name="robots" content="noindex">
<title>Page introuvable / Page not found — Snake Attack TD</title>
<link rel="icon" type="image/png" sizes="48x48" href="${assets.tab}">
<link rel="stylesheet" href="${assets.css}">
</head>
<body data-not-found>
<header class="site-header"><a class="brand" href="/"><img src="${assets.logo}" alt="" width="48" height="48">${labels.fr.title} · <span lang="en">${labels.en.title}</span></a></header>
<main id="content">
${half('fr', 'Cette page n’existe pas.', 'L’adresse a peut-être changé. Le jeu, lui, est toujours là.')}
${half('en', 'This page does not exist.', 'The address may have changed. The game is still here.')}
</main>
</body>
</html>\n`;
}

export function discoverySitemap(published: readonly DiscoveryPage[] = DISCOVERY_PAGES): string {
  const root = `<url><loc>${SITE_ORIGIN}/</loc></url>`;
  const privacy = `<url><loc>${SITE_ORIGIN}/confidentialite/</loc></url>`;
  const pages = published.map((page) => {
    const alternatives = published
      .filter((p) => p.key === page.key)
      .map(
        (p) => `<xhtml:link rel="alternate" hreflang="${p.lang}" href="${SITE_ORIGIN}${p.path}"/>`,
      )
      .join('');
    return `<url><loc>${SITE_ORIGIN}${page.path}</loc>${alternatives}</url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${[root, ...pages, privacy].join('\n')}\n</urlset>\n`;
}

/**
 * Everything may be read. The old prototype is kept out of search results by a header
 * (`deploy/policy.ts`), which a search engine can only see on a page it is allowed to read.
 */
export function discoveryRobots(): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`;
}

/**
 * The game page as search engines and shared links describe it. The game writes its title
 * in the player's language (« La Conquête des Serpents », "Snake Attack TD"); a search
 * engine states no language and may read either, so the description holds both.
 */
export const GAME_PAGE = {
  /** A shared link names the game in both languages, as its picture does. */
  title: 'Snake Attack TD — La Conquête des Serpents',
  /** What the shared picture shows, for who cannot see it: short, in both languages. */
  shareAlt: 'Une bataille du jeu contre les serpents. A battle against the snakes.',
  description:
    'Jeu de défense gratuit : protège le cristal sur trois voies avec tes alliés. Free defense game: protect the crystal on three lanes with your allies.',
} as const;

/**
 * What the website may add to the game page, in bytes: its names for search engines and
 * shared links, its icons, the link to the public pages and, once open, to the Android test
 * (1 280 until 20 November 2026). The page of the game itself keeps its own limit
 * (`scripts/check-dist.mjs`); this one is counted apart, so that neither can grow by hiding
 * in the other.
 */
export const WEB_HEAD_BUDGET = 1440;
/** The bytes `augmentGamePage` adds to a page: the same whatever the page holds. */
export function webHeadBytes(
  pictures: { share: string; touch: string },
  pages: readonly DiscoveryPage[] = DISCOVERY_PAGES,
) {
  const shell = '<head></head><nav class="parent-actions"></nav>';
  return Buffer.byteLength(augmentGamePage(shell, pictures, pages)) - Buffer.byteLength(shell);
}

/** Applied at build time on the website only. No storage, redirects or game rules. */
export function augmentGamePage(
  html: string,
  pictures: { share: string; touch: string },
  pages: readonly DiscoveryPage[] = DISCOVERY_PAGES,
): string {
  const meta =
    // One tag for search engines and for shared links: the page keeps its budget.
    `<meta name="description" property="og:description" content="${GAME_PAGE.description}">` +
    `<link rel="canonical" href="${SITE_ORIGIN}/">` +
    `<link rel="apple-touch-icon" href="${pictures.touch}">` +
    `<meta property="og:type" content="website">` +
    `<meta property="og:url" content="${SITE_ORIGIN}/">` +
    `<meta property="og:site_name" content="Snake Attack TD">` +
    `<meta property="og:title" content="${GAME_PAGE.title}">` +
    `<meta property="og:image" content="${SITE_ORIGIN}${pictures.share}">` +
    `<meta property="og:image:width" content="${SHARE_PICTURE.width}">` +
    `<meta property="og:image:height" content="${SHARE_PICTURE.height}">` +
    `<meta property="og:image:alt" content="${GAME_PAGE.shareAlt}">` +
    `<meta name="twitter:card" content="summary_large_image">`;
  // One link to the public pages, in the language of the game, among the buttons of « Pour
  // les parents » and as tall as they are (`.about`, src/ui/homePages.css).
  // Once the Android test is open, the parents also find its page here (« bouton partout »).
  const test = (lang: 'fr' | 'en') => {
    const page = pages.find((p) => p.key === 'test' && p.lang === lang);
    return page
      ? `<a class="about" data-copy-raw href="${page.path}" lang="${lang}">${labels[lang].test}</a>`
      : '';
  };
  const links = `<a class="about" data-copy-raw href="/fr/" lang="fr">À propos du jeu</a><a class="about" data-copy-raw href="/en/" lang="en">About the game</a>${test('fr')}${test('en')}`;
  // The page of the game must hold the buttons of the parents screen: a template that
  // changed would otherwise lose the link without a word.
  const anchor = /(<nav class="parent-actions"[\s\S]*?)(<\/nav>)/;
  if (!anchor.test(html) || !html.includes('</head>'))
    throw new Error('The game page has no parents screen to hold the link to the public pages');
  // Payments belong to the static public pages. Never ship a payment link into the game.
  return html
    .replace('</head>', meta + adSenseVerificationMeta() + '</head>')
    .replace(anchor, (_, start, end) => start + links + end);
}
