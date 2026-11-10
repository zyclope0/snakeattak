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

### Task 1: Accueil, navigation courte et carnet par mission

**Files:**

- Create: `src/ui/homeNavigation.ts`, `src/ui/mobileMenus.css`
- Modify: `index.html`, `src/ui/menu.ts`, `src/ui/expeditions.ts`, `src/ui/capriceAlbums.ts`, `src/ui/caprices.css`, `src/bootstrap.ts`, `src/i18n/en.ts` (ou catalogue de traduction réel)
- Test: `scripts/mobile-menus-037-browser.mjs`, `package.json`, tests navigateur existants touchés

**Interfaces:**

- Consumes: contrôleurs menu/expeditions/albums, `missions.state.activeMode` existant.
- Produces: `bindHomeNavigation(): { show(page: HomePage, focus?: boolean): void }`,
  `HomePage = 'home' | 'missions' | 'classic' | 'parents' | 'favorites'`.
  Le contrôleur manipule uniquement la visibilité/focus ; pas de persistance.
- Produces: bouton `#home-primary`, commande contextuelle qui délègue aux handlers
  existants de reprise mission/classique ou préparation, sans recopier lancement.

- [x] Écrire la recette ciblée RED : accueil 780×360 sans scroll, une commande
      primaire ; modes mission/classique conservés après aller-retour/rechargement ;
      carnet six IDs visibles et mission suivante six autres, retour et langue ;
      gestion masquée par défaut, renommage/sélection du bon carnet.
- [x] Exécuter la recette et constater l'échec attendu avant implantation.
- [x] Implémenter les vues courtes, retour visible et focus. Carte six missions,
      favoris paginés si besoin, options parents/classique sur leurs propres vues.
      Garder IDs existants quand possible, aucun faux clic vers contenu caché.
- [x] Implémenter carnet une mission par page, gestion repliée, familles explicites,
      six stickers maximum, limites de pagination, sélection stable au rafraîchissement.
- [x] Traduire les nouvelles commandes et adapter les parcours existants affectés
      par la navigation, sans supprimer leurs vérifications comportementales.
- [x] Vérifier recette ciblée, `npm run verify`, `npm run test:browser`.
      Captures avant/après externes et rapport avec mesures et limites.
- [x] Commit du lot et rapport complet dans le workspace SDD.

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

- [x] Étendre RED : résumé et départ visibles, caprices/copains accessibles et
      protégés FR/EN ; changement de caprice garde les contraintes ; nouveau
      tirage/réessai conservent révision et contenu attendu.
- [x] RED catalogue : ouvrir pendant combat fige le temps, six cartes maximum,
      filtre/page atteignent tous les alliés, choix ferme sans dépenser puis
      placement achète normalement ; manuelle/reouverture/dialogue imbriqué/
      arrière-plan ne relancent pas le temps intempestivement.
- [x] Implémenter vues de préparation et résumé reflétant caprice, copains,
      budget, carnet, terrain ; repérage/options accessibles sans longue page.
      Commandes de lancement/retour fixes, aucune règle ou valeur dupliquée.
- [x] Transformer catalogue en écran modal six cartes avec titre/filtres/pages
      fixes. Garder dock quatre alliés et deux miels en temps réel. Utiliser
      les baux de pause existants et préserver l'état au choix/fermeture.
- [x] Traduire et adapter recettes affectées sans affaiblir leurs assertions.
- [x] Vérifier tests ciblés, verify, browser, caprices, locale ; rapport et commit.

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
