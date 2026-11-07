# Plateau — v0.28.0

Les raccords secondaires sont dessinés avant les voies principales, à60% de
leur largeur précédente. Terre battue et petites marques remplacent les pavés
secondaires. Les trois ponts, routes de simulation et positions sont conservés.

Le détourage technique retire22249 pixels de fond bleu des bâtiments.19604
étaient opaques : le constat « semi-transparents » de l’audit était incomplet.
La sélection est limitée aux grandes composantes pâles connectées au bord des
cellules, dans leur partie basse. Aucun pixel hors sélection n’est modifié ;
le cristal, les champignons bleus et les sols intérieurs restent conservés.
L’original est conservé à côté et son SHA est dans le rapport de reproduction.
Aucune nouvelle génération ni dépense.

Avant/après : `docs/captures-0.28/`,1280×800 et812×375. Les instantanés de
partie (RNG, unités, ennemis, vie, pièces, cristal) sont identiques à ces deux
tailles. Inspection visuelle effectuée ; les aplats bleus extérieurs ont disparu.
Le sol froid dans les grottes et le cristal bleu restent des détails du sujet.

Vérifications : script de détourage `--check`, build,370 tests, contrôles
navigateur plateau, render et stage. Les résultats détaillés sont dans
`reports/verification-0.28.json`. Les mesures cloud ne qualifient pas Android.

Fichiers : refinedTerrain, strongholds.webp et son original, script Python et
dépendance optionnelle Pillow, script de capture et états, provenance, versions
web/Android, README et ce bilan. Les règles et sauvegardes ne sont pas modifiées.
