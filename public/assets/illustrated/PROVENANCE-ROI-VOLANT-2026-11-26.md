# Le serpent volant et King Snake à trois têtes de cobra — dessins du 26 novembre 2026

Fichiers : `src/assets/illustrated/serpents-roi-volant.webp` (repos) et
`serpents-roi-volant-attack.webp` (attaque), 1024×1024 px, quatre cases de 512 px, WebP
qualité 88 comme les autres planches depuis le 24 novembre, fond transparent.

| Case | Personnage    | Dessin                                                                       |
| ---: | ------------- | ---------------------------------------------------------------------------- |
|    0 | Serpent volant | serpent bleu turquoise au ventre crème, écailles de la famille, deux ailes de chauve-souris bleues bordées de lilas |
|    1 | King Snake    | cobra royal à trois têtes, capuchons ouverts, corps bleu roi, ventre et capuchons dorés, couronne sur la tête du milieu |
|  2–3 | (vides)       |                                                                              |

Demandes du fils (idées du 15 novembre, `GAME_DESIGN.md`) : « un plus beau dessin pour les
serpents volants » ; « le boss est un cobra royal à trois têtes ». Le parent, le 26 novembre :
plafond de 1 500 crédits, « il doit avoir trois têtes […] de cobra », puis le choix des deux
dessins (B et B, une question à la fois).

Avant, le serpent volant reprenait le serpent vert ordinaire (`enemies-organic`, case 0) avec
des ailes crème tracées par le code ; King Snake était un serpent bleu à trois têtes sans
capuchon (`serpents-family`, case 3). Les ailes tracées sont retirées : elles sont dans le dessin.
L'ombre au sol du serpent volant reste.

## Comment

Compte Magnific Premium du créateur, projet Personal. Modèle Nano Banana Pro
(`images_generate`, `mode: imagen-nano-banana-2`, 1:1), 75 crédits l'image ; détourage
`images_remove_background`, 3 crédits. Références : les planches `serpents-family` (pour King
Snake) et `enemies-organic` (pour le serpent volant), lues depuis le dépôt public.

- Repos, deux variantes chacun. King Snake : retenu
  [Lwtt8QPswO](https://www.magnific.com/app/creation/Lwtt8QPswO) (capuchons ouverts, les trois
  têtes regardent vers la droite) ; écarté xS88BCWjfW (la tête de gauche regarde à gauche).
  Serpent volant : retenu [fHYYzI0CDY](https://www.magnific.com/app/creation/fHYYzI0CDY)
  (écailles et ventre de la famille) ; écarté gOvvm1ISXO (corps lisse).
- Attaque, à partir du dessin retenu, deux variantes chacun. King Snake : retenu
  [lJhhrGSgv9](https://www.magnific.com/app/creation/lJhhrGSgv9), écarté iGkkPda3uK. Serpent
  volant : retenu [rgoobAXxtc](https://www.magnific.com/app/creation/rgoobAXxtc), écarté
  WDUUAu6cXe. Bouches ouvertes, sans dent ni langue (vérifié en grand).
- Détourages : fHYYmGqCDY, xS88KBrjfW, xS88KIWjfW, eI99ViwdqL.
- Assemblage : `scripts/assemble-king-flyer.py`. Au repos, King Snake prend la largeur et la
  ligne de base de l'ancien roi ; le serpent volant la ligne de base du serpent vert qu'il
  empruntait : les ancres du plateau ne bougent pas. En attaque, chacun garde autant de pâte
  qu'au repos (rapport 1,00 pour les deux).
- Accueil : `scripts/build-home-scene.py` découpe King Snake dans la nouvelle planche pour le
  bouton « Aventure classique » (`menu-classique.webp`) et l'antre du premier écran
  (`clairiere-antre.webp`). Les autres images de l'accueil ne changent pas.

**Dépense : 612 crédits** (8 images × 75 = 600 ; 4 détourages × 3 = 12). Solde vérifié :
7 648 → 7 036.

Consignes données au générateur : jouet pour jeunes enfants, jamais effrayant ; ni dent, ni
langue, ni sang ; fond blanc uni, aucun texte.

## Réserves

- Le serpent volant a moins de pâte que le serpent vert (81 000 pixels opaques contre 100 000) :
  ses ailes prennent la largeur de la case. Il paraît un peu plus petit sur le plateau.
- En attaque, les têtes de King Snake avancent peu : on voit surtout les bouches ouvertes.
- Rien n'a été montré au fils ni vu sur le vrai téléphone.
