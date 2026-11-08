# Game design — La Conquête des Serpents

## Vision

Tower Defense accessible, chaleureux et expressif, mêlant défense de base et composition d'armée. L'antre des monstres occupe la partie gauche; les monstres progressent vers la zone de défense à droite.

## Boucle

Préparer son armée → lancer une vague → unités autonomes combattent → gagner des pièces → renforcer l'armée → vague suivante.

## Déplacements

Aucun ordre manuel : acquisition de cibles, pathfinding A*, déplacement naturel, évitement des obstacles. Les ninjas sont plus rapides et actifs. Les médecins soignent avant la mort; pas de résurrection.

## Difficulté et économie

Démarrage indulgent, croissance progressive et alternance de vagues nombreuses et vagues d'ennemis résistants. Récompenses légèrement rehaussées. Chiffres exacts à calibrer par playtest avec l'enfant.

## Unités

Confirmées comme idées : héros épée+bouclier, deux massues au départ, ninjas, infirmiers, médecins, combattants à batte, chevaux, chevaliers à deux têtes, bébés dragons, tanks, petits dinosaures. Les capacités précises, prix et statistiques sont des propositions de design à valider, pas des règles fixées.

## Ennemis

Serpents variés, œufs présents sur le terrain qui éclosent aléatoirement et augmentent le nombre de monstres, boss final. Les ennemis tuent les soldats. Comportement des constructions à préciser.

## Direction artistique

**Décision du parent — 8 novembre 2026 : l'icône Magnific retenue fait foi pour
la direction artistique de tout le projet.** Référence visuelle principale :
[original conservé](docs/resources-2026-11/assets/icone-source.png) et
[aperçu de l'icône intégrée](docs/captures-0.32.4/rounded-square.png).

L'univers doit évoquer des figurines et des décors en **pâte à modeler et papier
mâché** : volumes arrondis, matière visible, relief et aspect fait main,
chaleureux et expressif. Cette référence concerne les personnages alliés et
ennemis, les terrains, les constructions, les accessoires, les illustrations
et l'habillage de l'interface. Le rendu reste en 2D/2.5D, lisible en mouvement
et sur téléphone ; le choix de matière ne doit pas brouiller les silhouettes,
les voies ou les commandes. Le contour rouge-orangé des ennemis et le contour
vert foncé des alliés restent des repères fonctionnels à préserver.

Les références antérieures dans `public/references` et les terrains fournis
restent conservés ; leur utilisation future doit être cohérente avec cette
direction. Leur présence ne vaut pas approbation automatique de leur style.
Cette décision fixe la référence des prochains lots : elle ne signifie pas que
les graphismes existants ont déjà été harmonisés, ni qu'une refonte ou une
génération payante est lancée. Le gameplay inventé par le fils est préservé.

## À confirmer avec le créateur

- Condition exacte de victoire et de défaite.
- Rôle précis du héros.
- Les œufs sont confirmés comme incubateurs ; quantité, délai et contenu restent des paramètres d’équilibrage.
- Catalogue final des unités, leurs prix et pouvoirs.
- Système de construction et de placement des défenses.

## Précisions du créateur — 2 novembre 2026

Les œufs sont présents puis éclatent/éclosent aléatoirement et ajoutent des monstres. Au moins trois voies interconnectées ; selon la difficulté, les monstres doivent choisir davantage les chemins les moins défendus. Le pilote tactique implémente ces règles avec trois ponts et deux jonctions. Les valeurs numériques restent proposées.

## Règles confirmées et intégrées en 0.14

Demandes du fils approuvées par le parent : mutants alliés, plusieurs races de dinosaures alliés, ninja très rapide ; cracheurs à dégât direct unique sans poison dans le temps ; serpent à sonnette provoquant une confusion ; cobra royal à collerette infligeant exactement 2 PV à son tueur à sa mort ; mamba noir exactement 3 PV à son tueur ; boss final avec trois têtes. Le boss reste distinct du cobra royal ordinaire.

Les durées, prix et introductions progressives sont des réglages de conception : voir docs/BESTIAIRE-LISIBILITE-0.14.md. Aucune résurrection, aucun ordre manuel, bébé dragon et petit dino conservés du côté allié.

## Idées des enfants reportées après la 0.15

Boss final plus fort avec des protections : souhait rapporté par le parent, à concevoir dans une future passe de gameplay. Aucun supplément de PV, armure ou nouveau pouvoir du boss dans la refonte d'interface 0.15.

## Confirmation et réalisation — 0.16

Le parent valide ensuite la passe boss et équilibrage, avec simulations plus
nombreuses. Le roi possède désormais trois phases (seuils de vie 60 % et 25 %),
chacune avec une protection cassable finie. Les attaques de mêlée la brisent mieux
que les projectiles. Une tête prépare un crachat : zone annoncée au sol puis un
impact unique, sans poison périodique. La ponte existante est conservée. Les
soldats restent autonomes, sans nouvel ordre manuel imposé aux enfants.

Les dégâts des deux mutants peuvent être rééquilibrés dans la configuration de
campagne ; vie, prix, portée et vitesse restent ceux du catalogue. Les réglages
sont fixes pendant la partie. Le bilan 0.16 documente les valeurs livrées et leurs
comparaisons ; les simulations de bots ne remplacent pas les essais des enfants.

## Progression approuvée — 0.17

Le parent valide une passe centrée sur l'envie de rejouer : trois propositions et
un choix après les vagues4 et8. Les offres sont déterministes par aventure et
sauvegardées. Un renfort gratuit à placer, du miel plus durable, une protection
finie du cristal et une réserve de pièces sont proposés par le développeur.
On peut continuer sans bonus. Aucune résurrection ou commande manuelle des
soldats ; aucun nouveau type d'allié. Le roi entrant reste fatal, même avec une
protection. Les deux difficultés et le lien web direct restent des travaux séparés.

## Menu et progression —0.18

Le parent demande une mécanique adaptée par jeu de référence, uniquement si elle
respecte le contexte et la DA. Six adaptations sont retenues : entraînements
exclusifs du héros, carte étoilée, huit favoris, trois équipes sauvegardées,
portée initiale lisible et encouragement temporaire. FusionRushRoyale écartée.
Les douze vagues et trois terrains deviennent trois chapitres de progression,
sans changer les conditions de victoire. Meilleurs scores conservés, camps réels
pour les reprises ; étoiles sans monnaie ni avantage de combat obligatoire.

## Aventure plus lisible — 0.19

Le parent valide le conseil du 4 novembre et une réalisation autonome avec conseil
après chaque étape. Les douze vagues, le bestiaire et la DA restent conservés.
Les œufs imminents, l'hésitation, l'encouragement et la cible du crachat sont
expliqués à partir de l'état réel, sans modifier leurs effets. La carte indique
les décisions propres aux trois chapitres. Seuls l'ordre de quelques ennemis des
vagues 7/9 et les intervalles des trios de la vague 9 changent ; quantités,
variantes, PV cumulés, gains et règles d'œufs restent identiques.

Le jeu dispose d'un accès HTTPS privé ; le camp reste local à son origine et à
son navigateur. Aucun compte interne, mode multijoueur ou synchronisation cloud
n'est ajouté. Les impressions du conseil sont simulées et ne remplacent pas les
essais des enfants. Voir CHAPITRES-0.19, PROTOCOLE-0.19 et CONSEIL-0.19.

## Suite approuvée en autonomie — 0.20

Le parent valide 0.19 et délègue la suite au conseil, avec pour règle de préserver
l'esprit du jeu de son fils. Le conseil retient un bilan factuel des chapitres
4/8/12 et un transfert local de fichier familial. Les soldats, serpents, pouvoirs,
voies, œufs, économie et douze vagues restent exactement ceux de 0.19.
Aucun nouveau badge, monnaie, cadeau, MVP ou règle de difficulté n'est ajouté.

Le fichier transporte le dernier camp préparé, les meilleurs scores et les trois
équipes. Le joueur confirme avant remplacement. Ni combat en cours, ni plateau
final won ne sont transformés en sauvegarde de combat. La connexion et le stockage
restent locaux au navigateur ; aucun service multijoueur ou cloud n'est créé.

## Expéditions approuvées — 0.21

Le parent choisit explicitement un nouveau détachement et un budget défini par
mission, puis autorise la réalisation. Six premières missions jouables avant
extension à 18 ; trois géométries, trois plans d'attaque et deux couvées composent
18 configurations annoncées. Réessayer garde la graine ; nouveau tirage évite
la dernière combinaison. Le classique douze vagues reste séparé. Les blessures
et survivants persistent entre les vagues d'une mission, sans résurrection ;
la mission suivante recrute de nouveaux personnages. Les étoiles ne renforcent
pas l'armée. Android se prépare par enveloppe Capacitor, sans serveur de gameplay.

## Demandes du fils — 7 novembre 2026, version 0.22

Le parent demande des serpents volants progressifs, des médecins/infirmiers
moins forts avec stocks et ravitaillement, et une garde du roi avec soigneur.
Il décrit trois têtes : résistante, distance et mixte. Les valeurs proposées et
vérifiées sont détaillées dans TACTIQUE-0.22 :6/4 bandages,1.6/1.4s entre soins,
recharge4s au fort ; volants dèsrang6 ; têtes50/20/30 et soin ennemi fini.
Les joueurs ne commandent pas les soldats. Aucun mort ou tête tombée ne revient.
Le parent délègue l'équilibrage ; il ne fixe pas ces valeurs numériques lui-même.
