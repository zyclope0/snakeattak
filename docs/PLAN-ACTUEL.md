# Plan actuel — application 0.30.2

Suivi rectifié le 8 novembre 2026, après comparaison complète avec l'audit fourni.
Les décisions explicites du parent priment sur ses recommandations. Le gameplay
vient du fils et reste préservé. [Analyse et preuves](RECONCILIATION-AUDIT-0.30.2.md) ;
[sources originales archivées](audit-source-2026-11/README.md).

Les anciennes mentions « lots 2 et 7 livrés » résumaient trop largement des
livraisons partielles. Le changement de priorité ne supprime plus leurs
sous-parties restantes. Les bilans historiques sont conservés.

| Lot                           | État réel                                                                                                 | Prochaine condition                                                                                |
| ----------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1 — Affichage                 | Réalisé 0.27, complété par 0.30.1 ; audit actuel 13/13 sur sa portée                                      | Retours appareils réels ; ne pas confondre avec toute l'accessibilité                              |
| 4 — Android réel              | Partiel : APK et diagnostic ; interruptions 0.30.2 et fichiers embarqués testés en navigateur             | Relevés mission 6/classique 12, FPS/RAM et cycle de vie physiques                                  |
| 3 — Plateau                   | Réalisé 0.28 : raccords et halos ; nouveaux fonds non intégrés                                            | Préserver géométrie et lisibilité                                                                  |
| 2 — Lisibilité                | Partiel : Jouer, préparation courte, commandes secondaires ; 47 mots DOM initiaux dans la mesure actuelle | Vocabulaire/tutoiement, parcours miel, intention graphique des maquettes, apprentissage des outils |
| 7 — Tutoriel, signaux, Facile | Tutoriel approuvé réalisé ; le lot complet n'est pas livré                                                | Prévision des ennemis, appel anticipé/bonus, Facile, dock quatre alliés : voir détail ci-dessous   |
| 8 — Monétisation              | Nouveau modèle et cadence validés, dossier et contrôles préparés                                          | Comptes, prix/produits, SDK enfant, accès parents, reçus et achats de test                         |
| 9 — Store                     | Fiches brouillon, sept captures/banner et préflight préparés                                              | Identité/package, icône finale, confidentialité du SDK, IARC, AAB et test fermé                    |
| 5 — Langues                   | Fiches store FR/EN/DE/IT en brouillon ; application toujours en français                                  | Traduction du jeu et relecture après stabilisation                                                 |
| 6 — Lieux/événements          | Crue/marais HD conservés ; aucune nouvelle mécanique appliquée                                            | Après sortie, validation du marais et des règles avec le fils                                      |

## Nouvelle décision commerciale

Le parent choisit le **jeu gratuit avec publicité rare, suppression des pubs
payante et cosmétiques sans avantage au combat**. Cadence explicitement validée :
au plus une pub entre missions par dix minutes, après au moins deux missions,
jamais pendant une vague. Le développeur propose une première période de grâce
et l'exclusion des défaites, réessais et classique pour réduire les interruptions.

Cela remplace la proposition d'achat de déblocage et de restriction des missions
dans le lot 8 fourni. L'ancienne hypothèse 3,99 € / 4 CHF ne fixe pas le nouveau tarif.
Le compte Play personnel est créé, validation d'identité en attente. Les SDK
commerciaux ne sont pas intégrés à l'APK 0.30.2 ; l'outil de préparation doit
montrer cet état sans faux GO.

## Sous-parties à ne plus perdre dans les résumés

| Point d'origine                                   | État réel                                                                              | Condition suivante                                                                                           |
| ------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Lot 2 : tutoiement et vocabulaire                 | Partiel ; « défendez le camp », « soldats » et « renforts » subsistent                 | Corriger la présentation puis vérifier aussi après lancement, pas seulement l'état initial                   |
| Lot 2 : préparation illustrée                     | Minimum fonctionnel livré : trois pictogrammes courts ; maquette partiellement reprise | Décider du vrai aperçu du plateau et de la richesse des illustrations                                        |
| Lot 2 : miel en icônes puis toucher une voie      | Pots présents, sélection par boutons textuels ; geste sur le plateau absent            | Cadrer le parcours tactile sans déplacer les unités ni changer les règles du miel                            |
| Lot 2 : miel2, Encourager3, Réparer4, héros5      | Non implémenté, disponibilité explicitement réservée                                   | Parent/fils : masquer les outils ou préférer des explications progressives                                   |
| Lot 7 : trois voies visibles, fronts centre→2→3   | Réalisé et approuvé ; anciens codes conservent leurs règles                            | Préserver ce choix, ne pas revenir à une seule voie visible                                                  |
| Lot 7 : prévision des ennemis aux antres          | Non réalisé ; absent du précédent résumé                                               | Définir une prévision honnête compatible avec l'IA adaptative ; affichage sans RNG supplémentaire            |
| Lot 7 : appel anticipé et bonus                   | Non réalisé, règle non validée                                                         | Reconception nécessaire : préparation actuellement sans décompte ; ne pas inventer une urgence implicitement |
| Lot 7 : Facile en pause, mémorisé                 | Non réalisé, valeurs non validées                                                      | Proposition au parent/fils, migrations et comparaison sur six missions                                       |
| Lot 7 : dock de quatre alliés permanent           | Absent ; catalogue voisin temporaire livré en alternative partielle                    | Arbitrer les raccourcis permanents ; conserver catalogue complet et placement libre                          |
| Maquette accueil : chemin de progression illustré | Non réalisé comme la cible ; liste repliée et diorama actuels                          | Choix d'interface à rendre explicite                                                                         |
| Lot 6 : crue/marais                               | PNG HD conservés, pas importés dans le runtime                                         | Export/cadrage et intégration ; marais à valider ; après sortie selon ordre actuel                           |
| Lot 9 : icône pour l'application                  | Source HD de référence seulement ; launcher Capacitor encore présent                   | Correction des coins blancs et exports store/Android, sans génération payante implicite                      |

## Recentrage application et ordre recommandé

Le parent recentre le travail sur le jeu pendant la validation de son identité.
La 0.30.2 consolide le lot 4 : les pauses temporaires ne peuvent plus effacer une
interruption ; les formats de camp 1 à 7 et les trois chapitres sont contrôlés
depuis les fichiers embarqués, réseau coupé dans Chromium. Ce n'est pas un test
Android physique ni un cache hors ligne du site web.

L'annonce « langues ensuite parce que les lots précédents sont livrés » était
trop rapide. L'ordre ci-dessous est une **recommandation issue de l'analyse**,
pas une validation de nouvelles règles :

1. Finir le parcours enfant/mobile et cadrer les restes des lots 2/7 ; retest du
   S24 en parallèle. Les icônes d'ennemis sont distinctes d'un bonus économique.
2. Cadrer l'extension de campagne demandée historiquement : les six missions
   font 19 vagues locales et s'arrêtent au rang 8 ; Tank et boss restent dans
   le classique. Les 18 configurations par mission ne sont pas 18 niveaux.
3. Exploiter les ressources : icône de l'application et, si nouvel arbitrage,
   variantes visuelles crue/marais séparées de la météo. Leur report après sortie
   reste la décision en vigueur tant qu'elle n'est pas modifiée.
4. Lot 5 — FR/EN/DE/IT après stabilisation des parcours/textes. Extraction
   technique possible en parallèle ; traductions à relire humainement. Préserver
   identifiants, codes, sauvegardes et personnages du fils.

Les lots 8/9 restent en attente des décisions/comptes et ne bloquent pas le jeu.
Le dossier de publication et ses captures restent un instantané de la 0.30.1,
pas une preuve de validation de la 0.30.2. Ils seront actualisés lors du retour
au travail de publication. Les données des futurs SDK imposeront une politique
exacte ; ne pas réutiliser « aucune collecte » pour une version publicitaire.

## Preuves actuelles et limites

Code/APK 0.30.2 ; site et dossier Play 0.30.1 historiques. 400 tests natifs et
[CI GitHub 42494670333](https://github.com/zyclope0/snakeattak/actions/runs/42494670333)
verts sur `a57b05a`. Audit strict actuel 13/13 ; cela ne couvre ni tout le lot 7,
ni compréhension sans lecture, ni FPS Android physique. La nouvelle analyse ne
modifie aucun code de jeu et ne constitue pas une nouvelle publication.
