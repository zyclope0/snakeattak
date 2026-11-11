# Task 1 — Accueil, navigation courte et carnet par mission

Date : 10 novembre 2026. Base : `70c5bf1`, branche `feat/interface-mobile-0370`.
Périmètre : Task 1 seulement. Aucun appel payant, asset nouveau, changement de règle,
de RNG, de persistance, de version ou d’identité Android. Aucune action distante.

## Résultat

- Accueil court : une commande principale dorée Jouer/Reprendre et cinq accès
  dédiés (missions, carnet, favoris, classique, parents), icône approuvée existante.
- `bindHomeNavigation()` expose exactement `show(HomePage, focus?)`, sans stockage.
  Il règle visibilité, focus, retour visible et Escape ; la session reste à l’accueil.
- `home-primary` délègue à `menu.resumeClassic`, `expeditions.resume` ou
  `expeditions.play`, extraits des handlers existants. `missions.state.activeMode`
  choisit la reprise. Aucun faux clic vers un contrôle caché ajouté pour ce bouton.
- Missions : les six cartes existantes et la reprise de mission restent accessibles.
  Classique : reprise, nouveau départ et chapitres sur leur page. Parents : aide,
  fiches, sons, fichier familial et code de départ sur leur page.
- Favoris : six cartes maximum par page, quatre pages pour les vingt unités ; les
  trois compositions de huit et leurs sauvegardes restent celles du contrôleur.
- Carnet : une mission par page, deux familles explicites de trois autocollants.
  Les 36 IDs et les feuilles françaises protégées restent présentes et distinctes.
  Le sélecteur du carnet reste visible ; Ajouter/Renommer sont sous une gestion
  native repliée à chaque ouverture. La page reste stable quand le carnet ou la
  langue change ; l’ouverture depuis un résultat cible la mission et le propriétaire.
- Zones défilantes bornées pour cartes/textes longs ; sorties et pages hors de
  ces zones. Les marges réutilisent les variables de sécurité existantes. Le corps
  applique déjà les marges du système : l’accueil utilise `--app-height` sans les
  compter deux fois. La protection de rotation portrait reste en place.

## TDD et vérifications

Preuves lourdes : `/workspace/serpents-interface-0370/task1`, hors Git.

1. **RED initial** : `MOBILE_MENUS_BEFORE=1 node scripts/mobile-menus-037-browser.mjs`.
   Échec attendu : « one contextual primary entry exists ». Les captures avant ont
   précédé toute modification de production. Journal conservé dans
   `/workspace/serpents-interface-0370-task1-red.log`.
2. **GREEN ciblé final** : `MOBILE_MENUS_REPORT_DIR=/workspace/serpents-interface-0370/task1 npm run test:mobile-menus`.
   **234 contrôles, 0 erreur JS**, journal `green-final.log`, données `report.json`.
   Couvre les quatre tailles paysage, une commande primaire, préparation moderne,
   six cartes, IDs disjoints, limites de pagination, retour/Escape/focus, renommage
   du bon carnet, nom local brut, 36 noms français en EN, rotation et marges simulées.
   Deux camps sont injectés via les encodeurs et contrôleurs de production ; les
   commandes de reprise sont natives. Les deux chaînes de camp restent identiques
   après aller-retour classique/mission et rechargements dans les deux modes.
3. **RED/GREEN complémentaires** : libellé ARIA de pagination non traduit détecté
   par `aria-red.log`, sortie du carnet hors marges par `safe-area-red.log`, puis
   double comptage de hauteur par `safe-scroll-red.log`. Chacun échoue avant sa
   correction. Les assertions correspondantes sont dans les 234 contrôles finaux.
4. Une première exécution ciblée a échoué sur le sélecteur desktop `#menu-home`
   caché sur mobile ; la recette utilise désormais le vrai bouton mobile visible.
   Les étapes n’ont pas été contournées. Une erreur TypeScript sur l’itération de
   NodeList a été corrigée avec `Array.from` avant les vérifications réussies.
5. `npm run verify` : contrôle format, **548 tests sans échec**, types, build et
   budgets. Le reçu autoritatif final est `verify-final-layout.log` : sortie 0.
   HTML final 32 648 octets sur 32 768, soit seulement 120 octets de marge ; le
   prochain lot devra surveiller ce budget en ajoutant du HTML.
6. `npm run test:browser` : parcours desktop et tactile de livraison, **0 pageError**.
   Reçu final : `browser-final-layout.log`, sortie 0 ; captures copiées vers
   `browser-desktop.png` et `browser-mobile.png` hors Git.

Comptage des exécutions : recette ciblée **11** (5 échecs documentés, 6 succès,
progressivement enrichis), `verify` **3**, navigateur de livraison **2**, contrôle
TypeScript direct **2** (premier échec précité), locale **2**, caprices **1**.
Les suites complètes n’ont été répétées qu’après les défauts de langue/marges
identifiés ; les derniers contrôles requis sont exécutés après le CSS final.

### Recettes existantes adaptées et reçus supplémentaires

- `node scripts/locale-035-browser.mjs` avec `LOCALE_REPORT_DIR` externe : première
  exécution **392 contrôles, 4 échecs de marque complète à 568 px**, 0 erreur JS,
  0 clé inconnue. La règle qui abrégeait la marque a été supprimée. Seconde
  exécution : **392/392, 0 erreur, 0 clé inconnue**, `locale-final.log`.
- `CAPRICES_REPORT_DIR=… npm run test:caprices` : **281 contrôles, 39 captures,
  0 erreur JS** ; victoire native jouée, propriétaire conservé après passage
  classique/rechargement/reprise, import/export et garde de lancement maintenus.
  Le harness initialise explicitement le même binder de navigation.
- Ces deux recettes optionnelles ont été lancées simultanément dans le même
  workspace. Locale a reçu un événement Vite concernant le fixture caprices et
  un HMR de `mobileMenus.css` lors du dernier correctif de hauteur. Le build
  caprices précède ce correctif. **Ce sont des reçus supplémentaires, pas les
  reçus autoritatifs du code final.** Aucun second lancement optionnel n’a été
  fait pour aligner leur tête ; l’intégration finale appartient aux lots suivants.
  Le build optionnel exact est indexé par `optional-build/hashes.json`, son HTML
  et son CSS conservés dans ce dossier ; les sources finales sont indexées par
  `final-source-hashes.json`. SHA256 CSS final :
  `176d078953ed509c257738a6c9770ca8353e8c7a5414e306493a97802bf7997c`.
  Les gates finaux ciblé/verify/browser sont frais et séparés de ces jobs terminés.

## Captures et mesures

Le même Chromium Playwright, contexte tactile FR, tailles et conditions sans
insets simulés servent aux deux côtés. Le baseline exact `70c5bf1` a été archivé
hors Git dans `baseline-src` et remesuré par `measure-before.mjs`. Les anciennes
captures de l’audit n’ont pas été mélangées à ces mesures.

| Taille | Hauteur document accueil avant → après | Carnet avant : scroll/client | Carnet après : scroll/client | Zone autocollants après : scroll/client |
| --- | --- | --- | --- | --- |
| 780×360 | 630 → 360 | 2581/344 | 344/344 | 149/149 |
| 812×375 | 638 → 375 | 2581/359 | 359/359 | 164/164 |
| 1280×800 | 975 → 800 | 2581/772 | 696/696 | 477/477 |
| 568×320 | 686 → 320 | 2625/304 | 304/304 | 155/109 |

Les captures après du carnet montrent la sixième mission, atteinte par cinq vrais
clics ; l’avant montre le haut du carnet de 36 cases. Les métriques comparent la
structure et le volume de défilement, pas des contenus de mission identiques.
Aucun débordement horizontal du document dans ces quatre cas. Le bouton primaire
mesure 180×48 px sur les trois petits paysages, 180×53 sur 1280×800. Les boutons
primaires, navigation et pagination contrôlés ont leurs deux dimensions ≥48 px.

Avec les marges simulées haut24/droite32/bas16/gauche0 à 568×320 : document
320 px, carnet scroll/client276/276, zone bornée140/81 ; la fermeture et le
sélecteur de langue restent à l’intérieur de ces marges. Cela reste une simulation.

Captures relues :

- `before-home-780x360.png`, `before-album-780x360.png` ;
- `after-home-780x360.png`, `after-album-780x360.png` ;
- `after-home-568x320.png`, `after-album-568x320.png` ;
- `after-home-1280x800.png`, `after-album-en.png` ;
- `after-album-safe-568x320.png`.

Les paires avant/après existent également en 812×375 et 1280×800. Les fichiers
`before-measurements.json` et `after-measurements.json` donnent les valeurs brutes.

## Fichiers

Créés : `src/ui/homeNavigation.ts`, `src/ui/mobileMenus.css`,
`scripts/mobile-menus-037-browser.mjs`, présent rapport.

Modifiés : `index.html`, `src/bootstrap.ts`, `src/ui/menu.ts`,
`src/ui/expeditions.ts`, `src/ui/capriceAlbums.ts`, `src/ui/caprices.css`,
`src/i18n/dictionaries/supplement.en.ts`, `package.json`,
`tests/browser-entry.mjs`, `tests/caprices-036-harness.ts`,
`scripts/caprices-036-browser.mjs`, `scripts/locale-035-browser.mjs`.

Le helper navigateur `showHomePage` suit Retour puis la vraie navigation visible ;
`enterBattle` ouvre désormais Classique avant de reprendre ou créer son camp.
Les vérifications comportementales des recettes adaptées ont été conservées.

## Auto-revue et limites

- Diff limité aux vues, assemblage et recettes. Aucun module de règles, sauvegarde,
  catalogue d’identifiants, annonce, donnée de prix/vague, asset ou fichier Android
  modifié. Les noms de carnets restent des textes bruts ; aucun HTML interprété.
- Les 36 autocollants restent dans le DOM avec leurs IDs ; seuls six sont visibles.
  Les deux familles françaises sont des feuilles protégées, même en anglais.
- Une zone intérieure défile encore à 568×320 (46 px pour la mission photographiée,
  59 px avec marges simulées pour la page photographiée). Les contrôles de sortie et
  de pagination restent fixes. Aucun claim de zéro défilement intérieur.
- Préparation, catalogue alliés/dock et baux de pause ne font pas partie du lot.
  Aucun test physique S24, Android système ou lecteur d’écran n’est revendiqué.
- Les autres recettes CI qui appuient directement sur les anciens contrôles
  d’accueil demandent les parcours visibles du lot d’intégration :
  `child-mobile-035`, `threat-preparation-036`, `reinforcements-scroll-037`,
  `interruptions/offline-033`, `mission-journey-033`, `camp-tools-033`,
  `display-027`, `mobile-031`, `tutorial-030`, `transitions-033`,
  `render-settings-024`, `interface-0322`, et les anciens tests
  journey/family/missions/medical/departures. Les fixtures
  `result-0342-harness.ts` et `interface-0361-harness.ts` assemblent aussi
  expeditions directement : initialiser `bindHomeNavigation` et son CSS si leur
  scénario revient à la carte. Ne pas faire cliquer leurs contrôles cachés.
- La revue indépendante et le conseil des six perspectives sont planifiés par le
  contrôleur ; aucun sous-agent ou reviewer n’a été créé ici.

## Historique préservé

Les destinations ont été lues avant exécution. Le navigateur de livraison écrit
seulement `artifacts/pilote-{desktop,mobile}.png` (non suivis) ; les autres recettes
utilisent les répertoires externes ci-dessus. `npm test` écrit ses fixtures de
sécurité dans des dossiers temporaires. Aucun fichier historique suivi sous
`reports/` ou `artifacts/` n’a changé : aucune restauration nécessaire. Les rapports
originaux et documents de passation restent intacts ; aucune preuve lourde ajoutée
au commit. Le rapport SDD, ignoré par défaut, est ajouté explicitement au commit.
