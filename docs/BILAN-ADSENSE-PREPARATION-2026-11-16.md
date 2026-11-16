# Encart Web — préparation désactivée, 16 novembre 2026

Accord du parent : conseil, application du consensus et préparation de l'encart.
Cette livraison prépare l'emplacement ; elle n'active pas les annonces.

| Décision du conseil                                    | Résultat                                                                                                     | Preuve                                                                |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Un emplacement hors commandes, sans réduire le plateau | Calcul indépendant, marge de 150 px et formats bornés ; aucun emplacement sous 1920 px de large              | `src/ui/webAds/layout.ts`, `tests/web-ad-layout.test.ts`              |
| Préserver téléphone et application                     | Maquette exclue des sorties normales, Android et portable                                                    | `scripts/check-web-ad-disabled.mjs`, scripts de build                 |
| Préserver les clics après déplacement                  | Invalidation regroupée des bornes Phaser, puis recrutement vérifié à ses coordonnées réelles                 | `src/render/boardResize.ts`, `scripts/web-ad-preview-browser.mjs`     |
| Rester discret et réversible                           | Masquage pendant pause, dialogues, accueil, agrandissement, zoom et écran tactile ; restauration du centrage | `src/ui/webAds/preview.ts`                                            |
| Diffusion désactivée                                   | Pas de script Google, iframe, requête publicitaire ou bouton d'activation                                    | Contrôle des sorties HTML/JS/CSS et interception réseau de la recette |
| Ne pas modifier la confidentialité sans accord         | Politique et CSP inchangées                                                                                  | Diff Git                                                              |

Le conseil rassemble six perspectives simulées : architecture, QA, confidentialité,
parent, enfant de 6–8 ans et enfant de 9–12 ans. Il ne constitue pas une étude
utilisateur ni une certification de conformité.

## Vérification et livraison

- Tests ciblés : 12/12 verts (géométrie, contrat inerte et durée de vie du redimensionnement).
- Recette locale : 22 contrôles verts, aucun appel externe et aucune erreur JavaScript.
- `npm run test:browser` : ordinateur, téléphone tactile 812×375 et Voyage verts.
- Revue indépendante : deux défauts corrigés (callback après destruction et garde
  portable sans dossier assets), aucun défaut important restant.
- `npm run verify` : 789 tests verts, format et build Web verts.
- Builds Android et portable : verts, gardes confirmant absence de maquette et diffusion.
- La CI revérifie le commit livré ; les liens de livraison figurent dans la PR.
  Les preuves navigateur sont produites dans `artifacts/web-ad-preparation/` (ignorées
  par Git) : rapport JSON, captures FR/EN et téléphone. Le mode local s'ouvre avec
  `npm run build:ads-preview`, puis `npm run preview -- --outDir dist-ads-preview`.
  La sortie `dist-ads-preview/` ne doit jamais être déployée.

## Limites et suite

Aucune annonce réelle n'a été demandée. Le slot fourni `7092707633` et le signal
enfant sont seulement un contrat préparé et testé, sans intégration Google.
L'approbation du domaine, les paramètres de compte (dont l'optimisation automatique),
le consentement effectivement applicable et testé, puis les textes FR/EN approuvés
restent nécessaires avant toute activation. Les filtres ne permettent pas de
promettre uniquement des annonces éducatives. Le traitement enfant ne protège pas
à lui seul le DOM et le stockage contre un script tiers.

Aucun réglage AdSense, paiement ou formulaire fiscal traité. Aucun changement des
règles, sauvegardes, codes de départ, version ou valeurs des caprices. Aucun APK/AAB
signé produit dans ce lot ; les builds Android et portable servent à vérifier
l'exclusion de la préparation publicitaire.
