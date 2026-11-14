# Images du voyage — provenance

Produites le 14 novembre 2026 pour les écrans de « Le voyage ». **Aucune image n'a été
générée et aucun crédit n'a été dépensé** : les six fichiers sont découpés dans des planches
déjà présentes dans le dépôt (`src/assets/illustrated/`), par
`scripts/build-home-scene.py` (Pillow seul, hors build). Relancer le script les refait à
l'identique.

| Fichier (`src/assets/home/`) | Planche d'origine          | Case | Taille    | Usage                                      |
| ---------------------------- | -------------------------- | ---- | --------- | ------------------------------------------ |
| `voyage-panneau.webp`        | `interface-craft.webp`     | 0    | 176 × 93  | Bouton de l'accueil, titre des écrans      |
| `voyage-antre.webp`          | `strongholds.webp`         | 1    | 128 × 128 | Antres des petites cartes des arrêts       |
| `voyage-miel.webp`           | `miels-parapluie.webp`     | 2    | 192 × 192 | Bonus « La grande réserve de miel »        |
| `voyage-bouclier.webp`       | `allies-front.webp`        | 2    | 192 × 192 | Bonus « Un gardien arrive »                |
| `voyage-ninja.webp`          | `allies-support.webp`      | 3    | 192 × 192 | Bonus « Un éclair en renfort »             |
| `voyage-raptor.webp`         | `allies-dinosaurs.webp`    | 0    | 192 × 192 | Bonus « Un ami à griffes »                 |

La provenance de chaque planche d'origine est dans `PROVENANCE.md` et
`PROVENANCE-RESTYLE-2026-11.md`. Les écrans du voyage réutilisent aussi, sans les modifier,
des images déjà dérivées pour l'accueil : `menu-classique.webp` (le roi à trois têtes),
`onglet-reperage.webp` (la tête de serpent des antres), `mission-refuge.webp` (le refuge des
petites cartes et le bonus « La garde du cristal »), et les autocollants des caprices
(`src/assets/caprices/`, `PROVENANCE-VIGNETTES-2026-11.md`). Les trois pièces du bonus « La
bourse des aventuriers » sont dessinées par la feuille de style.

Ces petites images évitent de charger les grandes planches des alliés (350 Ko chacune) pour
afficher une carte de bonus ou le sac de voyage depuis l'accueil.

## Ce qui n'a pas été vérifié

- Les images n'ont été regardées que sur des captures d'écran faites par Chromium, pas sur un
  vrai téléphone.
- Rien n'a été montré aux enfants.
