# Accueil « la clairière » — pièces du 24 novembre 2026

Fichiers servis : `src/assets/home/clairiere-*.webp`, construits par
`python3 scripts/build-home-scene.py` (Pillow seul). Originaux allégés des pièces modelées :
`resources/home-clay/` (WebP qualité 92, fond transparent, 280 Ko en tout ; les PNG de
Magnific, 2,5 à 3 Mo chacun, restent dans le compte du créateur).

Décision du parent le 24 novembre 2026 ([décisions](../../../docs/DECISIONS-2026-11-24.md)) :
la maquette D est retenue, et jusqu'à 1 500 crédits Magnific, essais compris, pour le logo en
lettres de pâte, le bouton « Jouer », l'engrenage et l'étoile. **Dépensé : 537 crédits** (sept
images à 75, quatre détourages à 3).

## Pièces modelées

Compte Magnific Premium du créateur, projet Personal. Modèle Nano Banana Pro
(`images_generate`, `mode: imagen-nano-banana-2`, 2k), 75 crédits l'image ; détourage
`images_remove_background`, 3 crédits. Références de style, lues depuis le dépôt public :
l'image clé `docs/resources-2026-11/assets/icone-source.png` (direction artistique du projet)
et la planche `src/assets/illustrated/interface-craft.webp`.

| Pièce                     | Fichier d'origine allégé | Création retenue                                               | Détourage  |
| ------------------------- | ------------------------ | -------------------------------------------------------------- | ---------- |
| Logo français             | `logo-fr.webp`           | [w4fjq6I7EI](https://www.magnific.com/app/creation/w4fjq6I7EI) | VXJzinAMMU |
| Logo anglais              | `logo-en.webp`           | [tCZdQkAmZJ](https://www.magnific.com/app/creation/tCZdQkAmZJ) | bxDElAs5Y2 |
| Bouton « Jouer » (vide)   | `bouton.webp`            | [O6ulKzeynm](https://www.magnific.com/app/creation/O6ulKzeynm) | 1lXFvbtr4r |
| Engrenage et étoile       | `roue.webp`, `etoile.webp` | [xSoqa3gjfW](https://www.magnific.com/app/creation/xSoqa3gjfW) | Td7G6cEVNR |

Écartées :

- 4RHUr2s9Aa, autre variante du logo français : lettres justes, mais posées sur une seule
  grande plaque verte, qui se lisait comme une étiquette.
- 1lXFhy5r4r, autre variante du bouton : une bande noire sous le bouton.
- p8PcIVEehw, premier logo anglais : il avait pour référence le logo français et en a repris
  les lettres (« ASerpck »). Refait avec l'image clé pour seule référence.

Consignes (en anglais, en prose) : un objet photographié, modelé en pâte à modeler, dans le
style, les matières et la lumière de l'image clé ; lettres épaisses et rondes avec des traces
de doigts, crème pour la première ligne et miel pour la seconde, sur une couche de pâte vert
foncé qui fait un contour ; les mots entre guillemets droits, à écrire tels quels ; l'objet
seul, de face, sur un fond gris clair uni, sans ombre portée. Le bouton est demandé vide : ses
mots (« Jouer », « Reprendre », « Jouer un caprice », et leur anglais) sont écrits par le jeu.

Le détourage du logo français avait gardé un reste de l'image de référence sous le logo : il
est coupé à la main (rien sous la dernière ligne de lettres). Aucune autre retouche.

## Images dérivées, sans génération

- `clairiere-decor.webp` : `ground-clearing.webp`, le terrain d'une mission, flou gaussien de
  1,25 px, couleur × 0,84, contraste × 0,87, luminosité × 0,93 (la « dose légère » choisie par
  le parent pour que ce qui se touche passe devant le décor), 1440 × 810, qualité 74.
- `clairiere-antre.webp`, `clairiere-pont.webp`, `clairiere-chateau.webp` : un décor et son
  personnage découpés dans les planches du jeu (`strongholds`, `serpents-family`,
  `terrain-props`, `allies-dinosaurs`, `allies-front`), posés sur une ombre dessinée.
- `clairiere-plaque.webp`, `clairiere-parchemin.webp` : la plaque peinte et le parchemin de
  `interface-craft`.

## Ce qui n'est pas fait

- Pas d'état « appuyé » modelé pour le bouton : le jeu le décale de quelques pixels.
- Les trois plaques des lieux sont la même pièce.
