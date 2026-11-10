# Correctif interface mobile — plan

> Exécution inline avec superpowers:executing-plans ; revue indépendante finale.

**Goal:** commandes séparées des barres système et renforts sans masquer les voies.
**Architecture:** CSS consomme les marges déjà fournies par Capacitor ; panneau
non modal dans la grille existante, ResizeObserver du plateau conservé.
**Tech Stack:** Capacitor 8.6, Phaser 3, TypeScript, Vite, Playwright.
**Spec:** docs/INTERFACE-ANDROID-0.30.1.md ; mandat autonome du parent, gameplay validé.

## Contraintes et revue

- Aucun changement de règles, RNG, sauvegardes, prix, pause de combat ou dépendances.
- Deux sources de marges combinées par maximum, jamais additionnées.
- Anciennes WebViews avec padding natif : variables à zéro, pas de double marge.
- Les rotations et injections tardives de marges doivent recalculer le canvas.
- Renforts ouverts : trois voies visibles, cibles de 48 px, autres outils accessibles.
- Plateau fermé >= 85 % de hauteur utile à 812×375 ; bureau et portrait préservés.

### 1. Marges du téléphone

- [x] Test navigateur RED : commandes et dialogues hors marges simulées.
- [x] CSS de surface utile et marges fixes ; SystemBars configuré explicitement.
- [x] GREEN, test classique et build ; commit.

### 2. Catalogue compact

- [x] RED : panneau sans intersection avec canvas, taille bornée, sélection ferme,
      fermeture redonne la taille initiale, combat sans pause implicite.
- [x] Grille mobile et cartes compactes ; ordre catalogue avant outils ; navigation
      clavier non modale, boutons de fermeture toujours accessibles.
- [x] GREEN : navigateur et suite complète ; revue finale, corrections si nécessaires.
- [x] Version 0.30.1/code32, APK, documentation, archives, publication et reçu.

## Suivi

Ledger manuel dans .superpowers/sdd/android-interface-031/progress.md ; helpers
du skill cloud indisponibles comme fichiers locaux. Rulings conservés au bilan.

## Résultat

Recette complète et revue terminées ; défaut Important étroit corrigé avec
régressions RED→GREEN. APK normal code 32 et signature vérifiés. Marges et outils
simulés sur dix combinaisons ; retest physique du parent encore requis.
