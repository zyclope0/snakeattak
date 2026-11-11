# Performance du rendu — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Réduire les allocations et disposer de mesures reproductibles sans altérer le jeu validé.

**Architecture:** Pool borné de vues Phaser, indépendant des entités de règles. Terrain précalculé conservé, effets déjà dessinés dans des couches Graphics partagées. Préférence visuelle locale et compteur de développement séparés de la sauvegarde de partie.

**Tech Stack:** Phaser 3.90, TypeScript, Vite, Playwright/Chromium, Capacitor 8.6.

**Spec:** docs/brief-refonte.md, lot 2; utilisateur valide la 0.23 et demande de poursuivre les points suivants en autonomie.

## Global Constraints

- Règles, IA, unités, prix et sauvegardes inchangés.
- Conserver exactement les assets et la carte pilote validés.
- Aucun nouveau serveur, service payant ni génération nécessaire à ce lot.
- Respecter le repli Canvas et les mouvements réduits du système.
- Aucun chiffre du cloud présenté comme une mesure de téléphone réel.
- Les nouveautés de gameplay du lot 3 restent un lot distinct.

## Review Focus

- Une image recyclée ne conserve pas le tint, la rotation ou l’alpha d’un autre acteur.
- Le stock inactif est borné, les disparus sont invisibles et les scènes libèrent leurs ressources.
- Retour menu, redémarrage et perte de contexte n’affichent ni doublons ni vues périmées.
- La préférence visuelle fonctionne sans stockage et ne change jamais le combat.
- Le compteur reste réservé au développement; pas de coût de mesure en production.

### Task 1: Mesures de référence

**Files:** Create tests/performance-024-harness.ts, scripts/performance-024-browser.mjs.

- [x] Capturer charge réaliste et charge synthétique, avant modifications : temps de mise à jour, rAF, créations/destructions, draws WebGL, mémoire indicative.
- [x] Conserver le même protocole et les mêmes graines pour l’après; stress de renouvellement d’ennemis sur plusieurs vagues.
- [x] Utiliser les compteurs pour décider si un regroupement supplémentaire des atlas est utile; ne pas l’imposer sans gain mesuré.

### Task 2: Réutilisation bornée

**Files:** Create src/render/framePool.ts, tests/frame-pool-024.test.ts; Modify src/render/actors.ts, medicalSignals.ts.
**Interfaces:** FramePool<K,V> avec beginFrame, acquire(key), endFrame, clear et stats; callbacks create/activate/deactivate/destroy, capacité inactive 384 images et 16 textes.

- [x] Tests RED sur réutilisation, absence de fantôme, borne inactive, nettoyage, mêmes clefs actives, préservation des callbacks.
- [x] GREEN : pool pur puis intégration aux images et étiquettes médicales; remise à zéro complète des transformations au recyclage.
- [x] Vérifier égalité pixel à état identique, stabilité après renouvellement, Canvas et contexte restauré.

### Task 3: Confort et mesure locale

**Files:** Create src/render/visualSettings.ts, src/ui/visualSettings.ts, tests/visual-settings-024.test.ts, src/render/frameMetrics.ts, src/render/devPerformance.ts, tests/frame-metrics-024.test.ts; Modify BattleScene.ts, ui/controls.ts, index.html, style.css.

- [x] Tests RED/GREEN préférence persistante, stockage indisponible, priorité aux mouvements réduits système; contrôle dans Comment jouer.
- [x] Remplacer les lectures répétées de préférence de mouvement par une valeur effective par frame.
- [x] Compteur FPS et coût CPU visible uniquement en développement avec ?debug-performance, fenêtre de mesures bornée.
- [x] Contrôler préférence et clavier/tactile, plus absence du compteur dans le build de production.

### Task 4: Validation et livraison

- [x] Refaire les mêmes mesures après et expliquer les limites (GPU logiciel, variabilité cloud, pas de téléphone).
- [x] npm run verify, test:browser, test:stage, test:render, test:tactical et imports de sauvegardes/expéditions; export portable.
- [x] Vérifier empreintes des règles inchangées, synchroniser les assets Android.
- [x] Revue indépendante du lot complet et correction des problèmes importants.
- [x] Livrer 0.24 sur le site existant avec bilan, protocole et archives.
