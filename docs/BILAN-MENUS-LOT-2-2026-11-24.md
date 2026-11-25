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
- **L'en-tête des pages tient sur une rangée** (une seule exception, plus bas : fenêtre debout
  étroite quand la partie n'est pas gardée). Défaut du premier lot, déjà en
  ligne : sur ordinateur, l'en-tête de la page Missions passait sur deux rangées. Défaut plus
  ancien : sur un petit téléphone, la roue des réglages passait sous la rangée, à moitié
  cachée par le panneau. La cause est la même : quand la place manquait, c'est la roue,
  dernière de la rangée, qui passait à la ligne. Maintenant ce qui compte le moins s'en va
  d'abord : le nom du jeu, puis le total des étoiles, puis la roue. La marque « Partie non
  gardée », les rares fois où elle est là, part la dernière. Aucun seuil à régler : la règle
  vaut pour toute langue et tout texte.
- **La roue et le total sont alignés avec leurs voisins** : sur téléphone ils étaient 4 px
  plus bas que « ← Accueil », la roue presque contre le panneau. Ils remontent de 4 px.
- **Quand la rangée est trop courte même pour la roue** (très petit téléphone à grosses
  barres, fenêtre debout étroite), elle se pose sur son voisin au lieu de passer dessous :
  en état normal, un appui sur la roue ouvre toujours les réglages. Le prix : elle cache un
  morceau de ce voisin (quelques lettres de « Reprendre ma mission » ou du titre de
  l'expédition).
- **Sur un grand écran, le total se range contre la roue** au lieu de flotter au milieu de
  l'en-tête (41 à 215 px plus à droite selon la page et la langue).
- **Sur « Pour les parents », la version est toujours au pied de page**, sur tout écran. Sur
  un grand écran elle était dans l'en-tête, à côté du nom du jeu : elle partait avec lui
  quand la place manquait.
- **Sur un écran couché, rien ne change de taille** par rapport à la version en ligne :
  la plaque « ← Accueil » et le total des étoiles gardent les tailles du premier lot.
- **Fenêtre d'ordinateur plus haute que large** : la plaque et le total y gardent au plus la
  taille du téléphone de 780 × 360 (la rangée est étroite) ; sur la page Missions, à 620 px
  de large et moins, la roue fait 48 px ; et un nom long (« premières », « Crossroads ») ne
  passe plus sous la pastille de sa carte (nom un peu plus petit dans cette mise en page à
  deux colonnes).
- **Aucune règle ne change, aucun mot ne change.** Aucune image nouvelle, aucun crédit
  dépensé. Le paquet du jeu ne bouge pas (195 824 octets sur 200 000) : seules des feuilles
  de style et une recette changent.
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
lot sur tout écran couché. **Le premier APK de test de ce lot (v12) a le premier jet.**

**Un second relecteur a attaqué cette correction**, recettes et CI de nouveau vertes. Un
défaut bloquant, dans un état que ni mes mesures ni les recettes ne jouaient :

- **La marque « Partie non gardée » était coupée de l'en-tête des pages** quand l'appareil
  refuse d'écrire la sauvegarde : dans 405 états sur 1 314 en français, 279 en anglais (page
  Missions de 568 à 780 px de large, voyage de 720 à 844 px, grands écrans). Elle n'avait pas
  de rang dans l'ordre de départ : elle partait la première. Sur `main` elle se voyait.
  Corrigé : elle part la dernière. Remesuré avec le script du relecteur, 2 628 états : jamais
  coupée, et jamais moins à portée du doigt que sur `main`. **L'APK v13 a ce défaut.**
- **L'anneau du clavier autour de la roue était coupé en haut et en bas.** Corrigé : la
  coupe se fait 8 px plus loin ; l'anneau est entier (mêmes pixels que sur `main`).
- **Sur un vieux WebView (108 à 128), la phrase « C'est réparé : ta partie est de nouveau
  gardée » aurait disparu des pages** (simulé par le relecteur, pas vu sur un vrai appareil) :
  l'en-tête était devenu un conteneur de mesure, ce qui change le repère de cette phrase sur
  ces versions. Corrigé : l'en-tête n'est plus un conteneur.
- Un navigateur qui ne sait pas couper d'un seul côté (Safari avant 16) montrait le nom du
  jeu par-dessus le panneau : il coupe maintenant des deux côtés.

**Un troisième relecteur a attaqué cette seconde correction**, recettes et CI encore vertes.
De vrais défauts, tous dans des états rares :

- **« Pour les parents », partie non gardée, grand écran, en français : la version ne se
  lisait plus nulle part** (7 tailles sur 7 ; sur `main` elle se lit). La marque avait pris
  la place du nom du jeu, qui la portait. Corrigé : la version est au pied de page sur tout
  écran. Remesuré : 24 états sur 24.
- **Rangée trop courte : la roue repassait sous son voisin**, comme sur `main` (le jet
  d'avant la posait dessus, par un effet de bord retiré avec le conteneur de mesure). Un
  appui au milieu de la roue n'ouvrait pas les réglages dans 17 états sur 144 en français
  (36 sur `main`). Corrigé : la roue et la marque se posent sur leur voisin. Remesuré avec le
  script du relecteur : 0 état sur 288, contre 63 sur `main`.
- **Partie non gardée, fenêtre d'ordinateur debout : la roue était coupée** là où elle
  restait à portée sur `main` (20 états en français). Corrigé sous 1000 px de large : dans
  une fenêtre debout étroite l'en-tête reprend deux lignes, la roue sous la marque, comme
  avant le lot. Remesuré, 1 344 états : la roue n'y est jamais moins à portée que sur
  `main`, la marque non plus. Il en reste un cas, voir la quatrième relecture.
- **Le contrôle ajouté à la recette ne gardait pas « la marque part la dernière »** : il ne
  jouait pas de rangée courte. Corrigé, voir plus bas.
- Sur la page Missions debout, la roue rapetissait jusqu'à 640 px de large alors qu'elle
  avait sa place à côté de « Reprendre ma mission » : seulement à 620 px et moins maintenant.

**Un quatrième relecteur a attaqué cette troisième correction** (1 827 états, tête contre
`main`). **Rien de bloquant** : aucune régression qu'un enfant ou un parent rencontrerait
dans l'application. Ce qu'il a trouvé, dans des états rares, n'est pas corrigé dans ce lot :

- **Partie non gardée, fenêtre d'ordinateur debout de 1000 à 1034 px de large, La Grande
  Expédition, en français : la roue est coupée** (21 états sur 306 ; 0 sur `main`). La règle
  des deux lignes s'arrête à 1000 px.
- **La roue et la marque, posées sur leur voisin, en cachent des lettres.** Fenêtre debout de
  700 à 800 px, La Grande Expédition : la roue cache le numéro de l'étape dans le titre.
  Missions à 584 × 320 avec 48 px de barre de chaque côté : « Reprendre ma miss… ». Partie
  non gardée, 568 × 320 à grosses barres : la marque cache 12 lettres sur 18 de « Reprendre
  ma mission », et un appui sur la droite du bouton ouvre la fenêtre de la marque. Aucun
  voisin ne garde moins de 48 px à lui (0 cas sur 1 827).
- Sur la page Missions debout, à 620 px et moins, la roue fait 48 px même pour un joueur
  sans mission à reprendre, qui aurait la place pour 64.
- « Pour les parents », partie non gardée, grand écran : le nom du jeu quitte l'en-tête pour
  1 px. Rien n'est perdu : la version est au pied de page.
- Le contrôle de la recette, sur la rangée courte, ne regardait que le milieu de la marque.
  Renforcé : cinq points, la taille, et dans l'écran.

**La recette `test:saves:unkept` contrôle maintenant la marque sur les quatre autres pages**
(dans la rangée de l'en-tête, dans l'écran, à portée du doigt), et sur la page Missions d'un
petit téléphone, où la rangée est la plus courte (dans la rangée, dans l'écran, au-dessus de
son voisin en cinq points). Vérifié par trois essais : la recette
échoue sur la version d'avant la correction ; elle échoue sur une version où la marque part
avant la roue ; elle passe sur celle-ci.

## Comment c'est vérifié

Tout a été joué sur la machine avant de pousser (méthode du parent du 24 novembre) : la CI
confirme.

- **Le balayage du relecteur, rejoué en entier sur la version finale, tête contre `main`,
  14 466 cas** : six pages (Missions, Favoris, Aventure classique, « Pour les parents », le
  voyage en cours, La Grande Expédition), français et anglais, barres de téléphone
  comprises. **Aucun défaut nouveau dans ce balayage** (il ne joue pas l'état « partie non
  gardée », voir plus haut).
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
  - **Fenêtres debout, 936 cas** : 68 recouvrements corrigés ; ceux qui restent sont les
    mêmes que sur `main`, ou plus petits.
  - **Un nouveau joueur, sans sauvegarde, 2 910 cas** (téléphones, ordinateurs, fenêtres
    debout).
- **Captures regardées une à une** : Missions à sept tailles en français et en anglais, avec
  les barres d'un téléphone (30/48/24/48) à 780 × 360 ; les autres pages à 780 × 360 et
  1280 × 800.
- **Recettes** : toutes celles de la CI, vertes ; la liste est en fin de document.

## Ce qui n'est pas vérifié, et ce qui reste

- **Rien sur un vrai téléphone, rien avec les enfants.** L'APK de test v14 est à essayer.
- Aucun vrai WebView 108, aucun Safari : le défaut de la phrase « C'est réparé » sur un vieux
  WebView était une simulation, sa correction aussi.
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
- **Rangée trop courte même pour la roue** (Missions sur un très petit téléphone à grosses
  barres, moins de 500 px de place environ ; fenêtre debout étroite ; La Grande Expédition
  debout) : la roue recouvre le bord de son voisin, jusqu'à 43 px des 203 px de « Reprendre
  ma mission ». Sur `main` c'est le voisin qui recouvrait la roue.
- **Quand la partie n'est pas gardée** (état rare) :
  - sur un écran couché à rangée courte, la roue s'en va pour laisser la marque (124 états
    sur 1 314 en français, 64 en anglais : page Missions sur petit téléphone, expédition) :
    les réglages restent sur le premier écran. Sur `main`, dans le même balayage, elle
    passait sous la rangée dans 177 états (118 en anglais). Au clavier, la roue coupée garde
    son arrêt de tabulation, sans rien de visible ;
  - sur la page Missions d'un petit téléphone, la marque recouvre une partie de « Reprendre
    ma mission » (jusqu'à 111 px sur 203 avec de grosses barres) : le bouton garde le reste.
- Sur un petit téléphone, l'anneau du clavier de la roue est coupé en haut par le bord de
  l'écran (la roue est remontée de 4 px). Un téléphone n'a pas de clavier.
- Un navigateur sans « clip » (Safari avant 16) coupe l'en-tête des deux côtés : une pièce
  qui déborde sur son voisin y est coupée, et le focus du clavier sur une roue coupée fait
  défiler l'en-tête.
- Une tablette tenue debout sur le site a les tailles d'une fenêtre debout (plaque et noms
  des missions plus petits). L'application est verrouillée en paysage.
- Noms sous la pastille en paysage à 568 px avec de grosses barres (« Les premières
  coquilles », « Le carrefour des fougères »), comme sur `main`.
- Défaut plus ancien, vu par le troisième relecteur, pas touché : la phrase « C'est réparé »
  se pose sur les boutons du haut des pages le temps qu'elle s'affiche.
- La fenêtre de préparation d'une mission, l'expédition, Favoris et « Pour les parents » ne
  sont pas touchés par ce lot, sauf par l'en-tête commun et la place de la version.
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

Puis la CI de la demande de fusion. La quatrième relecture indépendante a rendu son verdict
sur cette version : rien de bloquant.
