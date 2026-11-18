# Bilan — révision 6 : le serpent sauterelle (18 novembre 2026)

## Décision

Idée du fils : des serpents « sauterelles » qui sautent derrière les lignes ; ensuite, si le
cristal est le plus proche, ils vont au cristal, sinon ils attaquent les personnages entre le
cristal et eux ; après le saut, ils marchent normalement. Le parent a choisi de commencer par
elle, a lu la mesure et l'a acceptée le 18 novembre, avec la vie 0,9, puis a accepté la
mesure refaite après la relecture (voir plus bas). Nom gardé :
« Serpent sauterelle » (« Grasshopper Snake »).

## Ce qui change

- Dans une nouvelle grande aventure : un serpent sauterelle par vague, dès la vague 7. Il
  prend la place 9 de la vague, qui était une Carapace, et n'est jamais changée en serpent
  volant.
- Il marche comme les autres jusqu'à ce qu'un allié de sa route soit à 110 devant lui. Il
  saute alors une fois par-dessus sa ligne (les alliés vivants de sa route à moins de 260
  devant lui) et se pose 40 plus loin que celui qui est le plus près du cristal : toujours
  derrière lui, jamais sur le cristal, un rocher ni la rivière. Sans place libre derrière la
  ligne (une ligne collée au cristal), il garde son saut et marche. Ensuite il marche
  normalement : il mord les alliés qu'il croise, ou entre dans le cristal.
- À l'écran : un arc en pointillés de son départ à son arrivée, et un petit son de bond.
  Le son du bond passe avant les coups du même instant. Fiche « Il saute une fois
  par-dessus tes alliés », avec une icône de saut, dans « Dangers » et « Tous les
  serpents ». Page « Nouveautés » du site.
- Dessin en pâte à modeler dans la quatrième case de la planche des nouveaux serpents
  (`PROVENANCE-SERPENTS-NOUVEAUX-2026-11-18.md`, 306 crédits).
- Les parties, codes (`AVENTURE-7-…`) et sauvegardes (version 12) d'avant gardent leurs
  règles ; une nouvelle partie a le code `AVENTURE-8-…` et une sauvegarde de version 13.
  Missions, défis et voyage ne changent pas.

## Mesure (200 grandes aventures par joueur automatique, mêmes départs)

| Joueur                 | Révision 5 | Révision 6 retenue | Première mesure | Essai vie 1,9 |
| ---------------------- | ---------- | ------------------ | --------------- | ------------- |
| expert : victoires     | 52 %       | 60 %               | 60,5 %          | 70 %          |
| moyen : vague atteinte | 9,48       | 10,06              | 9,89            | 9,87          |
| petit : vague atteinte | 7,33       | 7,42               | 7,42            | 7,38          |

**Première mesure, acceptée puis refaite** : la relecture a trouvé qu'à partir de la vague 9
la place de la sauterelle devenait un serpent volant. La première mesure ne voyait donc que
2 sauterelles par partie, pas 6. Corrigé (avec l'atterrissage toujours derrière la ligne et
la profondeur de la ligne), puis mesuré de nouveau : presque les mêmes chiffres. Le parent a
accepté cette mesure refaite le 18 novembre.

Le jeu devient un peu plus facile : la sauterelle remplace une Carapace (vie 1,9 et armure),
et, seule dans le camp après son saut, elle se fait battre vite. Sur 200 parties, le hasard
fait varier les victoires d'environ 7 points ; l'écart de l'expert est à cette limite. Lui
donner la vie de la Carapace rendait le jeu encore plus facile (70 %). Commande :
`REVISION=5|6 CLASSIC=200 PROFILES=expert,moyen,petit node --experimental-strip-types
scripts/balance-modes.mjs <sortie.json> 0 1 <grande-aventure.json>` (rapports dans
`artifacts/sauterelle/`, hors de Git).

## Vérifié

- Deux relectures indépendantes (huit angles) ; leurs corrections sont dans le lot.
- Tests (`tests/balance-revision-6.test.ts`) : révision ; ce qui sort vraiment de l'antre
  (une sauterelle dans chaque vague de 7 à 12) ; saut derrière l'allié de sa ligne le plus
  près du cristal, une seule fois ; jamais devant lui, sur le cristal, un rocher ou la
  rivière ; alliés tombés ou trop loin ignorés ; pas de saut pour un autre serpent ou King
  Snake ; une vraie ligne franchie en partie (le test échoue si le saut est retiré) ; codes
  et sauvegardes.
- Recettes de langue et de préparation des dangers (dix-sept serpents) passées en local. Les parties de
  référence des révisions 1 à 5 sont inchangées ; une partie de révision 6 est ajoutée.
- Les trois autres serpents de la planche sont identiques au pixel près.

## Pas vérifié

- Rien n'a été joué à la main, sur téléphone, ni avec les enfants.
