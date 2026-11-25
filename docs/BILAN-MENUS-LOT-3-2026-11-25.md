# Bilan — les menus à l'allure du premier écran, lot 3 : La Grande Expédition et le voyage (25 novembre 2026)

Suite de « Continuer les menus » (parent, 24 novembre). Lots précédents :
[lot 1](BILAN-MENUS-2026-11-24.md), [lot 2](BILAN-MENUS-LOT-2-2026-11-24.md).

## Ce qui est fait

- **La Grande Expédition et le voyage prennent l'allure de la page Missions**
  (`src/ui/voyage/voyage.css`, à la fin) :
  1. le grand panneau de papier a le trait d'encre et l'ombre posée des autres pages ;
  2. les cartes (un arrêt du voyage, une carte de l'expédition, un cadeau à choisir) ont un
     trait d'encre et une ombre nette ;
  3. l'arrêt à jouer du voyage porte le liseré miel de la mission à jouer, et son numéro est
     sur un pain de miel ; un arrêt pas encore là a un trait pâle ;
  4. le terrain d'une carte a un liseré d'encre ;
  5. les places du sac et les boutons clairs du panneau (« La Grande Expédition », « Une autre
     expédition », « Tirer encore », « Ne rien prendre », « Garder mes cadeaux ») ont le trait
     d'encre.
- **Les couleurs qui disent quelque chose restent** : l'or du chemin des braves, le violet du
  gardien, la terre cuite du camp tombé, le vert de ce qui est fait. Les pastilles de la route
  de l'expédition ne changent pas.
- **La roulotte garde son dessin d'avant.** Une carte trop chère s'y reconnaît à son trait
  pâle et sans relief, et ses rangées serrées laissent déborder un long texte sur un
  téléphone (défaut plus ancien, voir plus bas) : un trait d'encre l'aurait barré.
- **Rien ne bouge, rien ne change de taille** : seuls le trait, l'ombre et les couleurs
  changent. Aucune règle, aucun mot, aucune image nouvelle, aucun crédit dépensé. Le paquet
  du jeu ne bouge pas (195 824 octets pour le site, 195 859 pour l'application, sur
  200 000) : la feuille du voyage est chargée à part.

## Ce que la relecture indépendante a trouvé, avant la demande de fusion

Un relecteur indépendant a attaqué le lot avant qu'il soit poussé (135 états semés par le
vrai moteur, tête contre la version fusionnée, en français). Un défaut bloquant, corrigé :

- **À la roulotte, une carte trop chère avait le même trait et le même relief qu'une carte
  qu'on peut acheter**, et prenait le liseré vert sous la souris. Ma règle l'emportait sur
  celle de la carte éteinte. Corrigé : la roulotte n'est pas habillée.
- Les pièces et le pot de miel se lisaient moins bien dans le sac, sur un disque devenu
  miel : le disque garde son jaune pâle.
- L'ombre des cartes de l'expédition avait pris 1 px et touchait le pointillé du pied : elle
  garde sa hauteur.
- Sur un petit téléphone, le trait d'encre du panneau tombait à 1 px, invisible : 2 px au
  moins.
- Un sélecteur ne touchait rien : retiré.

## Ce que la correction a cassé, et qui a été rattrapé avant la demande de fusion

Une seconde relecture indépendante a attaqué la correction. Une panne du service l'a coupée
deux fois avant son compte rendu ; ses mesures étaient restées sur le disque, et elles
montraient un défaut bloquant, apporté par la correction elle-même :

- **L'arrêt à jouer du voyage avait perdu son liseré miel** ; l'arrêt fait, l'arrêt à jouer
  et l'arrêt pas encore là avaient le même relief. En sortant la roulotte de l'habillage,
  j'avais réuni l'arrêt et le cadeau dans un `:is()` : il donne à tous le poids du plus
  lourd, et la règle commune écrasait les trois règles d'état écrites plus bas. Aucune boîte
  ne bougeait : ni ma mesure ni les recettes ne pouvaient le voir. Corrigé (deux sélecteurs
  séparés), et **la recette `test:mobile-menus` refuse désormais une carte du voyage où ces
  trois arrêts ont le même relief**. Jouée sur la version cassée, elle échoue sur ce
  contrôle ; sur la version réparée, elle passe.

Une troisième relecture indépendante a ensuite attaqué ce dernier état, avec pour consigne
de chercher ce défaut-là partout : voir plus bas.

## Comment c'est vérifié

- **Mesure boîte par boîte, tête contre la version fusionnée, 102 états** (le voyage en
  cours, l'expédition d'un joueur qui a un voyage, l'expédition d'un nouveau joueur ; onze
  tailles de 568 × 320 à 1920 × 1080, dont deux fenêtres debout ; les barres d'un téléphone ;
  français et anglais), rejouée sur la version corrigée : 9 941 boîtes, toutes à la même
  place, à la même taille, avec la même taille de lettres ; le même défilement. L'intérieur
  des dessins tirés au hasard à chaque visite (terrain, haltes) est laissé hors de la mesure.
- **Les états du relecteur, rejoués sur la version corrigée** : la roulotte riche, pauvre et
  pleine, à neuf tailles (27 états, 1 056 boîtes identiques). Les cartes de la roulotte ont
  exactement l'allure de la version fusionnée, éteintes ou non ; seuls le panneau, le
  pointillé du pied et les places du sac changent.
- **Le relecteur, de son côté** : 135 états semés par le vrai moteur, 8 825 boîtes
  identiques ; aucune règle du lot ne touche une autre page (184 boîtes mesurées sur
  l'accueil, Missions, Aventure classique, Favoris, « Pour les parents »).
- **L'allure de chaque arrêt du voyage, mesurée sur la version réparée** (style calculé,
  tête contre la version fusionnée) : l'arrêt fait a le trait d'encre et l'ombre nette,
  l'arrêt à jouer le liseré miel et l'ombre bois, l'arrêt pas encore là le trait pâle et
  l'ombre légère ; l'arrêt tombé (état forcé dans la page) garde son relief pâle.
- **Captures regardées** : l'expédition et le voyage à 780 × 360 et 1280 × 800 ; et, sur les
  captures de la recette `test:expedition`, les vues qu'on n'atteint qu'en jouant : le choix
  entre deux chemins (780 × 360 et 1280 × 800), le choix d'un cadeau, le choix d'une halte et
  la roulotte (780 × 360). Le chemin des braves garde son or.
- **Recettes** : voir la fin du document.

## Ce qui n'est pas vérifié

- **Rien sur un vrai téléphone, rien avec les enfants.**
- L'arrivée d'une expédition, la fin d'un voyage et le camp tombé n'ont pas été regardés : les
  mêmes règles s'y appliquent, et les recettes les jouent pour la mise en page, pas pour
  l'allure.
- Les fenêtres du voyage (la question, le caprice) ne sont pas touchées : ce sont des
  fenêtres, pour le lot des fenêtres.
- Les restes du lot 2 sur ces deux pages ne sont pas traités ici : dans une fenêtre
  d'ordinateur debout, la roue cache un morceau du titre ; de 1000 à 1034 px de large, partie
  non gardée, elle est coupée.
- **Défaut plus ancien, vu par le relecteur, pas touché** : à la roulotte pleine (six cartes)
  sur un téléphone de 780 × 360, le texte de « La grande réserve de miel » déborde de sa
  carte, en haut et en bas. À corriger dans un lot à part : c'est de la mise en page.
- **Défaut plus ancien, vu sur les captures de la seconde relecture, pas touché** : dans une
  fenêtre d'ordinateur debout (600 × 960), au choix entre deux chemins, le nom du défi est
  coupé par le bord de sa carte (« La tirelire », « Méga serpent »). Pareil sur la version
  fusionnée. Mise en page, pour un lot à part.
- L'anneau du clavier d'un bouton collé au bord du panneau (« Une autre expédition ») perd
  1 px sous le trait d'encre du panneau ; il était déjà rogné de 1 px.
- Personne n'a regardé un voyage fini (cinq arrêts faits). L'anglais est mesuré boîte par
  boîte, pas regardé.

## Recettes jouées avant de pousser

- **Sur la version réparée (le dernier état)** : `test:mobile-menus` en entier (8 607
  contrôles, dont les huit nouveaux sur le relief des arrêts), `test:expedition`,
  `test:journey`, `test:audit`, `test:child-mobile`, `test:offline`, `test:mission-journey`,
  `test:browser`, `test:android-web`, `test:locale`, les 1 051 tests unitaires, le format,
  les builds du site et de l'application.
- **Sur la version cassée** (celle d'avant la réparation) : la moitié « voyage » de
  `test:mobile-menus`, avec le nouveau contrôle. Elle échoue, sur ce contrôle.
- **Sur le premier jet** (avant les deux corrections, qui ne changent que des sélecteurs et
  des couleurs de cette feuille) : toutes les autres recettes de la CI, dont les huit des
  règles et du rendu, les dix des écrans, les sept des sauvegardes, `test:back-button`,
  `test:caprices`, `test:discovery`, `test:ads-preview`, `test:ads-delivery`, `test:family`,
  `test:android-signatures`.
- `test:journey` a échoué une fois sur le premier jet, au chargement de la page (30 secondes
  dépassées), pendant que la machine jouait quatre recettes et la relecture à la fois ;
  rejouée seule, puis sur chaque version suivante, elle passe.

Puis la CI de la demande de fusion.
