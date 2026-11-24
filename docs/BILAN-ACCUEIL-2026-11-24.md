# Bilan — premier écran « la clairière », 24 novembre 2026

Le parent trouvait l'accueil « très IA » et mal hiérarchisé. Il a retenu la maquette D après
un conseil de trois relecteurs indépendants, puis demandé que le décor se détache de ce qui se
touche ([décisions](DECISIONS-2026-11-24.md)). Ce bilan dit ce qui est écrit dans le jeu.

## Ce qui est fait

- **Le premier écran est une scène du jeu** : l'antre et King Snake à gauche (« Aventure
  classique »), le pont au milieu (« La Grande Expédition »), le château et le héros à droite
  (« Missions »). Chaque lieu est un bouton : son image et sa plaque.
- **« Jouer » est la plus grosse chose à toucher**, en bas à droite ; la phrase « Prochaine
  mission… » est juste au-dessus.
- **Le décor est calmé dans l'image** (un peu flou, moins de couleur et de contraste, bords
  assombris : la « dose légère » choisie par le parent). Les lieux, les plaques et le bouton
  gardent leurs couleurs et portent une ombre. Aucun filtre ne tourne sur le téléphone.
- **Pièces modelées avec Magnific** : le logo (français et anglais), le bouton, l'engrenage,
  l'étoile. 537 crédits dépensés sur les 1 500 accordés
  ([provenance](../public/assets/illustrated/PROVENANCE-ACCUEIL-2026-11-24.md)).
- **Quatre choses ont quitté cet écran** (décision du parent) : « Protège le cristal ! », le
  numéro de version et la ligne de sauvegarde (dans « Pour les parents »), « Ajouter un
  joueur » sous le nom (dans la fenêtre des joueurs).
- **Aucune règle du jeu ne change**, aucun bouton ne disparaît : mêmes identifiants, mêmes
  gestes. Quatre textes retirés de la page, un ajouté (« n / 18 », le compte des étoiles sur la
  plaque des missions).
- **Poids** : onze images, 331 à 341 Ko selon la langue (un seul logo est chargé) ; les cinq
  images de l'ancien accueil (123 Ko) sont retirées. Paquet du jeu : 196 237 octets sur
  200 000.

## Ce que les relecteurs indépendants ont trouvé, et ce qui a été corrigé

Deux relecteurs ont mesuré le premier jet dans Chromium. Corrigé avant la demande de fusion :

- des lieux qui se touchaient ou passaient sous les barres du téléphone (encoche, gestes) ;
- des images qui prenaient l'appui du bouton voisin ;
- le joueur sous 48 px sur un petit écran, un surnom coupé ;
- les étoiles de la plaque trop pâles (3,4:1) ;
- le numéro de version invisible sur téléphone : il se lit maintenant dans « Pour les
  parents », à la fin de la ligne de sauvegarde.

## Comment c'est vérifié

- **Mesure dans Chromium, 27 cas** : trois états (nouveau joueur, habitué avec partie en
  cours, anglais) × neuf tailles (568×320, 780×360, 812×375, 1280×800, 800×1200, 700×800, et
  trois tailles avec les marges d'un vrai téléphone). À chaque cas : aucune cible sous 48 px,
  rien hors de l'écran, aucun texte de bouton sous 13 px, aucun défilement, aucun appui volé
  par une image (cinq points par bouton), aucune cible à moins de 6 px d'une autre.
- **Recettes mises à jour** pour le nouvel écran : `test:mobile-menus` (un fichier de contrôles
  de plus, `scripts/mobile-home-clearing-checks.mjs`), `test:mission-journey`, `test:journey`,
  `test:offline`, `test:discovery`.
- `npm run verify` et la CI complète de la demande de fusion.

## Ce qui n'est pas vérifié

- **Rien sur un vrai téléphone** : la taille réelle des lieux sous le pouce, la lisibilité au
  soleil, le poids des images sur un vieux téléphone. Un APK de test suit la fusion.
- **Rien avec les enfants** : on ne sait pas s'ils comprennent que les trois lieux se touchent.
- Écrans plus petits que 568×320 : non contrôlés.
- Le nom sur les plaques a un contraste de 4,7:1 : au-dessus du seuil (4,5), sans marge.
- « Missions ★ n / 18 » déborde d'un ou deux pixels sur le cadre de sa plaque à 568×320.
- L'encart publicitaire du site (éteint, grand écran seulement) n'a pas été remesuré sur le
  nouvel écran : à faire avant de l'allumer.
- Les anciennes règles de style du premier écran sont recouvertes, pas retirées : nettoyage
  dans un lot à part ([architecture](ARCHITECTURE.md)).
