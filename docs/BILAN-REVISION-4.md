# Bilan — révision d'équilibrage 4 : trois nouveaux serpents

16 novembre 2026. Idées du fils (`GAME_DESIGN.md`, idées 2, 3 et 4) : des serpents à grands
crocs, un serpent très rare et très fragile qui peut tuer une Massue d'un coup, un serpent
ninja. Dans `main`, dans aucun build.

## Ce que le parent a décidé

- **Le ninja esquive** : rapide, le premier coup qu'il reçoit le rate. Les deux autres
  propositions (il se cache, il se faufile) sont écartées.
- **Un expert simulé qui gagne environ une partie sur deux, c'est d'accord.** C'est le dosage
  « doux » des mesures ci-dessous.

## Ce qui est fait

| Serpent       | Ce qu'il fait                                                             | Quand                       |
| ------------- | ------------------------------------------------------------------------- | --------------------------- |
| Serpent ninja | Va 1,4 fois plus vite ; esquive le premier coup (« Esquive ! »)           | Un par vague dès la vague 6 |
| Grands crocs  | Sa morsure fait deux fois plus mal ; un peu plus lent                     | Un par vague dès la vague 8 |
| Serpent rare  | Trois fois moins de vie ; sa morsure vaut toute la vie d'une Massue (140) | Deux fois : vagues 8 et 11  |

- **Grande aventure seulement.** Missions, défis et voyage ne reçoivent aucun des trois.
- **Chacun prend la place d'un serpent simple** (ordinaire, vif ou carapace) : le nombre de
  serpents d'une vague ne change pas, ni ses spécialistes, ni les pièces gagnées.
- **Ce que voit l'enfant.** Une fiche pour chacun dans « Dangers » et dans « Tous les
  serpents », avec sa vague ; un conseil (archer contre le serpent rare, bouclier contre les
  grands crocs) ; « Esquive ! » au-dessus du ninja.
- **Rien d'ancien ne change.** Nouvelle révision : les nouvelles grandes aventures partent en
  révision 4 (code `AVENTURE-6-…`, camp en version 11) ; les parties, codes et sauvegardes
  d'avant gardent leurs règles. Détail dans [ARCHITECTURE.md](ARCHITECTURE.md), « Révision 4 ».

## Les mesures

Joueurs automatiques sur le vrai moteur (`npm run balance:modes`), grande aventure, 200
parties par joueur et par dosage, mêmes départs. Aucun n'est un enfant, et aucun ne change sa
défense quand un nouveau serpent arrive.

| Dosage                                                                                                       | Expert gagne | Moyen : vague atteinte | Petit : vague atteinte |
| ------------------------------------------------------------------------------------------------------------ | -----------: | ---------------------: | ---------------------: |
| Avant (révision 3)                                                                                           |         62 % |                   9,63 |                   7,36 |
| Ninja seul                                                                                                   |         58 % |                   9,49 |                   7,39 |
| Grands crocs seuls                                                                                           |         58 % |                   9,54 |                   7,36 |
| Serpent rare seul                                                                                            |         56 % |                   9,53 |                   7,37 |
| **Les trois, « doux » (choisi et livré)**                                                                    |     **52 %** |               **9,50** |               **7,40** |
| Les trois, « corsé » (crocs ×2,5 et deux par vague dès la vague 10, serpent rare quatre fois, deux esquives) |         47 % |                   9,38 |                   7,49 |

- Un serpent seul ne se distingue pas du hasard de 200 parties ; les trois ensemble font
  perdre une dizaine de points à l'expert.
- Les joueurs plus faibles ne sont presque pas touchés : ils tombent avant la vague 8, où
  arrivent les grands crocs et le serpent rare.
- Le serpent rare fait bien ce que le fils a imaginé : sur 717 apparitions, 418 alliés
  tombés sous sa morsure (un peu plus d'une fois sur deux), puis il meurt vite.
- Le code livré, rejoué sur 600 parties, redonne exactement la ligne « doux ».

## Comment c'est vérifié

- `npm run verify` : tests unitaires, dont `tests/balance-revision-4.test.ts` (valeurs
  retapées, places dans les vagues, aucune vague changée avant la révision 4, aucun nouveau
  serpent dans les missions, esquive, morsure, fiches, images, camp version 11, code règle 6,
  sauvegarde familiale).
- **Parties d'avant identiques.** 570 parties entières rejouées sur `main` et sur cette
  branche : la liste des écarts à la référence est la même au caractère près. La partie de
  référence de la révision 3 garde son empreinte ; une partie de référence de la révision 4
  est ajoutée.
- **Sauvegardes et codes d'avant lus pareil.** 1 533 261 cas comparés (camps, codes,
  carrières, carnets, fichiers familiaux, entiers ou abîmés). Par rapport à la révision 3,
  un seul écart nouveau : 474 codes écrits avec la règle 6, que le jeu refusait
  (« version ») et qu'il refuse toujours, pour une autre raison. Tout le reste est identique.
- **Dans le navigateur** (camp de la vague 7, puis la vague 8), en 780×360, 1280×800 et
  812×375 en anglais : les trois fiches dans « Dangers » et dans l'index, les trois serpents
  sur le plateau, aucune erreur de page.

## Ce qui n'est pas vérifié

- **Rien n'est essayé sur le téléphone ni avec les enfants.** On ne sait pas si « Esquive ! »
  se remarque, si le serpent rare amuse ou vexe, ni si la fin de l'aventure devient trop dure.
- **Les noms sont provisoires** (« Grands crocs », « Serpent rare », « Serpent ninja ») :
  c'est au fils de les nommer.
- **Les images sont provisoires** : des serpents existants recolorés (rouge, or pâle,
  violet), sans dépense. Les grands crocs n'ont pas de crocs visibles, et le ninja porte les
  lunettes du Vif. De vrais dessins sont une dépense, à décider par le parent.
- Les annonces de vague ne nomment pas encore les nouveaux serpents.
- L'anglais des nouvelles phrases n'est pas relu par une personne.

## À savoir avant de publier

- Comme pour la révision 3 : le build 62 et le site actuel ne lisent pas un camp ou un code
  de la révision 4 (refus propre). Publier le site et l'application ensemble.
- Revenir en arrière : remettre `CURRENT_BALANCE_REVISION` à 3 (et son test) ; les parties
  commencées en révision 4 gardent leurs serpents.
