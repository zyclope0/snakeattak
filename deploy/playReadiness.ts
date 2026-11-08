/** Publication tooling only: never imported by the game or its simulation. */
export type Issue = { code: string; message: string };
export type CaptureFile = {
  file: string;
  width: number;
  height: number;
  bytes: number;
  sha256: string;
};
export type CaptureAsset = CaptureFile & {
  kind: 'phone' | 'tablet' | 'feature' | 'icon';
  context?: string;
};
export type PlayEvidence = {
  appVersion: string;
  manifest: { appVersion: string; assets: CaptureAsset[] } | null;
  files: CaptureFile[];
  runtime: { adsSdkInstalled: boolean; billingSdkInstalled: boolean; internetPermission: boolean };
};
const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const disclosures: Record<string, string> = {
  fr: 'Le jeu est actuellement disponible en français.',
  en: 'The game is currently available in French.',
  de: 'Das Spiel ist derzeit auf Französisch verfügbar.',
  it: 'Il gioco è attualmente disponibile in francese.',
};
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
  if (
    !object(config) ||
    config.schemaVersion !== 1 ||
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
    error('app.version', 'La configuration doit viser le build réellement vérifié.');
  if (
    model.kind !== 'free_ads_remove_ads_cosmetics' ||
    model.campaignFree !== true ||
    model.paidCombatAdvantages !== false ||
    model.paidRandomItems !== false
  )
    error(
      'model.gameplay',
      'Le contenu de jeu reste gratuit ; aucun avantage de combat ou objet aléatoire payant.',
    );
  if (
    !Array.isArray(model.purchases) ||
    model.purchases.length !== 2 ||
    !['remove_ads', 'cosmetics'].every((p) => (model.purchases as unknown[]).includes(p))
  )
    error('model.purchases', 'Seules la suppression des pubs et les apparences sont prévues.');
  if (
    model.adsPlacement !== 'intermission' ||
    model.maxAdsPerWindow !== 1 ||
    !Number.isFinite(model.windowSeconds) ||
    Number(model.windowSeconds) < 600 ||
    !Number.isInteger(model.missionsBetweenAds) ||
    Number(model.missionsBetweenAds) < 2 ||
    !Number.isFinite(model.firstAdGraceSeconds) ||
    Number(model.firstAdGraceSeconds) < 600 ||
    model.adsInCombat !== false ||
    model.adsOnDefeat !== false ||
    model.personalizedAds !== false ||
    !Number.isFinite(model.closeableAfterSeconds) ||
    Number(model.closeableAfterSeconds) < 0 ||
    Number(model.closeableAfterSeconds) > 5
  )
    error('model.ads', 'La cadence et le traitement enfant doivent respecter le contrat familial.');
  if (implementation.adsEnabled === true && !evidence.runtime.adsSdkInstalled)
    error('runtime.ads', 'Aucun SDK publicitaire identifié dans le runtime.');
  if (implementation.billingEnabled === true && !evidence.runtime.billingSdkInstalled)
    error('runtime.billing', 'Aucun SDK de facturation identifié dans le runtime.');
  if (
    (implementation.adsEnabled === true || legal.privacyForAdsReviewed === true) &&
    legal.privacyScope !== 'ads-sdk-reviewed'
  )
    error(
      'privacy.scope',
      'La confidentialité de l’APK sans pubs ne couvre pas le futur SDK publicitaire.',
    );
  need(
    text(publisher.name) &&
      text(publisher.email) &&
      publisher.accountVerified === true &&
      ['personal', 'organization'].includes(String(publisher.accountType)),
    'publisher',
    'Compte Play, identité publique et contact à préparer puis vérifier.',
  );
  need(
    app.packageIdApproved === true && text(app.packageId),
    'package-id',
    'Identifiant définitif à confirmer avant toute première publication.',
  );
  need(
    implementation.adsEnabled === true &&
      evidence.runtime.adsSdkInstalled &&
      implementation.familiesSdkVerified === true &&
      implementation.childTreatmentVerified === true &&
      implementation.permissionsAndTrafficReviewed === true &&
      text(implementation.adsProvider) &&
      text(implementation.adsSdkVersion),
    'sdk',
    'SDK/version Familles et configuration enfant, permissions et trafic à vérifier.',
  );
  need(
    implementation.billingEnabled === true &&
      evidence.runtime.billingSdkInstalled &&
      implementation.purchaseBackendVerified === true &&
      implementation.licenseTestsPassed === true &&
      implementation.restoreAndRefundTestsPassed === true &&
      text(implementation.billingProvider),
    'billing',
    'Vrais achats de test, vérification, restauration et remboursements à exercer.',
  );
  need(
    model.pricesApproved === true && model.parentAreaApproved === true,
    'purchase-design',
    'Tarifs et accès parental à valider.',
  );
  need(
    legal.privacyScope === 'ads-sdk-reviewed' &&
      legal.privacyForAdsReviewed === true &&
      typeof legal.privacyPublishedUrl === 'string' &&
      legal.privacyPublishedUrl.startsWith('https://'),
    'privacy',
    'Politique exacte du SDK choisi, identité et URL publique à finaliser.',
  );
  for (const [flag, code, message] of [
    [
      'dataSafetyReviewed',
      'data-safety',
      'Déclaration Sécurité des données à vérifier avec tous les SDK.',
    ],
    ['audienceApproved', 'audience', 'Tranches d’âge à confirmer.'],
    ['iarcCompleted', 'iarc', 'Questionnaire IARC à compléter, sans classement inventé.'],
    ['localizedCopiesReviewed', 'copies', 'Textes des fiches à relire humainement.'],
  ] as const)
    need(legal[flag], code, message);
  for (const [flag, code, message] of [
    ['assetsApproved', 'asset-review', 'Images et fidélité à l’APK à relire.'],
    ['physicalAndroidPassed', 'android-device', 'Retest Android physique et relevés à terminer.'],
    ['signedAabVerified', 'aab', 'AAB de test signé et contenu à vérifier.'],
    [
      'closedTestCompleted',
      'closed-test',
      'Test fermé requis par le compte puis accès à la production.',
    ],
  ] as const)
    need(review[flag], code, message);
  if (!object(copies)) error('copies.schema', 'Fiches de publication invalides.');
  else
    for (const [locale, disclosure] of Object.entries(disclosures)) {
      const c = copies[locale];
      if (!object(c)) {
        error(`copy.${locale}.schema`, 'Fiche manquante.');
        continue;
      }
      for (const [field, code, max] of [
        ['title', 'title', 30],
        ['shortDescription', 'short', 80],
        ['fullDescription', 'full', 4000],
      ] as const)
        if (!text(c[field]) || [...String(c[field])].length > max)
          error(`copy.${locale}.${code}`, `Limite ${max} caractères ou texte vide.`);
      if (
        c.gameLanguageDisclosure !== disclosure ||
        !String(c.fullDescription).includes(disclosure) ||
        JSON.stringify(app.gameLanguages) !== '["fr"]'
      )
        error(`copy.${locale}.language`, 'Ne pas annoncer une traduction du jeu qui n’existe pas.');
    }
  if (!evidence.manifest) {
    need(false, 'assets', 'Captures du build et manifeste à produire.');
    need(false, 'icon', 'Icône carrée finale à préparer.');
    return result();
  }
  if (evidence.manifest.appVersion !== evidence.appVersion)
    error('assets.version', 'Les captures doivent correspondre à la version du jeu.');
  const assets = evidence.manifest.assets;
  if (!Array.isArray(assets) || assets.length > 20) {
    error('assets.schema', 'Manifeste de captures invalide.');
    return result();
  }
  for (const a of assets) {
    if (!object(a) || !safeAssetPath(a.file)) {
      error('asset.path', 'Chemin de capture invalide.');
      continue;
    }
    const actual = evidence.files.find((f) => f.file === a.file);
    if (!actual) {
      error('asset.missing', `Fichier absent : ${a.file}`);
      continue;
    }
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
      error('asset.phone', 'Choix qualité du kit : captures paysage au moins 1920×1080 en16:9.');
    if (
      a.kind === 'tablet' &&
      (Math.min(a.width, a.height) < 320 ||
        Math.max(a.width, a.height) > 2 * Math.min(a.width, a.height))
    )
      error('asset.tablet', 'Dimensions tablette hors limites.');
    if (a.kind === 'icon' && (a.width !== 512 || a.height !== 512 || a.bytes > 1024 * 1024))
      error('asset.icon', 'Icône attendue : PNG512×512, moins de1Mo.');
  }
  need(
    new Set(assets.filter((a) => a.kind === 'phone' && a.context === 'combat').map((a) => a.sha256))
      .size >= 3,
    'assets.phone',
    'Trois captures de combat distinctes requises par le kit.',
  );
  need(
    assets.filter((a) => a.kind === 'tablet').length >= 2,
    'assets.tablet',
    'Deux vues tablette à préparer.',
  );
  need(
    assets.some((a) => a.kind === 'feature'),
    'assets.feature',
    'Bannière à préparer.',
  );
  need(
    assets.some((a) => a.kind === 'icon'),
    'icon',
    'Icône fournie à corriger et exporter en512×512.',
  );
  return result();
}
