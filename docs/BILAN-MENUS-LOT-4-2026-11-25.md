# Bilan — les menus à l'allure du premier écran, lot 4 : la page Favoris (25 novembre 2026)

Suite de « Continuer les menus » (parent, 24 novembre). Lots précédents :
[lot 1](BILAN-MENUS-2026-11-24.md), [lot 2](BILAN-MENUS-LOT-2-2026-11-24.md),
[lot 3](BILAN-MENUS-LOT-3-2026-11-25.md).

## Ce qui est fait

- **La page Favoris prend l'allure des pages déjà habillées** (`src/ui/homeSkin.css`, le
  bloc « Favoris » à la fin) :
  1. la feuille a le trait d'encre et l'ombre posée du voyage ;
  2. un allié est une carte aux coins ronds, avec une ombre nette ; pas choisi, il a le trait
     d'encre ; choisi, il garde son vert et sa coche ;
  3. « Précédents », « Suivants », « Tous les serpents » et le choix de la composition sont
     les boutons clairs du voyage (trait d'encre, petite ombre) ;
  4. **« Précédents » sur la première page et « Suivants » sur la dernière pâlissent.** Ils
     étaient éteints mais avaient exactement l'air des autres : un enfant pouvait appuyer
     sans rien voir se passer.
- **Rien ne bouge, rien ne change de taille.** Aucune règle du jeu, aucun mot, aucune image
  nouvelle, aucun crédit dépensé. Le paquet du jeu ne bouge pas (195 824 octets pour le
  site, 195 859 pour l'application, sur 200 000).
- **La leçon du lot 3 est appliquée dès l'écriture** : une règle par pièce, sans `:is()` qui
  mêlerait des poids, et aucune règle ne touche un bouton éteint (chacune porte
  `:not(:disabled)`, ou ne vise que l'état éteint).
- La règle commune qui efface l'ancien bord des pages ne vise plus la feuille des Favoris,
  qui n'en avait pas : son trait est écrit une seule fois, dans son bloc.

## Comment c'est vérifié

- **Mesure boîte par boîte, tête contre la version fusionnée, 170 états** : français et
  anglais ; les quatre pages de la liste, et un allié retiré (sept sur huit, « Utiliser ces
  favoris » éteint) ; onze tailles de 568 × 320 à 1920 × 1080, dont deux fenêtres debout ;
  les barres d'un téléphone. 7 542 boîtes, toutes à la même place et à la même taille à
  0,05 px près, la même taille de lettres, le même défilement.
- **L'ombre d'une carte ne touche jamais la rangée du dessous** : elle fait 4 px, et le
  plus petit écart mesuré entre deux rangées est de 9 px.
- **L'allure de chaque pièce dans chaque état** (style calculé, tête contre la version
  fusionnée), au repos dans les 170 états, puis sous la souris, enfoncée et au clavier
  (forcés par l'outil du navigateur), et éteinte (forcée dans la page), à 780 × 360 et
  1280 × 800. Seules changent les pièces visées. Une carte éteinte et un bouton éteint
  gardent l'ombre que leur donnent les feuilles du jeu ; « Utiliser ces favoris » ne change
  dans aucun état ; l'anneau du clavier est le même partout.
- **Captures regardées** : 780 × 360 (première page ; dernière page avec sept alliés sur
  huit), 568 × 320 avec les barres (la page défile, comme avant), 1280 × 800, et une fenêtre
  debout de 600 × 960 en anglais.

## Ce que la relecture indépendante a trouvé, avant la demande de fusion

Un relecteur indépendant a attaqué le lot avant qu'il soit poussé, avec la consigne du
lot 3 : chercher une règle d'habillage qui écrase une règle d'état. **Rien de bloquant, et
aucune règle d'état écrasée dans un état que le jeu peut produire** (toutes les propriétés
calculées de chaque pièce, neuf états forcés croisés avec allumé / éteint et choisi / pas
choisi, à trois tailles). Les six autres pages sont identiques à la version fusionnée, au
pixel près. Il a trouvé un vrai défaut, petit, que le lot apportait :

- **Au clavier, l'anneau d'une carte perdait son côté haut** sous l'ombre neuve des boutons
  de la bande, qui se peint au-dessus des cartes (un reste de l'ancienne bande collante). Sur
  le plus petit téléphone, le trait de la feuille passait aussi sur un côté de l'anneau de la
  liste. Corrigé : la pièce qui porte l'anneau passe devant ses voisines. Rejoué avec la
  vraie touche Tab, à six tailles : plus aucun côté de l'anneau n'est caché par le lot (il
  suit maintenant les coins ronds) ; sur le plus petit téléphone, où une voisine en cachait
  déjà une bonne part, on en voit plus qu'avant. Les arrêts gardent leur ordre et leur place.
- La feuille pesait plus lourd que l'anneau du clavier. Elle ne prend jamais le clavier ;
  si elle le prenait un jour, elle garde maintenant son anneau.
- Un commentaire de la feuille disait « aucune règle ne touche un bouton éteint » : faux
  pour les coins ronds et pour le bouton pâli, écrits exprès. Corrigé.
- Vérifié en jouant : la page Favoris ne s'ouvre pas pendant un combat (son bouton est
  éteint), donc ses cartes ne sont jamais éteintes à l'écran.

## La seconde relecture, sur la correction : rien de bloquant

- **Aucune boîte ne bouge quand une pièce prend l'anneau** : toutes les boîtes de la page,
  au repos et à chaque vrai arrêt de la touche Tab, à cinq tailles, sur la version
  fusionnée, le premier jet et la correction. Rien n'est couvert à tort : l'en-tête, la
  fenêtre de l'index des serpents, les réglages et l'écran « tourne ton téléphone » restent
  dessus.
- **La baisse de l'anneau de 18 à 22 % vient seulement des coins ronds** : les coins remis
  carrés dans la page, le compte de pixels redevient celui de la version fusionnée.
- **Aucune règle d'état écrasée** : 978 distinctions gardées sur 978 à 780 × 360, 843 sur 843
  à 568 × 320.
- **Un effet cosmétique apporté par la correction** : sur le plus petit téléphone, où la
  feuille défile (568 × 320 avec les barres du système), la pièce qui porte l'anneau passe
  devant le trait d'encre de la feuille et le coupe sur sa largeur. Au doigt, c'est la liste
  des compositions, qui reçoit l'anneau à l'ouverture (plus ancien). Laissé : l'anneau
  entier compte plus que ce bout de trait.
- Deux phrases de mes commentaires étaient inexactes : corrigées (le paquet construit ne
  change pas d'un octet).

## Ce qui n'est pas vérifié

- **Rien sur un vrai téléphone, rien avec les enfants.** Chromium seul : ni WebView
  Android 108, ni Safari, ni Firefox.
- La souris et le doigt sont simulés ; la marche au clavier est réelle.
- L'audit d'états est fait en français ; l'anglais est mesuré boîte par boîte et regardé.
- **Défaut plus ancien, rendu un peu plus visible** : sur le plus petit téléphone
  (568 × 320 avec les barres du système), « Tyrannosaure » dépasse de sa carte de 1,4 px de
  chaque côté ; il touchait un bord pâle, il touche maintenant le trait d'encre.
- **Défauts plus anciens, pas touchés** (mise en page, pour un lot à part) : sur ce même
  petit téléphone, « Suivants » passe à la ligne et la page défile ; la phrase d'échec de
  « Tous les serpents » casse la bande en trois rangées ; la bande garde un `z-index` et un
  fond de l'époque où elle était collante.
- Le trait d'encre de la feuille suit ses coins ronds à partir de Chromium 94 ; l'application
  demande une WebView 108 au moins.

## Recettes jouées avant de pousser

- **Sur le premier jet, toutes les recettes de la CI** : les dix des écrans, les huit des
  règles et du rendu, les sept des sauvegardes, `test:back-button`, `test:locale`,
  `test:caprices`, `test:mobile-menus` en entier, et la chaîne de vérification (format,
  1 051 tests unitaires, `test:android-signatures`, `test:browser`, `test:discovery`,
  `test:ads-preview`, `test:ads-delivery`, `test:android-web`, `test:family`, le jeu
  portable). Toutes vertes.
- **Sur la version corrigée** (qui n'ajoute qu'une règle de focus dans cette feuille) :
  `test:mobile-menus` hors voyage, les dix recettes des écrans, `test:browser`,
  `test:android-web`, `test:locale`, les tests unitaires, le format, les builds du site et de
  l'application.

Puis la CI de la demande de fusion.
