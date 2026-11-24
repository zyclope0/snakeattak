# Bilan — les menus à l'allure du premier écran, lot 2 : Missions (24 novembre 2026)

Le parent a choisi la suite après la publication du premier lot : « Continuer les menus »
([décisions](DECISIONS-2026-11-24.md)). Ce lot habille la page Missions et répare l'en-tête
des pages, que le premier lot avait abîmé. Le premier lot : [bilan](BILAN-MENUS-2026-11-24.md).

## Ce qui est fait

- **Les cartes des missions à l'allure du premier écran** (`src/ui/homeSkin.css`) : trait
  d'encre et ombre posée, comme les pièces de la clairière. La mission à jouer porte un
  liseré miel et sa flèche est sur un pain de miel, comme « Jouer ». Une mission pas encore
  ouverte a un trait pâle, sans relief. Les cartes gardent leur papier, leur taille et leur
  place : seuls le trait, l'ombre et les couleurs changent.
- **L'en-tête des pages tient de nouveau sur une rangée.** Défaut du premier lot, déjà en
  ligne : à 1280 × 800, sur la page Missions, l'en-tête passait sur deux rangées (la plaque
  « ← Accueil » et le total des étoiles avaient grossi). La plaque et le total se comptent
  maintenant en lettres de la page : ils ont retrouvé leur taille d'avant le premier lot.
- **La roue des réglages n'est plus à moitié cachée sur un petit téléphone** (568 × 320,
  640 × 360, page Missions), défaut plus ancien noté au premier lot. L'en-tête demande la
  place qui lui reste et lâche d'abord ce qui compte le moins : le nom du jeu sur un écran
  d'ordinateur étroit (à 1024 × 768 il poussait aussi l'en-tête sur deux rangées), puis le
  total des étoiles sur un petit téléphone. Le total reste dans la page pour un lecteur
  d'écran, et se lit sur le premier écran.
- **Fenêtre d'ordinateur plus haute que large** (600 × 960) : la roue ne mord plus sur
  « Reprendre ma mission » (elle revient à 48 px), et un nom long (« premières »,
  « Crossroads ») ne passe plus sous la pastille de la carte (nom un peu plus petit dans
  cette mise en page à deux colonnes).
- **Aucun bouton ne change de place, aucune règle ne change, aucun mot ne change.** Aucune
  image nouvelle, aucun crédit dépensé. Le paquet du jeu ne bouge pas (195 824 octets sur
  200 000) : seule la feuille de style change.
- La couleur miel a maintenant un nom (`--clearing-honey`), à côté des autres couleurs de la
  pâte.

## Comment c'est vérifié

Tout a été joué sur la machine avant d'ouvrir la demande de fusion (méthode du parent du
24 novembre) : la CI confirme.

- **Mesure tête contre `main` dans Chromium, 80 cas** (cinq pages × huit tailles de 568 × 320
  à 1280 × 800 × français et anglais), sur le paquet de l'application : aucune cible sous
  48 px, aucun bouton coupé, aucun élément hors de l'écran, aucun appui pris par un voisin
  (cinq points par bouton), aucun défilement. 77 cas pareils, 3 meilleurs (la roue, dont le
  panneau prenait l'appui à 568 × 320 et 640 × 360), aucun pire.
- **L'en-tête sur une rangée** : quatre pages × treize tailles d'ordinateur (de 1000 × 680 à
  2560 × 1440) × deux langues, 104 cas, aucun sur deux rangées. Sur `main` : 15 cas, tous sur
  la page Missions (les treize tailles en français, les deux plus petites en anglais).
- **Page Missions, 24 cas** (douze tailles, dont trois fenêtres debout, × deux langues) :
  aucun nom sous sa pastille, aucun recouvrement dans l'en-tête, la roue jamais sous le
  panneau. Sur `main` : deux noms sous leur pastille et la roue sur le bouton à 600 × 960, la
  roue sous le panneau à 568 × 320 et 640 × 360.
- **Captures regardées une à une** : Missions à douze tailles en français et en anglais, avec
  les barres d'un téléphone (30/48/24/48) à 780 × 360 ; les quatre autres pages à 780 × 360
  et 1024 × 768.
- **Toutes les recettes que la CI joue, vertes sur la machine, sur la version finale** :
  `test:mobile-menus` en entier (8 599 contrôles), les dix recettes des écrans (dont
  `test:audit`, `test:child-mobile`, `test:mission-journey`, `test:offline`), les huit des
  règles et du rendu (dont `test:journey`, `test:expedition`), les sept des sauvegardes,
  `test:back-button`, `test:locale`, `test:caprices`, `test:browser` (site et export
  autonome), `test:discovery`, `test:ads-preview`, `test:ads-delivery`, `test:android-web`,
  `test:family`, `test:android-signatures`.
- 1 051 tests unitaires, format, builds (site, application, aperçu et essai de publicité,
  export autonome). Puis la CI de la demande de fusion, et une relecture indépendante.

## Ce qui n'est pas vérifié

- **Rien sur un vrai téléphone, rien avec les enfants.** L'APK de test à jour est à essayer.
- La mission à jouer se reconnaît à son liseré miel, à sa flèche et à son relief plus foncé.
  Le liseré seul est discret sur le papier clair (c'est la flèche qui porte le sens) : à
  regarder avec le parent.
- Les étoiles des cartes gardent leur brun d'avant : elles ne sont pas modelées.
- Sur un écran d'ordinateur de moins de 1180 px de large environ, la page Missions ne montre
  plus le nom du jeu dans son en-tête, même en anglais où il aurait tenu à 1024 px. Les
  autres pages le gardent.
- Sur un petit téléphone (moins de 680 px de large environ), la page Missions ne montre pas
  le total des étoiles : il n'y avait pas la place, la roue passait dessous.
- La fenêtre de préparation d'une mission, l'expédition, Favoris et « Pour les parents » ne
  sont pas touchés par ce lot, sauf par l'en-tête commun.
- Les anciennes règles de la carte du premier écran restent dans quatre feuilles de style,
  recouvertes : à retirer dans un lot à part.
