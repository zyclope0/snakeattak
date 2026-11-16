# Web PayPal Support Implementation Plan

> **For agentic workers:** use superpowers:executing-plans to implement this plan task by task.

**Goal:** activer le soutien Web discret et la section de confidentialité FR/EN approuvés.
**Architecture:** liens HTML statiques dans les pages publiques, jamais de paiement intégré ; source unique de confidentialité partagée avec l’app.
**Tech Stack:** TypeScript, Vite, HTML/CSS, Node tests et Playwright existants.
**Spec:** docs/publication/SOUTIEN-WEB-PAYPAL-PROPOSITION.md (approuvée le16novembre2026).

## Global Constraints

- Destination exacte : https://www.paypal.com/ncp/payment/XXQ7BEAZQ3QZL ; montant libre en CHF, ponctuel.
- Aucun paiement réel, SDK, iframe, préchargement externe, changement de règle, de sauvegarde ou de compteur Android.
- Texte de confidentialité ajouté strictement selon le document approuvé, FR/EN ; engagements précédents préservés.
- Android et portable sans lien de paiement ; aucune ligne ajoutée au panneau parents du jeu.
- Publication uniquement par « Publier le site », après vérifications et CI verte.

## Review Focus

- La politique originale doit rester identique hors section approuvée et date.
- Le véritable lien PayPal et les mentions doivent être vérifiés sur les fichiers construits.
- Aucun appel PayPal avant clic, aucun débordement horizontal ou lien inaccessible sur mobile.
- Un clic doit ouvrir exactement le lien approuvé, sans profil, graine ni paramètre personnel ajouté.
- Aucun lien de paiement dans les fichiers réellement embarquables Android/portable.

## Task1 — Confidentialité approuvée

Files: src/i18n/privacyPolicy.ts, tests/privacy-policy.test.ts, tests/fixtures/soutien-web-approuve-2026-11-16.json.
Interface: PRIVACY_POLICY garde sa forme ; nouvelle section avant contact, datée du16novembre2026.

- [x] Ajouter le test de texte exact et les attentes de date/structure/liens ; exécuter et constater l’échec.
- [x] Ajouter les paragraphes approuvés, garder tous les anciens engagements ; exécuter les tests ciblés.

## Task2 — Soutien statique

Files: deploy/discovery.ts, scripts/check-discovery.mjs, scripts/discovery-browser.mjs, tests/discovery.test.ts.
Interface: discoveryPageHtml utilise la destination approuvée ; null désactive toujours le soutien ; augmentGamePage reste sans paiement.

- [x] Tester destination, mentions FR/EN, désactivation explicite, sécurité et parents du jeu intacts ; constater l’échec.
- [x] Activer la destination et les libellés ; retirer l’injection dormant dans le panneau du jeu.
- [x] Vérifier les10pages aux3tailles, ouverture interceptée du lien au clavier, aucune requête externe avant clic.
- [x] Vérifier les fichiers construits Android et portable sans URL de paiement.

## Task3 — Livraison

Files: docs/SITE.md, docs/PLAN-ACTUEL.md, docs/BILAN-SOUTIEN-WEB-2026-11-16.md.

- [x] npm run verify ; npm run test:browser ; npm run test:discovery ; npm run build:android ; build portable contrôlé par CI.
- [x] Revue indépendante de la branche et corrections des deux détails mineurs ; livraison par commit/push et PR.
- [ ] Après CI verte : fusion, workflow officiel, contrôle exact des pages publiques et confidentialité.
- [ ] Compte rendu avec preuves et limites : aucun reçu ni frais réel vérifiés, pas de nouvel APK/AAB.
