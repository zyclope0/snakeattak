# Bilan 0.36.2 — équilibrage et livraison privée

Candidate `feat/equilibrage-0362`, version 0.36.2 / Android 48, empilée sur
`feat/caprices-interface`. Livraison locale privée préparée ; publication après revue autorisée le
10 novembre, conduite séparément par le coordinateur.
Les sept décisions confirmées sont appliquées : bonus réservé aux carapaces,
baisse des trois prix, rappel discret, T-rex 340, bébé dragon 210, tank 440,
rappel après dix secondes actives avec 500 pièces dépensables. Tank reste
accessible à la vague 9 classique ; aucune autre statistique d’allié ne change.

| Caprice, révision 2          | Valeurs approuvées                                                     |
| ---------------------------- | ---------------------------------------------------------------------- |
| `carrefour-grand`            | count 1,5 → 1,2                                                        |
| `sonnette-grand`             | hp 2 → 1,75                                                            |
| `refuge-createur-moyen`      | shellEvery 2, shellHp 5, shellArmor 0,7, shellSpeed 0,6, shellBite 1,5 |
| `trois-ponts-createur-moyen` | shellEvery 2, shellHp 5, shellArmor 0,6 ; shellSpeed 0,5 conservé      |
| `course-createur-moyen`      | shellEvery 2, shellHp 5, shellArmor 0,6 ; shellSpeed 0,5 conservé      |

Le bite global reste 1. Seuls les ennemis marqués shell du refuge frappent plus
fort, avec un unique multiplicateur même pour un projectile hypothétique ;
ennemis sans carapace et boss restent inchangés. Les représailles exactes 2/3 et
les dégâts 9 d’entrée au cristal ne changent pas. Les noms **et annonces** du fils
restent exactement français en FR/EN.

Le rappel « Tu as des pièces, recrute ! » utilise dix secondes réelles de combat
actif avec `gold − reserve ≥ 500`, et exige une place légale pour un allié
recrutable. Un achat réussi, y compris gratuit, ou une baisse sous le seuil
remet le délai à zéro. Pause, accueil, onglet masqué, dialogue, rotation et pose
ne le font pas avancer ; ×1/×2 ne changent pas sa durée. Une apparition par code,
cache UI de 64 codes, repli mémoire si stockage refusé ; quatre secondes actives
maximum, annulées par recrutement et sans concurrencer une annonce prioritaire.
Il utilise la ligne basse existante, hors des voies, sans panneau ni règle Game.

## Compatibilité et provenance

Révision 1 historique et révision 2 courante sont immuables. Les anciennes API
restent historiques par défaut ; la session crée explicitement les nouveaux
départs en révision 2. Reprise, import de code et réessai conservent leur révision.
Les prix du catalogue et du guide suivent la partie ; guide d’accueil = prix
courants. « Règles d’origine » identifie les départs historiques.

Les nouveaux formats sont code 4, camp 9, progression 2 et enveloppe familiale 5.
Lecteurs codes 1–3, camps 1–8 et familles 1–4 conservés ; les fausses versions
anciennes contenant balance 2 sont rejetées sans écriture. Import atomique et
propriété du carnet conservés. Carnets format 1, 36 cases, campagne et étoiles
partagées. Le catalogue historique `data.ts` et les 36 définitions sont figés :
75 traces et 41 témoins d’octets historiques les contrôlent. Les sources du cœur
ont changé pour router les révisions ; on ne prétend pas qu’elles sont identiques
à la 0.36.1.

## Mesures du laboratoire livré

Cinq caprices : 540 parties réelles du Game révision 2, 108 par ligne, joueur
moyen officiel, entrées appariées. Les 540 témoins anciens sont **réutilisés**,
pas de nouvelles parties. Les 540 résultats correspondent exactement aux
candidats approuvés ; durée 78,389595309 s sur les sources cœur `f6dd559`.

| Caprice                      | Victoires avant → après / 108 | Moyenne des minima de cristal après | Pire minimum après |
| ---------------------------- | ----------------------------: | ----------------------------------: | -----------------: |
| `carrefour-grand`            |                       31 → 61 |                           31,5648 % |                0 % |
| `sonnette-grand`             |                       42 → 55 |                           19,5926 % |                0 % |
| `refuge-createur-moyen`      |                     108 → 108 |                           58,0833 % |                1 % |
| `trois-ponts-createur-moyen` |                     108 → 108 |                             85,75 % |               46 % |
| `course-createur-moyen`      |                     108 → 108 |                           83,1667 % |               46 % |

Le refuge utilise la morsure réservée aux carapaces : l’ancien scénario où tous
les ennemis recevaient ×1,5 (53,99 %, pire 0) n’est pas le résultat livré.
Aucun timeout dans ces cinq cohortes. Les trois baisses de prix sont vérifiées
sur 132 parties réelles supplémentaires sans override de règles/prix, dont
54 missions 6 + 12 classiques sous deux politiques d’achat. Les 132 mesures
correspondent exactement au holdout approuvé ; durée 44,657443379 s. Cela fait
**672 parties Game révision 2**, distinctes des **1 356 exploratoires**
(660 découverte + 264 confirmation + 108 isolation T-rex + 324 carapaces).
Les deux cohortes réelles sont réutilisées après vérification des huit empreintes
physiques, toutes inchangées. Aucune reproduction des 44 092 parties de l’audit.

Le champ minimum classique de la découverte était invalide et exclu ; la
confirmation suit la vraie base à chaque pas. Les étoiles du robot classique
sont un champ mission sans sens : seuls victoire et minimum de base sont retenus.
Les durées d’or exploratoires sont cumulées, pas continues, et ne prouvent pas
les dix secondes du rappel ; les recettes UI natives apportent cette preuve.

## Livraison et limites

Les commandes fraîches, les recettes antérieures pertinentes réutilisées, les
captures, SHA et paquets sont détaillés dans l’[index compact](../reports/equilibrage-0362/README.md).
Le rapport distingue version du paquet, SHA du cœur mesuré, commit source de
l’APK et clôture documentaire. Les anciens APK, rapports, captures et archives
restent conservés ; l’archive nouvelle rassemble uniquement les nouvelles preuves.

À 568×320 avec marges simulées 24/48/16/0, le catalogue empilé laisse
19 px de la première carte avant défilement. Le geste tactile réel conserve
le défilement, la sélection et l’absence d’achat accidentel ; cette faible
exposition initiale reste une limite d’usage à juger pendant la revue et
l’essai physique. La recette utilise désormais l’intersection visible de la
carte plutôt qu’un point de portrait masqué, sans réduire ses assertions.

Les perspectives du [conseil](CONSEIL-0.36.2.md) sont simulées. Essai physique S24,
TalkBack, relecture humaine anglophone et expérience réelle des enfants restent
attendus. Pas de certification de performance ni d’accessibilité exhaustive,
SDK/API/achat/génération payante, nouvelle difficulté ou migration du dépôt.
Revue globale et intégration/publication autorisées confiées au coordinateur.
L’essai privé S24 reste attendu ; ce bilan décrit le paquet local avant
publication.

## Correction mineure après revue globale

La revue fraîche a trouvé un seul P3 : une progression mission déjà promue en
version 2 pouvait être exportée sous famille 4 après remplacement du refuge
neuf par un ancien. Correction source `28e958e29ef86b8442c875ce6a96b0707ec0425d` :
ce marqueur conservé exige famille 5, avec missions/carnets complets ; faux
labels 1–4 refusés avant écriture. Aucune rétrogradation de données ni règle,
valeur, RNG, prix ou ancien octet modifié. RED puis 45 tests ciblés verts ;
vérification fraîche 548/548, navigateur général/famille et quatre démarrages
froids FR/EN normaux hors ligne/file:// réussis.

APK et portable courants reconstruits depuis ce commit ; même 0.36.2/code 48,
appID/certificat/paysage, 34 fichiers dist égaux, sans serveur/startpath ou
permission réseau/achat. Les deux livrables pré-revue sont conservés sous noms
explicites. L’archive initiale Task3 150 Mo et son SHA restent inchangés ;
un petit complément final séparé contient les nouvelles preuves et paquets,
avec manifeste individuel vérifié. [Reçu courant](../reports/equilibrage-0362/delivery.json).
8 139 preuves fixes + 145 fichiers Task3, six anciens livrables externes et
huit hashes du cœur sont préservés ; les 672 parties déjà revues ne sont pas
rejouées. Relecture ciblée, coordination et intégration/publication restent
à la charge du coordinateur. Limites physiques/humaines ci-dessus inchangées.
