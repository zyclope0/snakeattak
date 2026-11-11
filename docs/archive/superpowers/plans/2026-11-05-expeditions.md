# Expéditions et préparation Android Implementation Plan

> Exécution autonome autorisée ; domaines indépendants confiés aux agents, intégration et revue par le principal.

**Goal:** Six missions rejouables avec détachements neufs et parcours différents.
**Architecture:** Contexte optionnel de mission dans le moteur local ; géométrie partagée ; progression versionnée ; enveloppe Android sans réécriture.
**Tech Stack:** TypeScript strict, Phaser 3, Vite, Node 24, Playwright, Capacitor.
**Spec:** docs/superpowers/specs/2026-11-05-expeditions-design.md

## Global Constraints

Esprit du fils inchangé : alliés autonomes, trois voies, œufs, aucun mort ressuscité
pendant une mission, boss trois têtes réservé à l'aventure classique pour cette
première région. Aucun secret, serveur ou dépendance réseau pour jouer.

## Review Focus

- Basculer classique/missions n'efface pas l'ancien camp.
- Réessayer restitue configuration et graine ; nouvelle variante change réellement.
- Un fichier invalide/import refusé ne détruit pas la session.
- Chaque géométrie permet trois voies/jonctions sans blocage.
- Une sauvegarde avant victoire ne donne aucune étoile ou mission débloquée.

### Task 1 — Moteur des six missions

- [x] Écrire tests missions/game/checkpoint, observer RED.
- [x] Implémenter missions.ts + contexte Game optionnel + checkpoint v5 ; classiques inchangés.
- [x] Valider durée/budget/déblocages et tests ; conseil moteur.

### Task 2 — Trois terrains réellement différents

- [x] Tests RED sur courbes, jonctions et chemins.
- [x] Géométrie partagée levels/routes/navigation/rendu ; classic byte-behavior conservé.
- [x] Valider chaque voie et obstacle ; conseil terrain.

### Task 3 — Progression et transfert familial

- [x] Tests RED progression6missions, reprise, camp classique séparé, migration.
- [x] Modèle pur et stockage coordonné dans enveloppe familiale versionnée.
- [x] Valider victoire seulement, importer ancien/nouveau, quota et changement de mode.

### Task 4 — Carte, aperçu et parcours joueur

- [x] Test navigateur manque de carte/aperçu puis implémentation DOM séparée.
- [x] Carte six missions, préparation, retry même graine, nouveau tirage, nextmission.
- [x] Contrôler écrans petits, clavier, styles existants et modes classique/missions.

### Task 5 — Android

- [x] Vérifier documentation actuelle et compatibilité ; consigner décision de moteur.
- [x] Préparer enveloppe native synchronisable, scripts et guide Android sans publication.
- [x] Vérifier build web, sync natif et déclarer limites SDK/signature/appareil physique.

### Task 6 — Équilibrage, revue et livraison

- [x] Simulations multi-graines/politiques/configurations ; corriger déséquilibres démontrés.
- [x] Revue fraîche et conseil cinq regards ; corriger défauts importants.
- [x] Suite native, builds, QA web/portable, sauvegarde et Android.
- [x] Publier build exact, préserver audience privée et fournir archives vérifiées.
