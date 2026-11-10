# Conseil — plateau et lisibilité

8 novembre 2026. Deux revues indépendantes de code/interface et cinq points de vue
de conception. Les points de vue d’âge sont des hypothèses, pas des tests d’enfants.

| Regard                       | Constat et arbitrage                                                                                                                                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Développeur du moteur        | Géométrie, combat, RNG et formats persistants préservés. Les anciens messages restent dans les données ; childCopy adapte seulement leur affichage. Les 180 instantanés historiques du moteur restent identiques. |
| Développeur interface/mobile | Jouer et lancement visibles, trois cartes courtes, tous les outils accessibles. Reprise directe et avertissement hors parents ; retour carte remet le focus au bon endroit.                                       |
| Enfant débutant6–7 ans       | Un objectif et une grosse action.57 mots DOM visibles avant la première vague à 1280×800, contre 94 dans la mesure équivalente précédente. Cela reste à tester avec un enfant qui lit peu.                        |
| Joueur8–10 ans               | Miel, encouragement, réparation, entraînement et favoris restent accessibles ; aucun outil retiré selon le niveau. Les raccords en terre se distinguent des voies principales.                                    |
| Parent/QA                    | La reprise ne doit jamais ressembler à un nouveau départ. Test après achat :300 pièces et 4 alliés conservés. Anciennes sauvegardes, import/export et départs partagés font partie de la recette.                 |

## Réserves levées

Les revues ont demandé une reprise toujours accessible, un avertissement visible
avant remplacement, un focus correct au retour carte et plusieurs corrections
de français. Corrections réalisées et relues. La première preuve de reprise à
450 pièces était trop faible : elle est remplacée par un achat avant reprise.

Les tests de rendu et de plateau sont verts ; l’ancien scénario qui posait un
allié en portrait a été corrigé pour vérifier la consigne de rotation, puis
poser librement en paysage. Le compteur d’audit tient compte des clips de
défilement et exclut les textes sr-only ; il mesure le DOM, pas les mots du canvas.

## Décision

Livrer la version d’interface testable après recette finale et publication.
L’introduction progressive des pouvoirs par mission n’est pas implémentée :
ce choix pédagogique rejoint le point à discuter avec le fils.
Le prochain changement de règles (lot 7 : ouverture des voies) attend les valeurs
validées par le parent et l’enfant. Monétisation et validation Android réelle
restent distinctes. Aucune nouvelle dépense d’assets.
