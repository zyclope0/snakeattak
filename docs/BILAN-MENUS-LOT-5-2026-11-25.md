# Bilan — les menus à l'allure du premier écran, lot 5 : « Pour les parents » (25 novembre 2026)

Suite de « Continuer les menus » (parent, 25 novembre, après la publication n° 52). Lots
précédents : [1](BILAN-MENUS-2026-11-24.md), [2](BILAN-MENUS-LOT-2-2026-11-24.md),
[3](BILAN-MENUS-LOT-3-2026-11-25.md), [4](BILAN-MENUS-LOT-4-2026-11-25.md).

## Ce qui est fait

- **La page « Pour les parents » prend l'allure des pages déjà habillées**
  (`src/ui/homeSkin.css`, le bloc « Pour les parents » à la fin) :
  1. les boutons de la page (« Fiches des alliés », « Comment jouer », « Réglages »,
     « Joueurs », « Confidentialité », « Sauvegarde familiale »), posés sur le décor, ont le
     trait d'encre et l'ombre posée des boutons d'« Aventure classique » ;
  2. le code d'aventure : le champ a un trait d'encre, « Retrouver » est le bouton clair du
     voyage, et le bloc a un liseré discret ;
  3. sur le site seulement, « À propos du jeu » et « Tester sur Android » prennent un trait
     de papier sur le décor.
- **Ce qui garde son allure** : les deux « ? » d'aide, un bouton éteint, et un code faux,
  dont le champ garde son trait rouge.
- **Rien ne bouge, rien ne change de taille.** Aucune règle du jeu, aucun mot, aucune image
  nouvelle, aucun crédit dépensé.
- **Rattrapé sur une capture, avant toute mesure** : mon premier jet habillait aussi le « ? »
  du code d'aventure, qui est un bouton ; il avait pris un cadre. Il en est exclu.
- **Rattrapé par la marche au clavier** : sur un téléphone, l'ombre floue d'un bouton voisin
  mangeait un côté de l'anneau du clavier (jusqu'aux quatre cinquièmes de ce côté à
  568 × 320). Comme aux Favoris, la pièce qui porte l'anneau passe devant ses voisines.

## Comment c'est vérifié

- **Mesure boîte par boîte, tête contre la version fusionnée** : l'application à onze
  tailles de 568 × 320 à 1920 × 1080 (dont deux fenêtres debout et les barres d'un
  téléphone), et le site, en français et en anglais, au repos et avec un code faux :
  136 états, 4 092 boîtes, toutes à la même place et à la même taille ; le même défilement.
- **L'allure de chaque pièce dans chaque état** (style calculé, tête contre la version
  fusionnée), au repos, sous la souris, enfoncée, au clavier et éteinte : seules changent les
  pièces visées ; un code faux garde son trait rouge ; les « ? » ne changent pas.
- **La marche au clavier, avec la vraie touche Tab**, à six tailles (application et site) :
  sur la version corrigée, l'anneau est entier sur chaque arrêt, et les 125 arrêts gardent
  leur ordre et leur place.
- **Captures regardées** : 780 × 360 (application) et 1280 × 800 (site, avec les deux
  liens).

## Ce que la relecture indépendante a trouvé, avant la demande de fusion

Un relecteur indépendant a attaqué le premier jet, puis la correction de l'anneau. **Rien de
bloquant.** Aucune règle d'état écrasée (survol, appui, clavier, éteint, code faux), aucune
boîte qui bouge, aucune autre page touchée (les codes de la fenêtre de mission et du camp
sont identiques) ; les huit fenêtres que la page ouvre passent devant la pièce au focus.
Il a confirmé le défaut de l'anneau déjà corrigé, et trouvé deux petites choses, corrigées :

- **Ma règle des deux liens du site ne s'appliquait pas** : elle pesait moins que la règle
  de base. Alourdie ; leur trait est maintenant le trait de papier prévu.
- **Le titre de la page passait devant la marque « Partie non gardée »** dans une fenêtre
  debout de 360 × 640, quand on entrait dans la page au clavier (il reçoit alors l'anneau) :
  un coin de 19 × 7 px de la marque allait au titre. La règle de l'anneau ne vise plus que
  les boutons et le code ; le titre reste à sa place dans l'empilement.

Noté sans le changer : sur le champ du code, le trait normal (encre) est maintenant plus
foncé que le trait d'erreur (rouge). Les deux restent distincts, et la phrase d'erreur
s'affiche toujours.

## Ce qui n'est pas vérifié

- **Rien sur un vrai téléphone, rien avec les enfants ni avec un parent.** Chromium seul : ni
  WebView Android 108, ni Safari, ni Firefox.
- La souris et le doigt sont simulés ; la marche au clavier est réelle.
- La marque « Partie non gardée » a été simulée, pas obtenue par une vraie panne.
- Le bouton de la publicité du site n'est pas essayé : la publicité est coupée dans le code.
