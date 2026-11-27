# L'aventure sans fin, lot A — compte rendu (26 novembre 2026)

Le parent a dit oui au lot A du rapport du conseil
([COUNCIL-INFINI-2026-11-20.md](passation/COUNCIL-INFINI-2026-11-20.md)) : mesurer, accélérer,
réparer de petits défauts, **sans changer aucune règle**. Les lots B, C et D ne sont pas
commencés. Branche `claude/trusting-brahmagupta-t7fmuy`, ni poussée ni fusionnée.

## Aucune partie ne change

- Empreintes des parties de référence (`tests/engine-traces.test.ts`) : **toutes les
  anciennes inchangées** (fichier des empreintes seulement complété). La nouvelle partie
  « sans fin v1 » a été écrite par le moteur d'avant ce lot, puis retrouvée identique après.
- `npm run balance:modes` (27 816 parties) et `npm run balance:caprices` (6 804 parties),
  joués avec le code d'avant (commit `3eb6f05`, copie à part) et celui d'après : **résultats
  identiques partie par partie, champ par champ** (fichiers de résultats égaux octet pour
  octet). Aventure sans fin, 144 parties des six anciens joueurs : identiques champ par
  champ (les deux colonnes nouvelles s'ajoutent).
- Aucune valeur d'équilibrage touchée, aucune révision nouvelle.

## A-1 Mesure

- **Partie de référence sans fin** (`tests/engine-traces.test.ts`) : graine 777, règles sans
  fin version 1, jouée jusqu'à sa chute après trois rois (60 458 pas), avec ses cadeaux
  (cinq places prises) et quatre allers-retours par la sauvegarde. Les rois et les cadeaux,
  gardés hors du JSON du jeu, entrent dans l'empreinte. Le joueur automatique ne change que
  pour une partie sans fin (il prend les cadeaux de ce mode).
- **Deux joueurs simulés** (`scripts/balance-modes.mjs`) : « hasard » (alliés, places
  permises du camp tous les 12 points et cadeaux au hasard, achats avant et pendant la
  vague) et « epargnant » (même hasard, achats en masse seulement quand le cristal vient
  d'être touché). Leur hasard a sa propre graine : le jeu ne le voit pas. Les autres joueurs
  n'ont rien de nouveau (ni achat pendant la vague, ni nouvelles places).
- **Deux colonnes** pour l'aventure sans fin : « vagues sans dégât au cristal » (toutes, et
  après le premier roi) et « stock maximum » (la plus grosse bourse tenue).

Mesure (jusqu'au 10e roi ; expert, hasard, épargnant : 100 parties ; les autres : 40) :

| Joueur    | 1 roi | 2 rois | 3 rois | 4 rois | 5 rois | 6 rois | vague médiane (max) | sans dégât au cristal (après le 1er roi) | stock maximum médian (max) |
| --------- | ----: | -----: | -----: | -----: | -----: | -----: | ------------------: | ---------------------------------------: | -------------------------: |
| expert    |  78 % |   74 % |   60 % |   32 % |    2 % |    0 % |             48 (70) |                              94 % (93 %) |              1 289 (7 260) |
| hasard    |  69 % |   48 % |   27 % |   11 % |    2 % |    1 % |             24 (93) |                              71 % (77 %) |                404 (2 423) |
| épargnant |  40 % |   26 % |   22 % |   16 % |    9 % |    2 % |             12 (82) |                              65 % (82 %) |             1 299 (10 473) |
| dino      |  85 % |   78 % |   63 % |   35 % |    0 % |    0 % |             47 (60) |                              93 % (92 %) |                928 (6 320) |
| gros      |  85 % |   85 % |   85 % |   85 % |   85 % |   85 % |           118 (120) |                              96 % (99 %) |             4 584 (13 603) |
| massues   |  88 % |   13 % |    3 % |    0 % |    0 % |    0 % |             23 (45) |                              47 % (48 %) |              1 015 (1 943) |
| moyen     |   0 % |    0 % |    0 % |    0 % |    0 % |    0 % |             11 (12) |                                     67 % |                  609 (694) |
| petit     |   0 % |    0 % |    0 % |    0 % |    0 % |    0 % |               8 (9) |                                     58 % |              1 090 (1 490) |

« gros » passe 7 rois dans 85 % des parties, 8 dans 80 %, 9 dans 53 %, jamais 10. Le hasard
passe 7 rois une fois sur 100.

**« L'épargnant et le hasard ne battent pas l'expert » : faux aujourd'hui, dans la queue
seulement.** En moyenne l'expert va bien plus loin (vague médiane 48 contre 24 et 12, premier
roi 78 % contre 69 % et 40 %). Mais l'épargnant passe 5 rois dans 9 % des parties contre 2 %,
6 rois dans 2 % contre 0 % ; le hasard passe 6 et 7 rois une fois sur 100, l'expert jamais.
C'est rapporté, rien n'est changé (le lot C décidera avec le parent). Ce que la mesure montre
aussi : après le premier roi, l'expert ne prend aucun dégât au cristal dans 93 % des vagues,
« gros » dans 99 % — la fadeur que le parent décrit.

## A-2 Vitesse (mêmes parties)

- `src/navigation.ts` : A* garde sa liste ouverte en **tas binaire** (il la triait avant
  chaque nœud) ; même ordre de sortie, car deux entrées n'ont jamais à la fois même
  estimation et même case. Les cases bloquées d'une carte sont mesurées **une fois** (grille).
  Le **cache des chemins oublie le plus ancien** au lieu de se vider d'un coup à 1 024 ; un
  chemin redemandé redevient récent. Le chemin se construit sans `unshift`.
- `src/defenders.ts` : les **secours** prennent les deux combattants les plus proches **en une
  passe** (ils triaient tous les combattants pour chaque serpent arrêté) ; la foule devant
  le camp se compte jusqu'à trois.
- `nearestCampPoint` et `defenseGoal` : déjà fait le 21 novembre (points du camp gardés par
  carte, une passe sans tri, commit `0fd5d0e`, `tests/camp-points.test.ts`) ; rien de plus ici.
- **Mots flottants** : une étiquette libre qui montre déjà le même mot dans la même couleur
  est reprise en premier (`FramePool.acquire` accepte une préférence) : un plateau chargé
  répète les mêmes nombres, et le texte n'est pas redessiné. Mêmes pixels.
- `scripts/benchmark.mjs` : un **vrai camp** (63 alliés de toutes les sortes, posés sur les
  places permises), troisième roi passé, contre **20, 30 et 40 serpents vivants** tenus à ce
  nombre, 1 800 pas mesurés par scène, et l'empreinte finale de chaque scène.
- Preuves : `tests/engine-speed.test.ts` recopie l'ancien A* et l'ancien calcul des secours
  et les compare aux nouveaux (3 120 chemins sur six cartes et deux règles de chemin, puis
  900 redemandés, en partie oubliés ; 400 camps tirés au hasard, dont des égalités de
  distance) ; empreintes des parties inchangées ; empreintes finales du banc identiques
  avant et après.

Mesures (même banc, même machine, médiane de trois passages ; millisecondes par pas) :

| Banc                      | Serpents | Pas p50 avant → après | Pas p95 avant → après |
| ------------------------- | -------: | --------------------: | --------------------: |
| Node, `npm run benchmark` |       20 |           0,19 → 0,10 |           0,42 → 0,19 |
|                           |       30 |           0,16 → 0,18 |           0,29 → 0,28 |
|                           |       40 |           0,21 → 0,21 |           0,42 → 0,28 |

Navigateur (Chromium sans carte graphique, 780×360, processeur ralenti ×4 par CDP, le même
camp de 63 alliés, jeu servi par Vite depuis les sources d'avant et d'après ; deux passages
de 20 secondes par scène, les deux valeurs données) :

| Serpents | Pas p50 (ms) avant → après | Pas p95 (ms) avant → après | Image p50 (ms) avant → après | Image p95 (ms) avant → après |    Images/s avant → après |
| -------: | -------------------------: | -------------------------: | ---------------------------: | ---------------------------: | ------------------------: |
|       20 |      1,4 / 1,2 → 1,2 / 1,2 |      3,6 / 3,1 → 3,2 / 3,4 |            83 / 67 → 83 / 83 |        150 / 133 → 133 / 150 | 10,5 / 12,1 → 12,0 / 11,8 |
|       30 |      1,6 / 1,6 → 1,3 / 1,2 |      3,6 / 3,6 → 3,1 / 3,1 |        100 / 100 → 100 / 100 |        150 / 150 → 150 / 133 |    9,4 / 9,5 → 9,7 / 10,3 |
|       40 |      1,8 / 1,4 → 1,8 / 1,3 |      3,6 / 3,3 → 3,9 / 3,2 |         100 / 100 → 133 / 83 |        133 / 150 → 167 / 117 |   10,3 / 9,7 → 7,5 / 11,5 |

Lecture honnête : le pas du moteur gagne un peu (surtout le 95e centile, et à 20 serpents),
et il est déjà sous l'objectif du conseil (< 8 ms au 95e centile à ×4) avant comme après.
Le gros du gain que le conseil attendait était déjà là : le 21 novembre, le pas de l'aventure
sans fin était passé de 1,25 à 0,28 ms en moyenne (`nearestCampPoint`, commit `0fd5d0e`). Le
temps de l'image (67 à 167 ms ici) est fait par le dessin sans carte graphique et varie d'un
passage à l'autre plus que tout ce que ce lot change : **l'objectif « image < 33 ms » n'est
ni atteint ni mesurable ici**. Les mots flottants repris ne se voient pas dans ces chiffres.

## A-3 Petits défauts (rendu seulement)

Mots nouveaux, à lire par le parent :

| Où                                          | Français                                    | Anglais                                    |
| ------------------------------------------- | ------------------------------------------- | ------------------------------------------ |
| Accueil, sous « L'aventure sans fin »       | « Ton record : vague 46 · rois battus : 3 » | « Your record: wave 46 · kings beaten: 3 » |
| Plateau, sous le nom du lieu, après un roi  | « 3e tour · vagues 25 à 28 »                | « Round 3 · waves 25 to 28 »               |
| Plateau, au-dessus du cristal, fin de vague | « La rente : +40 pièces »                   | « The income: +40 coins »                  |

- **Cercle de placement** : il lit la vraie portée (`turnReach`, moteur) ; « la longue-vue »
  allonge celui d'un tireur, un soigneur garde la sienne.
- **La rente** : à la fin d'une vague, « La rente : +40 pièces » au-dessus du cristal (deux
  secondes), et une pièce vole vers la bourse. Le nom vient du cadeau (`boonTitle`) : quand
  le fils lui en donnera un autre, la phrase suivra. Rendu seulement : le message du moteur
  ne change pas (il fait partie de l'empreinte des parties).
- **Accueil** : le record dit ses rois.
- **Le tour** : après un roi, sous le nom du lieu, le tour et ses vagues comptées depuis la
  première. Sur ordinateur, il est écrit à côté du nom (la ligne du dessous était cachée sur
  les trois formats contrôlés : « Vagues 1 à 4 » ne se voyait plus qu'ailleurs).
- **Boutons** (`src/styles/19-endless.css`, importé en dernier ; `07-rewards.css`) :
  « Continuer sans bonus » et « Garder mes cadeaux » 44 → 48 px ; en 1280×800, « Garder mes
  cadeaux » était sous le bord du panneau (cinq cartes sur deux rangées) : cinq cartes sur une
  rangée, le bouton se voit ; « Rentrer avec mon record » tient sur une ligne dans son bandeau
  (« Continuer » rend un peu de largeur) ; en 780×360, « 100 % » et « Vague 12 · rois : 1 »
  sur une ligne. « Vague 12 · rois : 1 » se coupait aussi en deux lignes en 1280×800, et
  sortait du bandeau par le haut : réglé.

Mesuré avant / après (Chromium, 780×360 · 812×375 · 1280×800) :

| Défaut                                      | Avant                                | Après                          |
| ------------------------------------------- | ------------------------------------ | ------------------------------ |
| « Continuer sans bonus », 1280×800          | 44 px                                | 48 px                          |
| « Garder mes cadeaux », 1280×800            | 44 px, caché sous le bord du panneau | 48 px, visible dans le panneau |
| « Rentrer avec mon record », 1280×800       | 2 lignes, 58 px, hors bandeau        | 1 ligne, 48 px                 |
| « 100 % », 780×360                          | 2 lignes                             | 1 ligne                        |
| « Vague 12 · rois : 1 », 780×360 / 1280×800 | 2 lignes / 2 lignes, hors bandeau    | 1 ligne / 1 ligne              |
| Défilement de côté, trois formats           | aucun                                | aucun                          |

`npm run test:endless` contrôle désormais ces boutons (48 px au moins, dans leur bandeau et
dans la fenêtre), « 100 % » et la vague sur une ligne, « Rentrer avec mon record » sur une
ligne sur ordinateur, le tour (« 2e tour · vagues 13 à 16 ») et le record avec ses rois.

Captures (hors Git, `deviceScaleFactor` 1) : `artifacts/infini-lot-a/avant/` (jeu d'avant le
lot) et `artifacts/infini-lot-a/apres/`, en 780×360, 812×375 et 1280×800 : record de
l'accueil, cadeau après un roi, camp après le roi, « remplacer », troisième tour.

**Pas fait du § 5 et § 6** (lot B) : l'écran « Tes 5 places sont prises » en 780×360 montre
toujours 3 cartes sur 5 sans défiler (« Garder mes cadeaux » est en haut, visible).

## Paquet

Paquet principal (`bootstrap`) : 197 507 → 198 177 octets (limite 200 000) ; règles :
138 640 → 139 510.

## Comment c'est vérifié

- `npx tsc --noEmit`, `npx prettier --check . '!.claude/**'`, `npm test` (1 092 tests),
  `npm run build`, `npm run texts:build`, `npm run test:locale` (529 contrôles, aucun texte
  inconnu).
- Toutes les recettes des groupes de la CI (`.github/workflows/check.yml`), jouées ici,
  vertes : `test:browser`, `test:audit` (13/13) ; « écrans » (`test:threat-preparation`,
  `test:reinforcements-scroll`, `test:child-mobile`, `test:interruptions`, `test:offline`,
  `test:presentation`, `test:tactical-clarity`, `test:mission-journey`, `test:endless`,
  `test:apples`, `test:hidden-boss`) ; « langue et caprices » (`test:locale`,
  `test:caprices`) ; « menus » (`test:mobile-menus`, 7 579 contrôles) ; « règles et rendu »
  (`test:rewards`, `test:journey`, `test:missions:regressions`, `test:medical-persistence`,
  `test:stage`, `test:render-settings`, `test:tactical`, `test:expedition`) ;
  « sauvegardes » sur `build:android` (`test:saves:update`, `test:saves:family`,
  `test:saves:forced-close`, `test:saves:double-taps`, `test:failure`, `test:saves:unkept`,
  `test:saves:gate`) ; « retour » (`test:back-button`). Le fichier de la CI n'est pas touché.
- Nouveaux tests : `tests/engine-speed.test.ts`, la partie « sans fin v1 », la longue-vue et
  le cercle (`placement-range-018`), la rente écrite (`presentation`), la préférence de la
  réserve d'étiquettes (`frame-pool-024`).

## Pas vérifié

- Rien sur un vrai téléphone ni dans la WebView Android ; rien avec un enfant ni avec le
  parent. Les mots nouveaux sont à lire par le parent ; « La rente » garde son nom.
- Carte graphique non mesurable ici (logicielle) : le temps de l'image mesuré dans Chromium
  sans carte graphique ne dit rien d'un téléphone.
- Le banc du navigateur est un script de travail, hors dépôt : il sert le jeu par Vite depuis
  les sources (pas le jeu construit) et tient le nombre de serpents en enveloppant
  `Game.prototype.step` depuis la page. Seul le banc Node est dans le dépôt.
- Les joueurs « hasard » et « épargnant » sont des modèles ; 40 à 100 parties (± 10 points
  environ) ; pas au-delà du 10e roi. Le « hasard » du conseil, autrement réglé, passait bien
  plus de rois que le nôtre.
