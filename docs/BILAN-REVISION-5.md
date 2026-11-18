# Bilan — révision d'équilibrage 5 : le serpent ninja se téléporte

18 novembre 2026. Idée du fils (`GAME_DESIGN.md`) : le serpent ninja « est aussi rapide que le
Ninja, et parfois il se téléporte dans le dos d'un personnage ». Dans `main`, dans aucun build.

## Ce que le parent a décidé

- **Une fois, à la place de l'esquive** : quand un allié frappe le serpent ninja pour la
  première fois, le coup le rate et il revient dans le dos de cet allié. Le coup suivant le
  touche normalement. Les autres propositions (en plus de l'esquive, ou au hasard à chaque
  coup) sont écartées.
- **Fusion acceptée après lecture des mesures ci-dessous** (même jour).

## Ce qui est fait

- **Dans le dos** : du côté que l'allié ne regarde pas, à 34 unités du plateau au plus.
  Quand cette place est un rocher, la rivière ou hors du plateau, le jeu essaie plus près
  (trois quarts, moitié) et un peu plus haut ou plus bas ; si aucune place n'est libre, le
  serpent reste où il est, comme avant. Il ne revient jamais à moins de 60 unités du cristal :
  il l'atteindrait dans le même pas. Il refait son chemin depuis sa nouvelle place.
- **Ce que voit l'enfant** : un anneau se ferme où il était, un autre s'ouvre où il revient ;
  le bruit d'une flèche ; « Esquive ! » reste écrit. Sa fiche dans « Dangers » et dans « Tous
  les serpents » dit « Rapide : au premier coup, il disparaît et revient derrière celui qui l'a
  frappé » ; une partie de la révision 4 garde « il esquive le premier coup ». La page
  « Nouveautés » du site dit la nouvelle règle.
- **Rien d'ancien ne change.** Nouvelle révision : les nouvelles grandes aventures partent en
  révision 5 (code `AVENTURE-7-…`, camp en version 12) ; les parties, codes et sauvegardes
  d'avant gardent leurs règles. Missions, défis et voyage n'ont pas de serpent ninja.

## Les mesures

Joueurs automatiques sur le vrai moteur (`npm run balance:modes`, `REVISION=4` puis `5`),
grande aventure, 200 parties par joueur, mêmes départs.

| Joueur | Révision 4 (esquive)           | Révision 5 (téléportation)     |
| ------ | ------------------------------ | ------------------------------ |
| Expert | 52 % de victoires, vague 11,84 | 51 % de victoires, vague 11,88 |
| Moyen  | 0 % de victoires, vague 9,50   | 1 % de victoires, vague 9,47   |
| Petit  | 0 % de victoires, vague 7,40   | 0 % de victoires, vague 7,34   |

- Aucune différence au-delà du hasard de 200 parties : la téléportation change ce que voit
  l'enfant, pas la difficulté.
- Sur 120 serpents ninja des vagues 6 à 8 (40 départs, camp solide) : 105 téléportations ;
  les autres esquivent sur place faute de place libre (rivière, rochers, bord du cristal).
  Tous finissent battus, dans les deux révisions.

## Comment c'est vérifié

- `npm run verify`, dont `tests/balance-revision-5.test.ts` : révision courante, prix, œufs et
  vagues identiques à la révision 4 ; le premier coup rate le ninja, qui revient dans le dos
  de l'allié, sur un sol libre, une seule fois ; la révision 4 esquive sans bouger ; jamais sur
  un rocher, dans la rivière ni près du cristal ; aucun autre serpent ne bouge ; fiches selon
  la révision ; code règle 7, camp version 12, sauvegarde familiale.
- `tests/engine-traces.test.ts` : les parties de référence (révisions 1 à 4) gardent leurs
  empreintes.

## Ce qui n'est pas vérifié

- Rien n'a été joué à la main, sur un téléphone, ni avec les enfants. Un joueur automatique ne
  remarque pas un serpent qui apparaît derrière ses lignes ; un enfant, si.
- Le ninja a toujours une image provisoire (dessins à venir).
