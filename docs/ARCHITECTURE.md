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
| `src/render/honeyZone.ts`   | Pot et parfum dessinés à partir de l’état.                                  |
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

Depuis le 14 novembre 2026, le build écrit aussi `.htaccess`, la même politique pour un
hébergement Apache, avec l'adresse unique du site (`src/site.ts`) : voir « Confidentialité
et site » plus bas et [SITE.md](SITE.md).

## Lisibilité et prise en main 0.9

`placement.ts` partage la validation spatiale et les suggestions de placement. `Game.canRecruit` expose une requête sans dépense ; `Session.placeSelected` coordonne la sélection et le vrai achat. Les suggestions laissent plus d’espace visuel que le minimum légal et ne limitent pas le placement libre.

`tactics.decideTemptation` ajoute une raison au résultat de choix de voie, avec le même unique tirage aléatoire. Le signal `honey` est produit uniquement pour une décision directement influencée par le pot à une jonction. Le compteur `honeyTurns` compte les changements de voie, pas les individus ; il n’entre pas dans les sauvegardes. Les effets restent hors du calcul de combat.

`ui/coaching.ts` dérive les consignes depuis la session ; `battleNotices.ts` les affiche au même endroit que les annonces pour éviter un nouveau bloc d’interface. En sélection, la consigne de placement passe avant une annonce transitoire. Les prix, dégâts, soins, vagues et tirages de l’IA sont conservés.

La couche de présentation ne promet plus de sauvegarde. Elle reste indépendante du stockage ; le statut réel vient de `checkpoints.ts`. Le chargement affiche les compteurs restaurés avant le décodage des images.

## Présentation 0.8

`render/presentation.ts` observe les différences de santé, les effets et les transitions de partie. Il ne modifie jamais le moteur et utilise une horloge visuelle séparée qui se fige en pause. Les réactions et les textes sont nettoyés au redémarrage ; les files sont bornées. `render/battleFeedback.ts` réutilise 40 objets texte au lieu de créer un objet à chaque impact. `ui/battleNotices.ts` relaie les annonces en texte HTML sans les répéter à chaque image. Le roi est une texture distincte importée par Vite.

`tests/presentation-harness.ts` et `scripts/presentation-browser.mjs` servent uniquement aux scènes de contrôle. Le HTML temporaire est supprimé après le test ; ces fixtures ne sont pas des routes de production. Elles permettent de voir l’arrivée du roi, la fin de partie et le redémarrage sans devoir accélérer artificiellement le moteur livré.

## Catalogue et présentation 0.7

`unitRules.ts` porte les soins, réductions de dégâts, charge et descriptions des pouvoirs. `ui/unitGuide.ts` présente les fiches sans dupliquer les règles. Le temps de charge est un état de combat ; il est réinitialisé à la reprise d’un camp, comme les autres temporisations.

`audio/sounds.ts` relie le son à la page (boutons, premier geste, arrière-plan) ; `audio/gameSounds.ts` observe le jeu depuis un callback de rendu et décide ce qu’on entend. Il ne modifie aucune règle ni aucun tirage aléatoire. Les sons sont des fichiers du dépôt (`docs/AUDIO-LICENCES.md`), avec un petit synthétiseur Web Audio en repli ; aucun compte audio n’est requis. Le son est actif par défaut et démarre au premier geste, comme le veulent les navigateurs ; le volume est limité et le nombre de voix simultanées est plafonné. Le passage de l’onglet en arrière-plan coupe le son. La légère secousse des obus est désactivée quand le navigateur demande des mouvements réduits.

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
| `field.ts`              | Repères du plateau (camp, ponts, cristal) ; place libre         |
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

Le 13 novembre 2026, les longues fonctions de ces modules ont été coupées en étapes nommées
(un tour d'allié : soigner ou combattre ; un tour de serpent : pondre, mordre, marcher, entrer
au cristal ; une entrée de vague : rôle, voie, carapace, cour). Aucune ne dépasse 41 lignes.
Les coordonnées et rayons répétés ont un nom, dans `field.ts` ou en tête du module qui les
emploie, à valeur égale. L'ordre des appels, des tirages et des additions n'a pas bougé :
570 parties complètes comparées pas après pas, état entier, avant et après.

## Feuille de style et page découpées — 11 novembre 2026

`src/style.css` (4 314 lignes) et `index.html` (919 lignes) étaient deux fichiers uniques. Ils
sont coupés en morceaux, sans changer un octet du site construit.

**Styles.** `src/style.css` n'est plus qu'une liste d'imports vers 18 fichiers de
`src/styles/`, numérotés. Ce sont des tranches de l'ancien fichier, dans le même ordre : base,
barre du haut, plateau, panneau du camp, dialogues, adaptations d'écran, récompenses, accueil,
sauvegarde familiale, missions, tiroir des alliés, détails du camp, actions de mission,
navigation enfant, dangers, dock, repérage, boutons de l'accueil.

L'ordre des imports est l'ordre de la cascade. Le style a grandi version après version, et
beaucoup de règles tardives en corrigent de plus anciennes : les styles d'un même écran sont
donc encore répartis entre plusieurs tranches. Les regrouper vraiment par écran déplacerait des
règles et peut changer l'affichage ; ce travail demande d'abord une comparaison d'images sur
tous les écrans. Les feuilles propres à un composant (`src/ui/*.css`) ne changent pas.

**Page.** `index.html` garde l'en-tête, la consigne de rotation et neuf lignes
`<!-- include: src/html/nom.html -->`. `deploy/assembleHtml.ts` les remplace par le fichier
nommé, avant que Vite lise la page (extension `html-includes` de `vite.config.ts`), en
développement comme au build. Le navigateur reçoit toujours une seule page. Les outils qui
lisent le HTML source (inventaire des textes) passent par `readIndexHtml()`.

| Morceau de `src/html/`  | Contenu                                                      |
| ----------------------- | ------------------------------------------------------------ |
| `home.html`             | Accueil et ses pages : missions, parents, classique, favoris |
| `departure-dialog.html` | Retrouver une aventure par son code                          |
| `threat-dialog.html`    | Les serpents annoncés avant une vague                        |
| `mission-dialog.html`   | Préparation d'une mission                                    |
| `family-dialogs.html`   | Sauvegarde familiale et confirmation de remplacement         |
| `battle.html`           | Écran de jeu : barre du haut, plateau, dock, alliés          |
| `restart-dialog.html`   | Recommencer                                                  |
| `help-dialog.html`      | Comment jouer                                                |
| `guide-dialogs.html`    | Fiche d'un allié et aide des outils du camp                  |

Ces morceaux sont formatés avec une largeur de 96 colonnes (`.prettierrc.json`) : c'est la
largeur qu'ils avaient, imbriqués de quatre espaces, dans l'ancien fichier.

Preuve : les 34 fichiers de `dist/` et l'export portable ont la même empreinte SHA-256 avant
et après le découpage.

## Pages de l'accueil adaptatives — 11 novembre 2026

Les pages Missions, Favoris, Aventure classique et Pour les parents n'ont plus de mise en page
par taille d'écran. `src/ui/homePages.css` les décrit une seule fois, dans une unité, `--hu`,
calculée d'après la place réelle : l'écran moins les barres système d'Android.

- La page est dessinée pour une surface de 78 × 36 unités en paysage (40 × 64 en portrait).
  L'unité vaut la plus petite des deux divisions, bornée entre 6 et 16 px. Un écran plus petit
  ou plus grand donne simplement une unité plus petite ou plus grande.
- Les grilles se partagent la place : six missions en 3 × 2 (2 × 3 en portrait, une colonne en
  portrait étroit), trois chapitres côte à côte, six favoris par page.
- Les textes et les cibles tactiles gardent un plancher (`max(13px, …)`, 48 px). Sur un écran
  trop petit pour ces planchers, la page défile en entier ; aucune carte n'est coupée.
- Deux seuils restent, tous deux de repli : au-dessus de 1000 × 680 px, les introductions et
  les détails reviennent ; sous 560 px de large en paysage, les emblèmes cèdent la place aux
  noms.

Règle pour la suite : dans ce fichier, pas de taille en px, sauf un plancher dans `max()` ou
une cible tactile. `npm run test:mobile-menus` contrôle ces pages sur une grille de treize
tailles, du petit téléphone à l'ordinateur, avec et sans marges système.

## Dialogues adaptatifs — 11 novembre 2026

`src/ui/dialogPages.css` applique la même méthode aux dialogues qui servent d'écrans. L'unité
`--hu` est définie sur la page entière (`:root`, dans `homePages.css`), donc partagée.

| Dialogue             | Ce qui reste toujours en vue                                           |
| -------------------- | ---------------------------------------------------------------------- |
| Carnet de caprices   | Les six autocollants d'une mission, la phrase qui explique ; la sortie |
| Préparation          | Le titre et ses quatre ou cinq vues sur une rangée ; « C'est parti ! » |
| Catalogue des alliés | Le titre et les deux onglets ; tous les alliés en petites cartes       |
| Comment jouer        | « C'est parti ! » et la fermeture, pendant que le texte défile         |
| Serpents annoncés    | La vague à gauche, œufs et conseil à droite ; « Retour au camp »       |

Le même fichier porte la règle des cibles tactiles : 48 px au moins pour tout bouton, liste ou
volet d'un dialogue, de l'en-tête et de la barre de commandes, à toute taille d'écran.

Depuis le 13 novembre 2026, l'interface ne crée ni ne renomme plus de carnet : le choix du
carnet (dialogue du carnet et préparation) n'apparaît que pour une sauvegarde qui en contient
déjà plusieurs (`albumChoiceShown`). L'onglet « Copains » de la préparation n'apparaît que s'il
a quelque chose à proposer (`friendsViewHasContent`) ; s'il disparaît pendant qu'il est ouvert,
le résumé reprend la main (`availableView`). Le code de départ reste produit et lisible depuis
la page des parents ; son bloc est seulement masqué dans la préparation (`hidden`).

Depuis le 15 novembre 2026, le catalogue n'a plus ni pages ni liste de familles : chaque
onglet montre tous ses alliés en petites cartes, sur cinq colonnes. Seuil de repli restant :
jusqu'à 700 px de large, quatre colonnes ; sur un très petit téléphone (568×320), les rangées
qui ne tiennent pas se font défiler.

`npm run test:mobile-menus` contrôle ces dialogues sur six tailles, dont deux avec marges
système : autocollants, alliés, départ et retour en vue, cadre dans la zone sûre, cibles de
48 px.

Reste à faire avec la même méthode : l'accueil lui-même et l'écran de jeu (barre du haut,
plateau, dock), qui gardent leurs seuils par taille mais tiennent sur les tailles mesurées ;
les dialogues de lecture (sauvegarde familiale, fiches, options des parents), qui défilent.

## Scène de l'accueil — 13 novembre 2026

`src/ui/homeScene.css` habille le premier écran sans toucher au HTML. L'image reste
`icon-512.png`, la même que l'icône Android ; un masque CSS (`src/assets/home/masque.webp`)
retire son fond uni. Derrière : `fond.webp`, la forêt floue de l'illustration d'origine sans
les personnages, puis deux images de second plan dans `::before`. Le refuge au cristal est
le fond du panneau du titre, et chaque bouton du bas porte un petit objet du jeu
(`menu-*.webp`). La carte des missions (`mission-*.webp`, choisi par `data-mission`),
les onglets et les repères de la préparation (`onglet-*`, `repere-*`) suivent le même
principe. `scripts/build-home-scene.py` refait ces images à partir
de celles du dépôt (Pillow seul, hors build). Sans prise en charge des masques, l'image
garde son fond vert : l'accueil reste lisible.

## Bulles d'aide — 13 novembre 2026

`ui/helpBubble.ts` fournit `helpPoint(sujet)`, un « ? » de 48 px, et une seule fenêtre
modale `#help-bubble`, construite au premier usage, qui s'ouvre par-dessus ce qui est déjà
ouvert sans rien fermer ni toucher à la pause. Les textes sont des données
(`ui/helpTopics.ts`) : un sujet de plus est une entrée et un appel à `helpPoint`. Aucun
balisage dans la page HTML.

## Joueurs de l'appareil — 13 novembre 2026

Un téléphone ou une tablette partagés accueillent jusqu'à quatre joueurs, sans compte et sans
rien envoyer : un joueur est un personnage du jeu et, s'il le veut, un surnom.

`players.ts` (sans navigateur, testé par `tests/players.test.ts`) porte la liste, sous la clé
de l'appareil `conquete-serpents:players:v1` :
`{ version: 1, activeId, players: [{ id: 'p1'…'p4', character, name | null }] }`. Tout ce qui
est lu est reconstruit champ par champ ; une donnée absente ou invalide donne l'état de départ,
un seul joueur `p1`, le Héros, sans surnom. Au tout premier lancement, aucun écran ne
s'intercale et rien n'est écrit sous cette clé.

L'aventure d'un joueur reste dans les quatre clés existantes (`family:v1`, `camp:v1`,
`progress:v1`, `recruitment-reminder:v1`), sans changement de format. `p1` les utilise telles
quelles : une sauvegarde d'avant les joueurs est donc le joueur 1, sans migration. `p2` à `p4`
utilisent les mêmes clés suivies de `:p2` … `:p4`. `bootstrap.ts` ne donne plus
`localStorage` aux contrôleurs de sauvegarde, mais `playerStorage(localStorage, activeId)`, qui
traduit les clés ; le son, la langue, les effets légers et la liste des joueurs restent
communs à l'appareil. Un test vérifie que ces contrôleurs ne touchent que les quatre clés de
leur joueur.
Depuis le 14 novembre, une cinquième clé suit le joueur de la même façon : `voyage:v1`, le
carnet du voyage (section « Le voyage »). Les écrans du voyage reçoivent le même
`playerStorage` que les autres contrôleurs.

Changer de joueur ou en créer un écrit `activeId` puis recharge la page : chaque contrôleur
est reconstruit sur les bonnes clés. `sessionStorage` retient que le joueur a été choisi
depuis l'ouverture du jeu ; « Qui joue ? » ne s'ouvre seul qu'avec deux joueurs au moins et
sans ce repère. Supprimer un joueur retire ses quatre clés et son entrée, jamais le dernier ;
si c'est le joueur en cours, son stockage est d'abord fermé (`close()`), pour que la page
quittée ne réécrive pas son aventure en partant. Un identifiant libéré peut resservir. La
sauvegarde familiale exporte et remplace l'aventure du joueur en cours.

`ui/players.ts` et ses modules (`playerList.ts` pour les écritures et le rechargement,
`playersDialog.ts` pour la fenêtre, `playerViews.ts` pour ses vues, `playerMarks.ts` pour la
pastille et le bouton des parents, `playerParts.ts` pour les éléments communs) construisent
tout l'affichage (aucun balisage dans la page HTML) : la pastille
de l'en-tête de l'accueil, la fenêtre `#players-dialog` et ses vues (« Qui joue ? », « Choisis
ton personnage », la liste des parents et sa confirmation), le bouton « Joueurs » de la page
des parents, visible à partir de deux joueurs, et la phrase de la sauvegarde familiale. Le
nom d'un personnage suit la langue ; un surnom est écrit tel quel (`data-copy-raw`). Les
portraits sont de petites images (`src/assets/home/joueur-*.webp`,
`scripts/build-home-scene.py`) désignées par la feuille `ui/players.css` : seuls ceux qui
sont affichés sont chargés, jamais les planches des alliés. La pastille se règle sur la
largeur réelle de l'en-tête (requête de conteneur, marges du système déduites) : ses deux
lignes dès 640 px, un peu resserrées sous 730 px ; en dessous, le portrait seul avec une
pastille (« + » ou deux flèches). L'en-tête de l'accueil tient sur une seule rangée.

## Vignettes des caprices — 13 novembre 2026

`ui/capriceIcons.ts` dessine la vignette d'un caprice dans un `<svg>` : l'image en pâte à
modeler de `src/assets/caprices/` quand le caprice en a une (`capriceStickerName(id)`), sinon
le médaillon au trait de sa famille de règles, qui reste le repli d'un caprice ajouté sans
image. Une image par nom : vingt fichiers pour trente-six caprices. Le `<svg>` garde sa
taille et ses attributs, donc les feuilles de style et les recettes ne changent pas ;
`tests/caprice-stickers.test.ts` vérifie que chaque caprice a son fichier et qu'aucun fichier
ne traîne. Les images ne sont demandées qu'à l'affichage d'une vignette, jamais à l'accueil.

## Pose d'attaque (essai, 12 novembre 2026)

Une planche de `art.ts` peut déclarer `attackUrl` : une seconde planche aux mêmes cases,
chargée sous la clé `<planche>-attack`. Neuf planches en ont une ; en ajouter une
autre est une ligne de données et un fichier. `render/attackPose.ts` choisit l'image :
la case d'attaque pendant 0,2 s après le coup (le même signal `Presentation.actions`
que l'élan de `characterMotion`), l'image de repos sinon, toujours en « Effets légers »
et tant que la planche d'attaque n'est pas là. `MissionAssets` la demande en arrière-plan
une fois sa planche de repos chargée et utile à la mission ; elle n'est jamais attendue,
son échec n'affiche rien. Corps, liseré et éclair utilisent la même case : le liseré a
toujours la forme de l'image montrée (`Figurines` prépare chaque case à part). Les portraits
HTML gardent la planche de repos.

Depuis le 13 novembre, les planches d'attaque des combattants posés et de la vague qui vient
passent d'abord, deux fichiers à la fois (les sept partaient ensemble et arrivaient ensemble) ;
un fichier en échec est redemandé une fois, dix secondes plus tard ; l'image est décodée hors
du fil principal quand le navigateur le permet. Elles partent toujours après les images que
la mission attend : demandées plus tôt, elles retardaient le début de la partie de 15 % sur
une ligne lente. Mesure sur le build (Chromium, réseau bridé, cache vide,
« Lancer la vague » dès que possible) : avant, à 1 Mbit/s la moitié des coups de la première
vague n'avaient pas leur pose (4 % à 0,7 Mbit/s), toutes les vagues suivantes l'avaient.

## Netteté du plateau, liseré et marche (13 novembre 2026)

**Le canvas a les pixels de l'écran.** Le monde reste 1100 × 620 : règles, placement,
recettes et coordonnées ne changent pas. `render/boardResolution.ts` lit avant chaque pas la
largeur affichée du plateau et le rapport de pixels de l'appareil, et donne au canvas cette
largeur exacte (bornée entre 550 et 2200 px, 1100 au plus en « Effets légers », qui reste le
mode économe). Une taille doit être voulue 250 ms avant de reconstruire le canvas ; un écart
de 3 px est ignoré. `BattleScene.fitCanvas` règle alors le zoom de la caméra
(`boardScale` = largeur du canvas / 1100), redessine les textes à cette résolution
(`sharpenCanvasTexts`), vide les figurines préparées et le cache du décor. Les pointeurs
passent par `boardPoint`, les secousses par `shakeBoard`. Les bancs d'essai de `tests/`
créent un jeu fixe de 1100 px : pour eux l'échelle vaut 1.

Un régulateur (`createFrameGovernor`) protège les appareils lents : trois secondes de suite
sous 40 images par seconde au-dessus du plateau simple, il essaie un demi-cran plus petit ;
si les images ne viennent pas 15 % plus vite, la taille n'était pas la cause (économie
d'énergie à 30 images par seconde, processeur occupé), il rétablit la netteté et ne touche
plus à rien de la session.

**Figurines préparées.** Une case de 512 px dessinée sept fois plus petite par le moteur est
crénelée (sans mipmap) ou molle (avec : le niveau de 64 px sert pour 70 px à l'écran).
`render/figurines.ts` réduit donc une fois, par moitiés, chaque image utilisée sur un petit
canvas de deux fois sa taille d'écran ; le plateau la montre presque pixel pour pixel, comme
les portraits du dock. Acteurs, œufs, pots de miel, refuge, antres et décors passent par là,
en WebGL comme en Canvas. Ces surfaces font quelques dizaines à quelques centaines de Kio ;
elles sont détruites à chaque changement de taille et à la fermeture de la scène. Le cache du
décor (`TerrainLayer`) est tracé à deux fois le plateau en WebGL : l'écran fait la moyenne des
bords de chemin au lieu de montrer des marches (11 Mio ; à la taille du canvas en « Effets
légers » et en Canvas).

**Liseré.** Le contour n'est plus la figurine agrandie et teintée deux fois (épais loin des
pieds, absent près d'eux, crénelé) : c'est la silhouette réduite, grossie de la même distance
dans toutes les directions et colorée, sur la même surface que le corps. Rouge orangé
`0xd2552d` pour les serpents, 1,7 unité ; vert foncé `0x233d36` pour les alliés, 1,1 unité et
un peu transparent : une menace se voit d'un coup d'œil, un allié n'a besoin que d'un trait.
L'anneau au sol des serpents porte aussi leur couleur. Une image de moins par acteur.

**Marche.** `Presentation.gaits` mesure le chemin réellement parcouru par chaque combattant
(positions du moteur, lues seulement). `characterMotion` en tire le pas : petit saut,
dandinement d'un pied sur l'autre, écrasement à chaque appui, quatre poses par pas comme une
animation image par image ; les serpents ondulent (étirés puis ramassés), le char vibre, le
cavalier galope, les volants gardent leur vol à l'horloge. Vitesse ×2 : deux fois plus de
pas ; pause ou combattant bloqué : pose tenue, puis pied reposé. Les corps lourds soulèvent
un peu de poussière (`Spark` `dust`, mêmes quarante particules que les pièces, jamais à leur
place). Rien en « Effets légers ». Aucune règle, aucun tirage du jeu.

## Nettoyage du code — 13 novembre 2026

Un chantier sans changement de comportement : enlever ce qui ne sert plus, donner une seule
définition à ce qui était recopié, découper les fonctions-fleuves. Ce qu'il laisse comme
conventions :

- **Garde-fou.** `tsconfig.json` refuse les variables, imports et paramètres inutilisés
  (`noUnusedLocals`, `noUnusedParameters`) : `npm run verify` échoue s'il en revient.
- **Données lues de l'extérieur.** `src/plainData.ts` porte les gardes communs à tout ce qui
  lit une sauvegarde, un code ou un fichier importé (`isRecord`, `isNumberIn`, `isIntegerIn`,
  `isStarCount`). Un lecteur n'écrit plus son propre `typeof … === 'object'`.
- **Sauvegardes et codes.** Chaque lecteur est une suite d'étapes nommées (en-tête, mission,
  caprice, unités, récompenses, campagne) ; `src/checkpointUnits.ts` lit et écrit les unités
  d'un camp. Les versions du format sont décrites une seule fois, pour l'écriture et la
  lecture. L'ordre des contrôles fait partie du comportement : un lecteur qui construit une
  partie consomme le générateur aléatoire.
- **Accès à la page.** `src/ui/dom.ts` : `byId` pour un élément de la page (à la place de
  `document.getElementById(...)!` et des copies locales de `el`), `make` pour en créer un,
  `portraitPhone` et `narrowScreen` pour les deux tests d'écran qui étaient recopiés,
  `dialogOpen`, `setPressed`, `decoration`, `addOption`, `refreshText`, `forwardClick` pour
  les petits gestes de page. `src/ui/svg.ts` crée un élément SVG ; `src/ui/gameParts.ts`
  porte les morceaux propres au jeu (rangée d'étoiles, portrait d'allié).
- **Interface, un `bind` = une liste de branchements.** Chaque écran garde sa fonction
  `bind…`, réduite à la liste ordonnée de ce qu'elle branche ; le reste est dans des
  fonctions nommées ou des modules d'une seule responsabilité : `recruitShop.ts`,
  `battleCommands.ts`, `battleBriefing.ts` (bataille) ; `rosterEditor.ts`, `missionDraft.ts`,
  `missionOutcome.ts`, `pendingConfirm.ts` (accueil et missions) ; `capriceFriends.ts`,
  `capriceResultNote.ts` (caprices). L'ordre des étapes d'un rafraîchissement fait partie du
  comportement : une étape peut lire ce qu'une précédente a écrit.
- **Textes.** Une phrase reste un seul littéral ou un seul gabarit : l'inventaire des
  traductions lit les littéraux du code et le traducteur recompose les phrases. On ne
  redécoupe pas un texte pour factoriser.
- **Son, un module par rôle.** `sounds.ts` (page), `gameSounds.ts` (quoi jouer à chaque
  image, dans l'ordre de priorité), `signals.ts` (table moment → fichier, volume, notes de
  repli), `signalPlayer.ts` (fichier d'abord, sinon synthétiseur), `samples.ts` (lecteurs),
  `audioFiles.ts` (le seul module qui dépend de Vite, pour que le reste se teste avec Node).
- **Rendu.** Chaque `update` ou `draw` est une courte liste d'étapes nommées, dans l'ordre du
  dessin. `effectTrails.ts` trace les effets du moteur, `placementGuide.ts` l'aide au
  placement, `boardDepth.ts` donne la profondeur commune aux combattants et au décor.
  `tests/render-traces.test.ts` fixe l'empreinte de la présentation sur trois parties
  entières, comme `tests/engine-traces.test.ts` le fait pour les règles.

Vérifié par des comparaisons avant/après hors dépôt : 243 captures du plateau identiques
octet pour octet (neuf parcours, trois tailles) et une trace de 18 338 appels sonores
identique. Rien n'a été regardé ni écouté sur un vrai téléphone.

## Rejouer avec un caprice — 13 novembre 2026

Les 36 caprices et leur carnet existaient ; rien ne les montrait hors de la préparation. Trois
endroits les disent maintenant, sans rien écrire : on lit les étoiles et le carnet, les règles
et la sauvegarde ne changent pas.

- `ui/stickerGoals.ts` (sans page, `tests/sticker-goals.test.ts`) fait les comptes :
  `missionStickers` (les six autocollants d'une mission, ceux qui sont gagnés, ceux qu'on peut
  jouer avec les étoiles gagnées, les étoiles qui ouvrent les suivants), `replayOffer` (la
  phrase et le bouton d'après une victoire) et `capriceToPlay` (la mission vers laquelle
  l'accueil conduit quand les six missions sont gagnées).
- `ui/stickerRow.ts` dessine six places sur une rangée, dans l'ordre de la page du carnet. Un
  autocollant gagné montre son image en pâte à modeler en fond de sa place ; les autres
  places n'ont pas d'image.
- Carte de mission (`missionJourneyView.ts`) : la rangée sous les étoiles, dès que la mission
  est jouable, avec le libellé « Autocollants : 2 sur 6 ».
- Fin de mission (`missionOutcome.ts`, `stickerOffer`) : après une victoire, la rangée, la
  phrase et « Rejouer avec un caprice » (« Un autre caprice » après un caprice), qui ouvre la
  préparation de la même mission sur ses caprices (`missionDraft.ts`, `showCaprices`). Sans
  caprice ouvert à gagner, pas de bouton : la phrase dit quelles étoiles ouvrent la suite, ou
  que la page est pleine. `battleResult.ts` met en tête la mission suivante, sinon ce bouton,
  sinon « Réessayer ».
- Préparation (`capriceView.ts`) : un caprice dont l'autocollant est gagné dit « ✓ Gagné ».
- Accueil (`expeditions.ts`, `bootstrap.ts`) : les six missions gagnées, le bouton principal
  devient « Jouer un caprice » et sa phrase compte les autocollants qui restent. Une mission
  qui vient d'être gagnée ne demande plus à être reprise : le bouton propose la suite, et
  « Reprendre ma mission » reste sur la page Missions.

Le carnet lu est celui que remplira la prochaine partie ; après une partie, celui de cette
partie. Ils ne diffèrent que pour une sauvegarde ancienne qui garde plusieurs carnets.

Sur téléphone couché, le panneau de résultat range ses boutons deux par deux quand il porte
cette proposition (`data-sticker-offer` : `pairs`, ou `lead` quand un bouton impair prend la
première rangée) ; le résultat tient alors sans défiler à 780×360, marges du système comprises
pour une mission normale. Sur ordinateur, le panneau prend la hauteur de la fenêtre au lieu de
s'arrêter à 460 px. `npm run test:mobile-menus` (`scripts/mobile-replay-038-checks.mjs`)
contrôle les cartes et l'accueil dans le vrai jeu, et le résultat sur une page de contrôle
(`tests/replay-038-harness.ts`), en français et en anglais.

Limite connue : après la fermeture du jeu, une mission terminée laisse son dernier camp dans
la sauvegarde ; l'accueil dit alors « Reprendre », comme avant. Le distinguer d'une mission
vraiment interrompue demanderait une donnée de plus dans la sauvegarde.

## Le voyage — 14 novembre 2026

Un mode « progression + hasard » décidé par le parent le 14 novembre : cinq étapes tirées
d'une graine, un bonus à garder entre deux étapes, le roi à trois têtes à la fin. Un premier
lot a posé le cœur (modèle, branchement sur le moteur, laboratoire) ; un second les écrans,
décrits plus bas. Réglages et mesures : [VOYAGE.md](VOYAGE.md).

### Modèle

Tout est calculé depuis la graine, avant le premier combat, sans navigateur ni horloge.

| Module             | Contenu                                                                              |
| ------------------ | ------------------------------------------------------------------------------------ |
| `voyageTuning.ts`  | La table des réglages, une par version du voyage ; tout ce que le voyage peut régler |
| `voyage.ts`        | Le plan d'une graine (`planVoyage`), les règles et la partie d'une étape             |
| `voyageState.ts`   | L'état d'un voyage et ses transitions ; validé par reconstruction                    |
| `voyageCode.ts`    | Le code du voyage, `VOYAGE-1-7X8R-K4` : version, graine, deux signes de contrôle     |
| `voyageStorage.ts` | Le carnet d'un joueur : voyage en cours, record personnel, lecture et écriture       |
| `voyageRules.ts`   | Ce qu'une étape ajoute au moteur (`StageRules`)                                      |
| `codeText.ts`      | L'écriture commune aux codes de départ et de voyage (alphabet, contrôle, saisie)     |

- **Plan.** Une graine tient sur 20 bits (un million de voyages) pour que le code reste court.
  `planVoyage(graine)` tire un itinéraire parmi ceux que la table permet (jamais deux fois la
  même mission, toujours dans l'ordre du jeu), puis pour chaque étape un terrain, une
  attaque, des nids, la graine du combat et, à partir de la troisième, un caprice de la
  mission. Chaque question posée à la graine a son propre tirage (`mix`, `stream`) : en
  ajouter une ne décale pas les autres, et le hasard d'un combat n'est jamais consommé.
  Les trois cartes offertes après une étape viennent de `rewardOffer` (un allié et deux des
  trois autres cartes), sur un tirage propre à l'étape. La table peut retirer l'allié d'une
  offre (`ally: false`) : ce sont alors les trois autres cartes, toujours trois. La version 1
  ne s'en sert pas.
- **Étape.** Une étape est un `MissionRun` ordinaire de la révision 2 (le refuge garde ses
  règles d'apprentissage : une voie, puis deux, puis trois). Le caprice est dans le
  `MissionRun`, donc connu d'avance et montrable sur la carte.
- **État.** `{ version, seed, won, bag, status }` : étapes réussies, cartes gardées dans
  l'ordre, `travelling`, `fallen` ou `arrived`. Le plan n'est jamais enregistré, il se retire
  de la graine. `readVoyageState` reconstruit l'état et refuse tout ce qu'un vrai voyage ne
  peut pas atteindre (carte jamais offerte, sac trop long, voyage arrivé sans cinq étapes).
  Les transitions rendent un nouvel état gelé, ou `null` sans rien changer.
- **Carnet.** Une clé par joueur, `conquete-serpents:voyage:v1`, ajoutée à `PLAYER_KEYS` : le
  joueur 1 l'utilise telle quelle, les autres avec leur suffixe, et supprimer un joueur
  l'efface. `{ version: 1, best, current }` : le record (étapes réussies du plus long voyage,
  jamais comparé entre enfants) et le voyage en cours ou le dernier fini. Stockage absent,
  refusé ou donnée abîmée : carnet vide, jamais d'exception.

### Branchement sur le moteur

`Game` reçoit un cinquième paramètre facultatif, `stage: StageRules` :
`{ version: 1, king, coins, ward, bag }`. C'est la seule extension, et elle est versionnée
comme une révision d'équilibrage : une nouvelle façon d'ouvrir une étape sera une version 2 à
côté de la première. Sans ce paramètre, rien ne change.

- `game.ts` : le constructeur valide l'étape (`readStageRules`, copie gelée), exige une
  expédition de la révision 2, puis appelle `openStage` : pièces ajoutées à la bourse de la
  mission (ou retirées : la dernière étape de la version 1 part avec 300 pièces de moins, et
  une bourse ne descend jamais sous zéro), garde du cristal, et une entrée par carte dans
  `game.rewards.choices`. Les alliés
  offerts et le miel passent donc par le code de la grande aventure (`freeRecruit`,
  `extraHoneySeconds`) sans le modifier. L'étape est un champ privé (`#stage`, lu par
  `game.stage`) : `JSON.stringify(game)` est le même qu'avant.
- `engine/spawning.ts` : le roi ferme la dernière vague si le caprice l'invite **ou** si
  l'étape le demande (`isKingSlot`). Sa vie vient du réglage `bossHpMultiplier` déjà
  existant, que `createStageGame` passe au constructeur.
- `checkpoints.ts` : `encodeCheckpoint` refuse une partie de voyage. Un camp n'a pas de place
  pour les règles d'une étape ; relu, ce serait une expédition ordinaire.
- `missionProgress.ts`, `capriceAlbums.ts` : une étape gagnée ne donne ni étoile ni
  autocollant à la mission qu'elle emprunte (elle est jouée avec le sac).
- `departures.ts` : l'alphabet, les signes de contrôle et la lecture de la saisie sont partis
  dans `codeText.ts`, à l'identique, pour que le code du voyage s'écrive comme un code de
  départ.
- `players.ts` : la clé du voyage rejoint `PLAYER_KEYS`.
- `i18n/dictionaries/model.en.ts` : une ligne, `VOYAGE: 'VOYAGE'`. L'inventaire des textes
  lit tous les littéraux du code ; le mot du code est le même en anglais, comme `AVENTURE`.

Aucun format de sauvegarde ni de code de départ ne change : pas de nouvelle version de camp,
de progression ou de fichier familial.

### Ce qui est enregistré, ce qui ne l'est pas

- Enregistré, entre deux étapes : la graine, les étapes réussies, les cartes gardées, le
  record. Les écrans appellent `saveVoyageLog` après chaque transition (`commit`, dans
  `ui/voyage/voyageScreens.ts`) ; une étape gagnée ou perdue est enregistrée dès la fin du
  combat, avant que l'enfant ne touche « Continuer le voyage ».
- Pas enregistré : le camp d'une étape en cours. **Une étape quittée en cours repart de son
  début**, avec le même terrain, les mêmes serpents et le même sac (`stageGame` refait le
  camp). Reprendre au milieu demanderait une version 10 des camps, à côté des neuf autres.
- Pas dans la sauvegarde familiale : le fichier familial n'exporte pas le voyage.

### Ce que les écrans appellent

```ts
const log = loadVoyageLog(storage); // log.best, log.current (reprise)
const state = startVoyage(voyageSeedFrom(random32)); // ou startVoyage(code.seed, code.version)
const plan = voyagePlanOf(state); // carte : plan.stages[i].run, .king, .offer ; stageCaprice(stage)
const game = stageGame(state); // nouveau camp de l'étape, sac déballé ; session.useGame(game)
const after = recordStage(state, game); // partie finie : étape réussie, ou voyage tombé
bonusOffer(after); // trois cartes si voyagePhase(after) === 'bonus'
const next = chooseBonus(after, card);
saveVoyageLog(storage, logVoyage(log, next)); // après chaque transition
encodeVoyage(state.seed, state.version); // « VOYAGE-1-… » ; decodeVoyage(texte) pour le lire
```

`voyagePhase(state)` dit quoi proposer : `stage`, `bonus`, `fallen`, `arrived`.

### Écrans

Décidés par le parent sur maquettes le 14 novembre : l'entrée à côté de « Jouer », le caprice
surprise montré à l'avance sur la carte, des bonus gardés pour tout le reste du voyage. Aucun
balisage dans la page HTML : tout est construit en TypeScript.

| Module                           | Rôle                                                                              |
| -------------------------------- | --------------------------------------------------------------------------------- |
| `ui/voyageDoor.ts`               | Le bouton de l'accueil et le chargement des écrans ; seul module chargé au départ |
| `ui/voyage/voyageScreens.ts`     | Le carnet du joueur et les branchements : un bouton demande, le modèle décide     |
| `ui/voyage/voyageWords.ts`       | Toutes les phrases, choisies d'après l'état, sans page (`voyage-screens.test.ts`) |
| `ui/voyage/voyagePage.ts`        | La page parmi celles de l'accueil : titre, panneau, record, note du bas           |
| `ui/voyage/voyageViews.ts`       | Les quatre vues : carte, choix d'un bonus, voyage fini, camp tombé                |
| `ui/voyage/voyagePath.ts`        | Le chemin et ses arrêts ; `stopMap.ts` dessine la petite carte d'un arrêt         |
| `ui/voyage/voyageBag.ts`         | « Ton sac de voyage » et l'image d'un bonus ; `bonusChoice.ts`, les trois cartes  |
| `ui/voyage/voyageCodeWindows.ts` | Le code donné (« Copier ») et « Un autre voyage » (nouveau voyage, code reçu)     |
| `ui/voyage/voyageReplace.ts`     | La question posée avant de remplacer un voyage en cours (`pendingConfirm.ts`)     |
| `ui/voyage/capriceBubble.ts`     | Ce que veut dire un autocollant de la carte : nom, annonce, règles changées       |
| `ui/voyage/voyageBattle.ts`      | Sur le plateau : le repère de l'étape, puis la phrase et le bouton de la fin      |
| `ui/voyage/voyage.css`           | La feuille du voyage, dans l'unité `--hu`, chargée avec les écrans                |

- **Accueil.** `#home-voyage` suit « Jouer » : « Le voyage » avec l'étiquette « Nouveau » tant
  que le joueur n'a jamais ouvert de voyage, « Reprendre le voyage » dès qu'une étape est
  réussie et qu'il en reste (`voyageDoor`). Sur un écran bas, les deux boutons partagent une
  rangée et « Jouer » prend la largeur qui reste (`homeScene.css`).
- **Page.** Le voyage est une page de l'accueil (`data-home-page="voyage"`, `HomePage`), donc
  « ← Accueil » et Échap fonctionnent comme ailleurs. Sa vue (`data-view`) suit
  `voyagePhase` : `map`, `bonus`, `arrived`, `fallen`. Une première visite tire un voyage et
  l'enregistre aussitôt, pour que son code ne change pas d'une visite à l'autre.
- **Carte.** Cinq arrêts ; chacun montre le vrai tracé de son terrain (les fonctions de
  `missionPreview.ts`), une tête de serpent par antre d'où sort la première vague, l'autocollant
  de son caprice à partir du troisième, le roi au cinquième. L'autocollant est un bouton de
  48 px qui ouvre `capriceBubble`. L'arrêt à jouer porte son nom et « C'est parti ! » ; le
  nom et l'annonce d'un caprice restent en français (`frenchLeaf`).
- **Reprise.** Une étape quittée repart de son début : la note sous la carte le dit toujours,
  et le bouton devient « Recommencer l'étape » quand l'étape a été commencée puis quittée
  depuis l'ouverture du jeu (`leftHalfway`) ; après un rechargement, rien ne permet de le
  savoir, puisque le camp d'une étape n'est pas enregistré.
- **Bonus.** Les titres sont ceux de `REWARDS` ; le détail est réécrit pour le voyage (« à
  chaque étape »), et les pièces viennent de la table (`tuning.bonusCoins`). Pas de bouton
  pour passer.
- **Fins.** Voyage fini : « Un nouveau voyage », « Donner mon voyage », « J'ai un code ». Camp
  tombé : « Refaire ce voyage », « Un nouveau voyage », « J'ai un code ». Le record est dans
  la rangée du haut pendant le voyage, dans le panneau à la fin.
- **Remplacer.** Un voyage qui a une étape réussie et des étapes à jouer (`underWay`) n'est
  remplacé qu'après une question ; un voyage sans étape réussie ou terminé l'est sans rien
  demander.

### Chargement à la demande

Le paquet principal est près de son plafond (200 000 octets, `scripts/check-dist.mjs`). Il ne
porte que `voyageDoor.ts` et quelques conditions sur `game.stage` ; au premier toucher du
bouton, `import('./voyage/voyageScreens.ts')` charge les écrans, leur feuille et leurs images
dans un paquet à part (`voyageScreens-*.js` et `.css`). Une partie de voyage ne peut exister
qu'après ce chargement, puisqu'une étape n'est jamais enregistrée comme camp : le repère et la
fin d'étape sont donc dans ce paquet. Si le paquet n'arrive pas (réseau coupé, cache vide), le
bouton le dit et le prochain toucher redemande. Le modèle (`voyage*.ts`) est dans le paquet des
règles, déjà chargé. Dans l'export en un seul fichier, tout est dans la page.
`npm run test:browser` ouvre le voyage et lance sa première étape, sur le build normal comme
sur l'export en un seul fichier ; `npm run test:offline` l'ouvre sans réseau et vérifie que
ses fichiers sont servis depuis le disque.

Octets : `bootstrap` 190 910 → 192 769 ; `rules` 90 358 → 95 078 ; `english` 78 032 → 82 880 ;
nouveaux `voyageScreens` 15 071 (script) et 14 555 (feuille). La page HTML ne change pas
(32 287).

### Sur l'écran de bataille

- `bootstrap.ts` : `playStage` met l'étape sur le plateau (la partie qui s'y trouvait est mise
  de côté comme pour une mission, `setGameAside`) ; « Recommencer » relance l'étape, jamais
  une mission ; une étape n'est jamais prise pour la mission à reprendre. Le voyage est
  rafraîchi en dernier (`saveAndRedraw`).
- `missionOutcome.ts` masque tout le panneau de mission pour une étape : ni carte des
  missions, ni mission suivante, ni caprice à rejouer, ni autocollant. `battleResult.ts` n'y
  range aucune action de mission ; `resultCopy.ts` ne compte pas d'étoiles et donne ses mots
  à l'étape (« Étape réussie ! », « Le voyage s'arrête ici »). `voyageBattle.ts` ajoute la
  phrase et l'unique bouton : « Continuer le voyage » (vers le choix du bonus, ou la fin),
  « Voir mon voyage » après une défaite.
- `threatPreview.ts` annonce le roi à la dernière vague de la dernière étape, quel que soit le
  caprice ; `departures.ts` ne montre pas de code de départ pendant une étape.
- `npm run test:mobile-menus` (`scripts/mobile-voyage-038-checks.mjs`) contrôle le voyage dans
  le vrai jeu, et les fins d'étape longues à atteindre sur une page de contrôle
  (`tests/voyage-038-harness.ts`), en français et en anglais, à 780×360, 812×375, 568×320 et
  1280×800.
- Images : `voyage-*.webp` dans `src/assets/home/`, dérivées par
  `scripts/build-home-scene.py` (provenance :
  `public/assets/illustrated/PROVENANCE-VOYAGE-2026-11.md`).

### Laboratoire

`npm run balance:voyage` (`scripts/balance-voyage.mjs`, modules dans `scripts/voyage-lab/`)
joue des voyages entiers sur le vrai moteur avec les joueurs automatiques des autres
laboratoires, sur tous les cœurs, et écrit `artifacts/voyage/rapport.json`.
`tests/voyage-traces.test.ts` fige six voyages joués en entier par les appels de l'interface,
comme `tests/engine-traces.test.ts` fige les parties : une empreinte qui change est un code
de voyage qui ne donne plus le même voyage.

## Confidentialité et site — 14 novembre 2026

La politique de confidentialité a **une seule source**, `src/i18n/privacyPolicy.ts` : le
texte approuvé en français et en anglais, repris mot pour mot de la page publiée, plus la
date de mise à jour et la version de l'application qu'il décrit (`POLICY_APP`). Ce sont des
engagements juridiques : le module ne les traduit pas par le dictionnaire, et le contrôle du
tutoiement l'ignore (la politique dit « vous » aux parents).

Deux rendus sortent de cette source :

- **la page publique** `dist/confidentialite/index.html` (`deploy/privacyPage.ts`), écrite
  par le build : HTML simple, sans JavaScript, les deux langues sur une page ;
- **la fenêtre de l'application** (`src/ui/privacy/privacyWindow.ts`), ouverte par le
  bouton « Confidentialité » de la page des parents (`src/ui/privacyDoor.ts`). Seul le
  bouton est chargé au départ ; le texte et la fenêtre sont un paquet à part, embarqué dans
  l'application, donc lisible hors ligne. Le texte est posé en nœuds bruts dans un élément
  `data-copy-raw` : le traducteur de l'interface n'y touche pas, la fenêtre choisit
  elle-même le texte de la langue du jeu. Aucun balisage ajouté dans `src/html/`.

`tests/privacy-policy.test.ts` tient le tout : texte identique à la page publiée de
référence, page sans script ni ressource extérieure, version citée égale à celle de
`package.json` et de `android/app/build.gradle`, configuration Apache. Dans le navigateur,
`scripts/mobile-privacy-038-checks.mjs` (dans `test:mobile-menus`) ouvre la fenêtre à six
tailles et dans les deux langues, la fait défiler au doigt et vérifie qu'elle ne demande
rien hors du jeu ; `test:offline` la relit après un démarrage à froid sans réseau.

`src/site.ts` donne l'adresse du site à tout le monde : le lien de la fenêtre, l'adresse
canonique de la page, `.htaccess` et le contrôle du site en ligne
(`scripts/check-live-site.mjs`). La publication est un workflow lancé à la main
(`.github/workflows/deploy-site.yml`) ; rien ne part seul.

## Textes hors du code — 15 novembre 2026

Règle du parent : rien de ce qui se lit à l'écran n'est écrit dans le code. Un texte se
change, ou se traduit, à un seul endroit.

- **`src/texts/fr/<domaine>.ts`** : les textes français, en constantes nommées, un fichier
  par domaine du jeu (`battle`, `allies`, `snakes`, `home`, `voyageScreens`…). Le nom dit ce
  que dit le texte (`cestParti`, `etapeNSurN`). Un texte à valeurs s'écrit avec `{0}`,
  `{1}`… et se remplit par `fill(TEXT.etapeNSurN, 2, 5)` (`src/texts/fill.ts`).
- **`src/texts/en/<domaine>.ts`** : l'anglais, sous les mêmes noms. Les mots du fils (noms
  et annonces des caprices) y restent en français, mot pour mot.
- **`src/texts/fr/page.ts`** : les textes de la page. Les gabarits (`index.html`,
  `src/html/`) ne contiennent que des noms entre accolades, `{{allerAuPlateau}}` ; le build
  y écrit le texte français (`fillTexts`, `deploy/assembleHtml.ts`) et s'arrête si un nom
  n'a pas de texte. La page reçue par le navigateur est la même qu'avant.
- **`src/texts/en/recomposed.ts`** : l'anglais des 81 morceaux que le jeu assemble en
  marchant (un statut fait de plusieurs parties, un mot mis en minuscules) et qui n'ont donc
  pas de constante.
- **`src/i18n/dictionary.en.ts`** est **généré** par `npm run texts:build`
  (`scripts/build-texts.ts`) depuis ces catalogues. On ne l'édite pas.
- Le code importe son catalogue : `import * as TEXT from '../texts/fr/home.ts'`. Un module
  chargé à la demande a son propre catalogue, pour que ses textes ne partent pas avec le
  paquet de départ ; les boutons de l'accueil qui l'ouvrent prennent leurs mots dans `home`.

Ce qui ne change pas : le français reste la langue de référence du moteur et des
sauvegardes, et le traducteur (`src/i18n/copy.ts`) cherche toujours l'anglais d'un texte
français affiché. La migration n'a donc touché ni message du moteur, ni sauvegarde, ni
empreinte de partie rejouée.

Garde-fous (`tests/texts-catalogue.test.ts`) : aucun texte affiché dans un fichier
TypeScript hors de `src/texts` et `src/i18n`, ni dans un gabarit de la page ; chaque texte
français a son anglais sous le même nom ; un même texte français n'a qu'un anglais ;
l'anglais n'invente pas de valeur ; le dictionnaire généré est à jour.
`scripts/displayed-text.ts` dit ce qui compte comme un texte affiché, pour ce test et pour
l'inventaire de `npm run test:locale`.

Preuve de la migration (1 054 textes : 849 dans 115 fichiers TypeScript, 270 dans la
page, certains communs) : inventaire des textes identique avant et après, dictionnaire
anglais identique entrée par entrée (1 135), texte mis en page par le navigateur identique
caractère pour caractère, tests unitaires et recettes navigateur verts. Coût : environ 6 Ko
de code de plus au démarrage (une déclaration par texte), le paquet principal restant à
189,7 Ko sur 200 ; la page HTML perd 46 octets.

## Valeurs hors du code — 15 novembre 2026

Suite de la règle du parent : ce qui a un sens dans le jeu a un nom et un seul lieu. Un
nombre ou une adresse retapés à deux endroits finissent par ne plus dire la même chose.

Les règles :

1. Une valeur qui a un sens dans le jeu (voies, chapitres, vagues, pièces, cristal, limites)
   a un nom et un seul lieu ; partout ailleurs on importe ce nom.
2. Une valeur d'équilibrage vit dans un fichier de données ou de réglage, jamais dans
   `src/ui/` ni `src/render/`. L'interface ne recalcule pas une règle : elle appelle le moteur.
3. Donner un nom ne change jamais la valeur : mêmes empreintes de parties rejouées, mêmes
   sauvegardes, mêmes codes. Une nouvelle valeur reste une nouvelle révision d'équilibrage.
4. Clés de stockage, formats et limites de sauvegarde : un module, et un test qui retape la
   valeur. Les tests et les recettes continuent d'écrire ces valeurs en clair, exprès : ils
   cassent si l'une change par erreur.
5. Une couleur ou une profondeur utilisée dans deux fichiers passe par une table ; une
   valeur de dessin utilisée une seule fois reste à côté du dessin.
6. Un id de la page reste une chaîne, mais un test vérifie qu'il existe.
7. Ce qui n'est pas un texte affiché (une requête d'écran, un dégradé, un attribut SVG) ne va
   pas dans `src/texts/`.
8. Une phrase ne retape pas un nombre du jeu : elle le prend dans sa constante, en français
   comme en anglais (`` `camp de ${START_GOLD} pièces` ``).

Où sont les valeurs :

- **`src/storageKeys.ts`** : les dix clés du stockage du navigateur. Une clé est l'adresse
  de la sauvegarde d'un enfant ; un changement de sens prend une nouvelle clé (`:v2`),
  l'ancienne reste lisible. Le module a son propre petit fichier dans le build (`keys-…js`) :
  le premier script lit la clé de la langue et ne doit pas attendre le paquet des règles.
- **`src/seededRandom.ts`** : le pas du tirage au hasard (`nextSeed`, `seedShare`,
  `seededStream`). Le combat, les récompenses, le voyage et le décor gardent chacun leur
  état mais avancent tous par ce calcul. Le changer change toutes les parties et tous les
  codes déjà donnés.
- **Limites** : chacune est exportée par son module de règles et lue par l'interface —
  `ROSTER_SIZE` (`roster.ts`), `DEPARTURE_INPUT_LIMIT` (`departures.ts`),
  `VOYAGE_INPUT_LIMIT` (`voyageCode.ts`), `CAMP_CHARACTER_LIMIT` (`checkpoints.ts`).
- **Taille du plateau** : `BOARD_WIDTH` et `BOARD_HEIGHT` (`render/boardResolution.ts`).
- **`src/gameConstants.ts`** : les nombres qui donnent sa forme à une partie —
  `LANE_COUNT`, `CHAPTER_COUNT`, `WAVES_PER_CHAPTER`, `TOTAL_WAVES`, `REWARD_WAVES`,
  `START_GOLD`, `CRYSTAL_MAX`, `START_TEAM_SIZE`, `GOLD_LIMIT`, `DEFAULT_SEED` — et
  `chapterOfWave`, la seule formule du chapitre d'une vague (elle était écrite deux fois).
  Le nombre d'œufs d'une vague est `waveEggCount` (`waves.ts`) : l'écran des dangers
  l'appelle au lieu de refaire le calcul.
- **`src/boardLandmarks.ts`** : les repères du plateau que les règles nomment (bords du
  camp, front, alerte et ligne du cristal, portée du contact). Un module sans import :
  le placement, les chemins et le camp les lisent sans boucle ; `engine/field.ts` les
  réexporte pour les règles d'un pas.
- **`src/render/boardLayers.ts`** : la table `DEPTH` des couches du plateau, du sol vers le
  haut. Vingt-neuf `setDepth` étaient répartis dans dix fichiers, avec vingt-deux valeurs :
  pour glisser une couche, on lit maintenant un seul tableau.
- **`src/render/palette.ts`** : les six couleurs du plateau utilisées par plus d'un dessin
  (`BOARD_COLOR`). Une couleur qui ne sert qu'à un dessin reste à côté de lui. Fusionner
  deux nuances voisines change l'image : c'est une décision de direction artistique.
- **`SHEET` et `sheetUrl`** (`src/art.ts`) : les planches d'images nommées hors de `art.ts`.
  Un nom qui ne correspond à aucune planche ne compile pas.
- **Prix du camp et récompenses** (`gameConstants.ts`) : `REPAIR_COST`, `REPAIR_AMOUNT`,
  `HERO_TRAINING_COST`, `ENCOURAGEMENT_SECONDS`, `REWARD_COINS`, `CRYSTAL_WARD`,
  `HONEY_REWARD_SECONDS`, `STAR_MAX`, `MISSION_COUNT`, `ROSTER_SIZE`. Le prix de la
  réparation et celui de l'entraînement étaient écrits deux fois, dans la règle et dans
  l'écran du camp.
- **Nombres dans les phrases** : quarante phrases des catalogues (« pendant 8 secondes »,
  « 90 pièces », « 12 vagues de serpents », « / 18 étoiles »…) prennent leur nombre dans ces
  constantes, dans les deux langues. Le catalogue importe `gameConstants.ts`, module sans
  import : pas de boucle avec les règles. Le texte produit est le même au caractère près
  — le dictionnaire généré n'a pas changé d'un octet — donc ni message du moteur ni
  empreinte de partie ne bouge. L'inventaire des textes (`scripts/extract-locale-035.mjs`)
  lit maintenant le catalogue comme le jeu le lit, nombres écrits.
- **Phrases laissées telles quelles** : les fiches des alliés et l'aide longue, dont les
  nombres viennent des tables par unité (`data.ts`, `unitRules.ts`) — vague de déblocage,
  bandages, pourcentages, durées à virgule. Les relier demanderait de générer ces
  paragraphes ; un changement d'équilibrage doit encore les relire.
- **Ids de la page** : ils restent des chaînes. `tests/dom-ids.test.ts` (avec
  `scripts/dom-ids.ts`) relève chaque id cherché par `byId`, `getElementById` ou
  `forwardClick` — 216 aujourd'hui — et vérifie qu'il est dans la page assemblée ou créé
  par le code ; il refuse aussi un id en double dans la page. Les recherches par
  `querySelector('#…')` ne sont pas couvertes.
- **Ce qui n'est pas un texte** : dix valeurs écrites pour le navigateur (une requête
  d'écran, deux dégradés, un sélecteur, deux attributs SVG, trois noms de police, la forme
  Unicode `NFD`) avaient suivi les textes dans les catalogues. Elles sont redevenues des
  constantes nommées à côté de leur usage. `scripts/displayed-text.ts` reconnaît ces formes
  une par une, sans règle large : une vraie phrase écrite dans le code reste refusée. Le
  dictionnaire anglais compte donc 1 125 entrées au lieu de 1 135, et l'inventaire 1 044
  textes au lieu de 1 054 ; aucun texte affiché n'a disparu.
- **Couleurs des styles** : là où la valeur exacte d'une des sept variables de
  `src/styles/01-base.css` était retapée (19 fois, 13 fichiers), la règle passe par la
  variable. Les nuances voisines ne sont pas fusionnées.
- **Restent à côté de leur règle**, parce qu'ils ne servent qu'une fois et font la partie :
  les scripts de vagues (`waves.ts`, `missions.ts`), les poids de l'IA (`ai.ts`,
  `defenders.ts`), la géométrie des routes (`routes.ts`).

Garde-fous : `tests/storage-keys.test.ts` retape chaque clé, chaque limite et le calcul du
tirage sur mille pas ; `tests/game-constants.test.ts` retape chaque nombre du jeu et chaque
repère, et vérifie qu'une partie neuve commence bien avec eux ;
`tests/board-depth.test.ts` retape la table des couches et les couleurs partagées, et refuse
une profondeur écrite en chiffres dans `src/render/` ; `tests/game-constants.test.ts` refuse
aussi, dans les catalogues, les formes d'un nombre du jeu tapé à la main ;
`tests/app-identity.test.ts` vérifie que l'identifiant de l'application est le même aux six
endroits où Android le veut.

Les mots des codes (`AVENTURE`, `PONTS`, `VOYAGE`…) restent dans les catalogues : un enfant
les lit et les recopie. Ils font aussi partie du format des codes : les traduire ou les
changer rendrait illisibles les codes déjà donnés.

## Index des serpents — 15 novembre 2026

Idée du fils : un index qui montre tous les serpents. Aucune règle nouvelle, aucune image
nouvelle : l'index réunit ce que le jeu savait déjà.

- **`src/ui/snakeIndex/`** est un paquet chargé à la demande (1,8 Ko), comme le voyage et la
  confidentialité : `snakeIndex.ts` construit la fenêtre, `snakeEntries.ts` donne la liste.
- **Les fiches** sont celles de la fenêtre « Dangers » (`renderThreatCards`,
  `THREAT_DETAILS`) : portrait, nom, ce que fait le serpent. L'index y ajoute la vague où
  l'enfant le rencontre dans la grande aventure, et la fiche de l'œuf.
- **La vague vient des règles** : `snakeEntries()` interroge `waveThreats` pour les douze
  vagues. Une vague qui change déplace ses serpents dans l'index sans rien retaper.
- **Deux portes**, faites par `snakeIndexDoor` (`src/ui/snakeIndexDoor.ts`, seul morceau
  chargé avec le jeu) : dans « Dangers », à côté de « Retour au camp », et dans « Favoris »,
  dans la rangée des pages. Si le paquet n'arrive pas, le bouton le dit et redemande au
  prochain toucher.
- Textes dans `src/texts/fr/snakeIndex.ts` et son miroir anglais.

Vérifié par `tests/snake-index.test.ts` (chaque serpent une fois, dans l'ordre de
l'aventure, King Snake en dernier) et par la recette `test:threat-preparation` (quatorze
fiches avec leur portrait, bouton de 48 px, la fenêtre « Dangers » reste ouverte dessous).
