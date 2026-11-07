# Chapter Rewards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deux choix de bonus après vagues4/8, sauvegardés et jouables au clavier/tactile.
**Architecture:** Règles pures dans rewards.ts ; Game applique les effets et garde le contrôle. Checkpointsv3 et UI stable dans rewardControls.ts, sans nouvelle horloge.
**Tech Stack:** TypeScript strict, Node24, Phaser3, Vite, Playwright.
**Spec:** docs/superpowers/specs/2026-11-03-chapter-rewards-design.md

## Global Constraints

- Douze vagues, trois voies et combat automatique conservés ; aucune résurrection.
- Trois propositions, un choix, après vagues4/8 ; possibilité de renoncer.
- Renfort bouclier/ninja/raptor offert, miel+4s, protection18, pièces100.
- Protection maximum36 et miel maximum22s ; roi entrant toujours fatal.
- Aucune nouvelle dépendance, service réseau ni génération payante.
- Sauvegardesv1/v2 lisibles, nouveau campv3 ; Node24, budgets web conservés.

## Review Focus

- Rechargement avant/après choix ou placement : même offre, aucun doublon (Task1).
- Camp plein/point illégal : bon conservé, argent intact (Task1).
- Roi entrant avec protection : défaite ; impacts ordinaires successifs exacts (Task1).
- Dialogue ouvert/pause au jalon : pas de focus volé ni de choix appliqué (Task2).
- Chapitre ancien restauré : migration explicite, pas de choix rétroactif (Task1).

### Task1: Règles, moteur et sauvegarde

**Files:** Create src/rewards.ts, tests/rewards.test.ts ; modify src/game.ts,
src/checkpoints.ts, tests/boss-016.test.ts (omettre métadonnées rewards du hash legacy),
tests/game.test.ts (renoncer dans les campagnes historiques sans bonus).
**Interfaces:** RewardId = renfort-bouclier|renfort-ninja|renfort-raptor|miel|cristal|pieces.
RewardState={seed:number,pending:4|8|null,choices:{milestone:4|8,id:RewardId|'skip',used:boolean}[],ward:number}.
rewardOffer(seed:number,milestone:4|8):RewardId[] ; readRewards(raw:unknown,wave:number):RewardState|null.
Game.rewards ; Game.chooseReward(id:string):boolean ; skipReward():boolean ;
get rewardOffer():RewardId[] ; get feastDuration():number ; recruitCost(kind:Kind):number.

- [ ] Écrire tests du déclenchement4/8 réel, trois cartes uniques, refus avant choix,
      choix unique/forgé/pause, RNG du combat inchangé par offres et renoncement.
- [ ] Exécuter node --experimental-strip-types --test tests/rewards.test.ts ; FAIL attendu API absente.
- [ ] Implémenter règles pures et intégration : bon utilisé seulement après canRecruit,
      18points absorbés ordinaires mais pas roi, +4s au vrai offerFeast, +100pièces une fois.
- [ ] Écrire puis voir échouer tests checkpoint avant/après choix/placement, v1/v2,
      offre incohérente, doublon, protection hors bornes, invalidation du camp rempli.
- [ ] Implémenter v3, restaurer état validé séparément du RNG du combat.
- [ ] Exécuter tests ciblés puis npm test ; tous PASS attendus. Aucun git présent : snapshot de0.16 conservé.

### Task2: Panneau de choix et bons visibles

**Files:** Create src/ui/rewardControls.ts, tests/rewards-browser.mjs,
scripts/rewards-browser.mjs ; modify index.html, src/style.css, src/ui/controls.ts,
src/ui/feastControls.ts. Add package test:rewards script/version0.17.
**Interfaces:** bindRewardControls(session:Session,refresh:()=>void):()=>void ;
consomme les API Task1, n'applique aucun effet indépendamment de Game.

- [ ] Écrire scénario navigateur avec campv3 en attente issu du vrai moteur ;
      vérifier3cartes, start désactivé, reload identique, dialogue/pause/focus, prix offert,
      placement légal et rechargement sans duplication, formats320/390px, capture d'écran.
- [ ] Exécuter scénario avant UI ; FAIL attendu panneau absent.
- [ ] Implémenter DOM stable, styles3colonnes/1colonne mobile, focus unique, boutons
      44px, état du bon dans prix/aria/catalogue, indicateurs miel/protection/bons.
- [ ] Exécuter scénario web et portable après builds ; PASS attendu sans erreur navigateur.

### Task3: Simulations et livraison

**Files:** Modify scripts/balance-lab/core.ts+profiles.ts (politiques via commandes
publiques), extend Job avec rewardPolicy skip|reinforcement|honey|crystal|coins|adaptive.
Add scripts/rewards-balance.mjs, docs/BONUS-0.17.md, reports/balance-0.17/.
**Interfaces:** même runCampaign(job), enregistre choix et état final, achats gratuits
tracés avec coût réel0 ; défaut ancien du labo = skip pour préserver son sens.

- [ ] Tester qu'une campagne passe les jalons sans blocage et trace les choix ; FAIL puis PASS.
- [ ] Comparer contrôle skip et cinq politiques, huit profils, seize graines nouvelles
      (offset64..79 du générateur historique), soit768campagnes, trois workers maximum.
      Conserver tous résultats/empreintes ; ne pas masquer pertes ni retoucher selon validation.
- [ ] npm run verify, build:portable, browser web/portable, interface web/portable,
      test:rewards web/portable, presentation et render ; tous PASS attendus.
- [ ] Relecture finale indépendante avec spec/plan/focus et résultats ; corriger les
      problèmes importants et vérifier, conserver les limites mineures dans le bilan.
- [ ] Livrer archives jouable/sources, rapport et aperçu ; liens HTTPS retéléchargés
      et SHA/ZIP/HTML testé identiques avant réponse finale.
