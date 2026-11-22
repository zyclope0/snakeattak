# Revue du code — 21 novembre 2026

Demande du parent, après l'étape d'hygiène : revoir la qualité du code et chercher les
optimisations possibles. Trois relectures indépendantes, chacune avec des mesures (qualité et
structure ; performance ; paquets, styles, tests). Aucune n'a modifié le dépôt. Les cinq
constats les plus lourds ont été revérifiés à la main.

Décision du parent le même jour : faire d'abord la performance et le nettoyage (points 1, 4,
5, 7, 8, 10), retirer les restes du voyage, garder les points 2 et 3 pour après. Ce document
garde **tous** les points, faits ou non.

## Ce qui va bien

- Aucun module de règles ne touche au navigateur (`document`, `window`, `localStorage`).
- Aucun texte écrit dans le code ; 1 258 textes français, tous lus.
- Zéro `any`. 149 `as` (dont 44 `as Kind`) et 138 `!`, aucun jugé faux.
- Styles : 1 768 règles, un seul sélecteur sans élément (`.reinforcements-open`,
  `src/styles/16-dock.css:158`). Aucune règle identique répétée.
- Aucun module livré dans deux paquets. Aucune faille connue (`npm audit`).

## Les dix points

| #   | Constat                                                           | État                     |
| --- | ----------------------------------------------------------------- | ------------------------ |
| 1   | Sauvegarde recalculée 5,5 fois par seconde pendant un combat      | Fait, lot 1              |
| 2   | 26 planches d'images en WebP sans perte (9,4 Mo)                  | Gardé pour après         |
| 3   | Phaser livré plus gros que son fichier officiel, avec la physique | Gardé pour après         |
| 4   | `nearestCampPoint` très lent quand le but tombe dans un rocher    | Fait, lot 1              |
| 5   | La CI attend trop ; une PR de documents coûte autant que du code  | Fait, lot 3, gain mince  |
| 6   | Barres de vie et petits ronds chers à dessiner                    | À mesurer sur l'appareil |
| 7   | Des règles écrites plusieurs fois                                 | En grande partie         |
| 8   | Code mort et restes du voyage                                     | Fait, lot 2              |
| 9   | Trois fichiers ont trop grossi                                    | Plus tard                |
| 10  | Documentation d'architecture devenue fausse par endroits          | Passages cités corrigés  |

### 1. La sauvegarde pendant le combat

`saveAndRedraw` (`src/bootstrap.ts`) tourne toutes les 180 ms (`HUD_PERIOD_MS`,
`src/render/BattleScene.ts`) et après chaque commande. Il refait le fichier familial en
entier : validation, écriture en JSON, relecture, réécriture, puis seulement la comparaison
avec le dernier texte. Pendant un combat rien ne peut changer (`encodeCheckpoint` refuse un
combat) et rien n'est écrit.

- Mesure de la relecture, partie réellement jouée : 2,2 à 2,7 ms à 40 alliés, 5,4 à 5,9 ms à
  80, sur ordinateur. Contre-mesure du fichier seul, état vide : 0,3 et 0,7 ms. Le téléphone
  est plus lent ; non mesuré.
- Pistes essayées par la relecture : ne pas synchroniser tant que le combat dure (environ
  0 ms, mêmes octets, mêmes écritures) ; garder par texte de camp ce que les lecteurs lui
  demandent (camp à 80 alliés : 5,7 → 1,9 ms).
- Les écrans cachés de l'accueil sont aussi rafraîchis pendant le combat ; le menu relit et
  redécode les records à chaque fois (`src/endlessRecords.ts`).

**Fait (lot 1).** `family.sync` (`src/familyPersistence.ts`) garde le texte de ce qu'on lui a
demandé la dernière fois qu'il n'est rien resté à faire. La même demande ne refait plus le
fichier. Une écriture, un import ou une lecture effacent ce souvenir ; une écriture refusée
n'en laisse pas : elle est donc retentée comme avant. Cette piste a été préférée à « ne rien
faire tant que le combat dure » : elle ne suppose rien sur ce qui peut changer pendant un
combat.

- Relevé de la relecture rejoué (`family.sync` fait 98 % du coût) : pendant le combat, 2,45 →
  0,10 ms par appel à 40 alliés, 5,4 → 0,2 ms à 80. Mêmes écritures (93 et 93, 88 et 88),
  mêmes octets gardés, sur six parties.
- Dans le navigateur, vague 11 à 48 alliés, processeur ralenti quatre fois
  (`scripts/hygiene/profile-charge.mjs`, deux passages par version) : `saveAndRedraw` passe
  de 51–55 à 12–13 ms par seconde de combat ; la fabrication du fichier de 40–43 à 0.
- Garde-fou : `tests/family-sync-settled.test.ts`, dont 600 demandes tirées d'une graine
  comparées à un fichier refait à chaque fois (réponse, écritures, texte gardé, message).
  La revue sévère du 22 novembre a montré qu'il laissait passer une demande qui oublierait
  les missions ou les albums : renforcé par la PR 115.
- Toutes ces mesures viennent d'un ordinateur (Node, et un navigateur sans écran ralenti
  quatre fois). Aucune ne vient d'un téléphone.
- **Laissé** : il reste environ 8 ms par seconde (0,8 % du processeur ralenti) dans le
  rafraîchissement d'un écran de l'accueil pendant le combat. Trop peu pour toucher à l'ordre
  des rafraîchissements.

### 2. Les images (gardé pour après)

26 planches de `src/assets/illustrated/` sont en WebP sans perte : 9,44 Mo, 45 % du paquet
Android. Ré-encodées en qualité 88 à 90 avec la transparence exacte : 2,69 Mo (−6,75 Mo). Le
spinosaure et les décors récents sont déjà encodés ainsi (`scripts/assemble-spinosaurus.py`).
Gain calculé, pas regardé à l'écran : l'image change un peu, il faut l'œil du parent sur le
téléphone.

Six images ne sont jamais livrées ni référencées (3,46 Mo dans le clone) :
`src/assets/serpent-vert-idle.png` et sa copie `public/assets/enemies/serpent-vert-idle.png`,
`src/assets/roi-cobra.png`, `ground-ruins.webp`, `ground-grove.webp`, `ground-clearing.webp`.
Musiques : quatre MP3 à 128 kbit/s, 6,83 Mo ; à 96 kbit/s, environ −1,7 Mo, à écouter.

### 3. Phaser (gardé pour après)

Vite re-minifie Phaser : 1 481 792 octets, contre 1 196 122 pour `phaser.min.js` et 1 086 308
pour `phaser-arcade-physics.min.js` (sans Matter). Le jeu n'utilise ni physique, ni tweens,
ni particules, ni son de Phaser. Un alias dans `vite.config.ts` : −396 Ko, −45 Ko gzip au
premier chargement. Non essayé dans un navigateur ; il faudra toutes les recettes et le
téléphone.

### 4. `nearestCampPoint`

`src/navigation.ts` : quand le but tombe dans un rocher, il teste environ 1 000 points puis
les trie. `defenseGoal` (`src/defenders.ts`) l'appelle à chaque pas pour chaque allié
concerné. Dans l'aventure sans fin il fait 74 % du temps du pas : 95e centile 5,25 ms, pire
pas 10 à 18 ms. Avec les points de camp gardés par carte et un minimum au lieu du tri : 95e
0,75 ms, pire pas 3 ms, parties identiques (empreintes).

**Fait (lot 1).** Les points de camp d'une carte sont cherchés une fois ; le plus proche est
pris sans tri, dans l'ordre que le tri donnait (distance, puis y, puis x). Remesuré sur la
branche, 3 600 pas, médiane de cinq passages : aventure sans fin, pas moyen 1,25 → 0,28 ms,
95e centile 5,38 → 0,67 ms, 99e 6,89 → 1,02 ms ; mission et grande aventure inchangées (le
but n'y tombe presque jamais dans un rocher). Mêmes empreintes de partie avant et après, les
traces de référence passent sans changement. Garde-fou : `tests/camp-points.test.ts` compare
9 000 buts, sur les six cartes, à l'ancienne recherche recopiée dans le test.

Autres pistes du moteur, mesurées, **non retenues pour l'instant** :

- `Math.hypot` écrit à la main (V8 alloue à chaque appel : 31 à 51 % des octets alloués). Pas
  divisé presque par deux sur deux scénarios, parties identiques sur 14 millions de paires.
  Risque : sur Firefox et Safari, `Math.hypot` n'est pas celui de V8 ; la formule écrite
  pourrait y changer des parties. À décider.
- Cibles en une passe (`chooseTarget`, `biteTarget`, `separateAllies`), boucles dans
  `blocked` : gain net, environ 80 lignes.
- Tas et tableaux typés dans `findPath` : seulement pour les pires pas ; le plus délicat.
- But calculé seulement au replan : gain non démontré.

### 5. La CI

Durées réelles : « écrans » 13 min 20, « menus » 12 min 19, « langue et caprices » 7 min 44,
`verify` 6 min 59, « règles et rendu » 4 min 21. 44 minutes de calcul par passage, deux
passages par PR fusionnée.

- Trois recettes attendent 10 secondes pour rien : `Promise.race([browser.close(),
setTimeout(10_000)])` laisse le minuteur vivant (`scripts/endless-browser.mjs`,
  `scripts/expedition-browser.mjs`, `tests/locale-bindings-035-browser.mjs`).
- `test:expedition` (4 min 44) dans « règles et rendu », `test:mobile-menus` coupé en deux
  (la variable `MOBILE_MENUS_ONLY` existe) : attente d'environ 9 minutes au lieu de 13.
- `npm run build` tourne six fois par passage, dont une fois dans
  `scripts/caprices-036-browser.mjs` et une fois dans la tâche « menus » qui ne lit pas
  `dist/`.
- Une PR de documents seuls relance tout : ne lancer que `format:check`.
- `scripts/hygiene/` n'est appelé par aucune commande ni par la CI. Quatre recettes
  mériteraient d'y entrer (fermeture forcée, doubles appuis, sauvegarde familiale, mise à jour
  depuis le stockage figé du build 63) : +10 à 12 minutes de calcul. Décision à prendre.
- `playwright-core` est importé par 19 fichiers sans être déclaré dans `package.json`.
- `scripts/balance-expedition.mjs` n'a pas de commande `npm run`.

**Recettes d'hygiène dans la CI : fait (22 novembre).** Le parent a laissé le choix de la
suite. Une tâche « sauvegardes » construit le paquet de l'application et lance quatre
recettes : la mise à jour par-dessus l'appareil figé d'un testeur du build 63
(`tests/fixtures/appareil-build-63.json`, lu par `scripts/hygiene/update-frozen.mjs`), le
fichier familial, la fermeture forcée, les doubles appuis (`npm run test:saves:*`). Environ
7 minutes en local. `upgrade-63.mjs`, qui joue d'abord avec le vrai paquet du build 63, reste
à lancer à la main : il lui faut ce paquet.

**Fait (lot 3, corrigé par la PR 115)** :

- Les trois attentes de 10 secondes sont annulées dès que le navigateur est fermé.
- `test:expedition` est dans « règles et rendu ». `test:mobile-menus` tourne sur deux tâches,
  « menus 1 » (la partie `voyage`) et « menus 2 » (tout sauf `voyage`, par
  `MOBILE_MENUS_EXCEPT` : une partie ajoutée plus tard y tourne d'elle-même). Sept lignes à
  lire sur une PR de code : « portée », `verify` et cinq « recettes » (huit avec la tâche
  « sauvegardes » ajoutée ensuite).
- `npm run build` ne tourne plus que dans les groupes qui lisent le site construit (`site:
true` : « écrans » et « règles et rendu »).
- Tâche « portée » : une PR qui ne touche que des `*.md` (à la racine ou sous `docs/`, hors
  `docs/publication/`, écarté par prudence : aucun code du site ne le lit) ne lance que
  `npm run verify`. Les recettes et le reste de `verify` sont sautés. Une fusion dans `main`
  lance toujours tout. Les tâches ne sautent que si « portée » répond exactement `false`.
- `playwright-core` est déclaré ; `npm run balance:expedition` existe.

**Ce que le lot 3 a vraiment donné** (mesuré sur GitHub, pas prévu) : l'attente visée était de
9 minutes ; elle est de 10 à 12 (10,2 ; 11,4 ; 10,7 ; 11,8 sur quatre passages), contre 11 à
17 avant. C'est `verify`, que ce lot ne raccourcit pas, qui fixe maintenant l'attente. Le
calcul n'a pas baissé : environ 48 minutes par passage contre 44, à cause d'une tâche de plus
et de la fin de la recette des menus qui tourne dans ses deux tâches. Les deux tâches des
menus ne sont pas de même durée d'un passage à l'autre (577 s contre 464, puis 410 contre 463) : le bruit des machines domine.

### 6. Le dessin des barres de vie et des ronds

Lecture et micro-mesure hors navigateur : Phaser recalcule chaque forme à chaque image ; un
rectangle arrondi fait 409 points (environ 97 µs et 180 Ko), un cercle 101 points. Barres de
vie : `src/render/actors.ts` (deux rectangles arrondis par combattant blessé). Éclats :
`src/render/battleFeedback.ts`. Estimation pour 60 acteurs : 7 à 8 ms par image sur
ordinateur. À mesurer avec `?perf=1` sur le téléphone avant de toucher : cela change quelques
pixels.

Textes flottants : les 40 étiquettes suivent le rang dans la liste ; quand le plus vieux mot
expire, toutes les suivantes sont redessinées. Piste : une étiquette fixe par mot.

### 7. Des règles écrites plusieurs fois

- Brassage de la graine (`mix`, `stream`, `pick`) : `src/voyage.ts` et `src/expedition.ts`.
  Mélange de Fisher-Yates : `src/boons.ts`, `src/rewards.ts`, `src/voyage.ts`. À mettre dans
  `src/seededRandom.ts`.
- Facteur d'armure `1 + niveau × pas` : sept écritures (`expedition.ts`, `game.ts`,
  `checkpoints.ts`).
- Lecture d'un camp porté : `game.receiveCamp` et `expedition.readCamp`, mêmes gardes ; la
  borne d'identifiant est écrite `10_000_000`, `1e7` et `10000000`.
- Sept règles de l'expédition recopiées dans ses écrans
  (`src/ui/voyage/expedition/expeditionScreens.ts`, `expeditionViews.ts`,
  `expeditionWords.ts`) : « ce cadeau demande une place », « expédition en cours », pas de
  cadeau après King Snake, serpents qui grandissent, cadeau rare qui compte double, niveau
  suivant et « assez de pièces », un style décidé en comparant un texte affiché.
- Valeurs tapées : `'+100'` (`src/ui/rewardControls.ts`, c'est `REWARD_COINS`) ; `3` et `9`
  étoiles (`src/render/resultCopy.ts`, `src/ui/gameParts.ts`, `src/ui/chapterReport.ts`) ;
  entraînement du héros « dès la vague 4 » en trois endroits ; version 6 du fichier familial
  en neuf endroits ; `EXTRA_CHARACTER_LIMIT` qui retape `EXPEDITION_LOG_LIMIT` ; version de
  l'aventure sans fin (`as 1` cinq fois) ; `BOON_RULES[1]` treize fois, et un appel de
  `takeBoon` sans sa table ; chance de l'Œuf Mystère et sels du tirage sans nom ; « partie
  finie » écrite huit fois.
- Carnet d'un joueur écrit deux fois (`voyageStorage.ts`, `expeditionStorage.ts`) ; dix
  modules redéfinissent leur type de port de stockage.

**Fait (lot 4)**, parties identiques (traces de référence et voyages de référence inchangés) :

- `src/seededRandom.ts` porte le brassage (`mixSeed`, `questionStream`), le choix (`pickOne`)
  et le mélange (`shuffle`) ; le voyage, l'expédition, les cadeaux et les récompenses les
  appellent.
- `armourFactor` et `armourAtLevel` (`src/boons.ts`) : une écriture au lieu de sept (la
  septième, oubliée par le lot 4 dans `src/expedition.ts`, est partie avec la PR 115).
- Valeurs nommées : `ENTITY_ID_LIMIT` (trois écritures de dix millions), `HERO_TRAINING_FROM`
  et `game.heroTrainingOpen` (la règle « dès la vague 4 » n'est plus recopiée dans l'écran),
  `STARS_MAX`, `FAMILY_EXTRAS_VERSION` (la version 6 du fichier familial),
  `EXTRA_CHARACTER_LIMIT` qui vaut `EXPEDITION_LOG_LIMIT`, `+${REWARD_COINS}` sur la carte.

**Fait ensuite (22 novembre)** : les règles de l'expédition que ses écrans recopiaient sont
dans le modèle (`src/expedition.ts`), et les écrans les demandent : `needsPlace` (une place à
libérer), `endsExpedition` (pas de cadeau après King Snake), `countsTwice` (ce qu'un cadeau
rare double), `levelAfterPurchase` et `canPay` (la roulotte, qui s'en sert aussi pour
vendre), `snakesHaveGrown`, `underWay`. Le style du bouton « Choisir » ne se décide plus en
comparant un texte affiché : `giftWords` dit `plain`. Un test tient chaque règle à son
ancienne écriture, et `scripts/hygiene/expedition-views.mjs` (lancé par
`tests/expedition-views.test.ts`) rend les vues avec un faux DOM pour tenir leur
branchement : une négation perdue dans une vue s'y voit. Une relecture indépendante a rendu
17 723 écrans avant et après, en français et en anglais : identiques.

Encore écrit plus d'une fois, en connaissance de cause : « une bataille est gagnée »
(`underWay`, `snakesHaveGrown`, et la lecture brute de `src/expeditionLog.ts`, que l'accueil
fait sans relire toute l'expédition) ; « ce qu'un cadeau rare double », encore en ligne dans
`giftOffer` ; « il faut une place », qui vit aussi dans `Game.boonNeedsPlace` pour l'aventure
sans fin.

**Reste du point 7** :

- le lecteur de camp porté écrit deux fois (`game.receiveCamp`, `expedition.readCamp`) ;
- `BOON_RULES[1]` treize fois et la version de l'aventure sans fin (`as 1`) ;
- la chance de l'Œuf Mystère et les sels du tirage sans nom ; « partie finie » huit fois ;
- le carnet d'un joueur écrit deux fois et les dix types de port de stockage.

### 8. Code mort et restes du voyage

- Jamais référencés : `isAllyCard`, `missionNumber` (`src/expedition.ts`), `isBoonId`
  (`src/boons.ts`), `appendText` (`src/i18n/dom.ts`).
- Branche inatteignable : « tombé à la première étape » (`src/ui/voyage/voyageWords.ts`) et
  son texte ; contrôles de sac à `STAGE_BAG_LIMIT` dans l'expédition (le sac ne dépasse jamais
  une carte).
- Restes du voyage, à retirer (décision du parent, 21 novembre) : `src/voyageCode.ts`,
  `src/texts/*/voyage.ts`, `startVoyage` (aux tests), le laboratoire
  (`scripts/balance-voyage.mjs`, `scripts/voyage-lab/` sauf `players.ts`,
  `tests/voyage-lab.test.ts`, `npm run balance:voyage`). Les anciens codes `VOYAGE-…` ne
  pourront plus être relus.
- **À garder pour finir un voyage commencé** : `voyageTuning.ts`, `voyage.ts`
  (`planVoyage`, `drawVoyage`, `stageRulesFor`, `createStageGame`, `stageCaprice`,
  `isVoyageSeed`), `voyageState.ts` sauf `startVoyage`, `voyageStorage.ts`, `voyageRules.ts`,
  les écrans du voyage et `voyage.css`. Le fichier familial version 6 lit encore un voyage
  (`familyExtras.ts`).
- Commentaires périmés : ceux qui parlent d'un code d'expédition ou d'un code de voyage à
  recopier (`expedition.ts`, `voyage.ts`, `voyageTuning.ts`, `ui/departures.ts`).

**Fait (lot 2).** Tout ce qui précède, sauf les contrôles de sac de l'expédition : ils sont
ce que le lecteur d'une sauvegarde refuse, ils restent. `startVoyage` est dans
`tests/voyage-start.ts` ; les joueurs automatiques dans `scripts/lab/players.ts`. Les douze
voyages de référence gardent leurs empreintes ; seul le code écrit devant chacune est parti.
Deux textes de moins (1 256). Un ancien code `VOYAGE-…` ne se relit plus.

### 9. Trois fichiers ont trop grossi (plus tard)

Depuis le nettoyage du 13 novembre : `game.ts` 387 → 688 lignes, `bootstrap.ts` 387 → 494,
`expedition.ts` neuf à 792.

- `expedition.ts` mêle quatre responsabilités : tables des versions, tirage du plan, état et
  transitions, lecture d'un état gardé. `readExpeditionState` fait 77 lignes et 47 branches.
- `bootstrap.ts` : montage, création de Phaser, ce qui s'écrit après un pas, quelle partie est
  sur le plateau, le grand bouton, le fichier familial. Un découpage par responsabilité
  sortirait trois morceaux du premier paquet.
- `game.ts` : les cadeaux de l'aventure sans fin et deux lecteurs de sauvegarde dans la classe.
- 25 fonctions dépassent 60 lignes ; les plus longues : `bindExpeditionScreens` (215),
  `bindVoyageScreens` (131), `bindWebAdPreview` (120), `bindExpeditions` (116). Le rendu a
  regrossi (`bossSignals.ts`, `battleFeedback.ts`, `presentation.ts`).
- Recettes : 33 fichiers lancent leur navigateur, 26 leur serveur, les tailles d'écran et les
  clés de stockage sont retapées. 500 à 650 lignes sur 14 484. `scripts/hygiene/harness.mjs`
  a la bonne forme pour un module commun. 102 fichiers portent un numéro de version dans
  leur nom. C'est le lot 7 du nettoyage, jamais fait.

### 10. La documentation d'architecture

`docs/ARCHITECTURE.md` : le tableau des responsabilités dit que `main.ts` assemble tout
(c'est `bootstrap.ts`) ; `voyageCode.ts` et `VOYAGE_INPUT_LIMIT` « lus par l'interface » ; « le
fichier familial n'exporte pas le voyage » ; `startVoyage`, `encodeVoyage`, « une première
visite tire un voyage » ; « les dix clés » (il y en a 15).

**Fait (lot 2).** Les passages cités sont corrigés ; `docs/VOYAGE.md` dit en tête que son
laboratoire n'existe plus.

## À connaître avant tout ajout

- La page HTML est à 328 octets de son plafond (32 440 sur 32 768).
- Le premier paquet (`bootstrap`) est à 5,7 Ko du sien (194 327 sur 200 000 après la PR 115). Le budget
  mesure un fichier, pas ce que l'enfant télécharge : `bootstrap`, `rules` et `index` font
  335 Ko, chargés ensemble, et Phaser 81 % du JavaScript.
- Le mot « expédition » veut dire deux choses à l'écran : la mission (dans six phrases) et La
  Grande Expédition. Dans le code aussi (`ui/expeditions.ts` contre
  `ui/voyage/expedition/`). À décider.

## Ce qui ne vaut pas la peine

- Charger d'autres fenêtres à la demande : 8 à 17 Ko, moins de 1 % du premier chargement.
- Alléger les tests qui rejouent des parties entières (`engine-traces`, 25 s) : c'est le
  garde-fou.
- Passer à Phaser 4.
- Les clés de cache en chaînes, la copie de `fromStart`, `laneDefense`, les `filter` de
  `Game.step`.
- Retirer les styles et le code de l'ancien voyage : un voyage commencé doit se finir, et
  tout est déjà chargé à la demande.

## Ce que seul un téléphone peut dire

Le coût réel du dessin, les pauses du ramasse-miettes dans le WebView, le coût des écritures
du stockage au camp, le démarrage (contexte graphique, analyse de Phaser, polices), la chauffe
de l'appareil. Aucune mesure de cette revue ne vient d'un téléphone.

## Revue sévère et conseil — 22 novembre 2026

Demande du parent, une fois les quatre lots fusionnés et avant de publier : une revue sévère,
puis un conseil. Quatre relecteurs indépendants ont eu chacun un lot à casser ; trois juges
ont ensuite tranché, chacun sur un angle (ce que l'enfant garde, les garde-fous, ce qui tombe
entre les relectures).

**Verdict, trois voix sur trois : rien de bloquant, publier.**

Ce qui a été comparé entre l'ancien code et le nouveau, sans une différence :

- 198 918 demandes de sauvegarde tirées au hasard, avec imports, lectures, écritures
  refusées, stockage illisible ; puis 13 368 paires de demandes que le texte pourrait
  confondre ; des parties entières (8 732 demandes, 157 écritures de chaque côté) ;
- 95 016 recherches de place de camp sur les six cartes, plus 98 670 dans des camps qui se
  remplissent ;
- les plans du voyage et de l'expédition sur 6 000 graines par version, 600 000 offres de
  récompense, 200 000 offres de cadeaux, 40 000 états d'expédition ;
- 60 parties entières (grande aventure des révisions 1 à 7, missions, aventure sans fin,
  voyages, expéditions) ;
- 240 voyages écrits par la version des testeurs, relus et finis ; les 2 097 152 anciens
  codes `VOYAGE-…`, tous refusés proprement.

Ce qu'ils ont trouvé, corrigé par la PR 115 (CI, tests, deux valeurs encore tapées) et par la
PR de documents qui la suit :

- la garde « documents seuls » de la CI se laissait tromper par un fichier renommé et, si sa
  réponse était inattendue, faisait sauter toutes les recettes sans rien de rouge ;
- des tests qui ne tenaient pas ce qu'ils annonçaient : la demande de sauvegarde, deux
  limites de sauvegarde, un contrôle de longueur vide ;
- les joueurs automatiques des mesures, que plus aucun test ni le compilateur ne relisaient ;
- deux écritures oubliées par le lot 4 ; des phrases de ce document plus optimistes que les
  mesures (le gain de la CI surtout).

Essais faits en plus avant de publier, sur le paquet corrigé : la nouvelle version ouverte
par-dessus un profil écrit par la version en ligne (étoiles, aventure en cours, deuxième
joueur) ; la mise à jour depuis la version des testeurs ; le fichier familial ; la fermeture
forcée ; les doubles appuis ; l'entraînement du héros avant et après la vague 4.

**Ce que personne n'a vérifié** : rien sur un vrai téléphone, rien avec les enfants ; Chromium
seulement (ni Firefox ni Safari) ; deux onglets ouverts pendant une publication ; un
stockage plein sur un vrai appareil.

**Laissé de côté par le conseil** : faire tourner la fin de la recette des menus dans une
seule tâche, la protection de branche, un second raccourci de sauvegarde quand le stockage
est absent.
