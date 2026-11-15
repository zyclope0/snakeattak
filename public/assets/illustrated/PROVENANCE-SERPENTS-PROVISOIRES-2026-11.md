# Trois nouveaux serpents — images provisoires

Fichiers : `src/assets/illustrated/serpents-nouveaux.webp` et `serpents-nouveaux-attack.webp`
(1024×1024 px, quatre cases de 512 px, la quatrième vide).

Produit le 16 novembre 2026 **sans générateur d'images et sans dépense** : chaque case est une
case de `enemies-organic.webp` (et de sa planche d'attaque) recolorée par
`scripts/recolor-new-snakes.py`. Les dessins d'origine et leur licence sont décrits dans
`PROVENANCE-RESTYLE-2026-11.md`.

| Case | Serpent       | Case d'origine           | Recoloration |
| ---: | ------------- | ------------------------ | ------------ |
|    0 | Grands crocs  | serpent ordinaire (0)    | rouge        |
|    1 | Serpent rare  | serpent ordinaire (0)    | or pâle      |
|    2 | Serpent ninja | Vif, avec ses lunettes (1) | violet sombre |

Pour refaire les deux fichiers, à la racine du dépôt :

```bash
python3 scripts/recolor-new-snakes.py src/assets/illustrated src/assets/illustrated
```

**Ces images sont provisoires.** Les trois serpents sont des idées de l'enfant : chacun attend
son vrai dessin (grands crocs visibles, serpent rare, serpent ninja), dans la direction
artistique pâte à modeler de `GAME_DESIGN.md`. Un vrai dessin est une dépense de crédits
d'images : elle demande l'accord du parent. Le remplacer ne change aucune règle : il suffit de
redessiner les trois cases des deux planches.
