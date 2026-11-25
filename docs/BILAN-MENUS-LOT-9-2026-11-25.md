# Bilan — les menus à l'allure du premier écran, lot 9 : la fin d'une partie et la pause (25 novembre 2026)

Fait seul, la nuit, à la demande du parent (« avance en autonomie sans prendre de décision
risquée »). Rien que dans la règle des menus : le trait, l'ombre, les couleurs ; aucune
taille, aucune place, aucun texte. Lots précédents : [8](BILAN-MENUS-LOT-8-2026-11-25.md).

## Ce qui est fait

- **La fin d'une partie** (victoire, défaite, aventure classique, mission) : le panneau du
  résultat prend le trait d'encre et l'ombre posée des fenêtres ; son action principale
  (« Mission suivante », « Rejouer une aventure ») prend le bouton en pâte miel de « Jouer »,
  comme « C'est parti ! » et « Vague suivante » (décision du parent du 25 novembre pour le
  camp, reprise ici) ; les autres, le bouton clair des menus ; l'anneau du clavier, l'encre
  (l'or ne se voyait ni sur le papier ni sur le miel).
- **La pause** : « Reprendre la partie » en pâte miel, « Réglages » et « Accueil » en boutons
  clairs ; l'anneau du clavier garde l'or, qui se voit sur le voile sombre.
- **Les fiches des alliés** : rien à faire, elles avaient déjà l'allure des fenêtres (lot 6).

## Comment c'est vérifié

- **Boîtes** du panneau de résultat mesurées avant et après : 40 états (5 tailles, français
  et anglais, victoire et défaite, mission et aventure classique), **486 boîtes identiques**.
  Les captures passent par le banc d'essai du résultat, à qui on donne toutes les feuilles du
  vrai jeu dans leur ordre (le banc n'en charge que deux).
- **Captures** à 780 × 360 et 1280 × 800 (dans `artifacts/`).
- Attaque indépendante et recettes de la CI sur la machine : voir la PR.

## À montrer au parent

- L'action principale de la fin d'une partie et de la pause en pâte miel : reprise de sa
  décision pour le camp, sans question posée (il dormait). Une ligne à retirer dans
  `src/ui/homeSkin.css` si elle ne lui plaît pas.

## Ce qui n'est pas vérifié

- Rien n'a été essayé sur le vrai téléphone ni avec les enfants.
