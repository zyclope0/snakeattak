# Bilan — boss caché, lot 3 : Classic Snake jouable (26 novembre 2026)

Décisions du parent du 26 novembre ([BOSS-CACHE.md](BOSS-CACHE.md),
[DECISIONS-2026-11-24.md](DECISIONS-2026-11-24.md)) : le nom donné par le fils,
**« Classic Snake »**, tel quel en français et en anglais ; le dessin A ; le bouton dans
l'antre des serpents du premier écran. Ce lot rend le combat du lot 2 jouable depuis
l'accueil. Aucune valeur de combat, aucun autre mode, aucune règle des pommes ne change. Rien
n'est poussé, rien n'est publié.

## Ce que l'enfant voit

1. **0 pomme** : rien. Le premier écran est celui d'avant, au pixel près.
2. **Dès sa première pomme** : une petite pomme de pâte et son compte, « 3 / 12 », contre le
   bord gauche de l'antre, sur sa racine (l'entrée et King Snake restent à voir). Ce n'est
   qu'une image : la toucher ouvre l'antre comme avant. Un lecteur d'écran dit « Pommes
   trouvées : 3 sur 12 ».
3. **À 12 pommes** : à la même place, la pomme et le nom « Classic Snake » sur un pain de miel :
   un bouton (au moins 48 × 48 px).
4. **Le toucher** : le combat arrive (règles, dessin, trois images, mots), puis le plateau de
   toujours, en préparation : la bourse de 1 200 pièces, la boutique, « Lancer la vague ». Ni
   « Dangers » ni serpents annoncés sur les antres (ils décrivaient une vague ordinaire).
   L'annonce dit « Vague 1 · Classic Snake », et le conseil du camp « Il grandit en avalant
   tes alliés tombés et le miel. Casse ses anneaux ! ».
5. **Le combat** : la tête de pâte à la feuille de pomme, un anneau-beignet pour chaque anneau,
   la queue à la place du dernier ; chaque morceau a le liseré rouge-orangé des serpents et
   pâlit d'un éclair quand un coup le touche ; un anneau abîmé brunit. Le nombre d'anneaux est
   sur la petite plaque au-dessus de la tête. Endormi, il ne reste que la tête, penchée, la
   queue contre elle.
6. **La fin** : ses mots à lui (ci-dessous), pas d'étoiles, « Rejouer contre Classic Snake »
   en miel en haut, « Retour à l'accueil » dessous.
7. **Quitter, recharger, fermer l'application** : l'accueil, avec le bouton pour rejouer. Rien
   du combat n'est gardé ; le camp de l'aventure ou de la mission d'avant est intact, et
   « Reprendre » le propose comme avant.

## Les mots, à lire par le parent

Le nom ne s'écrit qu'une fois par catalogue (`classicSnake`), les phrases le reçoivent.

| Où                        | Français                                                                                          | Anglais                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Compte de l'antre         | « 3 / 12 »                                                                                        | « 3 / 12 »                                                                                         |
| … pour un lecteur d'écran | Pommes trouvées : 3 sur 12                                                                        | Apples found: 3 of 12                                                                              |
| Bouton                    | Classic Snake                                                                                     | Classic Snake                                                                                      |
| Bouton, sans réseau       | Classic Snake n'a pas pu venir. Recharge la page quand la connexion revient.                      | Classic Snake could not come. Reload the page when the connection is back.                         |
| Annonce et conseil        | Vague 1 · Classic Snake — Il grandit en avalant tes alliés tombés et le miel. Casse ses anneaux ! | Wave 1 · Classic Snake — It grows by swallowing your fallen allies and the honey. Break its rings! |
| Victoire, titre           | Classic Snake s'endort !                                                                          | Classic Snake falls asleep!                                                                        |
| Victoire, phrase          | Tes alliés ont cassé 25 anneaux. Il a grandi de 7 anneaux. (ou « Il n'a rien avalé ! »)           | Your allies broke 25 rings. It grew by 7 rings. (or « It swallowed nothing! »)                     |
| Victoire, sur le plateau  | Classic Snake n'a plus que sa tête : il s'enroule et s'endort.                                    | Classic Snake has only its head left: it curls up and falls asleep.                                |
| Défaite, titre            | Classic Snake a atteint le cristal                                                                | Classic Snake reached the crystal                                                                  |
| Défaite, phrase           | Tes alliés ont cassé 8 anneaux. On réessaie ?                                                     | Your allies broke 8 rings. Try again?                                                              |
| Défaite, sur le plateau   | Classic Snake a atteint le cristal. On réessaie ?                                                 | Classic Snake reached the crystal. Try again?                                                      |
| Chiffres sur le plateau   | Anneaux cassés : 25 · Alliés debout : 4 · Cristal : 100 %                                         | Rings broken: 25 · Allies standing: 4 · Crystal: 100%                                              |
| Bouton du haut            | Rejouer contre Classic Snake                                                                      | Play Classic Snake again                                                                           |
| Bouton du bas (déjà là)   | Retour à l'accueil                                                                                | Back to home                                                                                       |

Les messages du combat du lot 2 (« Classic Snake sort de son antre ! », « … a avalé un allié :
un anneau de plus ! », « … a mangé le miel : un anneau de plus ! ») reçoivent le nom. Une
espace insécable tient « ! » et « ? » à leur mot (vu sur la capture : « ? » partait seul à la
ligne).

## Comment c'est fait

- **Porte** (`src/ui/classicSnakeDoor.ts`, paquet principal) : un repère sans hauteur posé
  dans la grille de la clairière comme la plaque de l'antre (mêmes mesures, partagées dans
  `homeClearing.css`), qui porte le compte ou le bouton. Relu dans le carnet du joueur à chaque
  retour à l'accueil ; un autre joueur ou un import de fichier familial rechargent la page.
- **Paquet du combat** (`src/ui/classicSnake/classicSnakeBattle.ts`, 11 383 octets, plus
  27 Ko d'images) : `HiddenBossGame` version 1 (`CURRENT_HIDDEN_BOSS_VERSION`), le dessin, les
  trois images, les mots. `vite.config.ts` laisse le boss hors du paquet des règles.
- **Combat mis de côté** (`src/boot/games.ts`) : la partie à l'écran revient telle quelle à
  l'accueil ; tant que le boss est à l'écran, `src/boot/saving.ts` n'écrit rien (camp,
  carrière, missions, autocollants, fichier familial). `checkpoints.ts` n'a pas changé.
- **Fin et annonces** : deux accesseurs de `Game` sans effet sur une partie, `ending` (null
  ailleurs) et `foretold` (vrai ailleurs), lus par l'écran de fin, le plateau, le résumé du
  camp, le conseil et « Dangers ». L'écran de fin réutilise celui de la grande aventure :
  son bouton « Rejouer » (en miel, pâte quand le mot tient) et « Retour à l'accueil ».
- **Dessin** (`src/render/hiddenBossLayer.ts`) : les images du fils découpées en figurines
  (liseré, éclair), dessinées après chaque image de la scène du combat.
- **Index des serpents** : il ne montre pas Classic Snake, ni avant ni après le déblocage (le
  secret reste entier ; une carte après déblocage reste possible, non faite).

## Comment c'est vérifié

- `npx tsc --noEmit`, `npx prettier --check . '!.claude/**'`, `npm run texts:build`.
- `npm test` : 1 086 tests verts. **Empreintes des parties rejouées
  (`tests/engine-traces.test.ts`) inchangées**, fichier des empreintes non modifié. Nouveau
  test : le nom, les mots de fin (pluriel compris), `foretold` ; le contrôle des imports
  n'accepte le boss que par le paquet chargé à la demande.
- `npm run test:hidden-boss` refait : le **vrai jeu** (page et `main.ts`, serveur de Vite),
  pommes et camp de la grande aventure posés dans le stockage, en 780×360 (tactile,
  mouvements réduits) et 1280×800 : rien à 0 pomme, « 5 / 12 » à 5 (et sa phrase pour le
  lecteur d'écran), bouton à 12 seulement, aucune boîte du premier écran ne bouge (onze pièces
  mesurées) ; rien du combat demandé avant le toucher, le paquet et les trois images après ;
  préparation (bourse, version 1, pas de boss) ; vague lancée par le vrai bouton ; 18 anneaux
  sur le plateau, un allié avalé (17 → 18), un anneau cassé (+20 pièces), victoire à 250 s
  après 7 alliés avalés et 25 anneaux cassés ; écran de victoire (titre, pas d'étoiles,
  phrase, les deux boutons dans l'ordre) ; « Rejouer » puis défaite à 91 s et son écran ;
  retour à l'accueil : **stockage entier identique** à celui d'avant le combat, et « Reprendre »
  propose le même camp ; nouveau combat, rechargement en pleine vague : accueil, stockage
  identique, même camp à reprendre. L'accueil seul en 812×375 et dans une fenêtre debout de
  600×900. Le combat est avancé pas à pas par la recette, sur la partie que le jeu a mise sur
  le plateau (graine 1 donnée au moment du toucher).
- Mesure des boîtes avant/après le lot (code du commit `17e6a07` contre ce lot, site
  construit) : identiques à 780×360, 812×375, 1280×800 et 600×900, avec 12 pommes.
- `npm run test:offline` : le paquet et ses trois images sont servis depuis le disque, pas
  avant le toucher (pommes posées dans le stockage), le combat dessine ses 18 anneaux.
- `npm run test:apples`, `npm run test:browser`, `npm run test:saves:family`,
  `npm run test:audit` (13/13), `npm run test:locale` (529 vérifications, aucun texte inconnu),
  `npm run test:mobile-menus` : verts.
- Paquet principal : **195 889 → 197 479 octets** sur 200 000. Règles 138 440 → 138 640,
  anglais 99 863 → 101 006 ; nouveau `classicSnakeBattle` 11 383.
- Captures (non gardées dans Git) : `artifacts/classic-snake/` — accueil à 0, 5 et 12 pommes
  (780×360, 1280×800, 812×375, 600×900), préparation, début, après un allié avalé, victoire,
  défaite.

## Ce qui n'est pas vérifié

- **Rien sur le vrai téléphone, rien avec les enfants.** Le fils n'a vu ni le bouton, ni son
  boss dessiné, ni l'écran de fin.
- Le combat entier n'est joué que par la recette (avancé pas à pas) et par les joueurs
  simulés du lot 2 ; personne ne l'a joué au doigt jusqu'au bout.
- La pomme de l'antre est-elle assez visible, ou trop ? Le compte (13 px sur téléphone) se lit
  sur la racine de l'antre ; à voir par le parent sur le téléphone.
- Sur le plateau, la recette fait apparaître de gros nombres flottants près de la plaque des
  anneaux (le combat est avancé d'un coup) ; une vraie partie ne les montre pas ainsi.
- Pas de son à lui, pas de carte dans l'index des serpents (non demandés).
- Un téléphone tenu debout montre « Tourne ton téléphone » : seule une fenêtre debout
  (tablette, ordinateur) a été mesurée.
