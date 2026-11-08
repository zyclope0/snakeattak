# Plan actuel — application 0.30.2

Suivi du 8 novembre 2026. L'audit reste le cadre ; les décisions explicites du
parent priment sur ses recommandations. Le gameplay vient du fils et reste préservé.

| Lot                  | État réel                                                                                             | Prochaine condition                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1 — Affichage        | Livré 0.27, complété par correctif mobile 0.30.1                                                      | Retours appareils réels                                                         |
| 4 — Android          | Essais familiaux commencés ; interruptions corrigées en 0.30.2, paquet hors ligne testé en navigateur | Confirmer veille/reprise et interface sur le S24 ; relevés FPS/RAM physiques    |
| 3 — Plateau          | Livré0.28                                                                                             | Préserver géométrie et lisibilité                                               |
| 2 — Interface        | Livrée0.29, améliorée0.30.1                                                                           | Introduction progressive des pouvoirs encore réservée                           |
| 7 — Initiation       | Refuge centre→deux voies→trois, livré 0.30, approuvé et simulé                                        | Mode Facile et autres modifications de difficulté à valider séparément          |
| 8 — Monétisation     | Nouveau modèle et cadence validés, dossier et contrôles préparés                                      | Comptes, prix/produits, SDK enfant, accès parents, reçus et achats de test      |
| 9 — Store            | Fiches brouillon, sept captures/banner et préflight préparés                                          | Identité/package, icône finale, confidentialité du SDK, IARC, AAB et test fermé |
| 5 — Langues          | Fiches store FR/EN/DE/IT en brouillon ; application toujours en français                              | Traduction du jeu et relecture après stabilisation                              |
| 6 — Lieux/événements | Crue/marais HD conservés ; aucune nouvelle mécanique appliquée                                        | Après sortie, validation du marais et des règles avec le fils                   |

## Nouvelle décision commerciale

Le parent choisit le **jeu gratuit avec publicité rare, suppression des pubs
payante et cosmétiques sans avantage au combat**. Cadence explicitement validée :
au plus une pub entre missions par dix minutes, après au moins deux missions,
jamais pendant une vague. Le développeur propose une première période de grâce
et l'exclusion des défaites, réessais et classique pour réduire les interruptions.

Cela remplace la proposition d'achat de déblocage et de restriction des missions
dans le lot 8 fourni. L'ancienne hypothèse 3,99 € / 4 CHF ne fixe pas le nouveau tarif.
Le compte Play personnel est créé, validation d'identité en attente. Les SDK commerciaux ne sont pas intégrés
à l'APK 0.30.1 ; l'outil de préparation doit montrer cet état sans faux GO.

## Prochaine étape application

Le parent recentre le travail sur le jeu pendant la validation de son identité.
La 0.30.2 consolide le lot 4 : les pauses temporaires ne peuvent plus effacer une
interruption ; les formats de camp 1 à 7 et les trois chapitres sont contrôlés
depuis les fichiers embarqués, réseau coupé dans Chromium. Ce n'est pas un test
Android physique ni un cache hors ligne du site web.

Prochain lot fonctionnel prévu : **5 — langues de l'application FR/EN/DE/IT**, avec
textes centralisés, choix mémorisé et contrôle des textes longs sur téléphone.
Les traductions devront être relues humainement ; les noms des unités restent
fidèles aux personnages du fils. Aucun changement de difficulté implicite.

Les lots 8/9 restent en attente des décisions/comptes et ne bloquent pas le jeu.
Le dossier de publication et ses captures restent un instantané de la 0.30.1,
pas une preuve de validation de la 0.30.2. Ils seront actualisés lors du retour
au travail de publication. Les données des futurs SDK imposeront une politique
exacte ; ne pas réutiliser « aucune collecte » pour une version publicitaire.
