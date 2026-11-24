# Bilan — les menus à l'allure du premier écran, lot 1 (24 novembre 2026)

Demande du parent, le soir de la fusion du nouvel accueil : que les autres menus collent au
premier écran, sans refonte, avant toute nouvelle fonctionnalité. Son exemple : « Aventure
classique », où l'on ne voit pas ce qu'il y a dans les images. Il a accepté la proposition :
un habillage commun, puis page par page ([décisions](DECISIONS-2026-11-24.md)).

## Ce qui est fait

- **Un habillage commun à toutes les autres pages de l'accueil** (`src/ui/homeSkin.css`) :
  1. le décor de la clairière, assombri, à la place du fond vert uni ;
  2. « ← Accueil » sur la plaque peinte du jeu ;
  3. la roue des réglages et l'étoile du total, modelées ;
  4. le bouton de pâte de « Jouer » pour l'action principale de chaque page (« Continuer »,
     « Préparer », « C'est parti ! », « Utiliser ces favoris ») ;
  5. un trait d'encre et une ombre autour des grandes cartes de papier et des autres boutons
     du haut de page.
- **« Aventure classique »** : chaque chapitre est un tableau dans le cadre peint, avec son
  vrai terrain. Avant, les vignettes faisaient 50 px de large et deux sur trois étaient un
  dégradé tant qu'on ne les survolait pas. Un chapitre pas encore ouvert se voit quand même,
  sous un léger voile.
- **Aucun bouton ne change de place, aucune règle ne change**, aucun mot de l'écran ne change.
- **Poids** : trois images de 33 Ko, chargées seulement quand la page « Aventure classique »
  s'ouvre. Aucune pièce nouvelle modelée : aucun crédit dépensé. Le paquet du jeu perd
  369 octets (le code qui chargeait les grands terrains au survol est retiré).

## Ce que les recettes ont trouvé avant la demande de fusion

Toutes les recettes ont été jouées sur la machine avant d'ouvrir la demande de fusion
(méthode demandée par le parent le soir même). Elles ont trouvé trois défauts de l'habillage,
corrigés avant tout passage en CI :

- **Un bouton à deux lignes compté comme coupé** (`test:mobile-menus`, étape du voyage,
  « Recommencer l'étape » à 812 × 375) : la règle de l'habillage écrasait la taille et les
  lignes propres à ce bouton. Le bouton de pâte ne change plus que le dessin : taille, marges,
  lignes et police restent celles de la page.
- **32 px cachés dans le panneau de l'expédition** à 1280 × 800 (`test:expedition`) : le
  bouton et la roue avaient grandi. Même correction : chaque page garde ses tailles.
- **7 px de trop sur « Aventure classique » à 640 × 360** (`test:mobile-menus`), où la page
  tenait tout juste : cadre un peu plus fin, hauteur minimale de l'image plus basse.

## Ce que la relecture indépendante a trouvé, et ce qui a été corrigé

Un relecteur indépendant a attaqué la demande de fusion pendant sa CI (mesures dans Chromium,
tête contre `main`). Trois défauts sur « Aventure classique », un défilement en plus :

- **Fenêtre plus haute que large sur ordinateur** (960 × 1000) : le numéro, le nom et les
  étoiles des chapitres disparaissaient. Ma limite de hauteur écrasait celle des cartes
  empilées. Corrigé : la limite ne vaut que pour un écran couché.
- **À partir de 1000 × 680, la ligne « Découvrir les trois voies » était illisible** (vert
  sombre sur l'ardoise, 1,03:1). Corrigé : elle s'écrit en clair, à sa place.
- **Petit téléphone (568 × 320) : les étoiles chevauchaient le numéro** (jusqu'à 25 px).
  Corrigé : les étoiles sont dans un coin de l'image.
- **Avec les barres d'un téléphone, la page défilait davantage** (640 et 667 px de large ;
  en anglais, « The endless adventure » passait à la ligne à 720 × 360). Deux causes : le
  trait d'encre était une vraie bordure (2 px par bouton), et l'image au-dessus des mots
  prenait de la hauteur. Corrigé : le trait ne prend plus de place ; sous 700 px de large,
  l'image passe sur le côté, comme avant l'habillage. Mesuré contre `main` sur dix cas : le
  même défilement à 1 px près, et moins à 568 × 320 (19 px contre 38).
- Les légendes des tableaux étaient un peu pâles (4,0 à 4,4:1) : elles sont maintenant de la
  couleur du papier, avec une ombre sombre.

En relisant mes captures après ces corrections, j'ai vu que ma réécriture avait cassé la mise
en page des tableaux (une règle plus ancienne l'emportait : les mots partaient sur le côté).
Corrigé avant de pousser. Aucune recette ne l'aurait dit : c'est un défaut de dessin, pas de
taille.

## Comment c'est vérifié

- **Mesure avant/après dans Chromium, 40 cas** (cinq pages × 568 × 320, 780 × 360,
  812 × 375, 1280 × 800 × français et anglais), sur le paquet de l'application : l'habillage
  n'ajoute aucune cible sous 48 px, aucun bouton coupé, aucun élément hors de l'écran, aucun
  appui pris par un voisin (cinq points par bouton), aucun défilement de page.
- **« Aventure classique », hauteurs mesurées** : 0 px de trop à 640 × 360, 780 × 360 (avec
  et sans barres du téléphone), 832 × 384 avec barres, 1280 × 800, et dans une fenêtre debout
  (960 × 1000, 600 × 960). L'image d'un chapitre fait 93 px de haut à 780 × 360 (65 avec les
  barres), 245 à 1280 × 800.
- **Recettes vertes sur la version finale** : `test:mobile-menus` en entier (7 570 contrôles),
  `test:journey`, `test:audit`, `test:child-mobile`, `test:mission-journey`,
  `test:expedition`, `test:browser`, `test:offline`, `test:android-web`, `test:discovery`.
- **Recettes vertes sur la version d'avant les deux dernières corrections** (qui n'ont fait
  que retirer des réglages de l'habillage) : `test:locale`, `test:ads-preview`,
  `test:ads-delivery`, `test:endless`, `test:presentation`, `test:interruptions`,
  `test:threat-preparation`, `test:family`, `test:saves:unkept`, `test:back-button`, et, un
  passage plus tôt, les autres recettes de sauvegarde, de règles et de rendu.
- 1 051 tests unitaires, format, build. Puis la CI de la demande de fusion.

## Ce qui n'est pas vérifié

- **Rien sur un vrai téléphone, rien avec les enfants.**
- Les pages Missions, La Grande Expédition, Favoris et « Pour les parents » n'ont reçu que
  l'habillage commun : leurs cartes et leurs boutons gardent leur dessin d'avant. Ce sont les
  lots suivants.
- Les fenêtres (réglages, joueurs, préparation d'une mission), le camp et le plateau ne sont
  pas touchés.
- Sur un téléphone étroit (moins de 700 px de large), l'image d'un chapitre reste petite, sur
  le côté (43 × 105 px à 640 × 360) : on reconnaît le terrain, sans plus.
- Le contraste des légendes n'a pas été remesuré après la correction ; celui des mots clairs
  sur le bouton de pâte repose sur leur contour brun (2,2:1 sans lui, mesuré par le relecteur).
- Un chapitre pas encore ouvert ne se distingue que par un voile léger sur son image et par
  sa légende : à regarder avec le parent.
- Dans une fenêtre d'ordinateur plus haute que large, l'image d'un chapitre est une bande
  large et basse.
- Déjà là avant ce lot, vu par la mesure : à 568 × 320, sur la page Missions, la roue des
  réglages est en partie recouverte par le panneau. À corriger dans le lot « Missions ».
- Le bouton de pâte s'étire à la taille du bouton : sur un bouton très large, ses bouts ronds
  s'allongent.
