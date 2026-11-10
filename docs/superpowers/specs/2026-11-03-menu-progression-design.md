# Menu, équipes et progression0.18

## Intention

Demande explicite : étudier chaque jeu cité, adapter au maximum une mécanique
compatible par jeu, écarter les incompatibilités, réaliser menu et progression.
L'autonomie et les choix techniques ont déjà été délégués par le parent. Garder
Phaser/TypeScript/Vite, la DA forêt/ivoire/jade et les portraits existants, les
soldats autonomes,12vagues,3voies, la mort définitive au combat et le roi fatal.
Aucun nouveau serveur, achat intégré, énergie ou nouveau personnage. Les unités
restent accessibles selon leurs vagues habituelles ; pas de grind obligatoire.

## Approches

Écarter la copie de tous les systèmes mobiles (trop de monnaies et microgestion).
Un simple écran de liens ne ferait pas une progression. Retenir une progression
locale en 3 chapitres de 4 vagues, avec meilleurs scores et véritables camps de reprise,
et six adaptations modestes. Sources et analyse dans docs/INSPIRATIONS-0.18.md.
RushRoyale : fusion écartée car disparition/transformation d'alliés peu adaptée.

## Contrat moteur

Créer campaignRules.ts : CampaignState={training:'none'|'force'|'guard',
chapterMin:[number,number,number],chapterStars:[number,number,number]} ; freshCampaign,
readCampaign(raw:unknown,wave:number):CampaignState|null, chapterIndex(wave),
chapterStars(minBase) renvoie1/2/3 pour <60/60..89/90..100. Legacy1/2/3 : créditer
1étoile par chapitre déjà terminé, min du chapitre actuel initialisé à base.
Game.campaign readonlystate ; Game.trainHero(path:'force'|'guard'):boolean, coût 90,
uniquement preparing, nonpaused, aprèswave4, héros vivant et aucun entraînement.
force = dégâts héros×1.15 ; guard = dégâts ordinaires/tirs reçus par héros×0.85 ;
jamais modifier les réactions exactes de mort2/3. Choix fixé jusqu'à nouvellepartie.
Game.encourage():boolean ; encouragementUsed=false/remaining=0 ; une fois parvague
fighting, nonpaused, au moins un combattant vivant,8s. Cadence de frappe alliée×0.85,
pas les soins ni les ennemis. Décrément vraiehorloge, pause stricte, clearfincombat,
resetstartWave. Rien ne change sans activation. Pas de résurrection.
ChapterMin mis à jour après impacts, initialise à base au début de1/5/9 ; score
à fin4/8/12. Réparation ne gomme pas le minimum. Campv4 persiste campaign, litv1/2/3,
préserve rewardsv3. Temporisations encouragement horscamp, comme les autres timers.

## Contrat progression et équipes

Créer roster.ts : Roster=Kind[],8recrutables uniques, ni hero ni snake ; presets
équilibrée/dinos/vive. Aucun coût ou unité gratuite ; ces8favoris servent de raccourcis.
Créer progression.ts : CareerState={version:1,bestStars:[n,n,n],rosters:[Roster,Roster,Roster],
activeRoster:0|1|2,chapterCamps:[string|null,string|null]}.
createCareer(storage?:Pick<Storage,'getItem'|'setItem'>) renvoie {state,status,sync(game),
setRoster(slot:number,roster:Kind[]):boolean,activateRoster(slot:number):boolean,
chapterGame(chapter:1|2):Game|null}. Storage key conquete-serpents:progress:v1.
Beststars = maxima idempotents, maximum 9. Synchroniser résultats Game et capturer
camp de débutchapitre après4/8 tantque rewards.pending, une fois par seed/chapter.
Snapshots au plus 100000 caractères chacun, profileraw<=250000. Valider bornes,
rosters et decodeCheckpoint des camps, erreurstorage sans planter ou pertecamp.
Chapitres rejouables seulement si vrai snapshot disponible. Une reprise d'ancien
camp milieu dechapitre continue ce camp, sans inventer d'armée ou argent.

## Contrat UI

Session.screen:'home'|'battle' défautbattle poursimulation/fixtures ; advance ne
consomme aucune horloge quandhome. Session.useGame(game) réinitialise sélection,
vitesse, accumulation. Main lancehome, Gamepréchargé et conservé sans avancer.
Menuhors#app, poursuivre/nouvelleaventure/équipes/fiches, carte3chapitres, beststars.
Nouvelleaventure et repriseancienchapitre demandent confirmation de remplacement
si camp engagé ; rejouer ne remet pas les scores àzéro. Menu au milieu d'un combat
le fige ; continuer reprend le même combat. Reload garde le derniercamp préparé.
Surretourbattle rafraîchir la taillePhaser aprèsDOMvisible et conserver inputBounds.
3slotsd'équipes éditables,8favorisvalides ; modifications bloquées encombat. Catalogue
complet resteaccessible. Barre recrutement rapide réutilise portraits, vraisprix,
verrousvagues, bons gratuits et placementnormal. Pas de main aléatoire ni PvP.
Entraînement dans details de préparation, encouragement prèsdu miel. Aperçu de
portée initiale auplacement basé sur kinds.range, point légal/suggestions ; couleur
et texte distincts pourcontact/tir/soin, déplacement ensuiteautonome.

## Qualité

Sauvegardes et effets testés rouge→vert. Menu clavier/tactile320px, focus et pause
respectés, confirmations, reload, équipes, vraiesreprises/étoiles, web etportable.
Tests existants gardés : les tests qui ciblent le plateau entrent via vrais boutons.
Comparer campagnes sansnouveauxpouvoirs à 0.17 et testerles deuxbranches+boost, tous
profils et grainesneuves. Pas de génération payante requise. LivraisonZIP+sources,
aperçus et analyse sourcée, liensHTTPS revérifiés. Pas de déploiement dans ce lot.
