# Bilan graphique — v0.34.0

9 novembre 2026. Le point 3 demandé est livré dans un lot graphique borné, sans
changer les règles du fils. [Conseil six personas](CONSEIL-0.34.0.md),
[preuves](../../reports/suivi-0.34.0/verification.json).

## Ce qui change

| Sujet                                      | Fait / pas fait                                                                              | Preuve                                                             |
| ------------------------------------------ | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Fonds fournis crue/marais                  | Fait : cadres périphériques sur les terrains existants ; centre sculpté calme conservé       | Captures avant/après, manifeste de provenance, originaux inchangés |
| Chemins                                    | Fait : pavés mats biseautés, lumière et relief plus lisibles                                 | src/render/craftPaths.ts ; mêmes échantillons de routes            |
| Ruisseau                                   | Fait : palette enrichie ; petits décors qui semblaient flotter retirés                       | stageComposition et test24couples terrain/graine ; ponts inchangés |
| Renforts                                   | Fait : cartes papier crème, relief des boutons et choix indisponibles atténués               | Sélection et indisponibilité capturées sur ordinateur/tactile      |
| Contours en Canvas                         | Fait : silhouettes vertes/orange générées en mémoire depuis les alpha existants              | Mesure0→1515 pixels orange ; cache stable et libéré                |
| Harmonie intégrale de tous les personnages | Pas fait : sprites existants conservés, déjà sculptés ; marais encore plus gravé que l’icône | Limites du conseil, originaux conservés                            |
| Nouvelles règles/lieux/météo               | Pas fait, volontairement                                                                     | 24 fichiers de règles/sauvegardes identiques à1b1e6c4              |
| Images payantes/SDK/pub/achats             | Aucun                                                                                        | Pas de nouvelle dépendance ou permission commerciale               |

## Rendu observé

Le site 0.33.1 a été ouvert dans des contextes Chromium isolés, puis les vues
locales avant/après ont été comparées. L’environnement ne proposait pas de bureau
Chrome partagé ; captures et navigation automatisée réelles ont été utilisées.
Les trois chapitres et trois géométries conservent trois voies, leurs connexions,
positions des ponts et obstacles réels. Les centres restent dégagés.

[Avant812](../captures-0.34.0/terrain-avant-812.png),
[après812](../captures-0.34.0/terrain-apres-812.png),
[crue812](../captures-0.34.0/crue-812.png),
[sélection](../captures-0.34.0/selection-812.png),
[indisponible](../captures-0.34.0/indisponible-812.png),
[Canvas](../captures-0.34.0/canvas-contours-812.png).

Les fonds ne créent ni nouveau niveau ni nouvel obstacle. La crue cadre les
clairières et géométries0/2 ; le marais la géométrie1 et le jardin de pierres ;
le bosquet reste ambré. Pas de mécanique météo induite par une illustration.

## Contrôles

- npm run verify : **441/441**, types, formatage, build et budgets verts.
- npm run test:browser : ordinateur et tactile verts, zéro erreurJavaScript.
- npm run test:interface-audit : **24/24**, notamment1280×800,1366×768,780×360.
- npm run test:audit : **13/13** ; rapport historique restauré, résultat courant séparé.
- npm run test:child-mobile : **6 formats** ; portrait 375×812 avec consigne de rotation.
- npm run test:reinforcements-scroll : **5 formats tactiles et ordinateur**.
- npm run test:offline : **10 contrôles**, schémas 1–7, chapitres 1–3,25 fichiers
  servis depuis le paquet, zéro externe/manquant. Ce n’est pas une promesse PWA.
- Comparaison graphique dédiée : **14 paires** à 1280×800 et 812×375, y comprisCanvas,
  états complets et RNG identiques ; pas14parties simulées.
- États/chargement : **8 contrôles**, sélection capturée, indisponibilité visible,
  contours Canvas, cache réutilisé/libéré, échec/Réessayer et chapitre retardé.

Les tests des nouveaux choix de cadre et du ruisseau ont été vus rouges puis
verts. Les deux défauts hérités du conseil ont également une reproduction rouge
et une recette verte ; aucune règle corrigée au passage. Logs et empreintes dans
reports/suivi-0.34.0. Aucun résultat de CI distante n’est assimilé à ces tests locaux.

## Coût et limites techniques

Deux WebP1600×900,554862/528320octets. Un seul cadre utile demandé au chargement
d’un terrain, aucun à l’accueil ; les deux peuvent rester en cache après visite.
Chacun représente environ 5,49 Mio RGBA théoriques, hors copies/GPU. Un atlas de
bords compact est une optimisation différée. Le terrain reste calculé une fois
par changement puis mis en cache ; pas de nouveau shader, filtre ou animation.

Canvas utilise de petites cellules128×128 par frame/couleur réellement rencontrée,
partagées entre unités. Témoin :18cellules,1 179 648 octets RGBA théoriques, stables
entre images et zéro cellule après arrêt de scène. Pas de recoloration d’atlas
entier et pas de ce coût supplémentaire en WebGL. Ce ne sont pas des mesures
physiques de mémoire totale ni de FPS sur S24.

## Livraison

[APK debug normal0.34.0](/workspace/conquete-serpents-v0.34.0-debug.apk), code 42,
15 045 306 octets. SHA256 :
`85d098fe001c2f16cd82b888c4af0032797e4559b5eac5121b18b0bb3c0515bc`.
Même identité provisoire/certificat, paysage capteur, démarrage normal `/` ;
30 fichiers web identiques au build testé et 20 PNG du lanceur inchangés.
Aucune permission INTERNET/BILLING/AD_ID. [Inspection](../../reports/suivi-0.34.0/apk.json).
Publication web exacte et contrôle en ligne consignés dans le reçu distinct
reports/deployment-0.34.0.json. Publication Google Play et choix final d’identifiant
restent hors de ce lot.

Restent à confirmer physiquement : installation par-dessus l’ancien APK avec
un camp réel, gestes/barres système du S24, lecture et précision des enfants.
La cohérence de matière reste partielle aux bordures gravées, volontairement
limitées ; les petits libellés, le fondu et la répétition des accessoires peuvent
être affinés après essai. Aucune génération payante n’a été lancée.

## Fichiers applicatifs et ressources modifiés

- src/art.ts ; src/render/stageLayout.ts, missionAssets.ts, refinedTerrain.ts,
  craftPaths.ts, sceneryFrame.ts, actors.ts et canvasContours.ts.
- src/ui/battleDock.ts et craftSurfaces.css ; package.json/package-lock.json ;
  android/app/build.gradle.
- Deux WebP dans src/assets/illustrated ; scripts/export-scenery-034.py et
  resources/scenery ; provenance publique et README des ressources fournies.
- Recettes scripts/craft-034-browser.mjs, craft-states-034-browser.mjs et
  tests/craft-scenery-034.test.ts ; bilans, plan, conseil, rapports et captures.

Les sources PNG, l’icône, les sprites d’unités, la géométrie et les sauvegardes
restent inchangés. Liste exacte des modules protégés : protected-files.json.

## Publication web vérifiée

[Site](https://conquete-serpents-famille.zyclope.chatgpt.site/) en 0.34.0, Sites 19,
audience publique conservée, déploiement réussi.
[Reçu](../../reports/deployment-0.34.0.json). Navigation en ligne réelle et isolée à
1280×800,812×375 et 375×812 : version, accueil, mission/vague1, quatre favoris,
aide, une pause HTML et rotation, zéro erreurJavaScript. Aucun cadre à l’accueil,
un seul cadre utile demandé au lancement. Les deux contextes ont exercé crue et
marais. HTML31 299, JS193 413 et CSS65 442 octets en ligne identiques au build.
Plateau mobile580,13×326,98px,87,20% de la hauteur et 71,44% de la largeur.

[Capture réelle du site sur format téléphone](../captures-0.34.0/site-reel-812.png).
Les contextes sont neufs et ne modifient pas le camp réel du parent.
