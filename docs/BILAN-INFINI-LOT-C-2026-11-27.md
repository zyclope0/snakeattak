# L'aventure sans fin, lot C : F1 codée, quatre pistes mesurées (27 novembre 2026)

Décisions du parent du 27 novembre, après le [bilan du simulateur](BILAN-INFINI-SIMULATEUR-2026-11-27.md) :

1. coder F1 sur la branche, sans fusionner ni publier ; F1b est écartée ;
2. mesurer par-dessus F1 quatre pistes, seules puis ensemble : (a) des pièces qui baissent
   avec les rois, (b) un cristal qui sent les rois, (c) un roi plus rapide, (d) le souffle des
   tanks — **sans rien changer aux tanks dans le jeu** (c'est une idée du fils) ;
3. trois objectifs, avec des joueurs simulés calés sur les vraies parties ;
4. un seul tableau.

Branche `claude/infini-lot-c`, partie de `707d0d8`, ni poussée ni fusionnée. **Aucune valeur
n'est décidée ici : c'est au parent.**

## En bref

- **La sauvegarde du fils** : 7 rois, vague 85, 48 alliés dont 15 bébés dragons et 13
  soigneurs, les cinq cadeaux (cristal solide, marché, longue-vue, forge, armure) au niveau 3,
  3 342 pièces gardées. Son camp tient par les dragons et leur souffle complet, les soigneurs,
  et +45 % aux coups et à la vie (§ 1). Pas surtout par les tanks, comme le croyait le
  simulateur.
- **Un joueur simulé « fils »** achète comme lui. Calé en v1 : 9 rois en médiane (le fils : 7
  dans une partie en cours, 10 dans l'autre), cristal presque jamais touché, des milliers de
  pièces gardées ; mais deux fois trop d'alliés (93 au 7e roi contre 48), et jamais 10 rois
  (§ 2).
- **F1 est codée** comme règles sans fin version 2 dans le jeu, à côté de la version 1 ; la
  carte suit la vague du tour. Une partie v1 reste v1 ; **une nouvelle partie reste en v1**
  tant que le parent n'a pas choisi (§ 3). Empreinte « sans fin v2 » identique sous Node 22
  et 24 ; toutes les autres inchangées.
- **Les quatre pistes** sont dans le script seulement (§ 4). Le premier tour ne change pour
  personne.
- **Résultat** (§ 5 à 7) : F1 codée est bien plus dure pour les joueurs moyens que le F1 du
  script (le parent simulé : 1,3 roi au lieu de 3,3 en v1 ; il tombe souvent au début du 2e
  tour). Pour le parent, les vagues 7 à 12 touchent le cristal 43 % du temps (v1 : 20 %),
  jamais une sur deux, quelle que soit la piste. Pour le fils, le cristal qui sent les rois
  (b) déplace la chute du roi vers le tour (93 % → 38 % de chutes au roi), mais son cristal
  reste presque toujours intact pendant le tour. **Meilleure combinaison essayée : F1 + (a)
  pièces + (b) cristal. Aucune combinaison n'atteint les trois objectifs.**
- Aucune règle n'entre dans les parties des joueurs, aucune valeur n'est choisie.

## 1. La sauvegarde du fils

Lue avec le lecteur du jeu (`readFamilyBackup`, `decodeCheckpoint`), sans rien exécuter qui
vienne du fichier. Ce n'est pas la partie de la vague 128 : ses records sont **84 · 7 rois** et
**60 · 5 rois**. Le camp gardé est celui d'une partie en cours : 7 rois battus, vague 85 (la
1re du 8e tour), règles version 1.

| Quoi               | Dans la sauvegarde                                                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pièces             | 3 342, non dépensées                                                                                                                                                            |
| Cristal            | 100 sur 100, garde du cristal 27                                                                                                                                                |
| Héros              | tombé, jamais entraîné                                                                                                                                                          |
| Cadeaux            | cristal solide, marché, longue-vue, forge, armure, tous au niveau 3 (pas la rente)                                                                                              |
| Alliés             | 48, valeur 10 945 pièces au prix de base ; haut 18, centre 16, bas 12                                                                                                           |
| Par sorte          | 15 bébés dragons, 9 infirmiers, 6 tanks, 4 médecins, 3 tricératops, 2 archers, 2 chevaliers à deux têtes, 2 T-rex, 1 chevalier, 1 stégosaure, 1 spinosaure, 1 bouclier, 1 ninja |
| Où ils se tiennent | de x 600 à 1 000 ; les dragons plutôt devant, les tanks et les soigneurs plutôt derrière                                                                                        |

**Ce qui rendait son camp fort, en chiffres** (règles du jeu, rien de mesuré ici) :

- **Les bébés dragons et leur souffle complet.** Un dragon crache 34 toutes les 1,2 s sur un
  cercle de 65 autour de sa cible, et chaque serpent du cercle prend **tout** le coup
  (`splashSecondaryFactor` 1, `src/balanceTuning.ts`). Avec la forge niveau 3 : 49 par serpent.
  Il coûte 210 pièces (révision 2), 147 avec le marché niveau 3 : c'est l'allié qui fait le
  plus de dégâts par pièce, plus que le tank (70 toutes les 1,9 s pour 308 pièces). Le fils en
  a 15 : à lui seul, le défaut 10 du bilan d'avant (souffle complet) vaut aussi pour eux.
- **La longue-vue niveau 3** : +30 % de portée pour tout allié qui tire de loin. Un dragon
  porte à 215 au lieu de 165, un tank à 312 au lieu de 240, un archer à 273.
- **La forge et l'armure niveau 3** : +45 % aux coups et +45 % à la vie de chaque allié.
- **13 soigneurs pour 35 combattants** (un pour 2,7) : chaque vague commence avec un camp
  presque soigné (défaut 11 du bilan d'avant).
- **Le cristal solide niveau 3** : +15 après chaque vague, presque deux entrées de serpent
  rachetées gratuitement ; son cristal est à 100.
- **Le marché niveau 3** : tout coûte 30 % de moins.

Ce que le simulateur ne savait pas avant cette sauvegarde : le fils n'achète pas surtout des
tanks (le joueur « enfant » finissait avec 70 tanks sur 89 alliés), mais surtout des dragons,
beaucoup de soigneurs, quelques tanks et dinosaures ; et il garde des milliers de pièces.

## 2. Un joueur simulé « fils »

Dans `scripts/balance-modes.mjs` (`PROFILES=fils`), avec sa propre graine ; « enfant » ne
change pas. Il ne fait que ce que l'écran permet :

- **achats** : le mélange de la sauvegarde, tiré au hasard avec les mêmes parts (dragon 15,
  tank 6, tricératops 3, T-rex 2, chevalier à deux têtes 2, archer 2, stégosaure,
  spinosaure, chevalier, bouclier, ninja 1), parmi les alliés ouverts ; un soigneur dès qu'il
  y a plus de 2,7 combattants par soigneur (infirmiers et médecins comme 9 pour 4). Il garde
  l'allié qu'il veut jusqu'à pouvoir le payer (il économise pour lui) ;
- **combien** : 2 alliés par camp en moyenne (`FILS_BUYS`), jusqu'à 3 d'un coup après des
  camps d'économie ; un de plus quand le cristal est touché pendant la vague ; **après le
  premier roi, il garde 2 500 pièces** (`FILS_KEEP`) ;
- **places** : devant la voie qui a le moins d'alliés ; mêlée vers x 690, dragons vers 740,
  soigneurs vers 820, tanks et archers vers 880, largement dispersés (sa sauvegarde) ;
- **cadeaux** : il reprend ceux qu'il a, sinon cristal solide, marché, longue-vue, forge,
  armure, dans cet ordre ; jamais la rente ; sinon une carte « une fois » ;
- **le reste** : il n'entraîne jamais le héros (sa sauvegarde : « tombé », jamais entraîné) ;
  il répare le cristal jusqu'en haut au camp, et sous 75 pendant la vague ; miel collant et
  encouragement comme l'« enfant », mais **à la vague du roi il les garde pour King Snake**
  (miel sur la voie du roi quand il arrive sur les ponts, encouragement quand il entre dans
  le camp) ; 10 s au camp.

Réglages essayés (16 parties chacun, règles v1, jusqu'au 15e roi) :

| Essai                                                                   | rois méd. (moy.) | vague méd. | alliés au 7e roi | pièces au 7e roi | morts par partie |
| ----------------------------------------------------------------------- | ---------------: | ---------: | ---------------: | ---------------: | ---------------: |
| 0,5 allié par camp (aussi au 1er tour)                                  |          3 (2,9) |         48 |    14 (1 partie) |            8 071 |               25 |
| 1 allié par camp (aussi au 1er tour)                                    |          8 (6,6) |        108 |               65 |           15 835 |              100 |
| 1,5 allié par camp, roi gardé                                           |          8 (7,9) |        108 |               84 |            9 707 |              142 |
| 2 alliés par camp                                                       |          9 (7,9) |        119 |               95 |            4 324 |              198 |
| 3 alliés par camp                                                       |          9 (8,1) |        118 |               98 |            3 442 |              207 |
| **2 alliés par camp, miel et encouragement gardés pour le roi (gardé)** |      **9 (8,7)** |    **120** |           **94** |        **4 621** |          **202** |

Avec 0,5 allié par camp, 6 parties sur 16 tombent au premier tour : le fils, lui, a gagné la
grande aventure avant d'ouvrir l'aventure sans fin. D'où 2 alliés par camp au premier tour.

**Calage, 40 parties, règles v1** (les 40 parties « v1 » du tableau du § 5) :

| Mesure                                          | Parties du fils                                              | « fils » simulé                                 |
| ----------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| Rois battus                                     | 7 (partie en cours, record 84) ; 10 (partie de la vague 128) | médiane 9, moyenne 8,55 (q1 8, q3 9, max 9)     |
| Vague atteinte                                  | 85 (en cours) ; 128                                          | médiane 119, moyenne 114 (q1 108, q3 120)       |
| Au moins 7 rois / au moins 10 rois              | oui / une fois                                               | 98 % / 0 %                                      |
| Vagues sans dégât au cristal après le 1er roi   | cristal 100 à la vague 85                                    | 98 %                                            |
| Cristal le plus bas avant un roi (après le 1er) | —                                                            | médiane 100 (21 parties sur 40 : jamais touché) |
| Alliés au 7e roi                                | 48 (vague 85)                                                | médiane 93 (q1 90, q3 97)                       |
| Pièces au 7e roi                                | 3 342 (vague 85)                                             | médiane 4 300 (q1 3 380, q3 5 361)              |
| Cadeaux                                         | les cinq au niveau 3                                         | les cinq au niveau 3 dans 36 parties sur 40     |
| Chute au roi (parmi les chutes)                 | non (vague 128 = 8e vague du 11e tour)                       | 82 %                                            |

**Lecture.** Le « fils » retrouve le fils sur les rois (entre 7 et 10), la vague, le cristal
presque jamais touché, les cadeaux et les milliers de pièces gardées. **Deux écarts** :

- **il a deux fois plus d'alliés** au 7e roi (93 contre 48). Avec moins d'alliés, il tombe
  plus tôt (65 alliés : 8 rois, et 15 835 pièces non dépensées). Le vrai fils fait autant avec
  la moitié : il place ou garde mieux ses alliés que le modèle. Le simulé en perd beaucoup
  (environ 200 par partie, surtout des dragons placés devant ; ses tanks, derrière, restent :
  à sa chute, il a en moyenne 9,5 tanks et 6,7 dragons) ;
- **il ne passe jamais le 10e roi** (0 sur 40), alors que le fils a battu 10 rois une fois. Il
  tombe surtout au roi (82 %), le fils dans le tour.

Ce sont des modèles calés sur deux parties : les rois et le cristal tombent juste, la taille
du camp non.

## 3. F1 codée : les règles sans fin version 2

Dans le jeu, à côté de la version 1, qui ne change pas.

- **`src/endless.ts`** : `ENDLESS_RULES[2]` = la croissance de la version 1 (vie ×1,45,
  morsure ×1,2, prime ×0,9 par roi, toujours par `grown()`, jamais `**`) et `roundStart: 6`.
  `playedWave(règles, rois, vague)` : dès le deuxième tour, la vague w du tour se joue comme la
  vague min(11, 6 + ⌈w/2⌉), soit 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 11, puis King Snake. Au
  plus 18 serpents avant le roi (la vague 11), œufs à part. Pour la version 1 et tout autre
  jeu, `playedWave` rend la vague elle-même. `readEndlessRules` relit la version 2 et refuse
  un `roundStart` hors de 0 à 10.
- **`src/game.ts`** : `snakeWave` (la vague dont viennent les serpents) et `difficultyWave`
  (aussi au camp, pour l'annonce et la prévision) lisent `playedWave`. Le nombre de serpents,
  leur vie, leur morsure, leur vitesse, la prime, les sortes, les œufs, la cadence
  (`engine/spawning.ts`) et l'intelligence des voies (`engine/movement.ts`) suivent la vague
  jouée. **La carte suit la vague du tour** (`level`, par `game.wave`), comme les cadeaux
  (après les vagues 4 et 8 du tour), le numéro affiché et le record. C'est la différence avec
  le script du bilan d'avant, où les rochers suivaient la vague jouée.
- **Écrans** : la prévision du camp (`ui/threatPreview.ts`) montre les serpents de la vague
  jouée ; l'annonce « Nouveau serpent » (`render/newcomers.ts`) aussi. Aucun texte nouveau.
- **Sauvegarde et records** : un camp de version 2 se relit en version 2, un camp de version
  1 reste en version 1 (`checkpoints.ts`, camp version 15 inchangée) ; les records lisent la
  version 2 (`endlessRecords.ts`) ; la table de cadeaux de la version 2 est celle de la
  version 1 (`BOON_RULES[2]`). Un appareil resté sur l'ancienne version du jeu refuse un camp
  de version 2 sans rien abîmer. Comment comparer un record v1 et un record v2 reste à décider
  avec le parent (le conseil l'avait noté) : aujourd'hui, la liste les mêle.
- **Une nouvelle partie reste en version 1.** L'architecture prévoit bien le passage par une
  seule constante (`CURRENT_ENDLESS_VERSION`, comme `CURRENT_BALANCE_REVISION`) : c'est une
  ligne. Je ne l'ai pas changée parce que la version 2 n'est pas finie : le parent a dit
  qu'elle sera « F1 + la combinaison choisie », publiée en une fois avec le lot A. Une partie
  commencée garde ses règles pour toujours ; un APK de test ou un aperçu du site construit
  depuis cette branche créerait des parties v2 dont les règles changeraient ensuite. Le
  simulateur joue la version 2 avec `ENDLESS_FORMULA=v2`.
- **Les pistes ne sont pas dans le jeu.** Elles sont dans le script seulement
  (`ENDLESS_LEVERS`, § 4).

**Comment c'est vérifié.**

- Partie de référence nouvelle « sans fin v2 » (`tests/engine-traces.test.ts`) : la même
  graine et le même joueur que « sans fin v1 », deux tours, un aller-retour par la sauvegarde
  à chaque vague 2. Même empreinte sous Node 22 et Node 24. Toutes les autres empreintes
  inchangées, « sans fin v1 » comprise.
- Tests nouveaux (`tests/endless.test.ts`, `tests/endless-records.test.ts`) : la table des
  vagues jouées (tour 1 inchangé, puis 7, 7, 8… 11, 12) ; au plus 18 serpents avant le roi ;
  règles relues ou refusées ; au 2e tour, vague 1 : 13 serpents (ceux de la vague 7), vie de
  la vague 7 un roi plus forte, carte de la vague 1 ; cadeau après la 4e vague du tour ; la
  vague du roi reste la sienne ; un camp v1 et un camp v2 se relisent chacun dans sa version ;
  la prévision du camp montre les serpents de la vague 7 ; un record v2 se lit, un record
  « règles 3 » non.
- Les anciens joueurs simulés jouent exactement les mêmes parties qu'avant ce travail
  (code de `707d0d8` contre code d'après, champ par champ) : expert, hasard et parent en
  version 1 (40 parties chacun), expert avec le F1 du script (40), enfant (8 + 3), les modes
  (1 532 parties : missions et défis, expert et petit) : **0 partie différente**.

## 4. Les quatre pistes, dans le script seulement

`ENDLESS_LEVERS=coins,crystal,king,tank` dans `scripts/balance-modes.mjs`. Le script réécrit
en mémoire, au moment de les charger, une ou deux lignes du moteur ; **les fichiers du jeu ne
changent pas**, et une mesure sans `ENDLESS_LEVERS` joue le moteur tel quel. Si une ligne
n'est pas trouvée exactement une fois, la mesure s'arrête (pour ne jamais mesurer une piste
qui ne s'applique pas).

| Piste                      | Forme mesurée                                                                                                                                                    | Ligne réécrite                     |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| (a) pièces                 | les 12 pièces d'un serpent et la rente suivent les rois comme la prime : ×0,9 par roi, arrondi, jamais moins d'un dixième (le roi garde ses 90)                  | `engine/outcome.ts`, deux lignes   |
| (b) cristal                | les 9 dégâts au cristal d'un serpent qui entre suivent les rois comme la morsure : ×1,2 par roi (la garde du cristal en absorbe autant qu'avant)                 | `engine/enemyTurn.ts`, deux lignes |
| (c) roi plus rapide        | le pas du roi ×(1 + x) par roi battu, plafonné à ×1,5 ; essayé avec x = 5 % (c1 : ×1,41 au 7e roi, ×1,5 dès le 9e) et x = 10 % (c2 : ×1,5 dès le 5e)             | `engine/damage.ts`, une ligne      |
| (d) souffle des tanks      | chaque serpent pris dans l'obus d'un tank, sauf celui visé, reçoit la moitié du coup (`splashSecondaryFactor` 0,5 pour les tanks seulement), dans tous les tours | `engine/allies.ts`, une ligne      |
| (note) souffle des dragons | la même chose pour les dragons seulement : mesuré à part pour le « fils », sans recommandation                                                                   | la même ligne                      |

Les pistes (a), (b) et (c) ne jouent qu'après le premier roi : le premier tour ne change pas.
La piste (d) change aussi le premier tour.

## 5. Le tableau

40 parties par joueur et par ligne, mêmes graines d'une ligne à l'autre, jusqu'au 15e roi.
« v1 » : les règles d'aujourd'hui, pour comparer. « F1 » : les règles version 2 telles que le
jeu les joue. Puis F1 avec chaque piste, puis la meilleure combinaison essayée (§ 6).

Colonnes : « ≥ 1 roi » : parties qui battent au moins le premier roi. « 8 à 12 rois » :
parties qui finissent avec 8 à 12 rois battus. « Vague méd. de chute » : depuis la première
vague, parmi les parties perdues. « Sans dégât après le 1er roi » : vagues jouées après le
premier roi où le cristal n'a rien perdu. « Vagues 7–12 touchées » : parmi les vagues 7 à 12
d'un tour, à partir du 2e tour, celles où le cristal a perdu des points (l'objectif du
parent : au moins une sur deux). « Chutes au roi » : parmi les parties perdues, celles
perdues à la vague du roi. « ≥ 1 roi vs v1 » : écart avec la ligne v1 du même joueur.

| Règles                     | Joueur | parties | ≥ 1 roi | rois méd. (moy.) | 8 à 12 rois | vague méd. de chute | sans dégât après le 1er roi | vagues 7–12 touchées (tours ≥ 2) | chutes au roi | ≥ 1 roi vs v1 |
| -------------------------- | ------ | ------: | ------: | ---------------: | ----------: | ------------------: | --------------------------: | -------------------------------: | ------------: | ------------: |
| v1 (aujourd’hui)           | parent |      40 |    78 % |          4 (3,3) |         0 % |                  57 |                        89 % |                             20 % |          58 % |             — |
| F1                         | parent |      40 |    78 % |          1 (1,3) |         0 % |                  17 |                        49 % |                             43 % |          23 % |        ±0 pts |
| F1 + a (pièces)            | parent |      40 |    78 % |          1 (1,1) |         0 % |                  18 |                        47 % |                             45 % |          30 % |        ±0 pts |
| F1 + b (cristal)           | parent |      40 |    78 % |          1 (1,3) |         0 % |                  17 |                        49 % |                             41 % |          20 % |        ±0 pts |
| F1 + c (roi, 5 % par roi)  | parent |      40 |    78 % |          1 (1,3) |         0 % |                  17 |                        52 % |                             39 % |          25 % |        ±0 pts |
| F1 + c (roi, 10 % par roi) | parent |      40 |    78 % |          1 (1,2) |         0 % |                  17 |                        48 % |                             45 % |          20 % |        ±0 pts |
| F1 + d (tanks)             | parent |      40 |    78 % |          1 (1,2) |         0 % |                  17 |                        46 % |                             44 % |          23 % |        ±0 pts |
| **F1 + a + b (meilleure)** | parent |      40 |    78 % |          1 (1,1) |         0 % |                  17 |                        49 % |                             42 % |          35 % |        ±0 pts |
| v1 (aujourd’hui)           | fils   |      40 |   100 % |          9 (8,6) |        95 % |                 119 |                        98 % |                              4 % |          82 % |             — |
| F1                         | fils   |      40 |   100 % |          8 (7,5) |        78 % |                 108 |                        96 % |                              7 % |          93 % |        ±0 pts |
| F1 + a (pièces)            | fils   |      40 |   100 % |          8 (7,5) |        80 % |                 108 |                        96 % |                              6 % |          72 % |        ±0 pts |
| F1 + b (cristal)           | fils   |      40 |   100 % |          8 (7,5) |        78 % |                 104 |                        98 % |                              3 % |          38 % |        ±0 pts |
| F1 + c (roi, 5 % par roi)  | fils   |      40 |   100 % |          8 (7,5) |        80 % |                 108 |                        95 % |                              8 % |          88 % |        ±0 pts |
| F1 + c (roi, 10 % par roi) | fils   |      40 |   100 % |          8 (7,7) |        88 % |                 108 |                        95 % |                              7 % |          75 % |        ±0 pts |
| F1 + d (tanks)             | fils   |      40 |   100 % |          8 (7,5) |        68 % |                 104 |                        95 % |                              7 % |          56 % |        ±0 pts |
| **F1 + a + b (meilleure)** | fils   |      40 |   100 % |          8 (7,5) |        80 % |                 103 |                        98 % |                              2 % |          41 % |        ±0 pts |
| v1 (aujourd’hui)           | enfant |      40 |    95 % |         10 (9,1) |        93 % |                 130 |                        99 % |                              3 % |          63 % |             — |
| F1                         | enfant |      40 |    95 % |         10 (9,0) |        93 % |                 124 |                        98 % |                              2 % |          23 % |        ±0 pts |
| F1 + a (pièces)            | enfant |      40 |    95 % |          9 (8,7) |        93 % |                 120 |                        98 % |                              2 % |          35 % |        ±0 pts |
| F1 + b (cristal)           | enfant |      40 |    95 % |         10 (9,0) |        93 % |                 122 |                        98 % |                              1 % |          18 % |        ±0 pts |
| F1 + c (roi, 5 % par roi)  | enfant |      40 |    95 % |         10 (9,0) |        93 % |                 124 |                        98 % |                              1 % |          18 % |        ±0 pts |
| F1 + c (roi, 10 % par roi) | enfant |      40 |    95 % |         10 (9,1) |        93 % |                 124 |                        98 % |                              1 % |          20 % |        ±0 pts |
| F1 + d (tanks)             | enfant |      40 |    95 % |          9 (8,2) |        93 % |                 117 |                        97 % |                              4 % |          50 % |        ±0 pts |
| **F1 + a + b (meilleure)** | enfant |      40 |    95 % |          9 (8,7) |        93 % |                 120 |                        98 % |                              1 % |          30 % |        ±0 pts |
| v1 (aujourd’hui)           | expert |      40 |    90 % |          3 (2,9) |         0 % |                  48 |                        93 % |                             14 % |          65 % |             — |
| F1                         | expert |      40 |    90 % |          1 (1,4) |         0 % |                  24 |                        78 % |                             24 % |          30 % |        ±0 pts |
| F1 + a (pièces)            | expert |      40 |    90 % |          1 (1,4) |         0 % |                  22 |                        79 % |                             21 % |          23 % |        ±0 pts |
| F1 + b (cristal)           | expert |      40 |    90 % |          1 (1,3) |         0 % |                  24 |                        80 % |                             21 % |          28 % |        ±0 pts |
| F1 + c (roi, 5 % par roi)  | expert |      40 |    90 % |          1 (1,4) |         0 % |                  24 |                        77 % |                             22 % |          23 % |        ±0 pts |
| F1 + c (roi, 10 % par roi) | expert |      40 |    90 % |          1 (1,3) |         0 % |                  24 |                        78 % |                             23 % |          33 % |        ±0 pts |
| F1 + d (tanks)             | expert |      40 |    90 % |          1 (1,4) |         0 % |                  24 |                        78 % |                             24 % |          30 % |        ±0 pts |
| **F1 + a + b (meilleure)** | expert |      40 |    90 % |          1 (1,4) |         0 % |                  21 |                        82 % |                             18 % |          23 % |        ±0 pts |
| v1 (aujourd’hui)           | hasard |      40 |    68 % |          1 (1,6) |         0 % |                  23 |                        81 % |                             38 % |          28 % |             — |
| F1                         | hasard |      40 |    68 % |          1 (0,7) |         0 % |                  14 |                        34 % |                             41 % |          18 % |        ±0 pts |
| F1 + a (pièces)            | hasard |      40 |    68 % |          1 (0,7) |         0 % |                  13 |                        38 % |                             46 % |          20 % |        ±0 pts |
| F1 + b (cristal)           | hasard |      40 |    68 % |          1 (0,7) |         0 % |                  13 |                        35 % |                             33 % |          18 % |        ±0 pts |
| F1 + c (roi, 5 % par roi)  | hasard |      40 |    68 % |          1 (0,7) |         0 % |                  14 |                        33 % |                             38 % |          20 % |        ±0 pts |
| F1 + c (roi, 10 % par roi) | hasard |      40 |    68 % |          1 (0,7) |         0 % |                  14 |                        32 % |                             38 % |          18 % |        ±0 pts |
| F1 + d (tanks)             | hasard |      40 |    68 % |          1 (0,7) |         0 % |                  14 |                        34 % |                             41 % |          18 % |        ±0 pts |
| **F1 + a + b (meilleure)** | hasard |      40 |    68 % |          1 (0,7) |         0 % |                  13 |                        39 % |                             42 % |          20 % |        ±0 pts |

## 6. Les combinaisons, et la meilleure

Quelques combinaisons, pas une recherche complète (40 parties chacune, mêmes colonnes) :

| Règles                     | Joueur | parties | ≥ 1 roi | rois méd. (moy.) | 8 à 12 rois | vague méd. de chute | sans dégât après le 1er roi | vagues 7–12 touchées (tours ≥ 2) | chutes au roi | ≥ 1 roi vs v1 |
| -------------------------- | ------ | ------: | ------: | ---------------: | ----------: | ------------------: | --------------------------: | -------------------------------: | ------------: | ------------: |
| **F1 + a + b (meilleure)** | parent |      40 |    78 % |          1 (1,1) |         0 % |                  17 |                        49 % |                             42 % |          35 % |        ±0 pts |
| F1 + a + b + d             | parent |      40 |    78 % |          1 (1,0) |         0 % |                  17 |                        44 % |                             42 % |          25 % |        ±0 pts |
| F1 + a + b + c (5 %)       | parent |      40 |    78 % |          1 (1,1) |         0 % |                  17 |                        51 % |                             41 % |          28 % |        ±0 pts |
| F1 + a + b + c (5 %) + d   | parent |      40 |    78 % |          1 (1,1) |         0 % |                  17 |                        45 % |                             42 % |          25 % |        ±0 pts |
| **F1 + a + b (meilleure)** | fils   |      40 |   100 % |          8 (7,5) |        80 % |                 103 |                        98 % |                              2 % |          41 % |        ±0 pts |
| F1 + a + b + d             | fils   |      40 |   100 % |          8 (7,5) |        63 % |                  99 |                        98 % |                              2 % |          24 % |        ±0 pts |
| F1 + a + b + c (5 %)       | fils   |      40 |   100 % |          8 (7,4) |        63 % |                 103 |                        98 % |                              3 % |          32 % |        ±0 pts |
| F1 + a + b + c (5 %) + d   | fils   |      40 |   100 % |          7 (7,2) |        43 % |                  96 |                        98 % |                              2 % |          49 % |        ±0 pts |
| **F1 + a + b (meilleure)** | enfant |      40 |    95 % |          9 (8,7) |        93 % |                 120 |                        98 % |                              1 % |          30 % |        ±0 pts |
| F1 + a + b + d             | enfant |      40 |    95 % |          9 (7,5) |        85 % |                 110 |                        98 % |                              1 % |          20 % |        ±0 pts |
| F1 + a + b + c (5 %)       | enfant |      40 |    95 % |          9 (8,4) |        93 % |                 119 |                        98 % |                              2 % |          40 % |        ±0 pts |
| F1 + a + b + c (5 %) + d   | enfant |      40 |    95 % |          9 (7,5) |        85 % |                 110 |                        98 % |                              2 % |          23 % |        ±0 pts |
| **F1 + a + b (meilleure)** | expert |      40 |    90 % |          1 (1,4) |         0 % |                  21 |                        82 % |                             18 % |          23 % |        ±0 pts |
| F1 + a + b + d             | expert |      40 |    90 % |          1 (1,4) |         0 % |                  21 |                        82 % |                             18 % |          23 % |        ±0 pts |
| F1 + a + b + c (5 %)       | expert |      40 |    90 % |          1 (1,4) |         0 % |                  21 |                        83 % |                             16 % |          23 % |        ±0 pts |
| F1 + a + b + c (5 %) + d   | expert |      40 |    90 % |          1 (1,4) |         0 % |                  21 |                        83 % |                             16 % |          23 % |        ±0 pts |
| **F1 + a + b (meilleure)** | hasard |      40 |    68 % |          1 (0,7) |         0 % |                  13 |                        39 % |                             42 % |          20 % |        ±0 pts |
| F1 + a + b + d             | hasard |      40 |    68 % |          1 (0,7) |         0 % |                  13 |                        39 % |                             42 % |          20 % |        ±0 pts |
| F1 + a + b + c (5 %)       | hasard |      40 |    68 % |          1 (0,8) |         0 % |                  13 |                        39 % |                             38 % |          18 % |        ±0 pts |
| F1 + a + b + c (5 %) + d   | hasard |      40 |    68 % |          1 (0,8) |         0 % |                  13 |                        39 % |                             38 % |          18 % |        ±0 pts |

Le roi plus rapide n'apporte rien aux combinaisons ; le souffle des tanks à moitié fait tomber
le « fils » plus souvent pendant le tour, mais aussi plus tôt (63 % entre 8 et 12 rois au
lieu de 80 %) et touche une idée du fils ; les quatre ensemble le font tomber trop tôt (43 %
entre 8 et 12 rois, 7,2 rois en moyenne).

## 7. Lecture pour le parent

Des faits ; le choix est celui du parent.

1. **Personne ne passe le premier roi plus difficilement** (objectif 3) : F1 et les pistes
   (a), (b), (c) ne jouent qu'après le premier roi ; le premier tour est le même, partie par
   partie (« ≥ 1 roi vs v1 » : ±0 pour tous les joueurs). La piste (d) change aussi le premier
   tour, mais aucun des cinq joueurs n'y perd de premier roi. Le souffle des
   dragons à moitié, lui, en fait perdre un peu au « fils » (−2 points, § 8).
2. **F1 codée est bien plus dure pour les joueurs moyens que le F1 du script.** Le parent
   simulé bat 1,3 roi en moyenne (v1 : 3,3 ; F1 du script, bilan d'avant : 2,4) ; l'expert 1,4
   (v1 : 2,9 ; script : 2,2). Parmi les parties du parent qui battent le premier roi, **14 sur
   31 tombent dans les six premières vagues du 2e tour** (v1 : 0) : juste après le roi, il
   reçoit les serpents de la vague 7, une fois et demie plus coriaces, avec le camp qui vient de
   tenir la vague 12. Une vague jouée par le jeu et par le script sur un même camp et une même
   carte se joue à l'identique ; la différence vient donc du camp (le script changeait de carte
   entre le camp et la vague, et replaçait les alliés à chaque vague). Faire suivre au plateau
   la vague jouée ne rend pas la partie plus facile (mesuré : 1,1 roi pour le parent, 1,2 pour
   l'expert). Je n'en ai pas trouvé la cause exacte.
3. **Le parent (objectif 1) : pas atteint.** Avec F1, ses vagues 7 à 12 (à partir du 2e tour)
   touchent le cristal **43 % du temps** au lieu de 20 % ; avec une piste ou une combinaison,
   de 39 à 45 % selon la ligne, jamais une sur deux. Et c'est mesuré
   sur peu de vagues : la plupart de ses parties s'arrêtent avant. Ce qui menace le cristal
   n'est pas dans ces vagues-là : c'est le début du 2e tour (point 2).
4. **Le camp du fils (objectif 2) : en partie.** Avec F1, le « fils » bat 7,5 rois en moyenne
   et tombe au roi 93 fois sur 100 : le roi reste le seul moment difficile, son cristal n'est
   presque jamais touché pendant le tour (96 à 98 % des vagues sans dégât, quelle que soit la
   piste). Les pistes déplacent la chute : avec le cristal qui sent les rois (b), 38 % des
   chutes au roi ; avec (a)+(b), 41 % ; avec (a)+(b)+(d), 24 %. Il tombe alors pendant le tour,
   d'un coup, quand quelques serpents passent : chacun fait perdre au cristal 9, multiplié
   par 1,2 à chaque roi battu.
   La part de ses parties entre 8 et 12 rois reste de 63 à 80 % avec ces combinaisons ; elle
   tombe à 43 % avec les quatre pistes ensemble.
5. **L'« enfant »** (le camp de tanks) ne sent presque rien : 9 à 10 rois avec tout sauf la
   piste (d) ; avec (d), 8,2 rois ; avec (a)+(b)+(d), 7,5.
6. **Le roi plus rapide (c)** ne change presque rien, à 5 % comme à 10 % par roi : les camps
   forts tuent le roi avant qu'il arrive, et les autres tombent avant d'en voir beaucoup.
7. **Les pièces qui baissent (a)**, seules, retirent un tiers de roi à l'« enfant » et rien au
   « fils » (il garde de toute façon des milliers de pièces) ; elles ne changent presque rien
   au parent, qui tombe tôt. Ce qui déplace les chutes du « fils » du roi vers le tour, c'est
   (b) : seule, elle fait déjà presque tout (38 % des chutes au roi).

**Meilleure combinaison essayée : F1 + (a) + (b)** (pièces et cristal qui suivent les rois).
Elle ne change pas le premier tour, garde le « fils » entre 8 et 12 rois dans 80 % des
parties, et fait passer ses chutes au roi de 93 % à 41 %. Elle ne touche pas aux tanks.
(b) seule fait presque la même chose ; (a) ajoute un camp fort un peu moins riche (« enfant »
9,0 → 8,7 rois).
**Elle n'atteint pas l'objectif du parent** (42 % des vagues 7 à 12 touchées, au lieu d'au
moins une sur deux), ni tout à fait celui du fils (son cristal reste presque toujours intact
pendant le tour, et il tombe d'un coup). Et avec F1, le joueur moyen tombe tôt dans le 2e
tour. **Aucune des combinaisons essayées n'atteint les trois objectifs.**

Ce que la mesure suggère, sans le proposer : le début du 2e tour est trop dur pour un camp
moyen, la fin du tour pas assez pour un camp fort. Une montée plus lente au début du tour
(par exemple commencer plus bas que la vague 7 au 2e tour) ou une hausse de la vie à
l'intérieur du tour serait une autre forme que F1 ; elle n'a pas été mesurée.

## 8. Note à part : le même souffle pour les dragons

Demandé à part, **sans recommandation et sans rien changer au jeu** : si chaque serpent pris
dans le souffle d'un dragon (sauf celui visé) ne recevait que la moitié du coup, comme la
piste (d) pour les tanks.

| « fils », 40 parties                | ≥ 1 roi | rois méd. (moy.) | 8 à 12 rois | vague méd. de chute | sans dégât après le 1er roi | chutes au roi |
| ----------------------------------- | ------: | ---------------: | ----------: | ------------------: | --------------------------: | ------------: |
| F1                                  |   100 % |          8 (7,5) |        78 % |                 108 |                        96 % |          93 % |
| F1 + souffle des tanks à moitié (d) |   100 % |          8 (7,5) |        68 % |                 104 |                        95 % |          56 % |
| F1 + souffle des dragons à moitié   |    98 % |          7 (6,4) |        45 % |                  96 |                        93 % |          82 % |

Les dragons comptent plus que les tanks pour le camp du fils (15 dragons, 6 tanks) : un roi de
moins en moyenne, et une partie sur 40 ne passe plus le premier roi.

## Comment c'est vérifié

- `npx tsc --noEmit`, tests unitaires sous Node 22 et Node 24 (1 102 tests, dont les
  empreintes : toutes inchangées, plus « sans fin v2 », la même sous les deux),
  `npx prettier --check . '!.claude/**'`, `npm run build`, `npm run test:endless` (la recette
  de l'aventure sans fin, 780×360, 812×375, 1280×800 : verte ; le navigateur de la machine
  était d'une version plus ancienne que celle attendue par Playwright, et le téléchargement
  est bloqué : la recette a tourné avec le navigateur installé).
- F1 codée contre le F1 du script : une vague jouée par les deux, sur un même camp et une même
  carte, se joue à l'identique, pas à pas (902 pas, état complet des serpents et des alliés).
- Les anciens joueurs simulés jouent exactement les mêmes parties qu'avant (§ 3).
- Les lignes « ≥ 1 roi » sont identiques d'une ligne à l'autre pour un même joueur, sauf
  quand le souffle change : c'est attendu, F1 et les pistes (a), (b), (c) ne jouent qu'après
  le premier roi, et les graines sont les mêmes.
- Chaque piste réécrit sa ligne du moteur ou arrête la mesure ; le script vérifie aussi, après
  le chargement, que chaque ligne demandée a bien été réécrite.
- Mesures : 40 parties par joueur et par ligne (12 lignes pour « fils » et « enfant », 11 pour
  les autres), environ 13 heures de calcul sur 3 à 4 processeurs (calage compris). Fichiers hors dépôt :
  `/tmp/claude-0/-home-user-snakeattak/cd04658d-0599-532b-bf9f-867d6072b28e/scratchpad/lotc2/`
  (`mesure/` : une ligne = `<règles>-<joueur>-<morceau>.json` ; `cal1/` à `cal3/` : le calage ;
  `outils/table.mjs` refait le tableau).

Pour refaire une ligne :

```
ENDLESS=1 CLASSIC=40 PROFILES=fils ENDLESS_FORMULA=v2 npm run balance:modes -- sortie.json
ENDLESS=1 CLASSIC=40 PROFILES=parent ENDLESS_FORMULA=v2 ENDLESS_LEVERS=coins,crystal npm run balance:modes -- sortie.json
ENDLESS=1 CLASSIC=40 PROFILES=fils ENDLESS_FORMULA=v2 ENDLESS_LEVERS=king KING_STEP=0.1 npm run balance:modes -- sortie.json
ENDLESS=1 CLASSIC=40 PROFILES=enfant ENDLESS_FORMULA=v1 LOT_C=2 npm run balance:modes -- sortie.json
```

## Pas vérifié

- **Rien n'a été essayé sur un vrai téléphone ni avec un enfant.** La version 2 n'est jouable
  que par le simulateur : aucune nouvelle partie ne la prend.
- Le « fils » est calé sur **deux parties** (la sauvegarde, et la partie de la vague 128 dite
  par le parent) et a deux fois trop d'alliés au 7e roi (§ 2). Le « parent » est calé sur une
  seule partie (bilan d'avant). Le « fils » ne lit pas l'écran comme un enfant : il tire au
  hasard dans le mélange de sa sauvegarde.
- 40 parties par ligne : ± 10 à 15 points sur un pourcentage. « Vagues 7–12 touchées » du
  parent avec F1 repose sur peu de vagues (165 vagues, 17 parties), parce que la plupart de
  ses parties s'arrêtent avant.
- Pourquoi F1 codée est plus dure que le F1 du script pour les joueurs moyens : pas trouvé
  exactement (§ 7). Faire suivre au plateau la vague jouée ne l'explique pas (mesuré :
  parent 1,1 roi, expert 1,2).
- Les pistes sont jouées par le script : ce sont des formes simples, pas du code du jeu
  relu. Aucune n'a d'écran ni de texte.
- Comment comparer un record v1 et un record v2 : pas décidé.
- Interface anglaise non regardée (aucun texte nouveau).
