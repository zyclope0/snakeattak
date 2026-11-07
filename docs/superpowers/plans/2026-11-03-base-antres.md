# Refuge et antres Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Donner une présence au refuge et une sortie visible aux serpents.
**Architecture:** Un atlas importé par Vite, des signaux bornés dans Presentation,
un module Strongholds pour le rendu dynamique. Le moteur reste indépendant.
**Tech Stack:** TypeScript, Phaser, Node test, Playwright.
**Spec:** docs/superpowers/specs/2026-11-03-base-antres-design.md

## Global Constraints

Conserver règles et sauvegardes ; trois voies ; aucun service de jeu ; mouvements
réduits et pause ; conserver le cache du terrain ; budget de cette planche 218 crédits.

## Review Focus

- Une éclosion ne signale pas une sortie de l'antre.
- Chargement et changement de partie ne produisent pas de faux impact de base.
- Les effets se figent en pause, restent bornés et expirent.
- Base, portes et routes sont alignées sans cacher le combat.
- Export portable et perte/restauration WebGL restent utilisables.

### Task 1: Signaux de présentation

- [x] Écrire et observer des tests rouges : arrivée, éclosion, dégâts/réparation de base, pause/restart et bornage.
- [x] Étendre Presentation sans modifier Game ; durées courtes et tableaux limités.
- [x] Vérifier les tests et l'absence de mutation de la simulation.

### Task 2: Assets et rendu

- [x] Inspecter la planche, détourer puis préparer 1024² ; documenter provenance/coût.
- [x] Ajouter atlas et module render/strongholds.ts ; retirer les trous et l'ancien phare du terrain caché.
- [x] Ajouter entrée progressive des acteurs et fixtures refuge/antres.
- [x] Inspecter les captures et vérifier la restauration GPU.

### Task 3: Livraison

- [x] Suite, types, build, tests navigateur HTTP et portable.
- [x] Revue indépendante, corriger les problèmes importants avec régression rouge→verte.
- [x] ZIP et aperçu HTTPS vérifiés, documentation et coût réel.

## Journal

Pas de Git : snapshot /workspace/conquete-serpents-baseline-0.11.1 avant modification.
Exécution directe autorisée par les demandes d'autonomie antérieures ; aucune attente
d'approbation supplémentaire pour cette amélioration réversible.

### Résultats

Task 1 complete : cinq tests rouges puis verts, suite104/104. Task 2 complete :
planche inspectée, 218 crédits vérifiés, captures des clairières/refuge/sortie
contrôlées, terrain+fort+antre restaurés après perte WebGL.

Revue finale : un Important (défenseur masqué par le fort) corrigé ; recrutement
réel à984,312 observé rouge puis vert dans Chromium, suite complète verte après
correction. Aucun Minor classé à différer. Les deux impulsions santé peuvent
coexister brièvement si dégâts et réparation se suivent ; elles représentent les
deux événements réels et ne changent aucune règle.

Le réviseur n'a pas relancé portable/GPU : ces contrôles ont été effectués par la
racine. Aucune tablette physique n'est disponible. Les ZIP sont conservés avec
leurs sources et vérifiés après téléchargement HTTPS avant remise. Pas de dépôt
Git, de branche à fusionner ni de publication de site dans cette livraison.
