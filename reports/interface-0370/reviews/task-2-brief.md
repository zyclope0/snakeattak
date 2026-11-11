# Interface mobile courte Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer les huit choix validés côté interface, sans changer les parties.

**Architecture:** Vues HTML/CSS courtes autour des contrôleurs existants. Les
modes et sauvegardes gardent leur autorité ; les pauses passent par les baux UI.
Les nouvelles vues n'écrivent aucune règle. Assets actuels, devis payant séparé.

**Tech Stack:** TypeScript strict, Phaser 3, Vite, HTML/CSS, Capacitor, Playwright.

**Spec:** docs/superpowers/specs/2026-11-10-interface-mobile-0370.md

## Global Constraints

- Aucun changement moteur, RNG, règles, valeurs, format ou identité Android.
- Noms/annonces des 36 défis exacts en français, doublons par ID préservés.
- Carnets séparés, campagne familiale partagée, anciens codes/sauvegardes lisibles.
- Nouvelles commandes FR/EN, cibles tactiles ≥48 px, safe areas préservées.
- Six cartes maximum par page au carnet et au catalogue ; dock quatre favoris.
- Catalogue : pause automatique, restauration de la pause manuelle/arrière-plan.
- Pas d'appel payant, SDK, serveur ni ajout de mécanique.
- Preuves lourdes hors Git ; historique et preuves existants préservés.

## Review Focus

1. Deux modes sauvegardés : reprendre le mode actif sans perdre l'autre (lot 1).
2. Changer de carnet/page/langue : six bons IDs, texte fils exact (lot 1).
3. Changer caprice/mission/reprise : copains légaux et code identique (lot 2).
4. Catalogue imbriqué/rotation/arrière-plan : pas de reprise intempestive (lot 2).
5. Petit paysage avec safe areas : sortie, pages et commandes accessibles (lot 3).

---

### Task 2: Préparation courte et catalogue paginé en pause

**Files:**
- Modify: `src/ui/expeditions.ts`, `src/ui/capriceView.ts`, `src/ui/reinforcementsDrawer.ts`, `src/ui/controls.ts`, `src/ui/mobileMenus.css`, `index.html`, traductions
- Create: `src/ui/missionPreparation.ts`, `src/ui/catalogPages.ts`
- Test: `scripts/mobile-menus-037-browser.mjs`, recettes caprices/locale touchées,
  tests unitaires pertinents de pause/pagination

**Interfaces:**
- Consumes: `bindHomeNavigation` du lot 1, `pauseForDialog`, `pauseStateFor`,
  `canLaunchCaprice`, choix/restrictions existants, cartes `[data-kind]` du shop.
- Produces: `bindMissionPreparation(dialog: HTMLDialogElement): { show(view: PreparationView): void; reset(): void }`
  où `PreparationView = 'summary' | 'caprices' | 'friends' | 'scouting' | 'options'`.
- Produces: `bindReinforcementsDrawer(session: Session, refresh: () => void): { refresh(): void }` ;
  l'appel existant dans controls reçoit ces deux arguments. Catalogue modal réel
  pour focus/Escape ; les règles d'achat restent contrôlées par Session/Game.
- Produces: pagination de présentation sur cartes filtrées, page remise à zéro
  au changement de filtre, bornée après déblocage, sans altérer disponibilité.

- [ ] Étendre RED : résumé et départ visibles, caprices/copains accessibles et
      protégés FR/EN ; changement de caprice garde les contraintes ; nouveau
      tirage/réessai conservent révision et contenu attendu.
- [ ] RED catalogue : ouvrir pendant combat fige le temps, six cartes maximum,
      filtre/page atteignent tous les alliés, choix ferme sans dépenser puis
      placement achète normalement ; manuelle/reouverture/dialogue imbriqué/
      arrière-plan ne relancent pas le temps intempestivement.
- [ ] Implémenter vues de préparation et résumé reflétant caprice, copains,
      budget, carnet, terrain ; repérage/options accessibles sans longue page.
      Commandes de lancement/retour fixes, aucune règle ou valeur dupliquée.
- [ ] Transformer catalogue en écran modal six cartes avec titre/filtres/pages
      fixes. Garder dock quatre alliés et deux miels en temps réel. Utiliser
      les baux de pause existants et préserver l'état au choix/fermeture.
- [ ] Traduire et adapter recettes affectées sans affaiblir leurs assertions.
- [ ] Vérifier tests ciblés, verify, browser, caprices, locale ; rapport et commit.

