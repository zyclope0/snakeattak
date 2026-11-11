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

- [ ] Écrire la recette ciblée RED : accueil 780×360 sans scroll, une commande
      primaire ; modes mission/classique conservés après aller-retour/rechargement ;
      carnet six IDs visibles et mission suivante six autres, retour et langue ;
      gestion masquée par défaut, renommage/sélection du bon carnet.
- [ ] Exécuter la recette et constater l'échec attendu avant implantation.
- [ ] Implémenter les vues courtes, retour visible et focus. Carte six missions,
      favoris paginés si besoin, options parents/classique sur leurs propres vues.
      Garder IDs existants quand possible, aucun faux clic vers contenu caché.
- [ ] Implémenter carnet une mission par page, gestion repliée, familles explicites,
      six stickers maximum, limites de pagination, sélection stable au rafraîchissement.
- [ ] Traduire les nouvelles commandes et adapter les parcours existants affectés
      par la navigation, sans supprimer leurs vérifications comportementales.
- [ ] Vérifier recette ciblée, `npm run verify`, `npm run test:browser`.
      Captures avant/après externes et rapport avec mesures et limites.
- [ ] Commit du lot et rapport complet dans le workspace SDD.

