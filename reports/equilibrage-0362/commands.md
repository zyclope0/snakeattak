# Commandes et provenance des preuves

Toutes les recettes sont sérialisées. Exécution actuelle :
`artifacts/equilibrage-0362/task3/commands.json` et `commands-remaining2.json`.
Chaque entrée indique commande, code de sortie, durée et log ; les dossiers
`generated/` conservent les nouveaux résultats avant restauration des chemins
historiques. Les essais rouges ne sont pas remplacés par les verts.

| Étape | Commande / source | Portée |
| --- | --- | --- |
| Vérification fraîche | `npm run verify` | 543 tests, zéro échec, format/types/build/budgets |
| Navigateur frais | `npm run test:browser` | Production desktop/tactile |
| Prix/guide | `BALANCE_UI_CASE='production prices/guide/code' node scripts/equilibrage-0362-browser.mjs` | Ancien390/nouveau340 T-rex réellement capturés ; trois prix et révisions strictement vérifiés |
| Catalogue tactile | `npm run test:reinforcements-scroll` | Cinq tailles + desktop ; helper limité à l’intersection visible après diagnostic, assertions natives conservées |
| Recettes restantes | `test:threat-preparation`, `test:child-mobile`, `test:presentation`, `test:tactical-clarity`, `test:audit` | Présentation14scénarios ; tactique3formats ; audit13/13 ; zéro erreur |
| Captures contextualisées | `BALANCE_UI_CASE='delivery viewport' node artifacts/equilibrage-0362/task3/capture-contextual-prices.mjs` | Copie QA, mêmes assertions 1280×800/780×360/812×375, révisions1/2 |
| Portable et hors ligne | `node artifacts/equilibrage-0362/task3/portable-check.mjs` | Build portable séparé ; quatre démarrages froids FR/EN, normal hors ligne et file:// |
| APK normal | `python3 artifacts/equilibrage-0362/task3/android-package.py` | Sync puis Gradle offline, sans daemon, deux workers ; inspection de chaque fichier dist |

Preuves antérieures réutilisées, sans prétendre les avoir rejouées :
Task2 `09aaae9`, recettes langue (930 phrases, 24 liaisons, 392 contrôles),
caprices (281 contrôles/39 captures), missions et régressions, famille,
hors ligne, interruptions, mobile et départs. Matrice rappel complète initiale,
compléments puis réparation/formation avec revenus masquant la dépense :
15 cas couverts par étapes, avec horloge native 10s/4s/×2, FR/EN,
1280×800/780×360/812×375 et portrait375×812. Les données des fixtures sont
étiquetées ; aucune performance Android physique déduite.
`task3/source-reuse.json` prouve que toutes les sources de production Task2
restent identiques à leur dernière revue. Seule l’extension QA du guide change
son script ; la copie de captures n’est pas distribuée.

Simulations réutilisées :

- `node scripts/caprices-lab.mjs artifacts/equilibrage-0362/actual-core/candidates.json artifacts/equilibrage-0362/actual-core/five-r2.json 0 1 6 2` : 540 vraies parties, 540 correspondances exactes, 540 témoins réutilisés, 78,389595309s.
- `node artifacts/equilibrage-0362/actual-core/pricing-real.mjs` : 132 vraies parties sans override, 132 correspondances exactes, 44,657443379s.
- Cœur mesuré `f6dd559fc16e5ad6e0814e4286da9416ed9134f0`, huit empreintes inchangées au gel Task3. `sourcePlayerSHA=d3e9dfac608659ae1509e02726fe7bba1e8ba70abd5152e26476b7b18adcf9e0` ; adaptateur explicite révision2 `actualPlayerSHA=0e694720411d89134fbfd8818aab4936097d6414608ce35a0d12e0e2866c0458`.

Total : **672 parties réelles Game2** ; **1 356 exploratoires distinctes** ;
les 540 témoins anciens ne sont pas de nouvelles parties. Aucune réplication
des 44 092 parties d’audit. Minimum classique de découverte exclu ; étoiles
classiques exclues ; temps d’or cumulé non interprété comme délai UI continu.

Préservation : sauvegarde externe
`/workspace/equilibrage-0362-task3-historical-backup`, 8 139 empreintes avant,
restauration après chaque recette, y compris un échec. Rapport fixe d’audit et
ressources historiques inclus. Cette sauvegarde n’entre pas dans l’archive
nouvelle. Aucun ancien APK écrasé.


Le [reçu final](delivery.json) conserve les 14 commandes fraîches réussies,
leurs durées et logs, les SHA APK/portable/archive et les comptes exacts.
La vérification d’archive a été relue au moment de la clôture : 632 fichiers,
SHA de chaque membre et SHA global conformes. La clôture documentaire ne
modifie pas les sources runtime de l’APK `e55e2d3`.
