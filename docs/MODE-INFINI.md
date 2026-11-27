# L'aventure sans fin — décisions et mesures (20 novembre 2026)

Idée du parent, 20 novembre 2026 : « un mode infini », où un boss revient toutes les 12 vagues
et où la partie continue, avec un record de chaque joueur gardé sur l'appareil. Les règles du
fils ne changent pas : alliés autonomes, achats avec les pièces gagnées, œufs, King Snake à la
douzième vague, aucune résurrection.

## Décisions du parent (20 novembre)

| Question                | Choix                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| Qui peut y jouer        | Ouverte quand on a battu King Snake une fois dans la grande aventure                      |
| Après chaque King Snake | Un cadeau à choisir, puis « Continuer » ou « Rentrer avec mon record » ; reprise possible |
| La difficulté           | Les serpents sont plus forts à chaque roi, jamais plus nombreux                           |
| Le record               | La vague atteinte, avec les rois battus à côté                                            |
| Les records             | Chaque joueur voit le sien ; aucun classement entre les joueurs de l'appareil             |
| Le réglage              | « Ferme » : vie ×1,45, morsure ×1,2, pièces ×0,9 à chaque roi                             |
| Les cadeaux             | Douze cadeaux ; un cadeau repris monte de niveau, trois au plus ; cinq places             |

Le parent a ajouté le 20 novembre, en choisissant le réglage : il faut de « petits avantages »
qui montent pour le joueur ; avec seulement trois cadeaux, l'enfant serait vite bloqué. Les
cadeaux pris de nouveau doivent pouvoir doubler, tripler ; il en faut beaucoup plus.

## Les cadeaux (décidés le 20 novembre)

Après les vagues 4 et 8 de chaque tour, et après chaque roi, on choisit un cadeau parmi trois
(`src/boons.ts`). Les cadeaux qui durent montent d'un niveau quand on les reprend, jusqu'au
niveau 3, et un cadeau au niveau 3 n'est plus proposé. Ils occupent cinq places ; quand elles
sont pleines, un nouveau prend la place que l'enfant lui donne. Les cartes « une fois » ne
prennent pas de place.

| Cadeau                          | Dure ?   | Par niveau                                           |
| ------------------------------- | -------- | ---------------------------------------------------- |
| La forge                        | oui      | les coups de tous les alliés +15 %                   |
| L'armure                        | oui      | la vie de tous les alliés +15 % (ceux du camp aussi) |
| Le marché                       | oui      | recruter coûte 10 % de moins                         |
| La rente                        | oui      | +40 pièces à la fin de chaque vague                  |
| Le cristal solide               | oui      | le cristal se répare de 5 après chaque vague         |
| La longue-vue                   | oui      | les alliés qui tirent de loin voient 10 % plus loin  |
| La réserve de miel              | oui      | +4 secondes pour chaque pot de miel                  |
| Gardien, ninja ou raptor offert | une fois | un allié à placer                                    |
| La garde du cristal             | une fois | absorbe 18 dégâts                                    |
| La bourse                       | une fois | 100 pièces                                           |

## Comment ça marche

- C'est la grande aventure de la révision 7, jouée en boucle : après King Snake, le même camp
  repart à la vague 1, avec un roi de plus. Le héros garde son entraînement. Après le premier
  roi, tous les alliés restent ouverts (relecture du 20 novembre : sinon ils se refermaient à
  chaque tour, et un renfort offert ne pouvait pas se poser).
- Après les vagues 4 et 8 de chaque tour, et après chaque roi, un cadeau parmi trois, tiré à
  part (`src/boons.ts`) : ce ne sont pas les cartes de la grande aventure.
- Les serpents ne sont pas plus nombreux. Leur vie, leur morsure et la prime de fin de vague
  sont multipliées à chaque roi (`src/endless.ts`, version 1). Les pièces gagnées pour chaque
  serpent battu (12, et 90 pour le roi) ne baissent pas : sur un tour, la prime de fin de
  vague fait environ 2 800 pièces et les serpents battus au moins 1 800.
- Une hausse fixe à chaque roi (essais A, B, C) ne suffisait pas : un camp rempli de grands
  alliés tenait presque sans fin. La hausse multipliée finit toujours par l'emporter.
- **Sauvegarde** : le camp version 15 (révision, version des règles sans fin, rois, cadeaux).
  Les cadeaux sont rangés par version (`BOON_RULES`) : une partie garde ses valeurs.
- **Records** (`src/endlessRecords.ts`, clé `conquete-serpents:endless-records:v1` par joueur) :
  une ligne par partie, qui monte après chaque roi et à la chute ; une vague réessayée ou une
  page rechargée ne fait pas de nouvelle ligne ; les cinq meilleures parties du joueur, sans
  comparaison avec les autres joueurs. La sauvegarde familiale ne les contient pas, comme le
  voyage.
- **Écrans** : bouton « L'aventure sans fin » sur la page « Aventure classique », ouvert quand
  King Snake a été battu une fois (sinon une phrase dit comment l'ouvrir) ; le record du joueur
  dessous ; dans la bataille, la vague depuis la première et les rois ; après un roi,
  « Continuer » ou « Rentrer avec mon record » : on rentre à l'accueil, le record est écrit,
  la partie reste enregistrée et se reprend. À la chute : « Quelle aventure ! », la vague, les
  rois, « Nouveau record ! » s'il y a lieu. Recette : `npm run test:endless`.
- **Les cadeaux se voient (lot B, 27 novembre)** : l'étagère des cinq places dans le dock, au
  camp et pendant la vague ; un toucher ouvre « Tes cadeaux » (ce que fait chacun, sans « % »,
  et ce que donnerait de le reprendre) ; les cadeaux tenus au-dessus des cartes ; « ★★ → ★★★ »
  sur la carte d'un cadeau repris ; les cinq cartes de « remplacer » sur une rangée en
  780×360 ; le récap (vague, rois, cadeaux) quand on rentre avec son record et quand le camp
  tombe ; chaque cadeau à l'endroit où il agit (étincelles, anneau, lueur du refuge, prix
  barré, « +4 s » sur les pots, « +40 » près des pièces). Rendu seulement, aucune règle
  touchée ([bilan](BILAN-INFINI-LOT-B-2026-11-27.md)).

## Mesures

60 à 100 parties par joueur simulé, jusqu'au 10e roi au plus (`ENDLESS=1` dans
`scripts/balance-modes.mjs`, fichiers dans `artifacts/infini/`, hors Git). Pourcentage des
parties qui battent au moins N rois.

| Réglage                                                | Joueur | 1 roi | 2 rois | 3 rois | 4 rois | 5 rois | 6 rois |
| ------------------------------------------------------ | ------ | ----: | -----: | -----: | -----: | -----: | -----: |
| Hausse fixe : vie +35 %, morsure +15 %                 | expert |  63 % |   52 % |   31 % |    6 % |    0 % |    0 % |
|                                                        | gros   |  53 % |   50 % |   47 % |   47 % |   47 % |   47 % |
| Fixe, pièces −15 % (A)                                 | gros   |  53 % |   50 % |   48 % |   48 % |   43 % |   38 % |
| Fixe : vie +60 %, morsure +25 % (B)                    | gros   |  53 % |   45 % |   35 % |   30 % |   28 % |   27 % |
| Fixe : vie +50 %, morsure +25 %, −15 % (C)             | gros   |  53 % |   42 % |   40 % |   37 % |   23 % |   12 % |
| Multipliée : ×1,35, ×1,15 (« doux »)                   | expert |  70 % |   58 % |   23 % |    0 % |    0 % |    0 % |
|                                                        | gros   |  53 % |   50 % |   45 % |   45 % |   45 % |   43 % |
| **Multipliée : ×1,45, ×1,2, ×0,9 (« ferme », choisi)** | expert |  70 % |   43 % |    2 % |    0 % |    0 % |    0 % |
|                                                        | dino   |  65 % |   33 % |    3 % |    0 % |    0 % |    0 % |
|                                                        | gros   |  53 % |   45 % |   45 % |   42 % |   22 % |    3 % |

- « expert » achète surtout des archers, des boucliers et des massues ; « dino » fait pareil
  avec deux grands dinosaures ; « gros » achète toujours les alliés les plus chers et les
  remplace quand ils tombent (47 000 pièces dépensées dans une longue partie, quatre fois plus
  que l'expert). Les joueurs « moyen » et « petit » ne battent presque jamais le premier roi :
  le mode ne leur est pas ouvert.
- Avec le réglage choisi, une partie dure 16 à 21 minutes en moyenne (temps de jeu simulé).

### Avec les cadeaux à niveaux (choix du parent : « on garde », 20 novembre)

Réglage « ferme », 60 parties par joueur, jusqu'au 10e roi au plus.

| Joueur | 1 roi | 2 rois | 3 rois | 4 rois | 5 rois | 6 rois | 7 rois | 8 rois | 9 rois | Durée médiane* |
| ------ | ----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -------------: |
| expert |  85 % |   75 % |   67 % |   37 % |    2 % |    0 % |    0 % |    0 % |    0 % |         33 min |
| dino   |  77 % |   72 % |   55 % |   30 % |    2 % |    0 % |    0 % |    0 % |    0 % |         33 min |
| gros   |  80 % |   75 % |   75 % |   75 % |   75 % |   75 % |   60 % |   27 % |    3 % |         53 min |

\* temps de jeu simulé des parties qui battent au moins un roi. Les joueurs reprennent d'abord
un cadeau qu'ils ont, puis préfèrent la forge, l'armure, la rente, le marché.

Les cadeaux des vagues 4 et 8 aident aussi le premier tour : le premier roi tombe plus souvent
que dans la grande aventure (expert 70 % → 85 %). Aucune partie ne dépasse le 9e roi.

### Après la relecture : alliés ouverts après un roi (« on garde », 20 novembre)

Mêmes réglages ; les alliés ne se referment plus à chaque tour, et le joueur simulé ne
remplace plus un cadeau monté au niveau 3. 60 parties par joueur, jusqu'au 10e roi au plus.

| Joueur | 1 roi | 2 rois | 3 rois | 4 rois | 5 rois | 6 rois | 7 rois | 8 rois | 9 rois | 10 rois | Durée médiane* |
| ------ | ----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | ------: | -------------: |
| expert |  85 % |   80 % |   63 % |   32 % |    3 % |    0 % |    0 % |    0 % |    0 % |     0 % |         33 min |
| dino   |  77 % |   70 % |   58 % |   28 % |    0 % |    0 % |    0 % |    0 % |    0 % |     0 % |         33 min |
| gros   |  80 % |   80 % |   80 % |   80 % |   80 % |   80 % |   80 % |   77 % |   47 % |     2 % |         61 min |

Le joueur qui achète les plus grands alliés va maintenant jusqu'au 8e ou 9e roi, en une heure
environ ; le parent garde ces valeurs : une longue partie se coupe après un roi et se reprend.

### Avec deux joueurs de plus : « hasard » et « épargnant » (26 novembre, lot A)

Règles sans fin version 1, inchangées. Rapport du conseil du 20 novembre
([COUNCIL-INFINI-2026-11-20.md](passation/COUNCIL-INFINI-2026-11-20.md), § 3) : le parent
joue « au hasard » ; le simulateur ne savait ni acheter pendant une vague, ni poser ailleurs
que sur 63 places. Deux joueurs de plus dans `scripts/balance-modes.mjs` :

- **hasard** : alliés, places permises du camp et cadeaux tirés au hasard ; dépense tout
  avant chaque vague et toutes les trois secondes pendant la vague ;
- **épargnant** : le même hasard, mais n'achète, en masse, que quand le cristal vient d'être
  touché.

Les autres joueurs jouent exactement comme avant (mêmes résultats partie par partie).
Jusqu'au 10e roi au plus.

| Joueur    | parties | 1 roi | 2 rois | 3 rois | 4 rois | 5 rois | 6 rois | 7 rois | vague médiane (max) | vagues sans dégât au cristal (après le 1er roi) | stock maximum médian (max) |
| --------- | ------: | ----: | -----: | -----: | -----: | -----: | -----: | -----: | ------------------: | ----------------------------------------------: | -------------------------: |
| expert    |     100 |  78 % |   74 % |   60 % |   32 % |    2 % |    0 % |    0 % |             48 (70) |                                     94 % (93 %) |              1 289 (7 260) |
| hasard    |     100 |  69 % |   48 % |   27 % |   11 % |    2 % |    1 % |    1 % |             24 (93) |                                     71 % (77 %) |                404 (2 423) |
| épargnant |     100 |  40 % |   26 % |   22 % |   16 % |    9 % |    2 % |    0 % |             12 (82) |                                     65 % (82 %) |             1 299 (10 473) |
| dino      |      40 |  85 % |   78 % |   63 % |   35 % |    0 % |    0 % |    0 % |             47 (60) |                                     93 % (92 %) |                928 (6 320) |
| gros      |      40 |  85 % |   85 % |   85 % |   85 % |   85 % |   85 % |   85 % |           118 (120) |                                     96 % (99 %) |             4 584 (13 603) |
| massues   |      40 |  88 % |   13 % |    3 % |    0 % |    0 % |    0 % |    0 % |             23 (45) |                                     47 % (48 %) |              1 015 (1 943) |
| moyen     |      40 |   0 % |    0 % |    0 % |    0 % |    0 % |    0 % |    0 % |             11 (12) |                                            67 % |                  609 (694) |
| petit     |      40 |   0 % |    0 % |    0 % |    0 % |    0 % |    0 % |    0 % |               8 (9) |                                            58 % |              1 090 (1 490) |

« gros » : 80 % au 8e roi, 53 % au 9e, aucun au 10e. Avec 40 parties, l'expert passait le
premier roi dans 90 % des parties : un écart de 12 points d'un échantillon à l'autre.

**Critère proposé par le conseil, « l'épargnant et le hasard ne battent pas l'expert » :
faux aujourd'hui, dans la queue seulement.** En moyenne l'expert va bien plus loin (vague
médiane 48, contre 24 et 12). Mais l'épargnant passe 5 rois dans 9 % des parties (expert
2 %) et 6 rois dans 2 % (expert 0 %) ; le hasard passe 6 et 7 rois une fois sur 100 (expert
jamais). Rien n'est changé : c'est une mesure, la décision reste au parent (lot C).

Ces joueurs sont des modèles, pas le parent : le « hasard » du conseil, autrement réglé,
passait 4 rois dans 75 % des parties ; le nôtre dans 11 %.

## Pas vérifié

- Les joueurs simulés choisissent leurs cadeaux toujours dans le même ordre ; un enfant
  choisira autrement.
- Rien n'a été essayé par un enfant ni sur un vrai téléphone.
- Les mots des cadeaux (« +15 % », « la rente ») sont à relire avec le parent et le fils.
