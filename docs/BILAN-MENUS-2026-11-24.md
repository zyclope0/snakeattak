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

## Comment c'est vérifié

- **Mesure avant/après dans Chromium, 40 cas** (cinq pages × 568 × 320, 780 × 360,
  812 × 375, 1280 × 800 × français et anglais), sur le paquet de l'application : l'habillage
  n'ajoute aucune cible sous 48 px, aucun bouton coupé, aucun élément hors de l'écran, aucun
  appui pris par un voisin (cinq points par bouton), aucun défilement de page.
- **« Aventure classique », hauteurs mesurées** : 0 px de trop à 640 × 360, 780 × 360 (avec
  et sans barres du téléphone), 832 × 384 avec barres et 1280 × 800 ; à 568 × 320 la page
  défile de 38 px, comme avant l'habillage. L'image d'un chapitre fait 91 px de haut à
  780 × 360 (63 avec les barres), 37 à 640 × 360, 243 à 1280 × 800.
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
- Sur un petit téléphone (640 × 360), l'image d'un chapitre n'est qu'une bande de 37 px de
  haut : on reconnaît le terrain, sans plus.
- Déjà là avant ce lot, vu par la mesure : à 568 × 320, sur la page Missions, la roue des
  réglages est en partie recouverte par le panneau. À corriger dans le lot « Missions ».
- Le bouton de pâte s'étire à la taille du bouton : sur un bouton très large, ses bouts ronds
  s'allongent.
