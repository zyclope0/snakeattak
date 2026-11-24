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

## Ce que les recettes ont trouvé avant de pousser

- **Le bouton de pâte comptait ses mots comme coupés** (`test:mobile-menus`, étape du
  voyage, « Recommencer l'étape » à 812 × 375) : le bord dessiné mangeait la place des mots.
  Corrigé : le dessin garde sa largeur, le bord réel est plus mince.

## Comment c'est vérifié

À compléter : recettes jouées sur la machine avant de pousser, puis la CI.

## Ce qui n'est pas vérifié

- **Rien sur un vrai téléphone, rien avec les enfants.**
- Les pages Missions, La Grande Expédition, Favoris et « Pour les parents » n'ont reçu que
  l'habillage commun : leurs cartes et leurs boutons gardent leur dessin d'avant. Ce sont les
  lots suivants.
- Les fenêtres (réglages, joueurs, préparation d'une mission), le camp et le plateau ne sont
  pas touchés.
