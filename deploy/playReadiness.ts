/**
 * Publication tooling only: never imported by the game or its simulation.
 *
 * Checks the Google Play preparation folder (`docs/publication/`) against the model the parent
 * decided on 17 and 18 November 2026: the Android application is free, with no advertising and
 * no purchase (the only advertising is the website's, on large screens, and it can be turned
 * off). A green check never authorizes a publication: `automaticPublicationAuthorized` is
 * always false, and every human step (identity, forms, review, device test) stays a blocker
 * until the parent ticks it.
 */
import type { Language } from '../src/i18n/language.ts';
import { POLICY_APP } from '../src/i18n/privacyPolicy.ts';
import { PUBLIC_PRIVACY_URL } from '../src/site.ts';

export type Issue = { code: string; message: string };
export type CaptureFile = {
  file: string;
  width: number;
  height: number;
  bytes: number;
  sha256: string;
  format?: 'png' | 'jpeg' | null;
  channels?: number;
  bitDepth?: number;
};
export type CaptureAsset = CaptureFile & {
  kind: 'phone' | 'tablet' | 'feature' | 'icon';
  context?: string;
};
export type RuntimeEvidence = {
  adsSdkInstalled: boolean;
  billingSdkInstalled: boolean;
  analyticsSdkInstalled: boolean;
  /** Read from the source manifest only: the merged manifest of the exact AAB is a human check. */
  internetPermission: boolean;
  /** Native Capacitor modules found in package.json and the generated Gradle files. */
  nativePlugins: string[];
};
export type PlayEvidence = {
  appVersion: string;
  manifest: unknown;
  buildHtmlSha256?: string;
  files: CaptureFile[];
  runtime: RuntimeEvidence;
};

/** The only model decided by the parent (17–18 November 2026). */
export const PLAY_MODEL_KIND = 'free_no_ads_no_purchases';
/** Schema of `docs/publication/configuration.json`. */
export const PLAY_CONFIGURATION_SCHEMA = 2;
/** The languages the game itself is played in (`src/i18n/`). */
export const GAME_LANGUAGES = ['fr', 'en'] as const satisfies readonly Language[];
// Fails to compile if a language is added to the game and not to the listings.
type MissingLanguage = Exclude<Language, (typeof GAME_LANGUAGES)[number]>;
const everyLanguageListed: [MissingLanguage] extends [never] ? true : never = true;
void everyLanguageListed;

/** Google Play listing limits, in characters. */
export const PLAY_LIMITS = { title: 30, shortDescription: 80, fullDescription: 4000 } as const;

/**
 * The exact sentence each listing carries about the languages of the game. It must say both
 * languages: a listing that announces the game in one language only is an error.
 */
export const GAME_LANGUAGE_DISCLOSURES: Readonly<Record<string, string>> = {
  fr: 'Le jeu est disponible en français et en anglais.',
  en: 'The game is available in French and English.',
  de: 'Das Spiel ist auf Französisch und Englisch verfügbar.',
  it: 'Il gioco è disponibile in francese e in inglese.',
};
const COPY_STATUSES = ['draft-not-reviewed', 'reviewed'];
/** Paid cosmetics belonged to the abandoned model: no listing may announce them. */
const ABANDONED_OFFER = /cosm[eé]ti|kosmeti/i;

const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const sameSet = (a: unknown, b: readonly string[]) =>
  Array.isArray(a) &&
  a.length === b.length &&
  a.every((v) => typeof v === 'string') &&
  [...a].sort().join('\n') === [...b].sort().join('\n');

export function safeAssetPath(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[a-z0-9][a-z0-9._/-]*$/.test(value) &&
    !value.split('/').some((p) => p === '..' || p === '.' || p === '')
  );
}

export function validatePlayPreparation(config: unknown, copies: unknown, evidence: PlayEvidence) {
  const errors: Issue[] = [],
    blockers: Issue[] = [];
  const error = (code: string, message: string) => errors.push({ code, message });
  const need = (ok: unknown, code: string, message: string) => {
    if (ok !== true) blockers.push({ code, message });
  };
  const result = () => ({
    errors,
    blockers,
    state:
      errors.length || blockers.length ? ('blocked' as const) : ('manual-review-required' as const),
    automaticPublicationAuthorized: false as const,
  });

  // The runtime is checked first: an ads, billing or analytics SDK is an error whatever the
  // configuration says.
  if (evidence.runtime.adsSdkInstalled)
    error('runtime.ads', 'Un SDK publicitaire est présent : l’application doit rester sans pub.');
  if (evidence.runtime.billingSdkInstalled)
    error(
      'runtime.billing',
      'Un SDK de facturation est présent : l’application doit rester sans achat.',
    );
  if (evidence.runtime.analyticsSdkInstalled)
    error(
      'runtime.analytics',
      'Un SDK de mesure ou de suivi est présent : l’application ne collecte rien.',
    );

  if (
    !object(config) ||
    config.schemaVersion !== PLAY_CONFIGURATION_SCHEMA ||
    !['app', 'publisher', 'model', 'implementation', 'legal', 'review'].every((k) =>
      object(config[k]),
    )
  ) {
    error('configuration.schema', 'Configuration de préparation absente ou invalide.');
    return result();
  }
  const app = config.app as Record<string, unknown>,
    publisher = config.publisher as Record<string, unknown>,
    model = config.model as Record<string, unknown>,
    implementation = config.implementation as Record<string, unknown>,
    legal = config.legal as Record<string, unknown>,
    review = config.review as Record<string, unknown>;

  if (app.version !== evidence.appVersion)
    error('app.version', 'La configuration doit viser la version réelle du jeu (package.json).');
  if (!sameSet(app.gameLanguages, GAME_LANGUAGES))
    error(
      'app.languages',
      'Les langues annoncées doivent être celles du jeu : français et anglais.',
    );

  if (model.kind !== PLAY_MODEL_KIND)
    error(
      'model.kind',
      'Seul modèle décidé : gratuit, sans publicité ni achat dans l’application.',
    );
  if (!Array.isArray(model.purchases) || model.purchases.length || model.subscriptions !== false)
    error('model.purchases', 'Le modèle ne prévoit aucun achat ni abonnement dans l’application.');
  if (model.inAppAds !== false)
    error('model.ads', 'Le modèle ne prévoit aucune publicité dans l’application.');
  if (
    model.paidCombatAdvantages !== false ||
    model.paidRandomItems !== false ||
    model.accounts !== false
  )
    error('model.gameplay', 'Ni avantage payant, ni tirage payant, ni compte de joueur.');

  if (!sameSet(implementation.nativePlugins, evidence.runtime.nativePlugins))
    error(
      'runtime.plugins',
      `Modules natifs réels : ${evidence.runtime.nativePlugins.join(', ') || 'aucun'}. Mettre à jour le dossier et Sécurité des données.`,
    );
  if (implementation.internetPermissionInSourceManifest !== evidence.runtime.internetPermission)
    error(
      'runtime.internet',
      'La configuration ne décrit pas la permission INTERNET du manifeste source.',
    );

  if (legal.privacyPublishedUrl !== PUBLIC_PRIVACY_URL)
    error('privacy.url', `L’URL de confidentialité publiée est ${PUBLIC_PRIVACY_URL}.`);
  if (POLICY_APP.version !== evidence.appVersion)
    error('privacy.version', 'La politique de l’application ne nomme pas cette version.');

  need(
    text(publisher.name) &&
      text(publisher.email) &&
      publisher.accountVerified === true &&
      typeof publisher.accountType === 'string' &&
      ['personal', 'organization'].includes(publisher.accountType),
    'publisher',
    'Nom de développeur, adresse de contact publique et type de compte Play à confirmer par le parent.',
  );
  need(
    app.packageIdApproved === true && text(app.packageId),
    'package-id',
    'Identifiant de l’application à confirmer.',
  );
  need(
    legal.privacyOnlineMatchesBuild,
    'privacy',
    'Vérifier en ligne que la page de confidentialité nomme la version envoyée et dit la même chose que l’application.',
  );
  for (const [flag, code, message] of [
    [
      'dataSafetyCompleted',
      'data-safety',
      'Sécurité des données : à remplir par le parent dans la Console, après relevé du manifeste fusionné et du trafic du build exact.',
    ],
    ['audienceApproved', 'audience', 'Public cible (tranches d’âge) à choisir par le parent.'],
    [
      'iarcCompleted',
      'iarc',
      'Questionnaire IARC à remplir dans la Console ; aucun classement présumé.',
    ],
    ['localizedCopiesReviewed', 'copies', 'Fiches FR, EN, DE et IT à relire par un humain.'],
  ] as const)
    need(legal[flag], code, message);
  for (const [flag, code, message] of [
    [
      'assetsApproved',
      'asset-review',
      'Captures, bannière et icône à relire face au build envoyé.',
    ],
    [
      'mergedManifestAndTrafficReviewed',
      'merged-manifest',
      'Manifeste fusionné (permissions) et trafic réseau du build exact à relever.',
    ],
    ['physicalAndroidPassed', 'android-device', 'Essai du build exact sur un téléphone physique.'],
    ['signedAabVerified', 'aab', 'AAB signé du build exact à vérifier.'],
    [
      'closedTestCompleted',
      'closed-test',
      'Test fermé à mener jusqu’au bout (testeurs et durée exigés par Google) avant la production.',
    ],
  ] as const)
    need(review[flag], code, message);

  if (!object(copies)) error('copies.schema', 'Fiches de publication invalides.');
  else
    for (const [locale, disclosure] of Object.entries(GAME_LANGUAGE_DISCLOSURES)) {
      const c = copies[locale];
      if (!object(c)) {
        error(`copy.${locale}.schema`, 'Fiche manquante.');
        continue;
      }
      for (const [field, code] of [
        ['title', 'title'],
        ['shortDescription', 'short'],
        ['fullDescription', 'full'],
      ] as const) {
        const max = PLAY_LIMITS[field];
        if (!text(c[field]) || [...String(c[field])].length > max)
          error(`copy.${locale}.${code}`, `Limite ${max} caractères ou texte vide.`);
      }
      if (
        c.gameLanguageDisclosure !== disclosure ||
        typeof c.fullDescription !== 'string' ||
        !c.fullDescription.includes(disclosure)
      )
        error(
          `copy.${locale}.language`,
          `La fiche doit dire exactement : « ${disclosure} » (le jeu est en français et en anglais).`,
        );
      if (
        [c.title, c.shortDescription, c.fullDescription].some((v) =>
          ABANDONED_OFFER.test(String(v)),
        )
      )
        error(`copy.${locale}.model`, 'Les apparences payantes appartiennent au modèle abandonné.');
      if (typeof c.status !== 'string' || !COPY_STATUSES.includes(c.status))
        error(`copy.${locale}.status`, 'Statut de fiche inconnu.');
      else if (legal.localizedCopiesReviewed === true && c.status !== 'reviewed')
        error(`copy.${locale}.status`, 'Fiche encore en brouillon : la relecture n’est pas faite.');
    }

  if (!evidence.manifest) {
    need(false, 'assets', 'Captures du build et manifeste à produire.');
    need(false, 'icon', 'Icône 512×512 à ajouter au manifeste des captures.');
    return result();
  }
  if (!object(evidence.manifest)) {
    error('assets.schema', 'Manifeste de captures invalide.');
    return result();
  }
  const stale = evidence.manifest.appVersion !== evidence.appVersion;
  if (stale)
    need(
      false,
      'assets.stale',
      `Captures de la version ${String(evidence.manifest.appVersion)}, jeu en ${evidence.appVersion} : à refaire (npm run build puis npm run store:captures).`,
    );
  else if (!evidence.buildHtmlSha256)
    need(
      false,
      'assets.build-missing',
      'Build de production absent (dist/) : captures non comparées au build.',
    );
  else if (evidence.manifest.buildHtmlSha256 !== evidence.buildHtmlSha256)
    error('assets.build', 'Captures et HTML de production divergent.');
  const assets = evidence.manifest.assets;
  if (!Array.isArray(assets) || assets.length > 20) {
    error('assets.schema', 'Manifeste de captures invalide.');
    return result();
  }
  const validAssets: CaptureAsset[] = [];
  for (const a of assets) {
    if (!object(a) || !safeAssetPath(a.file)) {
      error('asset.path', 'Chemin de capture invalide.');
      continue;
    }
    if (
      typeof a.width !== 'number' ||
      typeof a.height !== 'number' ||
      typeof a.bytes !== 'number' ||
      typeof a.sha256 !== 'string' ||
      typeof a.kind !== 'string' ||
      !['phone', 'tablet', 'feature', 'icon'].includes(a.kind)
    ) {
      error('asset.metadata', 'Métadonnées de capture invalides.');
      continue;
    }
    const asset = a as CaptureAsset;
    validAssets.push(asset);
    const actual = evidence.files.find((f) => f.file === a.file);
    if (!actual) {
      error('asset.missing', `Fichier absent : ${a.file}`);
      continue;
    }
    if (
      (actual.format !== 'jpeg' && actual.format !== 'png') ||
      actual.bitDepth !== 8 ||
      actual.channels !== (a.kind === 'icon' ? 4 : 3) ||
      (a.kind === 'icon' && actual.format !== 'png')
    )
      error('asset.format', 'Format de couleur/image incompatible avec les spécifications du kit.');
    if (actual.sha256 !== a.sha256 || actual.bytes !== a.bytes)
      error('asset.hash', `Empreinte/taille divergente : ${a.file}`);
    if (
      actual.width !== a.width ||
      actual.height !== a.height ||
      !Number.isInteger(actual.width) ||
      !Number.isInteger(actual.height) ||
      actual.width <= 0 ||
      actual.height <= 0 ||
      actual.bytes > 8 * 1024 * 1024 ||
      Math.max(actual.width, actual.height) > 3840
    ) {
      error('asset.dimensions', `Dimensions/taille invalides : ${a.file}`);
      continue;
    }
    if (a.kind === 'feature' && (a.width !== 1024 || a.height !== 500))
      error('asset.feature', 'Bannière attendue : 1024×500.');
    if (
      a.kind === 'phone' &&
      (a.width < 1920 || a.height < 1080 || Math.abs(a.width / a.height - 16 / 9) > 0.001)
    )
      error('asset.phone', 'Choix qualité du kit : captures paysage au moins 1920×1080 en 16:9.');
    if (
      a.kind === 'tablet' &&
      (Math.min(a.width, a.height) < 320 ||
        Math.max(a.width, a.height) > 2 * Math.min(a.width, a.height))
    )
      error('asset.tablet', 'Dimensions tablette hors limites.');
    if (a.kind === 'icon' && (a.width !== 512 || a.height !== 512 || a.bytes > 1024 * 1024))
      error('asset.icon', 'Icône attendue : PNG 512×512, moins de 1 Mo.');
  }
  // Stale captures count for nothing: `assets.stale` already says they are to be redone.
  if (!stale) {
    need(
      new Set(
        validAssets
          .filter((a) => a.kind === 'phone' && a.context === 'combat')
          .map((a) => a.sha256),
      ).size >= 3,
      'assets.phone',
      'Trois captures de combat distinctes requises par le kit.',
    );
    need(
      new Set(validAssets.filter((a) => a.kind === 'tablet').map((a) => a.sha256)).size >= 2,
      'assets.tablet',
      'Deux vues tablette à préparer.',
    );
    need(
      validAssets.some((a) => a.kind === 'feature'),
      'assets.feature',
      'Bannière à préparer.',
    );
  }
  need(
    validAssets.some((a) => a.kind === 'icon'),
    'icon',
    'Icône 512×512 à ajouter au manifeste des captures (export prêt : resources/android-icon/icon-512.png).',
  );
  return result();
}
