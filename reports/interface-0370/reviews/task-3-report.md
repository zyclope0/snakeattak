# Task 3 — finition et recette intégrée 0.37.0

BASE42e8152, branche isolée feat/interface-mobile-0370. Rapport en cours ; la
version publique demeure0.36.2. Aucun appel distant, payant, changement de règles,
de données, de format de sauvegarde, de permissions ou de dépendances.

## TDD et investigations

- RED réel `red-portrait.log` : `catalogue portrait guidance actually topmost at corners and centre`.
  La notice fixe était derrière le top layer natif. Essai CSS `visibility:hidden`
  des dialogues/backdrops dans `css-portrait.log` : échec conservé, car la notice
  extérieure reste inerte. Cet essai a été retiré.
- Solution UI : déplacer temporairement le même nœud notice dans le dernier
  dialogue modal ouvert (ordre des mutations open, pas ordre DOM). Retour au
  parent originel en paysage. Aucun close/reopen et aucun changement de bail.
- `host-portrait.log` : portrait vert pour catalogue/préparation/carnet, puis RED
  légende contextuelle sauvegardée. Correction par les deux textes déjà traduits
  de reprise mission/classique, sans modification des handlers de reprise.
- `green-caption.log` :491contrôles. Ajout cas imbriqué catalogue→Fiches,
  rotation et restauration de pile/parent/pause, puis géométrie finale.
- `red-polish.log` : RED hauteur des prix, auparavant étirés entre top et bottom.
  CSS hauteur intrinsèque et badge pièce compact.
- `red-safe-book.log` : RED six cartes entièrement visibles à780×360 avec
  insets24/32/16/0. Regroupement titre/profil/fermeture dans une rangée pour les
  paysages≥700px. `green-polish.log` :503contrôles. Pas de cibles réduites.
- Recettes historiques : navigation visible Home→Missions/Classique/Parents,
  sous-vues explicites Repérage/Options et pages catalogue. Conservation des
  assertions de sauvegarde, reprise, coût, toucher et traduction. Première
  recette intégrée a découvert une course de bootstrap dans showHomePage,
  corrigée en attendant home-screen[data-page] réel avant navigation.
- Présentation : anciennes fixtures n’importaient pas les styles du catalogue
  natif ; imports remis en parité. Lecture des notices après les assertions du
  plateau, puis fermeture du catalogue avant ses captures/commandes. Aucun
  objectif boss/recrutement/refuge/impact supprimé.
- Recette récompenses : décision du coordinateur, scénario synthétique conservé
  d’ouverture Help pendant le dispatch d’un vrai clic visible Continue/New,
  avant le handler de rendu tardif. Suppression du evaluate-click sous modal.

## Captures réellement vues

`green-polish/after-album-safe-780x360.png`,
`green-polish/portrait-nested-guide.png`,
`green-polish/after-catalogue-780x360.png`, plus avant correction
`host-portrait/after-album-780x360.png` et
`host-portrait/after-catalogue-780x360.png`. Les six cartes sont lisibles à780safe,
la notice portrait couvre réellement toute la surface et les prix sont compacts.

## Recette finale et livraison

En cours ; résultats exacts/empreintes ajoutés après les gates finaux. Journaux,
commandes, erreurs initiales et sorties réelles sous
`/workspace/serpents-interface-0370/task3/`. Snapshot historique complet
historical-{reports,artifacts,docs} avant tests.81fichiers protégés vérifiés
identiques au BASE2b5ae48 dans protected-check.json.

Limites : Chromium cloud/toucher CDP, aucune manipulation physique S24,
TalkBack, anglophone natif ou enfant. Petit568safe garde un défilement interne.
Comparatif visuel arrêté au devis partiel100crédits Magnific et1crédit Higgsfield
(base sans référence finale), devis Runway par appel indisponible. Aucune image
lancée. Revue globale, push, fusion et publication réservés au coordinateur.

## Migrations et erreurs de recette conservées

- Première passe complète `qa-results.json` : verify549, browser, audit13,
  préparation5, interruptions, offline10, tactique, locale440+24, caprices293/39,
  family et portable build verts. Échecs : scroll et child (menu pas encore prêt),
  présentation (disclosure masquée/fixture sans CSS mobile), mission (glyphes
  initialement sous l'écran), mobile (RED attendu pour budget absent).
- `mission-diagnostic.log` : glyphes44px y339.1875→383.1875 à780×360 ; le clip de
  la carte finissait à291px. `mission-green.log` révèle ensuite la largeur400px
  trop étroite en3colonnes. Restaurer les colonnes2à700 et1à400 conserve
  l'ancien objectif de lisibilité. `mission-green2.log` :16cas,0erreur ; le test
  conserve≥40px, chemins visibles et ajoute clip réel/hit-test natif.
- `target-results.json` : scroll échoue sur un tap calculé dans le panneau plutôt
  que dans la zone réellement visible ; pointOnCard intersecte désormais
  catalog-body et exige le hit réel. Child échoue sur isVisible du dock qui reste
  rendu derrière le modal : remplacement par couverture top-layer réelle, aucune
  action du dock accessible. Présentation attendait PRÉPARATION après ouverture
  du catalogue qui affiche légitimement Pause : assertion de préparation déplacée
  avant ouverture, puis message de stockage réellement visible. Rewards vert,
  scénario tardif synthétique préservé.
- `target2-results.json` : scroll5tailles+desktop vert48.1s, présentation14scénarios
  verte71.1s ; child découvre le disclosure imbriqué manquant dans l'ancien
  chemin clavier. revealControl ouvre les vrais parents et rouvre après le choix
  de miel qui ferme le catalogue. L'action clavier doit ensuite le fermer.
- `target3-child.log` :6tailles,0erreur. `budget-green2.log` :519contrôles,
  0erreur. La première tentative budget passait le budget mais testait le maintien
  du focus d'un bouton de page devenu désactivé au dernier feuillet ; le test
  pose explicitement le focus sur Fermer, encore activable, avant la rotation.
-33modules navigateur modifiés passent `node --check` (`syntax-check.json`). Les
  recettes annexes Android performance, craft, departures, display, équilibrage,
  interface0322/0361, lisibilité, mobile031, captures store, render-settings,
  transitions, tutoriel, guide0341, journey018, medical-persistence et missions021
  ne sont pas revendiquées comme recettes exécutées individuellement. Leurs
  entrées Home ont été migrées ; les gates contractuels sont ceux du workflow et
  du brief, tous listés dans final-qa-results.json.

Captures supplémentaires réellement vues :
`artifacts/mission-journey-0331/after-diagnostic-glyphs-780x360-empty.png`
(RED, puis conservée hors Git), `after-780x360-empty-map.png` (GREEN),
`budget-green2/after-catalogue-780x360.png`,
`budget-green2/after-catalogue-safe-568x320.png`,
`budget-green2/after-album-safe-780x360.png`.

Source produit/tests figée en9ca13bb55a55f7a571c6fbc027e31c466c638e3c avant
la passe finale propre/npm ci et avant le build normal destiné à l'APK. Aucun
fichier runtime ne doit ensuite diverger de cette source ; les documents et le
reçu seront un commit distinct.

## Livraison finale vérifiée

Source APK et tests :9ca13bb55a55f7a571c6fbc027e31c466c638e3c. Les21commandes
finales sont toutes sorties0, journal complet final-qa-results.json. npm ci propre,
verify **549/549**, format/types/build/budgets ; audit npm production0vulnérabilité ;
Chromium installé (bibliothèques système déjà présentes, pas d'exécution GitHub) ;
browser normal et portable, audit UI13, préparation5écrans, scroll5tailles+desktop,
child6tailles, interruptions, offline10parcours, présentation14scénarios, tactique,
locale440+24bindings/0clé inconnue, caprices293/39captures/0erreur,
mission-journey16cas, mobile519/0erreur, build portable, family et rewards verts.
Toutes les recettes de build/fixture ont été exécutées en série dans ce lot.
Les durées, sorties et commandes exactes sont dans le JSON ; ne pas additionner
les tentatives précédentes aux contrôles finaux.

`npm run build` normal pour le paquet : package-normal-build.log, sortie0.
Gradle assembleDebug --offline avec JDK21/SDK36 : BUILD SUCCESSFUL15s,
93tâches (59exécutées,34àjour), SERPENTS_PERF=0. capacitor.settings.gradle
restauré exactement après sync. Aucun SDK ni source native modifié.

APK `/workspace/conquete-serpents-v0.37.0-debug.apk`,15,106,817octets,
SHA256`07b2ab7a1288e2eec57c990e05201c3ee63afd0c5dd95b9dbbfc24280dd066bb`.
0.37.0/code49, com.conqueteserpents.famille, certificatSHA256
`d018e28e8ab916b4cb46ef53e2c696079415304be87cb0cf90662df94598d599`.
Manifest/badging/signature inspectés : sensorLandscape inchangé, aucune permission
INTERNET/BILLING/AD_ID. Config Capacitor sans server ni appStartPath, y compris
récursivement.34fichiers normaux de dist byte-identiques dans APK ; le même
manifeste34fichiers correspond exactement à la copie immuable relue par le
coordinateur.81fichiers protégés toujours identiques à2b5ae48 ; diff runtime
source9ca→workspace vide après sync et paquet.

PortableHTML `/workspace/conquete-serpents-v0.37.0-portable.html`,15,124,867octets,
SHA256`fe758b5c047ea53f36bd9db99eb696e066ac65025da383eb0f9523cf7031886c`.
ZIP complet `/workspace/conquete-serpents-v0.37.0-portable.zip`,10,855,887octets,
SHA256`7c8805832462307cc9bf32a49bee96bf7f60e6fbd47e7f65d0bc70c8c4278277`.
5fichiers vérifiés par testzip et comparaison de chaque octet : HTML renommé,
favicon, prototype, licences et provenance. Le favicon est un compagnon existant
du pipeline ; l'icône d'accueil et le gameplay sont intégrés au HTML. Compagnon
copié à/workspace/icon-512-BPQ3IZsK.png sans écraser un ancien fichier.

Cold checks `node /workspace/serpents-interface-0370/task3/portable-check.mjs` :
**4cas**, normale bundle local FR/EN + véritable HTML portable copié FR/EN,
navigator.onLine=false,0requête externe,0erreurJS, polices prêtes. Copies
écran portable-file-en.png et bundled-offline-fr.png réellement vues.
Preuves: offline/report.json, offline-cold.log et final-integrity.json.
Il s'agit d'émulation Chromium du transport embarqué, pas d'un test WebView/S24.

Historique :228sorties nouvelles/modifiées copiées dans final-qa-outputs avant
restauration. **9044fichiers historiques** vérifiés par SHA256,187restaurés ;
5nouveaux rapports de recettes conservés hors Git puis retirés du répertoire
suivi. Les8anciens APK/HTML0.36 à la racine ont les mêmes empreintes après
livraison. PLAN-ACTUEL est l'unique ancien document volontairement actualisé ;
sa version initiale reste dans historical-docs et Git. Le rapport Task1 est
normalement déplacé vers reports/interface-0370, copie active ignorée conservée,
Task2/conseils archivés. Aucun effacement du workspace SDD actif.

Partie indépendante du coordinateur lue dans root-visual/report.json : même
source9ca,0injection d'état/horloge,4achats natifs,3vagues gagnées, cristal100%,
753pièces ;36noms du carnet EN et notice portrait réelle.20appels capture pour
18noms uniques. Résumé compact ajouté au BILAN ; aucune conclusion d'équilibrage.

Limites conservées : petit carnet568safe et outils du catalogue défilent dans
leur zone bornée ; recettes annexes non revendiquées individuellement, voir
liste plus haut. Aucun essai physique S24/TalkBack/enfants/anglophone natif.
Pas de génération payante, pas d'action distante ; devis Runway encore absent.

Docs/reçu final: docs/BILAN-0.37.0.md, docs/CONSEIL-0.37.0.md (six regards
simulés après chacun des trois lots), docs/PLAN-ACTUEL.md (candidate locale,
site0.36.2), reports/interface-0370/delivery.json. Revue globale, push, fusion et
publication restent au coordinateur. Aucun blocage technique connu dans les
recettes contractuelles après cette passe ; statut de livraison locale uniquement.

Commit documentation/reçus final : 37c2e2d6fae04ff8c194df2b467a62ddbddc0b82.

Après commit37c2e2d : format compact vert ; git status porcelain vide ; diff runtime9ca→HEAD vide ; empreintes APK/HTML/ZIP relues et conformes au reçu ; aucun fichier SDD encore suivi. post-doc-verification.json conserve ce contrôle.

## Revue Task 3 — correction I1, round 1/5

FIX_BASE37c2e2d. Finding vérifié : la précédente migration émettait des gestes
mais ne prouvait plus le déplacement positif du corps `.catalog-body`, et les
anciens champs snapshot panel/shop lisaient les mauvais conteneurs. Périmètre
corrigé uniquement dans la recette et ses reçus ; M1 journey reste différé au
coordinateur pour la revue globale, sans modification ici.

`REINFORCEMENTS_SCROLL_REPORT_DIR=.../fix1/red REINFORCEMENTS_SCROLL_BLOCK_TOUCH=1
npm run test:reinforcements-scroll` : **RED attendu, sortie1**. La CSS injectée par
le test `touch-action:none` laisse le corps à0→0 malgré client185/scroll198,
plage13px, à812×375. L'assertion `native upward drag must move the real body`
échoue. Aucun changement CSS livré ; la même recette sans le drapeau rétablit
le toucher natif.

`REINFORCEMENTS_SCROLL_REPORT_DIR=.../fix1/green npm run test:reinforcements-scroll` :
**GREEN, sortie0**,5tailles mobiles et desktop, **5cas positifs de défilement**,
0erreurJS. Mesures réelles :

| Format / safe top,right,bottom,left | Plage | Haut initial→glissement montant→descendant | Limite atteinte puis geste supplémentaire | Document avant/après |
| --- | ---: | --- | --- | --- |
|812×375 /0,0,0,0|13|0→13→0|13→13|0→0|
|812×375 /24,48,16,0|53|0→17→0|53→53|0→0|
|568×320 /24,48,16,0|112|0→18→0|112→112|0→0|
|480×320 /24,48,16,0|112|0→18→0|112→112|0→0|
|667×375 /24,0,16,48|53|0→17→0|53→53|0→0|

Le snapshot lit maintenant scrollTop/clientHeight/scrollHeight/max du corps.
Les contrôles attendent sa position stabilisée, exigent les deux directions,
atteignent la vraie limite inférieure par gestes natifs avant de tester son
overscroll, puis reviennent en haut par gestes natifs. Aucune écriture de
scrollTop ne prépare cette preuve. Les gestes restent des événements CDP
Input.dispatchTouchEvent, avec hit-test de leur zone. Les cas qui tiennent sans
scroll acceptent zéro, mais au moins un cas réellement débordant est obligatoire.
Les prix, sélection et ouverture sont contrôlés à chaque étape ; les assertions
historiques de cartes verrouillées, sélection armée, tap, non-achat et20IDs
restent présentes. La distance demandée au doigt est renommée explicitement ;
les offsets observés constituent une mesure distincte.

Contrôles pertinents : `node --check scripts/reinforcements-scroll-037-browser.mjs`
sortie0, Prettier sur le script/reçu/README sortie0, `git diff --check` vert.
Aucun défaut produit découvert. Aucun rebuild, nouvel APK ni répétition des
21commandes initiales : le runtime source9ca, les APK/HTML/ZIP et les reçus
initiaux ont leurs SHA256 inchangés. Les sorties du fix sont isolées dans
`/workspace/serpents-interface-0370/task3/fix1/` ; aucune preuve historique n'est
écrasée. Reçu compact `reports/interface-0370/task-3-fix1.json`, avec SHA du
script testé, commandes, mesures et empreintes initiales conservées.

Limites inchangées : simulation Chromium CDP, pas d'essai Android physique.
Aucune règle, donnée, sauvegarde, identité, SDK, dépendance, action distante ou
payante modifiée. Cette correction attend la relecture ciblée du coordinateur.

Commit correction I1 : bf15c83ea57b816658ea9a7b65ee8aa082a263d6, FIX_BASE37c2e2d.
