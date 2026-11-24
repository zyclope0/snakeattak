# Architecture — petit jeu familial

## Décision

Le jeu reste une application statique : navigateur + fichiers sur un hébergement HTTPS. Aucun serveur de calcul, compte utilisateur, base de données ni API n'est nécessaire pour cette version. Le code TypeScript est modulaire ; un export portable n'est qu'un format de livraison, pas le fichier dans lequel on développe.

## Responsabilités

| Fichier                     | Responsabilité                                                                           |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| `src/main.ts`               | Démarrage : choisit la langue, puis charge `bootstrap.ts`.                               |
| `src/bootstrap.ts`          | Assemble session, sauvegardes, interface et Phaser ; ses morceaux sont dans `src/boot/`. |
| `src/session.ts`            | Session et horloge à 30 calculs/seconde ; pause et redémarrage.                          |
| `src/game.ts`               | État de la partie et commandes du joueur ; orchestre un pas de simulation.               |
| `src/gameGifts.ts`          | Cadeaux de l'aventure sans fin ; `src/campArrival.ts` : camp porté.                      |
| `src/expedition*.ts`        | Expédition : tables, plan, état et transitions, relecture (`expedition.ts` réexporte).   |
| `src/engine/`               | Règles d’un pas : apparitions, alliés, serpents, roi, dégâts, fin de vague.              |
| `src/tactics.ts`            | Règles du miel, durée et attraction ; sans navigateur.                                   |
| `src/ui/feastControls.ts`   | Commandes et statut du goûter.                                                           |
| `src/render/honeyZone.ts`   | Pot et parfum dessinés à partir de l’état.                                               |
| `src/ai.ts`                 | Évaluation des voies et choix tactiques pondérés.                                        |
| `src/navigation.ts`         | A*, obstacles et cache de chemins borné.                                                 |
| `src/data.ts`               | Catalogue historique immuable.                                                           |
| `src/render/BattleScene.ts` | Personnages, effets et affichage de l'état du jeu.                                       |
| `src/render/terrain.ts`     | Décor fixe.                                                                              |
| `src/ui/controls.ts`        | Commandes HTML et tableau de bord.                                                       |
| `src/assets`                | Images de production importées par Vite, avec nom de sortie lié au contenu.              |
| `deploy/policy.ts`          | Politiques HTTP et cache, exportées pour l'hébergeur.                                    |

Les commandes modifient la session. Phaser demande à la session d'avancer puis dessine son état. La logique du jeu peut être testée directement avec Node. Un callback actualise le tableau de bord ; le moteur ne dépend pas de l'interface. La session coupe les durées invalides et borne le rattrapage après une image lente. À graine identique, les décisions de jeu restent reproductibles.

## Distributions Web, Android et portable

- `npm run build` : `dist/`, site normal. HTML d'environ 28 Ko en 0.21, code du jeu, moteur Phaser, CSS et image séparés. Les assets sont identifiés par leur contenu et peuvent être gardés un an en cache ; le HTML est revalidé pour découvrir les mises à jour.
- `npm run build:portable` : `dist-portable/`, HTML autonome utilisable par double-clic. Ce fichier est volontairement plus gros. Il n'est pas la source du projet.
- `npm run build:android` : `dist-android/`, jeu et confidentialité hors ligne, sans pages
  de découverte, sitemap, liens de soutien ou métadonnées publiques. Capacitor lit ce
  dossier ; `android:sync` et le script debug le reconstruisent avant synchronisation.

Les pages FR/EN du site sont générées par `deploy/discovery.ts`, depuis une copie
éditoriale séparée dans `deploy/discoveryCopy.ts`, et des assets locaux déjà autorisés.
Elles ne chargent pas Phaser. Le jeu reste à `/`, sur la même origine, sans déplacement
de ses sauvegardes. Depuis l'accord du16novembre2026, la page parents propose
un lien PayPal de soutien facultatif (les autres pages y mènent, sans lien de paiement) ; aucune requête vers ce prestataire avant clic,
aucun service de paiement chargé dans le jeu. Passer explicitement `null` au générateur
masque le soutien. Les contrôles de distribution refusent les pages Web et l'URL de
paiement dans Android. La source de confidentialité commune explique ce seul soutien Web.

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
`bootstrap.ts` remplace ensuite la carrière sur son contrôleur stable, la mémoire et
le Game courant, sans état ancien rafraîchi entre ces opérations synchrones.

Depuis le 21 novembre 2026, un fichier familial « version 6 » porte aussi ce que le joueur
garde sous des clés à lui : l'expédition, le voyage à finir, les records de l'aventure sans
fin (`extras`, les textes mêmes de l'appareil). `familyBackup.ts` vérifie seulement qu'ils
sont du JSON borné ; `familyExtras.ts` les relit par leurs propres règles (il est dans le
paquet `rules`, comme tout `src/*.ts`). La clé vivante `family` ne porte jamais d'extras :
`familyPersistence.ts` refuse d'y écrire un fichier version 6. À la restauration, les extras
repartent sous leurs clés (avec retour arrière si l'appareil refuse), puis l'aventure est
écrite seule, comme avant.
Un fichier sans extras reste écrit dans sa version d'avant, à l'octet près.

### Secondes règles de chemin (21 novembre 2026)

`findPath` reliait deux cases voisines dès que leurs deux centres étaient libres. Sur deux
cartes de mission, un rocher coupe le trait entre deux centres : le marcheur refusait d'y
entrer, redemandait le même chemin, et restait collé. Les secondes règles
(`PathRules = 2`, `clearEdge` dans `navigation.ts`) demandent aussi le trait libre.

- **Qui les joue.** Une mission les porte dans son tirage (`MissionRun.paths === 2`, avec la
  révision 2 seulement) ; `Game.pathRules` les lit, `movement.ts` et `routes.ts` les passent
  à `findPath`, dont le cache a une clé par règle. Sans ce champ, tout se joue comme avant :
  les cartes de la grande aventure n'ont aucun trait coupé, elle garde les premières règles.
- **Les nouveaux départs.** `CURRENT_MISSION_PATHS` : un nouveau tirage de mission ou de défi
  (`ui/expeditions.ts`, `ui/missionDraft.ts`) et les batailles de l'expédition version 3
  (`ExpeditionTuning.paths`). Le voyage à finir ne change pas.
- **Ce qui les garde.** Le code de départ : règle `0`, écrite comme la règle 4 (un chiffre, pour que les
  applications déjà distribuées répondent « une autre version des règles »)
  (`departures.ts`) ; un code `…-4-…` rejoue l'ancienne partie. La sauvegarde du camp :
  version 16, qui ne tient que ces règles (la version 9 ne les tient pas). Le fichier familial
  reste dans sa version : c'est le camp qu'une application plus ancienne refuse. Sans camp
  sauvé, un fichier qui ne porte ces règles que dans ses derniers départs (`lastRuns`) est lu
  par une application plus ancienne, qui oublie le champ : « le même départ » s'y rejoue avec
  les premières règles. Rien d'autre n'y est perdu.
- **Le coût.** `clearEdge` garde ce qu'il a trouvé pour chaque trait d'une carte (le terrain
  d'une carte ne change pas) : sans cela, un chemin neuf coûtait treize fois plus cher.
- **Mesure.** `scripts/caprices-lab.mjs … 2 1` (premières règles) et `… 2 2` (secondes) :
  `docs/BILAN-HYGIENE-2026-11.md`.

L'enveloppe `conquete-serpents:family:v1` prime sur les deux clés historiques au
démarrage, même si son camp vaut null. En son absence, les anciens camps et profils
sont lus. Les anciennes clés restent des miroirs de compatibilité ; les écritures
ordinaires synchronisent l'enveloppe après camp et carrière. `campMemory.raw` est
la source de l'export vivant. Un import de profil seul efface sa reprise.

Le plateau demande une sauvegarde plusieurs fois par seconde, combat compris. `family.sync`
garde le texte de sa dernière demande aboutie : la même demande ne refait pas le fichier
(validation, écriture, relecture). Un import, une lecture ou une écriture effacent ce
souvenir ; une écriture refusée n'en laisse pas et sera retentée
(`tests/family-sync-settled.test.ts`).

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

`balanceRevision.ts` résout des révisions immuables : 1 historique, 2 pour
les nouveaux départs explicitement créés par la session (3, 4 et 5 depuis, plus bas). `data.ts` et les
36 définitions historiques ne changent pas. Game expose sa révision readonly ;
les prix et les définitions de caprices sont résolus sans mutation et avec cache.
Les anciennes API gardent leur défaut historique. Les reprises, codes et réessais
conservent la révision : code 4, camp 9, progression 2 et famille 5 portent la
révision 2 ; les lecteurs historiques restent disponibles. Les carnets restent
au format 1 et partagent la campagne et ses étoiles.

### Révision 3 — 15 novembre 2026

Idée du fils (« plus d'œufs quand la partie dure »), valeurs choisies par le parent après
mesure ([bilan](BILAN-REVISION-3.md)). `balanceRevision.ts` connaît trois révisions ; la
troisième garde les prix de la deuxième et ajoute `lateEggRule` : dans une vague qui dure, un
œuf de plus apparaît après 45 s, un second 15 s plus tard, jamais plus de deux par vague ;
chacun éclot en 8 s et donne deux serpents.

- **Grande aventure seulement.** Une mission, un défi ou une étape du voyage restent en
  révision 2 : `Game` refuse une mission en révision 3, et le voyage version 1 ne change pas.
- **Moteur.** `Game` compte les secondes de la vague et les œufs pondus dans deux champs
  privés, remis à zéro par `startWave` ; `layLateEgg` (`engine/spawning.ts`) tire la voie avec
  le tirage de la partie et pose l'œuf à droite des trois places des œufs ordinaires
  (`MAX_WAVE_EGGS`). Les champs sont privés pour que l'empreinte d'une partie des révisions 1
  et 2 ne change pas d'un caractère.
- **Ce qui porte la révision.** Code de départ : règle 5 (`AVENTURE-5-…`), refusée pour une
  expédition. Camp : version 10, avec `balance: 3`, sans mission. La sauvegarde familiale
  reste en version 5 et la progression des missions en version 2 : elles savaient déjà nommer
  une révision. Un fichier d'avant se relit comme avant ; un appareil resté sur une ancienne
  version du jeu refuse un camp ou un code de la révision 3, sans rien abîmer.
- **Ce que voit l'enfant.** `Presentation` lit `game.lateEggsLaid` et montre un bandeau quand
  l'œuf apparaît (le message du moteur ne se voit que dans le panneau des alliés) ; une
  phrase dans « Dangers » et une dans l'aide. Aucun minuteur n'est affiché.

### Révision 4 — 16 novembre 2026

Trois serpents imaginés par le fils ([bilan](BILAN-REVISION-4.md)) : `fang` (« Grands
crocs »), `rare` (« Serpent rare ») et `shadow` (« Serpent ninja »). La révision 4 garde tout
de la révision 3 et ajoute ces trois espèces aux vagues de la grande aventure.

- **Où ils entrent.** `variantFor(vague, place, révision)` (`waves.ts`) calcule d'abord la
  vague d'avant (`historicVariant`), puis `NEWCOMERS` donne trois places : un nouveau ne
  remplace qu'un serpent simple (ordinaire, vif ou carapace). Les spécialistes d'une vague et
  son annonce ne bougent pas, et le nombre de serpents non plus. Sans révision, la fonction
  rend exactement les vagues d'avant : missions, défis et voyage n'en reçoivent aucun.
- **Ce qu'ils font.** Les valeurs sont dans `enemies.ts` ; les deux règles propres dans
  `enemyAbilities.ts` : `biteDamage` (la morsure du serpent rare vaut au moins la vie d'une
  Massue, `RARE_BITE = kinds.club.hp`) et `dodgesOf` (le ninja reçoit `dodges = 1` à son
  arrivée ; `hitEnemy` décompte et ne fait rien d'autre de ce coup). `dodges` n'existe que
  sur un serpent ninja : l'empreinte d'une partie des révisions 1 à 3 ne change pas.
- **Ce qui porte la révision.** `isClassicRevision` (`balanceRevision.ts`) dit qu'une
  révision n'existe que dans la grande aventure (3 et suivantes). Code de départ : règle 6. Camp :
  version 11. La sauvegarde familiale reste en version 5. Pour une révision suivante de la
  grande aventure : une ligne dans `CLASSIC_VERSION` (`checkpoints.ts`) et une dans
  `CLASSIC_RULE` (`departures.ts`).
- **Ce que voit l'enfant.** Les trois fiches dans « Dangers » et dans l'index
  (`THREAT_DETAILS`), un conseil pour deux d'entre eux, et « Esquive ! » au-dessus du ninja
  (`Presentation` voit `dodges` baisser). Les annonces de vague (`waves.ts`) ne les nomment
  pas encore.
- **Dessins.** Planche `serpents-nouveaux` et sa planche d'attaque : les trois serpents du
  fils dessinés le 18 novembre 2026 (Magnific, assemblées par `scripts/assemble-new-snakes.py`,
  `public/assets/illustrated/PROVENANCE-SERPENTS-NOUVEAUX-2026-11-18.md`). Ils regardent vers
  la droite. Les images provisoires du 16 novembre restent décrites dans
  `PROVENANCE-SERPENTS-PROVISOIRES-2026-11.md`.

`ui/recruitmentReminder.ts` observe les achats réussis de Session, l’or dépensable
et les frames actives réelles, indépendamment de ×1/×2. Le rappel reste sur la
ligne d’annonce existante et dans un cache UI de 64 codes maximum, avec repli
mémoire si le stockage est refusé. Il ne modifie ni Game, ni RNG, ni sauvegarde.

### Révision 5 — 18 novembre 2026

Le serpent ninja du fils se téléporte ([bilan](BILAN-REVISION-5.md)). La révision 5 garde tout
de la révision 4 ; seul `hitEnemy` (`engine/damage.ts`) change : quand le ninja laisse passer
son premier coup, `teleportBehind` le pose dans le dos de l'allié qui a frappé
(`ninjaTeleport(révision)` dans `balanceRevision.ts`, `behind: 34`), sur un sol libre
(`blocked`), jamais à moins de 60 unités du cristal, et lui fait refaire son chemin
(`forgetPath`). L'effet `blink` (de l'ancienne place à la nouvelle) donne l'anneau
(`effectTrails.ts`) et le son. Code de départ : règle 7. Camp : version 12. Une fiche de
serpent se lit selon la révision de la partie (`abilityOf(espèce, révision)`, `threatPreview.ts`) :
« Dangers » et l'index ouvert depuis « Dangers » passent celle de la partie ; l'index ouvert
hors partie (Favoris) prend la révision courante.

### Révision 6 — 18 novembre 2026

Le serpent sauterelle du fils saute la ligne ([bilan](BILAN-REVISION-6.md)). La révision 6
garde tout de la révision 5 et ajoute une espèce, `grasshopper` : une par vague dès la vague 7,
à la place 9 (`NEWCOMERS.grasshopper` dans `waves.ts`, qui remplace une Carapace). Elle naît
avec un saut (`leaps`, `leapsOf`). À chaque tour, avant de chercher qui mordre,
`leapOverLine` (`engine/leap.ts`) la fait sauter si un allié de sa route (`band: 60` en
hauteur) est à moins de `reach: 110` devant elle : elle se pose `behind: 40` plus loin que
l'allié de sa route le plus près du cristal, jamais à moins de 60 du cristal ni sur un
rocher ou la rivière (places plus proches essayées, comme la téléportation du ninja). La
pose et le recalage de l'étape du chemin sont partagés avec le ninja (`engine/landing.ts`).
Ensuite elle marche comme les autres. L'effet `leap` donne l'arc en pointillés
(`effectTrails.ts`) et son son. Code de départ : règle 8. Camp : version 13.

## L'aventure sans fin — 20 novembre 2026

Idée et choix du parent ; décisions et mesures dans [MODE-INFINI.md](MODE-INFINI.md).

- **Moteur.** `new Game(seed, undefined, undefined, 7, undefined, ENDLESS_RULES[1])`. Après la
  vague 12, `nextRound` (`engine/outcome.ts`) remet la vague à 0, ajoute un roi
  (`game.kings`, derrière des accesseurs : l'empreinte des autres parties ne change pas) et
  ouvre un cadeau. `endlessStats` (`endless.ts`) multiplie vie, morsure et prime de vague à
  chaque roi. Les règles sans fin nomment leur révision et leur table de cadeaux.
- **Cadeaux.** `boons.ts` : `BOON_RULES` par version (places, niveau maximal, pas par
  niveau), `boonOffer`, `takeBoon`, `readBoons`. `Game` : `boonOffer`, `boons`, `boonGain`,
  `boonNeedsPlace`, `chooseReward(id, place)`. Effets : coups (`allies.ts`), vie des alliés
  (`state.ts`, et ceux du camp au moment du cadeau), prix, pièces et cristal en fin de
  vague, portée des tireurs, miel.
- **Sauvegarde.** Camp version 15 : `balance`, `endless`, `kings`, `boons` ; cartes « une
  fois » relues par `readEndlessRewards` ; `game.restoreEndless` rebâtit les camps déjà
  servis. Les camps 1 à 14 ne changent pas. La carrière et les camps de chapitre ignorent
  l'aventure sans fin.
- **Records.** `endlessRecords.ts`, clé par joueur dans `PLAYER_KEYS`. Écrits par
  `recordEndless` (`src/boot/saving.ts`) à chaque pas qui compte, une ligne par graine de départ.
- **Écrans.** `menu.ts` (porte, record), `hud.ts`, `battleBriefing.ts`, `presentation.ts`
  (vague depuis la première), `rewardControls.ts` et `boonCopy.ts` (cadeaux, places),
  `battleCommands.ts` (« Continuer », « Rentrer avec mon record »), `resultCopy.ts`.

## La Grande Expédition — 20 novembre 2026

Décisions du parent et mesures dans [VOYAGE-LONG-PROPOSITION.md](VOYAGE-LONG-PROPOSITION.md).

- **Moteur.** `expedition.ts` (réexporte `expeditionTuning.ts`, `expeditionPlan.ts`,
  `expeditionState.ts`, `expeditionRead.ts` depuis le 23 novembre 2026) : `planExpedition(seed)` tire trois tableaux de sept pas
  (`first`, `fork`, `halt`, `fork`, `fork`, `halt`, `guardian`). L'état (`ExpeditionState`)
  ne garde que ce que l'enfant a fait : tableau, pas, choix, camp porté, cadeaux, sac, bourse,
  question en attente. Chaque bouton demande une transition (`winBattle`, `chooseGift`,
  `rerollGifts`, `chooseHalt`, `buyAtRoulotte`…) ; une transition refusée rend `null`.
  `readExpeditionState` relit un état gardé et refuse tout ce qu'une vraie expédition ne peut
  pas atteindre. `expeditionPhase` dit ce qui est demandé maintenant.
- **Bataille.** `createExpeditionGame` construit une étape de version 3 (`voyageRules.ts`) ;
  `Game.receiveCamp` reçoit le camp porté, `Game.strengthen` renforce les serpents.
  `resultCopy.ts` nomme une étape de version 3 « Mission gagnée ! » ou « On réessaie ? ».
- **Stockage.** `expeditionStorage.ts`, clé `EXPEDITION_STORAGE_KEY` dans `PLAYER_KEYS` :
  l'expédition en cours et le record (missions gagnées dans une expédition).
- **Porte.** Depuis le 21 novembre, l'expédition remplace le voyage court. `voyageDoor.ts`
  (paquet de départ) garde le bouton `#home-voyage` : il dit « Reprendre le voyage » tant
  qu'un voyage commencé reste à finir (`voyageToFinish`), sinon « La Grande Expédition », et
  lit l'expédition par `expeditionLog.ts` sans charger ses règles. `voyageScreens.open` montre
  le voyage à finir, ou ouvre l'expédition ; la fin d'un voyage n'a plus qu'un bouton vers
  elle. Plus de code ni de nouveau voyage : `voyageCode.ts` et le laboratoire du voyage ont
  quitté le dépôt le 21 novembre 2026 ; un ancien code `VOYAGE-…` ne se relit plus.
- **Écrans.** `ui/voyage/expedition/`, chargés avec ceux du voyage : le contrôleur
  (`expeditionScreens.ts`), les vues (`expeditionViews.ts`, dont la route du tableau tracée
  en SVG sous une grille d'arrêts), les mots (`expeditionWords.ts`, sans page, testés :
  `roadColumns` donne la route colonne par colonne). La page reprend
  `voyagePage('expedition')`, la fenêtre des caprices et le panneau de fin de bataille du
  voyage (`voyageBattle.ts`), qui sait à qui appartient la partie sur le plateau.

## Choix du moteur — réévalué le 11 novembre 2026

Phaser 3 reste le bon choix, et la question ne se rouvre pas sans mesure sur le téléphone.

- Le jeu n'utilise qu'une petite partie de Phaser : scène, images, formes, textes, un cache de
  terrain. Ni physique, ni animations du moteur. Le rendu tient en 3 057 lignes (`src/render`).
- Les règles n'en dépendent pas : TypeScript pur, plus de 800 tests, parties rejouables à
  l'identique.
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

Après la fermeture du jeu, une mission gagnée laisse son dernier camp dans la sauvegarde.
Pour que l'accueil ne propose plus de la reprendre (décision 14 du parent, 18 novembre), le
jeu garde sur l'appareil, à côté du fichier familial, la marque de ce camp
(`conquete-serpents:mission-done:v1`, une clé par joueur dans `PLAYER_KEYS`) : sa longueur et
une somme FNV-1a de 32 bits (`missionDone.ts`), pas une copie. Le fichier familial ne change
pas ; une ancienne sauvegarde se lit comme avant. `missionWaits` (`src/boot/games.ts`) ne dit
« Reprendre » que si le camp en attente n'a pas cette marque. « Reprendre ma mission » reste
sur la page Missions ; y rentrer efface la marque, et le camp redevient une mission en cours.
Stockage refusé ou marque abîmée : l'accueil se comporte comme avant. Recette :
`scripts/mobile-resume-checks.mjs`, dans `npm run test:mobile-menus`.

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
| `voyageStorage.ts` | Le carnet d'un joueur : voyage en cours, record personnel, lecture et écriture       |
| `voyageRules.ts`   | Ce qu'une étape ajoute au moteur (`StageRules`)                                      |
| `codeText.ts`      | L'écriture des codes de départ (alphabet, contrôle, saisie)                          |

- **Plan.** Une graine tient sur 20 bits (un million de voyages) : le code de voyage, parti
  depuis, devait rester court.
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
`{ version: 1, king, coins, ward, bag }`, ou `{ version: 2, king, court, coins, ward, bag }`
depuis le voyage de version 2 (18 novembre 2026). C'est la seule extension, et elle est
versionnée comme une révision d'équilibrage : une étape de version 1 n'a pas de champ `court`
et garde ses règles, octet pour octet. `court` n'existe qu'avec le roi (`readStageRules`
refuse une cour sans roi). `stageRulesFor` écrit les clés dans l'ordre du lecteur, car
`voyageState` compare les règles de l'étape attendue et celles de la partie comme du texte.
Sans ce paramètre, rien ne change.

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
  existant, que `createStageGame` passe au constructeur. Si l'étape dit `court`
  (`kingBringsCourt`), le roi prend les `COURT_SLOTS` dernières places de la vague avec ses
  deux gardes et son guérisseur, comme dans l'aventure ; la cour reçoit la vie du caprice
  comme tout serpent. `ui/threatPreview.ts` l'annonce dans l'aperçu de cette vague.
- `checkpoints.ts` : `encodeCheckpoint` refuse une partie de voyage. Un camp n'a pas de place
  pour les règles d'une étape ; relu, ce serait une expédition ordinaire.
- `missionProgress.ts`, `capriceAlbums.ts` : une étape gagnée ne donne ni étoile ni
  autocollant à la mission qu'elle emprunte (elle est jouée avec le sac).
- `departures.ts` : l'alphabet, les signes de contrôle et la lecture de la saisie sont partis
  dans `codeText.ts`, à l'identique. Le code de voyage qui s'en servait aussi n'existe plus
  (21 novembre 2026) : `codeText.ts` ne sert qu'aux codes de départ.
- `players.ts` : la clé du voyage rejoint `PLAYER_KEYS`.
- Le mot `VOYAGE` du code avait son texte (`src/texts/*/voyage.ts`) : parti avec le code.

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
- Dans la sauvegarde familiale depuis sa version 6 : le voyage à finir voyage avec
  l'expédition et les records (`familyExtras.ts`).

### Ce que les écrans appellent

```ts
const log = loadVoyageLog(storage); // log.best, log.current (reprise)
const state = log.current; // le voyage à finir ; plus aucun voyage ne commence
const plan = voyagePlanOf(state); // carte : plan.stages[i].run, .king, .offer ; stageCaprice(stage)
const game = stageGame(state); // nouveau camp de l'étape, sac déballé ; session.useGame(game)
const after = recordStage(state, game); // partie finie : étape réussie, ou voyage tombé
bonusOffer(after); // trois cartes si voyagePhase(after) === 'bonus'
const next = chooseBonus(after, card);
saveVoyageLog(storage, logVoyage(log, next)); // après chaque transition
```

`voyagePhase(state)` dit quoi proposer : `stage`, `bonus`, `fallen`, `arrived`.

### Écrans

Décidés par le parent sur maquettes le 14 novembre : l'entrée à côté de « Jouer », le caprice
surprise montré à l'avance sur la carte, des bonus gardés pour tout le reste du voyage. Aucun
balisage dans la page HTML : tout est construit en TypeScript.

| Module                       | Rôle                                                                               |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| `ui/voyageDoor.ts`           | Le bouton de l'accueil et le chargement des écrans ; seul module chargé au départ  |
| `ui/voyage/voyageScreens.ts` | Le carnet du joueur et les branchements : un bouton demande, le modèle décide      |
| `ui/voyage/voyageWords.ts`   | Toutes les phrases, choisies d'après l'état, sans page (`voyage-screens.test.ts`)  |
| `ui/voyage/voyagePage.ts`    | La page parmi celles de l'accueil : titre, panneau, record, note du bas            |
| `ui/voyage/voyageViews.ts`   | Les quatre vues : carte, choix d'un bonus, voyage fini, camp tombé                 |
| `ui/voyage/voyagePath.ts`    | Le chemin et ses arrêts ; `stopMap.ts` dessine la petite carte d'un arrêt          |
| `ui/voyage/voyageBag.ts`     | « Ton sac de voyage » et l'image d'un bonus ; `bonusChoice.ts`, les trois cartes   |
| `ui/voyage/voyageReplace.ts` | La question posée avant de remplacer une expédition en cours (`pendingConfirm.ts`) |
| `ui/voyage/capriceBubble.ts` | Ce que veut dire un autocollant de la carte : nom, annonce, règles changées        |
| `ui/voyage/voyageBattle.ts`  | Sur le plateau : le repère de l'étape, puis la phrase et le bouton de la fin       |
| `ui/voyage/voyage.css`       | La feuille du voyage, dans l'unité `--hu`, chargée avec les écrans                 |

- **Accueil.** `#home-voyage` suit « Jouer » : « Reprendre le voyage » tant qu'un voyage
  commencé a une étape réussie et qu'il en reste ; sinon « La Grande Expédition », avec
  l'étiquette « Nouveau » tant que le joueur n'en a jamais ouvert, ou « Reprendre
  l'expédition » (`voyageDoor`). Sur un écran bas, les deux boutons partagent une
  rangée et « Jouer » prend la largeur qui reste (`homeScene.css`).
- **Page.** Le voyage est une page de l'accueil (`data-home-page="voyage"`, `HomePage`), donc
  « ← Accueil » et Échap fonctionnent comme ailleurs. Sa vue (`data-view`) suit
  `voyagePhase` : `map`, `bonus`, `arrived`, `fallen`. Elle ne s'ouvre que pour un voyage
  commencé avant le 21 novembre 2026 ; sinon c'est l'expédition qui s'ouvre.
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
- **Fins.** Depuis le 21 novembre (l'expédition remplace le voyage), le voyage fini et le camp
  tombé n'ont plus qu'un bouton : « La Grande Expédition ». La carte d'un voyage commencé y
  mène aussi. Le record est dans la rangée du haut pendant le voyage, dans le panneau à la
  fin.
- **Remplacer.** Plus de nouveau voyage ni de code à l'écran : un voyage commencé se finit
  (`voyageToFinish`, `voyageDoor.ts`).

### Chargement à la demande

Le paquet principal est près de son plafond (200 000 octets, `scripts/check-dist.mjs`). Il ne
porte que `voyageDoor.ts` et quelques conditions sur `game.stage` ; au premier toucher du
bouton, `import('./voyage/voyageScreens.ts')` charge les écrans, leur feuille et leurs images
dans un paquet à part (`voyageScreens-*.js` et `.css`). Une partie de voyage ne peut exister
qu'après ce chargement, puisqu'une étape n'est jamais enregistrée comme camp : le repère et la
fin d'étape sont donc dans ce paquet. Si le paquet n'arrive pas (réseau coupé, cache vide), le
bouton le dit et le prochain toucher redemande. Le modèle (`voyage*.ts`) est dans le paquet des
règles, déjà chargé. Dans l'export en un seul fichier, tout est dans la page.
`npm run test:offline` ouvre ces écrans sans réseau et vérifie que leurs fichiers sont servis
depuis le disque ; `npm run test:expedition` et la partie « voyage » de
`npm run test:mobile-menus` les jouent. `npm run test:browser` n'y entre pas.

Octets : `bootstrap` 190 910 → 192 769 ; `rules` 90 358 → 95 078 ; `english` 78 032 → 82 880 ;
nouveaux `voyageScreens` 15 071 (script) et 14 555 (feuille). La page HTML ne change pas
(32 287).

### Sur l'écran de bataille

- `src/boot/games.ts` : `playStage` met l'étape sur le plateau (la partie qui s'y trouvait est mise
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

Le laboratoire du voyage (`npm run balance:voyage`) a quitté le dépôt le 21 novembre 2026 :
ses tables ne changent plus, ses mesures sont dans `docs/VOYAGE.md` et l'historique Git le
garde. Ses joueurs automatiques servent encore à l'expédition (`scripts/lab/players.ts`,
`scripts/balance-expedition.mjs`). `tests/voyage-traces.test.ts` fige douze voyages (six
graines, dans les deux versions) joués en entier par les appels de l'interface, comme `tests/engine-traces.test.ts` fige les parties :
une empreinte qui change est un voyage commencé qui ne se finit plus de la même façon.

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

- **`src/storageKeys.ts`** : les quinze clés du stockage du navigateur. Une clé est l'adresse
  de la sauvegarde d'un enfant ; un changement de sens prend une nouvelle clé (`:v2`),
  l'ancienne reste lisible. Le module a son propre petit fichier dans le build (`keys-…js`) :
  le premier script lit la clé de la langue et ne doit pas attendre le paquet des règles.
- **`src/seededRandom.ts`** : le pas du tirage au hasard (`nextSeed`, `seedShare`,
  `seededStream`), le brassage d'une graine avec le numéro d'une question (`mixSeed`,
  `questionStream`), le choix dans une liste (`pickOne`) et le mélange (`shuffle`). Le
  combat, les récompenses, les cadeaux, le voyage, l'expédition et le décor gardent chacun
  leur état mais avancent tous par ces calculs. Les changer change toutes les parties et
  tous les codes déjà donnés.
- **Limites** : chacune est exportée par son module de règles et lue par l'interface —
  `ROSTER_SIZE` (`gameConstants.ts`), `DEPARTURE_INPUT_LIMIT` (`departures.ts`),
  `CAMP_CHARACTER_LIMIT` (`checkpoints.ts`).
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

### Préparation publicitaire Web désactivée

`src/ui/webAds/layout.ts` est un calcul pur, sans dépendance vers les règles.
`preview.ts` et son CSS ne sont importés que dans le mode Vite `ads-preview`,
qui écrit `dist-ads-preview/`. Les sorties normales les éliminent et sont
contrôlées par `scripts/check-web-ad-disabled.mjs`. Le contrat d'attributs est
inerte ; il n'existe aucun chargeur publicitaire ni interrupteur URL/stockage.
`bindBoardResize` retourne un invalidateur de bornes regroupé par animation frame,
utilisable lors d'un déplacement de conteneur sans modifier le moteur de jeu.

## Publicité sur le site — 17 novembre 2026

Décision du parent ; tout est décrit dans
[PUBLICITE-WEB-PROPOSITION.md](publication/PUBLICITE-WEB-PROPOSITION.md). Dans le code :

- **Un interrupteur**, `WEB_AD_DELIVERY` (`src/ui/webAds/contract.ts`), sur `disabled`. Le
  build en tire `__WEB_ADS__` (`vite.config.ts`) : faux, la branche de `src/boot/phaser.ts` qui
  charge `ui/webAds/delivery.ts` disparaît du paquet avec tout ce qu'elle importe. Le site
  publié ne contient donc aucun code publicitaire, et `scripts/check-web-ad-disabled.mjs`
  échoue s'il en trouve. Android et la copie portable n'en reçoivent jamais.
- **`layout.ts`** (Codex) calcule la place, sans navigateur ; **`measure.ts`** lit la page
  pour lui ; **`choice.ts`** dit si un parent a coupé la publicité (`ADS_OFF_KEY`) ;
  **`delivery.ts`** pose l'encart une fois et le bouton de « Pour les parents ». L'aperçu
  local `preview.ts` reste la maquette de Codex.
- **`deploy/policy.ts`** : `apacheConfig(webAds)` n'ouvre la protection qu'à la page du jeu
  (`SetEnvIf … game_page`), et seulement interrupteur allumé.
- **Recette** : le mode de build `ads-test` allume l'encart et lui fait demander
  `./fake-ads.js`, que la recette sert elle-même (`scripts/web-ads-delivery-browser.mjs`).

## Textes lisibles sur téléphone — 18 novembre 2026

Un téléphone en paysage dessine le plateau à environ la moitié de sa taille : un texte écrit
à 15 unités du plateau s'y lisait à 7 px. Règle : **un texte écrit sur le plateau se lit à
11 px au moins à l'écran** (`BOARD_TEXT_MIN_PX`), et `readableBoardSize(scene, taille)`
(`src/render/boardResolution.ts`) donne la taille en unités du plateau qui le garantit. Là où
le plateau garde sa taille (ordinateur, harnais des recettes), le texte garde la taille pour
laquelle il a été dessiné : aucune image de référence ne change.

- Concernés : compte à rebours d'un œuf, confusion, courage, tir du roi, mots flottants
  (dégâts, « Esquive ! »), nom et vie de King Snake, plaque du refuge
  (`battleFeedback.ts`, `strongholds.ts`). La phrase de fin de partie garde son plancher de
  13,5 px, par la même fonction.
- **Raccourcis sur un petit plateau** (décision du parent, 18 novembre) : là où le plateau est
  dessiné petit (`boardShownSmall`, le même seuil que la plaque du cristal sur deux lignes),
  le miel n'écrit que ses secondes (« 13 s »), un soigneur son stock seul (« +2 »), la réserve
  son attente seule (« 4 s ») ou rien, la croix du fort disant déjà « Réserve » ; la garde du
  roi est un bouclier dessiné, son soigneur une croix et le nombre de ses soins
  (`BattleScene.ts`, `medicalSignals.ts`, `bossSignals.ts`). Une tablette et un ordinateur
  gardent les mots entiers.
- **Pas encore concernés** (5 à 9 px sur téléphone) : les symboles de menace des antres
  (`threatMarkers.ts`), dont les signes sont à choisir avec le fils, et les noms des trois
  têtes de King Snake. Aucun test n'impose encore la règle à tout `src/render/`.
- Chaque texte a son propre besoin : sur un écran moyen, le nom de King Snake doit grandir
  alors que les plaques sont déjà assez grandes. Les plaques qui portent une phrase
  entière (confusion, courage) prennent la largeur de leur texte, pas le double de leur
  largeur dessinée.
- La plaque du refuge est dessinée (`refugePlate`), pas laissée au fond du texte : Phaser
  ne remplit qu'un coin du fond d'un texte affiché sous sa taille, et « 100 % » se lisait
  sur le chemin nu.
- En bas du plateau, la ligne d'annonce de la page et la plaque de courage occupaient la
  même bande : l'annonce cachait le début de « Courage ! ». La scène dit à la page quand
  elle écrit là (`onPresentation(…, plaques)`), et l'annonce se place juste au-dessus
  (`.battle-announcement.above-plaques`, `placeAnnouncement`). Elle monte à son apparition
  ou quand la plaque arrive, et redescend une seule fois, une seconde après la fin de la
  plaque : la confusion, qui dure 0,8 s et reste à
  gauche de l'annonce, la faisait sauter. Relevée, elle couvre un instant le pont de la voie
  du bas sur téléphone : à regarder en jouant.
- « Esquive ! » est écrit plus haut que les chiffres des coups, et plus longtemps (1,4 s) :
  dessous, il était recouvert au bout d'un tiers de seconde.
- Sur téléphone (18 unités et plus), la plaque du refuge est écrite sur deux lignes
  (`cristalSurDeuxLignesN`) et grandit vers le bas : sur une ligne, elle couvrait les alliés
  posés à sa gauche. Les lignes sont écrites, pas coupées par le moteur, qui laissait « % »
  seul sur une tablette.
- Sous l'écran des cadeaux, le plateau est rendu inerte par la page (`inert`), pas caché :
  il reste dessiné, et le clavier ne s'y perd plus. L'anneau de focus du plateau est posé
  par-dessus le canevas, qui le recouvrait.
- Les plaques grandissent avec leur texte et restent sur le plateau ; les plaques d'œufs
  s'écartent d'autant (`eggLabelPositions(eggs, scale)`), et une rangée trop chargée se
  partage la largeur au lieu de sortir du plateau.
- Rendu seul : aucune règle, aucune partie de référence touchée.

### Montrer ce qui existe — 18 novembre 2026

Trois choses existaient dans les règles sans que l'enfant les voie (décision 11 du parent) :

- **« Encourager »** demandait quatre appuis. Pendant une vague, le bouton de lancement n'a
  rien à faire : `#encourage-quick` prend sa place (`adventureControls.ts`,
  `mainActions.css`). C'est la même commande que dans « Actions du camp » ; la règle (une
  fois par vague, gratuit) ne change pas. Il reste à sa place toute la vague, grisé une fois
  dépensé : parti au milieu du combat, il déplaçait pause et vitesse sous le doigt. Il est
  retenu (`aria-disabled`), pas désactivé : un bouton désactivé perd le focus, et la barre
  d'espace mettait alors le jeu en pause. Il ignore un appui pendant les 0,9 s qui suivent le
  début de la vague : il apparaît là où était « Lancer la vague », et un double appui
  dépensait l'encouragement avant le premier serpent.
- **Un serpent rencontré pour la première fois** est annoncé par son nom, dans la vague où la
  grande aventure l'envoie d'abord (`render/newcomers.ts`, d'après l'index des serpents) ;
  jamais en mission, dont les vagues suivent un autre ordre.
- **Un allié que le camp peut désormais recruter** est nommé après « Vague N repoussée ! ».
- **Les annonces de nouveaux venus attendent leur tour** (`Presentation.waiting`,
  `takeTurns`) : le plateau n'écrit que le titre d'une annonce, donc chacune est un titre à
  elle ; aucune ne couvre le titre d'une vague ni l'entrée de King Snake (le soigneur du roi
  est nommé après lui), aucune n'en couvre une autre avant qu'elle soit lue, et aucune ne
  sort pendant le choix d'un bonus, dont l'écran couvre le plateau sur téléphone.
- **« KSSS »** : le mot du fils quand le serpent rare mord, écrit là où il a mordu, même s'il
  tombe dans la même image.

Sur un petit plateau, un texte court n'a plus de fond mais un contour sombre
(`plainCaptionWhenSmall`) : sous sa taille, le moteur ne remplit qu'un coin du fond d'un
texte, et un fond agrandi couvrait les voisins. L'attente de la réserve s'écrit à côté de la
croix du fort (sous le cristal, elle tombait sur sa plaque à deux lignes) ; les secondes du
miel passent au-dessus des alliés ; le bouclier et la croix de la garde du roi sont dessinés
aux pieds de chaque serpent, dans son anneau (au-dessus des têtes, ceux de gardes en colonne
s'empilaient). « Garde du roi » et « Soigneur · N » en toutes lettres suivent aussi la taille
lisible sur tablette.

Les mots flottants et les plaques ne sont plus redessinés à chaque image : le moteur
redessine un texte dès qu'on lui redonne sa couleur, même identique (une vingtaine de textes
par image pendant la vague du roi).

Les empreintes de la présentation changent avec ces annonces ; celles des parties rejouées
(`engine-traces`) ne changent pas. Non couvert par une recette navigateur : le bouton, les
annonces et les textes courts ne sont contrôlés que par des tests unitaires et des captures.

### Vues des joueurs hors du paquet principal — 18 novembre 2026

Le paquet principal était à 0,9 Ko de sa limite (`scripts/check-dist.mjs`, 200 000 octets).
La fenêtre des joueurs (`ui/playersDialog.ts`), la pastille de l'accueil et la liste restent
dans le paquet ; ses vues (« Qui joue ? », le choix d'un personnage, la liste des parents)
sont dans `ui/playerWindow.ts`, un fichier à part que le jeu demande dès son lancement, à côté
du reste. Au premier toucher, elles sont là : chargées seulement à l'ouverture, elles
arrivaient un instant après le doigt, et `test:mobile-menus` touchait une carte entre deux
dessins de la fenêtre. Quand plusieurs joueurs partagent l'appareil, la fenêtre couvre la
page dès le lancement, comme avant. Paquet principal : 199 066 → 195 910 octets. Aucun
comportement ne change.

Dans l'interface, les textes que l'enfant lit pendant la partie passent à 13 px sur téléphone
(« Attirer », « Ralentir », « Haut / Centre / Bas », « Dangers », ligne d'annonce, prix des favoris, total de
vagues, onglets et bourse du catalogue, notes de « Dangers », prochaine mission). Les cartes
du catalogue (vingt alliés en un écran) gardent leurs tailles : les agrandir demande de
revoir cet écran. L'en-tête de la bataille sur grand écran a la hauteur de ses boutons, qui
dépassaient de 6 px en haut de la fenêtre : 48 px là où un doigt peut toucher l'écran,
36 px (boutons compris) pour une souris seule, où la hauteur du plateau ne change donc pas —
12 px de moins suffisaient à ne plus laisser de place à l'encart publicitaire en 1920×800. Sur téléphone, « Continuer sans
bonus » est à côté du titre des cadeaux : sous les cartes, il sortait de l'écran.

## Livraisons Web et Android indépendantes — 19 novembre 2026

`deploy/buildTargets.ts` est le contrat des cibles : Web, Android, portable,
maquette locale et recette publicitaire locale. Les conditions Vite n'ont plus à
être recopiées lors d'un nouveau mode. Seule la production Web peut recevoir le
chargeur Google ; Android reste sans les pages publiques et services Web.

Chaque build écrit `build-info.json` : version de jeu commune, cible, commit,
état des sources et capacités. Les deux plateformes peuvent être livrées à des
commits différents. Il n'est pas nécessaire de créer deux moteurs, deux dépôts ou
de dupliquer les règles. Le code Android augmente lorsqu'un nouveau package est
livré ; une publication du site seule ne nécessite aucun AAB.

`assertAndroidDistribution` contrôle le contenu et l'identité. Après `android:sync`,
la copie Capacitor doit correspondre exactement à `dist-android` par SHA256, avec
les deux seuls stubs Cordova vides ajoutés par Capacitor. `android:package` reproduit
la vérification après extraction de l'AAB signé et de l'APK universel. Le mapping
R8 et la signature sont contrôlés séparément. Les identifiants de build restent
des données de provenance, sans aucun suivi des joueurs.

## Quand quelque chose casse — 22 novembre 2026

Phaser ne redemande une image qu'une fois la précédente terminée : une exception n'importe où
dans une image arrête le plateau pour de bon. La page reste, ses boutons répondent, plus rien
ne bouge. C'était le point faible relevé par [l'analyse](ANALYSE-2026-11-22.md) (S1 et S2).

- **Le guetteur** (`src/failureWatch.ts`, branché dans `src/boot/phaser.ts`). Après toute erreur
  (`error`, `unhandledrejection`), il laisse trois images au plateau. Si le plateau devait
  tourner et n'en a dessiné aucune, il le dit, une seule fois. Une erreur que le plateau
  traverse n'affiche rien ; un plateau endormi parce que la page est cachée n'est pas une
  panne. Il ne lit ni n'écrit rien, et n'envoie rien nulle part. Phaser compte une image une
  fois finie : l'erreur qui arrête le plateau porte donc le même compte qu'une erreur
  traversée juste avant, et que toutes celles qui suivent. Le guetteur garde les premières
  erreurs différentes vues sur ce compte, trois au plus, dans l'ordre : celle qui a arrêté
  le plateau est parmi elles, sauf si trois autres sont arrivées avant elle dans le même
  soixantième de seconde. Des erreurs qui continuent n'allongent pas l'attente.
- **Un seul gabarit** (`src/ui/failure/trouble.ts`) pour un jeu qui ne peut pas continuer :
  un titre, une phrase à l'enfant, un bouton, et ce qu'il faut à un parent replié sous « Pour
  les parents ». La fenêtre ne se ferme pas : derrière, rien ne marche. Elle refuse toute
  demande de fermeture (`closedby="none"`) et, si quelque chose la ferme quand même (un
  navigateur qui ne connaît pas cet attribut la laisse partir à la deuxième touche Échap),
  elle se rouvre aussitôt : quelques millièmes de seconde sans elle, mesurés dans Chromium.
  Le foyer est sur son titre, pas sur le bouton : Espace ou Entrée ne font rien à la place de
  l'enfant.
- **Le plateau arrêté** (`src/ui/failure/failureWindow.ts`) : « Oups, le jeu s'est emmêlé ! »,
  « Relancer le jeu ». En plein combat, la phrase dit que la bataille est à refaire depuis son
  début, ce qui est vrai dans tous les modes ; ailleurs (camp, résultat, accueil) rien n'est
  à refaire, et elle dit seulement de relancer. Si la panne revient moins de cinq minutes
  après une relance, la phrase envoie l'enfant chercher un adulte ; la page s'en souvient
  dans son propre historique (`history.state`), rien n'est écrit sur l'appareil. Sous « Pour
  les parents » : la version et les erreurs en une ligne (jamais une pile d'appels), à
  prendre en photo.
- **Le démarrage manqué** (`src/ui/failure/rescue.ts`, appelé par `src/main.ts`) : la même
  fenêtre, « Oups, le jeu n'arrive pas à démarrer ! », « Réessayer ». Sous « Pour les
  parents », sur le site : un bouton par fichier familial que l'appareil garde, rendu tel
  quel, sans être lu, donc même abîmé, et une phrase qui dit ce que ces fichiers portent et
  ce qu'ils ne portent pas (l'expédition, le voyage, les records). Dans l'application, les
  mêmes boutons passent par la question pour adulte puis le partage d'Android ; un build sans
  les deux modules du partage montre une phrase à la place des boutons (voir « Remettre un
  fichier à la famille »). Chaque texte gardé est lu à part : un texte illisible n'emporte pas les
  autres.
- **Ces fenêtres voyagent avec la page.** Le gabarit et le démarrage manqué sont dans le
  premier script de la page, la fenêtre du plateau dans le code du jeu : le jour où quelque
  chose casse, rien n'est à aller chercher. (Un premier essai les demandait au réseau au
  démarrage : si cette demande échouait une fois, le navigateur ne la refaisait jamais et la
  fenêtre ne venait plus.) Coût : 2,5 Ko de plus dans le premier script, aucune requête.
  `scripts/check-dist.mjs` tient la liste des fichiers que ce premier script a le droit de
  charger avec lui — ni les règles, ni le code du jeu, ni Phaser, qui peuvent être ceux qui
  ont échoué — et refuse tout autre.
- **Tenu par** `tests/failure-watch.test.ts` et la recette `npm run test:failure`
  (`scripts/hygiene/failure.mjs`, tâche « sauvegardes » de la CI), aux trois tailles
  d'écran : une erreur provoquée en pleine vague, la fenêtre, le titre, la phrase et le
  bouton visibles sans défiler, six touches Échap et une fermeture forcée sans effet, la
  relance qui rend le camp d'avant la vague, la panne qui revient aussitôt, la panne six
  minutes plus tard, la panne hors d'un combat ; un démarrage qui échoue avec tous les
  autres scripts coupés, « Réessayer » qui relance le jeu, deux fichiers rendus à l'octet et
  importables sur le site, aucun bouton de fichier dans l'application.
- **Ne couvre pas** : dans La Grande Expédition, « depuis le début » veut dire l'étape
  entière ; une exception tardive du démarrage affiche « n'arrive pas à démarrer » par-dessus
  un accueil déjà dessiné ; « ça recommence » est dit à tout joueur de l'appareil dans les
  cinq minutes ; rien n'est vu sur un téléphone (le geste « retour » avec la fenêtre
  ouverte, `location.reload()` et `history.state` dans l'application) ; les mots sont à lire
  par le parent.

Pas essayé : sur un vrai téléphone, où l'enregistrement d'un fichier depuis le WebView reste à
confirmer (c'est le même geste que l'export familial).

## Quand ce qui est joué n'est pas gardé — 22 novembre 2026

Un appareil plein, ou un navigateur qui bloque le stockage, ne se voyait qu'à une ligne de dix
pixels au pied de l'accueil : une heure de jeu pouvait partir à la fermeture
([analyse](ANALYSE-2026-11-22.md), S7).

- **Une seule réponse, vraie** : `family.unkept` (`src/familyPersistence.ts`) vaut `null`
  exactement quand le fichier que le jeu écrirait maintenant est celui que l'appareil garde.
  Sinon il dit pourquoi : `blocked` (pas de stockage pour le jeu, ou stockage illisible),
  `full` (l'appareil a refusé la dernière écriture), `broken` (le jeu n'a pas su construire le
  fichier). Une écriture qui passe, ou un retour à ce qui est déjà gardé, y met fin. Les
  records de l'aventure sans fin ont leur propre drapeau (`createRecordBook`) : un record
  refusé est gardé en mémoire et réécrit à chaque sauvegarde suivante, jusqu'à ce que
  l'appareil le prenne. Rien ne réessaie sans un geste du joueur : la phrase des parents le
  dit (« puis continue à jouer : il réessaiera », décision du 23 novembre) ; le prochain
  geste qui sauvegarde est une vague ou un achat ; rentrer à l'accueil ne
  sauvegarde pas la partie, mais y réessaie les records refusés et regarde de nouveau ce qui
  n'est pas gardé.
- **Ce que la famille voit** (`src/ui/failure/unkept.ts`, demandé la première fois que cela
  arrive ; sur un appareil qui garde tout, rien n'est chargé) :
  - une fenêtre « Ta partie n'est pas gardée », une fois par épisode, à un moment calme :
    jamais par-dessus un combat, une autre fenêtre ou les cadeaux d'une vague (elle vient
    une fois le cadeau choisi, ou à l'accueil si l'enfant y rentre sans choisir), et pas
    avant qu'il y ait quelque chose à perdre : une vague, ou un roi de l'aventure sans fin,
    gagnés depuis que la partie est entrée en jeu la première fois (`session.wonSinceStart` :
    une vague compte une fois finie et pas perdue ; une partie remise en jeu après une mission
    garde son premier compte). Un camp trouvé à
    l'arrivée, si loin soit-il, ne l'est pas encore : un enfant qui arrive sur un appareil
    qui ne garde rien n'est pas arrêté à la porte. Elle dit à l'enfant d'aller chercher
    un adulte avant de fermer le jeu ; sous « Pour les parents », une phrase par cause. Elle se
    ferme : le jeu derrière marche.
  - sur l'accueil, à côté des étoiles, une marque « Partie non gardée » tant que cela dure :
    le parent qui arrive après l'enfant y retrouve la fenêtre.
  - quand l'appareil garde de nouveau : « C'est réparé : ta partie est de nouveau gardée. »,
    sous l'en-tête de l'accueil, jusqu'à ce que le joueur l'ait vue et soit reparti. Un
    second refus est redit.
- **Tenu par** `tests/family-unkept.test.ts` et la recette `npm run test:saves:unkept`
  (`scripts/hygiene/unkept.mjs`, tâche « sauvegardes » de la CI), aux trois tailles : écriture
  refusée juste avant une vague, rien pendant le combat, la fenêtre à la fin de la vague, la
  marque qui la rouvre, la guérison dite puis effacée, un second refus redit ; stockage
  illisible : pas de fenêtre à l'arrivée ; écritures refusées dès l'arrivée : rien pendant la
  vague même quand le jeu essaie d'écrire, rien par-dessus « Qui joue ? » ni sur un camp
  trouvé à l'arrivée, la fenêtre après une vague gagnée ; une vague à cadeaux : rien
  par-dessus les cadeaux, la fenêtre une fois le cadeau choisi, ou à l'accueil s'il ne l'est
  pas ; un camp d'après un roi trouvé à l'arrivée : la marque seule, le record refusé puis
  réécrit, l'accueil qui le dit ; seuls les records refusés : la marque. Deux attaques
  indépendantes ont essayé de casser le lot : leurs points à corriger sont repris, chacun
  tenu par la recette.
- **Ne couvre pas** : un navigateur en navigation privée qui accepte les écritures puis jette
  tout à la fermeture (aucun code ne peut le savoir) ; l'expédition et le voyage, qui ont
  leur propre message ; les refus qui ne touchent que d'autres clés (carrière, camp sous sa
  clé, liste des joueurs) ; sur le site, si les fichiers de cette fenêtre ne viennent pas la
  première fois (site ouvert puis réseau perdu), le navigateur ne les redemande pas ; dans
  l'application, la phrase « stockage bloqué » parle de navigation privée et de réglages
  qu'elle n'a pas ; rien n'est vu sur un téléphone ; les mots sont à lire par
  le parent.

## Remettre un fichier à la famille — 22 novembre 2026

Tout fichier que le jeu remet (export de l'aventure, copies, secours au démarrage) passe par
`handOver` (`src/ui/download.ts`), qui répond ce qu'il est devenu : remis au navigateur,
impossible ici, raté. « Fichier prêt » ne s'affiche que dans le premier cas.

- **Sur le site**, c'est un téléchargement du navigateur. « Remis » veut dire que le navigateur
  l'a pris : la page ne sait ni où il est allé, ni si la famille l'a gardé.
- **Dans l'application Android**, rien ne reçoit un téléchargement : l'export ne faisait rien,
  et le jeu disait quand même « Fichier prêt » (essai du parent sur le build 64, 22 novembre
  2026). Avec l'accord du parent du 22 novembre, l'application porte deux modules officiels
  de Capacitor, `@capacitor/filesystem` 8.1.5 et `@capacitor/share` 8.0.3 (versions fixes) :
  le fichier est écrit dans le cache de l'application, puis le partage d'Android s'ouvre
  (Drive, Fichiers, un e-mail…). Ni l'un ni l'autre ne demande de permission ; le partage
  passe par le `FileProvider` que l'application déclarait déjà (`cache-path`).
  - Le code des modules n'est que dans le paquet de l'application : `__APP_BUILD__`
    (`vite.config.ts`) le retire du site, et il n'est chargé qu'au moment où un fichier est
    demandé. `scripts/check-dist.mjs` refuse que le premier script charge autre chose que
    lui-même et les clés, et cherche le cœur de Capacitor par un mot qu'il porte
    (`androidBridge`), quel que soit le fichier où il est rangé : aucun sur le site, aucun
    chargé avec le premier script de l'application, et au moins un dans l'application (un
    mot renommé ne laisserait pas passer la vérification pour toujours). Trois fuites
    essayées (import direct des modules, garde au moment de l'exécution, Capacitor rangé
    avec les clés) : chacune refusée là où elle fuit.
  - Avant de montrer un bouton, la page demande au côté natif s'il porte les deux modules
    (`Capacitor.PluginHeaders`). Un build sans eux (64 et avant) garde la phrase « l'aventure
    ne peut pas sortir de cet appareil » et aucun bouton.
  - Ce qu'Android dit, et rien de plus : le module répond « annulé » si le jeu n'a pas été
    quitté pendant le partage, « réussi » sinon — même quand la famille a quitté le jeu
    (accueil, appel, écran verrouillé) puis fermé le partage sans rien choisir. Seul le nom
    de l'application choisie (`activityType`, vide sans choix) dit que le fichier est parti ;
    rien ne dit si cette application l'a gardé. D'où les phrases : « Le fichier est parti
    vers l'application que tu as choisie. Vérifie qu'il y est bien arrivé… » quand Android
    nomme une application, et « Le partage s'est fermé. Si le fichier n'est arrivé nulle
    part, recommence… » sinon (sans « ton aventure » pour un fichier mis de côté). Un
    partage qui part sans quitter le jeu (lu dans le code du module) serait dit « fermé » :
    la phrase le laisse possible.
  - Un second appui pendant que le partage est ouvert attend le premier (`oneAtATime`) : le
    module en refuserait un second. La question pour adulte est dans cette même file : deux
    appuis rapides n'ouvrent qu'une question.
  - **Une question pour adulte avant le partage** (décision 3 du parent, 23 novembre 2026,
    [décisions](DECISIONS-2026-11-23.md)) : le partage d'Android montre les contacts récents
    (noms, photos), et « Pour les parents » n'a pas de barrière. Avant d'ouvrir le partage,
    une fenêtre demande « Combien font 17 × 9 ? » (`src/ui/adultGate.ts` ; les deux nombres,
    `GATE_FIRST` et `GATE_SECOND`, et la réponse dans `src/ui/adultGateAnswer.ts`) ;
    « Annuler », Échap ou une mauvaise réponse n'envoient rien (réponse `refused` de
    `handOver`), et la fenêtre familiale dit « Rien n'a été envoyé : il faut la bonne réponse
    d'un adulte. ». L'écran du démarrage manqué ne dit rien à côté de ses boutons, ni là ni
    ailleurs : ce sont peut-être ses règles qui manquent. Application seulement, comme
    décidé : sur le site, le fichier va au navigateur sans question, et rien ne s'ouvre vers
    d'autres personnes. Quand le clavier du téléphone prend la moitié de l'écran, la question,
    la case et les deux boutons passent sur une ligne.
  - **La question n'a besoin de rien qui puisse être en panne.** Elle n'est chargée qu'au
    moment de l'export, et le secours du démarrage manqué s'en sert aussi : elle ne doit
    charger avec elle ni les règles, ni le jeu, ni Phaser. Un premier essai importait `fill`,
    que Vite rangeait avec les règles : le secours ne rendait plus rien quand les règles
    manquaient (attaque indépendante du 23 novembre). `fill` est maintenant rangé avec les
    clés (`vite.config.ts`), et `scripts/check-dist.mjs` refuse que Capacitor, les deux
    modules ou la question chargent autre chose que le premier script, les clés et
    eux-mêmes.
- **Tenu par** `tests/hand-over.test.ts` (les deux modules ou aucun bouton, chaque réponse
  du partage, le second appui, les nombres de la question et la réponse acceptée) et la
  recette `npm run test:saves:gate` (`scripts/hygiene/adult-gate.mjs`, tâche « sauvegardes »
  de la CI), sur le paquet de l'application avec un faux côté Android : la question avant le
  partage, dans l'écran aux trois tailles, cibles de 48 px, et la moitié de la hauteur en
  paysage téléphone (le clavier) ; « Annuler », une mauvaise réponse, Échap : aucun partage,
  la phrase ; une fenêtre qui ne s'ouvre pas : rien d'envoyé, rien laissé, l'appui suivant
  marche ; deux appuis rapides, une seule question ; la bonne réponse, un seul partage et
  « le fichier est parti » ; le jeu qui ne démarre pas sans ses règles, son code et Phaser :
  le secours pose la question et partage ; sur le site, aucune question.
  Et, sur le paquet de l'application, par les recettes
  `npm run test:saves:family` et `npm run test:failure` : Chromium n'a pas de côté natif,
  donc aucun bouton d'export, la phrase, jamais « Fichier prêt ». Ces recettes prennent les
  fichiers sur le paquet du site (`dist`), que la tâche « sauvegardes » de la CI construit
  aussi.
- **Ne couvre pas** : rien de l'export n'a tourné sur Android. Le projet Android n'est pas
  compilé ici ; rien ne vérifie que l'APK porte vraiment les deux modules
  (`capacitor.plugins.json` n'est pas suivi) : sans eux, l'application montre la phrase et
  aucun bouton ; côté natif, les deux modules se chargent à chaque démarrage (le partage y
  inscrit un récepteur protégé par un nonce), et le module des fichiers apporte le premier
  code Kotlin de l'APK, dont la taille n'est pas mesurée ; des copies du fichier (une
  par sorte : l'aventure, chaque joueur du secours, le fichier mis de côté) restent dans le
  cache de l'application tant qu'Android ne le vide pas ; le jeu ne les efface jamais ; le titre du partage est « Share » en anglais sur Android 7 à 9 ; le partage, l'écriture dans le cache, le geste « retour » pendant le partage,
  un fichier envoyé dans Drive puis repris après désinstallation : tout reste à essayer sur
  le build 65. L'import, lui, marche dans l'application (essai du parent, build 64). La
  question pour adulte arrête un petit enfant, pas un grand qui sait ses tables : elle
  ralentit, elle ne protège pas. Le vrai clavier du téléphone (chiffres seuls, touche
  Entrée) n'est que simulé par une page moins haute. Le geste « retour » d'Android pendant
  la question n'est pas vu : l'application ne le traite pas (pas de module `@capacitor/app`) ;
  rien n'est envoyé, mais la phrase n'est pas prouvée. Si le fichier de la question n'arrive
  pas une fois, le navigateur s'en souvient : « impossible » à chaque export jusqu'au
  redémarrage de l'application. Une fenêtre retirée de la page sans être fermée laisserait
  l'export en attente ; aucun code ne le fait. Le site porte les règles de style de la
  question et ses mots anglais (dans le premier style et le fichier de l'anglais), pas son
  code. Sur un téléphone, la fenêtre familiale est plus haute que l'écran : après un export
  ou un import, la phrase est amenée à l'écran ; après le choix d'un fichier, « Remplacer »
  vient en bas de l'écran avec l'aperçu au-dessus (la phrase « Vérifie cet aperçu » reste
  en dessous ; tout ne tient pas en 360 px). Tenu par `test:saves:gate` et
  `test:saves:family`. Un aperçu très long (huit carnets aux noms longs et larges) cache
  encore le haut du résumé sur un téléphone.

## Copies de secours de la sauvegarde — 22 novembre 2026

Il n'existait qu'une copie du fichier familial : une sauvegarde valide mais fausse (des
étoiles perdues par un défaut, un fichier importé par erreur) remplaçait la bonne pour
toujours ([analyse](ANALYSE-2026-11-22.md), S4). Une première réponse, une seule copie gardée
par les étoiles, laissait trois trous (revue du 22 novembre). Il y a maintenant **deux copies,
deux rôles**, chacune sous sa clé du joueur (`src/storageKeys.ts`, dans `PLAYER_KEYS` :
supprimer un joueur les supprime). Le jeu ne les lit jamais de lui-même.

- **`family-before-import` : l'aventure qu'un import remplace.** Avant chaque import, le jeu
  garde l'aventure en place telle que l'export la donnerait à cet instant, donc avec
  l'expédition, le voyage à finir et les records (`applyFamily` dans `src/boot/familyFile.ts`). Si
  l'appareil refuse cette copie, l'import est refusé et rien n'a changé ; si l'import échoue
  ensuite, la copie est remise comme elle était. Un fichier qui ramène l'aventure en place,
  sans rien d'autre, ne touche pas la copie (`replacesNothing`, qui relit les extras du
  fichier comme le jeu les relit : écrits autrement, ils sont les mêmes s'ils se lisent pareil). Les deux aventures sont
  comparées telles que le jeu les tient une fois lancé (`sameAdventure`) : un fichier plus
  ancien reçoit des missions et des carnets neufs, et le camp réécrit ce qu'il décide (le
  camp de son mode, la dernière partie de sa mission, la carrière d'une partie classique,
  le carnet d'un caprice en cours) ; un fichier de version 1 à 4 réimporté après quelques
  lancements est donc la même aventure. Un appareil qui ne garde encore aucune aventure n'a
  rien à copier. Reprendre cette copie revient à l'état d'avant l'import entier : ce que le
  fichier fautif avait apporté à côté (expédition, voyage, records) est retiré ; un texte que
  cette version ne relit pas reste en place quand la copie n'apporte rien pour lui, ou
  seulement le record d'une expédition alors que ce texte en donne encore un (la copie a été
  prise de lui, ou il a continué depuis) ; une copie qui porte plus (une expédition en cours,
  prise avant que le texte s'abîme) le remplace. Reprendre une copie est un import : ce qu'elle
  remplace est gardé à son tour.
- **`family-previous` : la sauvegarde d'un lancement d'avant.** Le fichier que le jeu trouve
  en démarrant est gardé une fois que la séance a écrit sa première sauvegarde — la
  sauvegarde d'abord, la copie ensuite : ce que l'enfant vient de faire n'attend jamais une
  copie. Lire n'ajoute rien sur l'appareil. La copie tenue ne cède pas sa place tant qu'elle
  a plus d'étoiles (`familyStars`) que le fichier trouvé, ou autant d'étoiles et plus
  d'autocollants (`familyStickers`) : les uns et les autres ne font que grandir en jouant. Une
  copie avec moins d'étoiles cède, même avec plus d'autocollants : l'aventure en jeu doit
  avoir sa copie. Une copie dont un camp ne se décode plus est pesée comme le jeu la lirait ;
  une copie dont rien ne se lit n'est jamais remplacée, et la fenêtre le dit.
- **Le chemin de retour, sans fichier.** En bas de la fenêtre « Sauvegarde familiale », après
  l'import, une section repliée « Copies de secours » : chaque copie lisible dit ce qu'elle
  contient et a un seul bouton, « Regarder cette copie », qui l'envoie dans l'aperçu d'import
  habituel, avec la même confirmation. La même aventure gardée deux fois n'est offerte
  qu'une fois, par la copie qui porte le plus. Rien ne sort de l'appareil : cela marche aussi dans
  l'application. Un texte mis de côté que cette version lit est offert de la même façon ; un
  texte qu'elle ne lit pas est seulement signalé, et remis en fichier sur le site, avec sa
  propre phrase (jamais « prêt pour reprendre »). La fenêtre s'ouvre sur son titre.
- **Tenu par** `tests/family-copies.test.ts`, `tests/family-previous.test.ts` et la recette
  `npm run test:saves:family`, sur les deux paquets : un fichier plus étoilé importé par
  erreur, l'aventure remplacée gardée avec son expédition, ses records et son voyage,
  reprise d'un appui, puis ce retour défait à son tour ; la même aventure offerte une fois ;
  le même fichier réimporté qui laisse la copie ; le retour qui retire ce que le fichier
  fautif avait apporté ; l'import refusé quand l'appareil refuse la copie ; un fichier de
  version 4 réimporté après deux lancements ; la copie d'un lancement reprise sans toucher
  à l'expédition, au voyage ni aux records ; un voyage illisible gardé par l'import et par
  le retour. Deux relectures indépendantes ont attaqué le lot avant sa fusion : leurs points
  à corriger sont repris, sauf le dernier, écrit ci-dessous.
- **Ne protège pas** : un camp perdu ou remis à zéro avec les mêmes étoiles et les mêmes
  autocollants, vu après le lancement suivant ; une aventure remplacée exprès par une autre
  qui a autant d'étoiles et moins d'autocollants, puis qui perd des étoiles : la copie du
  lancement reste sur l'ancienne, la nouvelle n'est nulle part (faire suivre la copie
  après chaque import perdrait au contraire l'enfant après deux imports par erreur) ; deux imports par erreur de suite (seule
  l'aventure d'avant le dernier est gardée) ; deux fenêtres du site ouvertes à la fois (la
  copie est ce que tient la fenêtre qui importe) ; un extra écrit par une version plus
  récente, que celle-ci ne relit pas, n'est dans aucune copie (il n'est pas non plus effacé) ;
  deux versions du jeu sur le même stockage (onglet resté sur l'ancienne version, retour en
  arrière) : reprendre une copie peut alors laisser un record d'expédition plus bas que celui
  de la copie, ou perdre l'expédition de l'autre version si elle n'a encore gagné aucune
  bataille ; écrire la copie à la place perdrait l'expédition de l'autre version (sixième
  attaque, 23 novembre) ; l'expédition, le voyage et les records en dehors
  d'un import ; **rien, si le téléphone est perdu, l'application désinstallée ou ses données
  effacées** : toutes les copies sont dans le même stockage que la sauvegarde. Seul un
  fichier exporté met une aventure à l'abri.

La politique de confidentialité dit que les parties sauvegardées restent sur l'appareil et
qu'un profil supprimé l'est avec ses données : c'est toujours vrai. Ce qui change pour une
famille : importer par-dessus une aventure ne la retire plus de l'appareil tout de suite ;
elle y reste jusqu'à l'import suivant. Au parent de dire s'il veut une phrase là-dessus.

## Fichier familial : garder ce qui se lit — 22 novembre 2026

Le fichier familial était tout ou rien : un seul nombre faux dans son camp le faisait refuser
en entier ([analyse](ANALYSE-2026-11-22.md), S3). Mesuré sur l'appareil figé d'un testeur du
build 63 dont le camp est abîmé : les étoiles des missions passaient de 3 sur 18 à 0, et les
carnets étaient perdus avec elles. Les étoiles de la grande aventure, elles, tenaient déjà :
la carrière a sa propre clé.

- Le lecteur strict (`readFamilyBackup`) ne change pas : un fichier dont un camp ne se lit pas
  reste refusé à l'import.
- Pour le fichier que l'appareil garde, et seulement après ce refus, `salvageFamilyBackup`
  (`src/familyBackup.ts`) écarte **chaque camp qui ne se décode plus, partout où il est
  écrit** : en haut du fichier, comme camp de l'aventure classique ou de la mission à
  retenter, comme camp d'un chapitre. Puis le lecteur strict relit le reste, avec toutes ses
  règles. Un camp qui se décode mais enfreint une règle du fichier reste un refus du fichier
  entier : un tel fichier ne sort pas du jeu.
- **Le camp de départ vient du même fichier, jamais d'ailleurs.** Si le camp du haut est
  écarté : le camp du mode en cours s'il se lit encore ; sinon, depuis une mission, le camp
  de l'aventure classique, et le jeu y revient ; sinon aucun. La clé `camp` de l'appareil
  n'est plus lue quand un fichier familial a été lu : elle peut porter une autre aventure.
- Un fichier avec des extras (version 6) n'est jamais sauvé ainsi : le jeu n'en garde pas, et
  ses extras seraient perdus à la sauvegarde suivante. Un fichier d'avant les missions
  (version 1) l'est comme les autres.
- Le fichier tel qu'il a été trouvé est mis de côté. Il n'y a qu'une place : un fichier refusé
  en entier la prend ; un fichier sauvé à un camp près n'en chasse pas un texte dont rien ne
  serait gardé au démarrage, qui est peut-être une aventure entière.
- La ligne d'état le dit pendant la séance (« Tes étoiles, tes missions et tes carnets sont
  bien là. Un camp n'a pas pu être relu. »), jusqu'à ce qu'un import remplace l'aventure. La
  liste « Qui joue ? » lit les étoiles comme le jeu les lira.
- **Tenu par** `tests/family-salvage.test.ts` (dix-sept tests) et la recette
  `npm run test:saves:family`, sur l'appareil figé d'un testeur du build 63, dans cinq états :
  camp du haut seul, camp abîmé partout y compris sous sa clé, en pleine mission (le retour à
  la mission reste offert, ou l'aventure classique si le camp de la mission est mort
  partout), clé `camp` d'une autre aventure, texte déjà mis de côté. Une relecture
  indépendante a rejoué 798 démarrages sauvés et douze appareils abîmés dans Chromium, dont
  six avec une vague jouée puis une relance : aucune perte trouvée.
- **Ne couvre pas** :
  - un dégât ailleurs que dans un camp (carrière, missions, carnets) : le fichier est refusé
    en entier, et ce chemin-là lit encore la clé `camp`, qui peut porter une autre aventure ;
  - un camp qui se décode mais que le fichier refuse ;
  - le camp écarté lui-même : il n'est gardé que dans le texte mis de côté, si la place est
    libre, et aucune version ne le ramène ;
  - un fichier version 6 dont un camp est mort : tout part, comme avant ;
  - les autres joueurs : leur fichier reste abîmé tant qu'ils ne jouent pas ;
  - la phrase : dix pixels en bas de l'accueil sur téléphone, une séance seulement ; « un
    camp » quand plusieurs sont morts ; dite aussi quand rien n'est perdu ;
  - des dégâts fabriqués sur des données réelles : aucun fichier réellement abîmé n'a été
    vu ; rien n'est vu sur un téléphone.
