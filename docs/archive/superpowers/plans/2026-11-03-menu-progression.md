# Menu and Campaign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans for each bounded domain. Use checkbox steps.

**Goal:** Menu familial, progressionlocale réelle et six adaptations préservant0.17.
**Architecture:** Règles et campv4 dans domaineA ; carrière/équipes dans domaineB ;
menu/raccourcis/portée dans domaineC. Interfaces figées dans la spec, pas de fichiers
partagés entre implémentations ; intégration root après modules.
**Tech Stack:** TSstrict/Node24/Phaser3/Vite/Playwright.
**Spec:** docs/superpowers/specs/2026-11-03-menu-progression-design.md

## Global Constraints

12vagues/3voies/21alliés existants, hérosautonome ; roi entrantfatal ; réactions2/3
inchangées ; commandes refusées pendantpause ou étatsinvalides ; camp 4 lit1/2/3 ;
aucune monnaie/metaamélioration obligatoire ; pas de nouvelleimage/dépendance.

## Review Focus

- Ancien campv3 au jalon avec bonus enattente conserve choix et armée (A tests).
- Un même résultat rechargé n'ajoute pas d'étoiles au delà du meilleur (B tests).
- Retour menu depuiscombat ne consomme ni timers ni effets ; dialoguerespecté (C browser).
- Vraie reprisechapitre restaure soncamp exact, avecconfirmation, aucun soldat
  réintroduit au cours d'un combat (B/C).
- Changeréquipe ne crée aucuneunité ni argent ; prixgratuits et verrous restentvrais (C).

### Task1 A: moteur et camp

Files campaignRules.ts, game.ts, checkpoints.ts, tests/campaign-018.test.ts,
fixtures historiques qui pinnaient laversion et hashlegacy.

- [ ] Tests RED commandes/refus/effets/pause/minimumétoiles/migration.
- [ ] Implémenter contrats spec, sansmodifier UI/labo/session.
- [ ] Vérifier ciblés/types et communiquer toute régression ancienne ; ne pas affaiblir.

### Task2 B: carrière et équipes

Files roster.ts, progression.ts, tests/progression-018.test.ts.

- [ ] Tests RED persistance/idempotence/équipeinvalide/snapshot/défaillancestockage.
- [ ] Implémenter API spec avecmodulesmoteur read-only, sansmodifierA.
- [ ] Vérifier ciblés ; pas de browser/bigsim enparallèle.

### Task3 C: menu et intégration

Files main/session, ui/menu.ts, ui/squadControls.ts, ui/adventureControls.ts,
render/placementRange.ts/BattleScene, index/CSS, scripts/tests navigateur.

- [ ] Écrire tests puis voir RED home/pause/restauration/raccourcis/range.
- [ ] Implémenter menu, carte3chapitres, confirmation, slots/favoris et commandes.
- [ ] Migreranciens scénarios via boutons réels, pas de bypassURLproduction.
- [ ] Vérifier web/portable,7formats, focus/touch, capturepreviews.

### Task4: vérification et livraison

- [ ] Analyse sourcée parjeu et exclusions, documentation/scope0.18.
- [ ] Vérifier absenceeffets parcomparaison0.17, étendre labtraining/boost etnouvellecohorte.
- [ ] Simulations politiques standard/force/guard/encouragement/combiné sur8profils,
      16grainesneuves (offset80..95),640campagnes,3workers, conserver erreurs/défaites.
- [ ] npmverify+buildportable+navigateurs+présentation+restaurationWebGL.
- [ ] Relectureindépendante de l'intégration puis correctionpreuveavantsuccès.
- [ ] Archivesjouable/sources/aperçu/analyse, uploadpuisGET/SHA/CRC vérifiés.

Autonomie persistante ; aucun Git ici : snapshot0.17 préservé. Exécution par
domaines indépendants sous dispatching-parallel-agents, sans chevauchement de fichiers.
