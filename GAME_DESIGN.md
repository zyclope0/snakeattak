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

Les durées, prix et introductions progressives sont des réglages de conception : voir docs/archive/BESTIAIRE-LISIBILITE-0.14.md. Aucune résurrection, aucun ordre manuel, bébé dragon et petit dino conservés du côté allié.

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

## Caprices des serpents — validés par le fils, 9 novembre 2026

Chaque mission d'expédition reçoit trois caprices : petit dès la victoire, moyen à
2 étoiles, grand à 3 étoiles. Un caprice change des nombres ou retire une aide ; il ne
touche à aucune des règles du fils. Le fils a gardé 13 caprices, en a renommé 4
(Méga serpent, Blindcrocs, Grandes rafales de serpents, Rafales de serpents) et refusé
« Serpents malins », remplacé par « Bourse trouée » avec l'accord du parent. Il prépare
son propre caprice. Le roi à trois têtes peut venir dans une mission par caprice.
Catalogue et reste à faire : docs/CAPRICES.md.

Le défi du créateur, inventé par le fils le même soir, s'ajoute sur chaque mission
en seconde rangée : facile « La tirelire » (un tiers des pièces de départ reste à la
banque), moyen « Les carapaces » (certains serpents très lents, très solides et blindés,
pas tous), difficile « La grande charge » (rapides, beaucoup de vie et de dégâts).
Le nom de rangée évite le prénom de l'enfant. Valeurs : docs/CAPRICES.md.

## Idées du fils — 15 novembre 2026, à instruire

Retours du fils après le build 61, notés tels qu'il les a dits. **Rien n'est décidé ni
développé.** Sa propre règle pour tout le lot : chaque ajout se pense avec l'équilibrage et
arrive à la bonne vague ou à la bonne difficulté. Toute nouveauté de jeu passe donc par une
mesure, l'accord du parent et une nouvelle révision d'équilibrage ; le voyage version 1,
publié, ne change pas.

Serpents :

1. **Le boss est un cobra royal à trois têtes.** Aujourd'hui : le roi à trois têtes existe,
   et « Cobra royal » est le nom d'un serpent ordinaire. À voir avec lui : l'allure du roi
   (capuchon de cobra) et lequel des deux garde le nom.
2. **Des serpents à grands crocs**, qui font beaucoup de dégâts.
3. **Un serpent très rare, avec très peu de vie**, mais capable par exemple de tuer un
   Massue d'un seul coup.
4. **Un serpent ninja.**

   **Idées 2, 3 et 4 faites le 16 novembre 2026**, dans la grande aventure (révision
   d'équilibrage 4 ; missions, défis et voyage ne changent pas) :
   - « Grands crocs » : sa morsure fait deux fois plus mal. Un par vague dès la vague 8.
   - « Serpent rare » : trois fois moins de vie qu'un serpent ordinaire, mais sa morsure
     vaut toute la vie d'une Massue. Il vient deux fois : vagues 8 et 11.
   - « Serpent ninja » : rapide, il esquive le premier coup (choix du parent). Un par vague
     dès la vague 6.

   Le parent a accepté qu'un joueur expert simulé gagne environ une partie sur deux.
   **18 novembre 2026** : le fils confirme les trois noms. Quand le serpent rare mord, il
   s'écrit « KSSS », en majuscules (son mot). Le parent décide que le serpent ninja se
   téléporte une fois, à la place de l'esquive : quand un allié l'attaque pour la première
   fois, le coup le rate et il réapparaît dans le dos de cet allié. **Fait** : révision 5,
   acceptée après mesure, la difficulté ne change pas (`docs/BILAN-REVISION-5.md`). Le fils ne
   veut aucun mot écrit quand il se téléporte. Les images actuelles sont des serpents existants recolorés ; le parent accorde
   un budget libre pour de vrais dessins.

5. **Des serpents « sauterelles »**, volants, qui sautent derrière nos lignes, dans le dos
   de certaines troupes.
6. **Un plus beau dessin pour les serpents volants.**
7. **Plus d'œufs à mesure que la partie dure.**
   **Fait le 15 novembre 2026** (sens et valeurs choisis par le parent, après mesure) : dans
   la grande aventure, quand une vague dure plus de 45 secondes, un œuf de plus apparaît ; un
   second 15 secondes plus tard ; pas plus de deux par vague. Chacun éclot en 8 secondes et
   donne deux serpents. C'est la révision d'équilibrage 3 : les parties, codes et sauvegardes
   d'avant gardent leurs règles. Missions, défis et voyage ne changent pas.
8. **Un boss final caché**, inspiré du tout premier jeu du serpent qui grandit en mangeant
   (le genre « Snake »), avec une façon de le débloquer à trouver.

Alliés :

9. **Plus d'espèces de dinosaures**, équilibrées façon pierre-feuille-ciseaux. **Le
   spinosaure doit être le meilleur du jeu.** Aujourd'hui : Petit dinosaure, Vélociraptor,
   Tricératops, Stégosaure et Tyrannosaure.

Interface :

10. **Un index des serpents**, comme un petit wiki. Aujourd'hui : il existe des fiches pour
    les alliés, rien pour les serpents.
    **Fait le 15 novembre 2026** : « Tous les serpents » montre les treize serpents et
    l'œuf, avec ce que fait chacun et la vague où il arrive. Il s'ouvre depuis « Dangers »
    pendant une partie et depuis « Favoris ». Aucune règle ni image nouvelle.
11. **Voir ses unités plus vite.** Les favoris lui plaisent, mais il faut trop de touchers
    pour voir tous les alliés. Il accepte que la solution actuelle soit peut-être la moins
    mauvaise.
    **Fait le 15 novembre 2026** (choix du parent) : le catalogue montre tous les alliés sur
    un seul écran, en petites cartes ; plus de pages ni de liste de familles.

Précisions du fils, le même jour :

- **Le boss s'appelle « King Snake »** et a l'allure d'un cobra royal à trois têtes. Le nom
  est le sien : il reste tel quel en français comme en anglais.
  **Fait le 15 novembre 2026** (accord du parent) : là où le jeu disait « le roi à trois
  têtes », il dit « King Snake », en français comme en anglais. « Le roi » tout court reste
  (« Si le roi entre… », « Garde du roi ») : King Snake est toujours un roi. Les caprices du
  fils qui nomment le roi ne changent pas. Son dessin est inchangé.
- **Le serpent ninja** est aussi rapide que le Ninja, et parfois il se téléporte dans le dos
  d'un personnage.
- **La sauterelle** n'attaque pas dans le dos de tous les personnages : elle saute derrière
  les lignes. Ensuite, si le cristal est le plus proche, elle va sur le cristal ; sinon elle
  attaque les personnages qui sont entre le cristal et elle.
- **Dinosaures** : il laisse l'équilibrage pierre-feuille-ciseaux à faire, le spinosaure
  restant le meilleur.
- **Le boss caché** se débloque en touchant des pommes qui apparaissent discrètement tout au
  long de l'aventure.
- **L'index** montre tous les serpents, pas seulement ceux déjà rencontrés.

Précisions du fils, rapportées par le parent le 18 novembre 2026 :

- **La sauterelle**, après son saut, marche normalement comme les autres serpents.
- **Le spinosaure** doit être la meilleure unité du jeu ; il laisse l'équilibrage à faire.
- **Le boss caché** : il laisse choisir le nombre de pommes, après mesure.
- **Dans le voyage**, il veut que King Snake vienne avec ses gardes.
- **« Cristal »** est le seul mot de la jauge que les serpents abîment (décision du parent,
  avec le mot du fils) : le jeu ne dit plus « Camp : 80 % » ni « REFUGE ». Le camp reste le
  lieu où l'on pose ses alliés.

À respecter en les instruisant : les soldats restent autonomes et aucun mort ne revient ; un
serpent qui tue d'un coup doit rester rare, fragile et annoncé ; le boss caché se débloque
en jouant, jamais par un retour quotidien ni un minuteur ; l'hommage au jeu du serpent se
fait avec un dessin original en pâte à modeler ; tout nouveau dessin est une dépense à faire
accepter par le parent.
