# Deux miels et des rôles — 0.13

Cette version met en œuvre le choix validé : deux tactiques de miel, bouclier et
ninja mieux différenciés, personnages plus expressifs et serpent parapluie.

## Choix pendant la vague

Un pot gratuit par vague, 14 secondes. Le mode Attirer conserve les probabilités
précédentes : 75 % d'attraction directe aux décisions ordinaires, 25 % pour le roi.
Le mode Ralentir couvre la voie choisie entre x660 et x852, à 34 pixels du centre
courbe ; la marche est multipliée par 0,55, ou 0,75 pour le roi. Il ne modifie pas
les décisions de voie et ne ralentit pas les attaques. Un seul pot empêche le cumul de zones collantes.
L'indicateur explique le choix et ne compte pas de faux détours pour le miel collant.

## Combat

Un bouclier peut réduire de 60 % un tir de cracheur visant un autre allié à 72 pixels,
puis recharge trois secondes. Un seul protecteur intervient ; il doit être vivant
et disponible. Le bouclier garde sa réduction personnelle de 40 %, sans nouvelle
protection contre ses propres tirs reçus.

Le ninja favorise les cracheurs dans les 280 pixels. Quand un ennemi atteint x900,
il donne priorité aux menaces au cristal ; les affectations d'autres ninjas ne
peuvent plus masquer cette urgence. Les autres rôles et coûts restent conservés.

Le serpent parapluie arrive à partir de la vague 6. La feuille ouverte réduit de
75 % les flèches arrivant de face pendant la marche. Il se découvre quand il attaque.
Les coups de contact, le souffle et les obus ne sont pas réduits par la feuille.
Le roi et les serpents issus d'œufs gardent leurs identités précédentes.

## Présentation et architecture

Les coups réels alimentent de petites animations : inclinaison des massues,
ondulation des serpents, souffle du dragon, bond et rugissement visuel du dino,
protection du bouclier et « Poc ! » sur une feuille. Les mouvements réduits retirent
les transformations. Les réactions se figent en pause et se nettoient au redémarrage.
Ce sont des poses animées par transformations ; le parapluie a deux images distinctes.

Un atlas Recraft V4 Pro via Magnific, quatre images et alpha conservé : 336 234 octets.
Coût réel 218 crédits, solde 16 997 → 16 779. Métadonnées : art-assets-0.13.json.
Aucune API ni génération payante pendant une partie. Sauvegardes v2 compatibles.

## Vérifications

120 tests natifs après les nouvelles mécaniques et les correctifs de navigation.
La revue indépendante a exécuté 119 tests avant le dernier correctif de projection,
sans issue critique/importante. Le dernier correctif est couvert par une régression
observée rouge puis verte et la suite complète. Les scènes préparées vérifient les
pouvoirs, le parapluie ouvert/fermé, les deux miels et les états de commandes.

Les lots exploratoires ont révélé un duel trop long à la frontière et une vraie
cible inaccessible au A* près d'un rocher. Les secours limités et la projection de
tous les objectifs alliés corrigent les causes. Les deux états enregistrés ont été
rejoués après correction ; le duel du rocher se résout en moins de quatre secondes.
La limite de 240 secondes des campagnes n'a pas été relevée pour masquer ces cas.

Les bots ne mesurent ni le plaisir ni les performances d'une tablette physique.
L'équilibrage des tirs à distance reste à confronter à des essais en famille.

## Campagnes finales

Deux lots de 100 campagnes, mêmes vingt graines et cinq politiques d'achat :

| Politique de miel           | Équilibrée | Mêlée | Distance | Lourdes | Spontanée | Total  | Blocages |
| --------------------------- | ---------- | ----- | -------- | ------- | --------- | ------ | -------- |
| Attirant seul               | 13/20      | 15/20 | 20/20    | 18/20   | 16/20     | 82/100 | 0        |
| Alternance attirant/collant | 18/20      | 19/20 | 20/20    | 19/20   | 16/20     | 92/100 | 0        |

Les bots alternés posent le collant sur une voie peu défendue et l'attirant sur une
voie forte ; les choix spontanés choisissent leur voie au hasard. Cela compare des
politiques de jeu, pas le seul effet isolé d'un multiplicateur. Aucun changement de
santé, pièces, dégâts ou apparitions n'est injecté dans ces campagnes. Leurs rapports
portent l'empreinte du moteur livré : reports/final-0.13-lure et final-0.13-mixed.

Le temps médian de la vague finale est d'environ 57 s dans les deux lots, p90≤77 s.
La distance reste favorisée : les nouvelles mécaniques ne prouvent pas un équilibre
parfait ni le plaisir d'un vrai joueur enfant. Les anciens lots exploratoires sont
conservés hors des rapports finaux et ne sont pas présentés comme réussis.
