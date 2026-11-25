# Bilan — les menus à l'allure du premier écran, lot 9 : la fin d'une partie et la pause (25 novembre 2026)

Fait seul, la nuit, à la demande du parent (« avance en autonomie sans prendre de décision
risquée »). Rien que dans la règle des menus : le trait, l'ombre, les couleurs ; aucune
taille, aucune place, aucun texte. Lots précédents : [8](BILAN-MENUS-LOT-8-2026-11-25.md).

## Ce qui est fait

- **La fin d'une partie** (mission gagnée ou perdue, dernière mission, aventure classique,
  aventure sans fin, caprice réussi ou raté, étape d'expédition) : le panneau du résultat
  prend le trait d'encre et l'ombre posée des fenêtres ; les boutons clairs, et « Voir mon
  carnet » après un caprice, prennent le bouton clair des menus ; l'anneau du clavier, dessiné
  sur le papier du panneau, passe de l'or (2,1:1) à l'encre (12,2:1).
- **La pause** : « Réglages » et « Accueil » en boutons clairs ; l'anneau du clavier garde
  l'or, qui se voit sur le voile sombre (environ 7:1).
- **L'action principale** (« Mission suivante », « Rejouer une aventure », « Reprendre la
  partie », « Continuer » de l'expédition) **garde son miel plat**. Je l'avais d'abord mise en
  pâte miel, comme « C'est parti ! » ; l'attaque indépendante a montré que, sur un bouton
  étroit (150 × 48 px à 1280 × 800), les lettres débordent sur le rebord du dessin étiré, et
  que les lettres claires cerclées de bois à 13 px se bouchent sur un écran d'ordinateur
  ordinaire. Retiré, en attendant le parent.
- **Les fiches des alliés** : rien à faire, elles avaient déjà l'allure des fenêtres (lot 6).

## Petits restes relevés par les relectures (lot 10, même nuit)

- **Anneau du clavier entier** sur « Conseils et outils » et « Actions du camp » dans le
  catalogue : il était coupé de 2 à 3 px par le bord du pli ; il est dessiné juste dedans
  (vérifié au clavier, capture zoomée).
- **Les deux groupes du catalogue** (les onglets, les cartes) sont annoncés comme groupes aux
  lecteurs d'écran (`role="group"`) : leur nom n'était pas lu.
- **« Autre départ »** prend le fond de ses deux voisins (il était blanc entre deux boutons
  vert pâle).

## Comment c'est vérifié

- **Boîtes** du panneau de résultat mesurées avant et après : 40 états (5 tailles, français
  et anglais, victoire et défaite, mission et aventure classique), 486 boîtes identiques ;
  l'attaque indépendante a refait la mesure sur 88 états (4 tailles, français et anglais,
  11 situations dont la pause, l'expédition, l'aventure sans fin et les caprices) : 284
  boutons et le panneau identiques. Les captures passent par le banc d'essai du résultat, à
  qui on donne toutes les feuilles du vrai jeu dans leur ordre (le banc n'en charge que deux).
- **Captures** à 780 × 360 et 1280 × 800 (dans `artifacts/`).
- Attaque indépendante et recettes de la CI sur la machine : voir la PR.

## Questions pour le parent

- La pâte miel pour l'action principale de la fin d'une partie et de la pause : seulement
  sur un bouton assez large, ou jamais ? (Elle reste plate pour l'instant.)
- Après la dernière mission ou une mission perdue, l'action en tête n'est pas en miel
  (« Rejouer avec un caprice », « Réessayer le même départ ») : la mettre en miel ?

## Ce qui n'est pas vérifié

- Rien n'a été essayé sur le vrai téléphone ni avec les enfants.
