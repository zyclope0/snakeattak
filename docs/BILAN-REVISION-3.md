# Bilan — révision d'équilibrage 3 : un œuf de plus quand une vague dure

15 novembre 2026. Idée du fils (« plus d'œufs à mesure que la partie dure », `GAME_DESIGN.md`,
idée 7). Le parent a choisi le sens (« des œufs en plus quand une vague traîne ») puis le
réglage (« présent : après 45 s ») après une première mesure. Dans `main`, dans aucun build.

## Ce qui est fait

- **La règle.** Dans la grande aventure, quand une vague dure 45 secondes, un œuf apparaît ;
  un second 15 secondes plus tard ; jamais plus de deux par vague. Chacun éclot en 8 secondes
  et donne deux serpents. Le compte repart à chaque vague.
- **Où.** Grande aventure seulement. Les six missions, les 36 défis et le voyage restent en
  révision 2, sans cette règle.
- **Ce que voit l'enfant.** L'annonce « La vague dure… Un nouvel œuf est apparu ! », une
  phrase dans « Dangers » (« Si la vague dure, un œuf de plus peut arriver. ») et une dans
  l'aide. Aucun minuteur ni compte à rebours.
- **Rien d'ancien ne change.** C'est une nouvelle révision : un camp sauvegardé ou un code de
  départ d'avant garde ses règles. Les nouvelles grandes aventures partent en révision 3 :
  code `AVENTURE-5-…`, camp en version 10. Détail technique dans
  [ARCHITECTURE.md](ARCHITECTURE.md), « Révision 3 ».

## Les mesures

Joueurs automatiques sur le vrai moteur (`npm run balance:modes`), grande aventure, mêmes
départs pour chaque réglage. « Expert », « moyen » et « petit » sont trois façons de jouer
écrites pour l'audit de novembre ; aucun n'est un enfant.

Avant le choix, 80 parties par joueur et par réglage, règle simulée hors du jeu :

| Réglage (attente / écart / œufs par vague) | Expert gagne | Moyen : vague atteinte | Petit : vague atteinte |
| ------------------------------------------ | -----------: | ---------------------: | ---------------------: |
| Sans la règle                              |         54 % |                    9,6 |                    7,6 |
| 60 s / 20 s / 1                            |         54 % |                    9,6 |                    7,6 |
| **45 s / 15 s / 2 (choisi)**               |         69 % |                    9,5 |                    7,4 |
| 40 s / 10 s / 3                            |         53 % |                    9,5 |                    7,1 |

Après, sur le code livré, 200 parties par joueur et par révision (1 200 parties) :

| Joueur | Victoires r2 → r3 | Vague atteinte r2 → r3 | Durée d'une partie r2 → r3 |
| ------ | ----------------: | ---------------------: | -------------------------: |
| Expert |       61 % → 62 % |          11,90 → 11,94 |              446 s → 520 s |
| Moyen  |         1 % → 1 % |            9,66 → 9,63 |              338 s → 398 s |
| Petit  |         0 % → 0 % |            7,59 → 7,36 |              258 s → 288 s |

**À retenir.** Le « 54 % → 69 % » annoncé au parent avant son choix ne tenait pas : 80
parties, c'était trop peu. Sur 200 parties, la règle **ne change pas le taux de victoire**.
Elle allonge les parties (une demi-minute à une minute de plus) et le joueur le plus faible
tombe un peu plus tôt (un quart de vague). Les vagues courtes du début ne sont pas touchées :
les œufs en plus arrivent surtout à partir de la vague 6 et devant King Snake.

## Comment c'est vérifié

- `npm run verify` : 755 tests, dont `tests/balance-revision-3.test.ts` (la règle à 45 s et
  60 s, pas de troisième œuf, rien dans une vague courte, rien en révision 1 ou 2, rien dans
  une mission ; camp version 10 ; code règle 5 ; sauvegarde familiale ; texte anglais).
- **Parties d'avant identiques.** 570 parties entières rejouées (110 435 empreintes) sur
  `main` et sur cette branche, comparées à la même référence : la liste des écarts est la
  même au caractère près dans les deux cas (les 114 parties où un message nomme King Snake).
  Aucune partie des révisions 1 et 2 ne bouge.
- **Sauvegardes et codes d'avant lus pareil.** 1 533 261 cas comparés entre `main` et cette
  branche (camps, codes, carrières, carnets, fichiers familiaux, entiers ou abîmés). Seuls
  écarts : 29 146 codes écrits avec la règle 5, que l'ancien jeu refusait (« version ») et que
  le nouveau lit ou refuse pour une autre raison, et des objets fabriqués par le banc
  d'essai avec « révision 3 », qui n'existaient pas avant.
- Une partie de référence de la révision 3 est ajoutée à `tests/engine-traces.test.ts`.
- Recettes navigateur : voir la PR.

## Ce qui n'est pas vérifié

- **Rien n'est essayé sur le téléphone ni avec les enfants.** On ne sait pas si l'annonce se
  remarque en plein combat, si 8 secondes laissent le temps de réagir, ni si une vague qui
  s'allonge amuse ou lasse.
- L'anglais des trois phrases n'est pas relu par une personne.
- Les joueurs automatiques ne « voient » pas l'œuf : ils ne changent pas leur défense quand
  il apparaît.

## À savoir avant de publier

- Le build 61 et le site actuel **ne lisent pas** un camp ou un code de la révision 3 : le
  code est refusé (« version »), et un fichier familial qui contient un tel camp est refusé
  en entier, sans rien écraser. Dans l'autre sens tout se lit. Si une famille passe un
  fichier d'un appareil à l'autre, mieux vaut publier le site et l'application ensemble.
- Revenir en arrière : remettre `CURRENT_BALANCE_REVISION` à 2 (et son test) suffit pour que les nouvelles
  parties repartent sans la règle ; les parties commencées en révision 3 la gardent.
