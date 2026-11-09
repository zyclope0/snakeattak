# Bilan — parties jouées, interface et équilibrage, v0.34.2

9 novembre 2026, Europe/Zurich. Demande : jouer quelques parties et examiner
le rendu, les bugs, l'interface et l'équilibrage. Base v0.34.1 `ac671ed` ;
correctif applicatif `3895959`, v0.34.2/code Android 44.
[Conseil six personas](CONSEIL-0.34.2.md),
[plan et journal des décisions](PLAYTEST-2026-11-09-PLAN.md).

Le défaut prioritaire était un parcours de fin de partie incomplet : les
boutons existaient, mais restaient dans le catalogue masqué. Ils sont maintenant
visibles après victoire et défaite. Aucun paramètre d'équilibrage n'a changé.

## Ce qui a réellement été joué

Le navigateur intégré pilotable n'était pas disponible dans cet environnement.
Les essais utilisent Chromium/Playwright sur le vrai site public, dans des
contextes isolés. Achats, placements, codes de départ et vagues passent par
de vrais événements souris/tactiles de l'interface. Aucune sauvegarde du parent
ni commande de moteur injectée. La progression déverrouille réellement les
missions suivantes.

L'horloge Playwright `runFor` énumère les images d'animation et le jeu utilise
son option ×2 : ce sont des sessions automatisées accélérées, pas des séances
d'enfants en temps réel. Les durées simulées ne mesurent donc pas l'ennui ou
le plaisir. Les stratégies d'achat sont bornées et imparfaites.

| Évaluation publique v0.34.1                                | Vagues atteintes | Résultat | Cristal final |
| ---------------------------------------------------------- | ---------------- | -------- | ------------- |
| Mixte — Refuge                                             | 3/3              | Victoire | 100 %         |
| Mixte — Trois ponts                                        | 3/3              | Victoire | 100 %         |
| Mixte — Course des vifs                                    | 3/3              | Victoire | 100 %         |
| Mixte — Premières coquilles                                | 3/3              | Victoire | 82 %          |
| Mixte — Dragon et sonnette                                 | 3/3              | Victoire | 100 %         |
| Mixte — Carrefour des fougères                             | 4/4              | Victoire | 82 %          |
| Aucun recrutement — Refuge                                 | 3/3              | Victoire | 91 %          |
| Achats simples — Refuge                                    | 3/3              | Victoire | 100 %         |
| Aucun recrutement — Grande aventure                        | 5/12             | Défaite  | 0 %           |
| Davantage d'archers, placements en avant — Grande aventure | 7/12             | Défaite  | 0 %           |

Soit **10 parties d'évaluation terminées, 37 vagues, 8 victoires/2 défaites,
aucune erreur JavaScript remontée**. Ce petit échantillon n'est pas un taux de
victoire attendu chez les enfants. Le boss final n'a pas été atteint dans les
parties navigateur ; sa difficulté est examinée uniquement par les simulations.

Une mission Refuge complète supplémentaire a été jouée sur le build local
v0.34.2 : victoire à 100 %, puis le bouton visible ouvre l'aperçu des Trois
ponts. Le même parcours est confirmé sur le site public après déploiement :
victoire et bouton suivant fonctionnels. Soit **12 parties terminées et
43 vagues au total**, dont dix seulement constituent l'évaluation initiale.
Les deux confirmations sont consignées à part, sans gonfler cet échantillon.

[Journal des 10 parties](../reports/playtest-0.34.1/browser-games.json),
[phase initiale préservée](../reports/playtest-0.34.1/browser-games-before-ranged.json),
[partie classique supplémentaire](../reports/playtest-0.34.1/browser-ranged-classic.json),
[partie locale après correctif](../reports/suivi-0.34.2/played-confirmation-local.json).

## Constats et décisions

| Constat                                                                      | Fait / pas fait                | Preuve et portée                                                                                                                                                                            |
| ---------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mission suivante, carte et réessai invisibles après victoire                 | Corrigé                        | [Avant réellement joué](captures-0.34.2/avant-victoire-1280.png), [après réellement joué](captures-0.34.2/apres-victoire-jouee-812.png) ; `src/ui/battleResult.ts`, mêmes actions déplacées |
| Recommencer invisible après défaite classique                                | Corrigé                        | [Avant réellement joué](captures-0.34.2/avant-defaite-812.png), [après en état contrôlé](captures-0.34.2/apres-defaite-fixture-812.png) ; recette rouge puis verte                          |
| Nouveau panneau : catalogue desktop, ordre Tab et bouton avec marges système | Corrigé après conseil          | 8 échecs reproduits ; 30 états et 35 contrôles finaux verts ; `scripts/result-0342-browser.mjs`                                                                                             |
| Serpents et trois voies reconnaissables                                      | Conservé                       | [Combat réel des coquilles](captures-0.34.2/combat-coquilles-1280.png) : contour ennemi distinct, centre plus calme que les bords ; pas de refonte complète prétendue                       |
| Cohérence pâte à modeler/papier mâché                                        | Partielle                      | Certains sprites métalliques et textures restent plus réalistes que l'accueil/icône ; aucun nouvel asset généré dans ce lot                                                                 |
| Densité autour du refuge et des soins                                        | Amélioration future            | [Combat classique réel](captures-0.34.2/combat-classique-812.png) : silhouettes, barres et étiquettes proches ; ne pas ajouter de nouveaux signaux avant de hiérarchiser ceux-ci            |
| Étoiles du résultat discrètes, ancien conseil central de défaite             | Différé                        | Résultat utilisable, mais hiérarchie et cohérence du texte encore perfectibles ; pas de nouvelle mécanique nécessaire                                                                       |
| Défilement secondaire sur très petit paysage                                 | Accessible, indice à améliorer | [État contrôlé 568 avec marges](captures-0.34.2/apres-derniere-fixture-568-marges.png) ; bouton principal visible au départ, panneau seul défilant                                          |
| Équilibrage, nouveaux modes ou statistiques d'unités                         | Non modifiés                   | 73 fichiers TypeScript hors UI identiques à la base, dont règles/rendu/persistance ; empreintes dans `verification.json`                                                                    |

Le panneau de résultat réutilise les nœuds, handlers, scores et commandes
existants. Il restaure leur parent et leur ordre quand on quitte le résultat.
Le catalogue reste consultable volontairement ; focus d'entrée une seule fois,
ordre visuel et clavier identiques. Le défilement de correction concerne le
panneau, jamais la page. Pas de second calcul d'étoiles, graine ou progression.

## Équilibrage : ce que disent les simulations

**432 simulations de missions** : six missions × 18 configurations × quatre
politiques. Attention : seulement **trois graines uniques par mission**,
déclinées en six combinaisons attaque/couvée. Les observations sont appariées,
pas 18 tirages indépendants par mission.

| Mission             | Mixte | Distance | Soigneurs | Aucun recrutement |
| ------------------- | ----- | -------- | --------- | ----------------- |
| Refuge              | 18/18 | 18/18    | 18/18     | 18/18             |
| Trois ponts         | 18/18 | 18/18    | 18/18     | 18/18             |
| Course des vifs     | 18/18 | 18/18    | 18/18     | 4/18              |
| Premières coquilles | 18/18 | 18/18    | 15/18     | 0/18              |
| Dragon et sonnette  | 18/18 | 18/18    | 5/18      | 0/18              |
| Carrefour           | 18/18 | 14/18    | 4/18      | 0/18              |

Total 330 victoires/102 défaites, aucun délai de combat dépassé. Le profil mixte
place selon la voie faible et utilise miel/encouragement ; le profil distance
place les archers en arrière et utilise le miel collant. Les autres politiques
ne bénéficient pas des mêmes décisions. Ces résultats ne mesurent donc pas
l'effet isolé d'une classe d'unité.

Les deux premières missions pardonnent même l'absence d'achats, mais les achats
restent récompensés : Trois ponts donne en moyenne 1,56 étoile et 54 % de
cristal sans recrutement, contre 3 étoiles/100 % pour le mixte. Je recommande
de conserver cette tolérance d'apprentissage jusqu'au prochain essai familial.
Les soigneurs seuls perdent nettement ensuite : aucune preuve pour les affaiblir
encore globalement.

**100 simulations de Grande aventure** : cinq politiques × 20 graines
appariées, toutes les récompenses de chapitre volontairement ignorées comme
contrôle neutre. 64 victoires/36 défaites, aucun délai dépassé.

| Politique de l'outil | Victoires |
| -------------------- | --------- |
| Équilibrée           | 7/20      |
| Mêlée et soins       | 19/20     |
| Distance             | 20/20     |
| Lourde               | 12/20     |
| Occasionnelle        | 6/20      |

Ces politiques diffèrent aussi par leurs achats, soins et placements. Le
programme « distance » du moteur gagne 20/20 ; la partie avec davantage
d'archers jouée dans l'interface perd à la vague 7. Ce contraste invite à mieux
expliquer et mesurer le placement, pas à décider que les archers gagnent seuls.
85 simulations atteignent la vague 12 ; sa durée médiane est 56,23 secondes
de jeu et ses dégâts moyens au cristal 24,4 points. Ce n'est pas une recette
visuelle des trois têtes du boss dans le navigateur.

Le premier contact médian du profil mixte est proche de 9,93 secondes de jeu.
Le temps sans unité en état d'attaque comprend déplacement, récupération et
soins : il ne mesure pas une proportion de partie « ennuyeuse ». L'option ×2
existe déjà ; aucune accélération supplémentaire n'est introduite.

[432 — synthèse](../reports/playtest-0.34.1/balance-summary.json),
[données](../reports/playtest-0.34.1/balance-games.json),
[100 — synthèse](../reports/playtest-0.34.1/classic/balance-summary.json),
[données](../reports/playtest-0.34.1/classic/balance-100.json).
L'ancien outil des 100 parties bloquait sur la récompense de chapitre : corrigé
par la commande publique `skipReward`, sans changement des règles. Cette
politique neutre sous-estime l'aide des cadeaux choisis par un joueur.

## Vérification finale et livraison

| Commande / recette                                     | Résultat                                                               |
| ------------------------------------------------------ | ---------------------------------------------------------------------- |
| `npm run verify`                                       | 441/441 tests ; format, types, build et budgets verts                  |
| `npm run test:browser`                                 | Scénarios ordinateur et tactile verts, zéro pageerror                  |
| `npm run test:child-mobile`                            | Six formats verts                                                      |
| `npm run test:interface-audit`                         | 24/24                                                                  |
| `npm run test:audit`                                   | 13/13 ; rapport historique restauré intact                             |
| `npm run test:missions` et `test:missions:regressions` | Parcours et régressions verts, pas de compteur de tests inventé        |
| `npm run test:departures`                              | Codec 108 configurations, import/rechargement/copie/tactile verts      |
| `npm run test:offline`                                 | 10 contrôles, 25 fichiers servis, anciens schémas 1–7 et chapitres 1–3 |
| `npm run test:interruptions`                           | 11 contrôles verts                                                     |
| Recette de résultat dédiée                             | 30 états + 35 contrôles, cinq variantes de format/marges, zéro erreur  |
| Partie complète sur build final                        | Refuge 3 vagues, victoire, bouton suivant utilisable                   |
| APK debug normal                                       | Assemblage Gradle réussi, certificat et identité provisoire conservés  |

[Résultats et empreintes](../reports/suivi-0.34.2/verification.json),
[logs](../reports/suivi-0.34.2/logs),
[recette de résultat](../reports/suivi-0.34.2/outcome-ui.json).
Les états contrôlés ne sont pas trente parties supplémentaires.

HTML 31 845 octets, JS jeu 195 213, CSS 68 441 : budgets inchangés et respectés.
[APK debug v0.34.2](/workspace/conquete-serpents-v0.34.2-debug.apk), code 44,
15 046 950 octets, SHA256
`395bfd95985432f6702a64b382f06aef11fc328fa9332eccbe267d144f35224b`.
Les 30 fichiers web embarqués sont identiques au build validé ; lancement normal,
paysage capteur, aucune permission INTERNET/BILLING/AD_ID.

Publication v0.34.2/Sites 21, audience publique conservée :
[reçu](../reports/deployment-0.34.2.json),
[victoire réellement jouée en ligne](captures-0.34.2/site-victoire-jouee-812.png).
HTTP 200, version affichée, HTML/JS/CSS identiques au build vérifiés ; fiche
ordinateur/tactile et consigne portrait conservées, aucune erreur JavaScript.
Ni Google Play, ni publicité, achat,
génération payante ou identité définitive. La recette physique S24, le lecteur
d'écran, le grossissement système et le ressenti des enfants restent ouverts.

Fichiers applicatifs modifiés : `index.html`, `src/ui/battleResult.ts`,
`src/ui/battleResult.css`, `src/ui/controls.ts`, versions `package.json`,
`package-lock.json`, `android/app/build.gradle`. Outillage : trois nouvelles
recettes/scripts de parties/résultat, un harness, réparation de `balance-100`.
Documents, captures et données de cette campagne ajoutés à part ; aucun asset,
SDK ou fichier historique de rapport remplacé.

## Suite recommandée

1. Faire essayer cette fin de partie sur S24 : continuer, réessayer le même
   départ, retrouver les alliés. Observer l'autonomie, pas seulement la victoire.
2. Vérifier avec les enfants s'ils comprennent où placer un archer et pourquoi
   recruter au début ; améliorer les explications existantes si nécessaire.
3. Isoler ensuite la Grande aventure : mêmes budgets, placements, outils et
   choix de cadeaux, une seule variable modifiée à la fois, davantage de graines.
   Proposer les valeurs au parent avant toute modification de règle.
4. Harmoniser progressivement silhouettes et hiérarchie des étiquettes avec la
   direction pâte à modeler, sans charger davantage le terrain central.
