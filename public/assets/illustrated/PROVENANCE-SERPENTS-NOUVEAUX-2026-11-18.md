# Trois nouveaux serpents — dessins du 18 novembre 2026

Fichiers : `src/assets/illustrated/serpents-nouveaux.webp` (repos) et
`serpents-nouveaux-attack.webp` (attaque), 1024×1024 px, quatre cases de 512 px (la
quatrième, vide jusqu'au soir du 18 novembre, porte le serpent sauterelle), WebP sans perte,
fond transparent. Ils remplacent les images provisoires du
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
- Attaque, un serpent par image (« la case agrandie ») : retenue pour le serpent rare
  [6AqNaOeiJO](https://www.magnific.com/app/creation/6AqNaOeiJO) (détourage w4vUoPr7EI).
  Premières attaques des grands crocs (jUBxTufLD0, détourage s78LpUol8e) et du ninja
  (aFAv9VefSh, détourage O6CJtiQynm) remplacées : leur élan était si long que, rentrés dans
  leur case, ils rapetissaient de 40 % (relecture). Écartées aussi : s78LMFnl8e, DoJML3Fpcl,
  iGb6fyJ3uK (ce dernier ajoutait deux autres serpents).
- Attaque courte (« la tête avance d'une longueur de tête »), retenues
  [rgd1fboxtc](https://www.magnific.com/app/creation/rgd1fboxtc) (grands crocs, détourage
  5jMbhH4Kxe) et [P3uyxyI42C](https://www.magnific.com/app/creation/P3uyxyI42C) (ninja,
  détourage jUBxur0LD0). Écartées : eIypATFdqL (planche entière au lieu d'un serpent),
  UPhSbgKwny (le ninja ne bouge pas).
- Assemblage : `scripts/assemble-new-snakes.py`. Repos : chaque figurine descend de 6 à 8 px
  pour poser sur la ligne de base de la planche provisoire. Attaque : chaque figurine reçoit
  autant de pâte que le repos (même nombre de pixels opaques), sans sortir de sa case, et pose
  sur la même ligne de base. Rapport attaque/repos : grands crocs 1,00 ; serpent rare 0,99 ;
  ninja 0,78 (sa case limite sa largeur). Planche de la famille des serpents : 0,85 à 0,98.

**Dépense : 1 218 crédits** (16 images × 75 = 1 200 ; 6 détourages × 3 = 18). Solde vérifié :
10 015 → 8 797.

Consignes données au générateur : jouet pour jeunes enfants, jamais effrayant ; ni sang, ni
langue ; aucune dent sauf les deux crocs arrondis des grands crocs (vérifié en grand).

## Réserves

- En attaque, le ninja garde 78 % de sa pâte : sa tête avance et la case limite sa largeur.
- En attaque, le serpent rare paraît plus épais qu'au repos (même quantité de pâte, corps
  plus ramassé).
- Petit, le ninja ressemble au mamba noir (même couleur sombre, mêmes anneaux) : son bandeau
  rouge est ce qui le distingue. À regarder avec les enfants.
- Les grands crocs ont l'air le plus « méchant » de la famille (sourcils froncés, crocs
  pointus mais arrondis au bout), et leur rouge est proche du contour rouge-orangé des
  ennemis, comme le serpent à sonnette.
- Les droits d'utilisation suivent les conditions du compte Magnific ; aucune exclusivité ou
  protection juridique n'est garantie.

## Quatrième case : le serpent sauterelle (révision 6)

Accord du parent le 18 novembre 2026 pour un dessin d'environ 300 crédits ; nom du fils gardé :
« Serpent sauterelle ». Serpent vert feuille au ventre citron, deux antennes, deux grandes
pattes de sauterelle vert foncé, deux petites ailes translucides ; il regarde vers la droite.

- Repos, dessiné seul : deux variantes, retenue
  [gOmwBHaSXO](https://www.magnific.com/app/creation/gOmwBHaSXO) (détourage u5WHzxWQLD) ;
  écartée O6E4hrDynm (presque la même, œil plus petit).
- Attaque, un bond court : retenue
  [BhNIyidoQR](https://www.magnific.com/app/creation/BhNIyidoQR) (pattes tendues, tête en
  avant ; détourage cpSVsIs0eP) ; écartée ksexVB416B (ne bouge presque pas).
- Assemblage : la figurine de repos est mise à 420 px de haut, centrée, posée sur la ligne de
  base (bas à 491) ; l'attaque a autant de pâte que le repos (0,99). Les trois autres cases
  sont identiques au pixel près.
- **Dépense : 306 crédits** (4 images × 75 ; 2 détourages × 3). Solde vérifié :
  8 797 → 8 491.
