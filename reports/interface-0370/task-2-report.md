# Task 2 — Préparation courte et catalogue en pause

10 novembre 2026. Branche `feat/interface-mobile-0370`, base `886aa6b`.
Périmètre : lot 2, sans moteur, règles, RNG, données, sauvegardes ou Android.
Preuves : `/workspace/serpents-interface-0370/task2`, hors Git. Ce rapport reste
ignoré ; aucune preuve lourde ni scratch n’est ajouté au commit.

## Résultat

- `bindMissionPreparation(dialog)` expose `show(PreparationView)` et `reset()`.
  Résumé, Caprices, Copains, Repérage et Options réemploient les contrôles
  existants. Départ et Retour restent fixes, le contenu défile dans une zone bornée.
  Le résumé reflète budget, trois alliés de départ, carnet, terrain et caprice ;
  ses noms de caprices sont des feuilles françaises protégées. Aucun choix
  d’armée n’est créé pour une mission normale. Les copains gardent uniquement
  les restrictions facultatives des caprices existants.
- Sélectionner un caprice conserve la vue courante. Nouveau départ et réessai
  reviennent au résumé. Les tests comparent les codes réels, les révisions et le
  Game conservé, notamment les départs historiques de révision 1.
- Le catalogue devient un vrai `dialog` modal, avec six cartes maximum par page,
  filtres et pages fixes. Les filtres et déblocages gardent Game comme autorité.
  Les vingt alliés restent atteignables ; filtre et réduction des résultats
  remettent ou bornent la page. Quatre favoris et deux miels restent au dock.
- Décision du contrôleur : supprimer les huit cartes de recrutement favorites
  en doublon. `quick-slot` garde les trois compositions ; les huit sortes sont
  toujours dans le catalogue, les quatre raccourcis restent au dock. Les actions
  non dupliquées restent dans « Conseils et outils ».
- Ouvrir prend un bail `pauseForDialog`. Choisir ne dépense rien ; le placement
  normal recrute. Réparer, entraîner, encourager et choisir/poser le miel ferment
  d’abord le catalogue, puis utilisent leurs handlers et gardes habituels. Leur
  disponibilité lit `campToolModel`, `heroTrainingState` et une projection UI
  de la pause restante ; aucun Game copié ni temporairement dépausé pour lire
  ses règles. Pause manuelle, autre dialogue et arrière-plan restent prioritaires.
- `pauseForDialog.open()` règle aussi une fuite existante : une fermeture native
  suivie immédiatement d’une réouverture doit solder l’ancien bail avant le
  nouveau. Escape retrouve le déclencheur courant, même après une sélection.
  Nouvelle partie ferme le catalogue avant sa confirmation et son remplacement.

## RED / GREEN et vérifications

Les recettes ont été exécutées séparément pour les reçus finaux. Les empreintes
des 25 fichiers produit/tests figurent dans `final-source-hashes.json`. Une commande
initiale partie de `/workspace` n’a exécuté aucun test. Une paire d’essais ciblés
intermédiaires a accidentellement partagé le fixture mobile ; le second a été
arrêté. Ces essais (`preparation-safe.log`, `full-safe-red.log`) ne sont pas des
reçus de livraison ; aucun build concurrent n’a été utilisé pour la livraison.

RED observés :

1. `red.log` : résumé court absent ; `red-catalogue.log` : ouverture sans pause.
2. `red-pause.log` : projection de libération non implémentée.
3. `tools-safe.log` : réparation encore indisponible après fermeture/réouverture,
   révélant le bail perdu ; `tools-safe2.log` passe ensuite.
4. `full-safe-red2.log` : enveloppe hors marges simulées ; corrigée avec les insets.
5. `overflow-red.log` : ancien `#reinforcements > * { flex: 0 0 auto }` empêchant
   la zone intérieure de rétrécir. Le catalogue débordait malgré `overflow:hidden`.
6. `caprices.log` : Autre départ sous la zone visible à 568 px. Il est désormais
   en tête des Options ; les assertions ne sont pas supprimées.
7. `focus-red2.log` : après attente du vrai événement `close`, Escape rendait le
   focus à l’ancienne destination. Le déclencheur est réinitialisé à l’ouverture.
8. `locale.log` : l’extracteur prenait une longue liste de sélecteurs pour du texte.
   Les sélecteurs sont maintenant un tableau lisible joint, sans fausse traduction.

Reçus sur les fichiers figés :

- `MOBILE_MENUS_REPORT_DIR=…/final-target-frozen npm run test:mobile-menus` :
  **442 contrôles, 0 erreur JS**, `final-target-frozen.log` / `report.json`.
  Couvre FR/EN, mêmes codes et révisions, choix légaux, 20 IDs, filtres/pages,
  gel réel via `Session.advance(1000)`, sélection sans dépense, placement payant,
  pause manuelle et arrière-plan, dialogues imbriqués, réouverture immédiate,
  réparation et entraînement aux coûts/effets exacts une fois, encouragement,
  miel, nouvelle partie, focus, géométrie et marges.
- `LOCALE_INVENTORY_FOLDER=…/locale-inventory LOCALE_REPORT_DIR=…/locale2 npm run test:locale` :
  **938 phrases couvertes, 24 contrôles de bindings, 440 contrôles de parcours,
  0 échec, 0 erreur JS, 0 clé inconnue**, `locale2.log`.
  Les 48 contrôles supplémentaires face aux 392 antérieurs inspectent les quatre
  vues supplémentaires pour six missions dans les deux fixtures de langue.
  L’inventaire et sa couverture acceptent maintenant la même destination externe.
- `npm run verify` : **549 tests, aucun échec**, format/types/build/budgets réussis,
  `final-verify.log`. HTML **32 475 / 32 768 octets**, marge 293 octets ; aucune
  limite relevée et aucun artifice de minification des sources.
- `npm run test:browser` : parcours desktop et tactile réussis, **0 pageError**,
  `final-browser.log`, captures `final-browser-{desktop,mobile}.png`.
- `CAPRICES_REPORT_DIR=…/caprices-final npm run test:caprices` : **293 contrôles,
  39 captures, 0 erreur JS**, `final-caprices.log` et `caprices-final/report.json`.
  Victoire native réellement jouée, propriété du carnet, reprise et restrictions
  conservées. Tous les anciens contrôles de reroll sont présents dans les Options.

Comptages : ciblé mobile 16 tentatives (8 réussies, 7 échecs de développement,
1 diagnostic interrompu), projection de pause un RED direct, types un contrôle
réussi, verify 2 réussites, navigateur 3 exécutions au total avec le reçu final,
caprices 3 exécutions avec le reçu final, locale 2 tentatives, baseline 1 mesure.
Les reçus `verify.log`, `browser.log`, `browser-debug.log`, `green*.log`,
`overflow-green.log` et `caprices2.log` sont antérieurs aux dernières corrections.

Le passage caprices intermédiaire compte 273 contre 281 auparavant : retrait
initial de 20 contrôles de géométrie du reroll (2 × 10 cas paysage FR/EN), ajout
de 12 contrôles de réserve du dock. Les 20 contrôles ont été **rétablis dans les
Options** pour le reçu final : 293 constatés, sans retrait des protections métier.
Les assertions de l’ancienne carte favorite portent désormais sur la carte shop
active ; les protections du dock ont été ajoutées.

## Captures et géométrie

Baseline exact `886aa6b` extrait hors Git dans `baseline-src`, mesuré avec le même
Chromium tactile FR et les quatre tailles. Le catalogue avant/après utilise un
Game classique contrôlé de même graine 2026, vague 9, 10 000 pièces et 20 alliés
accessibles ; aucune horloge n’est accélérée. Les préparations ordinaires ont des
tirages aléatoires : les mesures comparent leur structure, pas des pixels de terrain.

| Taille | Préparation avant : scroll/client de la zone | Résumé après : scroll/client | Catalogue avant : scroll/client du panneau, 20 cartes | Catalogue après : enveloppe scroll/client, 6 cartes |
| --- | --- | --- | --- | --- |
| 780×360 | 781/281 | 210/194 | 1287/310 | 340/340 |
| 812×375 | 781/296 | 210/209 | 1287/325 | 355/355 |
| 1280×800 | 977/701 | 536/536 | 710/710 | 780/780 |
| 568×320 | 780/185 | 163/154 | 1314/242 | 300/300 |

L’ancien catalogue desktop a aussi son propre scroll de shop : le tableau ne
prétend pas mesurer ce scroll imbriqué. Après, le corps du catalogue défile encore
à 780 (246/222), 812 (246/237), 568 (252/182), et avec marges simulées (250/142).
Les commandes de sortie, filtre et pages restent fixes. Le résumé normal expose
le terrain sans devoir défiler ; ses marges internes peuvent encore déborder de
quelques pixels. Les textes longs et les autres vues gardent leur scroll borné.

Aucun débordement horizontal du document dans ces mesures. Commandes contrôlées
≥48 px. Marges simulées haut24/droite32/bas16/gauche0 à 568 : catalogue
x8/y32/520×264, enveloppe260/260, sorties et pages dans les marges. À hauteur
≤340, seules les icônes décoratives des faits du résumé sont omises.

Captures : `before/before-{preparation,catalogue}-TAILLE.png`,
`final-target-frozen/after-{preparation,catalogue}-TAILLE.png`,
`final-target-frozen/after-catalogue-safe-568x320.png`, captures FR/EN détaillées
sous `caprices-final` et `locale2`. Mesures brutes : `before/measurements.json`
et `final-target-frozen/after-measurements.json`. Les vues ont été relues pendant
l’implémentation ; aucun test physique S24, Android système ou lecteur d’écran
n’est revendiqué.

## Conservation et limites d’intégration

`protected-check.json` confirme les **81 empreintes protégées inchangées**.
Aucun changement suivi sous `reports/` ou `artifacts/` ; aucune restauration de
rapport historique nécessaire. Les recettes finales écrivent hors Git ; le
navigateur de livraison actualise seulement ses deux PNG ignorés, copiés ici.
Aucun sous-agent, reviewer, appel payant, action distante ou déploiement.

Task3 garde les anciennes migrations CI et le traitement de rotation portrait en
surcouche native. Chemins historiques non exécutés/migrés dans ce lot :

```
scripts/child-mobile-035-browser.mjs
scripts/threat-preparation-036-browser.mjs
scripts/reinforcements-scroll-037-browser.mjs
scripts/interruptions-033-browser.mjs
scripts/offline-033-browser.mjs
scripts/mission-journey-033-browser.mjs
scripts/camp-tools-033-browser.mjs
scripts/display-027-browser.mjs
scripts/mobile-031-browser.mjs
scripts/tutorial-030-browser.mjs
scripts/transitions-033-browser.mjs
scripts/render-settings-024-browser.mjs
scripts/interface-0322-browser.mjs
scripts/playtest-browser-034.mjs
scripts/journey-browser.mjs
tests/journey-browser.mjs
scripts/family-browser.mjs
scripts/missions-browser.mjs
scripts/medical-persistence-browser.mjs
tests/medical-persistence-022-browser.mjs
scripts/departures-025-browser.mjs
tests/interface-0361-harness.ts
```

`tests/result-0342-harness.ts` charge le CSS des vues courtes pour la recette
locale ; sa navigation d’accueil autonome reste à intégrer en Task3, comme celle
du fixture interface. Le helper partagé suit désormais les vrais disclosures et
ferme le catalogue avant un contrôle extérieur. Cela ne certifie pas toutes les
recettes historiques ci-dessus. Le polish carnet compact appartient au lot suivant.

Commit produit/tests : `96e1f069bc1a60feb8bf1a01027a66d08857988c`. Rapport conservé ignoré, non ajouté au commit.

## Correction de revue 1/5 — pagination fixe (base 96e1f06)

La revue a confirmé que l’affirmation précédente « pages fixes » était incorrecte
après défilement : `bindCatalogPages` insérait sa navigation avant le shop **dans**
`.catalog-body`. Les contrôles initiaux vérifiaient seulement les coordonnées au
repos. Les reçus précédents ne démontraient donc pas la tenue pendant le scroll.

Correction limitée : la navigation est maintenant insérée avant `.catalog-body`,
comme enfant direct du dialogue. Titre, filtres et pagination restent hors de la
zone défilante ; aucune règle CSS supplémentaire, pause ou règle métier changée.

- RED : `MOBILE_MENUS_REPORT_DIR=/workspace/serpents-interface-0370/task2/fix1-red npm run test:mobile-menus`.
  Échec attendu « catalogue command fixed and visible after maximum scroll
  #catalog-previous, expanded=false, safe=false » à 780×360 (`fix1-red.log`).
- Premier GREEN : même recette, destination `fix1-green`, **473 contrôles**, aucune
  erreur JS. Le test a ensuite été renforcé pour constater explicitement que les
  deux disclosures d’outils sont ouverts, y compris s’ils l’étaient déjà.
- GREEN final : destination `fix1-final`, **476 contrôles, 0 erreur JS**,
  `fix1-final.log` et `fix1-final/report.json`. Les 34 nouveaux contrôles couvrent
  780×360, 568×320 et 568×320 avec insets haut24/droite32/bas16/gauche0 : titre,
  filtres, Précédents et Suivants gardent leurs quatre coordonnées et dimensions
  (tolérance <0,5 px) et restent dans les limites visibles sûres après scroll
  maximal, puis après ouverture des deux sections d’outils et nouveau scroll
  maximal. Le corps possède une vraie plage de défilement. Les deux boutons
  changent réellement la page et reviennent à l’origine après ce défilement
  dans les deux cas où plusieurs pages sont présentes.
- `npm run build` : types, compilation et budgets réussis (`fix1-build.log`),
  HTML toujours **32 475 / 32 768 octets**.
- `npm run test:browser` après ce build : parcours desktop/tactile réussis,
  **0 pageError**, reçu `fix1-browser.log`, captures `fix1-browser-{desktop,mobile}.png`.

Captures des outils ouverts au bas du scroll :
`fix1-final/after-fixed-catalogue-780-plain.png`,
`fix1-final/after-fixed-catalogue-568-plain.png`,
`fix1-final/after-fixed-catalogue-568-safe.png`. Les deux captures 780 et safe ont
été relues : navigation visible au-dessus du contenu arrivé à son extrémité.

Les recettes caprices et locale ne sont pas répétées pour cette correction de
placement DOM, conformément au périmètre demandé. Leurs résultats précédents
restent documentés ; Task3 effectuera les vérifications d’intégration finales.
Aucun changement suivi d’un rapport historique, aucune action distante/payante,
aucun sous-agent. Rapport toujours ignoré et non ajouté au commit.

Commit de correction : `ee4e9bdbeaf05301799d0960e728c5814626e4ae`.
