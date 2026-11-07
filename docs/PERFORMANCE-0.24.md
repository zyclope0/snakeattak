# Performance et confort — 0.24

Le rendu et les règles de la 0.23 sont conservés. Cette version réduit les
créations/destructions de vues pendant le renouvellement des vagues.

## Résultat déterministe du test de renouvellement

Une charge synthétique contient 48 alliés et 60 serpents (108 acteurs) ; chacun
possède trois images, plus six étiquettes médicales. Huit générations complètes
sont acquittées après une vraie mise à jour de scène, en WebGL et en Canvas.
Ce sont des tests de rendu, pas huit parties ni une mesure sur téléphone.

| Ressource sur huit générations                     | Avant 0.23 | Après 0.24 |
| -------------------------------------------------- | ---------: | ---------: |
| Images créées                                      |      2 592 |        324 |
| Images détruites pendant le renouvellement         |      2 592 |          0 |
| Textes médicaux créés                              |         48 |          6 |
| Textes médicaux détruits pendant le renouvellement |         48 |          0 |

La première nouvelle génération remplit la réserve ; les suivantes réutilisent
les vues. Cela fait **87,5 % de créations en moins** dans ce scénario.
Les quatre captures de charge normale/forte sont pixel-identiques avant/après,
en WebGL et Canvas. L’état de jeu sérialisé est lui aussi identique.

## Architecture et mémoire

`FramePool` ne contient que des objets de présentation, jamais les entités du
combat. Les acteurs vivants ne sont pas limités. La réserve inactive conserve
au maximum 384 images et 16 textes ; elle est retirée de la display list pour
ne pas participer au rendu ou au tri de profondeur. Elle est libérée à l’arrêt
et à la destruction directe de la scène. Les transformations sont remises à
zéro avant réutilisation, y compris tintFill, flip, alpha et rotation.

Cette réserve échange une rétention bornée de vues contre moins d’allocations.
Ce n’est pas une promesse de mémoire totale plus basse. Le protocole relève
JSHeapUsedSize à titre indicatif : il n’inclut pas les textures GPU, et dépend
du ramasse-miettes. Il n’est pas utilisé comme preuve de baisse de mémoire.

Le terrain était déjà précalculé. Les projectiles/effets sont déjà des tracés
Graphics partagés et les textes de combat ont déjà leur réserve fixe. Aucun
nouvel atlas géant : le test observe seulement 1 à 2 draws WebGL par image ;
un regroupement supplémentaire n’a pas de gain établi et pourrait augmenter
la mémoire texture ou réduire la compatibilité.

## Chronométrage indicatif du cloud

Coût de BattleScene.update au 95e percentile, en millisecondes. Ce chiffre
exclut le rendu Phaser/driver effectué ensuite et ne représente pas le coût
CPU total de l’application.

| Mode / charge       | Avant | Après |
| ------------------- | ----: | ----: |
| WebGL · normal      |  0.60 |  0.90 |
| WebGL · busy        |  1.70 |  1.50 |
| WebGL · turnover-8  |  6.60 |  6.80 |
| Canvas · normal     |  0.50 |  0.40 |
| Canvas · busy       |  1.60 |  1.50 |
| Canvas · turnover-8 |  4.00 |  2.50 |

Le WebGL du cloud utilise **SwiftShader, un GPU logiciel**. Les mesures avant
et après sont sérialisées sans compilation ou autre navigateur concurrent.
La variabilité et le nombre de frames ne permettent pas d’annoncer un gain
universel de FPS ; le gain démontré est le renouvellement des objets, sans
changement d’image ni de règles. Les JSON complets sont dans reports/.

## Effets légers

Dans **Comment jouer**, activer **Effets légers** limite les mouvements et les
animations décoratives. Le réglage reste sur cet appareil, hors des sauvegardes
de campagne. Le choix système de réduction des mouvements reste prioritaire.
Un stockage refusé n’empêche pas de changer le réglage pour la session.

## Mesurer en développement

Lancer `npm run dev`, puis ouvrir l’adresse locale avec `?debug-performance`.
Le compteur affiche les FPS observés et « Maj. jeu » (p95 des mises à jour de
scène), sur une fenêtre de 120 images et un rafraîchissement de 500 ms. Les
retours d’onglet de plus d’une seconde sont exclus de cette fenêtre. Ce compteur
et ses mesures ne sont pas embarqués dans le build de production.

`npm run test:performance` refait les mesures après en vérifiant les images
contre la référence conservée dans artifacts/performance-024/. Pour établir
une nouvelle référence, lancer le même script avec --before dans la source
0.23 conservée ; ne pas remplacer l’avant par la version optimisée.

## Android : validation physique encore à faire

L’enveloppe Capacitor est synchronisée avec les fichiers web testés. Aucun
APK/AAB n’est compilé et aucun téléphone n’est testé ici. Les objectifs 60 FPS
et plancher 30 FPS du brief doivent être vérifiés sur un téléphone réel, avec
le même scénario chargé, la version WebView, le modèle et la température
notés. Une émulation tactile ne remplace pas cette mesure.

Aucune dépense de génération d’assets sur ce lot. Boss à trois têtes, soins
finis, serpents volants, progression et sauvegardes restent inchangés. Les
mécaniques de rejouabilité du lot 3 constituent la suite distincte.
