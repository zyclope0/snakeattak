# Lot 5 — Traduction FR, EN, DE, IT (v0.32.0, ≈ 14 h)

Objectif : publier en Europe en 4 langues. Aujourd'hui tout est en français écrit en dur
(`index.html` avec `lang="fr"` et environ 285 chaînes dans 40 fichiers TS). Pok Pok est critiqué dans
ses avis pour l'absence d'allemand et d'italien.

## Tâches

1. Extraire tous les textes visibles dans `src/i18n/fr.json`, avec une fonction `t(clé, variables)`.
   Faire ce lot après le lot 2, qui réécrit beaucoup de textes.
2. Ajouter `en.json`, `de.json`, `it.json`. Marquer chaque traduction « à relire » : un humain par langue validera.
3. Langue choisie d'après `navigator.language`, modifiable dans l'accueil, mémorisée.
   Pluriels et nombres via `Intl.PluralRules` et `Intl.NumberFormat`.
4. Boutons et cartes s'élargissent sans couper le texte (l'allemand est souvent plus long).
5. `<html lang>` suit la langue choisie.

## Critères

- Un script échoue s'il reste du français en dur hors de `fr.json`.
- Captures en DE à 812×375 et 1280×800 sans texte coupé.
- Sauvegardes inchangées ; critères communs du README.

Note budget : la traduction professionnelle coûte 0,10 à 0,14 € par mot (environ 450 à 630 € pour
1 500 mots × 3 langues). Le plan prévoit une traduction par l'agent, relue par des proches.
