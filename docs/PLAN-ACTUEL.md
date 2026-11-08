# Plan actuel — après la 0.30.1

Suivi du 8 novembre 2026. L'audit reste le cadre ; les décisions explicites du
parent priment sur ses recommandations. Le gameplay vient du fils et reste préservé.

| Lot                  | État réel                                                                 | Prochaine condition                                                             |
| -------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1 — Affichage        | Livré 0.27, complété par correctif mobile 0.30.1                          | Retours appareils réels                                                         |
| 4 — Android          | APK compilé ; essais familiaux commencés sur S24 Ultra, gameplay apprécié | Relevés FPS/RAM, veille/reprise, hors ligne et retour sur correctif d'interface |
| 3 — Plateau          | Livré0.28                                                                 | Préserver géométrie et lisibilité                                               |
| 2 — Interface        | Livrée0.29, améliorée0.30.1                                               | Introduction progressive des pouvoirs encore réservée                           |
| 7 — Initiation       | Refuge centre→deux voies→trois, livré 0.30, approuvé et simulé            | Mode Facile et autres modifications de difficulté à valider séparément          |
| 8 — Monétisation     | Nouveau modèle et cadence validés, dossier et contrôles préparés          | Comptes, prix/produits, SDK enfant, accès parents, reçus et achats de test      |
| 9 — Store            | Fiches brouillon, sept captures/banner et préflight préparés              | Identité/package, icône finale, confidentialité du SDK, IARC, AAB et test fermé |
| 5 — Langues          | Fiches store FR/EN/DE/IT en brouillon ; application toujours en français  | Traduction du jeu et relecture après stabilisation                              |
| 6 — Lieux/événements | Crue/marais HD conservés ; aucune nouvelle mécanique appliquée            | Après sortie, validation du marais et des règles avec le fils                   |

## Nouvelle décision commerciale

Le parent choisit le **jeu gratuit avec publicité rare, suppression des pubs
payante et cosmétiques sans avantage au combat**. Cadence explicitement validée :
au plus une pub entre missions par dix minutes, après au moins deux missions,
jamais pendant une vague. Le développeur propose une première période de grâce
et l'exclusion des défaites, réessais et classique pour réduire les interruptions.

Cela remplace la proposition d'achat de déblocage et de restriction des missions
dans le lot 8 fourni. L'ancienne hypothèse 3,99 € / 4 CHF ne fixe pas le nouveau tarif.
Le parent n'a pas encore de compte Play. Les SDK commerciaux ne sont pas intégrés
à l'APK 0.30.1 ; l'outil de préparation doit montrer cet état sans faux GO.

## Prochaine étape concrète

Relire le dossier `publication/`, choisir identité/package et produits/prix,
créer les comptes nécessaires, puis intégrer/tester les services en mode de test.
Les données publicitaires et de reçus imposent une politique exacte : ne pas
réutiliser « aucune collecte » pour la future version avec SDK.
La version jouable reste 0.30.1 tant que les changements sont documentaires/outillage.
