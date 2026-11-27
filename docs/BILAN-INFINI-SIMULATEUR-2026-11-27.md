# L'aventure sans fin : un simulateur qui joue comme les vrais joueurs (27 novembre 2026)

Demande du parent, après le lot A ([bilan](BILAN-INFINI-LOT-A-2026-11-26.md)) : le
simulateur sous-estime les vrais joueurs. Lui a battu 3 rois (vague 46) en posant tout au
hasard ; son fils a battu 10 rois (vague 128), facilement. Le joueur « hasard » vide sa bourse
toutes les trois secondes et ne répare jamais le cristal ; l'« épargnant » achète trop tard.

Trois travaux, **sans changer aucune règle** : des joueurs simulés qui retrouvent les deux
vraies parties ; ce qui rend le camp si fort au 10e roi ; la mesure des formules F1 et F1b du
conseil ([rapport](passation/COUNCIL-INFINI-2026-11-20.md), lot C) pour que le parent choisisse.
Rien n'est décidé ici. Branche `claude/trusting-brahmagupta-t7fmuy`, ni poussée ni fusionnée.

## En bref

- **Deux joueurs simulés nouveaux**, « parent » et « enfant », qui ne font que ce que l'écran
  permet (réparer, entraîner le héros, miel, encouragement, poser partout dans le camp).
  **Ils retrouvent les deux vraies parties en moyenne** : « parent » 3,25 rois et vague 50
  (le parent : 3 rois, vague 46) ; « enfant » 9 à 10 rois et vague 119 à 130 (le fils : 10
  rois, vague 128), sans presque jamais toucher le cristal après le premier roi. Écarts : le
  « parent » tombe au premier tour dans un quart des parties ; aucun « enfant » ne passe le
  11e roi.
- **Ce qui tient au 10e roi** : les tanks (sans eux, 5 rois au lieu de 10), les cadeaux qui
  durent (7 rois sans eux), les soigneurs (surtout au premier tour). Pas le cristal ni les
  réparations : presque aucun serpent n'entre avant le roi.
- **Douze défauts** relevés, avec leur preuve (§ 5), **rien n'est corrigé**. Les plus forts :
  le roi garde sa vitesse et tue d'un coup alors que sa vie est ×41 après dix rois (le mur
  du 11e roi) ; les pièces ne baissent presque pas (12 par serpent et la rente, jamais ×0,9) ;
  le cristal perd toujours 9 par serpent, comme le parent l'a vu ; la voie la moins défendue
  s'oublie à chaque roi.
- **F1 et F1b** suppriment le retour à zéro (début de tour 0,78 et 0,73 de la fin du tour
  d'avant, au lieu de 0,14) et adoucissent la falaise du roi, sans dépasser 26 serpents
  vivants. F1 est plus dure pour les joueurs moyens. **Ni l'une ni l'autre ne rend la partie
  moins plate pour un camp fort**, et F1b fait aller l'enfant plus loin (12 rois au lieu de
  10). Le choix revient au parent.
- Aucune règle changée, aucune valeur proposée ; les anciens joueurs jouent exactement les
  mêmes parties.

## 1. Ce qu'un vrai joueur peut faire

Lu dans l'interface (`src/session.ts`, `src/ui/battleCommands.ts`, `src/ui/adventureControls.ts`,
`src/ui/feastControls.ts`, `src/ui/campToolModel.ts`, `src/ui/reinforcementsDrawer.ts`) :

- **Au camp, entre deux vagues** : poser un allié sur n'importe quelle place libre du camp
  (`Game.recruit`) ; réparer le cristal (80 pièces pour 25 points) ; entraîner le héros une
  seule fois (90 pièces, à partir de la vague 4) ; choisir un cadeau parmi trois, ou passer, et
  dire quelle place il prend quand les cinq sont prises. Le temps passe au camp : les
  soigneurs soignent tant que la vague n'est pas lancée.
- **Pendant la vague** : poser un allié ; réparer le cristal (le catalogue se ferme après
  chaque action : une réparation à la fois) ; un pot de miel par vague, « goûter » ou
  « collant », sur une voie ; « Encourager » une fois par vague (8 secondes de coups plus
  rapides).
- **Impossible** : vendre ou déplacer un allié, ressusciter, acheter plus d'un entraînement.

Les joueurs nouveaux ne font que cela, et ne lisent que ce que l'écran montre (le prix, les
alliés posés devant chaque voie, le cristal, les serpents sur les ponts). Aucun ne lit la
force des voies calculée par le moteur.

## 2. Deux joueurs nouveaux : « parent » et « enfant »

Dans `scripts/balance-modes.mjs` (`PROFILES=parent,enfant`), avec leur propre graine : le jeu
ne voit pas leurs tirages.

| Joueur     | Achats                                                                                                                                                                    | Places                                                                                                    | Cristal                                                                          | Cadeaux                                          | Miel, encouragement                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| **parent** | deux alliés au hasard par camp ; quand le cristal est touché, vide sa bourse au hasard (ses mots : « on économise beaucoup, puis on vide la bourse dès que ça se corse ») | au hasard dans le camp                                                                                    | répare au camp sous 75 ; pendant la vague sous 50, une réparation toutes les 3 s | au hasard (place cédée au hasard)                | miel au hasard (voie et goût) ; encourage au premier serpent dans le camp |
| **enfant** | un soigneur pour huit combattants, sinon le plus grand allié qu'il peut payer ; un de plus quand le cristal est touché                                                    | devant la voie qui a le moins d'alliés ; combattants vers le milieu, tireurs et soigneurs près du cristal | répare jusqu'en haut au camp ; pendant la vague sous 75, une toutes les 3 s      | reprend ceux qu'il a, puis forge, armure, rente… | miel collant sur la voie la plus chargée ; encourage au premier serpent   |

Les deux entraînent le héros dès qu'ils peuvent (l'enfant la force, le parent au hasard),
posent l'allié offert par un cadeau, et restent **10 secondes au camp** (`CAMP_SECONDS`) :
les soigneurs soignent pendant ce temps, comme dans le vrai jeu (les anciens joueurs y
restaient 3 secondes).

Réglages essayés avant de choisir (24 à 64 parties chacun, jusqu'au 8e roi) :

| Essai                                                  | parties | rois méd. | ≥ 3 rois | vague méd. |
| ------------------------------------------------------ | ------: | --------: | -------: | ---------: |
| parent, 2 alliés par camp, ne vide jamais sa bourse    |      32 |         2 |     47 % |         34 |
| parent, 3 alliés par camp                              |      32 |         5 |     66 % |         71 |
| parent, 4 alliés par camp                              |      32 |         5 |     72 % |         69 |
| parent, 1 allié par camp + vide sa bourse              |      64 |         2 |     42 % |         34 |
| **parent, 2 alliés par camp + vide sa bourse (gardé)** |      64 |     **4** | **58 %** |     **55** |

Pour l'enfant, le premier tour décide (premier roi, 24 parties) : combattants posés tout
devant (près des ponts) 71 %, vers le milieu du camp 96 %, plus en arrière 100 % ; sans
soigneur 25 %, un soigneur pour cinq 96 %. Une première version (un des trois plus grands au
hasard, 80 pièces gardées) tombait au premier tour. Gardé : le plus grand allié, combattants
vers le milieu, un soigneur pour huit.

## 3. Calibrage contre les deux vraies parties

Règles sans fin version 1, inchangées ; jusqu'au **15e roi** au plus (limite montée de 6 à 15
par défaut : rien n'est tronqué ; en version 1, aucun joueur ne dépasse 10 rois) ; 48 parties par joueur.

| Mesure                                          | Vraie partie du parent                | « parent » simulé                           | Vraie partie du fils                   | « enfant » simulé                                            |
| ----------------------------------------------- | ------------------------------------- | ------------------------------------------- | -------------------------------------- | ------------------------------------------------------------ |
| Rois battus                                     | 3                                     | médiane 4, moyenne 3,25 (q1 1, q3 5, max 7) | 10, « facilement »                     | médiane 10, moyenne 9,0 (q1 9, q3 10, max 10)                |
| Vague atteinte                                  | 46                                    | médiane 57, moyenne 49,7 (q1 24, q3 72)     | 128                                    | médiane 130, moyenne 119 (q1 120, q3 132)                    |
| Au moins 3 rois / au moins 10 rois              | —                                     | 63 % / 0 %                                  | —                                      | 94 % / 60 %                                                  |
| Vagues sans dégât au cristal après le 1er roi   | « jamais en danger avant le roi »     | 89 %                                        | « facilement »                         | 99 %                                                         |
| Cristal le plus bas avant un roi (après le 1er) | —                                     | médiane 53 (de 7 à 91)                      | —                                      | médiane 100 (28 parties sur 45 : jamais touché avant un roi) |
| Chute au roi (parmi les chutes)                 | non (vague 46 = 10e vague du 4e tour) | 56 %                                        | non (vague 128 = 8e vague du 11e tour) | 63 %                                                         |
| Stock de pièces maximal                         | —                                     | médiane 1 695 (de 414 à 10 480)             | —                                      | médiane 850 (de 633 à 1 521)                                 |
| Pièces gagnées par tour                         | —                                     | médiane 4 825                               | —                                      | médiane 5 332                                                |

Rois battus, partie par partie (48 parties) :

| Rois       |   0 |   1 |   2 |   3 |   4 |   5 |   6 |   7 |   8 |   9 |  10 |
| ---------- | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: |
| « parent » |  11 |   5 |   2 |   4 |   6 |  10 |   9 |   1 |   0 |   0 |   0 |
| « enfant » |   3 |   0 |   0 |   0 |   0 |   0 |   0 |   1 |   1 |  14 |  29 |

**Lecture.** Les deux joueurs nouveaux retrouvent les deux vraies parties **en moyenne** :
3,25 rois et vague 50 pour 3 rois et vague 46 ; 9 à 10 rois et vague 120 à 130 pour 10 rois et
vague 128. L'enfant les bat « facilement » comme le fils : son cristal n'est presque jamais
touché après le premier roi. Ce qui ne colle pas :

- le « parent » est **bimodal** : un quart des parties tombent au premier tour (11 sur 48 :
  posés au hasard, deux alliés par camp ne suffisent pas toujours), les autres vont souvent à
  5 ou 6 rois. Le vrai parent a battu le premier roi ; on ne sait pas où il serait dans
  d'autres parties ;
- son cristal descend vers 50 avant un roi dans la moitié des parties : un peu plus de danger
  que ce que le parent a vu (« jamais en danger avant le roi ») ;
- **aucun « enfant » ne bat 11 rois** (0 sur 48) : le 11e roi est un mur (§ 5). Le fils, lui,
  est tombé à la 8e vague du 11e tour, avant ce roi : le simulé tombe plus souvent au roi (63 %
  des chutes) que pendant le tour.

Le joueur simulé qui ressemble au fils n'a pas besoin de plus que ce que l'écran permet. Ce
qu'il fait que les anciens joueurs ne faisaient pas : **poser ses alliés partout** (les
anciens ne connaissaient que 63 places ; un camp en tient environ 220), **réparer le
cristal**, **garder des soigneurs**, **rester un peu au camp** (10 s au lieu de 3 ; sans effet mesuré, § 5), et acheter
le plus grand allié : son camp finit plein de **tanks** (exemple, graine 20261110, camp avant
le 10e roi : 89 alliés dont 70 tanks, 8 médecins, 2 infirmiers, 3 archers ; forge, rente,
longue-vue, marché et miel au niveau 3).

## 4. Les anciens joueurs ne changent pas

Comparés avant et après, partie par partie, champ par champ (fichiers de résultats égaux) :

- **les modes** : `npm run balance:modes` en deux morceaux, 27 816 parties (grande
  aventure, 6 missions, 36 défis ; expert, moyen, petit), comparées aux résultats du lot A :
  **0 partie différente** ;
- **l'aventure sans fin des huit anciens joueurs** (expert, hasard, épargnant, dino, gros,
  massues, moyen, petit ; 40 parties chacun, jusqu'au 10e roi comme au lot A), jouées avec le
  script d'avant ce travail et celui d'après : **320 parties, 0 différente**.

Les colonnes nouvelles (vagues tendues, serpents vivants, vie des vagues…) ne s'ajoutent aux
anciens joueurs que si on les demande (`LOT_C=1`). Le moteur n'est pas touché : empreintes de
`tests/engine-traces.test.ts` inchangées (`npm test`). La limite par défaut passe de 6 à 15
rois : une mesure sans `ENDLESS_ROUNDS` va plus loin qu'avant, sans rien changer aux
parties.

## 5. Ce qui tient au 10e roi, et les défauts trouvés

### Ce que rien ne fait grandir avec les rois

Version 1 : à chaque roi, la vie des serpents ×1,45, leur morsure ×1,2, la prime de fin de
vague ×0,9 (`src/endless.ts:83-91`). Rien d'autre ne bouge. Après dix rois battus (11e tour),
un serpent a 41 fois sa vie (vague 11 : 6 861 PV au lieu de 167) et mord 6,2 fois plus fort
(vague 12 : 105 au lieu de 17) ; le 11e King Snake a 47 535 PV (1 157 pour le premier).

Côté camp, rien ne s'use : les alliés restent d'un tour à l'autre, sont soignés au camp, et
les pièces d'un tour restent à peu près les mêmes (enfant : 5 332 par tour, médiane) parce que
la moitié vient des serpents battus, payés 12 pièces chacun quel que soit le roi. Le camp
grandit donc **en ligne droite** (l'enfant peut acheter environ 17 tanks par tour au prix
du marché niveau 3 ; dans la partie suivie, son camp passe de 42 tanks au 4e roi à 70 au
9e), les serpents **en multipliant** : le mur arrive forcément, mais tard, et d'un coup, au roi.

### Ce qui tient vraiment au 10e roi (parties simulées de l'« enfant »)

On retire une chose à la fois au joueur « enfant » (24 parties chacun, mêmes graines,
jusqu'au 15e roi) :

| « enfant » (24 parties)                     | ≥ 1 roi | ≥ 5 rois | ≥ 8 rois | ≥ 10 rois | rois méd. (moy.) | vague méd. |
| ------------------------------------------- | ------: | -------: | -------: | --------: | ---------------: | ---------: |
| tel quel                                    |    92 % |     92 % |     88 % |      63 % |         10 (8,8) |        130 |
| **sans tank**                               |    96 % |     50 % |      0 % |       0 % |      **5** (4,2) |     **69** |
| **sans soigneur**                           |    29 % |     25 % |     25 % |      21 % |          0 (2,5) |         11 |
| **sans cadeau qui dure**                    |    88 % |     88 % |     17 % |       0 % |      **7** (6,0) |     **96** |
| sans miel ni encouragement                  |    92 % |     92 % |     92 % |      54 % |         10 (8,7) |        129 |
| sans longue-vue                             |    92 % |     92 % |     92 % |      79 % |         10 (9,0) |        131 |
| sans réparer le cristal                     |    92 % |     92 % |     92 % |      67 % |         10 (8,9) |        130 |
| 3 s au camp au lieu de 10                   |    88 % |     88 % |     88 % |      71 % |         10 (8,6) |        130 |
| 30 s au camp                                |    79 % |     79 % |     79 % |      58 % |         10 (7,7) |        130 |
| le cristal perd 9 × la hausse de la morsure |    92 % |     92 % |     88 % |      63 % |         10 (8,8) |        129 |
| bourse plafonnée à 1 500 (40 parties)       |    95 % |     95 % |     93 % |      60 % |         10 (9,1) |        130 |

Et pour le « parent » (48 parties, jusqu'au 10e roi) : tel quel 4 rois (moyenne 3,25), vague
57 ; sans réparer 3 rois (2,7), vague 44 ; sans miel ni encouragement 3 rois (2,9), vague
48 ; 3 s au camp, cristal ×1,2 par roi ou bourse plafonnée à 1 500 : rien ne bouge (4 rois,
vague 57 à 60).

**Ce qui tient au 10e roi, dans l'ordre** : les **tanks** (sans eux, 5 rois au lieu de 10) ;
les **cadeaux qui durent** (forge, armure, rente, marché… : 7 rois sans eux) ; les
**soigneurs**, surtout au premier tour (sans eux, 7 parties sur 10 tombent avant le premier
roi, mais celles qui le passent vont quand même au 10e). Le miel, l'encouragement, la
longue-vue, le temps passé au camp et les réparations ne changent presque rien pour
l'enfant : son cristal n'est presque jamais touché avant le roi. Le cristal qui perdrait plus
à chaque roi ne change rien non plus : dans ces parties, presque aucun serpent n'entre, sauf
le roi, qui fait 100 d'un coup.

### Les défauts, avec leur preuve

Chaque défaut : où il est, la preuve, ce qu'il fait à la partie. **Rien n'est corrigé** :
on décidera avec le parent.

1. **Le cristal ne sent pas les rois.** `src/engine/enemyTurn.ts:40` et `:158` : un serpent
   qui entre fait toujours 9 (`CRYSTAL_DAMAGE`), la morsure ×1,2 par roi ne le touche
   jamais. Preuve (le vrai moteur, vague 1 sans aucun allié, 7 serpents entrent) : 9 par
   entrée et cristal à 37 avec 0, 1, 5 ou 10 rois, alors que la morsure passe de 7 à 43.
   C'est bien ce que le parent a vu. Effet : il faut toujours 12 entrées pour faire tomber
   un cristal plein, au 1er tour comme au 10e. Mesuré : faire perdre au cristal 9 fois la
   hausse de la morsure ne change rien (enfant 10 rois, parent 4 rois) : dans ces parties
   presque aucun serpent n'entre avant le roi. Le défaut est réel mais ne compterait qu'avec
   une courbe plus tendue (§ 6).
2. **Réparer coûte 80 pièces, toujours, et se fait aussi pendant la vague.**
   `src/gameConstants.ts:29-30` (80 pièces, 25 points), `src/game.ts:536` (aucune condition
   sur la vague ni attente), `src/ui/campToolModel.ts:80` (le bouton est prêt pendant la
   vague). Calcul : 80 pièces rachètent presque 3 entrées de serpent ; un tour rapporte
   environ 5 000 pièces. Le stock médian du « parent » (1 695) paie 21 réparations, soit
   525 points de cristal ou 58 serpents entrés. Effet : **seul le roi** (100 d'un coup,
   `enemyTurn.ts:41`) peut faire tomber un camp qui a des pièces ; c'est la falaise que le
   conseil décrivait (56 à 63 % des chutes au roi). Mesuré : sans réparer, le « parent »
   passe de 4 à 3 rois (vague 57 → 44) ; l'enfant ne change pas.
3. **Le roi : même vitesse, même coup fatal, vie ×1,45.** `src/engine/damage.ts:23` (le roi
   marche à 0,8 de sa vague), `src/data.ts:294` (la vitesse de la vague ne monte plus après
   la vague 9), `src/engine/enemyTurn.ts:41` (100 au cristal). Du bout des ponts au cristal,
   424 pas à 41 pas par seconde : environ 10 secondes de tir, au 1er roi comme au 11e, pour
   tuer 1 157 PV (1er roi), 32 783 (10e roi), 47 535 (11e roi). Effet : **le mur du 11e roi**
   (aucun « enfant » ne le passe en 48 parties) ; la partie finit d'un coup au lieu de se
   durcir.
4. **Les pièces ne baissent presque pas.** `src/engine/outcome.ts:17` (12 pièces par
   serpent, quel que soit le roi), `:63` et `src/boons.ts:28` (la rente : 40 par niveau et
   par vague, jamais ×0,9) ; seule la prime suit les rois (`src/endless.ts:89`). Calcul : les
   primes d'un tour passent de 2 814 à 984 pièces après dix rois, mais la rente au niveau 3
   donne 1 440 pièces par tour, toujours ; l'enfant gagne 5 332 pièces par tour (médiane).
   La bourse n'a pas de limite qui compte (`GOLD_LIMIT` = 10 millions,
   `src/gameConstants.ts:49`). Effet : le camp grandit sans fin ; c'est ce qui permet au
   fils d'aller si loin. Mesuré : une bourse plafonnée à 1 500 ne change rien au parent ni
   à l'enfant (leur argent est dépensé) ; elle retire un roi à « gros » (9 → 8, son stock
   montait à 4 584). Sans les cadeaux qui durent (dont la rente et le marché), l'enfant
   s'arrête à 7 rois.
5. **Le soigneur du roi soigne 35, quel que soit le roi.** `src/bossCourt.ts:19`. Ses six
   soins (210 PV) font 18 % de la vie du roi au premier tour, 0,4 % au 11e roi. Effet :
   l'escorte du fils (`docs/MODE-INFINI.md`) ne compte plus.
6. **Le crachat du roi fait 18, quel que soit le roi.** `src/balanceTuning.ts:26`, lu par
   `src/engine/court.ts:138`. Au premier tour, environ une morsure de la vague 12 ; au 11e
   roi, 0,17 morsure. Effet : la tête qui crache ne fait plus peur.
7. **La riposte des serpents royaux et des mambas reste 2 et 3 PV.**
   `src/enemyAbilities.ts:12`. Effet faible, mais même famille de défaut.
8. **La règle du fils « la voie la moins défendue » s'efface à chaque roi.** `src/ai.ts:42`
   (12 % à la vague 1, 86 % dès la vague 6), lue avec `game.wave`
   (`src/engine/movement.ts:36`), qui revient à 0 après le roi (`src/engine/outcome.ts:89`).
   Même cause : les œufs repartent à un (`src/waves.ts:9-10`), les spécialistes et les
   nouveaux serpents disparaissent en début de tour (`src/waves.ts:89-122`). Mesuré : la
   première vague d'un tour pèse **0,14** fois la 11e du tour d'avant, pour tous les joueurs.
   Effet : six vagues sans danger à chaque tour (déjà noté par le conseil ; c'est ce que F1
   corrige, § 6).
9. **La lecture des voies ne voit pas les cadeaux.** `src/ai.ts:17-23` compte la force des
   alliés avec leurs coups et leur portée de base : ni la forge, ni l'armure, ni la
   longue-vue. Effet faible : les serpents se trompent un peu de voie face à des tireurs qui
   voient 30 % plus loin.
10. **Les tanks : portée, longue-vue et souffle complet.** `src/data.ts:249` (portée 240),
    `src/engine/allies.ts:152` (la longue-vue au niveau 3 : 312, pour un camp de 384 de
    large), `src/engine/allies.ts:40` (souffle de 75), `src/balanceTuning.ts:31`
    (`splashSecondaryFactor: 1` : chaque serpent du souffle prend tout le coup). Un tank posé
    près du cristal touche un serpent dès le bout des ponts, avant qu'il puisse mordre ; une
    vague a toujours ses 20 serpents, souvent groupés : un obus en touche plusieurs. La forge
    s'applique à chacun. Ce n'est pas une erreur de code, mais c'est **ce qui tient** le camp
    du simulé (sans tank : 5 rois au lieu de 10, vague 69 au lieu de 130). Valeur à regarder
    avec le parent.
11. **Les soigneurs soignent au camp aussi longtemps qu'on attend.** `src/game.ts:562-578`
    (le pas du moteur fait jouer les alliés au camp aussi), `src/session.ts:108` (l'horloge
    avance au camp). Effet : chaque vague commence avec un camp presque soigné ; le temps
    est gratuit. Mesuré : 3, 10 ou 30 secondes au camp ne changent pas le nombre de rois de
    l'enfant (10) ni du parent (4) : défaut réel, effet faible ici.
12. **Le camp n'a pas d'autre limite que la place.** Environ 220 alliés tiennent dans le camp
    (mesuré sur les trois cartes ; la sauvegarde en accepte 512, `src/checkpointUnits.ts:16`).
    Rien ne coûte à garder, rien ne se perd entre deux tours sauf les alliés tués. Ce n'est
    pas un défaut des règles du fils (pas de résurrection), mais c'est la raison du point 4.

Pas de défaut trouvé dans les cadeaux eux-mêmes : chaque cadeau s'arrête au niveau 3
(`src/boons.ts:18`), cinq places, et la forge et l'armure ne se cumulent pas au-delà de
+45 %. Le cristal solide (+15 par vague au niveau 3) rachète près de deux entrées par vague,
gratuitement : même famille que le point 2.

## 6. Lot C : F1 et F1b mesurées (rien n'est codé pour les joueurs)

Les deux formules du conseil, jouées par le script (`ENDLESS_FORMULA=F1|F1b`), **sans rien
coder pour les joueurs** : `src/endless.ts` et le moteur ne changent pas. Dès le deuxième
tour, la vague w du tour se joue comme la vague min(11, 6 + ⌈w/2⌉) : 7, 7, 8, 8, 9, 9, 10,
10, 11, 11, 11, puis King Snake. Le script fait jouer au moteur la vague correspondante, puis
remet le numéro de la vague du tour : tout ce qui suit la vague suit donc la correspondance
(nombre, vie, morsure, vitesse, prime, spécialistes, nouveaux serpents, œufs, intelligence des
voies) ; les cadeaux restent après les vagues 4 et 8 du tour. Jamais plus de 18 serpents par
vague avant le roi, œufs à part (20 au roi, comme aujourd'hui). F1 : ×1,45 / ×1,2 par roi ;
F1b : ×1,35 / ×1,15 ; pièces ×0,9 dans les deux. 40 parties par joueur, jusqu'au 15e roi (pour « parent »
et « enfant » en v1 : les 40 premières parties du calibrage, mêmes graines).

| Joueur    | Formule | parties | ≥ 1 roi |  ≥ 3 |  ≥ 5 |  ≥ 8 | ≥ 10 | rois moy. | vague méd. | sans dégât après le 1er roi | tendues | chutes au roi | début ÷ vague 11 | vivants au plus |
| --------- | ------- | ------: | ------: | ---: | ---: | ---: | ---: | --------: | ---------: | --------------------------: | ------: | ------------: | ---------------: | --------------: |
| expert    | v1      |      40 |    90 % | 70 % |  3 % |  0 % |  0 % |       2,9 |         48 |                        93 % |     4 % |          65 % |             0,14 |              26 |
| expert    | F1      |      40 |    90 % | 43 % |  0 % |  0 % |  0 % |       2,2 |         36 |                        89 % |     7 % |          33 % |             0,78 |              26 |
| expert    | F1b     |      40 |    90 % | 60 % | 30 % |  0 % |  0 % |       3,1 |         56 |                        91 % |     6 % |          38 % |             0,73 |              26 |
| dino      | v1      |      40 |    85 % | 63 % |  0 % |  0 % |  0 % |       2,6 |         47 |                        92 % |     5 % |          63 % |             0,14 |              26 |
| dino      | F1      |      40 |    85 % | 20 % |  0 % |  0 % |  0 % |       1,7 |         32 |                        87 % |     8 % |          43 % |             0,78 |              25 |
| dino      | F1b     |      40 |    85 % | 48 % |  5 % |  0 % |  0 % |       2,4 |         36 |                        89 % |     8 % |          35 % |             0,73 |              25 |
| gros      | v1      |      40 |    85 % | 85 % | 85 % | 80 % |  0 % |       7,3 |        118 |                        99 % |     0 % |          88 % |             0,14 |              26 |
| gros      | F1      |      40 |    85 % | 85 % | 85 % | 85 % |  3 % |       7,5 |        119 |                        98 % |     1 % |          70 % |             0,78 |              26 |
| gros      | F1b     |      40 |    85 % | 85 % | 85 % | 85 % | 85 % |       9,6 |        144 |                        98 % |     1 % |          60 % |             0,73 |              26 |
| hasard    | v1      |      40 |    68 % | 30 % |  3 % |  0 % |  0 % |       1,6 |         23 |                        81 % |    16 % |          28 % |             0,14 |              26 |
| hasard    | F1      |      40 |    68 % |  8 % |  3 % |  0 % |  0 % |       1,0 |         15 |                        64 % |    28 % |          20 % |             0,78 |              26 |
| hasard    | F1b     |      40 |    68 % | 15 % |  8 % |  0 % |  0 % |       1,3 |         16 |                        66 % |    28 % |          28 % |             0,73 |              26 |
| epargnant | v1      |      40 |    35 % | 15 % | 10 % |  0 % |  0 % |       0,9 |         11 |                        79 % |    18 % |          20 % |             0,14 |              26 |
| epargnant | F1      |      40 |    35 % | 10 % |  8 % |  0 % |  0 % |       0,7 |         11 |                        71 % |    23 % |          13 % |             0,78 |              26 |
| epargnant | F1b     |      40 |    35 % |  8 % |  8 % |  0 % |  0 % |       0,8 |         11 |                        78 % |    16 % |          18 % |             0,73 |              26 |
| parent    | v1      |      40 |    78 % | 63 % | 43 % |  0 % |  0 % |       3,3 |         57 |                        89 % |     9 % |          58 % |             0,14 |              26 |
| parent    | F1      |      40 |    78 % | 45 % | 23 % |  0 % |  0 % |       2,4 |         33 |                        77 % |    20 % |          45 % |             0,78 |              26 |
| parent    | F1b     |      40 |    78 % | 50 % | 40 % |  5 % |  0 % |       3,4 |         48 |                        85 % |    13 % |          35 % |             0,73 |              26 |
| enfant    | v1      |      40 |    95 % | 95 % | 95 % | 93 % | 60 % |       9,1 |        130 |                        99 % |     0 % |          63 % |             0,14 |              26 |
| enfant    | F1      |      40 |    95 % | 93 % | 93 % | 93 % | 73 % |       9,1 |        129 |                        98 % |     1 % |          46 % |             0,78 |              26 |
| enfant    | F1b     |      40 |    95 % | 93 % | 93 % | 93 % | 93 % |      11,5 |        156 |                        99 % |     1 % |          38 % |             0,73 |              26 |

« sans dégât » et « tendues » : parmi les vagues jouées après le premier roi, celles où le
cristal n'a rien perdu, et celles où il a perdu mais n'est pas tombé. « Chutes au roi » :
parmi les parties perdues, celles perdues à la vague du roi. « Début ÷ vague 11 » : la vie de
tous les serpents de la première vague d'un tour (œufs compris), divisée par celle de la 11e
vague du tour d'avant (médiane). « Vivants au plus » : le plus de serpents vivants en même
temps sur le plateau (le plafond de performance du conseil est 25 à 30).

**La bourse plafonnée à 1 500** (colonne à part, comme demandé ; pas une recommandation
seule) :

| Joueur    | Formule |      parties | ≥ 1 roi |  ≥ 3 |  ≥ 5 |  ≥ 8 | ≥ 10 | rois moy. | vague méd. | sans dégât après le 1er roi | tendues | chutes au roi | début ÷ vague 11 | vivants au plus |
| --------- | ------- | -----------: | ------: | ---: | ---: | ---: | ---: | --------: | ---------: | --------------------------: | ------: | ------------: | ---------------: | --------------: |
| expert    | v1      |           40 |    90 % | 70 % |  3 % |  0 % |  0 % |       3,0 |         56 |                        93 % |     5 % |          40 % |             0,14 |              26 |
| expert    | F1      |           40 |    90 % | 43 % |  0 % |  0 % |  0 % |       2,1 |         36 |                        89 % |     7 % |          40 % |             0,78 |              26 |
| expert    | F1b     |           40 |    90 % | 60 % | 20 % |  0 % |  0 % |       3,0 |         54 |                        92 % |     6 % |          35 % |             0,73 |              26 |
| epargnant | v1      |           40 |    38 % | 10 % |  0 % |  0 % |  0 % |       0,7 |         11 |                        73 % |    22 % |          23 % |             0,14 |              26 |
| epargnant | F1      |           40 |    38 % |  5 % |  0 % |  0 % |  0 % |       0,6 |         11 |                        54 % |    37 % |          15 % |             0,78 |              26 |
| epargnant | F1b     |           40 |    38 % | 10 % |  0 % |  0 % |  0 % |       0,6 |         11 |                        53 % |    39 % |          15 % |             0,73 |              26 |
| gros      | v1      |           40 |    85 % | 85 % | 85 % | 78 % |  0 % |       7,1 |        108 |                        98 % |     1 % |          70 % |             0,14 |              26 |
| gros      | F1      |           40 |    85 % | 85 % | 85 % | 78 % |  0 % |       7,1 |        108 |                        97 % |     2 % |          70 % |             0,78 |              26 |
| gros      | F1b     |           40 |    85 % | 85 % | 85 % | 85 % | 83 % |       8,9 |        132 |                        98 % |     1 % |          73 % |             0,73 |              26 |
| parent    | v1      |           40 |    78 % | 63 % | 40 % |  0 % |  0 % |       3,2 |         59 |                        89 % |     9 % |          50 % |             0,14 |              26 |
| parent    | F1      |           40 |    78 % | 45 % | 13 % |  0 % |  0 % |       2,2 |         36 |                        74 % |    22 % |          48 % |             0,78 |              26 |
| parent    | F1b     |           40 |    78 % | 48 % | 28 % |  0 % |  0 % |       2,8 |         36 |                        84 % |    14 % |          48 % |             0,73 |              26 |
| enfant    | v1      |           40 |    95 % | 95 % | 95 % | 93 % | 60 % |       9,1 |        130 |                        99 % |     0 % |          63 % |             0,14 |              26 |
| enfant    | F1      |           40 |    95 % | 93 % | 93 % | 93 % | 73 % |       9,1 |        129 |                        98 % |     1 % |          46 % |             0,78 |              26 |
| enfant    | F1b     | (pas mesuré) |

L'enfant avec F1b et la bourse plafonnée n'a pas été mesuré (arrêté faute de temps) : en v1
et en F1, la bourse plafonnée ne change aucune de ses parties (sa bourse ne dépasse presque
jamais 1 500).

**Lecture pour le parent** (des faits ; le choix est le sien) :

1. **Le retour à zéro disparaît avec les deux formules** : le début d'un tour pèse 0,78 (F1)
   ou 0,73 (F1b) de la fin du tour d'avant, au lieu de 0,14. Jamais plus de 26 serpents
   vivants en même temps, comme aujourd'hui (le pic reste la vague du roi).
2. **La falaise du roi s'adoucit** : les chutes se répartissent dans le tour au lieu de
   tomber au roi (expert : 65 % des chutes au roi en v1, 33 % en F1, 38 % en F1b ; parent :
   58 %, 45 %, 35 %).
3. **Pour les joueurs moyens, F1 est plus dure ; F1b est aussi dure en moyenne, mais laisse
   aller plus loin ceux qui tiennent** : expert 2,9 rois en moyenne (v1), 2,2 (F1), 3,1
   (F1b), et 5 rois dans 3 %, 0 %, 30 % des parties ; « parent » 3,3, 2,4, 3,4 ; le « hasard »
   perd ses parties longues (30 % passent 3 rois en v1, 8 % en F1, 15 % en F1b).
4. **Pour les camps forts, aucune des deux ne rend la partie moins plate.** « gros » et
   « enfant » ne prennent presque aucun dégât après le premier roi avec les trois règles
   (97 à 99 % des vagues). Pire : **F1b les fait aller plus loin** (gros 9 → 11 rois, enfant
   10 → 12 rois), parce que ×1,35 grandit bien moins vite que ×1,45 (après 10 rois : ×20 au lieu
   de ×41) et parce que les vagues jouées rapportent environ 1 000 pièces de plus par tour
   (plus de serpents, plus grosses primes : gros 5 160 → 6 214 pièces par tour). F1 laisse
   « gros » à 9 rois et l'enfant à 10 rois (9,1 en moyenne, vague 129).
5. **Le parent seul voit plus de tension** : vagues sans dégât après le premier roi 89 % (v1),
   77 % (F1), 85 % (F1b) ; vagues tendues 9 %, 20 %, 13 %.
6. **La bourse plafonnée à 1 500 ne change presque rien** à ceux qui dépensent (expert,
   parent et enfant en v1 et en F1) ; elle retire un roi à « gros » (v1 9 → 8, F1b 11 → 10)
   et un peu au « parent » en F1b (3,4 → 2,8 rois en moyenne : avec F1b sa bourse monte plus
   haut) ; l'épargnant, déjà faible, le reste.

Ce que la mesure dit au fond : **le retour à zéro n'est pas ce qui rend la partie facile pour
un camp fort**. Ce qui le tient, ce sont les tanks, les cadeaux qui durent et des pièces qui ne
baissent presque pas (§ 5). Pour qu'un enfant comme le fils sente la difficulté monter, il
faudrait aussi toucher à l'un des défauts du § 5 (prime et rente qui suivent les rois, roi
plus rapide ou plus coriace, souffle des tanks) ; aucune de ces pistes n'est mesurée ici, et
aucune valeur n'est proposée. Pour garder la correspondance sans enrichir les joueurs, une
vraie version 2 pourrait payer la prime de la vague du tour plutôt que celle de la vague
jouée : pas mesuré non plus.

## 7. Lire la sauvegarde de la partie du fils

Script hors dépôt :
`/tmp/claude-0/-home-user-snakeattak/cd04658d-0599-532b-bf9f-867d6072b28e/scratchpad/lire-sauvegarde.mjs`
(à recopier ailleurs si on veut le garder : ce dossier peut être effacé).

```
node --experimental-strip-types lire-sauvegarde.mjs <export.json>          # en mots
node --experimental-strip-types lire-sauvegarde.mjs <export.json> --json   # en données
node --experimental-strip-types lire-sauvegarde.mjs --fabriquer <sortie.json> [rois]
```

Il lit l'export avec les lecteurs du jeu (`readFamilyBackup`, puis `salvageFamilyBackup` si
un camp est illisible), cherche l'aventure sans fin dans le camp en cours ou le camp
classique gardé sous une mission, et montre : règles et réglage, rois, vague (du tour et
depuis la première), pièces, cristal, garde du cristal, héros et entraînement, cadeaux et
niveaux (en mots), cadeau en attente, alliés par sorte (nombre, prix de base, vie), alliés
devant chaque voie, valeur du camp, et la force de la prochaine vague. Les records du
fichier (version 6 ou 7) sont listés. Rien n'est écrit, rien ne part sur le réseau.

Essayé sur un export fabriqué par le script lui-même (`--fabriquer`, deux rois ; la bourse
de cette partie automatique est remplie à 2 500 pièces à chaque camp : c'est un fichier
d'essai, pas une vraie partie), sur un fichier vide (« Ce fichier n'est pas un export
familial que le jeu sait lire. ») et sur un export dont le camp est une grande aventure
(« Aucune aventure sans fin en cours »). Un camp n'est gardé qu'entre deux vagues : l'export
montre le camp du dernier camp atteint.

## Comment c'est vérifié

- `npx tsc --noEmit`, `npm test` (1 092 tests, dont les empreintes de
  `tests/engine-traces.test.ts`, inchangées), `npx prettier --check . '!.claude/**'`,
  `npm run build`. Aucune recette navigateur : rien d'affiché n'a changé.
- Anciens joueurs : 27 816 parties des modes et 320 parties sans fin comparées avant et
  après, champ par champ : identiques (§ 4).
- Les joueurs nouveaux rejouent les mêmes parties d'un passage à l'autre : les 24 parties
  « enfant » tel quel de la mesure du § 5 sont identiques, champ par champ, aux 24 premières
  du calibrage du § 3.
- Les 9 dégâts au cristal : vérifiés sur le vrai moteur (vague 1, aucun allié, 0, 1, 5 et 10
  rois).
- Le lecteur de sauvegarde : essayé sur trois fichiers fabriqués (§ 7).
- Mesures : 48 parties par joueur pour le calibrage, 24 (enfant) ou 48 (parent) par retrait
  du § 5, 40 par joueur et par formule au § 6 ; temps de calcul total environ 5 heures sur
  4 processeurs. Fichiers de résultats hors dépôt
  (`/tmp/claude-0/-home-user-snakeattak/cd04658d-0599-532b-bf9f-867d6072b28e/scratchpad/`,
  dossiers `calF`, `abl`, `lotc`).

Pour refaire les mesures :

```
ENDLESS=1 CLASSIC=48 PROFILES=parent,enfant npm run balance:modes -- sortie.json
ENDLESS=1 CLASSIC=24 PROFILES=enfant REAL_SKIP_KINDS=tank npm run balance:modes -- sortie.json
ENDLESS=1 LOT_C=1 CLASSIC=40 ENDLESS_FORMULA=F1b PROFILES=expert npm run balance:modes -- sortie.json
```

## Pas vérifié

- **Rien n'a été essayé sur un vrai téléphone ni avec un enfant.** Les joueurs « parent » et
  « enfant » sont des modèles, réglés sur **une seule partie de chaque** (dites par le
  parent) : la moyenne tombe juste, mais une partie unique ne dit pas la forme de la
  distribution.
- On ne sait pas ce que le fils achète vraiment. L'« enfant » achète le plus grand allié
  qu'il peut payer : son camp finit plein de tanks. Si le fils joue autrement (dinosaures,
  ninjas…), ce qui tient au 10e roi peut être autre chose. La sauvegarde de sa partie le dira
  (§ 7).
- Le temps passé au camp (10 s) est une estimation ; 3 ou 30 s ne changent presque rien
  dans la mesure (§ 5).
- 24 à 48 parties par mesure : ± 10 à 15 points sur un pourcentage.
- F1 et F1b sont jouées par le script (le moteur joue la vague correspondante, puis le script
  remet le numéro de la vague) : la carte (trois rochers) suit la vague jouée, et non la vague
  du tour comme le ferait une vraie version 2. Le reste suit la correspondance (nombre, vie,
  morsure, vitesse, prime, spécialistes, nouveaux serpents, œufs, intelligence des voies).
- Interface anglaise non regardée (rien d'affiché n'a changé).
