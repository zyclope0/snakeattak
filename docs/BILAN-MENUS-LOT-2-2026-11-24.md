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
- **L'en-tête des pages tient toujours sur une rangée.** Défaut du premier lot, déjà en
  ligne : sur ordinateur, l'en-tête de la page Missions passait sur deux rangées. Défaut plus
  ancien : sur un petit téléphone, la roue des réglages passait sous la rangée, à moitié
  cachée par le panneau. La cause est la même : quand la place manquait, c'est la roue,
  dernière de la rangée, qui passait à la ligne. Maintenant la roue reste, et ce qui compte
  le moins s'en va d'abord : le nom du jeu, puis le total des étoiles. Aucun seuil à régler :
  la règle vaut pour toute langue et tout texte.
- **La roue est alignée avec ses voisins** : sur téléphone elle était 4 px plus bas que
  « ← Accueil », presque contre le panneau. C'est le seul bouton qui bouge, de 4 px.
- **Sur un écran couché, rien ne change de taille** par rapport à la version en ligne :
  la plaque « ← Accueil » et le total des étoiles gardent les tailles du premier lot.
- **Fenêtre d'ordinateur plus haute que large** : la plaque et le total y gardent au plus la
  taille du téléphone de 780 × 360 (la rangée est étroite), la roue revient à 48 px quand il
  ne lui reste pas sa place, et un nom long (« premières », « Crossroads ») ne passe plus
  sous la pastille de sa carte (nom un peu plus petit dans cette mise en page à deux
  colonnes).
- **Aucune règle ne change, aucun mot ne change.** Aucune image nouvelle, aucun crédit
  dépensé. Le paquet du jeu ne bouge pas (195 824 octets sur 200 000) : seules des feuilles
  de style changent.
- Deux valeurs ont maintenant un nom : la couleur miel (`--clearing-honey`) et la taille de
  la roue des réglages (`--settings-size`).

## Ce que la relecture indépendante a trouvé, et ce qui a été corrigé

Un premier jet réglait l'en-tête par des seuils (cacher le nom du jeu sous 600 px de place,
le total sous 170 px) et ramenait la plaque et le total à la taille de la page. Toutes les
recettes et la CI étaient vertes. Un relecteur indépendant l'a attaqué (14 466 cas mesurés
dans Chromium, tête contre `main`) : rien de bloquant, mais de vraies régressions face à la
version en ligne.

- **Le total des étoiles disparaissait là où il tenait encore** : à 667 × 375 en français,
  à 640 × 360 en anglais, à 720 × 360 avec une barre de téléphone. Le seuil était trop large,
  et la plaque plus large qu'en ligne sur un petit téléphone.
- **Le total passait à 11 px sur tout téléphone** (13 à 17 px en ligne), pour des enfants de
  6 à 10 ans.
- **Sur un petit téléphone à grosses barres**, la plaque plus large cassait la rangée du
  haut (un bouton sur deux lignes, 11 px de défilement).
- **Dans une grande fenêtre debout**, la roue flottait au milieu de la rangée.
- Une phrase de ce bilan était fausse dans ces cas (« il n'y avait pas la place »).

Correction : plus de seuil, l'ordre de départ décrit plus haut ; et les tailles du premier
lot sur tout écran couché. **Le premier APK de test de ce lot (v12) a le premier jet** : il
est remplacé par le v13.

## Comment c'est vérifié

Tout a été joué sur la machine avant de pousser (méthode du parent du 24 novembre) : la CI
confirme.

- **Le balayage du relecteur, rejoué en entier sur la version finale, tête contre `main`,
  14 466 cas** : six pages (Missions, Favoris, Aventure classique, « Pour les parents », le
  voyage en cours, La Grande Expédition), français et anglais, barres de téléphone
  comprises. **Aucun défaut nouveau dans aucun cas.**
  - **Téléphones, 6 228 cas** (112 tailles de 568 × 320 à 932 × 430 avec trois jeux de
    barres ; puis de 560 à 800 px de large par pas de 4 avec six jeux de barres) : aucune
    taille changée, aucun panneau déplacé. Le total ne disparaît que là où `main` avait un
    défaut (572 cas : la roue sous le panneau). Corrigés : 572 en-têtes sur deux rangées,
    556 appuis pris par un voisin.
  - **Petites tablettes et téléphones longs, 2 268 cas** : 27 en-têtes sur deux rangées
    corrigés.
  - **Ordinateurs et tablettes, 2 124 cas** : 139 en-têtes sur deux rangées corrigés ; le
    nom du jeu s'en va dans ces 139 cas, et seulement là. Sur La Grande Expédition, la roue
    est maintenant au bord droit (elle flottait à 200 px et plus du bord).
  - **Fenêtres debout, 936 cas** : les recouvrements qui restent sont moins nombreux et plus
    petits que sur `main`.
  - **Un nouveau joueur, sans sauvegarde, 2 910 cas** (téléphones, ordinateurs, fenêtres
    debout).
- **Captures regardées une à une** : Missions à sept tailles en français et en anglais, avec
  les barres d'un téléphone (30/48/24/48) à 780 × 360 ; les autres pages à 780 × 360 et
  1280 × 800.
- **Recettes** : toutes celles de la CI, vertes ; la liste est en fin de document.

## Ce qui n'est pas vérifié

- **Rien sur un vrai téléphone, rien avec les enfants.** L'APK de test v13 est à essayer.
- La taille de police du système Android n'a pas été essayée.
- La mission à jouer se reconnaît à son liseré miel, à sa flèche et à son relief plus foncé.
  Le liseré seul est discret sur le papier clair (1,2 à 1,5:1, mesuré par le relecteur), et
  il ressemble à l'anneau du clavier : c'est la flèche qui porte le sens (brun sur miel,
  7,8:1). À regarder avec le parent.
- Les étoiles des cartes gardent leur brun d'avant : elles ne sont pas modelées.
- **Sur ordinateur, la page Missions en français ne montre plus le nom du jeu** dans son
  en-tête : il ne tient pas à côté de ses deux boutons. Les autres pages le gardent, et la
  page Missions en anglais aussi à partir de 1070 px de large.
- **Sur un petit téléphone, la page Missions ne montre pas le total des étoiles** quand il ne
  tient pas (648 px de large et moins en français, 600 et moins en anglais, sans barres). Il
  se lit sur le premier écran.
- **Défauts plus anciens, encore là** :
  - Missions, petit téléphone à grosses barres (moins de 500 px de place environ) : la roue
    et « Reprendre ma mission » se recouvrent (jusqu'à 43 px), dans les mêmes cas que sur
    `main`. Sur `main` c'est le bouton qui recouvre la roue, et on ne peut plus ouvrir les
    réglages ; maintenant la roue est dessus, et le bouton garde le reste de sa largeur.
  - Fenêtre debout étroite : pareil, sur Missions à 560 px et moins (640 et moins sur
    `main`) ; sur La Grande Expédition la roue touche encore le titre jusqu'à 860 px.
  - Noms sous la pastille en paysage à 568 px avec de grosses barres (« Les premières
    coquilles », « Le carrefour des fougères »), comme sur `main`.
- Sur « Pour les parents », la version ne s'affiche nulle part si le nom du jeu ne tient pas
  dans l'en-tête d'un grand écran (il la porte) : aucun appareil connu n'a ces marges.
- La fenêtre de préparation d'une mission, l'expédition, Favoris et « Pour les parents » ne
  sont pas touchés par ce lot, sauf par l'en-tête commun.
- Les anciennes règles de la carte du premier écran restent dans quatre feuilles de style,
  recouvertes : à retirer dans un lot à part.

## Recettes jouées sur la version finale

Toutes celles que la CI joue, vertes sur la machine avant de pousser :

- `test:mobile-menus` en entier (8 599 contrôles) ;
- les dix recettes des écrans (dont `test:audit`, `test:child-mobile`,
  `test:mission-journey`, `test:offline`) ;
- les huit des règles et du rendu (dont `test:journey`, `test:expedition`) ;
- les sept des sauvegardes, et `test:back-button` ;
- `test:locale`, `test:caprices`, `test:browser` (site et export autonome), `test:discovery`,
  `test:ads-preview`, `test:ads-delivery`, `test:android-web`, `test:family`,
  `test:android-signatures` ;
- 1 051 tests unitaires, format, builds (site, application, aperçu et essai de publicité,
  export autonome).

Puis la CI de la demande de fusion, et une seconde relecture indépendante, qui attaque la
correction.
