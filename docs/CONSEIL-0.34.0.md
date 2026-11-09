# Conseil après le lot graphique — v0.34.0

9 novembre2026. Trois personas techniques et trois profils cibles6/9/12ans.
Relectures indépendantes de1b1e6c4..63c9a03, captures réelles avant/après et
référence iconique. Les profils enfants sont **simulés** ; aucun enfant réel
ni S24 physique n’a été observé. Les corrections ultérieures47cdeb6 sont vérifiées
par les recettes rouges/vertes, pas par une seconde validation fictive du conseil.

| Persona                      | Constat                                                                                                                                                                                | Traitement                                                                                                      |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Architecture et règles       | Aucune régression du moteur, des routes ou du chargement. Contours absents dans Canvas déjà avant ce lot ; nom du test palette trop large, transition avec image retardée non exercée. | Contours corrigés ; nom du test resserré ; retard et échec/Réessayer vérifiés réellement.                       |
| Rendu mobile et performances | Cadre statique mis en cache, centre dégagé, ponts au-dessus de l’eau et sous les acteurs. Images complètes décodées pour leurs seuls bords ; deux cadres conservés après visite.       | Coût borné documenté ; atlas compact différé. Pas de promesse de mémoire résidente limitée à une seule texture. |
| Accessibilité                | Choix désactivés identiques aux actifs sur tactile ; teintes Phaser ignorées par Canvas. Sélection/focus et géométrie tactile conservés.                                               | Deux problèmes hérités classés importants et corrigés dans une seule passe, avec preuves.                       |
| Cible6ans simulée            | Chemins et figurines plus distincts ; pas de blocage visible. Les bords gravés restent plus illustrés que l’icône. Petits libellés et regroupement au refuge à observer.               | Usage périphérique maintenu ; pas de nouvelle génération. Test familial à faire.                                |
| Cible9ans simulée            | Trois voies et ponts lisibles, variété visible, pas de faux obstacle central. Manque de capture avec une carte sélectionnée.                                                           | Captures allié/miel sélectionnés ajoutées à812×375 et1280×800.                                                  |
| Cible12ans simulée           | Lecture tactique conservée ; pas de mécanique nouvelle suggérée. Répétition de petits décors et matière gravée du marais encore visibles.                                              | Retouches mineures différées ; aucune nouvelle règle ou promesse de lieu.                                       |

## Corrections et preuve

Recette réelle avant correctifs : quatre contrôles faux, zéro pixel de contour
orange en Canvas. Après : surfaces indisponibles distinctes,1515pixels orange
par scène Canvas aux deux formats, mêmes contours fonctionnels vert/orange.
18petites surfaces128×128 partagées dans le témoin, stables entre images et
toutes libérées à l’arrêt de scène. Pas d’atlas complet recoloré, pas de nouveau
travail de silhouette dans le rendu WebGL.

Huit contrôles finaux : états indisponibles, contours Canvas et cache aux deux
formats ; chargement en échec avec reprise ; chapitre suivant avec image retardée
et conservation de l’ancien terrain jusqu’à disponibilité. Zéro erreurJavaScript.
[Recette](../reports/suivi-0.34.0/states-and-loading.json).

## Décisions et mineurs différés

- Cadres périphériques : les fonds picturaux/gravés ne remplacent pas le centre
  sculpté calme. Choix réversible ; risque de cohérence de matière encore partielle.
- Corriger les deux défauts visuels hérités dans ce lot : ils affectent les
  repères fonctionnels ; correction purement rendu/CSS, sans migration de camp.
- Différer l’atlas de bords compact, le fondu plus fin, la réduction de répétition
  et la petite bordure normale plus contrastée. Les textes10–11px restent une
  observation familiale, pas une conformité ou une compréhension attestée.

Recommandation du conseil : version utilisable pour essai familial ; aucune
régression bloquante nouvelle trouvée. Les deux limites héritées signalées ont
été corrigées et vérifiées avant livraison. Cela ne valide pas les performances
natives, le lecteur d’écran, les gestes réels ou la compréhension des enfants.
