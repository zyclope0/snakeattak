# Vérification du pilote — 2 novembre 2026

## Contrôles réalisés

- Tests de simulation : départ, recrutement, économie, pause, mort définitive, soins, navigation, vagues, récompenses, victoire et défaite.
- Partie de six vagues gagnée par une stratégie automatisée réelle (achats entre vagues, aucun dégât ennemi forcé).
- Régression : soldats immobilisés près des rochers ; segments initiaux corrigés et placements dans les cellules inaccessibles refusés.
- Régression : serpent/boss bloqué au pont par asymétrie des portées ; ciblage corrigé.
- Régression : fuite du boss déclenche désormais une défaite.
- Relecture indépendante : trois défauts identifiés et corrigés, dont l'aide qui reprenait une partie déjà en pause.
- Navigateur Chromium : recrutement, démarrage, pause, aide et nouvelle partie.
- Émulation tactile 390 × 844 : recrutement et lancement ; aucun débordement horizontal.
- Build TypeScript et Vite ; essai du HTML autonome avec une URL file://.

## Limites des vérifications

Pas d'essai sur un iPad physique ni sur Safari. Les captures et les tests tactiles proviennent d'une émulation Chromium. Aucun hébergement public n'a été créé. Pas de génération payante supplémentaire pendant la réalisation du pilote.

## Extension tactique 0.3

19 tests automatisés : nouvelles voies, score des défenses, biais croissant avec la vague, éclosion et pause, reproductibilité, vrai changement de voie aux jonctions et parcours vertical visible. Relecture indépendante : correction d’un raccourci A* qui ne suivait pas les liaisons dessinées. Essai de parties complètes et test navigateur ordinateur/mobile renouvelés. La sophistication progresse avec les vagues ; pas de menu de difficulté séparé pour le moment.

## Architecture 0.4

22 tests passent. TypeScript vérifie aussi les tests et la configuration. Exports web et portable séparés ; HTML web 6 084 octets, JS du jeu 23 178 octets, Phaser 1 481 772 octets, PNG 650 406 octets. Essais Chromium ordinateur et tactile renouvelés sur HTTP avec politique CSP et cache immutable, puis sur file:// pour le portable. Audit npm complet sans vulnérabilité signalée au moment du contrôle. CI GitHub fournie mais pas exécutée à distance. Aucun serveur de production ni backend cloud créé.

## Goûter 0.5

28 tests de logique : utilisation unique, validation de voie, gratuité, pause, expiration, recharge, attraction statistique, résistance du boss et vrai changement aux jonctions. L’IA sans goûter conserve son comportement à graine égale. Essais navigateur enrichis pour le miel sur ordinateur et tactile, sur les builds HTTP et portable. Les règles sont dans tactics.ts, les boutons dans ui/feastControls.ts et le dessin dans render/feast.ts. La limite entre moteur et affichage est conservée.

Essai supplémentaire : 20 parties complètes avec utilisation du miel sur des voies différentes se terminent sans blocage. Les commandes du goûter passent les essais Chromium ordinateur et tactile en HTTP et en export portable.

## Aventure 0.6

38 tests automatisés, dont variantes ennemies, souffle de groupe, carapaces, cracheurs, déblocages, santé du dinosaure, ponte du roi et validation/restauration des sauvegardes. Campagnes de douze vagues terminées en simulation, sans intervention sur les points de vie ennemis. Huit campagnes supplémentaires avec recrutement de dragons et miel terminées sans blocage. Ces stratégies automatisées ne remplacent pas un essai d'équilibrage avec l'enfant. Essais navigateur enrichis avec rechargement d'une sauvegarde et verrouillage initial des nouvelles unités.

## Grande petite armée 0.7

44 tests automatisés : catalogue complet, différences des soins, protection des unités cuirassées, charge réellement déclenchée après une course, frappe double et obus de groupe. Six campagnes simulées avec des compositions différentes : cinq victoires, une défaite, aucun blocage ; toutes les nouvelles unités ont été recrutées dans ces essais. Vérifications navigateur : catalogue, fiche du tank, activation/coupure du son, reprise de camp, tablette 1 000/820 px et tactile 390 px. Correction d’un placement tactile rendu inaccessible par le défilement de la boutique ; la sélection ramène maintenant le camp à l’écran. Les tests audio vérifient les commandes et l’absence d’erreur, pas la qualité perceptive sur un appareil physique.

## Présentation 0.8

50 tests de logique, dont observation sans mutation, vie des réactions, annonce unique du boss, pause, nettoyage au redémarrage, files bornées et poses visuelles sans déplacement réel. Comparaison des empreintes des fichiers game.ts, ai.ts, navigation.ts, data.ts, unitRules.ts et checkpoints.ts avec l’archive 0.7 : identiques. Essais navigateur des commandes habituelles, plus scènes dédiées d’arrivée du roi et victoire/rejouer avec mouvements réduits. Asset du roi : 768 × 768 RGBA avec alpha contrôlé, 436 256 octets ; budget de taille respecté. Génération Recraft et préparation via Magnific : 218 crédits annoncés au total, détails dans PROVENANCE.md.

## Prise en main 0.9

56 tests de logique : diagnostic du miel fidèle au tirage existant, signal réservé aux vraies attractions, compteur de détours, suggestions de placement légales, validation des coordonnées, guide lié au vrai recrutement, annonce de fin de vague sans fausse promesse de sauvegarde et achats/réparations selon les phases. Comparaison avec le moteur 0.8 extrait de l’archive : 20 798 pas sur deux graines, avec achats et miel ; états de jeu identiques hors effets de présentation et compteur de détours. Scènes navigateur ajoutées : placement guidé, détour au miel, stockage bloqué ; commandes web et portable contrôlées sur ordinateur/tablette/tactile. Ces essais ne remplacent pas un test réel avec des enfants.

## Diagnostic de la 0.9 — 100 campagnes

100 campagnes via le moteur réel à 30 Hz, cinq politiques sur les mêmes vingt graines initiales : 96 victoires, quatre défaites, aucun délai maximal atteint. Deux exécutions du lot retrouvent les mêmes issues et le même nombre de pas (1 418 304). Les médecins sont présents dans les quatre politiques structurées ; les achats restent légaux et l’économie n’est pas modifiée. En complément, 540 traversées isolées mesurent les jonctions et l’arrivée au camp/base, sans les confondre avec des parties. Détails, limites et reproduction : [bilan d’équilibrage](EQUILIBRAGE-100.md).

Comparaison avec le ZIP des sources 0.9 livré : les neuf fichiers de règles, navigation, tactiques et catalogue sont identiques octet par octet. Aucun réglage de jeu changé. `npm run verify` passe (56 tests, types, build, budgets) ; `npm run test:browser` passe sans erreur de page sur ordinateur et tactile. PDF et graphique contrôlés visuellement. Le temps CPU du moteur exclut le rendu et une tablette physique. Ces bots ne remplacent pas un test avec des enfants.

## Défense vivante 0.10

77 tests natifs passent : secteurs, retour au domicile, répartition des mobiles, ripostes, secours limités, réservation des domiciles, soins sans réparation du bois, objectifs près des rochers, migration v1→v2, ruées, trois fronts et couvées décalées. Les nouvelles régressions ont été observées en échec avant correction. L’ancien test qui réutilisait toujours les mêmes cinq positions pour recruter des ninjas utilise maintenant une armée répartie sur des places libres : les domiciles sont désormais réservés.

100 campagnes comparables sur chaque version, cinq politiques sur vingt graines : 96 victoires en 0.9, 87 en 0.10, aucun blocage sur le lot final. Part moyenne de combattants non mobiles au bord : 86,5 % → 5,4 %. Les lots exploratoires ont révélé des duels bloqués hors de portée, des palissades soignées indéfiniment et un objectif dans un rocher ; leurs causes sont corrigées et couvertes. Les écarts entre stratégies restent un sujet de playtest, pas une preuve d’équilibre parfait.

Revue indépendante finale : aucune issue critique ; deux blocages importants corrigés et testés (poste de tir et domicile migré près des rochers), description de recul corrigée. Les comportements de vague et la séparation moteur/rendu sont conservés. Les mesures de performances du moteur excluent le GPU et les appareils physiques. Détails et paramètres dans [le bilan 0.10](DEFENSE-VIVANTE-0.10.md).

Contrôles de livraison 0.10 : `npm run verify` réussi (77/77, TypeScript, build et budgets) ; essais Chromium HTTP et export file:// réussis sur ordinateur, tablette émulée et mobile 390 px. Scène de contrôle trois fronts exécutée via 240 pas du vrai moteur dans Chromium, répartis entre images ; défense répartie, aucune erreur de page. La commande de fixture est absente du JS de production. Captures de contrôle et comparaison statistique revues visuellement. Le dernier lot correspond à l’empreinte exacte des TypeScript livrés.

## Refonte illustrée 0.11

90 tests natifs passent, dont cartes et cache indépendants, transitions/reprises
sans perte, plaque/impulsion mécaniques, stabilité des cibles et maintien de
l'identité du roi. Le rendu observe les phases sans modifier la simulation.
La revue indépendante a également exécuté216traversées (3cartes×6variantes×3voies×4graines),
sans blocage, et sondé les placements autour des neuf rochers.

Les contrôles Chromium HTTP couvrent les commandes et le catalogue sur ordinateur,
tablettes1000/820px et tactile390px, sans erreur de page. Les scènes contrôlées montrent
les quinze alliés, trois terrains, serpents mécaniques, miel, boss, victoire, placement
et stockage bloqué. Les captures ont été inspectées. Ce sont des fixtures préparées,
pas des preuves de victoire humaine.

Le décor non caché a révélé un coût de rendu élevé : précalcul parclairière puis
réutilisation d'un RenderTexture. La comparaison avant/après a montré des callbacks
d'image médians autour de433ms puis16,7–33,3ms dans ce cloud. Le test de perte/restauration
du contexte WebGL a d'abord échoué : le cache est maintenant invalidé et redessiné ;
le même carré de terrain avant/après est identique. Aucun test physique tablette/Safari.

100campagnes finales :87victoires,13défaites, aucun blocage ; les armées à distance
restent favorisées dans cet échantillon. Les bots ne mesurent ni plaisir ni difficulté
perçue. Les coûts graphiques sont vérifiés :2389crédits et11images WebP totalisant
6 249 280octets ;8atlas1024² et3fonds1600×900. Aucun service payant requis en partie.

Revue finale enlecture seule sans Critical/Important confirmé. Le doublon d'aide
identifié a été supprimé. Deux régressions complémentaires reproduites par la racine
sont couvertes : cache après restauration WebGL et boss classé parerreur comme
serpent à ressort. Les règles de santé/or/spawns globales de la0.10 sont conservées ;
les nouvelles variantes/cartes et la stabilité de cible constituent l'évolution.

Livraison0.11 : `npm run verify` réussi (90/90, types, build et budgets),
`npm run test:presentation` et `npm run test:browser` HTTP réussis, ainsi que les
commandes ordinateur/tablette/tactile sur le portable file://. `test:render` vérifie
le coût des images et la restauration du contexte WebGL. Le JS livré ne contient
pas la commande de fixture. HTML web11 567octets, code de jeu57 448octets,
Phaser séparé1 481 772octets ; portable compilé9 898 722octets. Les11images
de production sont cacheables séparément dans le site normal.

## Chemins vivants 0.11.1

99/99 tests natifs, types, build et budgets passent. Deux défauts Important relevés
par une revue indépendante ont été reproduits avant correction : reprise hors
sentier contre un rocher et orientation d'une morsure pendant le dépassement d'un
soigneur. Les régressions couvrent les deux cartes concernées et les deux sens de
morsure pour normal/cracheur et boss.

54 traversées intégrées couvrent les six variantes, trois voies et trois cartes,
avec contraintes de collision, suivi du tracé et absence de téléportation. Les
540 sondes de transit existantes passent également. 100 campagnes finales :
84 victoires, 16 défaites, aucun blocage à 240 s. Détails dans CHEMINS-0.11.1.md.

Captures des trois terrains et scène de combat inspectées. Chromium contrôle les
commandes en HTTP et en portable file://, les tailles ordinateur/tablette/tactile
et les scènes préparées. test:render contrôle le cache et une vraie perte/reprise
WebGL ; le carré de terrain avant/après reste identique. Dans ce cloud, la dernière
mesure avec un lot CPU en parallèle a des callbacks médians de 50 ms et p95 83,4 ms ;
aucune garantie de FPS sur un appareil physique.

Images de production identiques à la 0.11 (6 249 280 octets), aucune dépense
supplémentaire. Le jeu reste statique, sans dépendance réseau ou compte en partie.

## Refuge et antres 0.12

104 tests natifs passent, dont cinq nouveaux contrôles de sortie/éclosion, santé et
réparation du refuge, pause, réinitialisation et limites des effets. Types, build
normal et budgets réussis. Le nouvel atlas est un WebP transparent 1024² de
792 264 octets ; total images 7 041 544 octets, douze fichiers séparés sur le web.

100 campagnes finales : 84 victoires, 16 défaites, aucun blocage. Résultats par
politique/vague et 1 732 387 pas identiques à la 0.11.1. Les quatorze modules de
règles/IA/navigation/sauvegarde/session comparés restent identiques octet pour octet.

Revue indépendante : un défaut Important corrigé. Un allié légalement placé près
du fort (984,312) était caché ; le fort passe sous tous les combattants. Le test
navigateur recrute réellement une massue par clic à cet endroit, échoue avant
correction puis passe. Les captures montrent le défenseur visible, le refuge à
19 % puis sa réparation réelle à 44 %, et une sortie sur sa voie réelle.

Le contrôle WebGL compare désormais trois carrés avant/après perte/restauration :
terrain caché, fort, antre ; les images sont identiques. Dernière mesure seule
dans ce cloud : callbacks médians 33,3 ms, p95 33,4 ms ; pas de test sur tablette
physique ni garantie de FPS. Les essais Chromium HTTP/portable couvrent les
commandes, tailles ordinateur/tablette émulée et tactile390px sans erreur de page.
La commande de fixture est absente du JS de production.

Coût Magnific vérifié : 218 crédits, 17 215 → 16 997. Aucun service de génération
requis en partie. Les détails et limites figurent dans REFUGE-ANTRES-0.12.md.

## Deux miels et rôles 0.13

120/120 tests natifs passent. Nouveaux contrôles : exclusivité et validité des miels,
vitesse réelle dans la zone courbe, absence d'attraction collante, résistance du roi,
pause et expiration, protection réelle avec cooldown, absence de cumul/auto-protection,
protecteurs morts ou lointains, ninja/cristal en groupe, feuille frontale/marche,
contact/feu/obus, sauvegardes v2, actions de présentation et mouvements réduits.
La sonde intégrée des routes couvre maintenant sept variantes, trois cartes et
trois voies (63traversées), sans téléportation ou collision.

Revue indépendante :119tests et types réussis sans Critical/Important/Minor matériel.
Le dernier objectif A* illégal a ensuite été reproduit par la racine, corrigé à la
frontière de planification et couvert par un test rouge→vert, suite120/120. Les deux
états de campagnes trop longs/inaccessibles sont rejoués après correction.

200campagnes finales :82victoires/18défaites avec attirant seul,92/8 avec alternance,
aucun blocage à240s. Résultats et méthodologie dans MIELS-ROLES-0.13.md. Les cinq
profils d'achat respectent prix et déblocages ; les bots ne garantissent pas le plaisir.
Les armées à distance restent favorisées dans cet échantillon.

La fixture tactique montre la feuille ouverte/fermée, le vrai miel collant, un
bouclier en recharge et le ninja visant un cracheur, avec vrais pas de simulation.
Les images sont des scènes préparées, pas des victoires humaines. La fixture de
victoire contrôle le verrouillage du choix de miel ; les commandes navigateur
vérifient les deux saveurs, pause/utilisation/reset et sélection tactile390px.

Atlas original de336234octets, alpha conservé, coût218crédits vérifié16997→16779.
Treize images de production totalisent7377778octets. Aucun service réseau en partie.
