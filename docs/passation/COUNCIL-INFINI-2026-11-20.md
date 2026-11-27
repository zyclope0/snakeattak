# Council « aventure sans fin » — 20 novembre 2026

Rapport pour la session qui développe. **Rien n'est développé** : c'est une analyse. Les
fichiers de travail des six rôles (scripts, mesures, captures) sont dans
`artifacts/council-infini/<rôle>/` sur la machine du Council, **hors Git** : ce document doit se
suffire. Version du jeu lue : 0.39.0, règles sans fin version 1, révision 7.

Six rôles, chacun a mesuré et cité sa preuve (ce ne sont pas des avis d'enfants ni de parents) :
trois architectes techniques (courbe de pression, économie, performance + interface), deux
joueurs mesurés (adulte qui joue pour le score ; lecture 6-10 ans + fidélité aux règles), un
rôle « hors des sentiers battus » (références d'autres jeux).

## Le retour du parent

Joueur adulte, 3 rois battus, vague 46, placements et cadeaux **au hasard**, « zéro souci ».
Après chaque roi on repart avec 3-4 serpents ; on économise beaucoup, puis on vide la bourse
dès que ça se corse ; c'est « fade » ; « on ne voit pas les bonus », il veut un vrai système de
gestion des bonus.

## Ce que le Council a établi (avec preuves)

### 1. Tout repart de zéro à chaque roi, pas seulement le nombre

- Le nombre vient de `waveStats(this.wave)` (`src/game.ts:531`, `src/data.ts:291`) et la vague
  revient à 0 après le roi (`src/engine/outcome.ts:88`) : 20 serpents à la vague 12, 5 à la 13.
- La vie _de base_ retombe aussi (178 → 83 au début du tour 2 malgré ×1,45, `data.ts:292`), ainsi
  que la vitesse, les spécialistes (cracheurs, mambas, ressorts) et les nouveaux serpents du fils
  (ninja, crocs, rare, sauterelle : absents 5 à 7 vagues sur 12 à chaque tour).
- **Les œufs** retombent de 3 à 1 (`waveEggCount`, `src/waves.ts`).
- **La règle du fils « la voie la moins défendue » s'efface à chaque roi** : l'intelligence vaut
  `min(0,86 ; 0,12 + (vague − 1) × 0,148)` (`src/ai.ts:42`), calculée sur la vague du tour. Elle
  revient à 12 % au début de chaque tour (vérifié dans le code).
- La morsure ×1,2 par roi **ne touche jamais le cristal** : un serpent qui entre fait toujours 9
  (`src/engine/enemyTurn.ts:39,150`). Les vagues 1 à 3 d'un tour ne peuvent pas faire tomber un
  cristal plein (63, 72, 90 dégâts au plus).
- PV entrants, vague 1 d'un tour ÷ vague 11 du tour d'avant : **0,14** (tours 2, 3, 4). La vague
  37 (869) pèse moins que la vague 6 du tout premier tour (1 344).

### 2. La tension n'existe qu'au roi : c'est une falaise, pas une courbe

- Vagues 1 à 4 des tours suivants : aucun dégât au cristal ni allié perdu dans 95 % des cas
  (joueur « hasard », 20 parties). Joueur « gros » : **96 vagues de suite sans dégât** au cristal
  (tours 1 à 8), puis 14 de ses 15 chutes à la vague 12.
- Dans le navigateur (vagues 13-17, poses au hasard) : cristal jamais touché, vagues de 25-42 s.

### 3. La mesure actuelle a validé un mode trop doux

- Un joueur simulé « hasard » (alliés, cases, cadeaux au hasard) **fait mieux que l'expert** :
  75 % passent 4 rois, 45 % passent 6 rois (expert : 55 % / ~0 %). Le parent (vague 46) est dans
  sa courbe.
- Un joueur simulé « épargnant » (hasard + n'achète en masse que quand le cristal est touché) bat
  5 rois dans 42 % des parties ; l'expert, 0 % (mêmes 12 graines).
- Le simulateur (`scripts/balance-modes.mjs`) n'achète jamais pendant une vague
  (l. 166-178, alors que `src/game.ts:497` le permet) et ne connaît que 63 places fixes
  (l. 65-68) : c'est en partie pourquoi son or s'entasse.

### 4. L'argent

- Revenu d'un tour pour « gros » : 5 335 (tour 0) → 5 135 (tour 7), −4 % seulement alors que la
  vie des serpents est ×13,5. Les pièces par serpent sont fixes (`SNAKE_BOUNTY = 12`,
  `src/engine/outcome.ts:16`) et font la moitié du revenu ; la rente niveau 3 compense 74 % de la
  baisse ×0,9 de la prime.
- L'épargnant n'achète rien dans 77 % des vagues après le premier roi ; stock médian 1 877,
  jusqu'à 11 694 ; 84 % de sa dépense en 50 rafales (vagues 6 et 11 surtout).
- Leviers mesurés (hors moteur, 12 graines) : **bourse plafonnée à 1 500** → épargnant 42 → 0 %,
  expert et gros inchangés (le seul levier qui vise l'épargne seule) ; prime des vagues 1-6
  divisée par 2 dès le tour 2 → 42 → 25 % ; prix ×1,15 par roi → tout le monde chute (déconseillé).
- **Aucun levier économique ne rend de la tension à « gros »** : la fadeur vient de la courbe.

### 5. Les cadeaux sont invisibles

- Seule liste : une ligne de texte de 12 px (`#reward-summary`, `src/html/battle.html:350`),
  à 3 taps et 1 à 3 défilements (« Tous les alliés » → « Conseils et outils » → « Actions du
  camp »). Rien en bataille ; ouvrir ce menu met en pause.
- Aucun effet visible sur le plateau : forge, armure, longue-vue sans signe ; marché sans prix
  barré ; **la rente n'est pas annoncée** en fin de vague (`outcome.ts` ajoute `boonGain('rente')`
  mais n'annonce que la prime) ; cristal solide sans « +5 ».
- **Bug** : le cercle de placement ignore la longue-vue (`src/ui/placementRange.ts:17`).
- Carte « Monter au niveau 3 » : montre le total (+45 %), pas ★★ → ★★★. 4 cadeaux sur 7 en « % ».
  Le panneau mélange « bonus » et « cadeau ». « La rente » est un mot d'adulte.
- Écran « Tes 5 places sont prises » : en 780×360, 3 places sur 5 visibles sans défiler
  (422 px de contenu pour 310).
- Cinq cases de 48 px ne tiennent ni dans la barre du haut ni dans le dock actuel, sur aucun des
  trois formats.

### 6. Petits défauts relevés en passant

- Accueil : « Ton record : vague 46 » sans les rois, alors que la constante s'appelle
  `tonRecordVagueNNRois`.
- Le titre du plateau dit « Vagues 1 à 4 » au tour 3 ; rien ne dit « 3e tour » ni « plus forts ».
- 1280×800 : « Continuer sans bonus » et « Garder mes cadeaux » font 44 px de haut ;
  « Rentrer avec mon record » sort du bandeau. 780×360 : « 100 % » et « Vague 12 · rois : 1 » se
  coupent sur deux lignes au camp d'après un roi. `test:endless` ne contrôle pas ces boutons.

### 7. Performance (axe « 30 à 40 serpents »)

Jeu construit, 780×360, camp de 66 alliés, CPU ralenti par CDP (GPU logiciel ici : seul le coût
processeur est significatif) :

| CPU | Serpents vivants | Images/s | Travail de l'image | Pas moteur p50 (p95) |
| --- | ---------------: | -------: | -----------------: | -------------------: |
| ×4  |               20 |       26 |              16 ms |          2,4 ms (13) |
| ×4  |               30 |       15 |              40 ms |          9,4 ms (17) |
| ×4  |               40 |       13 |              52 ms |         11,4 ms (23) |
| ×6  |               30 |        7 |             100 ms |              17,5 ms |

- `nearestCampPoint` = 53 % d'un pas (via `defenseGoal`) : énumère ~1 000 points et trie tout
  pour en garder un. L'A* trie sa liste à chaque nœud ; le cache de chemins est vidé d'un coup à
  1 024 entrées. Pas de 200 à 1 000 ms observés même sur processeur de bureau.
- `scripts/benchmark.mjs` rate ce coût : il n'utilise que des ninjas.
- Rendu : mots flottants des coups 9-23 ms dès 30 serpents ; rafraîchissement HTML 11-25 ms toutes
  les 180 ms.
- **Plafond aujourd'hui : 25 serpents vivants.** Pic actuel des vraies vagues : 21-26.

## Recommandations, en lots

### Lot A — sans changer aucune règle (empreintes `engine-traces` identiques)

1. **Mesure** : une trace sans fin v1 dans `tests/engine-traces.test.ts` (il n'y en a aucune) ;
   profils `hasard` et `epargnant` dans `balance-modes.mjs`, achats pendant la vague, plus de 63
   places ; deux colonnes de plus : « vagues sans dégât au cristal » et « stock maximum ».
   Critère proposé : _l'épargnant et le hasard ne battent pas l'expert_.
2. **Performance** : cache des points du camp + une passe au lieu d'un tri ; grille d'obstacles
   précalculée ; A* avec tas ; cache de chemins qui oublie les plus anciens ; mots flottants moins
   coûteux ; un banc qui utilise un vrai camp. Objectif ×4 : pas moteur < 8 ms et image < 33 ms au
   p95. Re-mesurer avec le même banc.
3. **Petits défauts** du §6, rente annoncée en fin de vague, cercle de portée avec la longue-vue.

### Lot B — interface de gestion des cadeaux

- **Étagère** `#boon-shelf` (bouton de 48 px de haut dans le dock) : 5 cases avec signe et
  étoiles, cases vides en pointillé, visible au camp **et** en bataille. Un toucher ouvre
  `#boon-sheet` : les 5 cases en grand, ce que fait chacune en mots d'enfant, son niveau suivant.
  En 1280×800 il reste ~250 px libres sous le bandeau d'alliés.
- **Effet là où il agit** (rendu seulement, lit `game.boonLevel` / `game.boonGain`) : éclats sur
  les coups (forge), anneau/contour (armure, sans appel de dessin en plus), « +40 » près des pièces
  (rente), halo et « +5 » au cristal (cristal solide), portée montrée au placement (longue-vue :
  le moteur exporte `allyReach`), prix barré (marché).
- **Écran de choix** : cadeaux déjà pris au-dessus des 3 cartes ; « ★★ → ★★★ » ; places libres
  visibles ; écran « remplacer » qui tient en 780×360.
- **Récap** à la sortie et à la chute : cadeaux, rois, vague ; record avec ses rois à l'accueil ;
  record du joueur actif en bataille (aucune comparaison).
- **Mots d'enfant** (à relire par le parent et le fils, rien n'est écrit) : niveaux en 1 à 3
  signes plutôt qu'en %, « frappent plus fort / encore plus fort / super fort ! », le vrai prix
  pour le marché (« 135 pièces au lieu de 150 »), un seul mot « cadeau » partout, un autre nom pour
  « La rente » (pas « La tirelire » : c'est un défi du fils).
- Fichiers : `src/ui/boonShelf.ts`, `src/ui/boonSheet.ts`, `src/styles/19-boons.css` (importé en
  dernier), textes dans `src/texts/fr|en` puis `texts:build`. Tests : `tests/boon-shelf.test.ts`,
  `test:endless` (cases ≥ 48 px, dialogue, remplacement, rente), `test:locale`, un camp sans fin
  à 812×375 dans `test:audit`.

### Lot C — règles sans fin version 2 (mesure + accord du parent)

Formules simulées (20 parties, ±11 points ; rois battus ≥4 / ≥6) :

| Formule     | Principe                                                                                        | Début de tour ÷ vague 11 d'avant |            Hasard ≥4 / ≥6 | Expert ≥4 |
| ----------- | ----------------------------------------------------------------------------------------------- | -------------------------------: | ------------------------: | --------: |
| v1 actuelle | —                                                                                               |                             0,14 |                 75 / 45 % |      55 % |
| **F1**      | dès le tour 2, la vague w joue la vague min(11, 6 + ⌈w/2⌉) ; 20 serpents au plus ; ×1,45 / ×1,2 |                        0,78-0,82 |                 55 / 25 % |      10 % |
| **F1b**     | F1 avec ×1,35 / ×1,15                                                                           |                        0,72-0,75 |                 75 / 65 % |      50 % |
| F2          | hausse continue par vague, jusqu'à 28 serpents                                                  |                        0,55-0,89 |                 60 / 15 % |       0 % |
| F3          | jusqu'à 32 serpents, ×1,30 par tour                                                             |                        0,55-0,85 | 75 / 70 % (plus facile !) |      30 % |

- **Recommandé : F1**, la plus petite (une table de correspondance de vagues), sans retour à zéro,
  sans jamais dépasser 20 serpents (reste dans « jamais plus nombreux ») et sous le plafond de
  performance. Le parent choisit F1 (plus dur) ou F1b (aussi dur, mais régulier). F2/F3 : pas sans
  revoir l'économie et sans le lot A-2 (plus de serpents = plus de pièces, et > 25 vivants).
  Variante voisine trouvée par le rôle « hors des sentiers battus » : _les tours raccourcissent_
  (tour 2 à partir de la vague 4, tour 3 de la 7, puis de la 9) : 50-62 % de vagues tendues aux
  tours 3-4 (3 parties seulement).
- **La correspondance doit aussi nourrir l'intelligence des voies (`ai.ts:42`), les œufs, les
  spécialistes et les nouveaux serpents**, pas seulement le nombre et la vie.
- **Aucune formule ne touche « gros »** (zéro dégât après le tour 1) : à combiner avec une
  **bourse plafonnée** (valeur à mesurer avec la nouvelle courbe) et une **rente qui baisse avec la
  prime**. Ne pas faire monter les pièces par serpent.
- Implémentation : `EndlessRules` version 2 dans `src/endless.ts`, une seule fonction
  `endlessWaveNumbers` (exactement v1 pour la version 1), `readEndlessRules` accepte 2 ; brancher
  `game.ts:531` et `:595-599`, `spawning.ts:65, 119-121, 177, 224`, `ui/threatPreview.ts:163`,
  `render/missionAssets.ts:54`, l'annonce de vague (`waves.ts:47` dirait « quelques serpents »
  quand 13 arrivent) ; `checkpoints.ts:216` accepte 1 et 2 ; `BOON_RULES[2]` ; records
  (`endlessRecords.ts:36`) : décider avec le parent comment comparer un record v1 et v2. Une
  partie v1 reste v1.

### Lot D — plus tard, avec l'accord du fils

1. **Les portes du roi** (Pacte de Hades, Ascension de Slay the Spire) : après chaque King Snake,
   deux ou trois portes, chacune porte un défi du fils (nom et annonce **mot pour mot**) qui
   s'ajoute aux précédents et montre le meilleur cadeau qui l'attend ; une porte tranquille
   toujours ouverte. Défis adaptés : Serpents pressés, Rafales de serpents, Crocs pointus,
   Serpents costauds, Les carapaces, Pique-nique d'œufs. Sous réserve : Blindcrocs, La grande
   charge, La tirelire, Plus de miel !. Seulement si plus de serpents est accepté : Méga serpent,
   La tempête, Grandes rafales de serpents, La petite tempête, Grosse fringale. Pas adaptés :
   Bourse trouée, Le roi s'invite, Le roi et sa grande fringale, Deux copains seulement, Un seul
   copain.
2. **Le roi se souvient** : à chaque roi, King Snake ajoute un serpent existant qui contre la
   famille d'alliés la plus nombreuse du camp, et l'annonce par une lettre (« J'ai vu tes
   archers… »). Aucune règle touchée.
3. **Cadeaux de famille** (Brotato, Vampire Survivors) : « les archers tirent deux flèches », etc. ;
   évolution visible au niveau 3 ; « cadeau du roi » rare (tiré de la graine, gratuit) ; album des
   cadeaux. Le spinosaure doit rester le meilleur (`GAME_DESIGN.md` l. 221, 262) ; jamais de
   résurrection. Dessins = dépense à faire accepter.

Écarté : un marché de cadeaux tiré au hasard (hasard payé).

## Fidélité (condensé)

| Piste                             | Touche                                                                         | Verdict                                             |
| --------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------- |
| Lot A, lot B                      | aucune règle                                                                   | possible (lot B : mots à relire, dessins = dépense) |
| F1 / F1b                          | reste ≤ 20 serpents ; applique mieux « voie la moins défendue » et les œufs    | accord du parent, nouvelle version                  |
| Plus de 20 serpents (F2, F3)      | contredit « jamais plus nombreux » (`docs/MODE-INFINI.md`)                     | accord du parent après mesure                       |
| Portes du roi                     | noms et annonces mot pour mot (`CLAUDE.md`) ; défis imposés au lieu de choisis | accord du parent **et** du fils                     |
| Cadeaux de famille, cadeau du roi | pas de résurrection, spinosaure le meilleur                                    | parent (valeurs), fils (pouvoirs, noms)             |
| Record en bataille                | joueur actif seulement, aucun classement                                       | à montrer au parent                                 |

## Décisions à demander

**Au parent** : F1 ou F1b (ou les tours qui raccourcissent) ; revenir ou non sur « jamais plus
nombreux » ; plafond de bourse et rente qui baisse ; nouvelle version des cadeaux et leurs mots ;
où placer étagère et record en bataille ; comparaison des records v1 / v2 ; dépense de dessins
pour les signes des cadeaux.

**Au fils** : ses défis peuvent-ils arriver par les portes du roi, lesquels ; « Bourse trouée »
adaptée en « moitié des pièces d'un tour » ; pouvoirs par famille et nom d'un « cadeau du roi » ;
nouveau nom de « La rente ».

## Ordre conseillé

Lot A (mesure, performance, petits défauts) → lot B (étagère et effets visibles : c'est ce que le
parent voit tout de suite) → lot C (v2 mesurée avec les nouveaux profils, puis accord) → lot D.

## Pas vérifié

- Rien sur un vrai téléphone ni dans la WebView Android ; rien avec un enfant ni avec le parent.
- GPU non mesurable ici (logiciel) ; banc de performance artificiel.
- Les joueurs « hasard » et « épargnant » sont des modèles du parent ; échantillons de 3 à 20
  parties (±11 à ±14 points) ; pas au-delà de 6 rois ; pas de profil dino ni moyen pour les
  formules v2.
- La combinaison courbe + bourse plafonnée n'est pas mesurée ; rente indexée non mesurée.
- Aucun défi joué dans l'aventure sans fin ; interface anglaise non regardée.
- Références d'autres jeux : certaines lignes viennent de mémoire de jeu, non revérifiées.
