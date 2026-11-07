# Bilan 0.19 — aventure, lisibilité et équilibre

1 024 campagnes automatisées, zéro erreur et zéro timeout. Le protocole a été écrit avant les résultats ; les paramètres n'ont pas été retouchés après validation.

## Avant et après, à politiques et graines appariées

La découverte compte 64 parties par moteur : 61/64 victoires avant et 59/64 après, aucune défaite précoce. La validation distincte compte 128 parties par moteur : 110/128 avant et 118/128 après. Écart apparié : +6,3 points [0,0 ; 12,5] (IC95 % par graines). Nouvelles défaites avant le boss : 0.

| Profil    | Victoires 0.18 | Victoires 0.19 | Défaites avant boss 0.19 |
| --------- | -------------: | -------------: | -----------------------: |
| casual    |          14/16 |          16/16 |                        0 |
| clustered |          16/16 |          16/16 |                        0 |
| dinosaurs |           9/16 |          11/16 |                        0 |
| heavy     |          11/16 |          14/16 |                        0 |
| melee     |          15/16 |          14/16 |                        0 |
| mixed     |          15/16 |          16/16 |                        0 |
| mutants   |          14/16 |          15/16 |                        0 |
| ranged    |          16/16 |          16/16 |                        0 |

## Décisions optionnelles sur 0.19

| Politique         | Victoires | Pertes avant boss | Héros entraînés réellement | Encouragements | Écart au contrôle, IC95 % |
| ----------------- | --------: | ----------------: | -------------------------: | -------------: | ------------------------- |
| baseline          |   118/128 |                 0 |                          0 |              0 | Référence                 |
| force             |   113/128 |                 2 |                        128 |              0 | -3,9 points [-9,4 ; 0,8]  |
| guard             |   115/128 |                 1 |                        128 |              0 | -2,3 points [-8,6 ; 3,9]  |
| encourage-8       |   117/128 |                 1 |                          0 |           1535 | -0,8 points [-6,3 ; 5,5]  |
| encourage-contact |   116/128 |                 3 |                          0 |           1531 | -1,6 points [-8,6 ; 5,5]  |
| force-contact     |   113/128 |                 1 |                        128 |           1533 | -3,9 points [-9,4 ; 2,3]  |

Le timing « contact » observe une vraie attaque alliée. Il n'attend pas huit secondes arbitraires et ne connaît aucun résultat futur. L'entraînement est acheté pour 90 pièces seulement si le héros est encore vivant ; aucune résurrection artificielle. Les bonus de chapitre sont choisis par la même politique adaptative dans tous les groupes.

| Moment d'encouragement | Nombre |    P10 | Médiane |     P90 |
| ---------------------- | -----: | -----: | ------: | ------: |
| encourage-8            |   1535 | 8.00 s |  8.00 s |  8.00 s |
| encourage-contact      |   1531 | 8.07 s | 10.43 s | 13.80 s |
| force-contact          |   1533 | 8.03 s | 10.40 s | 13.83 s |

## Lecture prudente

Huit profils de bots et seize graines de validation ne représentent pas tous les enfants ou styles de jeu. Les intervalles rééchantillonnent des graines entières, car les huit profils d'une même graine sont liés. Aucune différence modeste ne démontre un choix universellement meilleur. Les signes de combat et le conseil de timing rendent les décisions plus explicites ; les simulations ne prouvent pas le plaisir ni la compréhension.

Les effectifs, variantes et budgets de PV restent exactement ceux de 0.18. Les résultats peuvent changer car l'ordre des ennemis influence les survivants et la suite du combat. Les premiers apprentissages et le boss gardent leurs règles. Aucune difficulté cachée n'est appliquée pendant une partie.

## Reproduire et vérifier

Les quatre lots, les graines, les commandes, les échecs et les empreintes sont inclus dans reports/balance-0.19. PROTOCOLE-0.19.md décrit les seuils fixés avant résultat. Les sources de référence et candidates sont archivées avec les scripts exacts. Le dernier contrôle source est dans reports/verification-0.19.json.

La version ajoute neuf textes Phaser réutilisés et un relais HTML priorisé, sans nouveau RNG ni horloge de combat. Les tests incluent pause, arrêt des effets, redémarrage, effets voisins, motions réduites, menus, reprise et sauvegardes anciennes. Les appareils physiques et les essais des enfants restent à faire.

L'accès HTTPS est privé et la sauvegarde demeure locale à son origine ; le camp du ZIP ne migre pas automatiquement. Le statut natif du fournisseur atteste la publication. Le parcours authentifié et les en-têtes réellement appliqués ne sont pas couverts par les tests Chromium locaux.

## Réserves issues du conseil indépendant

Les cinq comparaisons de pouvoirs sont exploratoires ; tous leurs intervalles
recouvrent zéro. Le profil mêlée passe de 15 à 14 victoires sur 16 ; les dinosaures
restent à 11/16, les moins gagnants de ce lot. Les morts moyennes du contrôle
augmentent légèrement de 17,44 à 17,77 malgré ses victoires supplémentaires.
Une défaite précoce désigne précisément une défaite avant la vague 12. Les
1 024 campagnes ne sont pas 1 024 observations indépendantes : les profils
partagent leurs graines et les cinq politiques optionnelles partagent le contrôle.

## Contrôles finaux et réserve hors connexion

246 tests natifs et 13 contrôles de livraison passent, dont les deux distributions,
14 scénarios de présentation, 8 scénarios de signaux et la restauration WebGL.
La publication native de la 0.19 est confirmée ; l'audience reste privée.

Deux contrôles de rechargement de l'export file ont retrouvé l'ancien camp.
Deux diagnostics instrumentés puis le test standard non modifié passent ; la
cause reste non établie et l'échec antérieur est conservé. Aucun correctif de
production n'est présenté comme une résolution de ce cas. Privilégier l'accès
HTTPS ; les garanties de stockage d'un HTML local dépendent du navigateur.
