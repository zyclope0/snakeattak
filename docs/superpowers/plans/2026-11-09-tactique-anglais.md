# Tactique et anglais — plan d'exécution

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans.
> Exécution autonome autorisée ; analyses/traductions indépendantes et conseils
> peuvent être délégués avec des périmètres de fichiers disjoints.

**Goal:** Livrer le lot2 de lisibilité, l'application FR/EN et une soucoupe décorative unique.

**Architecture:** Projection linguistique aux seuls points d'affichage, moteur
et formats canoniques inchangés. Catalogues indépendants, adaptateurs DOM/Phaser
qui conservent nœuds et événements. Les aides tactiques lisent les données réelles.

**Tech Stack:** Phaser3, TypeScript, Vite, HTML/CSS, Capacitor Android.

**Spec:** `docs/superpowers/specs/2026-11-09-tactique-anglais-design.md`.

## Global Constraints

- Français conservé, anglais Snake Attack TD ; pas de renommage AppID.
- Aucun changement de règle, tuning, RNG, format, checksum ou données canoniques.
- Pas de serveur, SDK, achat, publicité ou génération payante.
- HTML<32768octets, JS par asset≤200000, Phaser≤2000000 ; total documenté.
- SourceV4 et anciens rapports conservés ; travail dans le worktree existant,
  branche `feat/tactical-english-035`, base `fb16b71`.

## Review Focus

- Langue changée pendant pause/dialogue : mêmes nœuds/focus, état et horloge.
- Anciens codes/camps, stockage refusé et locale inconnue : compatibles et lisibles.
- Textes canvas mis en cache et textes créés après démarrage : tous traduits.
- Petits paysages/insets et descriptions longues anglaises : actions accessibles.
- Score, conseil de voie et soins : données réelles, aucune promesse de règle nouvelle.

### Task 1: Lisibilité tactique et résultat

**Files:** créer `src/ui/placementAdvice.ts`, `src/render/medicalReadout.ts`,
tests dédiés ; modifier coaching/controls/battleDock, medicalSignals,
resultCopy/battleResult/expeditions et BattleScene, CSS de résultat.

**Interfaces:** `placementAdvice(game,kind)` retourne du texte canonique sans
écriture ; `weakLaneAdvice(game)` respecte les voies ouvertes ; medicalReadout
dérive les badges et la recharge groupée ; `defeatCopy(game)` partage la consigne.

- [x] Tests rouges : rôles et vraie portée, voies fermées exclues, état inchangé,
      réserve groupée, étoiles gagnées et texte de défaite.
- [x] Implémenter ces lectures et les afficher aux emplacements existants.
- [x] Recette1280/812/568, tests/build puis commit du lot ; conseil six personas.

### Task 2: Langue et adaptateurs d'affichage

**Files:** `src/i18n/{language,copy,dom,phaser,controls}.ts`, catalogue anglais,
extracteur d'inventaire ; points d'écriture UI/render/audio/main ; main/bootstrap.

**Interfaces:** langue `fr|en`, initialisation depuis préférence/système,
`setLanguage` asynchrone et abonnement ; copie canonique→affichée ; adaptateurs
DOM/Phaser avec valeurs sources conservées pour la bascule sans reconstruction.

- [x] Tests rouges : identité FR, dictionnaire EN/gabarits/paramètres, codes
      inchangés, préférence invalide/refusée, chargement et bascule sans effets.
- [x] Catalogues exacts et gabarits bornés/ancrés ; aucun remplacement de mots
      dans des données utilisateur ; traductions de valeurs imbriquées bornées.
- [x] Lier les écritures explicites de texte/HTML/attributs et les labels canvas.
- [x] Ajouter choix de langue accueil/pause et titre/document.lang, ressources
      Android values-en ; aucun reset de session lors de la bascule.
- [x] Couverture de l'inventaire et tests/build verts ; commit infrastructure.

### Task 3: Traduction complète, lisibilité et compatibilité

**Files:** catalogues, recette `scripts/locale-035-browser.mjs`, harness/tests,
Vite seulement si découpage logique nécessaire pour les budgets.

- [x] Inspecter et traduire catalogue, messages, aides, missions, variantes,
      progression, sauvegarde/import, boss, audio et attributs accessibles.
- [x] Tester0/1/plusieurs, décimales, composés, ancien camp/code, titres et
      langue changée dans les différents écrans. Corriger tout texte FR manquant.
- [x] Capturer les six formats FR/EN ; tester mêmes commandes/graines et
      instantané identique, nœuds/handlers/focus conservés et anciens schémas1–7.
- [x] Vérifier hors ligne/portable et budgets ; commit de couverture.

### Task 4: Soucoupe unique

**Files:** `src/render/saucer.ts`, raccord de terrain, tests/captures/provenance.

- [x] Test rouge : classique ruins seulement, mêmes positions et état du jeu.
- [x] Dessin original statique mat à(1008,48),36×20, palette distincte des ennemis.
- [x] Recette visuelle, aucun chevauchement/effet/texture payante ; build/commit.
- [x] Conseil final six personas, correction des importants rouge→vert.

### Task 5: Livraison

**Files:** versions package/Android, bilan/conseils/plan courant, rapports.

- [ ] Verify et recettes navigateur, résultat, enfant, audit, missions/codes,
      hors-ligne, interruption, présentation, bilingue et portable verts.
- [ ] Garder une marge CI raisonnable pour les mêmes contrôles complets :
      l'ancien job15min a terminé les tests mais a expiré pendant le cache final.
- [ ] APK normal0.35.0/code45, même certificat/AppID, fichiers web identiques.
- [ ] Publier le build exact sur le site existant ; jouer une mission EN et
      tester FR/reprise/rotation. Pousser nouvelle branche et PR, pas de fusion
      automatique sur ce nouveau lot.
- [ ] Bilan factuel : traductions et captures, tests, règles identiques,
      limites de relecture/native ; pas de faux avis enfants.
