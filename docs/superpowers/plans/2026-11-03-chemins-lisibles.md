# Chemins lisibles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Des routes courbes suivies par les monstres, des orientations correctes et des combats plus lisibles.
**Architecture:** Géométrie de route pure partagée par moteur et terrain ; métadonnées d'orientation et présentation séparées du combat.
**Tech Stack:** TypeScript, Phaser, tests Node et Playwright existants.
**Spec:** docs/superpowers/specs/2026-11-03-chemins-lisibles-design.md

## Global Constraints

Trois voies, deux jonctions, obstacles autoritaires, aucune API de jeu, sauvegardes compatibles, pas de dépense graphique.

## Review Focus

- Chaque variante et le roi regardent leur cible en attaque.
- Les trois cartes restent traversables même aux rochers et aux jonctions.
- Les œufs et une ancienne position rejoignent le chemin sans téléportation.
- Les déplacements restent déterministes et se figent en pause.
- Le terrain conserve son cache et sa restauration GPU.

### Task 1: Orientation

- [x] Écrire et observer un test rouge : serpent attaquant à sa gauche doit regarder à gauche.
- [x] Corriger facing en attaque et décrire le sens d'origine de chaque atlas.
- [x] Vérifier le test et les types ; inspecter les figurines dans Chromium.

### Task 2: Routes partagées

- [x] Écrire et observer des tests rouges de trajet courbe, continuité et collisions des routes.
- [x] Ajouter src/routes.ts : lanePoint, junctionPoint, roadLeg, laneRoad et junctionRoad, sans Phaser.
- [x] Adapter followRoute à ces points et au déplacement continu sur le sentier ; conserver les décisions de jonction.
- [x] Remplacer les rectangles par des chemins courbes avec pavés irréguliers et bordures.
- [x] Exécuter tests natifs, traversées et campagnes.

### Task 3: Lisibilité et livraison

- [x] Réduire les miniatures, masquer les barres pleines hors réaction, espacer modérément les alliés et les traces de marche.
- [x] Vérifier captures des trois cartes, scènes serrées et restauration GPU.
- [x] Exécuter verify, navigateur, portable, puis revue indépendante.
- [x] Livrer ZIP et aperçu HTTPS vérifiés, consigner résultats et limites.

## Progression

Snapshot antérieur : /workspace/conquete-serpents-baseline-0.11. Pas de dépôt Git dans cette archive ; sauvegarde locale utilisée à la place d'un worktree.

### Journal d'exécution

Les tâches 1 et 2 sont terminées. Les tests d'orientation, courbe, distance alliée et
couverture du front ont été observés rouges puis verts. La première augmentation
de séparation portait un duel final isolé à 145 s : le tireur plafonné à 48 px restait
hors portée. Son approche vers le front retenu corrige la cause ; le test de campagne
conserve sa limite de 120 s, sans relever le délai pour masquer le problème.

Revue indépendante en lecture seule : deux Important, aucun Critical. Les deux
régressions supplémentaires ont été observées rouges puis corrigées : jonction d'une
position hors sentier près des rochers, orientation contre un soigneur dépassé.
Suite complète après correction : 99/99. Aucun Minor différé.
Le réviseur n'a pas vérifié l'apparence/GPU ; ces points ont été contrôlés directement
avec les captures Chromium et test:render, restauration WebGL comprise.

Livraison : verify, navigateur HTTP et portable, scènes et restauration GPU contrôlés.
100 campagnes finales : 84 victoires/16 défaites, aucun blocage. Aucun fichier source
n'a été supprimé ; archive sans Git conservée et livrée sous forme de ZIP vérifiés.
