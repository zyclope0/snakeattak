# Bilan — révision d'équilibrage 5 : le serpent ninja se téléporte

18 novembre 2026. Idée du fils (`GAME_DESIGN.md`) : le serpent ninja « est aussi rapide que le
Ninja, et parfois il se téléporte dans le dos d'un personnage ». Dans aucun build Android.

## Ce que le parent a décidé

- **Une fois, à la place de l'esquive** : quand un allié frappe le serpent ninja pour la
  première fois, le coup le rate et il revient dans le dos de cet allié. Le coup suivant le
  touche normalement. Les autres propositions (en plus de l'esquive, ou au hasard à chaque
  coup) sont écartées.
- **Fusion acceptée après lecture des mesures ci-dessous** (même jour).

## Ce qui est fait

- **Dans le dos** : du côté que l'allié ne regarde pas, à 34 unités du plateau au plus.
  Quand cette place est un rocher, la rivière, hors du plateau, à moins de 60 unités du cristal
  ou sur une case où l'on ne peut pas marcher, le jeu essaie plus près (trois quarts, moitié)
  et un peu plus haut ou plus bas ; si aucune place n'est bonne, le serpent esquive sur place,
  comme avant. Un allié posé tout près du cristal ne le renvoie donc jamais devant lui. Le
  serpent repart vers l'étape de la route qui est devant lui : il ne recule pas vers l'antre.
- **Seul le serpent visé saute.** Effleuré par l'explosion d'un tank ou d'un dragon tirée sur
  un autre, son premier coup passe mais il reste où il est. L'explosion reste là où elle est
  tombée, même quand le ninja visé saute pendant qu'elle touche les autres.
- **Ce que voit l'enfant** : le coup raté est dessiné là où le ninja était (l'allié ne se
  retourne pas) ; un grand anneau sombre et clair se ferme où il était, un autre s'ouvre où il
  revient, pendant 0,8 s ; deux notes montantes, son propre son, entendu avant les coups de la
  même image ; « Esquive ! » reste écrit. Sa fiche dans « Dangers » et dans « Tous les
  serpents » dit « Rapide : au premier coup, il disparaît et revient derrière celui qui l'a
  frappé » ; une partie de la révision 4 garde « il esquive le premier coup », index compris.
  La page « Nouveautés » du site dit la nouvelle règle.
- **Miel collant** : il colle les serpents d'une voie et d'une zone ; un ninja qui saute hors
  de la zone n'est plus collé. C'est la règle du miel, pas un oubli.
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
  l'enfant, pas la difficulté. La mesure ne voit pas un écart de moins de 10 points environ :
  dès le premier ninja, les parties des deux révisions divergent.
- La relecture a mesuré 567 autres parties, dont un joueur qui place ses alliés comme un
  enfant (une rangée devant, archers et soigneur au fond) : 11 ± 6 % de victoires en révision
  4, 15 ± 7 % en révision 5 ; les ninjas n'abîment pas plus le cristal.
- **Ce qui change pour l'enfant** : un ninja sur six à un sur trois finit par mordre un allié
  de l'arrière (archer, soigneur) qu'il n'atteignait presque jamais (expert 2,8 % → 16,6 %,
  moyen 10 % → 25 %, « enfant » 9 % → 28 %). Ces morsures tuent peu : 0,2 allié par partie
  au plus.
- Sur 1 618 ninjas frappés, 1 603 se téléportent ; les autres esquivent sur place, le plus
  souvent parce que l'allié qui frappe, au bord du pont, regarde vers la droite : son dos est
  la rivière.

## Comment c'est vérifié

- `npm run verify`, dont `tests/balance-revision-5.test.ts` : révision courante, prix, œufs et
  vagues identiques à la révision 4 ; le premier coup rate le ninja, qui revient dans le dos
  de l'allié, sur un sol libre, une seule fois ; la révision 4 esquive sans bouger ; jamais sur
  un rocher, dans la rivière ni près du cristal ; aucun autre serpent ne bouge ; fiches selon
  la révision ; code règle 7, camp version 12, sauvegarde familiale.
- `tests/engine-traces.test.ts` : les parties de référence (révisions 1 à 4) gardent leurs
  empreintes ; une partie de la révision 5 a la sienne.
- Relecture à huit angles (anciennes parties, téléportation, codes et sauvegardes, ce que voit
  l'enfant, mesure, textes, rendu, recettes) et revue de Codex : 72 parties des révisions 1 à 4
  rejouées identiques pas à pas avec le code d'avant ; leurs défauts sont corrigés ci-dessus.

## Ce qui n'est pas vérifié

- Rien n'a été joué à la main, sur un téléphone, ni avec les enfants. Un joueur automatique ne
  remarque pas un serpent qui apparaît derrière ses lignes ; un enfant, si.
- Le ninja a toujours une image provisoire (dessins à venir).
