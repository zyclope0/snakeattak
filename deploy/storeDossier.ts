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
<header><small>DOSSIER DE PRÉPARATION · ${escape(record(config.app).version)}</small><h1>La Conquête des Serpents</h1><p>Google Play : jeu gratuit, sans publicité ni achat dans l'application.</p></header>
<main><section><span class="status">${blocked ? 'Préparation bloquée' : 'Relecture manuelle requise'}</span><p>${errors.length} erreur${errors.length === 1 ? '' : 's'} technique${errors.length === 1 ? '' : 's'} · ${blockers.length} point${blockers.length === 1 ? '' : 's'} à compléter. État : ${escape(blocked ? 'blocked' : 'manual-review-required')}.</p><p>Ce dossier prépare la fiche Play. Il ne publie rien et n'envoie rien à Google.</p><nav class="links"><a href="README.md">Lire d'abord</a><a href="PLAY-CONSOLE.md">Étapes Play Console</a><a href="SECURITE-DES-DONNEES-V2.md">Sécurité des données</a><a href="CONFIDENTIALITE.md">Confidentialité</a><a href="configuration.json">Checklist</a></nav></section>
<section><h2>Contrôles techniques recalculés</h2>${errors.length ? `<ul>${errors.map((i) => `<li><code>${escape(i.code)}</code> : ${escape(i.message)}</li>`).join('')}</ul>` : '<p>0 erreur technique détectée dans les données et images actuelles.</p>'}<p>Ces contrôles locaux lisent le dépôt. Ils ne certifient ni le compte, ni le manifeste fusionné, ni le trafic réseau du build envoyé.</p></section><section><h2>Le modèle décidé</h2><ul><li>Jeu gratuit, sans publicité ni achat dans l'application (décision du parent, 17 et 18 novembre 2026).</li><li>Pas de compte de joueur, pas de serveur, pas d'outil de mesure.</li><li>Le jeu se joue en français et en anglais ; les noms des défis restent en français.</li><li>La seule publicité est celle du site Web, sur grand écran, et elle se coupe : elle ne concerne pas l'application.</li></ul><p class="muted">L'ancien modèle (publicité entre missions, achats) est abandonné : <a href="MONETISATION.md">document historique</a>.</p></section>
<section><h2>Captures</h2><p>Captures de navigateur sur un build de production, avec un camp initial légal et des commandes normales. À comparer à l'APK avant usage public.</p>${captures.appVersion !== record(config.app).version ? `<p><strong>Ces captures viennent de la version ${escape(captures.appVersion)}, pas de la version ${escape(record(config.app).version)} : elles sont à refaire.</strong></p>` : ''}<div class="gallery">${images}</div><p class="muted">Version ${escape(captures.appVersion)} · SHA du build et des images dans <a href="captures.json">captures.json</a>. Pas de résultat Android physique déduit de ces images.</p></section>
<section><h2>L'icône</h2><img class="icon" src="../resources-2026-11/assets/icone-source.png" alt="Icône HD fournie avec héros, serpent et cristal"><p>Source 2048×2048. Un export carré 512×512 sans coins blancs existe (<code>resources/android-icon/icon-512.png</code>) ; il n'est pas encore dans le manifeste des captures.</p></section>
<section><h2>Textes des fiches</h2><p>Quatre brouillons pour relecture humaine. Chaque fiche dit que le jeu est en français et en anglais.</p>${descriptions}</section>
<section><h2>Prochaines décisions et vérifications</h2><ul>${blockers.map((i) => `<li>${escape(i.message)}</li>`).join('')}</ul><p>La décision finale appartient au parent et à la Play Console. Le contrôle local n'autorise aucune publication automatique.</p></section></main></body></html>`;
  return html;
}
