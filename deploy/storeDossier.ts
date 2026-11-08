import { safeAssetPath } from './playReadiness.ts';
const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const record = (v: unknown): Record<string, unknown> => (object(v) ? v : {});
const escape = (value: unknown) => {
  const text =
    typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
      ? String(value)
      : 'à compléter';
  return text.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
};
const issues = (v: unknown) =>
  Array.isArray(v)
    ? v.map((i) => ({
        code: typeof record(i).code === 'string' ? String(record(i).code) : 'invalid',
        message:
          typeof record(i).message === 'string'
            ? String(record(i).message)
            : 'Détail de contrôle invalide.',
      }))
    : [];
export function renderStoreDossier(
  inputConfig: unknown,
  inputCopies: unknown,
  inputCaptures: unknown,
  inputReport: unknown,
): string {
  const config = record(inputConfig),
    copies = record(inputCopies),
    captures = record(inputCaptures),
    report = record(inputReport);
  const errors = issues(report.errors),
    blockers = issues(report.blockers);
  if (
    !Array.isArray(report.errors) ||
    !Array.isArray(report.blockers) ||
    typeof report.state !== 'string' ||
    !['blocked', 'manual-review-required'].includes(report.state)
  )
    errors.push({ code: 'report.invalid', message: 'Rapport de préflight invalide.' });
  const raw = Array.isArray(captures.assets) ? captures.assets : [];
  let invalid = Array.isArray(captures.assets) ? 0 : 1;
  const images = raw
    .map((item) => {
      const a = record(item);
      if (
        !safeAssetPath(a.file) ||
        typeof a.width !== 'number' ||
        typeof a.height !== 'number' ||
        !Number.isInteger(a.width) ||
        !Number.isInteger(a.height) ||
        a.width <= 0 ||
        a.height <= 0 ||
        a.width > 3840 ||
        a.height > 3840 ||
        typeof a.kind !== 'string' ||
        !['phone', 'tablet', 'feature', 'icon'].includes(a.kind)
      ) {
        invalid++;
        return '';
      }
      return `<figure><a href="${escape(a.file)}"><img src="${escape(a.file)}" alt="${escape(a.context === 'combat' ? 'Combat de La Conquête des Serpents' : 'Préparation du détachement')}"></a><figcaption>${escape(a.file)} · ${escape(a.width)}×${escape(a.height)} · ${escape(a.kind)}</figcaption></figure>`;
    })
    .join('');
  if (invalid)
    errors.push({
      code: 'capture.invalid',
      message: 'Métadonnées de capture invalides : images refusées.',
    });
  if (report.state === 'blocked' && !errors.length && !blockers.length)
    errors.push({
      code: 'report.state',
      message: 'Rapport bloqué sans motif : relancer le contrôle.',
    });
  const blocked = errors.length > 0 || blockers.length > 0 || report.state === 'blocked';
  const labels = { fr: 'Français', en: 'English', de: 'Deutsch', it: 'Italiano' };
  const descriptions = Object.entries(labels)
    .map(([locale, label]) => {
      const c = record(copies[locale]);
      return `<details ${locale === 'fr' ? 'open' : ''}><summary>${escape(label)} — brouillon à relire</summary><h3>${escape(c.title)}</h3><p><strong>${escape(c.shortDescription)}</strong></p><pre>${escape(c.fullDescription)}</pre></details>`;
    })
    .join('');
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dossier Google Play — La Conquête des Serpents</title><link rel="stylesheet" href="publication.css"></head><body>
<header><small>DOSSIER DE PRÉPARATION · ${escape(record(config.app).version)}</small><h1>La Conquête des Serpents</h1><p>Google Play : modèle familial et éléments de la fiche.</p></header>
<main><section><span class="status">${blocked ? 'Préparation bloquée' : 'Relecture manuelle requise'}</span><p>${errors.length} erreur${errors.length === 1 ? '' : 's'} technique${errors.length === 1 ? '' : 's'} · ${blockers.length} point${blockers.length === 1 ? '' : 's'} à compléter. État : ${escape(blocked ? 'blocked' : 'manual-review-required')}.</p><p>Le jeu actuel reste sans publicité ni achat intégré. Les décisions ci-dessous cadrent la prochaine version. Ce dossier n'est pas une version commerciale publiée.</p><nav class="links"><a href="MONETISATION.md">Monétisation</a><a href="CONFIDENTIALITE.md">Confidentialité</a><a href="PLAY-CONSOLE.md">Étapes Play Console</a><a href="configuration.json">Checklist</a></nav></section>
<section><h2>Contrôles techniques recalculés</h2>${errors.length ? `<ul>${errors.map((i) => `<li><code>${escape(i.code)}</code> : ${escape(i.message)}</li>`).join('')}</ul>` : '<p>0 erreur technique détectée dans les données et images actuelles.</p>'}<p>Ces contrôles locaux ne certifient pas le compte, les SDK ou les achats réels.</p></section><section><h2>Le modèle validé</h2><ul><li>Jeu gratuit, missions accessibles par la progression normale.</li><li>Au plus une pub entre missions par dix minutes, après au moins deux missions terminées.</li><li>Achats : retirer les pubs et apparences sans avantage au combat.</li><li>Tarifs, produits précis et accès parents à valider avant intégration.</li></ul><p class="muted">Implémentation proposée : première période de grâce de dix minutes actives ; pas de pub en échec, en réessai ou dans le classique. La publicité non personnalisée peut encore traiter des données.</p></section>
<section><h2>Captures du jeu actuel</h2><p>Captures de navigateur sur le build de production, avec un camp initial légal et des commandes normales. À comparer à l'APK avant usage public. Les fiches locales ne traduisent pas encore le jeu.</p><div class="gallery">${images}</div><p class="muted">Version ${escape(captures.appVersion)} · SHA du build et des images dans <a href="captures.json">captures.json</a>. Pas de résultat Android physique déduit de ces images.</p></section>
<section><h2>Ton icône fournie est conservée</h2><img class="icon" src="../resources-2026-11/assets/icone-source.png" alt="Icône HD fournie avec héros, serpent et cristal"><p>Source 2048×2048. Les coins blancs arrondis restent à corriger avant l'export carré 512×512. Ce fichier est une référence, pas l'icône finale du store.</p></section>
<section><h2>Textes des fiches</h2><p>Quatre brouillons pour relecture humaine. La langue actuelle de l'application est annoncée dans chaque fiche.</p>${descriptions}</section>
<section><h2>Prochaines décisions et vérifications</h2><ul>${blockers.map((i) => `<li>${escape(i.message)}</li>`).join('')}</ul><p>La décision finale appartient au parent et à la Play Console. Le contrôle local n'autorise aucune publication automatique.</p></section></main></body></html>`;
  return html;
}
