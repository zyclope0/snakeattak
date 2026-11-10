# Threat preparation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** rendre les dangers prévisibles et la préparation illustrée sans changer le jeu.

**Architecture:** modèles UI purs, composants DOM séparés, marqueurs Phaser observateurs. Commandes et règles existantes restent autoritaires.

**Tech Stack:** TypeScript, Phaser 3, Vite, HTML/CSS, Capacitor 8.6, Node24/Playwright.

**Spec:** ../specs/2026-11-08-threat-preparation-design.md

## Global Constraints

- Règles, RNG, données et sauvegardes inchangés ; aucun Math.random.
- Six missions existantes, trois voies visibles et tutoriel centre→2→3 conservés.
- Prévision des espèces, jamais de répartition adaptative inventée par voie.
- Conseil seulement avec un allié disponible ; jamais achat ou déplacement automatique.
- 0.32.0 / Android code 35, certificat précédent, aucun SDK ni asset nouveau.

## Review Focus

- Départ ancien sans rules2 ou tacticalRulesEnabled=false : aucune espèce inventée.
- Dernière vague classique : roi/garde/soigneur annoncés, aucun roi en mission.
- Changement de départ/vague/fin de partie : pas de prévision périmée.
- Dialogues/rotation/arrière-plan : fermeture n'efface pas une pause acquise.
- Petit paysage avec marges : HUD, lancement et fermeture restent accessibles.

### Task 1 — Projection et dangers de vague

**Files:** créer `src/ui/threatPreview.ts`, `src/ui/threatCards.ts`,
`src/ui/threatControls.ts`, `src/render/threatMarkers.ts`, tests
`tests/threat-preview-036.test.ts` ; modifier art.ts, controls.ts, BattleScene.ts,
index.html et style.css.

**Interfaces:** `waveThreats(game:PreviewSource,local:number):WaveThreats`,
`currentWaveThreats(game:Game):WaveThreats|null`, `missionThreats(run:MissionRun):ThreatKind[]`,
`threatAdvice(types:readonly ThreatKind[],available:(kind:Kind)=>boolean):{kind:Kind;text:string}` ;
`ThreatKind = EnemyKind|'king'`, `WaveThreats={local:number;lanes:readonly number[];entries:{kind:ThreatKind;count:number}[];eggs:number}`.
DOM `renderThreatCards(host,types)` ; `bindThreatControls(session,refresh):()=>void` ;
Phaser `ThreatMarkers.draw(game):void`.

- [x] Tests RED : projection vs naissances réelles classique1–12 et missions/assauts/couvées ; réglages historiques, œufs, RNG inchangé, conseils déverrouillés.
- [x] Modèles GREEN : helpers existants, catalogue complet de capacités et priorité visuelle explicite.
- [x] Recette navigateur RED : bouton Dangers, vrais portraits, pause de dialogue et affichage hors combat.
- [x] Implémenter galerie accessible et marqueurs non interactifs aux sorties actives ; accès tactile/clavier par le bouton HTML, pas d'appel anticipé.
- [x] Tests natifs/build/navigateur ciblé GREEN ; commit.

### Task 2 — Préparation illustrée et livraison

**Files:** créer `src/ui/missionPreview.ts` ; modifier expeditions.ts,
index.html/style.css ; créer `scripts/threat-preparation-036-browser.mjs`, rapports,
version/Android et bilan/plan ; modifier workflow.

**Interfaces:** `drawMissionPreview(svg:SVGElement,run:MissionRun):void`,
`showMissionScouting(run:MissionRun):void` ; utilise les modèles et cartes de Task1.

- [x] Recette RED : tracé et portraits, conseil disponible, trois dangers + dépliage, nouveautés de départ et footer visible sans scroll.
- [x] Implémenter aperçu exact, dangers de mission et conseil illustré ; conserver IDs, parent options et lancement explicite.
- [x] GREEN : 1280×800, 812×375, 568×320,480×320 avec marges,375×812 ; cibles48px, ratio du plateau, vraie vague, catalogue, rotation et pauses.
- [x] Version0.32.0/code35, bilan et plan fidèles aux sous-parties livrées.
- [x] verify, navigateur général, mobile, interruptions, hors ligne, portable ; APK normal avec même certificat et fichiers web identiques.
- [x] Revue finale, corrections justifiées, intégration main et Git privé ; publication distincte du build vérifié.

Méthode native conservée selon le mandat autonome ; le plan précise les choix du
développeur et n'ajoute pas d'approbation conversationnelle au GO reçu.
