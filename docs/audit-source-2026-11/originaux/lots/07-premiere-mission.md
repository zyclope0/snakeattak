# Lot 7 — Première mission, signaux et mode Facile (v0.30.0, ≈ 10 h, à valider d'abord avec l'enfant)

Ces trois points changent des règles : proposer les valeurs, attendre la validation avant de coder.
Maquette cible du jeu : `../maquettes/jeu-812x375.png`.

## Constats et références

| Constat                                                                                      | Référence                                                                                                          |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Mission 1 : 3 voies, 3 antres et tous les panneaux d'emblée ; gagnée 3 étoiles sans décision | PvZ niveau 1-1 : 1 voie, 1 plante ; Kingdom Rush : 2e chemin au niveau 3                                           |
| Le briefing de vague passe par des phrases                                                   | Kingdom Rush : icônes des ennemis à l'entrée, appel anticipé contre de l'or                                        |
| Deux joueurs de 6–7 et 8–10 ans                                                              | Bloons TD 6 Easy : plus de vies, coûts −15 %, ennemis plus lents ; Minecraft : difficulté changeable à tout moment |

## Tâches

1. Mission 1 sur une seule voie : une seule antre active (les deux autres fermées par un rocher dessiné),
   un seul type d'allié proposé en plus du héros et des massues. Les 3 voies arrivent à la mission 2.
2. À la sortie de chaque antre, une icône montre le prochain serpent de la vague. La toucher pendant
   la préparation lance la vague plus tôt et donne un bonus de pièces proportionnel au temps gagné.
3. Mode Facile, changeable dans le menu pause : cristal plus solide, alliés moins chers, serpents un peu
   plus lents (plusieurs leviers combinés). Mémorisé par profil de joueur ; Normal par défaut.
4. Dans l'écran de jeu en paysage téléphone, viser la maquette : 4 alliés toujours visibles à droite
   (au lieu du tiroir qui couvre la zone de pose), 2 miels en icônes, gros bouton « Lancer », cercles de pose.

## Critères

- `npm run balance:lab` : écart de taux de victoire Facile/Normal sur les missions 1 à 6, dans le bilan.
- Même code de départ = même partie ; anciennes sauvegardes chargées en Normal.
- Script d'audit sans nouvel écart ; critères communs du README.
