# Bandages, volants et roi Implementation Plan

> Exécution autonome autorisée ; modèles indépendants délégués, intégration et revue par le principal.

**Goal:** Réaliser les trois demandes du fils en conservant un jeu familial équilibré.
**Architecture:** Modèles purs pour stocks, vol et têtes ; Game coordonne ; sauvegarde versionnée ; rendu lit l'état réel.
**Tech Stack:** TypeScript strict, Phaser 3, Vite, Node 24, Playwright, Capacitor 8.
**Spec:** docs/superpowers/specs/2026-11-07-bandages-volants-roi-design.md

## Global Constraints

Alliés autonomes, trois voies, œufs aléatoires, poison à impact unique, réactions
cobra2/mamba3, pas de résurrection, classique et six missions conservés.

## Review Focus

- Sauvegarder ne rend ni bandage ni tête morte.
- Retour des soignants au fort légal, sans téléportation ou recharge à distance.
- Volants introduits après contres accessibles ; mêlée ne les bloque pas.
- Garde/soigneur ne rend pas le boss invincible ; pause fige tous les délais.
- Ancien camp/fichier familial/mode classique restent lisibles.

### Task 1 — Soins finis

- [x] RED sur stock, cadence, recharge au fort et paramètres invalides.
- [x] Modèle healing et descriptions, intégration Game et checkpointv6.
- [x] Tests migration, pause, retour et invariants ; conseil.

### Task 2 — Volants

- [x] RED sur rang 6, maximum par vague, cible et contre.
- [x] Catalogue, sélection déterministe, comportement et signaux visibles.
- [x] Vérifier trois voies, missions et mouvements réduits ; conseil.

### Task 3 — Roi et escorte

- [x] RED sur têtes distinctes, dégâts, soins sans résurrection et escorte finie.
- [x] Modèle des têtes, garde et soigneur, intégration moteur et télégraphes.
- [x] Vérifier mort/coups, protection, conditions de fin et représentation ; conseil.

### Task 4 — Équilibre et livraison

- [x] Comparaisons témoin/nouveau, réglage justifié et cohorte indépendante.
- [x] Revue fraîche et corrections reproduites.
- [x] Suite native, builds, parcours web/portable et tactiles, rendu et syncAndroid.
- [x] Publication privée exacte et archives/liens vérifiés.
