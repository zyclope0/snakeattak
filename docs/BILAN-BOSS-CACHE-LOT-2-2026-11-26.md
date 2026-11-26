# Bilan — boss caché, lot 2 : le combat et sa mesure (26 novembre 2026)

Décisions du parent du 26 novembre ([BOSS-CACHE.md](BOSS-CACHE.md)) : un combat à part, un
très long serpent en anneaux de pâte qui gagne un anneau chaque fois qu'il avale un allié
tombé ou du miel, perd chaque anneau cassé, et est vaincu quand il ne reste que sa tête. Ce lot
fait le combat, ses nombres, la mesure et un essai visible sur un banc d'essai. **Aucun écran
du jeu n'y mène** : ni bouton de l'accueil, ni déblocage par les pommes, ni dessin définitif,
ni nom (lot 3). Rien n'est poussé, rien n'est publié.

## Les règles, telles qu'elles sont écrites

Nombres de la version 1, qui est le réglage « moyen » (`src/hiddenBossTuning.ts`).

- **Préparation**, comme une mission : la clairière des fougères, une bourse de **1 200
  pièces**, le héros et les deux combattants à massue, la boutique de toujours avec **tous les
  alliés** de la révision d'équilibrage 7 (le boss vient après l'aventure). Puis **une seule
  vague**, lancée par le bouton de toujours. Pas d'escorte, pas d'œuf : le boss est seul.
- **Le boss** sort de l'antre de gauche : une tête suivie de **18 anneaux**, espacés de 22. La
  tête marche à **24** (un serpent de la première vague marche à 40), sur les routes de tous
  les serpents ; aux deux carrefours elle prend la voie **la moins défendue**, aussi finement
  qu'un serpent de fin d'aventure (règle « malins » des caprices).
- **Les alliés** restent autonomes et frappent les anneaux avec leur choix de cible de
  toujours. **La tête ne peut pas être touchée** : elle n'est pas parmi les serpents, donc
  aucun coup, aucune flamme, aucun obus ne l'atteint.
- **Un anneau** a **450 PV**. Quand il tombe à zéro, **c'est l'anneau frappé qui disparaît**
  (pas la queue), et ceux de derrière avancent d'une place pour refermer le corps. Il paie
  **20 pièces**. Pourquoi l'anneau frappé : l'enfant voit disparaître celui que ses alliés ont
  cassé ; faire disparaître la queue à la place d'un anneau du milieu serait une règle
  invisible.
- **La tête mord** l'allié le plus proche à **44** (la portée de contact des serpents) :
  **14** dégâts par seconde. Comme tout serpent, elle mord un soigneur sans s'arrêter.
- **Avaler un allié** : un allié qui tombe à **60** de la tête est avalé — parti pour de
  bon, comme tout allié tombé — et le corps gagne **un anneau à la queue**, plein, jusqu'à
  **30 anneaux au plus** ; à 30, elle avale sans grandir. Elle s'arrête **1,5 s** pour
  avaler. Une palissade tombée n'est pas avalée (c'est du bois).
- **Le miel** (« Attirer » ou « Ralentir », les deux de toujours) : la tête mange un pot posé
  sur **sa** voie quand elle l'atteint (à 12 près) : **un anneau de plus**, et elle reste
  **4 s** à manger. Avant de l'atteindre, le miel garde son effet de toujours sur un boss :
  le collant la ralentit (×0,75, comme le roi), l'attirant la tente aux carrefours (une fois
  sur quatre, comme le roi). Le marché : du temps et une voie choisie contre un anneau.
- **Victoire** quand il ne reste que la tête : **elle s'enroule et s'endort** (« Victoire !
  Le boss caché n'a plus que sa tête : il s'enroule et s'endort. »).
- **Défaite** si la tête entre au cristal : le cristal tombe à zéro et la règle de défaite de
  toujours s'applique (« Le camp est tombé… »).
- Ni minuteur, ni hasard payant, ni résurrection. Le seul tirage du combat est le choix de
  voie de la tête (au départ et à chaque carrefour), dans la suite de la graine.

## Versions des nombres

Tous les nombres vivent dans un seul objet par réglage. Une partie garde **la version** de ses
nombres (`hiddenBoss.version`), et cette version nomme aussi sa révision d'équilibrage (7) :
une révision 8 future ne changera pas un combat de version 1. Une version qu'un enfant a jouée
ne change plus ; une valeur nouvelle sera une version 2. La version 1 n'a été jouée par aucun
enfant : tant que le combat n'est pas publié, elle peut encore devenir le réglage que le parent
choisit. Une version inconnue est refusée. Les réglages d'essai du laboratoire donnent une
partie **sans** version (elle ne pourra pas être gardée).

## La mesure (`npm run balance:hidden-boss`)

200 combats par réglage et par joueur automatique (ceux de `scripts/lab/players.ts`, les
mêmes que pour l'expédition), 1 800 combats en 101 s. « A grandi » : le boss a gagné au
moins un anneau pendant le combat ; « + » : anneaux gagnés en moyenne.

| Réglage               | Joueur   | Victoires | Durée moyenne | A grandi | Gagné en moyenne | Alliés avalés |
| --------------------- | -------- | --------: | ------------: | -------: | ---------------: | ------------: |
| **doux**              | expert   |     100 % |          95 s |    100 % |             +1,1 |           1,1 |
|                       | moyen    |      81 % |         104 s |     92 % |             +2,7 |           2,7 |
|                       | apprenti |      49 % |         109 s |     70 % |             +1,9 |           1,9 |
| **moyen** (version 1) | expert   |      92 % |         126 s |    100 % |             +2,1 |           2,1 |
|                       | moyen    |      59 % |         119 s |     92 % |             +2,9 |           2,9 |
|                       | apprenti |      36 % |         130 s |    100 % |             +3,5 |           3,5 |
| **costaud**           | expert   |      69 % |         142 s |    100 % |             +4,0 |           4,0 |
|                       | moyen    |      49 % |         120 s |    100 % |             +4,1 |           4,1 |
|                       | apprenti |       0 % |         114 s |    100 % |             +4,3 |           4,3 |

Les trois réglages (ce qui change de l'un à l'autre) :

| Réglage | Bourse | Anneaux (au plus) | PV d'un anneau | Pièces d'un anneau | Vitesse | Morsure | Arrêt allié / miel |
| ------- | -----: | ----------------: | -------------: | -----------------: | ------: | ------: | -----------------: |
| doux    |  1 300 |           16 (28) |            400 |                 25 |      22 |      12 |          2 s / 5 s |
| moyen   |  1 200 |           18 (30) |            450 |                 20 |      24 |      14 |        1,5 s / 4 s |
| costaud |  1 300 |           20 (32) |            500 |                 15 |      26 |      18 |        1,2 s / 3 s |

Le corps n'est jamais devenu plus long qu'au départ : les alliés cassent les anneaux plus vite
que la tête n'avale. On le voit grandir (« 17 → 18 ») au milieu d'un corps qui raccourcit.

**Le miel mangé** (`MIEL=attirant`, `MIEL=attirant-fort`, `MIEL=collant`) : le collant posé
quand la tête entre au camp ne change rien, ni en bien ni en mal — la tête est arrêtée par
les alliés du front avant d'arriver au miel. L'attirant posé sur sa voie dès la sortie est
mangé 53 à 77 % du temps ; il ne change presque rien à l'expert (92 → 88 %) et au joueur moyen
(59 → 58 %), mais fait tomber l'apprenti de 36 à 7 %. Posé sur la voie la mieux défendue, il
n'attire presque jamais le boss (une fois sur quatre au carrefour) et n'est presque jamais
mangé. **Tel quel, le miel ne sert guère contre ce boss** : à décider avec le parent (un arrêt
plus long, un miel qui le ralentit davantage, ou le laisser ainsi : « ne nourris pas le
boss »).

Proposition au parent : le réglage **moyen**, déjà en place par défaut. Cible donnée (à
confirmer) : l'expert gagne presque toujours, le joueur moyen une fois sur deux, l'apprenti
rarement mais parfois, en quelques minutes. Mesuré : 92 %, 59 %, 36 %, deux minutes. Aucun
réglage ne met l'apprenti entre 5 et 25 % : voir les limites ci-dessous.

## Ce qui a changé ailleurs (et ce qui n'a pas changé)

- `src/game.ts` : `MAX_STEP` est exporté (même valeur). `src/engine/state.ts` : le champ
  facultatif `chainRing` dans le type `Entity`, absent de toute autre partie.
  `src/render/actors.ts` : un anneau n'est pas dessiné en serpent (une ligne).
- Ni `checkpoints.ts`, ni les codes de départ, ni les sauvegardes, ni les règles d'un pas
  (`src/engine/*` sauf le nouveau `bossChain.ts`) n'ont changé.
- Paquet principal : **195 889 octets** sur 200 000 (195 791 avant : la ligne de
  `actors.ts`). Le combat, ses nombres et son dessin n'y sont pas ; les sept textes nouveaux
  sont dans le dictionnaire anglais (son propre fichier).

## Comment c'est vérifié

- `tests/hidden-boss.test.ts` (15 tests) : version 1 = « moyen », retapée valeur par valeur,
  version inconnue et réglages faux refusés ; préparation (bourse, camp, boutique entière,
  clairière, pas de boss) ; la tête n'est jamais une cible ; un anneau cassé quitte le corps,
  paie, et celui de derrière prend sa place ; un allié avalé donne un anneau à la queue et ne
  revient pas, la tête s'arrête pour avaler ; une palissade n'est pas avalée ; le miel
  attirant et le miel collant mangés (un anneau, l'arrêt) ; le collant ralentit avant ; borne
  des anneaux ; victoire quand il ne reste que la tête (et plus rien ne bouge) ; défaite au
  cristal ; même graine = même combat pas à pas (empreinte de l'état entier) ; une aventure, une
  mission et une aventure sans fin jouées n'ont aucun champ nouveau dans leur JSON ; aucun
  autre fichier de `src/` n'importe le boss.
- **Empreintes des parties rejouées (`tests/engine-traces.test.ts`) inchangées** (fichier
  des empreintes non modifié, test vert). `npm test` : 1 085 tests verts.
- `npm run balance:modes` (27 816 parties, en deux moitiés : le code d'avant, tiré du commit
  `4312f9b`, et celui d'après) et `npm run balance:caprices` (6 804 parties) : **résultats
  identiques partie par partie** (fichiers JSON des résultats égaux, champ par champ).
- `npm run test:hidden-boss` (nouvelle recette, groupe « écrans » de la CI, 17 s ici) : le
  vrai plateau sur un banc d'essai, en 780×360 tactile (mouvements réduits) et en 1280×800 :
  bourse de la version 1, aucun boss pendant la préparation, huit alliés achetés, vague lancée
  par le vrai bouton, 18 anneaux écrits au-dessus de la tête, un allié avalé à 37 s (17 → 18
  sur le plateau), un anneau cassé (18 → 17, +20 pièces), victoire à 250 s après 7 alliés
  avalés et 25 anneaux cassés, « 0 » au-dessus de la tête enroulée. Captures (non gardées dans
  Git) : `artifacts/boss-cache/{780x360,1280x800}-{debut,avale,victoire}.png`.
- `npx tsc --noEmit`, `npx prettier --check`, `npm run texts:build`, `npm run test:locale`
  (529 vérifications, aucun texte inconnu), `npm run build`.

## Ce qui n'est pas vérifié, et les limites

- **Rien sur le vrai téléphone, rien avec les enfants.** Le fils n'a ni vu ni nommé le boss.
- **Les joueurs automatiques ne sont pas des enfants.** Ils n'achètent qu'en préparation : les
  pièces des anneaux cassés ne leur servent jamais, alors qu'un enfant peut acheter des
  renforts pendant le combat. Un enfant aura donc un peu plus d'aide que mesuré.
- **La mesure est grossière** : avec une seule vague, le joueur « moyen » et l'apprenti
  placent leurs achats « une voie après l'autre » à partir d'une voie tirée de la graine —
  trois camps possibles, et le boss malin trouve toujours la voie faible. Le résultat dépend
  surtout de ce camp : pour l'apprenti du réglage moyen, un des trois camps gagne (34 sur 35),
  les deux autres perdent. D'où des marches nettes (36 % ou 0 % selon un point de morsure) et
  aucun réglage avec un apprenti entre 5 et 25 %.
- **Le dessin est provisoire** : tête du serpent ordinaire agrandie, anneaux en ronds de pâte
  dessinés par Phaser, nombre d'anneaux sur une plaque. L'écran de fin est celui de la grande
  aventure (« Tes alliés ont tenu les 1 vagues et repoussé le roi ! », étoiles 0 / 9,
  « Rejouer une aventure ») : à refaire au lot 3. Sur le banc, la recette avance le combat
  d'un coup, ce qui fait apparaître de gros nombres flottants (« −388 ») qu'une vraie partie
  ne montre pas.
- **Pas de sauvegarde** : un combat du boss n'est ni gardé ni repris (`checkpoints.ts` ne le
  connaît pas) ; le lot 3 devra soit le garder avec sa version, soit le refuser explicitement.
- Pas de son à lui, pas de nom, pas de bouton : lot 3.
