# Conseil après le lot fiche compacte — 0.34.1

9 novembre 2026. Trois techniques, trois cibles6/9/12ans simulées. Relectures de
65c4581..35f3b2d, données et captures avant/après. Ce sont des reproductions
Chromium avec marges système24/32px simulées, pas une validation physique du
nouvel APK. Le retour et les captures réels du parent concernent0.34.0.

| Persona            | Constat                                                                                                                                  | Décision                                                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture       | Données, calculs, handlers, pauses et reprise inchangés ; dimensions desktop identiques. Couverture clavier/rotation ouverte à préciser. | Recette clavier ajoutée ; rotation ouverte et grossissement restent des limites de test.                                                    |
| Mobile             | Massue319→259 px, médecin282px,8champs visibles ; X/select48px. À 568 la fiche272px reste défilante.                                     | Compromis petit format documenté, pas de promesse de gain sur chaque taille.                                                                |
| Accessibilité      | Nouveau corps sans tabindex inaccessible au clavier sur petite largeur, sélecteur interceptant les touches.                              | Important : reproduction rouge dans l’app complète, puis région focalisable nommée/focus visible ; Tab/PageDown verts sans changer l’unité. |
| Cible6ans simulée  | Portrait/nom/prix/pouvoir regroupés ; portrait 48 moins expressif et descriptions encore denses.                                         | Aucune baisse typographique supplémentaire ; reconnaissance/lecture à observer avec les enfants.                                            |
| Cible9ans simulée  | Prix/rôle/8rubriques visibles ensemble à 812 ; défilement568 peu signalé.                                                                | Indice de défilement différé, accès tactile vérifié.                                                                                        |
| Cible12ans simulée | Noms longs intacts, comparaison des valeurs facilitée, X dégagé.                                                                         | Avis favorable à l’essai familial ; pas de compréhension réelle prétendue.                                                                  |

Les cinq avis initiaux sans blocage ne remplacent pas le défaut important vu
par accessibilité. Correction91d847b contrôlée par test rouge/vert, sans seconde
approbation fictive des relecteurs. Recette finale16cas +6 contrôles : balayage
natif tactileCDP, page immobile/X fixe, Tab/PageDown et retoursfocusÉchap4formats.

Mineurs différés : indice de défilement et pied secondaire sur 568 ; expression
plus petite des portraits ; confort de lecture des textes 12–13 px. Aucun nouveau
texte de pouvoir, champ supprimé, mécanisme, donnée ou image ajouté.
