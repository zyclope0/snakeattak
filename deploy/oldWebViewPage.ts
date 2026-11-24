import * as FR from '../src/texts/fr/oldWebView.ts';
import * as EN from '../src/texts/en/oldWebView.ts';
import * as PAGE_FR from '../src/texts/fr/page.ts';
import * as PAGE_EN from '../src/texts/en/page.ts';

/**
 * The page Android shows instead of the game when the phone's WebView is too old
 * (deploy/androidWebView.ts). It is read by an engine the game's page is too new for: plain
 * HTML, its style written in, nothing to fetch and no script — Capacitor gives it none of its
 * own either. Its words come from the catalogue of texts (src/texts/<language>/oldWebView.ts),
 * French then English, as on the public privacy page.
 */

type Words = Record<keyof typeof FR, string>;

const text = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** One language. French opens the page with its only `h1`; English follows one level down. */
function half(words: Words, language: 'fr' | 'en'): string {
  const [title, heading] = language === 'fr' ? ['h1', 'h2'] : ['h2', 'h3'];
  const spoken = language === 'fr' ? '' : ` lang="${language}"`;
  return [
    `<section${spoken}>`,
    `<${title} class="title">${text(words.leJeuNePeutPasSOuvrir)}</${title}>`,
    `<p>${text(words.ceTelephoneABesoinDUneMiseAJour)}</p>`,
    `<${heading} class="parents">${text(words.pourLesParents)}</${heading}>`,
    `<p>${text(words.androidSystemWebViewEstTropAncien)}</p>`,
    `<p>${text(words.surUnTelephonePlusAncien)}</p>`,
    '</section>',
  ].join('\n');
}

// Only what an old engine reads: no `gap`, `clamp()` or logical properties. The two languages
// sit side by side on a phone held sideways, as the application is.
const STYLE = `
html { background: #f8f5eb; color: #21352f; font-family: sans-serif; line-height: 1.45; }
body { margin: 0; padding: 16px 24px; }
.name { margin: 0 0 4px; font-weight: bold; color: #173e37; }
main { display: flex; flex-wrap: wrap; margin: 0 -14px; }
section { flex: 1 1 260px; margin: 0 14px; }
h1, h2, h3 { line-height: 1.2; }
.title { margin: 8px 0; font-size: 24px; color: #173e37; }
.parents { margin: 14px 0 4px; font-size: 17px; }
p { margin: 4px 0 8px; font-size: 17px; }
`;

/** The whole page, written beside the game in the application's build only. */
export function oldWebViewPageHtml(): string {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#173e37">
<title>${text(FR.leJeuNePeutPasSOuvrir)} / ${text(EN.leJeuNePeutPasSOuvrir)}</title>
<style>${STYLE}</style>
</head>
<body>
<p class="name">${text(PAGE_FR.laConqueteDesSerpents)} · <span lang="en">${text(PAGE_EN.laConqueteDesSerpents)}</span></p>
<main>
${half(FR, 'fr')}
${half(EN, 'en')}
</main>
</body>
</html>
`;
}
