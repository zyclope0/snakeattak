# Lisibilité des trois ponts — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Une mission pilote lisible et cohérente avec le monde miniature du jeu.

**Architecture:** Rendu Phaser uniquement, moteur et sauvegardes inchangés. Une composition visuelle déterministe consomme le terrain et la graine de mission sans avancer le générateur de combat. Les autres missions conservent leur présentation.

**Tech Stack:** Phaser 3.90, TypeScript, Vite, Magnific Nano Banana 2.1, Capacitor 8.6.

**Spec:** PDF utilisateur « Serpent Defender — brief de refonte », lot 1, et périmètre approuvé dans la conversation du 7 novembre : placement libre conservé.

## Global Constraints

- Trois voies interconnectées, IA autonome et règles du fils préservées.
- Aucun changement aux déplacements, dégâts, budgets, soins, vagues et sauvegardes.
- Mission `trois-ponts` uniquement; les trois dispositions de cette mission sont concernées.
- Pas de dépendance réseau pendant le jeu; assets locaux; WebGL et Canvas.
- Format des sauvegardes 6 conservé et anciens imports lisibles.

## Review Focus

- Disposition 0/1/2 : les props ne doivent pas masquer les chemins ni changer les collisions.
- Passage classique → mission → classique : le cache et les bâtiments doivent retrouver le bon style.
- Même graine et sauvegarde restaurée : décor stable sans modifier le RNG de combat.
- Tactile, mouvement réduit, Canvas et restauration WebGL : la carte reste lisible.
- Bord de carte et zones de pose : aucun bâtiment coupé ni nouvel emplacement obligatoire.

### Task 1: Référence et composition pure

**Files:** Create `src/render/stageLayout.ts`, `tests/stage-layout-023.test.ts`, `tests/stage-023-harness.ts`, `scripts/stage-023-browser.mjs`.
**Interfaces:** `isRefinedStage(mission)`, `stageComposition(level, seed)` retournant ponts et décor visuel; aucun objet Phaser ni mutation du jeu.

- [x] Capturer avant les trois variantes avec un scénario fixe.
- [x] Test RED : trois ponts, décor à distance des routes, bornes et espacement, reproductibilité et RNG inchangé.
- [x] Implémenter composition bornée et générateur visuel indépendant.
- [x] Tests ciblés GREEN.

### Task 2: Assets et terrain

**Files:** Modify `src/art.ts`, `src/render/terrain.ts`, `src/render/BattleScene.ts`; Create `src/render/refinedTerrain.ts`, assets WebP et provenance.

- [x] Générer et inspecter fond et props, détourer les props avec Magnific.
- [x] Charger localement, dessiner un terrain sans aplat rectangulaire avec routes existantes.
- [x] Respecter les trois vrais passages et les collisions; décor fixe cuit, premier plan trié.
- [x] Vérifier les trois dispositions et le retour au style classique.

### Task 3: Acteurs, fort et indications

**Files:** Modify `src/render/actors.ts`, `src/render/strongholds.ts`, `src/ui/controls.ts`, `src/ui/expeditions.ts`; actor shadows module if appropriate.

- [x] Ombres au sol, contour allié/enemi lisible, bâtiments cadrés et antres variés.
- [x] Retirer texte du terrain et doublons de titre uniquement sur la mission pilote.
- [x] Garder les suggestions et le placement libre, améliorer leur halo.

### Task 4: Livraison vérifiée

- [x] npm run verify; npm run test:browser; scénario navigateur dédié PC/tactile/Canvas/restauration WebGL et comparatifs avant/après.
- [x] Contrôle hash des modules de règles par rapport à 0.22; imports de sauvegardes et tests missions.
- [x] Synchroniser Android sans prétendre mesurer un téléphone absent.
- [x] Revue finale indépendante, corriger toute régression importante.
- [x] Produire version 0.23, rapport, captures, publier sur le site existant si vérifications vertes.
