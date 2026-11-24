# Bilan — gros lot du 23 novembre 2026

Demande du parent, le soir du 23 novembre : une revue complète, puis corrections,
optimisation, séparation des gros fichiers, fonctions répétées extraites, nettoyage, et
l'étape 3 (téléphone). Neuf agents en parallèle, chacun dans sa copie du dépôt et sur un
périmètre séparé, puis un dixième pour les défauts d'anglais trouvés en route. Leur travail est
rassemblé sur une branche, vérifié, puis attaqué par un relecteur indépendant avant la PR.

Aucune règle du jeu, aucune valeur d'équilibrage, aucun format de sauvegarde ne change. Les
traces de parties entières (`tests/engine-traces.test.ts`) et les empreintes de référence de
l'expédition et du voyage sont identiques, sans qu'aucune n'ait été réécrite.

## Ce qui est fait

### Gros fichiers découpés

| Fichier             | Avant | Après | Où est parti le reste                                                                                                                                     |
| ------------------- | ----: | ----: | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/expedition.ts` |   817 |    63 | `expeditionTuning.ts` (tables), `expeditionPlan.ts` (plan tiré de la graine), `expeditionState.ts` (état et transitions), `expeditionRead.ts` (relecture) |
| `src/game.ts`       |   683 |   570 | `gameGifts.ts` (cadeaux de l'aventure sans fin), `campArrival.ts` (camp porté)                                                                            |
| `src/bootstrap.ts`  |   563 |   200 | `src/boot/` : partie sur le plateau, ce qui s'écrit après un pas, carnets, partie non gardée, Phaser, écrans, grand bouton, fichier familial              |

- `src/expedition.ts` ne fait plus que réexporter les mêmes noms : aucun importeur ne change.
  `readExpeditionState` passe de 77 à 38 lignes, en lecteurs et contrôles nommés.
- `bootstrap.ts` reste la racine de composition ; ses morceaux sont dans un sous-dossier pour
  rester hors du paquet des règles. Mêmes paquets livrés, même feuille de style à l'octet.
- Dans `Game`, les méthodes publiques restent et délèguent ; le registre des cadeaux est un
  champ privé, donc l'état écrit d'une partie ne change pas.
- Comparaison avec l'ancien code de l'expédition : 360 plans, environ 5 700 coups de parcours
  et 173 000 relectures d'états vrais ou abîmés donnent les mêmes résultats.

### Fonctions longues de l'interface

| Fonction                | Avant | Après |
| ----------------------- | ----: | ----: |
| `bindExpeditionScreens` |   214 |    41 |
| `bindVoyageScreens`     |   131 |    36 |
| `bindWebAdPreview`      |   120 |    47 |
| `bindExpeditions`       |   116 |    61 |

Fonctions de plus de 60 lignes dans `src/ui` : 18 → 15. Les autres sont listées plus bas.

### Logique écrite une seule fois

- Expédition : compter les cartes d'un sac (`countCards`, partagé avec le voyage), pièces
  gagnées (`earn`), alliés portés (`carryUnits`), cadeaux qui peuvent monter (`climbable`),
  armure, « un cadeau rare compte double », statuts.
- Jeu : la carte dépensée (`takeCard`), « il faut une place » (`placeNeeded`).
- Moteur : le plus proche sans tri (`nearestTo`), à quatre endroits qui recopiaient
  filtre + tri.
- Rendu : la borne entre 0 et 1 (`clamp01`), sept copies ; valeurs nommées `MAX_FLOATS`,
  `EGG_PLAQUES`, `SHOT_PLAQUE`.
- Interface : l'autocollant de caprice (`capriceSticker`, deux copies) et la marque du
  pluriel (`plural`, trois copies).
- Recettes : `scripts/lib/recipe.mjs` lance Chromium et le serveur, porte les trois tailles
  d'écran et les clés de stockage. Neuf recettes migrées, 147 lignes de moins.

### Optimisations mesurées

- **Moteur** (`npm run benchmark`, médiane de trois, machine chargée par les autres agents) :
  pas moyen 0,351 → 0,200 ms, 95e centile 0,713 → 0,375 ms, temps de calcul des 3 600 pas
  1 193 → 751 ms (−37 %). Le gain vient de `Math.hypot`, que le moteur ne calcule plus quand
  l'écart sur un seul axe suffit à répondre (la distance n'est jamais plus petite que son
  plus grand côté). `Math.hypot` n'est remplacé nulle part. Quatre parties entières de
  l'aventure sans fin (jusqu'à 72 000 pas) gardent leurs empreintes.
- **Étiquettes flottantes** : chaque mot garde la même étiquette toute sa vie. Vague 11,
  48 alliés, 30 s : 4 143 → 365 redessins d'étiquettes (−91 %), 4 239 → 461 envois de texte
  à la carte graphique (−89 %). Une sonde compare 11 428 images de l'ancienne et de la
  nouvelle version : mêmes étiquettes visibles, même ordre de dessin.

### Défauts corrigés (trouvés par la chasse aux défauts)

- **Anglais à moitié français après la carte « La garde du cristal »** : « The Crystal
  Guard ! Protège ton cristal de 18 damage… » devient « The Crystal Guard! Blocks 18 damage
  to your Crystal. The King still gets through. »
- **Étiquette lue des cartes d'allié trop chères** : « Clubber, 55 coins, pas assez de
  coins » devient « …, not enough coins » (22 sortes d'alliés).
- **Mots français écrits dans le code** (« offert », « courte », « IA : », « et », « PV »…) :
  rangés au catalogue. Le garde-fou refuse maintenant un littéral du code qui est exactement
  un texte français du catalogue ; il trouvait 11 lignes sur l'ancien code.
- Le français affiché ne change pas d'un octet (sonde sur 331 chaînes).

### Étape 3 — téléphone (application seulement)

- **Écran allumé pendant une bataille** (T1) : `src/ui/screenAwake.ts`, API standard du
  navigateur (Screen Wake Lock), sans module ni code natif. Le verrou est pris quand une
  vague se joue, rendu en pause, fenêtre ouverte, page cachée ou retour à l'accueil.
- **L'application se déclare comme jeu** (T3) : `android:appCategory="game"`.
- **Plancher de WebView** (T4) : `minWebViewVersion` 108 et une page « Le jeu ne peut pas
  s'ouvrir » dans le seul paquet Android, sans script, sans lien sortant.

## Mots nouveaux, à lire par le parent

Page « WebView trop ancien » (`src/texts/fr/oldWebView.ts`). **Validés par le parent le 23
novembre au soir**, tels quels :

- « Le jeu ne peut pas s’ouvrir »
- « Ce téléphone a besoin d’une mise à jour. Va chercher un adulte. »
- « Pour les parents »
- « « Android System WebView » est trop ancien sur ce téléphone. Mets-le à jour dans Google
  Play, puis relance le jeu. »
- « Sur un téléphone plus ancien, mets aussi à jour « Google Chrome ». »

Anglais fait par un agent : « The game cannot open », « This phone needs an update. Go and get
a grown-up. », « For parents », « “Android System WebView” is too old on this phone. Update it
in Google Play, then restart the game. », « On an older phone, also update “Google Chrome”. »

Les mots rangés au catalogue par la correction de l'anglais ne sont pas nouveaux : le français
est celui qui s'affichait déjà.

## Vérifié, et comment

- `npm run verify` (format, 1 040 tests, build) sur la branche rassemblée, et
  `npm run build:android` ; `scripts/check-dist.mjs` vert sur les deux paquets.
- Paquet du jeu : 197 237 → 199 348 octets (limite 200 000). **Il ne reste que 652 octets** :
  le prochain ajout au paquet du jeu devra d'abord en libérer (un écran chargé à la demande).
- Chaque agent a lancé `verify` avant chacun de ses commits, et les recettes de son domaine :
  recettes de sauvegarde et de panne, `test:expedition`, `test:locale`, `test:ads-preview`,
  et les neuf recettes migrées, avant et après.

## Pas vérifié

- **Rien sur un téléphone.** À essayer sur le S24 : l'écran reste-t-il allumé pendant une
  vague regardée sans toucher ? Le Game Booster de Samsung change-t-il la cadence maintenant
  que l'application se déclare comme jeu ? La page « WebView trop ancien » n'a jamais été
  vue sur un vieux WebView.
- Firefox et Safari : que le saut de `Math.hypot` y donne les mêmes parties repose sur un
  raisonnement, pas sur un essai.
- La branche « la fenêtre arrive entre deux vagues » de la recette « partie non gardée » n'a
  jamais été prise : elle est vérifiée, pas exercée.
- La page « WebView trop ancien » s'afficherait aussi si la page du jeu ne se chargeait pas
  (erreur réseau ou HTTP, règle de Capacitor) : en la blâmant à tort. Impossible en principe
  avec des fichiers lus dans l'application ; non essayé.
- Pas essayé avec les enfants.

## Laissé pour plus tard

- Fonctions encore longues dans `src/ui` : `bindRewardControls` (96), `bindWebAds` (91),
  `road` (86), `bindMenu` (85), `bindRosterEditor` (83), `bindMissionDraft` (79),
  `createPlayerList` (78), et d'autres entre 60 et 75. Dans `src/render` : `bossSignals.draw`
  (99), `announceTurns` (75).
- Recettes encore sur leur propre serveur (seize) ou sur le serveur de développement (trois) ;
  le harnais des recettes de sauvegarde n'est pas encore branché sur le module commun.
- Logique encore recopiée, relevée par la chasse aux défauts : la vie pleine d'un allié (cinq
  écritures), l'armure appliquée aux alliés du camp (deux), la zone du camp écrite deux fois
  avec des chiffres différents (`checkpointUnits.ts` et `boardLandmarks.ts`), « une place où
  tenir » (quatre). La zone du camp n'est pas touchée sans mesure : elle décide des
  sauvegardes acceptées.
- `expeditionState.ts` garde 448 lignes ; il peut encore se couper en deux.
