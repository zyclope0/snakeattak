# Conseil après le lot parties et résultat — v0.34.2

9 novembre 2026. Six relectures simulées : trois techniques et trois points de
vue cibles 6/9/12 ans. Elles portent sur le correctif initial `33a01f2`, les
captures et les preuves alors disponibles. La dixième partie publique et la
confirmation locale sont des compléments ultérieurs du bilan. Aucun enfant
réel n'a participé à ce conseil.

| Persona                | Axe de lecture et synthèse retenue                                                                                                                                            | Traitement                                                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Architecture et mesure | Mêmes nœuds, handlers, résultats et commandes ; pas de règle bis. Les stratégies de simulation et le faible nombre de graines empêchent une conclusion causale sur une unité. | Identité/restauration des nœuds vérifiées ; trois graines par mission et limites des politiques explicites dans le bilan. |
| Mobile                 | Accès aux alliés à conserver ; bouton principal entièrement visible dès l'ouverture, y compris très petit paysage avec marges système.                                        | Défauts reproduits ; accès desktop rétabli et défilement limité au panneau après focus.                                   |
| Accessibilité          | L'ordre clavier doit suivre le bouton principal placé visuellement en premier.                                                                                                | Échec Tab reproduit ; ordre des mêmes nœuds modifié puis restauré, sans tabindex positif.                                 |
| Cible 6 ans simulée    | Rendre évidente l'action suivante après « Bravo », éviter un écran sans suite ; conserver des boutons lisibles.                                                               | « Mission suivante » au premier plan, cible 48 px ; compréhension réelle à observer avec les enfants.                     |
| Cible 9 ans simulée    | Retrouver carte, réessai et alliés ; distinguer progression et étoiles.                                                                                                       | Actions existantes accessibles ; étoiles encore discrètes, amélioration mineure différée.                                 |
| Cible 12 ans simulée   | Comparer les départs et préserver la stratégie ; une victoire automatique de programme n'est pas une victoire enfant.                                                         | Réessai même configuration conservé ; aucun réglage automatique d'unités, limites statistiques documentées.               |

Trois problèmes importants du nouveau panneau ont été confirmés dans l'app
complète, pas seulement déduits de la lecture : catalogue inaccessible sur
ordinateur quand le dock disparaît, ordre Tab divergent, action initiale
partiellement coupée avec marges à 568. La recette élargie échouait sur huit
assertions ; le correctif `3895959` passe 30 états et 35 contrôles supplémentaires.

Pas de seconde approbation fictive des relecteurs : la fermeture de ces points
repose sur la reproduction rouge puis verte, les tests généraux et une mission
complète locale avec le bouton suivant visible et utilisable.

Mineurs conservés en suivi : étoiles plus saillantes, texte central de défaite
à mieux accorder au réessai, indice de défilement des actions secondaires sur
petit paysage. L'absence de blocage sur les données testées ne certifie ni
tous les navigateurs ni le nouvel APK physique sur S24.

[Bilan complet](BILAN-0.34.2.md),
[preuves résultat](../reports/suivi-0.34.2/outcome-ui.json).
