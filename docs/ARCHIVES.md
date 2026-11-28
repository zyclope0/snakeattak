# Archives sorties du suivi Git — 11 novembre 2026

Les captures et les gros rapports ne sont plus suivis sur `main`. Rien n'est perdu : tout reste
dans l'historique Git, au commit `88fdf54` (version 0.37.0 publiée). L'historique n'a pas été
réécrit.

| Mesure          | Avant (`88fdf54`) | Après    |
| --------------- | ----------------- | -------- |
| Fichiers suivis | 6 741             | 1 568    |
| Taille suivie   | 671,7 Mo          | 103,1 Mo |

## Ce qui a été retiré

| Famille                                                            | Fichiers | Taille   |
| ------------------------------------------------------------------ | -------- | -------- |
| `reports/balance-0.16` à `reports/balance-0.19` (dossiers entiers) | 4 739    | 188,9 Mo |
| JSON de plus de 256 Kio dans `reports/`                            | 52       | 213,7 Mo |
| Images de `docs/captures-*`                                        | 205      | 132,0 Mo |
| Images de `reports/`                                               | 177      | 33,9 Mo  |

Gardés : `docs/captures-0.32.4/rounded-square.png` (cité par `GAME_DESIGN.md`),
`docs/resources-2026-11/`, `docs/publication/`, les sources d'images (`docs/art-sources-*`),
les petits rapports et tous les documents Markdown.

## Retrouver un fichier

```sh
git ls-tree -r --name-only 88fdf54 -- reports docs   # liste complète
git restore --source=88fdf54 -- reports/balance-0.19 # un dossier ou un fichier
```

Un fichier restauré réapparaît comme « non suivi » : ne le recommite pas.

## Conséquences

- 83 liens vers des captures sont cassés dans 19 documents historiques (anciens bilans, et les
  trois images de `AUDIT-VISUEL-MOBILE-2026-11-10.md`). Le texte reste lisible.
- Six anciens scripts de rapport (`report-adventure-019.mjs`, `report-rewards-017.py`,
  `plot-balance-016.py`, `report-campaign-018.py`, `control-020.mjs`, `report-balance-016.py`)
  lisaient les dossiers `balance-0.16` à `0.19`. Ils ont été retirés à leur tour le 15
  novembre 2026, avec 21 autres scripts que plus rien n'appelait : `git log -- scripts/<nom>`
  les retrouve.
- Aucun test ni aucune recette de la CI ne lit un fichier retiré.
- Les clones existants gardent leur taille : seul un clone neuf ou superficiel est plus léger.
  Réduire l'historique lui-même demanderait une réécriture, qui attend l'accord du parent.

## Deuxième passage — 28 novembre 2026

Les 836 rapports encore suivis dans `reports/` (8,4 Mo : suivis de versions, journaux, copies
de sources pour l'équilibrage, petits JSON) sortent à leur tour du suivi. Ils restent dans
l'historique, au commit `63e89bb` :

```sh
git ls-tree -r --name-only 63e89bb -- reports       # liste complète
git restore --source=63e89bb -- reports/suivi-0.36.0 # un dossier ou un fichier
```

- Gardés, parce qu'un document vivant les cite : `android-device.json`,
  `deployment-0.36.2.json`, `store-preparation.json`, `store-preparation-verification.json`,
  `verification-0.21.json`, `verification-0.27.1.json`, `verification-0.30.1.json`.
- `stage-023-before.json`, que la recette `test:stage` compare au rendu, devient
  `tests/fixtures/stage-023-before.json`.
- `reports/` est maintenant ignoré par Git : un script qui y écrit encore n'ajoute rien au
  dépôt. Aucun test ni aucune recette de la CI ne lit un fichier retiré.
- Des liens vers ces rapports cassent dans les documents historiques (`docs/archive/`,
  `docs/audit-source-2026-11/`) ; le texte reste lisible.

## Règle pour la suite

Les recettes navigateur écrivent leurs rapports et leurs captures dans `artifacts/`, ignoré par
Git. Une preuve qui doit rester se résume en quelques lignes dans le bilan de la version.
