# L'aventure sans fin, lot B — compte rendu (27 novembre 2026)

Demande du parent : « L'étagère des 5 cadeaux, toujours visible au camp et en bataille, et
leurs effets visibles sur le plateau. Ce n'est pas seulement l'écran de choix. » Lot B du
rapport du conseil ([COUNCIL-INFINI-2026-11-20.md](passation/COUNCIL-INFINI-2026-11-20.md)).
Branche `claude/infini-lot-b`, ni poussée ni fusionnée.

**Aucune règle ne change.** Le rendu lit l'état du jeu (`game.boons`, `boonLevel`, `boonGain`,
`recruitCost`, `balanceRecruitPrice`, `endlessWave`) et n'écrit rien dans la partie. Aucun
fichier du moteur, ni `src/endless.ts`, ni le simulateur. Empreintes de
`tests/engine-traces.test.ts` inchangées.

## Ce qui est fait

### L'étagère (`#boon-shelf`)

- Dans le dock, entre les favoris et leur ligne, **au camp et pendant la vague**, seulement
  dans l'aventure sans fin. Cinq places : le signe du cadeau dans son disque de pâte (or pour
  la forge, le marché, la rente, la longue-vue ; ciel pour l'armure et le cristal ; le pot pour
  le miel) et ses étoiles (1 à 3, pas de %). Une place libre est en pointillé.
- Un seul bouton de toute la largeur du dock ; chaque place fait 48 px de haut. Le dock
  grandit sur ordinateur ; sur téléphone, les quatre favoris prennent un peu moins de hauteur.
- Lu à voix haute : « Tes cadeaux : 3 sur 5 places ».

### La feuille « Tes cadeaux » (`#boon-sheet`)

- Un toucher sur l'étagère l'ouvre : les cinq places en grand, le nom, ce que fait le cadeau
  en mots d'enfant, puis « Si tu le reprends : ★★ → ★★★ » ou « Tout en haut ! ». Pour le
  marché, un vrai prix : « Tank : 396 pièces au lieu de 440 » (l'allié connu le plus cher).
- Pendant une vague, la vague attend tant qu'elle est ouverte (`pauseForDialog`). Échap, la
  croix et le bouton « retour » d'Android la ferment.
- Deux colonnes sur téléphone couché : elle tient en 780×360 sans défiler.

### Les cadeaux là où ils agissent

| Cadeau            | Ce qu'on voit                                                                            | Où                 |
| ----------------- | ---------------------------------------------------------------------------------------- | ------------------ |
| La forge          | des étincelles d'enclume sur chaque coup d'un allié, 3 à 5 rayons selon le niveau        | plateau            |
| L'armure          | un anneau bleu aux pieds de chaque allié, plus épais à chaque niveau                     | plateau            |
| Le cristal solide | une lueur bleue au pied du refuge ; le « Cristal +5 » d'une réparation existait déjà     | plateau            |
| Le marché         | le prix d'avant barré dans l'autre coin de chaque favori (« ~~55~~ … 50 »)               | dock               |
| La rente          | « +40 » près des pièces quand une vague est repoussée (2 s), en plus du lot A            | barre du haut      |
| Le miel           | « +4 s » sur les deux pots du dock                                                       | dock               |
| La longue-vue     | le cercle de portée au placement, déjà fait au lot A (`turnReach`) : vérifié, pas touché | plateau, en posant |

- Les étincelles : une seule couche dessinée pour tout le plateau, 32 au plus ; les anneaux :
  une seule couche, 12 points par anneau. « Effets légers » et le mouvement réduit du système
  gardent l'étincelle où elle naît ; « +40 » ne monte plus.
- Le prix barré n'est que sur les favoris du dock : le catalogue « Tous les alliés » garde le
  prix payé, sans changement (sa grille est réglée au pixel, recette `test:mobile-menus`).

### L'écran de choix

- Au-dessus des cartes, « Tes cadeaux » et les cinq places (libres en pointillé). Sur
  téléphone, elles prennent la place de la phrase d'introduction.
- La carte d'un cadeau qu'on a déjà : « ★★ → ★★★ » sur son bouton. Les cartes disent ce que
  fait le cadeau sans « % » : « ★★★ Tes alliés frappent plus fort. »
- « Tes 5 places sont prises » : **les cinq cartes sur une rangée en 780×360 et 812×375**
  (trois sur cinq avant), dans le panneau et dans la fenêtre.
- Un seul mot dans l'aventure sans fin : « Choisir ce cadeau », « Continuer sans cadeau »,
  « Choisir un cadeau », « Vague 4 repoussée ! Choisis ton cadeau ». La grande aventure garde
  « bonus ».

### Le récap

- **À la sortie** : « Rentrer avec mon record » ouvre d'abord « Ton aventure » : « Vague 12 ·
  rois battus : 1 », les cinq places, « Ta partie t'attend à l'accueil. », puis
  « Rentrer à l'accueil » ou « Rester au camp ». C'est un toucher de plus pour rentrer.
- **À la chute** : sous « Quelle aventure ! », « Tes cadeaux », les cinq places et « Vague 73 ·
  rois battus : 6 ». Aucune comparaison avec un autre joueur.

## Mots nouveaux, à relire par le parent

| Où                         | Français                               | Anglais                           |
| -------------------------- | -------------------------------------- | --------------------------------- |
| Étagère, lu à voix haute   | Tes cadeaux : 3 sur 5 places           | Your gifts: 3 of 5 spots          |
| Feuille, titre             | Tes cadeaux                            | Your gifts                        |
| Feuille, place libre       | Place libre                            | Empty spot                        |
|                            | Le prochain cadeau peut venir ici.     | Your next gift can go here.       |
| Feuille, niveau suivant    | Si tu le reprends : ★★ → ★★★           | Take it again: ★★ → ★★★           |
|                            | Tout en haut !                         | All the way up!                   |
| Feuille, marché            | Tank : 396 pièces au lieu de 440       | Tank: 396 coins instead of 440    |
| Feuille, croix             | Fermer                                 | Close                             |
| Cartes et feuille (sans %) | Tes alliés frappent plus fort.         | Your allies hit harder.           |
|                            | Tes alliés ont plus de vie.            | Your allies have more life.       |
|                            | Les alliés coûtent moins cher.         | Allies cost less.                 |
|                            | Tes tireurs voient plus loin.          | Your shooters see further.        |
| Écran de choix (sans fin)  | Vague 4 repoussée ! Choisis ton cadeau | Wave 4 defeated! Choose your gift |
|                            | Choisir ce cadeau                      | Choose this gift                  |
|                            | Continuer sans cadeau                  | Go on without a gift              |
|                            | Choisir un cadeau (bouton du haut)     | Choose a gift                     |
| Récap de la sortie         | Ton aventure                           | Your adventure                    |
|                            | Vague 12 · rois battus : 1             | Wave 12 · kings beaten: 1         |
|                            | Ta partie t'attend à l'accueil.        | Your game waits for you at home.  |
|                            | Rentrer à l'accueil                    | Go home                           |
|                            | Rester au camp                         | Stay at camp                      |

Sans mots : « ★★ → ★★★ » sur le bouton d'une carte, « +40 », « +4 s », le prix barré.
« La rente » garde son nom : il vient de sa constante (`TEXT.laRente`), la feuille et
l'étagère suivront si le fils le change. Les signes (⚔ ♥ % + ◆ ↔) sont ceux du lot de 20
novembre : « % » reste le signe du marché.

## Paquets

Octets, jeu d'avant (commit `5f54b4e`) et d'après, construits sur la même machine.

| Fichier                              |   Avant |   Après |
| ------------------------------------ | ------: | ------: |
| `bootstrap` (site), limite 200 000   | 198 177 | 199 174 |
| `bootstrap`, aperçu publicitaire     | 198 502 | 199 499 |
| `bootstrap`, essai publicitaire      | 198 443 | 199 440 |
| `bootstrap`, application Android     | 198 214 | 199 213 |
| `boonShelf` (nouveau, à la demande)  |       — |   6 991 |
| `english`                            | 101 152 | 102 040 |
| `rules`                              | 139 568 | 139 568 |
| feuille de style de départ (`index`) |  65 335 |  71 466 |

Le paquet principal porte la porte (`ui/boonDoor.ts`), le crochet du plateau
(`BattleScene.addLayer`), les mots des cartes et « cadeau » dans l'aventure sans fin (environ
1 000 octets). **Il reste 501 octets dans l'aperçu publicitaire** : le prochain lot qui touche
à l'interface devra sortir quelque chose du paquet principal.

## Comment c'est vérifié

- `npx tsc --noEmit`, `npx prettier --check . '!.claude/**'`, `npm test` (1 097 tests, dont 5
  nouveaux : `tests/boon-shelf.test.ts`), `npm run build`, `npm run texts:build`.
- `tests/boon-shelf.test.ts` : aucune phrase des cadeaux ne dit « % » ; « ★★ → ★★★ » sur un
  cadeau repris ; la couche du plateau dessine un anneau par allié debout, la lueur du refuge,
  des étincelles pour les coups d'un allié et pas pour les morsures, qui s'éteignent ; avec
  « Effets légers », l'étincelle ne bouge pas ; rien sans cadeau ni dans la grande aventure.
- `npm run test:endless`, à 780×360, 812×375 et 1280×800 : l'étagère au camp et pendant la
  vague (cinq places, signes et étoiles, 48 px, dans le dock et dans la fenêtre, le miel et
  « Tous les alliés » toujours dans le dock) ; le prix barré plus haut que le prix payé ; la
  feuille (cinq lignes, places de 48 px, mots sans %, « au lieu de »), fermée par Échap puis par
  la demande que fait « retour » ; ouverte pendant la vague ; les cadeaux tenus au-dessus des
  cartes ; « ★ → ★★ » sur un cadeau repris ; les cinq cartes de « remplacer » dans le panneau
  et la fenêtre ; « +4 s » sur les pots ; « +40 » près des pièces à la fin d'une vague jouée
  pour de vrai (horloge du navigateur avancée), puis parti ; le récap de la sortie (rester,
  puis rentrer) ; une vraie chute au 7e tour, le récap dans le résultat, places dans le
  panneau. `test:saves:unkept` passe par le récap pour rentrer.
- Dans l’interface anglaise, « ★★ Tes alliés… » restait en français (déjà
  vrai pour les cartes « remplacer » avant ce lot). Le traducteur garde des étoiles en tête,
  comme ses autres signes (`i18n/copy.ts`), et traduit le reste ; testé, et la feuille
  regardée en anglais (capture `artifacts/infini-lot-b/anglais/`).
- Recettes de la CI jouées ici, vertes : `test:endless`, `test:locale` (529 contrôles, aucun
  texte inconnu), `test:audit` (13/13), `test:browser` ; groupe « écrans » : `test:rewards`,
  `test:reinforcements-scroll`, `test:child-mobile`, `test:presentation`,
  `test:interruptions`, `test:offline`, `test:expedition`, `test:threat-preparation`,
  `test:tactical-clarity`, `test:mission-journey`, `test:apples`, `test:hidden-boss` ;
  « menus » : `test:mobile-menus` (7 579 contrôles) ; sur `build:android` : `test:saves:unkept`
  (qui passe maintenant par le récap), `test:saves:double-taps`, `test:back-button` ;
  `build:ads-preview` et `build:ads-test` (leurs paquets sous la limite). Pas rejouées :
  `test:caprices`, `test:journey`, `test:missions:regressions`, `test:medical-persistence`,
  `test:stage`, `test:render-settings`, `test:tactical`, les autres recettes de sauvegarde,
  `test:discovery`, `test:ads-*`, `test:android-web`, `test:family`, l'export portable.
- La machine était chargée par les mesures de l'autre session (charge 11 à 12 sur 4 cœurs) :
  `test:endless` a pris 162 s puis 511 s (43 s avant ce lot : la vague jouée pour la rente et
  la chute s'ajoutent, à vitesse ×2, l'horloge avancée image par image) ; un passage de
  `test:locale` a échoué une fois sur un clic de « pause » trop lent (8 s, partie française
  classique, rien de ce lot), rejoué ensuite ; un passage de `test:saves:unkept` s'est arrêté
  sur un clic de « Jouer » d'une partie classique, puis il est passé en entier (1 118 s).
- Captures (hors Git, `deviceScaleFactor` 1) : `artifacts/infini-lot-b/`, pour les trois
  formats : `-camp`, `-bataille`, `-feuille`, `-choix`, `-remplacer`, `-recap`, `-chute` ;
  `1280x800-bataille-etincelles.png` (étincelles pendant un combat) ; `avant/` (jeu d'avant).

## Pas vérifié

- **Rien sur un vrai téléphone ni dans la WebView Android ; rien avec un enfant ni avec le
  parent.** Les mots sont à relire.
- Le « retour » d'Android est imité dans Chromium (la demande que fait `backButton.ts`), pas
  appuyé sur un téléphone.
- Les étincelles se voient dans les captures, au milieu des chiffres des coups : un enfant les
  remarquera-t-il ? À regarder sur la tablette.
- Le coût de dessin des anneaux et des étincelles n'est pas mesuré sur un téléphone (carte
  graphique logicielle ici).
- Sans réseau ni cache, sur le site, l'étagère n'arrive pas : le jeu joue comme avant, sans
  elle, et « Rentrer avec mon record » rentre sans récap. Pas de recette hors ligne pour elle.
- L'exemple du marché prend l'allié connu le plus cher (souvent le tank) : un favori du dock
  parlerait peut-être plus à l'enfant.
