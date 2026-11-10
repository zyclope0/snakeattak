# Commandes et provenance des preuves

Toutes les recettes sont sérialisées. Exécution initiale Task3 :
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
SHA de chaque membre et SHA global conformes. La clôture initiale ne modifiait pas les sources runtime de son APK `e55e2d3`.


## Correction finale R1 et paquets courants

Source du paquet courant : `28e958e29ef86b8442c875ce6a96b0707ec0425d`.
Le seul changement runtime ajoute `missions.version === 2` au classifieur
familial. Les résultats Task3 ci-dessus restent historiques ; leur reçu est
conservé dans `delivery-before-final-review.json`.

| Étape finale | Commande / preuve | Résultat frais |
| --- | --- | --- |
| RED avant source | `node --experimental-strip-types --test tests/balance-persistence-0362.test.ts` ; `final-fix/red-final.log` | 12 tests, 4 échecs attendus (export et faux labels 2/3/4) ; label 1 déjà refusé |
| GREEN ciblé | Même fichier + `balance-revision-0362`, `family-backup-020`, `family-missions-021`, `family-persistence-020` | 45/45, témoins legacy inchangés |
| Vérification | `npm run verify` | 548/548, format/types/build/budgets ; 34,428s |
| Navigateur général | `npm run test:browser` | Desktop/tactile, pageErrors[] ; 34,602s |
| Famille | `npm run test:family` | Transports file/web, reprise/invalides/stockage bloqué, quatre tailles, pageErrors[] ; 17,575s |
| Portable froid | `node artifacts/equilibrage-0362/final-fix/portable-check.mjs` | Build séparé et quatre cas FR/EN normal hors ligne/file:// ; 17,286s |
| APK normal | `python3 artifacts/equilibrage-0362/final-fix/android-package.py` | 0.36.2/code48, 34 fichiers égaux, certificat/identité inchangés ; 10,996s |
| Préservation | `python3 artifacts/equilibrage-0362/final-fix/final-inspect.py` | 8 139 anciens + 145 Task3, huit hashes physiques et anciens paquets inchangés |
| Complément additif | `python3 artifacts/equilibrage-0362/final-fix/archive-new-proofs.py` | Manifeste SHA de chaque nouveau membre et hash global vérifiés ; aucun ancien payload/backup/archive dupliqué |

Logs/commandes/scripts nouveaux sous `artifacts/equilibrage-0362/final-fix/` ;
scripts de paquet copiés/adaptés de Task3, sans écraser ses journaux.
Sauvegarde supplémentaire externe
`/workspace/equilibrage-0362-final-fix-historical-backup`, restauration en
finally après chaque recette. Copies pré-revue des deux livrables conservées.
L’archive initiale 150 Mo et son SHA restent intacts ; complément final distinct
et paquets courants décrits dans `delivery.json`. Les parties physiques et
matrices UI/langues inchangées ne sont pas rejouées. Format/checkdiff finaux
consignés dans le rapport de correction ; relecture ciblée/coordination root
ultérieures au complément.
