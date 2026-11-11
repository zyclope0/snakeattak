# La Conquête des Serpents — instructions pour Claude Code

@AGENTS.md

`AGENTS.md` (importé ci-dessus) a été écrit pour Codex ; ses règles valent aussi pour toi.
Sa section « Priorités d'implémentation » est historique : la migration du prototype V4 est finie.

## Avant un nouveau chantier

Lis `docs/PASSATION-CLAUDE-CODE.md` : état du projet au 10 novembre 2026, décisions prises,
audit, équilibrage, publication, travail à faire. Puis `docs/PLAN-ACTUEL.md` et
`GAME_DESIGN.md`. `docs/README.md` liste les documents vivants ; le reste est dans `docs/archive/`. L'audit complet est dans `docs/passation/AUDIT-2026-11.md`.

## Ce qui ne se discute pas

- Le jeu est inventé par un enfant. Ses règles (voir `AGENTS.md` et `GAME_DESIGN.md`) ne changent
  pas sans son accord et celui du parent : soldats autonomes, achat avec les récompenses, œufs
  qui éclosent, roi à trois têtes, serpents qui cherchent la voie la moins défendue, pas de
  résurrection.
- Les noms et les annonces des 36 défis (`src/caprices.ts`) viennent du fils : mot pour mot, en
  français, même dans l'interface anglaise.
- Toute nouvelle valeur d'équilibrage passe par une mesure (`npm run balance:caprices`,
  `npm run balance:modes`) puis par l'accord du parent. Elle s'ajoute comme nouvelle révision
  (`src/balanceRevision.ts`) : les anciens codes de départ et les anciennes sauvegardes gardent
  leurs règles et restent lisibles.
- Demande au parent avant : fusion dans `main`, publication, dépense (crédits d'images compris),
  identifiant d'application, réécriture de l'historique Git, ajout d'un SDK ou d'un appel réseau.
- Public de 6 à 10 ans : pas de prénom d'enfant imposé, aucune collecte, aucun serveur ; ni
  hasard payant, ni minuteur, ni récompense de retour, ni classement entre enfants.

## Interface

- Tutoiement, phrases courtes, un mot d'enfant plutôt qu'un chiffre technique.
- Tout texte en français et en anglais (`src/i18n`), `npm run test:locale` vert.
- Cibles tactiles de 48 px au moins ; contrôler en paysage téléphone 780×360 et 812×375, et sur
  ordinateur 1280×800.
- Direction artistique pâte à modeler / papier mâché ; les textes du plateau dans la police du jeu.

## Commandes

- `npm run verify` : format, tests unitaires, build. Obligatoire avant toute livraison.
- `npm run test:browser` et `npm run test:audit` : recette navigateur et audit d'interface
  (une fois : `npx playwright install chromium`).
- `npm run balance:caprices`, `npm run balance:modes` : parties simulées sur le vrai moteur.
- `npm run android:apk:debug` : APK de test ; version dans `package.json` et
  `android/app/build.gradle` ensemble.

## Méthode

- Une branche par lot (`claude/<sujet>`), une PR vers `main`, jamais de fusion sans accord.
- Les règles restent dans `src/game.ts`, `src/engine/` et les modules de règles, jamais dans le
  rendu ni le HTML. `tests/engine-traces.test.ts` rejoue des parties entières : une empreinte
  qui change est une partie qui change.
- Compte rendu court par version dans `docs/BILAN-<version>.md` : ce qui est fait, comment c'est
  vérifié, ce qui ne l'est pas. Mets à jour le haut de `docs/PLAN-ACTUEL.md`.
- Le dépôt a été allégé de 671 à 103 Mo le 11 novembre 2026 (`docs/ARCHIVES.md`) : n'ajoute ni
  capture ni rapport volumineux dans Git ; les recettes écrivent dans `artifacts/`. Pas de « conseil de personas » simulé.
- Dis toujours ce qui n'a pas été essayé sur le vrai téléphone ou avec les enfants.
