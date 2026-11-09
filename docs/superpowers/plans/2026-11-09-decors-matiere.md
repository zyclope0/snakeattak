# Décors et matière — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Le parent délègue l’exécution ; conseil six personas après ce lot.

**Goal:** Mettre en valeur les fonds fournis, les chemins et les renforts sans modifier le jeu.

**Architecture:** Décor dans render/, atlas dans art.ts ; surfaces des commandes dans ui/. Les règles et la géométrie restent inchangées. Un cadre choisi par terrain, chargé à la demande et rendu une fois dans le cache.

**Tech Stack:** Phaser3, TypeScript, Vite, CSS, exports WebP locaux, aucune dépendance ajoutée.

**Spec:** docs/superpowers/specs/2026-11-09-decors-matiere-design.md

## Global Constraints

- Branche isolée feat/craft-terrain-034, base1b1e6c4 ; application0.34.0/code42.
- Aucun changement moteur, sauvegarde, RNG, code de départ, obstacles ou gameplay.
- Origine des images conservée ; pas de génération payante, SDK, nouveau lieu/règle.
- HTML32KiB, JSjeu200000 ; chargement progressif maintenu.

## Review Focus

- Le marais gravé ne doit pas remplir le centre ni créer de faux obstacle.
- Un ancien camp et un code gardent la même carte et le même combat.
- Changement de chapitre : cadre utile prêt avant rendu, sans textures futures au menu.
- Les ponts restent au-dessus du ruisseau, aux positions actuelles, sous les unités.
- Aucun bouton/contour ni contraste de sélection ne disparaît sur petit tactile.

### Task 1 — lot graphique et conseil

**Files:** art.ts, render/stageLayout.ts, refinedTerrain.ts et nouveau helper de cadre ; ui/craftSurfaces.css et battleDock.ts. Deux WebP dérivés, script d’export et manifeste de provenance. tests/craft-scenery-034.test.ts, scripts/craft-034-browser.mjs ; versions et docs.

**Interfaces:** stageTheme(level) ajoute scenery:string|null sans modifier ground ; MissionAssets lit cette clé dans texturesForGame. SCENERY_ART garde GROUND_ART à ses trois indices historiques. Cadre périphérique lu par refinedTerrain avant routes et accessoires.

- [ ] Capturer site et six terrains avant ; enregistrer les états et la géométrie dans une recette reproductible.
- [ ] Test rouge du choix de cadre et de son absence au bosquet ; export local des deux sources sans changer les PNG.
- [ ] Implémenter cadre/pavés/surfaces, rendre le test vert et vérifier le rendu à1280×800,1366×768,812×375,780×360 et375×812.
- [ ] Comparer états avant/après, besoin de textures, Canvas/WebGL, routes et obstacles ; verify/browser/audit/interface/mobile/scroll/offline verts.
- [ ] Conseil six personas après lot ; corrections nécessaires, bilan/plan à jour et commit.
- [ ] Construire APK normal, inspecter identité/version/fichiers ; publier le build exact et vérifier le site ; pousser branche/PR privée.
