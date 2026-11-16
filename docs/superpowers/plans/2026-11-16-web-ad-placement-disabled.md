# Disabled Web Ad Placement Implementation Plan

> **For agentic workers:** use superpowers:executing-plans inline and a fresh final review.

**Goal:** préparer et éprouver l’emplacement approuvé, sans diffusion ni présence dans le site public.
**Architecture:** calcul pur, adaptateur DOM/CSS de maquette locale, callback générique de bornes Phaser ; compilation ads-preview séparée.
**Tech Stack:** TypeScript, Vite, Node tests, Playwright existants, aucune dépendance ajoutée.
**Spec:** docs/superpowers/specs/2026-11-16-web-ad-placement-disabled-design.md (consensus autorisé par le parent).

## Global Constraints

- Aucun script Google, réseau publicitaire, iframe, stockage, réglage de compte ou contenu de confidentialité modifié.
- Contrat seul : ca-pub-8498417364292905 /7092707633, traitement enfant1, pleine largeurfalse.
- Production/Android/portable sans aperçu, slot, CSS ou réservation de place ; aucun interrupteur URL ou stockage.
- Conserver règles, sauvegardes, anciens codes, version et budgets. Publication uniquement par workflow officiel.

## Review Focus

- Ne pas dériver depuis des coordonnées déjà déplacées ; restaurer le centrage après rotation.
- Ne pas rafraîchir Phaser depuis une taille nulle ; vérifier les coordonnées recrutées, pas seulement les pièces.
- Dialogues dynamiques, zoom et agrandissement révoquent l’éligibilité avant toute intégration future.
- MutationObserver limité aux états pertinents et nettoyage, sans boucle à chaque image du moteur.
- Les sorties réellement construites restent désactivées ; aucune entrée cachée ne peut les activer.

## Task1 — Modèle et contrat

Files: src/ui/webAds/layout.ts, src/ui/webAds/contract.ts, tests/web-ad-layout.test.ts.
Interface: planAdPlacement(measurement: AdMeasurement): AdPlacement|null, rectGap(a,b):number ; contrat immuable sans chargeur.

- [x] Tests RED : fixtures1280/1600/1920×800/900/1080/2560/S24, distances≥150, dimensions constantes, limites et entrées invalides.
- [x] Implémenter l’algorithme pur et le contrat exact ; GREEN ciblé.

## Task2 — Adaptateur local et redimensionnement

Files: src/ui/webAds/preview.ts, preview.css, src/i18n/webAdPreview.ts, src/render/boardResize.ts, src/bootstrap.ts, vite.config.ts, package.json, .gitignore, .prettierignore.
Interfaces: bindWebAdPreview({onBoardMoved:()=>void}):()=>void ; bindBoardResize retourne un invalidateur regroupé et conserve sa gestion destroy.

- [x] Brancher uniquement en mode ads-preview, sortie dédiée ; aucun chargeur publicitaire.
- [x] Mesurer sans le décalage courant, appliquer un offset réversible et rafraîchir les bornes.
- [x] Observer resize/états utiles, dialogues dynamiques et langue ; nettoyage et états bloquants.
- [x] Ajouter la recette navigateur de transitions et vérifier RED puis GREEN sur l’ancienne maquette statique / nouveau vrai adaptateur.

## Task3 — Sorties et livraison

Files: scripts/web-ad-preview-browser.mjs, scripts/check-web-ad-disabled.mjs, .github/workflows/check.yml, docs/SITE.md, docs/ARCHITECTURE.md, docs/PLAN-ACTUEL.md, docs/BILAN-ADSENSE-PREPARATION-2026-11-16.md.

- [x] Contrôler explicitement l’absence des modules/styles/slots dans les sorties normales ; valider le mode local et ses attributs préparés.
- [x] npm run verify ; npm run test:browser ; recette preview ; builds Android et portable.
- [x] Revue indépendante et corrections effectuées ; livraison push/PR, CI puis fusion et workflow officiel suivie dans le bilan et la PR.
- [x] Bilan honnête : aperçu préparé et diffusion inactive, limites et prochains verrous.
