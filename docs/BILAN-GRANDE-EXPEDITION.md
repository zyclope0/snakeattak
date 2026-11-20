# La Grande Expédition — compte rendu (20 novembre 2026)

Demande du parent : un voyage plus long, plus profond, avec une vraie gestion des cadeaux.
Décisions, noms et mesures : [VOYAGE-LONG-PROPOSITION.md](VOYAGE-LONG-PROPOSITION.md).
Architecture : [ARCHITECTURE.md](ARCHITECTURE.md), « La Grande Expédition ».

## Ce qui est fait

- **Le moteur** (PR 103, fusionnée et publiée le 20 novembre) : trois tableaux de cinq
  missions tirés d'une graine, le camp qui suit l'enfant dans un tableau, les cadeaux de
  l'aventure sans fin, les haltes, des serpents un peu plus forts à chaque mission (réglage
  « moyen » choisi par le parent).
- **La porte.** « La Grande Expédition » dans la rangée du haut de la page « Le voyage », avec
  l'étiquette « Nouveau » jusqu'à la première expédition du joueur. Le voyage court ne change
  pas.
- **La carte du tableau.** Les sept pas (cinq missions, dont le gardien, et deux haltes), puis
  ce qui attend : une mission, deux chemins (« Le Chemin Tranquille » et « Le Chemin des
  Braves », qui promet un cadeau rare) ou deux haltes. Chaque mission montre sa petite carte,
  son caprice (l'autocollant s'explique d'un toucher) et, à la cinquième, son gardien. En bas :
  les cinq places de cadeaux avec leurs étoiles, ce que porte le camp (alliés, pièces,
  cristal), « Une autre expédition ».
- **Les haltes.** Le Feu de Camp et l'Œuf Mystère agissent tout de suite et disent ce qu'ils
  ont fait ; la Roulotte de Mamie Pistache ouvre sa boutique : acheter un cadeau ou en monter
  un d'un niveau avec les pièces du camp, puis « Repartir ».
- **Les cadeaux.** Trois au choix après chaque mission gagnée, « Trois autres cadeaux » une
  fois, ou « Ne rien prendre ». Après le Chemin des Braves, le cadeau arrive au niveau 2. Les
  cinq places prises, l'enfant choisit celui qui laisse sa place, ou garde les siens.
- **Sur le plateau.** Le repère « Expédition · mission 2 sur 5 », « Mission gagnée ! » puis
  « Continuer l'expédition ». Une mission perdue dit « On réessaie ? » : le camp revient comme
  avant la mission (rien n'est perdu, la règle du moteur).
- **Ce qui est gardé.** Une clé par joueur (`conquete-serpents:expedition:v1`, effacée avec le
  joueur) : l'expédition en cours, relue pas à pas, et « Ta plus longue expédition », un record
  personnel montré à l'arrivée. Une mission quittée en cours repart de son début, comme au
  voyage.
- **Les textes.** Tous dans `src/texts/fr/expedition.ts` et `src/texts/en/expedition.ts` : les
  noms se changent là, à un seul endroit.
- **Le poids.** Les écrans arrivent avec ceux du voyage, au premier toucher de sa porte : le
  paquet de départ ne grossit pas.

## Comment c'est vérifié

- `npm run verify` vert : 896 tests, dont 8 sur le moteur de l'expédition (une expédition
  gardée se relit telle quelle à chaque pas, une fausse est refusée) et 5 sur ses écrans (mots
  en français et en anglais, titres du plateau, carnet du joueur). Empreintes des parties de
  référence inchangées.
- `npm run test:expedition` (dans la CI, groupe « écrans ») : première visite, une vraie
  mission gagnée sur le plateau, le cadeau et sa relance, les deux chemins, la halte et la
  roulotte, les cinq places pleines, l'arrivée, « Une autre expédition » qui demande avant ;
  à 780×360, 812×375 et 1280×800, cibles de 48 px, pas de défilement de côté, et la porte en
  anglais.

## Pas vérifié

- Rien n'a été joué par un enfant ni sur un vrai téléphone.
- Les gardiens portent un nom (Capitaine Zigzag, Madame Gloups), mais sur le plateau c'est le
  roi à trois têtes, avec moins de vie : à voir avec le fils (un dessin à eux coûterait des
  crédits d'images).
- La porte est sur la page du voyage, pas sur l'accueil : l'accueil n'a plus de place sur un
  téléphone couché. À déplacer si le parent préfère.
- Le record du voyage court ne s'affiche plus dans la rangée du haut sous 1 000 px de large (la
  porte prend sa place) ; il reste à la fin du voyage.
- Pas de code à partager pour une expédition : à faire si les enfants veulent s'échanger la
  leur.
- Les défis originaux (crue, deux rois, serpents vitaminés, réveil difficile, ensorcelés,
  frousse, pouvoirs des serpents) ne sont pas encore faits : un par un, avec le fils.
- Pas encore dans l'application Android : il viendra avec le prochain build.
