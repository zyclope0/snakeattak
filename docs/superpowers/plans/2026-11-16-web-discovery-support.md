# Web discovery and support implementation plan

> **For agentic workers:** use superpowers:executing-plans to implement task by task.

**Goal:** rendre le jeu découvrable en FR/EN et préparer un soutien volontaire masqué.
**Architecture:** pages statiques produites par Vite, jeu à la même adresse ; compilation
Android dans un dossier distinct sans contenu commercial Web.
**Tech Stack:** TypeScript, Vite, HTML/CSS statiques, tests Node et Playwright existants.
**Spec:** docs/superpowers/specs/2026-11-16-web-discovery-support-design.md

## Global constraints

- Aucune publicité, collecte, génération payante ni modification de politique approuvée.
- Soutien masqué sans URL ; liens externes HTTPS sans identifiant transmis.
- Règles, sauvegardes, anciens codes, version et compteur Android conservés.
- Publication exclusivement par « Publier le site ».

## Review focus

- Routes linguistiques réciproques et liens locaux valides depuis les sous-dossiers.
- Absence de destination de soutien : aucun bouton vide ni route de paiement accessible.
- Android et portable : aucun contenu Web ou lien de paiement embarqué.
- Petit écran et clavier : CTA accessibles sans recouvrement, portrait utilisable.
- Métadonnées factuelles ; aucune disponibilité Play publique, note ou prix inventés.

## Task1 — Pages et découverte

Files: deploy/discoveryCopy.ts, deploy/discovery.ts, deploy/discovery.css,
deploy/discoveryAssets.ts, tests/discovery.test.ts, vite.config.ts.
Produces: page definitions, generated pages, sitemap/robots, web-only game links/metadata.

- [x] Écrire et voir échouer les tests de pages, routes réciproques, sécurité/soutien masqué.
- [x] Générer10pages FR/EN, métadonnées, assets locaux et liens de découverte du jeu.
- [x] Vérifier les tests ciblés, build et liens ; commit de la fonctionnalité.

## Task2 — Distribution Android distincte

Files: package.json, capacitor.config.ts, scripts/android-debug.mjs,
scripts/check-dist.mjs, vite.config.ts, .gitignore, tests/discovery.test.ts.
Consumes: web-only augmentation from Task1. Produces: dist-android without it.

- [x] Tester la destination Capacitor et l'absence des contenus de découverte/soutien.
- [x] Ajouter build:android, connecter les commandes officielles à dist-android.
- [x] Compiler Android et contrôler les fichiers embarquables ; reconstruire le Web.
- [x] Commit après les contrôles ciblés.

## Task3 — Recette, documentation, livraison

Files: scripts/discovery-browser.mjs, docs/SITE.md, docs/ARCHITECTURE.md,
docs/PLAN-ACTUEL.md, docs/BILAN-WEB-2026-11-16.md.

- [x] Tester les pages réelles FR/EN à1280×800,780×360,375×812, sans JavaScript et au clavier.
- [x] Documenter sitemap, Google/Bing, soutien inactif et limites des accès disponibles.
- [x] npm run verify ; npm run test:browser ; contrôle Android ; relecture indépendante.
- [x] Pousser la branche et préparer la livraison par le workflow existant seulement.
