# Plan actuel — application 0.32.2

## Mission active — Suivi v0.32.1, étape 1

**8 novembre 2026 — étape 1 livrée ; retour de fluidité reçu sur le S24.
STOP en attente du GO distinct pour l'étape 2.**

Retour du parent : « fluide a mon niveau su s24 ». Observation qualitative sur
appareil réel ; aucune mesure FPS/RAM ni validation globale des interactions
n'en est déduite. [Retour consigné](../reports/suivi-0.32.2/retour-parent-s24.json).

APK 0.32.2/code 37 compilé, identifiant et certificat debug conservés.
Recette : 423 tests natifs, interface 24/24, audit 13/13, child-mobile six formats,
défilement cinq formats + ordinateur, hors ligne dix contrôles (anciens camps
1 à 7), interruptions onze scénarios : tous verts. Plateau à 1280×800 :
1065,95×600,81 px, soit +75,52 px de hauteur ; les 150 px entiers ne sont pas
récupérés. [Reçu](../reports/suivi-0.32.2/verification.json). Aucun
changement de règles ou de sauvegarde. Le site public reste en 0.32.1 ; aucun
nouveau déploiement n'entre dans ce GO. [Bilan de l'étape 1](BILAN-0.32.2.md).

Les cinq constats ci-dessous décrivent la baseline 0.32.1, conservée avec ses
preuves. Les correctifs 0.32.2 portent sur 1, 2 et 4 ; les textes sources (3)
restent pour l'étape 2 et la facilité du tutoriel (5) ne change pas.
Référence : audit mis à jour sur `36305b8` / 0.32.1, uniquement sa section
« Suivi v0.32.1 ». [Source et empreinte](audit-source-2026-11/manifest-suivi-0.32.1.json).
AGENTS.md, GAME_DESIGN.md, ce plan et MONETISATION.md ont été lus avant analyse.
Le mandat autonome antérieur ne permet plus d'enchaîner : **un GO après chaque
étape**. [Bilan et preuves détaillées](BILAN-0.32.1.md#suivi-de-laudit--étape-0-du-8-novembre-2026).

| Constat du suivi                 | Contre-vérification                                                                                                                                                                                                                             | Preuve                                                                                                                                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 — Catalogue ordinateur et vide | Confirmé : 10 cartes, 2 onglets, 1 filtre ; canvas 931,97 × 525,30 px à 1280 × 800 ; 157,70 px entre son bas et le bas de la fenêtre                                                                                                            | [Capture](captures-suivi-0.32.1-etape-0/combat-1280x800.png), [mesures](../reports/suivi-0.32.1-etape-0/geometries.json) ; src/style.css:300 et :3780                                                                      |
| 2 — Bandeau au-dessus de la voie | Confirmé avec nuance : chevauchement des rectangles avec le bord des puces sur 2,81 px ; les puces HTML restent devant. Le chemin pavé est couvert sur la géométrie 1, pas sur la géométrie 0 capturée ; ne pas généraliser à tous les terrains | [Capture vague 2](captures-suivi-0.32.1-etape-0/evenement-vague2-780x360.png) ; src/render/battleFeedback.ts:112, src/style.css:3713 ; [calcul des trois tracés](../reports/suivi-0.32.1-etape-0/contre-verification.json) |
| 3 — Tutoiement automatique       | Problème confirmé, décompte contesté : 21 chaînes dans les trois fichiers cités, et 2 supplémentaires dans checkpoints.ts:233 ; pas seulement 13                                                                                                | [Inventaire avec lignes](../reports/suivi-0.32.1-etape-0/textes-sources.json) ; src/ui/childCopy.ts:1                                                                                                                      |
| 4 — Trait blanc du héros         | Confirmé : pixels déjà présents dans l'atlas du héros, pas un trait CSS ni une barre système Android                                                                                                                                            | [Recadrage](captures-suivi-0.32.1-etape-0/heros-1280x800.png) ; src/art.ts:47 et :94, src/ui/menu.ts:120 ; atlas allies-front.webp                                                                                         |
| 5 — Victoire sans recrutement    | Exemple reproduit : code REFUGE-2-FZZZ-ZZR4-9F, 2 étoiles sans recrue, 3 avec un archer. Résultat variable selon le départ ; 12 simulations, toutes gagnées. Aucun rééquilibrage demandé ni réalisé                                             | [Observations et méthode](../reports/suivi-0.32.1-etape-0/refuge-observations.json)                                                                                                                                        |

### Ordre imposé, avec arrêt à chaque étape

0. **Contre-vérification, documents et captures uniquement : réalisée.** Aucun
   changement de code applicatif, de version, de sauvegarde ou de publication.
   Vérifications : verify 423/423, navigateur ordinateur/mobile, audit 13/13,
   child-mobile six formats sans erreur. GO reçu pour l’étape 1.
1. **0.32.2 — correctifs d'interface**, réalisée : même dock sur ordinateur
   (4 favoris, 2 miels, Tous les alliés), plateau agrandi sans défilement ; annonces
   sur une ligne dans le HUD ou au bas du plateau, sans couvrir voie/pastilles ;
   suppression du trait blanc existant. Conserver proportions et coordonnées du
   plateau : un dock latéral rétréci ne suffira pas forcément à récupérer les
   150 px entiers. Comparer la hauteur utile et annoncer le gain réel.
   Recette : npm run verify, test:browser, test:audit, test:child-mobile ; captures
   avant/après 1280×800, 1366×768 et 780×360 tactile ; dimensions avant/après ;
   npm run android:apk:debug. **STOP : test de l'APK par le parent sur S24.**
2. **Textes sources au tutoiement**, après nouveau GO : reprendre l'inventaire
   complet, y compris les messages reconstruits lors d'une reprise ; enlever la
   réécriture childCopy ou justifier strictement un éventuel reste de compatibilité.
   Expliquer chaque instantané modifié, ajouter le contrôle d'absence de
   « vous / votre / vos » dans src/ et index.html ; vérifier mêmes parties pour
   mêmes codes, anciens formats et tous les tests. **STOP.** Version à fixer au GO.
3. **Icône et identité**, après nouveau GO : source Magnific retenue dans
   docs/resources-2026-11, sans génération payante ; icône adaptative, fond uni,
   coins blancs supprimés ; vérifier l'icône de l'APK debug. Proposer trois
   identifiants définitifs avec avantages/inconvénients, **n'en appliquer aucun**.
   Conserver l'identifiant courant et les sauvegardes. **STOP : choix du parent.**
4. **Monétisation v1 sans serveur — documents seulement**, après nouveau GO :
   achats non consommables vérifiés et confirmés dans l'app, acknowledge client,
   droits relus au démarrage, dernier droit connu hors ligne ; serveur de reçus
   facultatif plus tard. Documenter INTERNET, SDK Familles dans sa version exacte
   vérifiée, configuration enfant avant requête, brouillons confidentialité et
   Sécurité des données. « Aucune collecte » ne décrit pas une version avec pub.
   **Aucune pub pendant le test fermé avant observation par le parent sur S24.**
   Aucun SDK/achat intégré à cette étape documentaire. **STOP.**

À chaque étape : tableau fait/pas fait/preuve, commandes et nombres, limites et
arbitrages, bilan de version et ce plan à jour. Aucun changement de règles, aucun
Math.random ajouté dans les règles ; séparation moteur/rendu/interface, sauvegardes
et anciens codes préservés. Aucun appel anticipé, mode Facile, extension de
campagne, renommage, lot 5 (langues) ou lot 6 (lieux). Aucun appel de génération
payante, achat ou intégration de SDK publicitaire dans cette mission.

Les priorités et lots ci-dessous sont **l'historique conservé**, pas un mandat
pour dépasser les quatre étapes ou leurs STOP. Les documents de monétisation
restent inchangés jusqu'à l'étape 4 ; leur exigence de serveur et leur mention
d'un compte Play encore absent devront alors être rectifiées.

## Historique conservé des lots et décisions

Suivi rectifié le 8 novembre 2026, après comparaison complète avec l'audit fourni.
Les décisions explicites du parent priment sur ses recommandations. Le gameplay
vient du fils et reste préservé. [Analyse et preuves](RECONCILIATION-AUDIT-0.30.2.md) ;
[sources originales archivées](audit-source-2026-11/README.md).

Les anciennes mentions « lots 2 et 7 livrés » résumaient trop largement des
livraisons partielles. Le changement de priorité ne supprime plus leurs
sous-parties restantes. Les bilans historiques sont conservés.

Suite autorisée par « Continue » : 0.31.0 réalise les quatre raccourcis mobiles,
le miel au toucher des chemins et une passe de vocabulaire/tutoiement. Cette
version d'interface ne réalise pas le lot 8 malgré son numéro indicatif d'origine.
Les lots 2 et 7 restent partiels. Voir [BILAN-0.31.md](BILAN-0.31.md).

GO suivant : 0.32.0 illustre la préparation et les dangers de vague, sans
annoncer de répartition par voie. Voir [BILAN-0.32.md](BILAN-0.32.md).

| Lot                           | État réel                                                                                     | Prochaine condition                                                             |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1 — Affichage                 | Réalisé 0.27, complété par 0.30.1 ; audit actuel 13/13 sur sa portée                          | Retours appareils réels ; ne pas confondre avec toute l'accessibilité           |
| 4 — Android réel              | Partiel : APK et diagnostic ; interruptions 0.30.2 et fichiers embarqués testés en navigateur | Relevés mission 6/classique 12, FPS/RAM et cycle de vie physiques               |
| 3 — Plateau                   | Réalisé 0.28 : raccords et halos ; nouveaux fonds non intégrés                                | Préserver géométrie et lisibilité                                               |
| 2 — Lisibilité                | Partiel ; 0.31 livre quatre raccourcis, miel au toucher, vocabulaire et tutoiement            | Apprentissage des outils, accueil illustré ; essais sans lecture                |
| 7 — Tutoriel, signaux, Facile | Tutoriel et dock de quatre alliés réalisés ; lot complet partiel                              | Prévision réalisée 0.32 ; appel anticipé/bonus et Facile restent distincts      |
| 8 — Monétisation              | Nouveau modèle et cadence validés, dossier et contrôles préparés                              | Comptes, prix/produits, SDK enfant, accès parents, reçus et achats de test      |
| 9 — Store                     | Fiches brouillon, sept captures/banner et préflight préparés                                  | Identité/package, icône finale, confidentialité du SDK, IARC, AAB et test fermé |
| 5 — Langues                   | Fiches store FR/EN/DE/IT en brouillon ; application toujours en français                      | Traduction du jeu et relecture après stabilisation                              |
| 6 — Lieux/événements          | Crue/marais HD conservés ; aucune nouvelle mécanique appliquée                                | Après sortie, validation du marais et des règles avec le fils                   |

Correctif 0.32.1 : le catalogue compact possède une seule zone de défilement ;
les vrais balayages sur les cartes sont désormais testés.
Voir [BILAN-0.32.1.md](BILAN-0.32.1.md).

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

| Point d'origine                                   | État réel                                                                                                | Condition suivante                                                                                           |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Lot 2 : tutoiement et vocabulaire                 | Passe réalisée 0.31 : début de vague, aide, messages et fiches ; données historiques inchangées          | Continuer les contrôles des états et préparer la future extraction des textes                                |
| Lot 2 : préparation illustrée                     | Réalisée 0.32 : carte illustrée, vrais tracés, portraits des dangers et conseil disponible               | Tester la compréhension sans lecture ; accueil illustré encore distinct                                      |
| Lot 2 : miel en icônes puis toucher une voie      | Réalisé 0.31 : deux pots dans le dock, chemins surlignés, refus sans dépense ; boutons clavier conservés | Essai tactile avec les enfants                                                                               |
| Lot 2 : miel2, Encourager3, Réparer4, héros5      | Non implémenté, disponibilité explicitement réservée                                                     | Parent/fils : masquer les outils ou préférer des explications progressives                                   |
| Lot 7 : trois voies visibles, fronts centre→2→3   | Réalisé et approuvé ; anciens codes conservent leurs règles                                              | Préserver ce choix, ne pas revenir à une seule voie visible                                                  |
| Lot 7 : prévision des ennemis aux antres          | Réalisée 0.32 : espèces de vague, portraits aux antres ouverts et détails accessibles                    | Tester la compréhension : espèces possibles, aucune répartition adaptative promise                           |
| Lot 7 : appel anticipé et bonus                   | Non réalisé, règle non validée                                                                           | Reconception nécessaire : préparation actuellement sans décompte ; ne pas inventer une urgence implicitement |
| Lot 7 : Facile en pause, mémorisé                 | Non réalisé, valeurs non validées                                                                        | Proposition au parent/fils, migrations et comparaison sur six missions                                       |
| Lot 7 : dock de quatre alliés permanent           | Réalisé 0.31 selon les favoris déverrouillés ; catalogue complet dans la même colonne                    | Retester sur le S24, notamment les petits noms et le confort de sélection                                    |
| Maquette accueil : chemin de progression illustré | Non réalisé comme la cible ; liste repliée et diorama actuels                                            | Choix d'interface à rendre explicite                                                                         |
| Lot 6 : crue/marais                               | PNG HD conservés, pas importés dans le runtime                                                           | Export/cadrage et intégration ; marais à valider ; après sortie selon ordre actuel                           |
| Lot 9 : icône pour l'application                  | Source HD de référence seulement ; launcher Capacitor encore présent                                     | Correction des coins blancs et exports store/Android, sans génération payante implicite                      |

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
   S24 en parallèle. La prévision 0.32 reste distincte d'un bonus économique.
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

Application/APK et site public 0.32.1, dossier Play
0.30.1 historique. Suite locale de cette livraison :
423 tests natifs verts ; livraison et preuves dans son bilan. La [CI GitHub 42494670333](https://github.com/zyclope0/snakeattak/actions/runs/42494670333)
reste une preuve du code 0.30.2 `a57b05a` (400 tests), distincte de cette recette.
Audit strict actuel 13/13 ; cela ne couvre ni tout le lot 7, ni compréhension sans
lecture, ni FPS Android physique. Le rapprochement d'audit reste historique ;
la livraison d'interface 0.31 ne change aucune règle.
