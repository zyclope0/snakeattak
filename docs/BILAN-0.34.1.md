# Bilan — fiches compactes S24, v0.34.1

9 novembre2026. Le parent confirme que les fiches défilent mais prennent trop de
place. Le correctif vise leur densité en petit paysage ; l’accueil et ses reprises
ne changent pas. [Conseil six personas](CONSEIL-0.34.1.md).

| Constat                                         | État                                                                                         | Preuve                                                                       |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Portrait et contrôles empilés avant les données | Corrigé : en-tête compact, portrait48px, choix/description à gauche et statistiques à droite | Mesures avant/après, captures812                                             |
| Massue trop haute sur S24 simulé                | 319→259px, environ19% de hauteur en moins ;8statistiques visibles contre0                    | guide-before.json/guide-after.json, marges24/32                              |
| Descriptions longues                            | Médecin282px,8statistiques visibles ; quatre unités testées à quatre formats                 | 16cas de la recette dédiée                                                   |
| Fermeture pendant défilement                    | X fixe48px, corps indépendant ; sélecteur48px                                                | Vrai geste tactile Chromium à568, page immobile                              |
| Défilement clavier du nouveau corps             | Corrigé après conseil et reproduction rouge                                                  | Tab/PageDown, unité sélectionnée inchangée ; focus visible et région nommée  |
| Ordinateur                                      | Dimensions des4fiches à1280 inchangées                                                       | Comparaison avant/après                                                      |
| Validation sur S24 de cette nouvelle version    | Pas faite                                                                                    | Prochain essai physique ; ne pas confondre avec les captures0.34.0 du parent |

[Avant](captures-0.34.1/fiche-before-812-club.png),
[après](captures-0.34.1/fiche-after-812-club.png),
[médecin](captures-0.34.1/fiche-after-812-medic.png),
[petit paysage après balayage](captures-0.34.1/fiche-568-defilement.png).

La nouvelle fiche utilise davantage la largeur pour réduire sa hauteur et
montrer les valeurs sans défilement à812/780. À568, elle reste sur une colonne
et peut être un peu plus haute qu’avant (272contre264px) ; toutes les informations
restent accessibles, avec fermeture fixe. Le compromis ne masque aucun champ.

## Vérification et portée

npm run verify :441/441, types/format/build/budgets verts. Recette dédiée :16cas
(4unités ×812×375,780×360,568×320,1280×800), plus6contrôles de clavier/tactile/focus.
Échec vu avant correction de compacité puis avant correction clavier ; recettes
vertes après. Échap ferme et rend le focus à Fiches aux4formats. Résultats généraux
navigateur, enfant, interface et audit dans reports/suivi-0.34.1.

Les changements sont index.html (structure de la fiche), src/ui/unitGuide.css,
un import CSS dans unitGuide.ts, versions package/Android, recette et documents.
Les calculs des données, règles, RNG, sauvegardes, codes et contrôleurs de pause
restent inchangés. Aucun SDK, image, asset ou service supplémentaire.

Mineurs encore ouverts : indice de défilement à très petite largeur, place du
pied secondaire, reconnaissance des portraits48px, lecture12–13px. Grossissement
système, lecteur d’écran, rotation avec fiche ouverte et usage physique du nouvel
APK non certifiés par les captures. Aucune nouvelle réduction de texte choisie.

APK normal0.34.1/code43 et publication exacte : reçus apk.json et
deployment-0.34.1.json. Identité provisoire et certificat conservés, pas de
publication Google Play. L’essai réel sur S24 reste nécessaire.

## Livraison vérifiée

441/441 et build final verts ; navigateur ordinateur/tactile, six formats enfant,
interface24/24 et audit13/13 répétés après le correctif clavier. Rapports courants
séparés, historique d’audit conservé. HTML31 472octets, JS193 413, CSS67 315 ;
budgets inchangés. Le JS jeu est identique octet par octet à0.34.0.

[APK debug normal0.34.1](/workspace/conquete-serpents-v0.34.1-debug.apk), code43,
15 045 818octets, SHA256
`797b0acdb8af1ad000e5f831575c5408b52a18b44bfa7b6c28269f6ffa307da2`.
Même certificat/identité provisoire,30fichiers web comparés au build, démarrage
normal sans diagnostic, paysage capteur, pas de permission INTERNET/BILLING/AD_ID.

Site0.34.1/Sites20 publié, audience publique conservée.
[Reçu](../reports/deployment-0.34.1.json) : HTTP200, ficheMassue259px et8statistiques
visibles à812 avec marges simulées, même fiche ordinateur560×615px, Échap et
rotation portrait après fermeture corrects ; zéro erreurJavaScript. Les trois
fichiers HTML/JS/CSS en ligne sont identiques au build. Capture du site :
[fiche812](captures-0.34.1/site-fiche-812.png). Cette vérification en ligne ne
remplace pas l’installation du nouvel APK sur le téléphone du parent.
