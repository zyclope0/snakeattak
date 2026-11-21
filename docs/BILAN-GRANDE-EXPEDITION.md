# La Grande Expédition — compte rendu (20 novembre 2026)

Demande du parent : un voyage plus long, plus profond, avec une vraie gestion des cadeaux.
Décisions, noms et mesures : [VOYAGE-LONG-PROPOSITION.md](VOYAGE-LONG-PROPOSITION.md).
Architecture : [ARCHITECTURE.md](ARCHITECTURE.md), « La Grande Expédition ».

## Le 21 novembre : l'expédition remplace le voyage

Remarque du parent : « l'expédition doit remplacer le voyage, ça fait des doublons ; garde
l'apparence du voyage, qu'on voie bien la route, les embranchements ». Ses choix : la porte
s'appelle « La Grande Expédition » ; un voyage déjà commencé se finit, on n'en lance plus.

- **La porte de l'accueil**, à côté de « Jouer », dit « La Grande Expédition » (« Nouveau »
  jusqu'à la première), puis « Reprendre l'expédition ». Tant qu'un voyage commencé n'est pas
  fini, elle dit « Reprendre le voyage » et mène à lui ; sa fin n'offre plus qu'un bouton,
  « La Grande Expédition ». Plus de nouveau voyage, plus de code à donner ou à taper ; les
  sauvegardes et les anciens codes restent lisibles.
- **La carte en forme de route** : comme le chemin du voyage, une route en pointillés va de la
  première mission au gardien et se sépare en deux à chaque embranchement (Tranquille en
  haut, des Braves en bas, avec une étoile) et à chaque halte (leurs images). Le chemin déjà
  pris est tracé en vert, les arrêts non choisis s'estompent, ceux à choisir ressortent.
- **Le site** parle de La Grande Expédition au lieu du Voyage (accueil, « Comment jouer »,
  nouveautés), nombres tirés des règles.
- La porte lit l'expédition sans charger ses règles (`expeditionLog.ts`) : le paquet de départ
  reste à 193,2 Ko (limite 200).

## Ce qui est fait

- **Le moteur** (PR 103, fusionnée et publiée le 20 novembre) : trois tableaux de cinq
  missions tirés d'une graine, le camp qui suit l'enfant dans un tableau, les cadeaux de
  l'aventure sans fin, les haltes, des serpents un peu plus forts à chaque mission (réglage
  « moyen » choisi par le parent).
- **La porte** (20 novembre) : sur la page « Le voyage » ; depuis le 21, sur l'accueil (voir
  plus haut).
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
  fois, ou « Ne rien prendre ». Après le Chemin des Braves, « Cadeau rare ! » : un cadeau qui
  dure monte de deux niveaux, la bourse donne deux fois plus ; chaque carte dit le niveau ou
  la somme qu'elle donnera. Les cinq places prises, l'enfant choisit celui qui laisse sa
  place, ou garde les siens.
- **Sur le plateau.** Le repère « Expédition · mission 2 sur 5 », « Mission gagnée ! » puis
  « Continuer l'expédition ». Une mission perdue dit « On réessaie ? » : le camp revient comme
  avant la mission (rien n'est perdu, la règle du moteur proposée au parent le 20 novembre).
- **La roulotte garde sa boutique.** Son stock est tiré une fois pour toutes à la halte : un
  achat ne change plus les autres cadeaux proposés (correction du moteur relevée en
  relecture ; aucune valeur ne change, aucun enfant n'avait encore d'écran pour y aller).
- **Ce qui est gardé.** Une clé par joueur (`conquete-serpents:expedition:v1`, effacée avec le
  joueur) : l'expédition en cours, relue pas à pas (un état qu'une vraie expédition ne peut pas
  atteindre est refusé), et « Ta plus longue expédition », un record personnel montré sur la
  carte (grand écran) et à l'arrivée. Une expédition illisible est perdue, pas son record. Une mission quittée en cours repart de son début, comme au
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
  anglais. Une roulotte pleine (quatre cadeaux à monter) garde « Repartir » à l'écran.
- `npm run test:mobile-menus` (voyage court compris) et `npm run test:locale` : verts.
- Relecture à huit angles (deux relecteurs) : record jamais visible, cadeau rare qui
  promettait le niveau 2 à tort, boutique de la roulotte qui changeait après un achat, double
  toucher qui pouvait lancer une mission sans le vouloir, « Madame Gloups est vaincu », la
  rangée du haut du voyage qui cassait avec un record, la dernière mission qui promettait un
  cadeau, phrases répétées sur le plateau, pot de miel sans image, noms accessibles qui
  cachaient le prix, focus, contraste, valeurs recopiées, états impossibles acceptés. Tout est
  corrigé.

## Pas vérifié

- Rien n'a été joué par un enfant ni sur un vrai téléphone.
- Les gardiens portent un nom (Capitaine Zigzag, Madame Gloups), mais sur le plateau c'est le
  roi à trois têtes, avec moins de vie : à voir avec le fils (un dessin à eux coûterait des
  crédits d'images).
- Une carte « une fois » (un allié offert, la garde du cristal) n'est pas plus forte après le
  Chemin des Braves : la règle du moteur ; à décider avec le parent s'il veut qu'elle le soit.
- Pas de code à partager pour une expédition : à faire si les enfants veulent s'échanger la
  leur.
- Les défis originaux (crue, deux rois, serpents vitaminés, réveil difficile, ensorcelés,
  frousse, pouvoirs des serpents) ne sont pas encore faits : un par un, avec le fils.
- Pas encore dans l'application Android : il viendra avec le prochain build.
