# Chemins vivants — 0.11.1

Cette passe répond à la capture du bosquet : figurines superposées, orientation
incohérente, ponts en diagonale et routes trop droites/peu visibles.

Les trois sentiers serpentent, évitent les rochers et se rejoignent visiblement
près du cristal. Le dessin utilise la même géométrie que les monstres. Un lit de
terre sombre, des pavés irréguliers et des bordures claires les détachent du décor.
Les tabliers des ponts sont réalignés. Le terrain reste précalculé et restaurable
après perte du contexte graphique.

Les profils d'origine des images sont pris en compte individuellement. Les serpents
regardent leur adversaire pendant une morsure, même lorsqu'ils passent un soigneur.
Les figurines sont environ 20 % plus petites, les barres pleines sont masquées,
les alliés s'écartent à 36 pixels et les serpents occupent deux traces à ±11 pixels.
Ce sont toujours des miniatures fixes animées par transformations, sans poses de dos.

Les tireurs s'approchent d'un front retenu pour obtenir une portée utile en gardant
leur secteur. La séparation seule révélait un duel de boss de 145 secondes avec des
archers arrêtés trop loin ; la correction conserve le test existant de campagne avec
sa limite de 120 secondes. Prix, dégâts, santé et sauvegardes sont conservés.

## Contrôles

99 tests natifs. Les tests supplémentaires couvrent orientation, collision et
continuité des courbes, suivi réel du sentier, séparation, soutien à distance,
54 traversées (3 cartes × 6 variantes × 3 voies), deux reprises hors sentier et
8 cas de morsure en dépassant un soigneur. Les deux défauts relevés par la revue
indépendante ont été reproduits avant correction puis vérifiés avec la suite complète.

Les scènes navigateur préparées présentent les trois cartes et les combats groupés.
Ces captures servent à contrôler l'apparence ; ce ne sont pas des victoires humaines.
Le coût graphique supplémentaire est nul : les images existantes sont réutilisées.

Les rapports finaux sont dans reports/final-0.11.1. Les bots ne mesurent pas le plaisir,
et l'avantage des armées à distance reste un sujet de playtest avec les enfants.

## Campagnes finales

100 campagnes à 30 Hz, cinq politiques sur vingt graines appariées : **84 victoires,
16 défaites, aucun délai de 240 secondes atteint**. Équilibrée 16/20, mêlée/soins
16/20, distance 20/20, lourdes 19/20, choix spontanés 13/20. La 0.11 avait 87/100 ;
les déplacements modifiés changent les combats même sans changer les statistiques.
Ce lot n'établit donc pas un équilibre parfait.

Temps médian jusqu'à la zone de défense : 11,9 s ; distance médiane parcourue :
511 pixels. Vague finale médiane : 57.6 s. Le lot n'intervient ni sur la santé,
ni sur les pièces, ni sur les apparitions ; il utilise les achats et le miel légaux.
Les rapports portent l'empreinte des fichiers TypeScript du moteur livré.
