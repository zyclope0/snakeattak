# Android interruptions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** empêcher une fermeture de dialogue ou une rotation de reprendre un combat interrompu.

**Architecture:** arbitre de pauses temporaires par Session dans ui/, sans modifier Game ou les codecs ; adaptateurs DOM existants conservés.

**Tech Stack:** TypeScript, Phaser 3, Vite, Node 24, Playwright, Capacitor 8.6.

**Spec:** ../specs/2026-11-08-android-interruptions-design.md

## Global Constraints

- Aucun changement aux règles, RNG et sauvegardes ; pas de dépendance ajoutée.
- Reprise explicite après interruption ; rotation simple garde son comportement.
- Ne pas présenter les simulations cloud comme tests physiques Android.
- Version 0.30.2, code Android 33, APK familial sans ?perf=1.

## Review Focus

- Dialogue et rotation imbriqués : aucun propriétaire ne reprend à la place d'un autre.
- Game remplacé : fermer une ancienne fenêtre ne reprend pas la nouvelle partie.
- Événements répétés ou démarrage caché : pause conservée, aucun temps rattrapé.
- Rotation seule : pas de pause définitivement collée sans interruption.
- Réseau coupé : le paquet Android reste autonome, le site web ne promet pas de cache hors ligne.

### Task 1 — Pause acquise et interruptions

**Files:** `src/ui/pauseState.ts`, `src/ui/lifecycle.ts`, `src/ui/orientation.ts`,
`src/ui/dialogs.ts`, `src/ui/controls.ts`, `tests/pause-state-033.test.ts`,
`scripts/interruptions-033-browser.mjs`, `tests/interruptions-033-harness.ts`.

**Interfaces:** `pauseStateFor(session)` fournit `hold(): () => void`, `interrupt(): void`,
`resume(): void`, `sync(): void` ; `bindLifecycle(session, refresh)` renvoie son nettoyage.
Les propriétaires de pause sont des acquisitions, pas des écritures dans Game.

- [x] Reproduire le défaut de rotation/arrière-plan dans le navigateur avant correctif.
- [x] Écrire et voir échouer les tests d'acquisitions imbriquées et d'interruption.
- [x] Implémenter l'arbitre minimal et brancher dialogue, rotation, reprise et cycle de page.
- [x] Vérifier les tests ciblés, événements répétés, Game remplacé et nettoyage.
- [x] Vérifier dans le navigateur le temps figé, les deux ordres dialogue/rotation,
      la reprise explicite et la rotation simple aux trois tailles cibles.
- [x] Vérifier hors ligne les fichiers du paquet embarqué et la reprise du dernier camp.
- [x] Passer version, documenter état réel du lot 4 et prochaine étape application (lot 5).
- [x] `npm run verify`, `npm run test:browser`, `npm run test:mobile` verts ; APK compilé.
- [ ] Commit, revue finale indépendante, correction éventuelle RED→GREEN, intégration locale.

## Mandat

Le parent a demandé de poursuivre les lots en autonomie, priorité application.
Les décisions ci-dessus sont des choix réversibles du développeur ; aucune
approbation commerciale ou nouvelle règle du fils n'est déduite de ce mandat.
