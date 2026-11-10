# Caprices — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Rendre jouables les 36 défis existants, points 1–8, sans changer leur moteur.
**Architecture:** Contrôleurs UI et lectures pures ; checkpoint 8, code 3 et enveloppe 4 ajoutent du contexte sans modifier le combat. Carnets indépendants, campagne partagée.
**Tech Stack:** Phaser 3, TypeScript, Vite, HTML/CSS, Capacitor.
**Spec:** `docs/superpowers/specs/2026-11-09-caprices-interface-design.md` et `docs/CAPRICES.md`.

## Global Constraints

- Base c886b82/claude/caprices, branche feat/caprices-interface ; pas de fusion/publication.
- game.ts/caprices.ts/missions.ts inchangés, aucune règle/valeur/RNG modifiée.
- Noms/annonces du fils exactement français dans les deux langues.
- Carnets séparés par enfant ; campagne familiale partagée (réponse du parent).
- Pas de réseau/SDK/pub/achat/génération payante ; voix locale facultative.
- Préserver sauvegardes 1–7, codes1/2, enveloppes1–3 et budgets de build.

## Review Focus

- Choix vide/partiel et massues initiales : aucune nouvelle restriction de moteur.
- Caprice/carnet différents sur le même départ : pas de mélange de réessai ou attribution.
- Import/export ancien ou malformé, stockage bloqué : pas d'effacement partiel.
- Réserve, miel absent et carapace : UI décrit exactement le moteur sans le modifier.
- Petit paysage/marges, annonces longues, bascule FR/EN : commandes accessibles et textes du fils préservés.

### Task 1: Checkpoint et départ caprice

**Files:** src/checkpoints.ts, src/departures.ts, tests/caprices-persistence-036.test.ts.
**Interfaces:** encodeCheckpoint/decodeCheckpoint inchangées ; encodeDeparture/decodeDeparture inchangées, code 3 caprice en plus. Aucun champ de profil dans le code.

- [x] Tests rouges : les36MissionRun complets, nouveau checkpoint 8 avec choix0/1/2, rejet doublons/inconnus/héros/limites ; ne pas inférer les choix des anciens camps6/7 à caprice depuis les survivants ; ancienne lecture1–7 et codes1/2 inchangés.
- [x] Implémenter checkpoint 8 et restauration par chooseCapriceKinds, code 3 suffixé et checksum complet ; aucun changement moteur.
- [x] Tests ciblés, suite globale, types/build ; commit et revue du périmètre.

### Task 2: Carnets et enveloppe familiale

**Files:** src/capriceAlbums.ts (nouveau), src/familyBackup.ts, src/familyPersistence.ts, src/missionProgress.ts, tests/caprices-albums-036.test.ts.
**Interfaces:** createCapriceAlbumsController(initial?) avec state, add(name), select(id), rename(id,name), beginRun(profileId?), record(game), has(capriceId,profileId?), replaceState(state). State version 1, activeId, nextId, campProfileId, children[{id,name,completed[]}]. validateCapriceAlbums(value), createCapriceAlbums(). writeFamilyBackup(..., albums?) et family.sync(..., albums?) quatrième argument facultatif, propriété albums en enveloppe 4. MissionProgress mêmes signatures ; sameRun comprend caprice, record conserve sa règle existante de meilleures étoiles partagées, y compris en caprice.

- [x] Tests rouges : profils indépendants, attribution conservée après changement/reprise, victoire réelle une fois sans classement, défaite sans récompense ; identité caprice au retry ; propriétaire A conservé après choix du carnet B, classique, recharge et reprise de l’expédition.
- [x] Implémenter état borné/validé (8carnets max,24caractères de petit nom,36succès max chacun), pas d'horloge/RNG ; enveloppe 4 atomique et ancien appel omis préserve les albums.
- [x] Tests import1–4/camp sans carnet, données corrompues et stockage refusé ; suite/types/build ; commit et revue.

### Task 3: Préparation, copains, collection et résultat

**Files:** nouveaux src/ui/{capriceView,capriceCopy,capriceAlbums,capriceSpeech,capriceBudget}.ts et caprices.css ; intégration src/ui/{expeditions,controls,battleDock,dockModel,campToolModel,feastControls,hud,battleResult,squadControls}.ts, src/render/{resultCopy,actors,capriceShell}.ts, bootstrap.ts, i18n/dictionaries/caprices.en.ts + english.ts ; tests caprice-readouts-036.test.ts, caprices-036-harness.ts et scripts/caprices-036-browser.mjs ; index.html si budget le permet.
**Interfaces:** actions.launch(run,kinds?) ; bindExpeditions(..., albums?) facultatif pour anciennes fixtures. Helpers UI lisent les règles ; API moteur existante appelée sans la changer. Carnet UI se lie depuis bootstrap et garde owner au lancement. Les nouveaux nœuds peuvent être créés au bind pour garder HTML<32768.

- [x] Tests rouges : rangées/étoiles, code verrouillé, copains permis/seuils de réserve/miel, création/coquille sans mutation ; vrais titres FR en modeEN.
- [x] Implémenter cases ouvertes/fermées, mission normale, sélection/désélection, relance/retry/code conservant caprice ; voix locale opt-in facultative.
- [x] Brancher choix des copains avant refresh, filtres dock/catalogue, réserve HUD/actions ; owner et persistence/export/import albums dans bootstrap.
- [x] Carnet36cases par profil, victoire/répétition/défaite, accès au carnet résultat ; coquille procédurale et silhouette agrandie sans collision.
- [x] Compléter l'anglais des commandes/explications, déclarer les identités françaises protégées dans l'inventaire et utiliser data-copy-raw/lang=fr dans le DOM.
- [x] Recette normale et contrôlée aux formats prescrits, migrations/codes/stockage, clavier/tactile, pause/bascule/reprise ; suite/types/build ; commit et revue.

### Task 4: Vérification, conseil et livraison

**Files:** package/lock/Android version0.36.0/code46, docs/BILAN-0.36.0.md, docs/CONSEIL-0.36.0.md, docs/PLAN-ACTUEL.md et docs/CAPRICES.md, reports/suivi-0.36.0, captures.

- [x] npm run verify et npm run test:browser verts ; recettes caprices, locales, hors-ligne, missions/régressions, codes, interruption/enfant adaptées, aucune ancienne preuve écrasée.
- [x] Inspection visuelle des formats/carapaces/réserve/annonces ; différencier états contrôlés et jeu réel. Vérifier les empreintes du moteur figé et les budgets.
- [x] Revue finale fraîche et conseil6personas (3techniques, cibles6/9/12 simulées), corriger les importants avec reproduction, mineurs documentés.
- [x] APK debug normal même certificat/AppID, inspection paquet et web ; aucune publication. Branche poussée, PR vers claude/caprices si possible, sans fusion.
- [x] Compte rendu8points · preuve · tests/comptes · limites/arbitrages ; STOP pour l'essai du parent.
