# Corrections v0.26.0

Les huit points du brief sont livrés dans l'ordre, avec un commit par point après
le commit de référence des sources 0.25.0. `npm run build` a passé après chaque
point ; la version web et la version Android sont 0.26.0 (versionCode 26).

1. La pause utilise uniquement `#pause-overlay`. L'écran Phaser reste réservé à
   la victoire et à la défaite.
2. Les serpents portent un contour #D2552D de 7 px, entouré d'un liseré clair de
   9 px, contre 3 et 4 px pour les alliés. Ces valeurs sont en coordonnées du jeu.
   Le vert foncé des alliés et les images existantes sont conservés.
3. Un ruisseau continu traverse le plateau. Les berges se superposent en formes
   arrondies ; les trois ponts restent à (528,180), (528,324), (528,468).
4. À 812×375, le canvas mesure environ 587×331 : 88,3 % de la hauteur et 72,3 %
   de la largeur. Le HUD tient sur 44 px ; mission et encounter sont masqués.
   Le tiroir des renforts se ferme après sélection, par son bouton, le fond ou
   Échap. Les cadeaux de chapitre restent accessibles, ainsi que l'accueil pour
   reprendre/rejouer ou choisir la mission suivante.
5. MainActivity demande `sensorLandscape`. Le web tactile en portrait affiche
   « Tourne ton téléphone » et maintient la pause, y compris si un dialogue se
   ferme ou si la session change. Une pause volontaire est conservée à la rotation.
6. Le CSS fixe `#game`, indépendamment du canvas. Un ResizeObserver rafraîchit
   Phaser et se débranche à la destruction du jeu.
7. Les atlas nécessaires aux unités disponibles, survivants et ennemis de la
   vague sont chargés avec le seul fond courant, puis complétés à la demande.
   Le combat attend ces images ; progression et réessai restent accessibles.
   Les aperçus des autres chapitres demandent leurs fonds au survol/focus.
8. Un nouveau tirage évite toujours le terrain précédent. Reprendre un camp ou
   un code conserve son terrain et sa graine. L'initialisation d'une session
   utilise Web Crypto ; aucun `Math.random` ne reste dans `src/`.

## Vérification

- `npm run verify` : format, **364 tests**, types, build et budgets de taille.
- `npm run test:browser` : ordinateur, tactile paysage, portrait, recrutement,
  pause, reprise, sons, miels et rechargement du camp, sans erreur JavaScript.
- `npm run test:corrections` : 1280×800, 812×375, 375×812 ; contours, rivière,
  pause unique, victoire/défaite, tiroir, cadeaux, rotation, resize du conteneur
  sans événement window, chargement en échec/réessai/changement de carte,
  25 tirages successifs et anciennes sauvegardes v1 à v6.
- `npm run test:departures` : anciens codes, 108 configurations, confirmation,
  reprise, copie et saisie tactile après rotation.
- `npx cap sync android` après le build : fichiers web embarqués synchronisés.
- Formats des sauvegardes et décodeurs conservés. La suite vérifie notamment
  PV, survivants, stocks médicaux et reprise des formats précédents.

Le contrôle réseau du refuge relève 12 images distinctes, interface comprise,
soit 6 250 486 octets de fichiers source, contre 17 images / 8 424 000 octets
dans le build complet. Les atlas de rang supérieur et les autres fonds ne sont
pas demandés dans ce scénario. Ce sont des tailles de fichiers, pas une mesure
de trafic facturé, de mémoire GPU ou de débit sur téléphone.

La revue indépendante a reproduit deux défauts supplémentaires : perte du
réessai après carte en échec → carte en cache → retour, et reprise intempestive
après fermeture d'un dialogue en portrait. Les deux ont un scénario de régression.

Captures : `artifacts/corrections-026/` (non versionnées). Résultats synthétiques :
`reports/verification-0.26.json` et `reports/departures-0.26.json`.

## Fichiers modifiés ou ajoutés

- Rendu : `src/render/BattleScene.ts`, `src/render/actors.ts`,
  `src/render/refinedTerrain.ts`, `src/render/boardResize.ts`,
  `src/render/missionAssets.ts`.
- Interface : `index.html`, `src/style.css`, `src/main.ts`, `src/ui/controls.ts`,
  `src/ui/menu.ts`, `src/ui/orientation.ts`, `src/ui/reinforcementsDrawer.ts`.
- Départs : `src/missions.ts`, `src/session.ts`.
- Version/build : `package.json`, `package-lock.json`, `vite.config.ts`,
  `android/app/build.gradle`, `android/app/src/main/AndroidManifest.xml`.
- Tests : `scripts/corrections-026-browser.mjs`,
  `scripts/departures-025-browser.mjs`, `tests/browser.mjs`,
  `tests/stage-023-harness.ts`, `tests/mission-reroll-026.test.ts`.
- Documentation/preuves : `README.md`, `docs/ARCHITECTURE.md`, `docs/ANDROID.md`,
  ce bilan, `docs/superpowers/plans/2026-11-07-v026-corrections.md`,
  `reports/verification-0.26.json`, `reports/departures-0.26.json`.

## Limites

Tests tactiles et rotations réalisés dans Chromium avec émulation, sans appareil
physique. Aucun APK/AAB construit ou signé, aucune publication Android ou du site.
Pas de génération d'assets ni d'appel payant. Le ruisseau est un décor : navigation,
positions des ponts, combats et équilibrage restent conservés. La seule nouvelle
règle concerne le choix du terrain d'un nouveau départ.
