# Conseil — lots 8 et 9, préparation

Revue indépendante et cinq perspectives de conception. Ce ne sont pas des essais
d'enfants ni des validations Google Play.

| Regard       | Constat et suite                                                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture | Moteur/rendu/sauvegardes inchangés ; outils de publication séparés. Le backend futur ne vérifiera que les achats.                                 |
| Enfant 5–7   | La grâce initiale et l'absence de pub en défaite/réessai réduisent la pression. Ce sont des spécifications à démontrer avec le SDK réel.          |
| Joueur 8–12  | Progression gratuite et achats d'apparences cohérents ; aucun faux jeu traduit ou dix-huit missions annoncées.                                    |
| QA Android   | Captures de navigateur clairement identifiées ; APK physique, permissions, SDK et transactions réels restent à contrôler.                         |
| Parent/store | Confidentialité actuelle/future distinctes. Identité, prix, politiques et compte restent visibles ; aucune validation de publication automatique. |

La revue a demandé la correction des injections de métadonnées et des erreurs
masquées. Le problème de manifestes mal formés est traité dans la même passe :
rapport recalculé à chaque génération, erreurs visibles, lectures invalides
explicitement bloquées. Régressions RED→GREEN, 391 tests et build verts, aucune
exécution de script injecté dans Chromium.

Décision : livrer le dossier de préparation pour relecture. La version 0.30.1 du
jeu reste celle publiée ; compte Play, SDK/achats, icône finale et preuves de test
restent nécessaires pour une version commerciale. Pas de nouveau test d'équilibrage
inventé : aucune règle de jeu modifiée dans cette étape.
