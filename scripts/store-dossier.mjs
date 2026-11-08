import { readFile, writeFile } from 'node:fs/promises';
import { format, resolveConfig } from 'prettier';
import { safeAssetPath } from '../deploy/playReadiness.ts';
const root = 'docs/publication';
const json = async (name) => JSON.parse(await readFile(`${root}/${name}`, 'utf8'));
const config = await json('configuration.json'),
  copies = await json('fiches.json'),
  captures = await json('captures.json');
const report = JSON.parse(await readFile('reports/store-preparation.json', 'utf8'));
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const labels = { fr: 'Français', en: 'English', de: 'Deutsch', it: 'Italiano' };
const images = captures.assets
  .map((a) => {
    if (!safeAssetPath(a.file)) throw Error('Unsafe capture path');
    return `<figure><a href="${escape(a.file)}"><img src="${escape(a.file)}" alt="${escape(a.context === 'combat' ? 'Combat sur les trois voies' : 'Préparation du détachement')}" /></a><figcaption>${escape(a.file)} · ${a.width}×${a.height} · ${escape(a.kind)}</figcaption></figure>`;
  })
  .join('');
const descriptions = Object.entries(copies)
  .map(
    ([locale, c]) =>
      `<details ${locale === 'fr' ? 'open' : ''}><summary>${labels[locale]} — brouillon à relire</summary><h3>${escape(c.title)}</h3><p><strong>${escape(c.shortDescription)}</strong></p><pre>${escape(c.fullDescription)}</pre></details>`,
  )
  .join('');
const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dossier Google Play — La Conquête des Serpents</title><link rel="stylesheet" href="publication.css"></head><body>
<header><small>DOSSIER DE PRÉPARATION · ${escape(config.app.version)}</small><h1>La Conquête des Serpents</h1><p>Google Play : modèle familial et éléments de la fiche.</p></header>
<main><section><span class="status">${report.blockers.length} points à finaliser avant publication</span><p>Le jeu actuel reste sans publicité ni achat intégré. Les décisions ci-dessous cadrent la prochaine version. Ce dossier n'est pas une version commerciale publiée.</p><nav class="links"><a href="MONETISATION.md">Monétisation</a><a href="CONFIDENTIALITE.md">Confidentialité</a><a href="PLAY-CONSOLE.md">Étapes Play Console</a><a href="configuration.json">Checklist</a></nav></section>
<section><h2>Le modèle validé</h2><ul><li>Jeu gratuit, missions accessibles par la progression normale.</li><li>Au plus une pub entre missions par dix minutes, après au moins deux missions terminées.</li><li>Achats : retirer les pubs et apparences sans avantage au combat.</li><li>Tarifs, produits précis et accès parents à valider avant intégration.</li></ul><p class="muted">Implémentation proposée : première période de grâce de dix minutes actives ; pas de pub en échec, en réessai ou dans le classique. La publicité non personnalisée peut encore traiter des données.</p></section>
<section><h2>Captures du jeu actuel</h2><p>Captures de navigateur sur le build de production, avec un camp initial légal et des commandes normales. À comparer à l'APK avant usage public. Les fiches locales ne traduisent pas encore le jeu.</p><div class="gallery">${images}</div><p class="muted">Version ${escape(captures.appVersion)} · SHA du build et des images dans <a href="captures.json">captures.json</a>. Pas de résultat Android physique déduit de ces images.</p></section>
<section><h2>Ton icône fournie est conservée</h2><img class="icon" src="../resources-2026-11/assets/icone-source.png" alt="Icône HD fournie avec héros, serpent et cristal"><p>Source 2048×2048. Les coins blancs arrondis restent à corriger avant l'export carré 512×512. Ce fichier est une référence, pas l'icône finale du store.</p></section>
<section><h2>Textes des fiches</h2><p>Quatre brouillons pour relecture humaine. La langue actuelle de l'application est annoncée dans chaque fiche.</p>${descriptions}</section>
<section><h2>Prochaines décisions et vérifications</h2><ul>${report.blockers.map((i) => `<li>${escape(i.message)}</li>`).join('')}</ul><p>La décision finale appartient au parent et à la Play Console. Le contrôle local n'autorise aucune publication automatique.</p></section></main></body></html>`;
await writeFile(
  `${root}/index.html`,
  await format(html, { ...(await resolveConfig(`${root}/index.html`)), parser: 'html' }),
);
console.log(`Dossier: ${root}/index.html, ${captures.assets.length} images`);
