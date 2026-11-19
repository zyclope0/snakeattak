# Android Release Implementation Plan

> **For agentic workers:** utiliser superpowers:executing-plans dans cette session, puis revue indépendante.

**Goal:** livrer Android 0.39.0 / 63 depuis main, sans contenu réservé au site.
**Architecture:** moteur inchangé, profils Vite explicites, manifeste de build et garde de synchronisation, packaging signé reproductible.
**Tech Stack:** TypeScript, Node24, Vite6, Capacitor8, Gradle, JDK21, bundletool fourni par AGP.
**Spec:** docs/superpowers/specs/2026-11-19-android-release-design.md.

## Global Constraints

Package com.conqueteserpents.famille ; 0.39.0 / 63 ; même clé privée hors Git.
Aucun changement de règle, sauvegarde, texte juridique, permission ou SDK.
Pas d'upload Google Play ni publication du site dans ce lot.

## Review Focus

- Une copie Web ou ancienne est refusée même si le nom de son dossier semble correct.
- L'activation future de la pub Web ne peut activer Android ni les modes locaux.
- Aucun secret de signature dans arguments de commande, logs, manifestes ou archives.
- Le contenu extrait du vrai package correspond exactement au build Android contrôlé.
- Une version construite et signée n'est pas une recette native ; signaler toute limite.

## Task 1 — Contrats et isolation

Files : deploy/buildTargets.ts, deploy/buildInfo.ts, vite.config.ts,
scripts/check-dist.mjs, scripts/check-android-distribution.mjs, tests/build-targets.test.ts.
Interfaces : buildTarget(mode, adsEnabled), buildInfo(profile, version, commit, dirty),
assertAndroidDistribution(root), assertSameFiles(expected, actual).

- [x] Tests RED sur profils, activation Web sans fuite Android, identité et empreintes divergentes.
- [x] Implémenter puis tests GREEN ; exclure prototype et fichiers Apache d'Android.
- [x] Vérifier build Android et site ; contrat intégré à la livraison.

## Task 2 — Packaging et recette

Files : scripts/android-package.mjs, scripts/android-package.init.gradle, scripts/VerifyAndroidBundle.java,
scripts/test-android-signatures.mjs,
scripts/check-android-sync.mjs, scripts/offline-033-browser.mjs, package.json, CI.

- [x] Ajouter garde après sync et recette hors ligne visant explicitement dist-android.
- [x] Commande android:package : verify/navigateur, sync, checks, release, signature,
      bundletool, APK universel du bundle, mapping, empreintes et rapport sans secrets.
- [x] Refuser sources sales et dossier de livraison préexistant ; contrôler APK/AAB extraits.
- [ ] Verify et recettes vertes ; revue indépendante et corrections ; commit.

## Task 3 — Livraison

Files : docs/ANDROID.md, ANDROID-BUILD-63.md, BILAN-0.39.0.md, PLAN-ACTUEL.md,
docs/ARCHITECTURE.md ; artifacts/android/ (non suivi).

- [ ] Construire et signer les livrables depuis un commit propre ; vérifier le certificat existant.
- [ ] Essayer le release natif si possible ; sinon kit de recette locale et réserve explicite.
- [ ] Documenter les preuves et les notes FR/EN ; push/PR, CI ; remise des téléchargements.
