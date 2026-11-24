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

## Après le lot : mesure sur le S24 et limite à 60 images par seconde (24 novembre)

Relevé du parent avec l'APK de test v5 (`?perf=1`, S24 Ultra, Android 17, WebView Chrome 157 ;
le jeu ne confirme pas lui-même l'appareil) : 3 min 35 de la vague 1 à 12, **120 images par
seconde** en médiane, 107 au plus bas, 0,9 ms de calcul par image en moyenne (2,3 au 95e
centile), 10,2 ms par image au 95e centile, une seule image longue (79 ms), 26 Mo de mémoire
du code. Pas de chauffe, écran resté allumé pendant les vagues sans toucher.

Conclusion : le dessin n'est pas un problème sur ce téléphone (rien n'est mesuré sur un
téléphone d'entrée de gamme). Mais le plateau était dessiné 120 fois par seconde pour une
bataille calculée 30 fois : **décision du parent, limite à 60**. `src/render/frameLimit.ts`
mesure le rythme de l'écran toutes les trente images (l'écran d'un téléphone change de vitesse,
et les premières images du chargement sont lentes : attaque indépendante), puis ne dessine qu'une image sur
deux (trois, quatre) quand l'écran va au moins deux fois plus vite que 60 Hz : 120 Hz → 60,
144 Hz → 72, 240 Hz → 60. Un écran de 60 ou 90 Hz dessine comme avant. La limite de Phaser
seule (`limit: 60`) aurait laissé tomber les images un peu en avance d'un écran à 60 Hz, donc
30 images par seconde par moments : elle est réglée sous le temps de deux images. Tenu par
`tests/frame-limit.test.ts` ; à confirmer par un nouveau relevé sur le S24 (attendu : environ
60). La mesure de l'écran est chargée à part, juste après le démarrage : dans le paquet du
jeu, elle faisait déborder la version « aperçu publicitaire » du site (200 080 octets, CI
rouge). Paquet du jeu : 199 607 octets sur 200 000 (site), 199 932 (aperçu publicitaire),
199 873 (essai publicitaire). **Il ne reste presque plus de place** : le prochain lot qui
ajoute au jeu doit d'abord sortir un écran du paquet (chargé à la demande).

## Place dans le paquet du jeu (24 novembre)

Demande du parent : « traite le vrai sujet ». Trois fenêtres sont chargées à part, demandées dès
le lancement : le carnet de caprices, la page « Favoris », le guide des unités. Paquet du jeu :
199 607 → 195 901 octets (site et application), 199 932 → 196 226 (aperçu publicitaire). Un
premier essai sortait aussi la sauvegarde familiale (−9 150 octets en tout) ; l'attaque
indépendante a montré qu'un navigateur ne redemande jamais un module qui a échoué une fois :
sur un site qui ne garde rien, la sauvegarde familiale est le seul moyen de sortir l'aventure,
elle reste donc dans le paquet. Détails : `docs/ARCHITECTURE.md`, « Trois fenêtres hors du
paquet principal ».

**Défaut ancien, relevé en passant, pas corrigé** : la porte de l'index des serpents et celle
du voyage disent « Réessaie » quand leur fichier n'arrive pas ; dans Chromium un nouvel essai ne
redemande pas le fichier. Il faudrait dire de recharger la page : de nouveaux mots, à décider
par le parent.

## Relevé sur le S24 avec la limite à 60 (APK de test v6, 24 novembre)

Même partie que le relevé v5 (vague 1 à 12, 3 min 30) : **60 images par seconde** en médiane,
56,6 au plus bas (v5 : 120 et 107) ; 12 569 images dessinées contre 25 777. Le calcul par image
dessinée passe de 0,9 à 1,6 ms en moyenne : chaque image porte deux images de temps de jeu, le
calcul total ne change pas. Une image de 109 ms (v5 : 79). Mémoire du code au moment du relevé :
50 Mo (v5 : 26) ; une seule photo, qui dépend du ménage du navigateur : à revoir si un prochain
relevé reste aussi haut.

## Images ré-encodées (24 novembre)

Les 25 planches d'images encore « sans perte » et utilisées par le jeu sont ré-encodées en
qualité 88 : 13,7 → 6,7 Mo (−7,0 Mo pour l'application et le site). Le parent a comparé
avant/après (zooms ×2 sur les zones les plus détaillées) puis joué l'APK de test v7 : « pas de
différence ». Écart visible mesuré : moins de 1 sur 255 en luminosité, un peu plus couleur par couleur (le
plus marqué : un liseré à peine visible autour de l'œil rouge du serpent bleu). Vérifié par `npm run verify`,
`test:browser`, `test:render-settings`, `test:saves:update` et la CI. Pas essayé avec les enfants.
