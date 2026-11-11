# Souvenirs et sauvegarde familiale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use the implementation workflow task-by-task; user explicitly requests autonomous work and council after each stage.

**Goal:** Célébrer les vrais chapitres et transporter l'aventure sans changer le combat.

**Architecture:** Modèles purs et fichiers validés ; une clé autoritative pour l'import ; orchestration DOM séparée. Deux domaines indépendants puis intégration par le principal.

**Tech Stack:** TypeScript strict, Phaser 3, Vite, Node 24, Playwright.

**Spec:** docs/superpowers/specs/2026-11-04-souvenirs-famille-design.md

## Global Constraints

- Combat, IA, vagues, prix, catalogue et règles des enfants inchangés.
- Aucun serveur de gameplay ou nouvelle dépendance.
- Limites : 500 000 caractères et 1 000 000 octets par fichier familial.
- Import refusé sans mutation si validation ou stockage échouent.
- Aucun MVP ni statistique inventée ; compteurs cumulés explicitement étiquetés.
- La réserve file de 0.19 reste documentée, sans résolution prétendue.

## Review Focus

- Import pendant combat, annulation et retour menu : aucun ancien état ne réécrit le nouveau.
- Profil seul et camp null : l'ancienne armée ne revient pas au prochain lancement.
- Quota, stockage bloqué, ancien format et fichier malformé : rien n'est effacé.
- Chargement ancien camp et dernier chapitre : bilan factuel, pas de fausse nouvelle victoire.
- Petit écran, focus modal, bonus offert et mouvements réduits : parcours utilisable.

### Task 1 — Données et persistance familiale

**Files:** src/familyBackup.ts, familyPersistence.ts, progression.ts, campMemory.ts ; tests/family-backup-020.test.ts et family-persistence-020.test.ts.
**Interfaces:** lire/écrire l'enveloppe canonique ; load/sync/import sur la nouvelle clé ; carrière stable avec replaceState ; mémoire raw/replace.

- [x] Écrire les tests refus d'import, borne, anciens camps, profil seul et quota puis observer RED.
- [x] Implémenter les modèles et l'écriture autoritative avant mutation mémoire.
- [x] Vérifier ciblés et suite native ; geler les interfaces ; conseil d'étape.

### Task 2 — Bilan de chapitre

**Files:** src/chapterReport.ts, src/ui/chapterReport.ts ; tests/chapter-report-020.test.ts.
**Interfaces:** chapterReportFor(Game) pur ; bindChapterReport(Session) retourne refresh ; contrat DOM fourni au principal.

- [x] Observer RED sur bornes 4/8/12, faux statut, données réelles et transition/reprise.
- [x] Implémenter panneau sans mutation moteur, focus forcé ni récompense nouvelle.
- [x] Vérifier modèle, pause et nouvelle partie ; conseil d'étape.

### Task 3 — Interface et transfert réel

**Files:** src/ui/familyControls.ts, main.ts, index.html, style.css ; tests/family-020-browser.mjs et runner.
**Interfaces:** callbacks export courant / commit autoritatif / remplacement session après succès.

- [x] Tester d'abord le parcours manquant, puis implémenter aperçu/annulation/confirmation.
- [x] Éprouver file→web→file, rechargement, profil seul, ancien camp et stockage refusé.
- [x] Vérifier bilans, bonus, clavier, mobile et mouvement réduit ; conseil d'intégration.

### Task 4 — Revue et livraison

**Files:** docs/CONSEIL-0.20.md, BILAN-0.20.md, README, architecture, rapports et archives.

- [x] Relecture indépendante ; corriger les défauts importants avec reproduction.
- [x] Empreintes moteur identiques et contrôle apparié de 32 campagnes, sans nouveau réglage.
- [x] verify, build portable, navigateurs web/portable, interface, cadeaux, menu, signaux, rendu, famille.
- [x] Publier ce build exact sur le Site existant, préserver son audience privée.
- [x] Archiver et vérifier CRC, SHA et liens publics ; restituer les limites.
