# Trois nouveaux serpents — dessins du 18 novembre 2026

Fichiers : `src/assets/illustrated/serpents-nouveaux.webp` (repos) et
`serpents-nouveaux-attack.webp` (attaque), 1024×1024 px, quatre cases de 512 px, la
quatrième vide, WebP sans perte, fond transparent. Ils remplacent les images provisoires du
16 novembre (`PROVENANCE-SERPENTS-PROVISOIRES-2026-11.md`).

Décision du parent le 18 novembre 2026 : budget libre pour dessiner les trois serpents du
fils. Noms du fils, gardés tels quels : « Grands crocs », « Serpent rare », « Serpent ninja ».

| Case | Serpent       | Dessin                                                                     |
| ---: | ------------- | -------------------------------------------------------------------------- |
|    0 | Grands crocs  | serpent rouge au ventre rose crème, deux gros crocs arrondis, rien d'autre |
|    1 | Serpent rare  | petit serpent fin or pâle et ivoire, taches nacrées, petite pierre au front |
|    2 | Serpent ninja | serpent violet foncé, masque rouge sur les yeux, bandeau rouge à rubans    |

Les trois regardent vers la droite, comme la famille des serpents ; le jeu les retourne
quand ils marchent vers la gauche (`render/actorLayout.ts`).

## Comment

Compte Magnific Premium du créateur, projet Personal. Modèle Nano Banana Pro
(`images_generate`, `mode: imagen-nano-banana-2`, 1:1), 75 crédits l'image ; détourage
`images_remove_background`, 3 crédits. Références : la planche `serpents-family` (style
pâte à modeler) et la planche provisoire (place et couleurs), lues depuis le dépôt public.

- Repos : deux variantes, retenue [Cqzf476EEy](https://www.magnific.com/app/creation/Cqzf476EEy)
  (masque rouge plus lisible que le masque noir de nVLzFaZYQD). Détourage tC3IPvbmZJ.
- Attaque, planche entière : deux essais de deux variantes (cpgW5t70eP, Lwoj06yswO,
  SymgpJBUb8, p8ODLotehw) ÉCARTÉS : le ninja ne bougeait pas, et dans le meilleur la tête des
  grands crocs sortait de sa case.
- Attaque, un serpent par image (« la case agrandie ») : retenues
  [jUBxTufLD0](https://www.magnific.com/app/creation/jUBxTufLD0) (grands crocs, détourage
  s78LpUol8e), [6AqNaOeiJO](https://www.magnific.com/app/creation/6AqNaOeiJO) (serpent rare,
  détourage w4vUoPr7EI), [aFAv9VefSh](https://www.magnific.com/app/creation/aFAv9VefSh)
  (ninja, détourage O6CJtiQynm). Écartées : s78LMFnl8e, DoJML3Fpcl, iGb6fyJ3uK (ce dernier
  ajoutait deux autres serpents).
- Assemblage : `scripts/assemble-new-snakes.py`. Repos : chaque figurine descend de 6 à 8 px
  pour poser sur la ligne de base de la planche provisoire. Attaque : chaque figurine est
  agrandie autant que sa case le permet sans dépasser la hauteur du repos, posée sur la même
  ligne de base.

**Dépense : 912 crédits** (12 images × 75 = 900 ; 4 détourages × 3 = 12). Solde vérifié :
10 015 → 9 103.

Consignes données au générateur : jouet pour jeunes enfants, jamais effrayant ; ni sang, ni
langue ; aucune dent sauf les deux crocs arrondis des grands crocs (vérifié en grand).

## Réserves

- En attaque, les grands crocs et le ninja sont un peu plus petits qu'au repos : leur élan
  est long et la case limite leur largeur.
- En attaque, le serpent rare paraît plus épais qu'au repos.
- Les droits d'utilisation suivent les conditions du compte Magnific ; aucune exclusivité ou
  protection juridique n'est garantie.
