# Lot A — comprendre les outils, v0.33.0

9 novembre 2026. Mandat autonome du parent, conseil après chaque lot.
Implémentation8528a6b, passe après conseil d11a090 ; baseline790b804.
Pas d'APK ou de déploiement intermédiaire : livraison regroupée après les lotsB/C.

## Réalisé et preuves

| Point du plan                                | État réel                                                                                                                                                        | Preuve                                                                                                                                               |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Expliquer les outils sans nouveau verrou     | Fait : aide volontaire Miel / Encourager / Réparer / Héros, un sujet à la fois ; Quand, Geste, Résultat et état réel                                             | [Miel](../captures-0.33.0/miel-780x360.png), [encouragement](../captures-0.33.0/encourager-780x360.png) ; src/ui/campToolModel.ts et campToolHelp.ts |
| Accès et plateau mobile                      | ? occupe la case du X hors placement ; mêmes quatre favoris, deux miels, catalogue et taille de dock                                                             | [Plateau](../captures-0.33.0/plateau-1280x800.png), [mesures](../../reports/night-0330/tools.json)                                                   |
| Entraînement annoncé exactement              | Mission selon unlockRank>=4, dès Les trois ponts ; classique après vague 4 ; héros tombé prioritaire dans le statut, aucune action impossible autorisée          | src/ui/adventureControls.ts, campToolModel.ts ; tests/camp-tool-help-033.test.ts                                                                     |
| Conseil au bon moment                        | Réparation et entraînement proposés seulement en préparation, après les priorités de placement/danger/contact/miel existantes                                    | tests/camp-tool-coaching-033.test.ts                                                                                                                 |
| Coûts et gestes plus lisibles                | Badge Gratuit/80/90 ; chemin Tous les alliés → Actions du camp ; réparation sans effacer le minimum déjà subi pour les étoiles                                   | [Réparation](../captures-0.33.0/reparer-780x360.png), [héros](../captures-0.33.0/heros-780x360.png)                                                  |
| Pause, Échap et rotation                     | L'aide garde la sélection et ne relance pas une pause indépendante. Échap ne ferme plus le catalogue derrière. Passage portrait ferme l'aide pour révéler Tourne | [Portrait](../captures-0.33.0/rotation-375x812.png), [recette](../../reports/night-0330/tools.json)                                                  |
| Préserver les règles, anciens camps et codes | Aucun changement du moteur/session, des données, du RNG ou des formats ; modèles et contrôles seulement dans ui/                                                 | [Reçu](../../reports/night-0330/verification.json), diff790b804→d11a090                                                                              |

## Conseil six personas et correction

[Conseil complet](CONSEIL-0.33.0.md) : architecture, mobile/performance,
qualité/accessibilité ; cibles simulées6ans peu lecteur,9ans habitué,12ans tacticien.
Trois revues techniques sans blocage identifié ; réserves d'usage sur coût,
accès aux actions, héros mort et réparation/étoiles. Les quatre ajustements ont
été intégrés en une passe puis vérifiés. Ce ne sont ni des témoignages d'enfants
ni une validation du S24 réel.

Le cas héros entraîné puis mort a d'abord échoué sur le statut « Gardien », puis
passe sans modifier campaign.training ni ready. L'avertissement étoiles est limité
aux expéditions. Les modifications graphiques/textuelles simples sont vérifiées
sur les vrais écrans, sans tests copiant seulement leur balisage.

## Tests et mesures

| Contrôle                        | Résultat final                                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Baseline                        | 425 tests réussis                                                                                                  |
| npm run verify                  | **434/434**, types, format, build et budgets verts                                                                 |
| Tests ciblés modèle et coaching | **15/15**                                                                                                          |
| npm run test:browser            | Ordinateur et tactile verts, zéro erreur JavaScript                                                                |
| npm run test:audit              | **13/13**                                                                                                          |
| npm run test:camp-tools         | Quatre formats ; dialogues entiers, prix et boutons visibles, sélection/pauses préservées ; zéro erreur            |
| npm run test:child-mobile       | Six formats verts avant la passe finale de texte/image ; HUD/plateau inchangés, recette de livraison prévue aprèsB |
| Taille                          | HTML31 308/32 768 octets ; JSjeu189 024/200 000 ; CSS61 411. Budgets non relevés                                   |

Le plateau 1280×800 mesure 1065,98×600,81 px ;812×375 dans la recette mobile mesure
580,13×326,98 px, soit 71,4% de largeur et 87,2% de hauteur. La mesure 780×360 avec
marges simulées est534,36×301,17px ; ne pas prétendre que tous les formats/insets
atteignent le même pourcentage. En portrait, la consigne remplace l'accès au jeu.

Preuves figées dans [reports/night-0330](../../reports/night-0330/verification.json).
Les logs de cette version sont conservés avant les recettes des lots suivants.

## Fichiers et portée

- Modèle campToolModel.ts, composant campToolHelp.ts/CSS dédié ; branchements dans
  controls.ts, battleDock.ts, adventureControls.ts et coaching.ts.
- Garde Échap dans reinforcementsDrawer.ts ; index.html, versions package/lock et
  Android0.33.0/code40, aucun changement d'identité ou de permission.
- Tests dédiés et recette camp-tools-033-browser.mjs ; un ancien test de coaching
  précise que le héros est déjà entraîné pour vérifier le conseil de chapitre.
  Aucun instantané moteur historique réécrit.
- Ce bilan, conseil, plan, captures et rapports ; aucune dépendance ajoutée.

## Limites conservées

L'aide demande encore de lire : l'autonomie d'un enfant de 6 ans n'est pas prouvée.
Pas de démonstration vocale ou de geste animé produite. Aucun nouveau verrou par
mission, mode Facile, appel anticipé, niveau, unité, prix ou bonus ajouté.
Aucun service payant, image générée, SDK commercial ou formulaire Play exécuté.
La direction de l'icône guide le travail ; tous les sprites/décors existants ne
sont pas annoncés comme harmonisés. Le lotB poursuit l'accueil et la progression.
