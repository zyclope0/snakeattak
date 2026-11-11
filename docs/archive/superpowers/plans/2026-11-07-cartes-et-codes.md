# Cartes et codes de départ — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Le décor lisible apparaît dès l’aventure classique et les départs peuvent être retrouvés par code.
**Architecture:** Généraliser le rendu existant, sans déplacer les routes/collisions. Codec TypeScript pur et borné transportant type, graine et toute la configuration d’expédition. Métadonnée de graine initiale optionnelle dans les camps v6; les sauvegardes anciennes restent lues. Aucun chargement automatique d’armée via un code.
**Tech Stack:** Phaser 3.90, TypeScript, Vite, Magnific Nano Banana 2.1, Capacitor 8.6.
**Spec:** Proposition approuvée : décor sur toutes les cartes + codes de départ + version visible. docs/brief-refonte.md lot 1 généralisé et point 3.1.

## Global Constraints

- Conserver gameplay, budget, unités, IA, routes et obstacles physiques.
- Respecter les anciens camps et les stocks/délais des soignants; aucun code n’importe un état de combat.
- Même code = même configuration et graine, pas victoire garantie; choix du joueur déterminants.
- Un code d’une mission verrouillée ne contourne pas la progression.
- Aucune sauvegarde d’un nouveau détachement sans lancement explicite.
- Vue et codec restent séparés des règles; classic et missions restent distingués.

## Review Focus

- Rejouer doit garder toutes les variantes (même configuration avec relance historique), pas recalculer seulement depuis la graine.
- Camp classique ancien en cours sans graine initiale : ne pas inventer de code à partir du RNG évolutif.
- Code incorrect/long/futur/verrouillé : message utile, camp et progression inchangés.
- Anciennes versions 1–6 et témoin LEGACY restent compatibles; RNG ne change pas à la lecture ou copie d’un code.
- Trois thèmes et trois dispositions : cache, décor, fort et antres cohérents, Canvas et retour de contexte.

### Task 1: Codec et métadonnée

**Files:** Create src/departures.ts, tests/departures-025.test.ts; Modify game.ts,checkpoints.ts; tests/departure-checkpoints-025.test.ts.

- [x] Tests RED sur 108 configs et bornes de graine, checksum/version/texte invalide, copies canoniques, RNG et plans de vagues identiques.
- [x] Implémenter code versionné humain, groupes courts et somme de contrôle; données ≤39 bits, pas de BigInt ou dépendance.
- [x] Métadonnée initialSeed optionnelle v6 (pas de changement des formats LEGACY); vieux camp classique sans graine = code indisponible, mission récupérable depuis sa configuration.

### Task 2: Généraliser la carte

**Files:** Modify art.ts,render/terrain.ts,refinedTerrain.ts,stageLayout.ts,actors.ts,strongholds.ts,BattleScene.ts; tests/stage-layout-023.test.ts; new tests/stage-generalized-025.test.ts.

- [x] Générer, inspecter et intégrer deux fonds locaux supplémentaires avec origine et coût.
- [x] Même système de rendu sur tous les niveaux, palettes propres à chaque région; routes et rochers restent ceux du moteur.
- [x] Retirer branches de vieux rendu et titres peints; décor classique dérivé d’une graine visuelle stable même pour camps anciens.
- [x] Tester six identités de terrain et cadrage de tous les bâtiments; captures avant/après et restauration GPU.

### Task 3: Interface de codes et version

**Files:** Create ui/departures.ts; Modify ui/menu.ts,ui/expeditions.ts,main.ts,index.html,style.css.

- [x] Numéro de version automatique, visible à l’accueil et en partie.
- [x] Code visible/copier avant départ et pendant la partie; saisie depuis l’accueil.
- [x] Mission valide déverrouillée : aperçu habituel, armée fraîche et budget confirmé; mission verrouillée refusée.
- [x] Classique : aperçu et lancement explicite via la confirmation de remplacement existante, camp en cours protégé.
- [x] Presse-papiers indisponible : texte sélectionnable et message sans prétendre avoir copié.

### Task 4: Livraison

- [x] npm run verify, contrôles navigateur des codes, missions et anciens imports, vue classique et trois thèmes, mobile, Canvas et contexte restauré.
- [x] Revue indépendante et correctifs importants; exports web/portable et synchronisation Android.
- [x] Publier 0.25 sur le site existant; bilan des changements, captures et limites sur téléphone réel.
