# Architecture — petit jeu familial

## Décision

Le jeu reste une application statique : navigateur + fichiers sur un hébergement HTTPS. Aucun serveur de calcul, compte utilisateur, base de données ni API n'est nécessaire pour cette version. Le code TypeScript est modulaire ; un export portable n'est qu'un format de livraison, pas le fichier dans lequel on développe.

## Responsabilités

| Fichier                     | Responsabilité                                                              |
| --------------------------- | --------------------------------------------------------------------------- |
| `src/main.ts`               | Démarrage : assemble session, interface et Phaser.                          |
| `src/session.ts`            | Session et horloge à 30 calculs/seconde ; pause et redémarrage.             |
| `src/game.ts`               | État de la partie et commandes du joueur ; orchestre un pas de simulation.  |
| `src/engine/`               | Règles d’un pas : apparitions, alliés, serpents, roi, dégâts, fin de vague. |
| `src/tactics.ts`            | Règles du miel, durée et attraction ; sans navigateur.                      |
| `src/ui/feastControls.ts`   | Commandes et statut du goûter.                                              |
| `src/render/feast.ts`       | Pot et parfum dessinés à partir de l’état.                                  |
| `src/ai.ts`                 | Évaluation des voies et choix tactiques pondérés.                           |
| `src/navigation.ts`         | A*, obstacles et cache de chemins borné.                                    |
| `src/data.ts`               | Catalogue historique immuable.                                              |
| `src/render/BattleScene.ts` | Personnages, effets et affichage de l'état du jeu.                          |
| `src/render/terrain.ts`     | Décor fixe.                                                                 |
| `src/ui/controls.ts`        | Commandes HTML et tableau de bord.                                          |
| `src/assets`                | Images de production importées par Vite, avec nom de sortie lié au contenu. |
| `deploy/policy.ts`          | Politiques HTTP et cache, exportées pour l'hébergeur.                       |

Les commandes modifient la session. Phaser demande à la session d'avancer puis dessine son état. La logique du jeu peut être testée directement avec Node. Un callback actualise le tableau de bord ; le moteur ne dépend pas de l'interface. La session coupe les durées invalides et borne le rattrapage après une image lente. À graine identique, les décisions de jeu restent reproductibles.

## Deux distributions

- `npm run build` : `dist/`, site normal. HTML d'environ 28 Ko en 0.21, code du jeu, moteur Phaser, CSS et image séparés. Les assets sont identifiés par leur contenu et peuvent être gardés un an en cache ; le HTML est revalidé pour découvrir les mises à jour.
- `npm run build:portable` : `dist-portable/`, HTML autonome utilisable par double-clic. Ce fichier est volontairement plus gros. Il n'est pas la source du projet.

Les maquettes et dessins de référence ne sont plus copiés dans le site de production. Le prototype V4 reste préservé, y compris dans les distributions. L'export portable et l'export web ne s'écrasent pas mutuellement.

## Qualité et performances

Node 24, TypeScript strict sur l'application, les tests et la configuration ; dépendances verrouillées par `package-lock.json` ; installation reproductible avec `npm ci`. Prettier pour un code lisible. `npm run verify` vérifie format, tests, types, compilation et budgets de taille. Le scénario navigateur démarre lui-même un serveur de prévisualisation local, puis vérifie ordinateur et tactile sur le build de production. Un workflow GitHub est fourni ; il n'a pas été exécuté sur GitHub dans cette tâche.

Mesure indicative avec `npm run benchmark` : 67 alliés, 120 serpents prévus, 3 600 calculs. Lors de la mesure initiale sur le cloud : moyenne 0,48 ms, 95e percentile 0,79 ms. Ce test ne mesure ni le rendu GPU, ni une tablette physique, et ne constitue pas une garantie de performance. Les gros postes de coût sont mesurables sans déplacer le jeu sur un serveur. Éviter d'introduire des optimisations qui changeraient les règles sans mesure ni tests.

Budgets : HTML 32 Ko maximum, code du jeu 200 Ko, moteur Phaser 2 Mo. Un dépassement fait échouer le build. Les tests fonctionnels couvrent les règles, les jonctions, les éclosions, les fins de partie et l'horloge.

## Sécurité et hébergement

Aucun secret dans les fichiers distribués ; aucune clé API ni dépendance réseau requise pendant une partie. Les entrées du joueur passent par les règles de recrutement et d'économie existantes. L'audit npm réalisé pendant cette tâche ne signalait aucune vulnérabilité connue ; cela n'est pas une garantie permanente.

Le build exporte `_headers` pour les hébergeurs qui comprennent ce format, par exemple Cloudflare Pages ou Netlify. Ailleurs, transcrire ces règles dans la configuration de l'hébergeur : notamment GitHub Pages n'applique pas ce fichier. HTTPS doit être activé par l'hébergeur. Le serveur Vite de développement/prévisualisation n'est pas un serveur de production.

La politique inclut nosniff, refus d'intégration en iframe, désactivation des permissions caméra/micro/géolocalisation, scripts uniquement de la même origine, et cache long uniquement pour les assets à empreinte. Les styles inline restent autorisés car Phaser et le tableau de bord ajustent des styles à l'exécution. Le prototype V4 historique conserve sa propre exception pour son script inline. La politique et le cache ont été testés sur la prévisualisation HTTP ; leur application en production dépendra de l'hébergeur choisi. L'export file:// n'a pas d'en-têtes HTTP.

## Lisibilité et prise en main 0.9

`placement.ts` partage la validation spatiale et les suggestions de placement. `Game.canRecruit` expose une requête sans dépense ; `Session.placeSelected` coordonne la sélection et le vrai achat. Les suggestions laissent plus d’espace visuel que le minimum légal et ne limitent pas le placement libre.

`tactics.decideTemptation` ajoute une raison au résultat de choix de voie, avec le même unique tirage aléatoire. Le signal `honey` est produit uniquement pour une décision directement influencée par le pot à une jonction. Le compteur `honeyTurns` compte les changements de voie, pas les individus ; il n’entre pas dans les sauvegardes. Les effets restent hors du calcul de combat.

`ui/coaching.ts` dérive les consignes depuis la session ; `battleNotices.ts` les affiche au même endroit que les annonces pour éviter un nouveau bloc d’interface. En sélection, la consigne de placement passe avant une annonce transitoire. Les prix, dégâts, soins, vagues et tirages de l’IA sont conservés.

La couche de présentation ne promet plus de sauvegarde. Elle reste indépendante du stockage ; le statut réel vient de `checkpoints.ts`. Le chargement affiche les compteurs restaurés avant le décodage des images.

## Présentation 0.8

`render/presentation.ts` observe les différences de santé, les effets et les transitions de partie. Il ne modifie jamais le moteur et utilise une horloge visuelle séparée qui se fige en pause. Les réactions et les textes sont nettoyés au redémarrage ; les files sont bornées. `render/battleFeedback.ts` réutilise 40 objets texte au lieu de créer un objet à chaque impact. `ui/battleNotices.ts` relaie les annonces en texte HTML sans les répéter à chaque image. Le roi est une texture distincte importée par Vite.

`tests/presentation-harness.ts` et `scripts/presentation-browser.mjs` servent uniquement aux scènes de contrôle. Le HTML temporaire est supprimé après le test ; ces fixtures ne sont pas des routes de production. Elles permettent de voir l’arrivée du roi, la fin de partie et le redémarrage sans devoir accélérer artificiellement le moteur livré.

## Catalogue et présentation 0.7

`unitRules.ts` porte les soins, réductions de dégâts, charge et descriptions des pouvoirs. `ui/unitGuide.ts` présente les fiches sans dupliquer les règles. `render/specialUnits.ts` dessine le tank, le cavalier et le chevalier à deux têtes. Le temps de charge est un état de combat ; il est réinitialisé à la reprise d’un camp, comme les autres temporisations.

`audio/sounds.ts` observe le jeu depuis un callback de rendu et synthétise de petits sons via Web Audio. Il ne modifie aucune règle ni aucun tirage aléatoire. Aucun fichier externe ni compte audio n’est requis. L’activation demande un clic ; le son démarre coupé, le volume est limité et le nombre de voix simultanées est plafonné. Le passage de l’onglet en arrière-plan coupe le son. La légère secousse des obus est désactivée quand le navigateur demande des mouvements réduits.

## Sauvegarde locale 0.6

`checkpoints.ts` enregistre uniquement un camp hors combat. Le format versionné ne contient ni chemins A*, ni effets, ni objets Phaser. La lecture reconstruit une simulation et valide types, bornes, identifiants uniques, effectif et noms d'unités. Les personnages morts ne sont pas réintroduits. Les exceptions du stockage (mode privé, quota, file://) désactivent les écritures sans arrêter le jeu. Le dernier camp est conservé pendant le combat, même en cas de défaite ; une reprise rejoue la vague depuis ce point. Une nouvelle partie le remplace.

La sauvegarde dépend de l'origine et du profil du navigateur : elle n'est ni un compte, ni une sauvegarde cloud. Le joueur peut la perdre en nettoyant son navigateur ou en changeant de dossier pour un HTML local. Aucun stockage serveur n'a été créé.

## Quand ajouter un véritable backend

Une sauvegarde locale peut d'abord rester sur l'appareil. Un backend devient utile pour reprendre une partie entre PC et tablette, gérer des profils familiaux ou jouer ensemble en ligne. Le noyau de simulation reste alors réutilisable.

Pour des sauvegardes partagées, commencer par une petite API de lecture/écriture et une base relationnelle gérée ; vérifier l'identité et les droits de la famille côté serveur, valider les sauvegardes, versionner le format, limiter taille/fréquence et prévoir les sauvegardes de la base. Choisir l'hébergement et le mode d'identification à ce moment-là. Aucun serveur ou stockage payant n'a été créé ici. Aucun multijoueur temps réel ni classement public n'est supposé.

## Défense vivante 0.10

`defenders.ts` porte les rôles, le filtrage des cibles de secteur et les objectifs de défense. Les secours sont calculés une fois par pas pour les blocages réels ; deux combattants proches au maximum sont désignés par ennemi si aucun combattant n’intervient déjà à portée. Les mobiles pénalisent les cibles déjà attribuées dans le même pas. Le retour passe par le A* existant, pas par une téléportation. `navigation.nearestCampPoint` trouve un objectif légal voisin pour la défense et les anciennes sauvegardes.

`waves.ts` configure les tempos et types d’approche ; `game.ts` conserve l’autorité sur les apparitions et éclosions. Le rendu ne modifie pas ces décisions. `render/defenseMarkers.ts` dessine seulement les repères de préparation. Les fixtures de formation et leur horloge accélérée restent dans tests/ ; aucune commande de simulation n’est exposée dans la distribution.

Les sauvegardes écrites portent la version 2 et homeX/homeY, avec la même clé de stockage. La version 1 reste lisible : l’ancrage horizontal d’origine est inconnu, donc la position enregistrée est utilisée puis projetée vers un domicile légal au besoin. Le statut, l’or et les survivants sont conservés. Aucun compte ni stockage cloud ajouté.

## Refonte illustrée 0.11

`levels.ts` fournit trois cartes immuables. Le niveau actif est dérivé de la vague,
en anticipant la suivante au camp. `blocked`, `findPath` et `nearestCampPoint`
reçoivent le niveau ; la clé du cache contient son identifiant. Aucune carte active
mutable globale ne peut contaminer deux simulations.

`Game.normalizeCamp` conserve identités et santé, réserve les domiciles valides puis
projette les domiciles/positions devenus illégaux vers des points libres. Il est appelé
aux changements de chapitre et à la restauration. Les chemins sont invalidés sans
consommer de tirage aléatoire. `targetId` est une intention de combat transitoire,
réinitialisée au chargement, pas un élément permanent du camp.

`enemyArmor` et `enemySpeed` dérivent les phases mécaniques de la santé et de l'horloge
de simulation ; elles se figent en pause. Le roi garde son type normal, distinct des
variantes régulières. `Presentation` observe le franchissement de mi-vie et émet un
signal visuel unique ; aucune image ou animation ne décide des dégâts.

`art.ts` décrit huit atlas 1024² et trois fonds 1600×900 importés par Vite. `Actors`
gère des images partagées, supprime les objets disparus et réutilise les textures.
Les miniatures sont des poses fixes avec transformations visuelles bornées. Le décor
`TerrainLayer` compose fond, pavés, roncier, ponts, rochers et textes dans un unique
RenderTexture 1100×620 par scène. Les objets intermédiaires sont détruits après capture.
Ce cache est reconstruit au changement de carte et après RESTORE_WEBGL ; ses listeners
sont retirés à la fermeture de scène. Le moteur reste indépendant de Phaser.

Estimation brute des seules surfaces d'images/atlas + cache : environ 51 Mio en RGBA,
hors buffers, copies CPU, police et navigateur. Les images WebP totalisent 6 249 280 octets.
Les fonds utilisent qualité88 ; les atlas gardent l'alpha et un encodage sans perte.
Le site normal cache ces fichiers à empreinte ; le portable les intègre pour le double-clic.
Les originaux PNG ne sont pas dupliqués dans le build.

## Chemins vivants 0.11.1

`routes.ts` décrit les trois lignes de marche et les jonctions courbes, sans Phaser.
Le moteur et `TerrainLayer` consomment ces mêmes coordonnées. Les passages et décisions
aux jonctions restent aux mêmes endroits. Les serpents avancent à vitesse bornée sur
les segments ; ils occupent deux traces décalées de 11 pixels dans le même sentier.
Un point hors sentier choisit un premier segment visible avant de rejoindre la route,
sans entrer dans le rocher pour ensuite tenter une récupération sur une cellule bloquée.
La navigation A* des alliés et les collisions restent indépendantes du décor.

`render/actorLayout.ts` porte le profil d'origine des images. L'orientation d'attaque
vient du moteur, y compris lorsque le serpent dépasse un soigneur. Les tailles et
barres de santé appartiennent au rendu. Les ponts sont tournés à l'exécution pour
aligner le tablier avec les chemins ; les fichiers d'images restent inchangés.

La séparation alliée passe de 25 à 36 pixels. Face à un ennemi déjà retenu au combat,
`defenseGoal` autorise une batterie arrière à avancer de 85 % de sa portée plutôt que
48 pixels au maximum. Elle garde sa voie et sa distance d'arme. Sans cible, les alliés
rentrent au domicile. Les statistiques de combat et l'économie ne changent pas.

## Refuge et antres 0.12

`render/strongholds.ts` dessine le refuge, les antres et leur état animé. Ils ne sont
plus inclus dans le RenderTexture du terrain fixe : des objets partagés,
réutilisés à chaque image, aucun monstre créé par le rendu. La porte du refuge est
retournée vers la gauche et les antres gardent leur ouverture sur les routes.

`Presentation.arrivals` observe les nouveaux identifiants ennemis : origine antre
si x < 160, sinon œuf. Les sorties actuelles sont à x=108, les œufs à x≥252. Le tableau
est plafonné à 24 événements, durée 0,9 s. `fortDamage` et `fortRepair` observent les
variations réelles de base ; le premier état n'émet pas d'impact. Toute l'observation
se fige en pause et se réinitialise à un changement de Game. Les acteurs n'utilisent
ces signaux que pour l'opacité et la taille de leur entrée.

Le nouvel atlas de quatre images (1024²) pèse 792 264 octets, alpha conservé, et
reste séparé dans le build normal. Les douze images de production totalisent
7 041 544 octets. La surface GPU théorique du nouvel atlas représente 4 Mio RGBA
hors copies et buffers. Les règles/IA/session restent identiques octet pour octet
sur les quatorze modules comparés à la 0.11.1 ; aucun nouvel état de sauvegarde.

## Deux miels et rôles 0.13

`tactics.ts` exporte FeastFlavor, la zone collante et sa vitesse, ainsi que la position
du pot. Le choix ne consomme pas de tirage aléatoire supplémentaire. Un pot collant
ne passe ni par l'attraction ni par le compteur de détours. `honeyZone.ts` met en cache
au plus neuf géométries (trois cartes × trois voies), dessinées sous les combattants.
L'interface garde les deux actions et les trois voies, avec noms, icônes et ARIA.

`combatRules.ts` décide la protection d'un voisin et la couverture du parapluie.
La recharge guardCool est transitoire et réinitialisée au décodage ; le format de
camp v2 ne change pas. Les événements portent sourceId/targetId facultatifs pour
relier l'animation au vrai combattant. `Presentation.actions` est limitée à 64 entrées,
durée 0,55 s, avec pause et nettoyage ; `characterMotion.ts` ne change aucune collision.

Les secours de pont réutilisent deux aides par voie quand au moins trois ennemis
entourent un gardien à la frontière. Le défenseur principal est conservé dans le
calcul pour que des aides arrivées ne provoquent pas une mobilisation en cascade.
Tous les objectifs A* alliés passent par nearestCampPoint, y compris les secours
et ripostes : une cible légale peut se trouver dans une cellule au centre bloqué.

Le nouvel atlas 1024² ajoute 336 234 octets (4 Mio RGBA théoriques hors copies).
Les treize images WebP totalisent 7 377 778 octets, cacheables séparément sur le web.
Le portable reste un export autonome distinct. Aucun backend ni compte de jeu ajouté.

## Bestiaire et lisibilité 0.14

`enemyAbilities.ts` centralise les constantes de sonnette et la réaction de mort. `Game.hitEnemy` est l'unique passage des dégâts alliés vers les serpents : le franchissement vivant→mort attribue la réaction au tueur, pour les trois branches (direct, zone, seconde tête). Les dégâts fixes de réaction contournent les armures. Le boss est exclu. `updateConfusion` décrémente les timers, applique l'hésitation locale puis laisse le moteur traiter les unités ; les trois timers sont transitoires, reconstruits à zéro par le décodage v2. Le temps de recharge des attaques continue pendant l'hésitation ; les actions attendent sa fin. La pause fige tout.

Le catalogue dérivé de `kinds` et `unitCatalog.ts` comporte 20 recrues et 21 fiches. Les portraits adaptent la taille de fond à la hauteur du cadre, dont 600 px pour les deux mutants. Aucun changement du format de camp ni dépendance. Les trois atlas supplémentaires totalisent 1 671 362 octets (12 Mio de surfaces RGBA théoriques, hors buffers/copies). Les 16 images de production totalisent 9 049 140 octets. Les deux liserés d'acteur réutilisent les mêmes textures en Images Phaser ; le cache RenderTexture du terrain reste indépendant.

## Interface et robustesse 0.15

Le moteur reste un graphe local sans DOM/Phaser/réseau. Les gardes runtime protègent recrutement, temps et navigation. Le format de camp 2 est conservé ; les limites encodeur/décodeur sont cohérentes (100 000 caractères, 512 survivants), et toute santé finie strictement positive est conservée. `campLayout.ts` fournit seulement un recours pour les changements de carte avec un camp exceptionnellement dense. Voir AUDIT-MOTEUR-0.15.md pour la méthode et le partage de domiciles au-delà de la capacité de ce maillage.

`ui/hud.ts` conserve les nœuds de jauges/progression ; `ui/dialogs.ts` gère la propriété de la pause et le retour au jeu ; `ui/display.ts` ne modifie que la disposition. Le calcul de placement reste dans Session/Game. `render/inputBounds.ts` resynchronise les bornes natives de Phaser avant les événements d'entrée lorsque le canvas est déplacé par le défilement ou un parent sticky. Écouteurs de scène retirés au shutdown/destroy.

Les deux polices variables WOFF2 font 60 808 octets, servies localement et intégrées seulement dans l'export portable. Le build normal garde HTML/CSS/logique/moteur/images/polices en fichiers séparés cacheables. Licences locales FONT-LICENCES.txt dans les deux builds et dans le ZIP jouable. Aucun nouveau service externe ni API de gameplay.

## Boss et laboratoire 0.16

`src/balanceTuning.ts` définit les réglages validés et immuables propres à chaque
`Game`. La configuration livrée est fixée avant la partie : aucun changement caché
selon les performances du joueur. `src/boss.ts` contient les règles pures de
protection, phases et cible. `Game` résout les impacts ; `render/bossReadout.ts`
et `render/bossSignals.ts` lisent ce même état sans seconde horloge. La pause
suspend ainsi attaque et annonce ensemble. Aucune requête réseau ajoutée.

`scripts/balance-lab.mjs` lance des campagnes avec les méthodes publiques du
moteur, les prix réels et des bots déterministes. Chaque lot archive graines,
configuration complète, commandes, résultats, échecs et empreintes des sources.
Les réglages de développement et la cohorte finale de validation sont séparés.
La concurrence est bornée à trois workers ; elle ne change pas les tirages du jeu.
Les résultats ne sont pas un modèle d'IA entraîné et ne prouvent pas le plaisir
ressenti par les enfants. Voir les documents `BALANCE-LAB-METHOD-0.16.md` et
`BOSS-EQUILIBRAGE-0.16-PLAN.md` pour le protocole.

## Choix de chapitre et campv3 — 0.17

`rewards.ts` définit le tirage séparé du RNG de combat, les six cartes et la
validation de leur état. `Game` déclenche les deux offres après les vraies victoires
4/8, applique un choix unique et possède les méthodes `chooseReward`, `skipReward`
et `recruitCost`. Le bon offert passe par les mêmes règles de placement et n'est
consommé qu'après acceptation. La protection est une réserve finie séparée des
100 points de vie du cristal ; le roi l'ignore. Le bonus de miel prolonge la vraie
durée du moteur, sans deuxième minuteur dans l'interface.

`checkpoints.ts` encode le campv3 à la même clé locale, lit encore v1/v2 et ne
réapplique aucun effet au chargement. Une ancienne frontière4/8 reçoit son offre,
les étapes passées ne donnent pas de cadeau rétroactif. `rewardControls.ts`
affiche trois boutons stables dans le flux de préparation et respecte la pause,
le focus des dialogues et le clavier. Aucun serveur ou fichier graphique nouveau.

## Menu et progression0.18

Le moteur garde les règles dans campaignRules/Game, les instantanés dans
checkpoints(campv4) et les résultats/favoris séparés dans progression/roster.
Le menu ne crée aucune armée ; il restaure uniquement un vrai snapshot validé.
Session.screen suspend le temps, ScenePhaser dort à l'accueil et se réveille avec
ses limites d'entrée recalculées. campMemory conserve le dernier camp préparé
pour réessayer même si le stockage est refusé ; il ne remplace pas la sauvegarde
persistante. Les anciennes sauvegardes restent lisibles et les états corrompus
sont refusés. Aucun serveur ni nouvelle dépendance.

## Signaux et identité des chapitres — 0.19

`render/encounterReadout.ts` lit les temporisations réelles sans écriture moteur,
RNG ou horloge secondaire. `eggLabelPositions` sépare au plus six étiquettes de
voie sans déplacer les œufs. `BattleFeedback` réutilise neuf textes supplémentaires.
Le relais HTML utilise `chooseBattleMessage` : placement prioritaire, puis
comparaison entre urgence du signal et priorité d'annonce. Le coaching et le menu
partagent les métadonnées immuables `chapterIdentityForWave`.

Le camp reste v4 ; aucune donnée visuelle n'entre en sauvegarde. Le laboratoire
ajoute des cohortes distinctes et un déclenchement d'encouragement au premier
coup observé, via la même commande publique que le bouton du joueur. Les scripts
et moteurs de référence sont archivés séparément pour les comparaisons appariées.

La distribution statique est publiée via Sites, audience privée conservée. Le
dépôt de publication contient le build exact, un manifeste d'identité et aucun
secret. Le source du jeu et ses rapports restent dans le projet principal. Les
contrôles locaux ne valident ni les en-têtes du fournisseur ni son parcours de
connexion : la publication est attestée par le statut natif du déploiement.

## Bilan et fichier familial — 0.20

`chapterReport.ts` dérive un bilan des seuls états accomplis 4/8/12. Son observateur
reconnaît une transition réellement vue ; `ui/chapterReport.ts` reste statique
après reprise et n'impose ni focus ni défilement. Le minimum ancien ou incohérent
n'est pas présenté comme une mesure. Aucun module moteur n'est modifié.

`familyBackup.ts` reconstruit les champs à partir des validateurs de camp et de
carrière, avec limites 500 000 caractères et 1 000 000 octets. Les objets vivants
sont validés avant JSON pour ne pas convertir un tableau creux en null légitime.
`familyPersistence.ts` écrit l'enveloppe entière dans une seule clé autoritative.
Une écriture d'import échouée précède et interdit toute mutation de session.
`main.ts` remplace ensuite la carrière sur son contrôleur stable, la mémoire et
le Game courant, sans état ancien rafraîchi entre ces opérations synchrones.

L'enveloppe `conquete-serpents:family:v1` prime sur les deux clés historiques au
démarrage, même si son camp vaut null. En son absence, les anciens camps et profils
sont lus. Les anciennes clés restent des miroirs de compatibilité ; les écritures
ordinaires synchronisent l'enveloppe après camp et carrière. `campMemory.raw` est
la source de l'export vivant. Un import de profil seul efface sa reprise.

Le dialogue n'exécute aucun contenu de fichier : décodage borné, textContent et
aperçu numérique. Un jeton de lecture ignore les fichiers asynchrones devenus
anciens après annulation ou nouvelle sélection. Le serveur HTTPS et son certificat
éphémère servent uniquement aux tests ; la distribution reste statique.

## Expéditions 0.21 et Android

`missions.ts` porte les définitions et configurations bornées, sans navigateur.
`Game` reçoit un contexte de mission optionnel : rang de difficulté, nombre de
vagues, composition et victoire sont séparés du classique. `levels.ts/routes.ts`
fournissent la géométrie commune au pathfinding et au rendu ; chaque variante
a un identifiant de cache propre. `missionProgress.ts` garde les scores et les
camps classique/mission séparés. `ui/expeditions.ts` présente carte et aperçu.

Checkpoint v5 ajoute la mission et son minimum réel de cristal ; les classiques
restent écrits v4, lus v1–v4. Enveloppe familiale v2 ajoute la progression, tout
en acceptant les fichiers v1. L'écriture autoritative unique précède toujours
le remplacement de session pendant un import. Aucune base de données ajoutée.

Capacitor embarque `dist/` dans une application Android locale. Le HTML reste
une coquille DOM et le chargement du moteur ; les règles et images ne sont pas
réintégrées en source dans ce fichier. Une sortie Android n'impose pas de backend.
Voir ANDROID.md et ARCHITECTURE-ANDROID-0.21.md pour les outils, limites et étapes.

## Stocks et cour royale0.22

Les nouveaux modèles purs healing.ts, flying.ts et bossCourt.ts séparent stocks,
ciblage aérien et escorte. Game coordonne les trajets et coups ; boss.ts garde les
réserves de vie des têtes. Le rendu lit les états, sans horloge de combat propre.
Le campv6 garde stocks/phase/délai médical ; les formats 1–5 migrent sans soin de
vie gratuit. L'enveloppe familialev2reste compatible avec ces nouveaux camps.
Les témoins historiques utilisent un réglage interne tacticalRulesEnabled=false,
non présenté comme une option aux joueurs. Les mesures 0.22 utilisent le vrai
moteur 0.21 archivé plutôt que ce seul commutateur. Aucun backend réseau ajouté.

## Rendu 0.24

FramePool réutilise les images d’acteurs et les étiquettes médicales. Les vues
inactives sont bornées et retirées de la display list, puis libérées sur shutdown
ou destroy avec désinscription des deux écouteurs. Ce mécanisme ne réutilise
jamais les identifiants ou entités de la simulation. VisualSettings garde un
choix local de confort, séparé des sauvegardes, et respecte la préférence système.
DevPerformance et FrameMetrics ne sont activés qu’en développement sur demande.
Voir PERFORMANCE-0.24.md pour le protocole et ses limites.

## Corrections de présentation 0.26

`render/missionAssets.ts` calcule les textures utiles depuis l'état courant sans
faire avancer les règles. La scène attend leur chargement avant de dessiner ou
de calculer la suite ; progression et réessai restent en HTML. Les textures déjà
chargées sont réutilisées. Les aperçus des chapitres suivants sont demandés au
survol/focus, sans téléchargement préalable de leurs fonds.

`#game` fixe la surface par CSS (aspect-ratio ou hauteur du paysage compact) et
isole la taille du canvas. `render/boardResize.ts` observe ce conteneur, rafraîchit
Phaser à la prochaine image et se débranche à la destruction du jeu.

Le tiroir mobile et la consigne de rotation restent dans `ui/`. La pause de
portrait est réappliquée lors des rafraîchissements pour qu'une fermeture de
dialogue ne puisse pas reprendre le combat derrière la consigne. Le tirage d'un
nouveau départ évite le terrain précédent ; la lecture d'une sauvegarde ou d'un
code ne passe pas par ce tirage. Les formats de sauvegarde restent inchangés.

## Affichage — 0.27

La transition centrale vers le plateau remet le document en haut. Les informations
secondaires gardent leurs nœuds et événements dans le panneau des alliés, défilant
sur ordinateur et en tiroir sur téléphone. Le plateau reste dimensionné par CSS ;
le pied du dialogue de préparation est séparé de son contenu défilant.
`render/resultCopy.ts` produit les textes de victoire des missions et du classique
sans modifier le modèle. Axe-core est une dépendance de test uniquement.

## Diagnostic local Android — 0.27.1

`PerformanceRecording` agrège des fenêtres de rendu d’une seconde au minimum,
indépendamment du modèle de combat. La vue optionnelle reçoit le contrôle de
pause du dialogue ; sa destruction retire les listeners. Une nouvelle identité
Game remet la collecte à zéro ; sommeil/réveil et pauses coupent l’intervalle.
Aucun relevé n’est envoyé ni sauvegardé automatiquement. Le build APK de test
utilise temporairement appStartPath `/?perf=1`, puis restaure le sync normal.

## Interface enfant — 0.29

Le menu sélectionne la première mission ouverte non terminée à partir de la
progression existante. Cette sélection ne modifie aucune étoile. Les disclosures
sont des éléments HTML natifs ; les IDs et événements des commandes sont gardés.
childCopy convertit uniquement les textes affichés : les 180 instantanés
historiques et les données de jeu restent inchangés. Le comptage de mots en
recette intersecte le viewport et les clips de tous les ancêtres défilants.

## Tutoriel versionné — 0.30

MissionRun.rules2 est optionnel et réservé au nouveau refuge ; absence signifie
les règles historiques. La fonction pure activeEnemyLanes est partagée par le
plan d’œufs, le choix pondéré des voies, les jonctions et le rendu. Les choix
scriptés d’arrivée sont restreints au même masque. Le choix du second côté ne
consomme pas le flux RNG du combat.
Le codev2, le campv7 et la famillev3 protègent les nouvelles règles contre une
lecture silencieuse par une ancienne application. Les décodeurs gardent les
anciens formats. Le HUD observe le masque sans avancer la simulation.

## Surface mobile — 0.30.1

Le CSS calcule la surface utile à partir du maximum des marges `env()` et des
variables injectées par SystemBars de Capacitor 8.6. Les anciennes WebViews déjà
inset nativement reçoivent des valeurs nulles : pas de deuxième marge.
Le catalogue partage la grille avec le plateau, borné entre 208 et 232 px ;
le ResizeObserver existant rafraîchit Phaser après ces changements de dimensions.
Sous 700 px, le HUD prend deux lignes de 76 px au total plutôt que de faire
entrer ses statistiques en collision. La largeur minimum du catalogue prime sur
le plafond de 32 % quand la surface utile devient trop étroite.
Le tiroir reste un composant de présentation : il ne modifie ni pause, ni règles,
ni économie. Le seul achat suit toujours le placement par Session.

## Interruptions — 0.30.2

`ui/pauseState.ts` partage des acquisitions de pause par Session, hors des règles
et des formats de sauvegarde. Dialogues et consigne de rotation libèrent leur
seule acquisition ; une interruption reste retenue jusqu'à Reprendre. L'identité
du Game invalide les anciennes acquisitions lors d'un changement de partie.
`ui/lifecycle.ts` relie `visibilitychange` et `pagehide` à cette pause retenue.
La fermeture d'une fenêtre et le retour `pageshow` ne relancent pas le combat.
Le contrôleur ne modifie ni temps, ni RNG, ni contenu des sauvegardes.

## Français et anglais — 0.35.0

`src/main.ts` initialise la préférence linguistique puis charge `bootstrap.ts`.
Le moteur, ses noms/messages canoniques français, les graines, les formats de
camp et les codes restent indépendants de la langue. La préférence `fr|en`
a sa propre clé locale ; le choix le plus récent gagne si les chargements
asynchrones se croisent. Le catalogue anglais est chargé à la demande, sans
service réseau de traduction ni dépendance ajoutée.

`src/i18n/dom.ts` lie explicitement les écritures et les feuilles HTML ; aucune
observation globale du DOM. Les valeurs sources restent dans des WeakMap,
les nœuds et les handlers sont conservés lors de la bascule. Les données brutes
(code, rapport, sauvegarde, textarea) ne sont pas traduites, mais leurs attributs
linguistiques accessibles le sont. Les noms techniques d'attributs et valeurs
option/commande restent stables. `phaser.ts` actualise aussi les Text mis en
cache et retire les références détruites. Les gabarits sont ancrés, bornés à
2048 caractères et six niveaux ; inventaire statique et recettes complètent
les contrôles, sans prétendre remplacer la relecture humaine.

Le build normal sépare entrée, interface/bootstrap, règles, anglais et Phaser.
Le plafond par fichier n'est pas le coût cumulé : le bilan donne les deux.
Le portable reste une seule distribution autonome avec les deux langues.
Les ressources Android `values-en` affichent Snake Attack TD selon la langue
système ; changer la langue dans le jeu ne redémarre pas l'Activity et ne
renomme pas l'identifiant Android provisoire.

Les aides de placement, le regroupement médical et les étoiles lisent les
valeurs existantes du moteur. La petite soucoupe procédurale est ajoutée une
fois au cache du seul terrain classique `ruins`, puis ses objets temporaires
sont détruits avec le cycle de terrain existant. Aucun acteur, collision,
récompense, son ou tirage aléatoire n'est ajouté.

## Équilibrage versionné — 0.36.2

`balanceRevision.ts` résout deux révisions immuables : 1 historique, 2 pour
les nouveaux départs explicitement créés par la session. `data.ts` et les
36 définitions historiques ne changent pas. Game expose sa révision readonly ;
les prix et les définitions de caprices sont résolus sans mutation et avec cache.
Les anciennes API gardent leur défaut historique. Les reprises, codes et réessais
conservent la révision : code 4, camp 9, progression 2 et famille 5 portent la
révision 2 ; les lecteurs historiques restent disponibles. Les carnets restent
au format 1 et partagent la campagne et ses étoiles.

`ui/recruitmentReminder.ts` observe les achats réussis de Session, l’or dépensable
et les frames actives réelles, indépendamment de ×1/×2. Le rappel reste sur la
ligne d’annonce existante et dans un cache UI de 64 codes maximum, avec repli
mémoire si le stockage est refusé. Il ne modifie ni Game, ni RNG, ni sauvegarde.

## Choix du moteur — réévalué le 11 novembre 2026

Phaser 3 reste le bon choix, et la question ne se rouvre pas sans mesure sur le téléphone.

- Le jeu n'utilise qu'une petite partie de Phaser : scène, images, formes, textes, un cache de
  terrain. Ni physique, ni animations du moteur. Le rendu tient en 3 057 lignes (`src/render`).
- Les règles n'en dépendent pas : TypeScript pur, 549 tests, parties rejouables à l'identique.
  Changer de moteur ne toucherait donc que le rendu, mais obligerait à le réécrire en entier.
- Godot, Unity ou Defold imposeraient de réécrire aussi les règles, les sauvegardes et
  l'interface HTML : plusieurs semaines pour un jeu 2D que la solution actuelle fait tourner.
- PixiJS serait plus léger (Phaser pèse 1,48 Mo, le plus gros fichier du build), mais le gain
  ne justifie pas une réécriture du rendu tant qu'aucune lenteur n'est mesurée.
- Phaser 4 existe (4.2.1 sur npm). La migration est possible plus tard ; elle n'apporte rien
  d'attendu aujourd'hui et se décidera sur un relevé d'images par seconde du Galaxy S24.

Ce qui ferait changer d'avis : moins de 30 images par seconde sur le téléphone en mission 6 ou
en vague 12, sans correction possible dans le rendu actuel.

## Moteur découpé — 11 novembre 2026

`src/game.ts` faisait 1 303 lignes. Il en fait 395 : l'état de la partie, les commandes du
joueur et `step`, qui appelle les règles dans un ordre fixe. Le code a été déplacé tel quel,
sans réécriture ; les champs de `Game` et leur ordre n'ont pas changé, donc les sauvegardes non
plus.

| Module de `src/engine/` | Contenu                                                         |
| ----------------------- | --------------------------------------------------------------- |
| `state.ts`              | Types `Entity`, `Egg`, `Effect` ; tirage aléatoire ; création   |
| `camp.ts`               | Remise en place du camp entre deux chapitres                    |
| `spawning.ts`           | Entrée des serpents, carapaces, garde du roi, éclosion des œufs |
| `movement.ts`           | Choix de voie, marche sur les chemins, déplacement des alliés   |
| `allies.ts`             | Soins, choix de cible, attaque, séparation des alliés           |
| `enemyTurn.ts`          | Sonnette, morsures, ponte du roi, entrée au cristal             |
| `court.ts`              | Garde et soigneur du roi, crachat annoncé, protections          |
| `damage.ts`             | Coups reçus par les serpents et par les alliés                  |
| `outcome.ts`            | Pièces gagnées, défaite, vague repoussée, victoire              |

Ordre d'un pas, à ne pas changer : apparition, éclosion, roi, sonnette, alliés, serpents,
pièces, séparation, fin de vague. Cet ordre et celui des appels à `nextRandom` décident de la
partie : les modifier change les anciens codes de départ.

Preuve que rien n'a bougé : 131 parties complètes rejouées avant et après avec la même
empreinte, les 549 tests historiques, et 3 840 parties du simulateur `balance:modes` aux
résultats identiques sur l'ancien et le nouveau code. `tests/engine-traces.test.ts` garde 21
de ces parties comme filet permanent.
