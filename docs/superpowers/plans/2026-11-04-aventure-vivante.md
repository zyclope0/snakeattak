# Aventure vivante Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans task-by-task. The parent explicitly requests autonomous execution and council after each stage.

**Goal:** Livrer une 0.19 accessible, lisible et plus variée sans modifier l'esprit du jeu.

**Architecture:** Moteur local conservé ; signaux dérivés sans effet de bord ; vagues définies par données. Publication d'un build statique, code source complet conservé séparément.

**Tech Stack:** TypeScript strict, Phaser 3, Vite, Node 24, tests natifs et Playwright.

**Spec:** docs/superpowers/specs/2026-11-04-aventure-vivante-design.md

## Global Constraints

- Aucune dépendance supplémentaire, serveur de gameplay ou service payant requis.
- Soldats autonomes, œufs aléatoires, trois voies liées, réactions fixes 2/3 PV.
- Sauvegardes 0.18 lisibles, aucun bonus ou renfort inventé au chargement.
- Physique et plaisir humain non validables par simulation.
- Conseil après chaque étape ; ne pas interrompre pour une approbation déjà donnée.

## Review Focus

- Menu/onglet masqué et pause : ni annonce ni horloge ne doivent dériver.
- Sauvegarde locale refusée ou ancienne : le parcours reste utilisable.
- Plusieurs effets simultanés : priorité, bornes et lisibilité sur écran étroit.
- Changements de composition : pas de nouveau pic brutal sur un profil familial.
- Hébergement : audience privée conservée, identité stable, assets sans clés.

### Task 1: Accès et parcours

**Files:** copie statique /workspace/sites/conquete-serpents ; tests de parcours existants ; docs/CONSEIL-0.19.md.
**Interfaces:** consomme dist/ ; produit une URL HTTPS et une identité Site persistée.

- [x] Vérifier les 224 tests de référence, préserver le snapshot 0.18.
- [x] Préparer et publier la distribution testée via Sites, contrôler le statut.
- [x] Exécuter le parcours navigateur aux formats 1440, 390, 320 et 844 px.
- [x] Conseil 1 : identifier les blocages d'accès et documenter les limites.

### Task 2: Signaux de combat

**Files:** src/render/encounterReadout.ts, battleFeedback.ts, presentation.ts ; tests/encounter-signals-019.test.ts ; tests/presentation-harness.ts si nécessaire.
**Interfaces:** consomme Game en lecture seule, produit signaux purs et dessins bornés.

- [x] Écrire puis voir échouer les tests de seuil, pause, fin, confusion et encouragement.
- [x] Implémenter les lectures d'état et leur présentation dans le style existant.
- [x] Vérifier déterminisme du moteur, tests natifs et scénarios navigateur.
- [x] Conseil 2 : arbitrer la lisibilité et éviter la surcharge.

### Task 3: Chapitres et décisions

**Files:** src/waves.ts, tests/chapter-rhythm-019.test.ts ; laboratoire et rapports 0.19 ; menu/coaching si intégration utile.
**Interfaces:** variantFor/spawnDelay/entryLane/eggIncubation conservent leur signature ; budgets du moteur inchangés.

- [x] Écrire puis voir échouer les tests sur la personnalité de vagues ciblées.
- [x] Implémenter un petit nombre de variations à effectifs constants.
- [x] Comparer 0.18/0.19 sur une cohorte de découverte avec mêmes graines et politiques.
- [x] Rejeter les changements qui produisent des régressions fortes ; geler les paramètres.
- [x] Valider sur une cohorte distincte, tracer entraînements et plusieurs timings d'encouragement réels.
- [x] Conseil 3 : verdict basé sur résultats, réserves explicites sur le plaisir humain.

### Task 4: Livraison

**Files:** README, GAME_DESIGN, ARCHITECTURE, docs/BILAN-0.19.md ; reports/verification-0.19.json ; archives jouable et source.
**Interfaces:** distribution web et portable bâties sur le même code gelé.

- [x] Revue indépendante finale ; corriger les défauts importants avec reproduction.
- [x] verify, build portable, navigateurs web/portable, menu, récompenses, interface, présentation, rendu.
- [x] Publier cette source exacte sur le même Site ; vérifier statut final et URL.
- [x] Archiver, vérifier intégrité et liens de téléchargement ; rendre compte des limites.
