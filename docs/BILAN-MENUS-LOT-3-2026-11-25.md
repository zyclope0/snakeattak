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
  5. au pied du panneau, les places du sac et le bouton clair (« La Grande Expédition », « Une
     autre expédition ») ont le trait d'encre.
- **Les couleurs qui disent quelque chose restent** : l'or du chemin des braves, le violet du
  gardien, la terre cuite du camp tombé, le vert de ce qui est fait. Les pastilles de la route
  de l'expédition ne changent pas.
- **Rien ne bouge, rien ne change de taille** : seuls le trait, l'ombre et les couleurs
  changent. Aucune règle, aucun mot, aucune image nouvelle, aucun crédit dépensé. Le paquet
  du jeu ne bouge pas (195 824 octets sur 200 000) : la feuille du voyage est chargée à part.

## Comment c'est vérifié

- **Mesure boîte par boîte, tête contre la version fusionnée, 102 états** (le voyage en
  cours, l'expédition d'un joueur qui a un voyage, l'expédition d'un nouveau joueur ; onze
  tailles de 568 × 320 à 1920 × 1080, deux fenêtres debout, les barres d'un téléphone ;
  français et anglais) : 9 992 boîtes, toutes à la même place, à la même taille, avec la même
  taille de lettres ; le même défilement. L'intérieur des dessins tirés au hasard à chaque
  visite (terrain, haltes) est laissé hors de la mesure.
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

## Recettes jouées sur la version finale

À compléter quand elles ont fini.
