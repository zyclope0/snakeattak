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

### Task 3: Cohérence graphique, recette intégrée et version Android

**Files:**
- Modify: `src/ui/mobileMenus.css`, `src/ui/craftSurfaces.css`, `src/style.css` (seulement raccords), `package.json`, `package-lock.json`, `android/app/build.gradle`
- Modify: tests navigateur affectés ; `docs/PLAN-ACTUEL.md`
- Create: `docs/BILAN-0.37.0.md`, `docs/CONSEIL-0.37.0.md`, `reports/interface-0370/README.md`, reçus compacts

**Interfaces:**
- Consumes: vues/navigation/pauses des lots 1 et 2 ; aucune nouvelle interface moteur.
- Produces: version 0.37.0/code 49 ; preuves externes et index compact ; conseil
  simulé pour chacun des trois lots. Pas de nouveau visuel payé.

- [ ] Ajouter assertions intégrées de géométrie/toucher/focus pour 1280×800,
      812×375, 780×360 safe areas, 568×320 et portrait ; aucune sortie coupée.
- [ ] Harmoniser matières CSS papier/crème/vert/ocre, relief discret, états
      sélection/désactivé/focus ; textes nets, mouvement réduit, pas de lourds
      filtres. Relire les captures réelles et corriger chevauchements.
- [ ] Adapter recettes historiques obsolètes au nouveau chemin sans enlever
      leurs objectifs (sauvegarde, reprise, critères tactiles et traductions).
- [ ] Passer version/code ensemble ; vérifier verify, browser, audit,
      child-mobile, locale, caprices, family, mission-journey et mobile-menus.
      Préserver les anciens rapports : copier les nouveaux hors Git avant de
      restaurer les outputs historiques suivis, consigner commandes/nombres.
- [ ] Construire APK debug, vérifier identité/certificat/manifest et égalité
      assets web ; préparer portable et preuves hors ligne locales selon outils
      existants. Pas d'affirmation physique S24.
- [ ] Écrire bilan, conseils simulés, mesures avant/après et limites, reçu compact.
      Contrôle que tous les fichiers moteur/persistance sont identiques au BASE.
- [ ] Commit et rapport de lot ; revue globale ensuite par le coordinateur,
      puis push/fusion/publication autorisés uniquement après qualité verte.
