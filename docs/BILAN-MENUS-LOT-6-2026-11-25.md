# Bilan — les menus à l'allure du premier écran, lot 6 : les fenêtres (25 novembre 2026)

Suite de « Continuer les menus » (parent, 25 novembre). Lots précédents :
[1](BILAN-MENUS-2026-11-24.md), [2](BILAN-MENUS-LOT-2-2026-11-24.md),
[3](BILAN-MENUS-LOT-3-2026-11-25.md), [4](BILAN-MENUS-LOT-4-2026-11-25.md),
[5](BILAN-MENUS-LOT-5-2026-11-25.md).

## Ce qui est fait

- **Les fenêtres des menus prennent l'allure des pages** (`src/ui/windowSkin.css`, une feuille
  nouvelle, chargée avec le jeu) :
  1. le bord de chaque fenêtre a le trait d'encre rentré des pages ;
  2. la croix qui ferme (« Comment jouer », les fiches) est un rond cerné d'encre, posé ;
  3. les boutons clairs (« Comment jouer » des réglages, « Fermer », « Choisir un fichier »)
     sont ceux du voyage ;
  4. les quatre cases des réglages et les listes ont le trait d'encre.
- **Les couleurs de la pâte sont nommées pour toute la page** (`src/ui/homeClearing.css`) :
  les fenêtres sont posées hors de l'accueil, et ne les voyaient pas. Les valeurs ne changent
  pas ; les pages de l'accueil sont identiques.
- **Ce qui garde son dessin** : les panneaux du combat (les alliés, les serpents annoncés, la
  préparation d'une mission, les outils du camp), pour le lot du camp ; un bouton éteint ; le
  miel des boutons principaux (« Fermer » des réglages, « J'ai compris », « C'est parti ! »).
- Ces fenêtres s'ouvrent aussi pendant une partie : elles y ont la même allure.
- **Rien ne bouge, rien ne change de taille.** Aucune règle du jeu, aucun mot, aucune image
  nouvelle, aucun crédit dépensé. Le paquet du jeu ne bouge pas (195 824 octets pour le site,
  195 859 pour l'application).
- **Rattrapé sur une capture, avant toute mesure** : dans les réglages, « Langue » et « Effets
  légers » gardaient leur bord pâle à côté de deux cases à l'encre, et la liste des fiches
  n'avait pas pris le trait (une règle plus lourde) : corrigé.

## Comment c'est vérifié

- **Mesure boîte par boîte, tête contre la version fusionnée** : sept fenêtres (réglages,
  « Comment jouer », fiches, confidentialité, sauvegarde familiale, bulle du code, index des
  serpents), français et anglais, à 780 × 360 et 1280 × 800 : 1 506 boîtes, toutes à la même
  place et à la même taille ; le même défilement.
- **L'allure de chaque pièce dans chaque état** (au repos, sous la souris, enfoncée, au
  clavier, éteinte) : seules changent les pièces visées ; un bouton éteint garde l'allure de
  la version fusionnée ; l'anneau du clavier ne change pas.
- **Les pages de l'accueil, après le déplacement des couleurs** : « Pour les parents » et
  Favoris mesurées, boîtes et allure identiques.
- **Captures regardées** : les six fenêtres à 780 × 360.
