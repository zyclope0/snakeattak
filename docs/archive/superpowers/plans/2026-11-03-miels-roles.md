# Deux miels et rôles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. UI may be delegated independently via dispatching-parallel-agents.

**Goal:** Deux tactiques de miel, rôles distincts et serpent parapluie lisible.
**Architecture:** tactics.ts pour le miel, combatRules.ts pour les protections,
game.ts pour les événements, acteurs/présentation pour les animations ; UI séparée.
**Tech Stack:** TypeScript strict, Phaser, tests Node, Playwright, simulation100parties.
**Spec:** docs/superpowers/specs/2026-11-03-miels-roles-design.md

## Global Constraints

Un pot gratuit par vague, durée 14 s, pas de commandes de troupes ; garder douze vagues,
la santé/or réels en simulation, la compatibilité des camps et un coût assets≤218crédits.

## Review Focus

- Miel collant : pas d'attraction involontaire ou de ralentissement hors zone.
- Bouclier : pas d'auto-protection supplémentaire, ni cumul ou protecteur mort.
- Ninja : le cristal urgent reste prioritaire et les cibles restent réparties.
- Parapluie : réduction spécifique aux flèches frontales en marche ; boss normal.
- Pause/reprise, ancienne sauvegarde et retour des effets aux valeurs neutres.

### Task 1: Miel et UI

Interfaces : FeastFlavor='lure'|'sticky'; Feast {lane,remaining,flavor};
Game.offerFeast(lane:number,flavor:FeastFlavor='lure'):boolean.

- [x] Tests rouges puis moteur vert : validité, exclusivité, zone, vitesse réelle, absence d'attraction, expiration/pause.
- [x] UI déléguée : deux boutons Attirer/Ralentir, trois voies, état réel et aide ; tests navigateur.

### Task 2: Rôles et ennemi

- [x] Tests rouges puis verts de protection réelle avec cooldown, ciblage ninja et dégâts parapluie.
- [x] Ajouter combatRules.ts, variante umbrella, décodeur gardeCool0 et descriptions.
- [x] Atlas quatre images : parapluie ouvert/fermé, miel attirant/collant ; provenance et contrôle visuel.

### Task 3: Présentation

- [x] Animations propres aux types, zone collante suivant le vrai chemin, effets de protection et rugissement visuel.
- [x] Fixtures des nouveaux pouvoirs, pause/mouvements réduits et restauration GPU.

### Task 4: Livraison

- [x] Vérification complète et 100 campagnes, ajustements uniquement si nécessaires.
- [x] Revue indépendante, correctifs importants couverts rouge→vert.
- [x] Exports web/portable, ZIP et aperçu HTTPS vérifiés, documentation et coût réel.

## Journal

Snapshot sans Git : /workspace/conquete-serpents-baseline-0.12. L'UI possède seulement
index.html,style.css,ui/feastControls.ts,ui/coaching.ts,tests/browser.mjs ; le moteur,
les assets et les scènes restent à la racine pour éviter des modifications concurrentes.

### Résultats d'exécution

Moteur et UI intégrés, deux poses parapluie inspectées et retournées selon leur
profil réel gauche, deux pots communs au panneau et au terrain. Coût218crédits.
120 tests passent ; tests de protections, zone, cible et actions observés rouges
puis verts. UI déléguée à ui_miels_013 dans ses cinq fichiers, puis contrôlée dans
le navigateur ; ajouts ultérieurs d'icônes sans changement de règles.

Deux défauts exploratoires corrigés : soutien limité d'un gardien entouré au pont,
puis projection de tous les objectifs A* alliés quand la cible légale a une cellule
bloquée. La limite de temps n'a pas été modifiée. Une régression empêche l'appel en
cascade de toute l'armée quand une aide arrive au pont.

Revue indépendante sans Critical/Important ni Minor matériel,119tests/types verts.
Le correctif d'objectif A* supplémentaire est vérifié par reproduction rouge→verte,
suite120/120 et replay du blocage en 3,97 s. Pas de deuxième revue demandée.

Lots finaux :100attirant +100alternés,82+92 victoires, aucun blocage. Empreintes
comparées aux TypeScript livrés. Les résultats de distance restent avantagés.
Aucun appareil physique disponible ; essais navigateur et export portable seulement.
Les archives et URLs HTTPS sont vérifiées avant livraison, sans fusion Git ni
publication d'un site dans cette archive de travail.
