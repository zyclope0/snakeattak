# Bestiaire et lisibilité — version 0.14

Demandes approuvées : mutants et dinosaures alliés, ninja très rapide, cracheurs à impact unique, sonnette qui distrait, cobra royal infligeant exactement 2 PV au tueur, mamba noir exactement 3 PV au tueur, boss final à trois têtes. Le terrain doit laisser ressortir les personnages.

## Décisions

- Alliés : vélociraptor mobile, tricératops à charge, stégosaure résistant, tyrannosaure puissant ; mutant roc résistant et mutant élastique à allonge. Le petit dino et le bébé dragon restent alliés.
- Sonnette : hésitation de 0,8 s, rayon 112, recharge 5 s ; immunité de 4 s après le début d'une confusion, empêchant les chaînes infinies. Aucun tir ami ni dégât inventé. Timers figés en pause, exclus des camps sauvegardés.
- Décision après mesure : un seul spécialiste sonnette par vague à partir de la 4 ; deux exemplaires tardifs faisaient perdre la campagne répartie avec le ninja plus rapide. Correction ciblée, test rouge/vert puis 140/140 natifs.
- Décision après inspection : une reprise mutants sans ombres ; coût réel 832 crédits. Cadres mutants de 512×600 pour conserver les pieds, icônes inférieures inutilisées.
- Relecture indépendante : restriction injustifiée de sonnette avant x612 détectée et retirée, test pont rouge→vert ; 141 tests natifs passent. Protection passive du bouclier conservée pendant l'hésitation, décision documentée. Aucun autre point Critical/Important.
- Cobra et mamba : réaction une seule fois au passage vivant→mort, attribuée à l'auteur du coup fatal, y compris tir/zone ; dégâts fixes sans réduction d'armure. Boss distinct, statistiques de base conservées.
- Générer trois atlas de quatre cadres au maximum, budget prévu 654 crédits, contrôle visuel avant détourage et redimensionnement. Aucun service externe pendant le jeu.
- Lisibilité : sol jouable visuellement calme, routes courbes conservées, fin liseré de silhouette et repères d'armée de formes distinctes. Pas de filtre GPU coûteux par unité.

## Sources de lisibilité consultées

- Riot : https://www.leagueoflegends.com/en-us/news/dev/clarity-in-league/ — hiérarchie visuelle, peu de bruit, silhouettes et orientation.
- Valve : https://cdn.steamstatic.com/apps/valve/2007/NPAR07_IllustrativeRenderingInTeamFortress2.pdf — silhouettes distinctes, contraste avec l'environnement, détails regroupés.

## Exécution et propriété des fichiers

- [x] Moteur (principal) : `game.ts`, `enemies.ts`, `waves.ts`, `checkpoints.ts`, tests de combat réels. Rouge, puis vert : crédit du tueur, dégâts exacts, zones/deux coups, pause/confusion, poison sans durée, boss et intégrité des camps.
- [x] Catalogue et interface (travail indépendant) : `data.ts`, `unitRules.ts`, `defenders.ts`, `ui/`, textes d'aide, tests dédiés. Identifiants : raptor, triceratops, stegosaurus, trex, mutantRock, mutantStretch. Charge du tricératops intégrée par le principal dans Game.move.
- [x] Rendu (travail indépendant) : `render/actors.ts`, `terrain.ts`, `actorLayout.ts`, `characterMotion.ts`, tests visuels. Lit `Entity.confusedFor` (secondes), nouveaux Kind, nouvelles variantes rattlesnake/royal/mamba. Art câblé par le principal dans `art.ts`.
- [x] Art et documentation (principal) : génération contrôlée, alpha, atlas, provenance ; mise à jour GAME_DESIGN/architecture/version.
- [x] Intégration : tests natifs/types/build, navigateurs web et portable, présentation trois cartes/boss/confusion/nouvelles unités, restauration WebGL, mesure rendu sans jobs concurrents.
- [x] Équilibrage : 100 campagnes minimum, mêmes graines/politiques que précédemment ; aucune partie bloquée à 240 s. Mesurer et corriger les échecs réels avant livraison.
- [x] Relecture indépendante finale et correction.
- [x] Livraison ZIP jouable + sources + aperçu : emballage et vérification HTTPS, consignés dans le manifeste extérieur à l’archive.

## Risques à vérifier

1. Tir de zone / deux têtes : aucune réaction de mort doublée ni mauvais tueur.
2. Plusieurs sonnettes : aucune immobilisation permanente ni action pendant la pause.
3. Ancien camp : nouveaux timers nuls, santé/or et survivants conservés.
4. Carte sombre/claire, groupes compacts : contours alignés avec orientation et animation, boss avec trois têtes réellement visibles.
5. Nouveau roster : pas d'effondrement des gardes aux ponts ni de boucle A* sur une cellule bloquée ; campagnes et restauration GPU réelles.

Snapshot antérieur : `/workspace/conquete-serpents-baseline-0.13`. Pas de dépôt Git ; sauvegarde avant modification, sans inventer de commits. L'utilisateur a explicitement demandé l'exécution autonome ; aucun nouveau passage d'approbation.

Résultat : 141 tests passent ; navigateurs web/portable et treize scènes passent. 200 campagnes sans blocage, 83/100 et 70/100 victoires selon politiques (pas une comparaison isolée des recrues). Distance toujours favorisée. WebGL restauré avec terrain/fort/antres identiques. Mesure isolée 21 alliés : médiane33,3 ms, p95 50 ms. Relecture indépendante effectuée ; livraison HTTPS en cours de vérification.

Livraison confirmée : les trois fichiers HTTPS ont été retéléchargés sans authentification et comparés aux fichiers locaux. Manifeste et liens vérifiés dans /workspace/conquete-serpents-bestiaire-0.14-{manifest,liens}.json.
