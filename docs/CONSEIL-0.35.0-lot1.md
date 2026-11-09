# Conseil lisibilité tactique — lot1 de0.35.0

Six relectures indépendantes du commit `e897834` : architecture, mobile,
accessibilité, puis profils6/9/12ans simulés. Aucun essai réel d'enfant ou S24.

| Persona        | Résultat et traitement                                                                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture   | Règles, RNG, données, scores et sauvegardes inchangés ; attention au conseil de voie masqué après miel et à l'ordre du réessai classique.                                        |
| Mobile         | Grandes étoiles et action principale visibles à812 et568avec marges ; instruction de toucher à conserver. Actions secondaires sous le pli568 restent accessibles par défilement. |
| Accessibilité  | Important : aria-label sur paragraphe sans rôle nommable ; corrigé par graphique nommé. Focus et mêmes nœuds/actions préservés.                                                  |
| Cible6simulée  | Important : rôle expliqué mais geste moins explicite ; préfixe «Touche une place libre à droite». Réessai classique à remettre dans l'ordre réel.                                |
| Cible9simulée  | Réessai d'abord, achats ensuite. Lisibilité des étoiles améliorée ; lecture du groupe médical à observer avec les enfants.                                                       |
| Cible12simulée | Portée et scores réels, aucun réglage dissimulé. Stock regroupé et conseil de voie utiles mais à expliquer sans promesse sur les prochains ennemis.                              |

Correction en un passage des importants après reproduction : préfixe tactile,
consigne classique dans le bon ordre, rôle accessible du score. Le contrôleur
montrait aussi le conseil de rôle dans un catalogue fermé : observation de
l'auteur, corrigée par une instruction compacte en bas du plateau, non cliquable,
qui conserve le rayon réel. La préparation après miel affiche désormais le
conseil de voie plutôt que le statut ancien du pot : priorité reclassée comme
importante pour rendre le nouveau conseil effectivement disponible.

Preuve rouge sur l'ancien commit, avec harness corrigé après une erreur de
démarrage Phaser : trois formats, quatre exigences échouent sans pageerror.
Même recette verte après les corrections : score nommé, instruction visible et
contenue dans le plateau, conseil visible après miel. Tests purs4/4 verts.
L'erreur de harness initiale n'est pas comptée comme preuve de défaut produit.

Mineurs différés : amorce de défilement des résultats secondaires à568,
interprétation des badges partiels et du nombre/délai maximal collectif médical,
reconnaissance des petits labels canvas. Le conseil est une relecture de
conception, pas une mesure de plaisir ou d'apprentissage des enfants.
