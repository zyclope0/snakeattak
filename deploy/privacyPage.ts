import { PRIVACY_POLICY } from '../src/i18n/privacyPolicy.ts';
import type { PolicyPart, PolicyText } from '../src/i18n/privacyPolicy.ts';
import { PUBLIC_PRIVACY_URL } from '../src/site.ts';

/**
 * The public page of the privacy policy: plain HTML, readable without JavaScript, in French
 * then in English, as it was first published. Its words come from the same source as the
 * window of the application (src/i18n/privacyPolicy.ts); only the date of the last change
 * and the address of the page are added to what was published.
 */

const text = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attribute = (value: string) => text(value).replace(/"/g, '&quot;');

function run(part: PolicyPart): string {
  if (typeof part === 'string') return text(part);
  if ('b' in part) return `<strong>${text(part.b)}</strong>`;
  return `<a href="${attribute(part.href)}">${text(part.a)}</a>`;
}
const paragraph = (parts: PolicyPart[]) => `      <p>${parts.map(run).join('')}</p>`;

/**
 * One language of the policy. French opens the page with the only `h1`; English follows one
 * level down, as on the page that was approved.
 */
function article(language: 'fr' | 'en', policy: PolicyText): string {
  const [title, heading] = language === 'fr' ? ['h1', 'h2'] : ['h2', 'h3'];
  const spoken = language === 'fr' ? '' : ` lang="${language}"`;
  return [
    `    <article id="${language}"${spoken} aria-labelledby="${language}-title">`,
    `      <${title} id="${language}-title">${text(policy.title)}</${title}>`,
    paragraph(policy.scope),
    `      <p class="updated">${text(policy.updated)}</p>`,
    ...policy.sections.flatMap((section) => [
      `      <${heading}>${text(section.heading)}</${heading}>`,
      ...section.paragraphs.map(paragraph),
    ]),
    '    </article>',
  ].join('\n');
}

const STYLE = `
    :root {
      color-scheme: light;
      font-family: system-ui, sans-serif;
      line-height: 1.65;
      color: #21352f;
      background: #f8f5eb;
    }
    body { margin: 0; }
    header { background: #173e37; color: #fffaf0; }
    nav, main {
      max-width: 72ch;
      margin-inline: auto;
      padding-inline: clamp(1.25rem, 5vw, 2.5rem);
    }
    nav {
      display: flex;
      flex-wrap: wrap;
      column-gap: 1.5rem;
      padding-block: 0.75rem;
    }
    nav a { color: inherit; }
    nav a:first-child { margin-inline-end: auto; }
    main { padding-block: 2.5rem 4rem; overflow-wrap: anywhere; }
    article + article {
      border-top: 1px solid #c9cfbd;
      margin-top: 3rem;
      padding-top: 2.5rem;
    }
    h1, h2, h3 { line-height: 1.25; margin: 1.75em 0 0.45em; }
    article > :first-child {
      font-size: clamp(1.65rem, 5vw, 2.5rem);
      margin: 0;
    }
    p { margin: 0.6em 0 1em; }
    a { color: #12604e; text-underline-offset: 0.15em; }
    a:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
  `;

/** The whole page, ready to be written at `confidentialite/index.html`. */
export function privacyPageHtml(): string {
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#173e37">
  <title>Politique de confidentialité / Privacy Policy — Snake Attack TD</title>
  <link rel="canonical" href="${attribute(PUBLIC_PRIVACY_URL)}/">
  <style>${STYLE}</style>
</head>
<body>
  <header>
    <nav aria-label="Navigation">
      <a href="/">Retour au jeu / <span lang="en">Back to the game</span></a>
      <a href="#fr">Français</a>
      <a href="#en" lang="en">English</a>
    </nav>
  </header>
  <main>
${article('fr', PRIVACY_POLICY.fr)}

${article('en', PRIVACY_POLICY.en)}
  </main>
</body>
</html>
`;
}
