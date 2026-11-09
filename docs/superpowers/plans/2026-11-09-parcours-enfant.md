# Parcours enfant — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Finir les aides des outils et le parcours illustré des six missions existantes, puis livrer une version testable.

**Architecture:** Nouveaux modèles et composants de présentation dans src/ui ; aucune écriture dans le moteur. Les dialogues utilisent pauseForDialog ; l'accueil réutilise les contrôleurs de progression. Petites feuilles CSS dédiées plutôt que grossir style.css.

**Tech Stack:** Phaser3, TypeScript, Vite, HTML/CSS, Capacitor ; aucune nouvelle dépendance.

**Spec:** docs/superpowers/specs/2026-11-09-parcours-enfant-design.md

## Global Constraints

- Source applicative initiale f2a6c00 ; worktree isolé existant, branche feat/child-journey-033.
- Aucun changement règles/RNG/camps/codes, aucun verrou d'outil supplémentaire.
- Direction de l'icône, pas de génération payante, pas de SDK commercial.
- Budget HTML32KiB et JS jeu200000octets conservé ; ne pas relever les budgets pour passer.
- Choix ordinaires délégués, questions critiques restent ouvertes ; conseil six personas après chaque lot.

## Review Focus

- Interruption Android ou pause utilisateur avant fermeture de l'aide : ne pas reprendre le combat.
- Ancien camp/code et changement de mission : aucune progression ou sélection inventée.
- Cristal intact, héros mort ou entraîné : pas de conseil impossible/trompeur.
- Six missions terminées ou verrouillées : pas de fausse prochaine mission ou de fausse récompense.
- Petit paysage/portrait et clavier : retour accessible et dimensions de plateau conservées.

### Task A : aides des outils

**Files:** Create src/ui/campToolHelp.ts, src/ui/campToolHelp.css, tests/camp-tool-help-033.test.ts, scripts/camp-tools-033-browser.mjs. Modify src/ui/controls.ts, battleDock.ts, adventureControls.ts, coaching.ts, index.html, package.json/lock et Android versionCode40. Les fichiers de règles restent intacts.

**Interfaces:** Le modèle pur lit Game et renvoie le texte/état de présentation d'un outil ; le binder reçoit Session + refresh, utilise pauseForDialog et rend un sujet à la fois. bindBattleDock alterne ?/X sans agrandir le dock. Les conseils contextuels restent de priorité inférieure aux actions/dangers existants.

- [x] Tester l'aide sans mutation du Game, entraînement vrai selon mission/classique, cristal intact/blessé, héros absent/entraîné, urgence prioritaire et consultation sans dépense.
- [x] Exécuter la recette ciblée et observer l'échec de la fonction/du parcours absent.
- [x] Implémenter le modèle et l'aide, brancher les commandes, corriger le texte d'entraînement.
- [x] Vérifier tests ciblés puis npm run verify et test:browser ; recette nouvelle, audit et formats enfants. Captures avant/après des points concernés.
- [x] Conseil six personas, corrections nécessaires, bilan0.33.0 et commit du lot.

### Task B : chemin des six missions

**Files:** Create src/ui/missionJourney.ts, src/ui/missionJourney.css, tests/mission-journey-033.test.ts, scripts/mission-journey-033-browser.mjs. Modify expeditions.ts, index.html et versions0.33.1/code41 ; importer CSS au composant. Conserver menu.ts si son comportement suffit.

**Interfaces:** La vue reçoit les vraies données de mission/progression ; elle produit seulement les états, labels et éléments d'illustration. Les clics conservent preview(createMissionRun(...)) et les IDs/data-mission-card.

- [x] Tester profils vides, partiels et six missions terminées, sans mutation du profil ni changement de verrouillage.
- [x] Observer l'échec ciblé, puis créer les médaillons et raccords papier arrondis avec états accessibles.
- [x] Conserver Jouer/reprise en premier, reprise des équipes et accord de remplacement existant, aucun fond futur préchargé.
- [x] npm run verify, test:browser, test:missions, test:departures et test:audit ; captures aux formats spécifiés, contrôles clavier et tactile.
- [x] Conseil six personas, corrections nécessaires, bilan0.33.1 et commit du lot.

### Task C : transitions et livraison

**Files:** tests/scripts appropriés seulement si un défaut est reproduit ; docs/PLAN-ACTUEL.md, bilans, conseils et rapports ; APK et publication séparés.

**Interfaces:** Réutiliser les scènes/contrôleurs finalisés A/B ; aucun nouveau système.

- [x] Vérifier aide/pause/interruption/reprise et changement de mission, test:interruptions, test:offline, test:reinforcements-scroll, test:child-mobile et test:interface-audit.
- [x] Si défaut, preuve rouge puis correction ciblée et vérifications utiles, sans changer les règles.
- [x] Construire APK debug normal avec même identité/certificat, inspecter versions/permissions et fichiers embarqués.
- [x] Conseil six personas de livraison ; rapports honnêtes sur les limites S24 physiques, langues/lieux/campagne et commercial.
- [ ] Publier le build exact sur le site existant, même audience, vérification réelle du lancement. Plan et bilan finaux à jour.
