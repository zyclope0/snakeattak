# AdSense Site Verification Implementation Plan

> **For agentic workers:** use superpowers:executing-plans inline, followed by a fresh review.

**Goal:** publier la liaison AdSense du site, sans diffusion publicitaire.
**Architecture:** sérialisation de l’ID public dans deploy/, injection Vite uniquement pour le Web ; fichiers Android et portable exclus.
**Tech Stack:** TypeScript, Vite, Node tests, Playwright et workflow existants.
**Spec:** docs/superpowers/specs/2026-11-16-adsense-verification-design.md.

## Global Constraints

- ID exact fourni : pub-8498417364292905 ; meta ca-pub-8498417364292905.
- Aucun script Google, requête publicitaire, slot, cookie, changement de CSP ou de politique approuvée.
- Moteur, rendu, interface, sauvegardes, anciens codes et version Android préservés.
- Publication seulement par « Publier le site » après CI verte ; aucune action sur le compte AdSense.

## Review Focus

- Bon propriétaire : exactement le même ID dans meta et ads.txt.
- Pas de réseau : la vérification est passive, sans adsbygoogle.js.
- Aucun fichier ni meta AdSense dans Android ou portable.
- Budget HTML32KiB conservé, même sur la page du jeu.
- Confidentialité actuellement sans publicité reste exacte ; l’approbation et la diffusion ne sont pas prétendues.

## Task1 — Liaison passive

Files: deploy/adsenseVerification.ts, deploy/discovery.ts, vite.config.ts, tests/discovery.test.ts, tests/adsense-verification.test.ts, scripts/check-discovery.mjs.
Interface: adSenseVerificationMeta() renvoie une meta de compte ; adSenseAdsTxt() renvoie la seule ligne autorisée avec saut de ligne final.

- [x] Tests : meta exacte dans la vraie augmentation du jeu, corps intact et aucun chargement publicitaire ; ads.txt exact. Observer RED.
- [x] Implémenter les deux sérialisations, injection Web et génération ads.txt ; vérifier GREEN.
- [x] Contrôler fichiers réels Web/Android et exclusion du portable ; build et budget sans modifier de seuil.

## Task2 — Livraison et instructions

Files: docs/SITE.md, docs/PLAN-ACTUEL.md, docs/BILAN-ADSENSE-LIAISON-2026-11-16.md.

- [x] npm run verify, npm run test:browser, npm run build:android ; export portable contrôlé aussi.
- [ ] Revue indépendante, correction éventuelle, commit/push/PR et cinq jobs CI verts.
- [ ] Fusion, publication officielle, comparaison publique de la meta et ads.txt, version.json du bon SHA.
- [ ] Expliquer au parent comment ajouter le site et demander son examen ; publicité toujours inactive.
