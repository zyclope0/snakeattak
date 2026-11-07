# Affichage — v0.27.0

Les sept corrections du lot 1 sont réalisées. Les règles, les sauvegardes et les
codes de départ sont conservés. Le mandat reçu pendant ce lot autorise la suite
autonome, avec un conseil tous les deux lots, hors décisions critiques.

## Résultat

- Entrées classique, mission, reprise et code partagé : document remis en haut.
- Plateau et HUD entiers à 1280×800, 1366×768 et 1920×1080, y du canvas 117 px
  (81 px en mode agrandi). Informations secondaires dans le panneau des alliés.
- Préparation : lancement toujours visible ; texte long défile indépendamment.
- À 812×375 : cinq commandes du HUD ≥48×48 px, plateau 86 % de hauteur et
  71 % de largeur. Portrait tactile : consigne de rotation conservée.
- Victoires adaptées aux missions de 3/4 vagues et au classique de 12 vagues.
- Tiroir : Fermer et Fiches lisibles, commandes de mission accessibles.
- Quatre échecs de contraste reproduits puis corrigés à l’accueil.

## Vérification

`npm run verify` : format, 367 tests, typage, build et budgets verts.
`test:display` : 15 contrôles, aucune erreur JS ; revue indépendante complémentaire
des cadeaux, du tiroir et des commandes déplacées. Son écart important de commandes
masquées a été reproduit par un test rouge puis corrigé et vérifié.
`test:browser`, `test:departures`, `test:corrections` : verts ; anciennes sauvegardes
v1 à v6 chargées, redimensionnement, pause unique et chargement conservés.
Build exécuté après chacun des sept points. Synchronisation Android : 27 fichiers
identiques octet pour octet au dist. Aucun APK ni test physique à ce jalon.

Audit fourni révisé : 11/13 critères, zéro écart bloquant du lot 1. Les 117 mots
et le vouvoiement restant relèvent du lot 2 et ne sont pas masqués dans le rapport.
Axe-core 4.14.0 : zéro violation de contraste, une catégorie incomplète concernant
la légende sur image/dégradé et deux symboles d’étoiles. Cela ne certifie pas
l’accessibilité globale ni un test au lecteur d’écran.

Preuves : `reports/verification-0.27.json`, `reports/audit-2026-11-after-lot1.json` ;
captures et géométries régénérables par `npm run test:display`.

## Fichiers concernés

`index.html`, `src/main.ts`, `src/style.css`, `src/render/BattleScene.ts`,
`src/render/resultCopy.ts`, `src/ui/coaching.ts`, `src/ui/expeditions.ts`,
`tests/result-copy-027.test.ts`, scripts navigateur display/audit/corrections,
package et verrou, version Android, README, architecture, guide Android, plan,
spécification et rapports.

## À vérifier ensuite

Essais avec les enfants, mesures sur téléphone Android et lisibilité sans lecture.
Aucun changement de combat, nouvelle génération payante, achat, publicité ou
service distant ajouté. Le conseil suivant portera sur affichage + préparation
Android ; une préparation technique ne remplacera pas une mesure sur appareil.
