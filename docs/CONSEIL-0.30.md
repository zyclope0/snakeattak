# Conseil — tutoriel et ressources, v0.30

Revue indépendante du 8 novembre 2026, complétée par les contrôles du développeur.
Ce sont cinq perspectives de conception, pas des essais réels d’enfants.

| Perspective             | Conclusion                                                                                                                                                                         |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Moteur et compatibilité | REFUGE-1 reste historique ; REFUGE-2 active le tutoriel. Camps v7/famille v3 préservent règles, budget et bandages. Anciennes versions conservées.                                 |
| Enfant 5–7 ans          | Trois voies restent visibles, menace centrale d’abord. Compréhension spontanée des symboles à confirmer en famille. Une explication visible a été ajoutée au miel pour le tactile. |
| Joueur 8–12 ans         | Deuxième voie déterminée par graine, puis troisième. Tous les alliés restent librement plaçables, les pouvoirs ne sont pas retirés selon la mission.                               |
| QA mobile               | Le bandeau est superposé : plateau 573×323 à 812×375. 60 mots DOM initiaux sur ordinateur. Pause unique et contrôles conservés.                                                    |
| Parent et équilibrage   | 648 parties appariées, aucun dépassement de délai ni menace hors masque. 108/108 victoires par stratégie et version ; aucune hausse automatique des statistiques ou du budget.     |

## Réserves et décision

Aucun défaut Critical/Important moteur relevé. La réserve sur l’explication
uniquement au survol a été traitée comme importante pour le téléphone : test
rouge sur l’explication visible, correction dans le panneau du miel, test vert.
Les trois noms des voies restent seuls dans le bandeau initial ; le plafond de
60 mots est conservé. Pas de seconde revue demandée : correction couverte par sa
régression et la suite complète.

Les simulations réduisent en moyenne durée et pertes, sans assurer une facilité
universelle : minimum novice 55 % de cristal contre 64 % avec l’ancien refuge.
La moyenne novice passe de 92,6 % à 93,8 %. Toutes les parties simulées gagnent déjà
avec les anciennes règles : aucune amélioration du taux de victoire n’est démontrée.
L’objectif ici est d’introduire progressivement les fronts, pas de mesurer le
plaisir des enfants ou l’équilibrage des six missions.

Publication favorable après recette technique. Essai familial et mesures sur
Android physique restent nécessaires. Monétisation, disponibilité progressive
des pouvoirs et nouvelles mécaniques des terrains ne sont pas implémentées.

## Ressources graphiques

Les trois créations existantes sont récupérées en PNG HD, avec empreintes et
maquettes dans docs/resources-2026-11/. Aucune génération lancée.
L’icône source comporte des coins blancs arrondis ; défaut hors du jeu courant,
à corriger avant export store au lot 9. Le marais reste à valider visuellement.
Aucun de ces PNG HD n’est chargé par le jeu ou embarqué dans l’APK actuel.
