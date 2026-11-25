# Bilan — les menus à l'allure du premier écran, lot 8 : le catalogue des alliés (25 novembre 2026)

Suite de « Continuer les menus ». Le parent : « publie et fusionne-le, fais le prochain lot »
(lot 7 publié, publication n° 54). Le catalogue « Tous les alliés » était le dernier écran
du camp resté au dessin d'avant ([lot 7](BILAN-MENUS-LOT-7-2026-11-25.md)).

## Comment les choix ont été faits

Un regard indépendant (accessibilité WCAG 2.1 AA mesurée dans Chromium, et système de design
comparé aux meilleures ventes du genre, principes seulement), sur des captures prises avant
tout changement. Ses points qui restent dans la règle (trait, ombre, couleur) sont faits ;
ceux qui changent une taille, une place ou un texte vont au parent, une question à la fois.

## Ce qui est fait (dans `src/ui/campSkin.css`, fin de la feuille)

- **Le cadre** prend le trait d'encre des autres fenêtres (seule la couleur du bord change ;
  le catalogue était déjà une fenêtre centrée).
- **L'anneau du clavier** passe de l'or (1,8:1 sur le papier) à l'encre ; sur une carte, il
  est dessiné dedans : le haut de l'anneau de la première rangée était coupé par la grille
  qui défile. Sur les dalles vert foncé du pli « Conseils et outils », il est clair.
- **« Disponibles » et « À découvrir »** : les onglets de la préparation (au repos le bouton
  clair, ouvert enfoncé et vert) ; avant, l'onglet ouvert était un bouton vert plein qui
  ressemblait à l'action principale.
- **« Fiches » et « Fermer »** : les boutons clairs des menus.
- **Une carte qu'on peut prendre** : trait d'encre ; l'ombre posée seulement sur un grand
  écran (sur un téléphone couché, les rangées ne sont qu'à 4 px). Sous la souris, le papier
  à peine plus clair (le survol avait presque le vert d'une carte choisie ; il ne donne
  maintenant presque plus de signe, et sur tablette ou téléphone il n'y a pas de survol).
- **La carte choisie** : enfoncée, verte, cernée d'encre, avec la coche à l'encre de la
  colonne du combat (elle était en jade).
- **Trop chère ou à découvrir** : à plat, portrait passé, pastille du prix sans son miel,
  comme dans la colonne. Avant, une carte trop chère ne se distinguait presque pas (1,15:1)
  et un allié à découvrir gardait le miel d'un allié qu'on peut prendre.
- **Les pièces qu'on a** : le trait d'encre d'une information, sans relief.
- **Le pli « Conseils et outils »** : trois textes presque invisibles (les repères « Haut,
  Centre, Bas » à 1,35:1, le message du camp à 1,2:1, l'entraînement du héros à 1,6:1)
  prennent le clair sur le vert foncé, l'encre sur le papier ; de même le nom de l'allié
  choisi, sa consigne et « Annuler » au pied du pli (1,15 à 1,31:1 avant).

## Décisions du parent, posées une à une

1. **Une carte trop chère répond au toucher** (« Oui, elle répond ») : elle n'est plus
   éteinte ; un toucher dit « Il manque N pièces » en haut du catalogue, à la place des
   pièces, pendant 2,5 secondes, et dans le message du camp. L'allié n'est pas choisi, le
   catalogue reste ouvert, la carte est atteignable au clavier. La phrase existait déjà.
   Ajouté à la recette des menus du téléphone.
2. **« Fermer » en haut à droite sur ordinateur aussi** (« Oui, en haut à droite ») ; « au
   camp » et « Fiches » glissent juste avant lui.
3. **Les écritures des cartes plus grandes sur ordinateur seulement** (« Sur ordinateur
   seulement ») : nom 13 → 16 px, prix 12 → 14 px, sur un grand écran où il reste de la
   place ; sur un téléphone couché, la grille de cinq rangées ne tiendrait plus.

## Ce que l'attaque indépendante a trouvé, et corrigé

- **Bloquant** : l'anneau d'encre devenait invisible sur les dalles vert foncé du pli
  (1,2:1) : il y est clair.
- L'anneau dessiné dans une carte mordait le prix et le nom à 568 × 320 en anglais :
  rapproché du bord.
- Trois textes du pied du pli presque invisibles (voir plus haut), oubliés par la première
  mesure ; le bilan les disait tous lisibles.
- « Fermer » avait un trait plus épais que « Fiches » ; une carte choisie éteinte mélangeait
  l'ancien bord et la nouvelle coche ; un onglet éteint perdait sa forme : réglés.
- Plus ancien que ce lot, noté : des anneaux du clavier coupés au bord de leur pli
  (« Conseils et outils », « Actions du camp »).

## Comment c'est vérifié

- **Boîtes mesurées** contre une base construite depuis `main` : 48 états (8 tailles,
  français et anglais, les deux onglets, les plis ouverts), 8 996 boîtes ; sur un téléphone
  rien ne bouge ; sur un grand écran, seuls « Fermer » (et ce qui glisse avant lui) et les
  écritures des cartes changent (décisions du parent).
- **Contrastes** de chaque texte du catalogue, plis ouverts, à 780 × 360 et 1280 × 800 : plus
  aucun texte actif sous 4,5:1 (restent des boutons éteints, exemptés : « Réparer le
  cristal », les voies quand le miel est épuisé).
- **Captures** à 568 × 320, 780 × 360, 812 × 375 (anglais) et 1280 × 800 (dans `artifacts/`).

## Ce qui n'est pas vérifié

- Rien n'a été essayé sur le vrai téléphone ni avec les enfants.
