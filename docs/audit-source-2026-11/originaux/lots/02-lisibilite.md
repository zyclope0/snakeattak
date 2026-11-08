# Lot 2 — Lisible sans savoir bien lire (v0.29.0, ≈ 8 h)

Objectif : un enfant de 6–7 ans qui lit mal joue seul. Aucune règle de combat ne change :
seulement les textes et l'interface. Maquettes cibles : `../maquettes/accueil-812x375.png`,
`../maquettes/preparation-812x375.png`.

## Constats et références

| Constat                                                                                               | Référence                                                                                       |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 352 mots sur l'accueil ; 310 sur l'écran de combat (186 dans la fenêtre à 1280×800)                   | Plants vs. Zombies : 8 mots à l'écran au plus (George Fan, GDC 2012) ; Toca Boca : pas de texte |
| Tous les panneaux (miel, encourager, réparer, héros, favoris, équipes) dès la mission 1               | PvZ : nouveautés introduites très lentement, argent après 10 niveaux                            |
| Cinq noms pour les soldats (détachement, armée, équipe, camp, renforts) ; « tu » et « vous » mélangés | `src/waves.ts:36`, `src/missions.ts:28-68`, `src/render/presentation.ts:149`                    |
| Code de départ « REFUGE-1-FW90-720A-96 » en tête de la préparation                                    | capture préparation                                                                             |

## Tâches

1. Un seul nom visible pour les soldats du joueur : « alliés ». Tutoiement partout.
2. Accueil : un gros bouton « Jouer » qui ouvre la prochaine mission non terminée. Aventure classique,
   équipes, fiches et sauvegarde passent dans des boutons secondaires (voir maquette accueil).
3. Préparation : terrain, attaques et œufs en 3 cartes illustrées (icône + 3 mots au plus) ;
   bouton dé « Autre départ » ; « C'est parti ! » toujours visible ; code de départ dans un volet replié
   « Pour les parents » (voir maquette préparation).
4. Un système nouveau par mission d'expédition : mission 1 = recruter et lancer ; miel tactique à la 2,
   Encourager à la 3, Réparer à la 4, entraînement du héros à la 5. Avant, les panneaux sont masqués.
   L'aventure classique garde tout.
5. Textes proposés :

| Endroit                       | Aujourd'hui                                                                                   | Nouveau                                                                    |
| ----------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Bouton principal de l'accueil | Choisir une expédition                                                                        | Jouer                                                                      |
| Second mode                   | Nouvelle aventure classique                                                                   | La grande aventure                                                         |
| Lancement de mission          | Déployer ce détachement                                                                       | C'est parti !                                                              |
| Objectif mission 1            | Protégez le cristal pendant trois vagues.                                                     | Protège le cristal ! (3 icônes de vague)                                   |
| Conseil                       | Les arrivées sont régulières : répartissez les gardiens.                                      | Mets des alliés sur chaque chemin.                                         |
| Fin de mission                | Ton armée et ses pièges ont tenu les douze vagues.                                            | Bravo ! Le refuge est sauvé.                                               |
| Miel tactique                 | Attirer / Ralentir / Haut, Centre, Bas / 1 fois par vague · attaques plus rapides pendant 8 s | 2 grosses icônes (aimant, escargot), puis toucher le chemin sur le plateau |

## Critères

- Script d'audit : ≤ 60 mots visibles avant la 1re vague de la mission 1 à 1280×800 ; 0 vouvoiement visible.
- Captures avant/après de l'accueil et de la préparation à 812×375 et 1280×800.
- Critères communs du README.
