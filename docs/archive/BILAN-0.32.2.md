# Étape 1 — correctifs d'interface 0.32.2

8 novembre 2026, Europe/Zurich. GO explicite du parent après l'étape 0.
**Recette terminée, toutes les commandes ci-dessous vertes.**
**STOP pour le test de l'APK sur le S24 du parent.** Aucune étape 2, 3 ou 4 engagée,
aucun déploiement web/Play.
Base du jeu : 36305b8 (0.32.1). Le bilan historique et l'audit original restent
conservés. [Journal de réalisation](IMPLEMENTATION-0.32.2.md).

## Tableau des constats

| Constat du suivi de l'audit                    | Fait / pas fait                                                                                                                                                                                            | Preuve                                                                                                                                                                                                                                        |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 — Catalogue ordinateur et plateau trop petit | Dock fait : quatre favoris, deux miels, Tous les alliés ; catalogue disponible au clic. Plateau agrandi de 75,52 px en hauteur à 1280×800, sans défilement. Les 150 px ne sont pas récupérés intégralement | [Avant](../captures-suivi-0.32.1-etape-0/combat-1280x800.png), [après](../captures-0.32.2/combat-1280x800.png) ; src/style.css:3782 ; src/ui/reinforcementsDrawer.ts:1 ; [mesures et interactions](../../reports/suivi-0.32.2/interface.json) |
| 2 — Bandeau sur voie et puces                  | Fait : annonce HTML sur une ligne en bas du plateau, aucun doublon de plaque Phaser. Le guide de placement conserve sa priorité dans les conseils et ne supprime pas l'annonce                             | [Avant vague 2](../captures-suivi-0.32.1-etape-0/evenement-vague2-780x360.png), [après vague 2](../captures-0.32.2/evenement-vague2-780x360.png) ; src/ui/battleNotices.ts ; src/render/battleFeedback.ts ; index.html, battle-announcement   |
| 3 — Tutoiement automatique                     | Pas fait : réservé à l'étape 2 ; sources et instantanés du moteur inchangés                                                                                                                                | [Inventaire baseline](../../reports/suivi-0.32.1-etape-0/textes-sources.json) ; src/ui/childCopy.ts inchangé                                                                                                                                  |
| 4 — Trait blanc sous le héros                  | Fait à l'accueil : masque CSS du fragment hors du personnage, pieds conservés. Atlas et combat inchangés, aucune génération                                                                                | [Avant](../captures-suivi-0.32.1-etape-0/heros-1280x800.png), [après](../captures-0.32.2/heros-1280x800.png), [après tactile](../captures-0.32.2/heros-780x360.png) ; src/style.css, home-hero-unit ; contrôle des pixels sur trois formats   |
| 5 — Mission 1 gagnable sans recruter           | Aucun changement, conformément au périmètre. Observation conservée comme telle                                                                                                                             | [Observations de l'étape 0](../../reports/suivi-0.32.1-etape-0/refuge-observations.json) ; game.ts, missions.ts, waves.ts, data.ts inchangés                                                                                                  |

## Mesures avant / après

Même code de départ **REFUGE-2-FZZZ-ZZR4-9F**, profils neufs, zoom 100 %,
build de production. Dimensions du canvas en pixels CSS, arrondies à 0,01 px.

| Format                 | Avant 0.32.1   | Après 0.32.2   | Gain de hauteur                | Captures après                                                                                        |
| ---------------------- | -------------- | -------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| 1280×800               | 931,97×525,30  | 1065,95×600,81 | +75,52 px                      | [Plateau](../captures-0.32.2/combat-1280x800.png), [accueil](../captures-0.32.2/accueil-1280x800.png) |
| 1366×768               | 1017,98×573,78 | 1151,94×649,28 | +75,50 px                      | [Plateau](../captures-0.32.2/combat-1366x768.png), [accueil](../captures-0.32.2/accueil-1366x768.png) |
| 780×360 tactile, DPR 3 | 553,55×312,00  | 553,52×311,98  | identique à l'arrondi de rendu | [Plateau](../captures-0.32.2/combat-780x360.png), [accueil](../captures-0.32.2/accueil-780x360.png)   |

Le plateau 1280 gagne environ 31 % de surface. Sa hauteur vient de la largeur
libérée par le dock de 176 px, au lieu du catalogue de 310 px ; le ratio 1100/620
reste inchangé. Il reste environ 82 px sous le canvas à 1280×800. Récupérer les
150 px entiers nécessiterait une autre disposition des commandes, ou un changement
de proportions que cette passe évite. Cette limite était exposée à l'étape 0.
Aucun ajout factice de hauteur au canvas n'est compté comme un gain.

Le cadre de bataille et le catalogue sont bornés par les vraies lignes CSS du
HUD, sans hypothèse de hauteur fixe sur ordinateur. Les tailles intermédiaires
920×600, 800×600 et 1101×520 tiennent aussi sans défilement, catalogue fermé/ouvert.
Le dock reste disponible après Accueil et rotation ; sélectionner ne dépense rien
et ferme le catalogue, Échap rend le focus. Sur téléphone, les 48 px de cibles et
les marges système restent couverts par les recettes existantes.

L'annonce CRAC a été capturée lors d'une véritable éclosion en vague 2, vitesse
×2 par le bouton public ; pas d'injection d'état du moteur. À 780×360, elle tient
dans le plateau à y=325,98, hauteur 28 px, sous les trois voies et loin des puces.
Le test indépendant de l'adaptateur DOM vérifie aussi une annonce d'œuf pendant
un guide de placement. La plaque du haut a été retirée du rendu Phaser ; dégâts,
protection du boss et autres signaux de combat sont conservés.

## Commandes et preuves

- npm run verify : **423/423 tests, 0 échec**, formatage, types, build et budgets OK.
- npm run test:interface-audit : **24/24 contrôles**, zéro erreur JavaScript.
- npm run test:browser : parcours ordinateur, mobile et deux tablettes, zéro erreur JavaScript.
- npm run test:audit : **13/13 contrôles**.
- npm run test:child-mobile : **6 configurations**, zéro erreur.
- npm run test:reinforcements-scroll : **5 formats compacts et 1 ordinateur**, vrais balayages natifs Chromium, zéro erreur.
- npm run test:offline : **10 contrôles**, anciens formats de camp **1 à 7** et trois fonds embarqués, zéro erreur.
- npm run test:interruptions : **11 scénarios**, zéro erreur.
- npm run android:apk:debug : réussi. Le script active d'abord le diagnostic
  local perf=1 ; après sa resynchronisation normale, une seconde compilation
  assembleDebug --offline retire ce démarrage de diagnostic du livrable. Aucun
  changement du script ou de l'outil de performance. APK livré sans surcouche FPS.

[Reçu consolidé](../../reports/suivi-0.32.2/verification.json), [journaux et rapports](../../reports/suivi-0.32.2/). Les rapports historiques générés
par audit et child-mobile ont été remis à leurs octets d'origine après copie des
sorties fraîches dans ce dossier. La recette n'est pas une nouvelle CI distante.

## Relecture et explication des adaptations de tests

Une relecture indépendante de l'ensemble a identifié deux P2 : débordement aux
tailles intermédiaires et catalogue encore ouvert après un détour par l'accueil
ordinateur. Régressions observées rouges, puis correction et recette complète.
Le focus après redimensionnement est également rendu au bouton d'ouverture.
Les tailles restantes sont contraintes par les grilles CSS réelles, pas par une
soustraction de 88 px supposant que le HUD garde partout sa taille de bureau.

Les anciennes assertions de catalogue, filtre, déblocage, prix, miel, reprise,
pause et gestes restent contrôlées. Elles ouvrent maintenant le catalogue via
son bouton au lieu de supposer sa présence permanente. Une seule attente change
intentionnellement : child-mobile attend désormais le dock visible sur ordinateur
après rotation, avec quatre favoris et catalogue fermé. Aucun instantané de
règles modifié, aucun test de l'étape 2 ajouté implicitement.

## APK et limites

- Version **0.32.2**, versionCode **37** ; com.conqueteserpents.famille conservé.
- Certificat SHA256 identique à l'APK 0.32.1, vérifié sur les deux binaires :
  d018e28e8ab916b4cb46ef53e2c696079415304be87cb0cf90662df94598d599.
- SHA256 APK : b90827aeab10b414da05bea38e0a8073be33571543ccb1065b3ca015720a89d1.
- 13 107 787 octets ; **27 fichiers web identiques** au build vérifié, comparés
  octet par octet après npm run verify. [Reçu APK](../../reports/suivi-0.32.2/apk.json).
- sensorLandscape et absence de permission INTERNET vérifiés dans le manifeste
  binaire. Aucun SDK de publicité, achat ou serveur ajouté ; aucune image générée.
- Les sources de règles, RNG, générateurs de départ et sauvegardes sont inchangées.
  Les tests de compatibilité restent distincts d'un essai physique de migration.
- À la livraison, Chromium cloud et tactile émulé : **aucun essai physique S24 par Codex**, FPS/RAM Android,
  achat, publicité, test Play, changement d'icône ou d'identifiant définitif.
- Le site public reste en 0.32.1 ; aucun déploiement de cette étape.

## Fichiers de réalisation

Application : src/style.css, src/ui/reinforcementsDrawer.ts,
src/ui/battleNotices.ts, src/render/battleFeedback.ts, index.html.
Version : package.json, package-lock.json, android/app/build.gradle.
Recette : scripts/interface-0322-browser.mjs, scripts/child-mobile-035-browser.mjs,
scripts/reinforcements-scroll-037-browser.mjs, tests/reveal-controls.mjs,
tests/browser.mjs. Suivi : ce bilan, IMPLEMENTATION-0.32.2.md, PLAN-ACTUEL.md,
docs/captures-0.32.2 et reports/suivi-0.32.2 ; rapport de défilement versionné.
Les pièces et constats de l'étape 0 sont conservés dans leur commit documentaire.

**STOP : le parent teste l'APK sur son S24.** Aucun GO déduit pour l'étape 2.

Travail conservé sur la branche locale fix/audit-interface-0322, dans
/workspace/conquete-serpents-0322. Le dépôt principal et les anciens worktrees
ne sont pas remplacés ; aucune fusion ni poussée distante dans cette étape.

## Retour du parent sur le S24 — 8 novembre 2026

« fluide a mon niveau su s24 ». Le parent rapporte une fluidité satisfaisante
sur son appareil. C'est une observation qualitative, sans relevé FPS/RAM et sans
confirmation détaillée du catalogue, des commandes ou des marges système. La
version concernée est 0.32.2 par le contexte de l'APK fourni, sans numéro relu
sur l'appareil. [Trace du retour](../../reports/suivi-0.32.2/retour-parent-s24.json).

Aucun code, APK, règle ou sauvegarde modifié pour consigner ce retour. Les reçus
de compilation et de tests de la livraison restent historiques et inchangés.
**STOP maintenu : le retour de fluidité n'est pas un GO pour l'étape 2.**
