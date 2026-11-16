import { SITE_ORIGIN } from '../src/site.ts';
import { DISCOVERY_PAGES, type DiscoveryPage } from './discoveryCopy.ts';

/** Deliberately inactive until the parent supplies and approves a payment destination. */
export const SUPPORT_URL: string | null = null;
export type DiscoveryAssets = {
  css: string;
  icon: string;
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
    privacy: 'Confidentialité',
    support: 'Soutenir le jeu',
    external:
      'Pour les adultes : soutien ponctuel sur un site de paiement externe, sans avantage dans le jeu. Aucun paiement sur ce site.',
    skip: 'Aller au contenu',
    alt: 'Un héros et un serpent en pâte à modeler, près du cristal',
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
    privacy: 'Privacy policy',
    support: 'Support the game',
    external:
      'For adults: a one-off contribution on an external payment website, with no in-game advantage. No payment on this website.',
    skip: 'Skip to content',
    alt: 'A clay hero and snake beside the crystal',
    title: 'Snake Attack TD',
    family: 'Imagined by a child, shared with the family.',
    back: 'Back to the game',
  },
} as const;

function supportLink(language: 'fr' | 'en', value: string | null) {
  const url = resolveSupportUrl(value);
  return url
    ? `<a data-support href="${escape(url)}" target="_blank" rel="noopener noreferrer nofollow">${labels[language].support}</a>`
    : '';
}

export function discoveryPageHtml(
  page: DiscoveryPage,
  assets: DiscoveryAssets,
  supportUrl = SUPPORT_URL,
): string {
  const words = labels[page.lang];
  const equivalent = DISCOVERY_PAGES.find((p) => p.key === page.key && p.lang !== page.lang)!;
  const french = DISCOVERY_PAGES.find((p) => p.key === page.key && p.lang === 'fr')!;
  const english = DISCOVERY_PAGES.find((p) => p.key === page.key && p.lang === 'en')!;
  const canonical = SITE_ORIGIN + page.path;
  const support = supportLink(page.lang, supportUrl);
  const navigation = DISCOVERY_PAGES.filter((p) => p.lang === page.lang)
    .map(
      (p) =>
        `<a href="${p.path}"${p.key === page.key ? ' aria-current="page"' : ''}>${words[p.key]}</a>`,
    )
    .join('');
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
<link rel="icon" type="image/png" href="${assets.icon}">
<link rel="stylesheet" href="${assets.css}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Snake Attack TD">
<meta property="og:title" content="${escape(page.title)}">
<meta property="og:description" content="${escape(page.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="${page.lang === 'fr' ? 'fr_FR' : 'en_US'}">
<meta property="og:locale:alternate" content="${page.lang === 'fr' ? 'en_US' : 'fr_FR'}">
<meta property="og:image" content="${SITE_ORIGIN}${assets.icon}">
<meta property="og:image:width" content="512">
<meta property="og:image:height" content="512">
<meta property="og:image:alt" content="${escape(words.alt)}">
<meta name="twitter:card" content="summary">
<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>
</head>
<body>
<a class="skip" href="#content">${words.skip}</a>
<header class="site-header"><a class="brand" href="/${page.lang}/"><img src="${assets.icon}" alt="" width="48" height="48">${words.title}</a><a class="language" lang="${equivalent.lang}" hreflang="${equivalent.lang}" href="${equivalent.path}">${equivalent.lang === 'en' ? 'English' : 'Français'}</a><a class="play small" href="/">${words.play}</a></header>
<nav class="site-nav" aria-label="${page.lang === 'fr' ? 'Découvrir le jeu' : 'Explore the game'}">${navigation}</nav>
<main id="content">
<section class="intro"><div><p class="eyebrow">${words.family}</p><h1>${escape(page.heading)}</h1><p class="lead">${escape(page.lead)}</p><a class="play" href="/">${words.play}<span aria-hidden="true"> →</span></a></div><img class="hero" src="${assets.hero}" width="512" height="512" alt="${escape(words.alt)}" fetchpriority="high"></section>
${cards}
<div class="stories">${page.blocks.map((b) => `<section class="story"><h2>${escape(b.heading)}</h2><p>${escape(b.text)}</p></section>`).join('\n')}</div>
${page.key === 'parents' && support ? `<section class="support-note"><h2>${words.support}</h2><p>${words.external}</p>${support}</section>` : ''}
</main>
<footer class="site-footer"><p>© zyclope · ${words.title}</p><nav aria-label="${page.lang === 'fr' ? 'Informations' : 'Information'}"><a href="/">${words.back}</a><a href="/confidentialite/">${words.privacy}</a>${support}</nav>${support ? `<small>${words.external}</small>` : ''}</footer>
</body>
</html>\n`;
}

export function discoverySitemap(): string {
  const root = `<url><loc>${SITE_ORIGIN}/</loc></url>`;
  const privacy = `<url><loc>${SITE_ORIGIN}/confidentialite/</loc></url>`;
  const pages = DISCOVERY_PAGES.map((page) => {
    const alternatives = DISCOVERY_PAGES.filter((p) => p.key === page.key)
      .map(
        (p) => `<xhtml:link rel="alternate" hreflang="${p.lang}" href="${SITE_ORIGIN}${p.path}"/>`,
      )
      .join('');
    return `<url><loc>${SITE_ORIGIN}${page.path}</loc>${alternatives}</url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${[root, ...pages, privacy].join('\n')}\n</urlset>\n`;
}

export function discoveryRobots(): string {
  return `User-agent: *\nAllow: /\nDisallow: /prototype-v4.html\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`;
}

/** Applied at build time on the website only. No storage, redirects or game rules. */
export function augmentGamePage(html: string, supportUrl = SUPPORT_URL): string {
  const meta = `<meta name="description" content="Jeu de défense gratuit : protège le cristal sur trois voies avec tes alliés."><link rel="canonical" href="${SITE_ORIGIN}/">`;
  const links =
    '<nav data-copy-raw aria-label="À propos / About"><a href="/fr/" lang="fr">Français</a> · <a href="/en/" lang="en">English</a></nav>';
  let result = html
    .replace('</head>', meta + '</head>')
    .replace(
      /(<footer class="home-footer">[\s\S]*?)(<\/footer>)/,
      (_, start, end) => start + links + end,
    );
  const support = supportLink('fr', supportUrl);
  if (support)
    result = result.replace(
      /(<details id="home-parent-options"[\s\S]*?)(<\/details>)/,
      (_, start, end) =>
        start + `<p data-copy-raw>${support}<br><small>${labels.fr.external}</small></p>` + end,
    );
  return result;
}
