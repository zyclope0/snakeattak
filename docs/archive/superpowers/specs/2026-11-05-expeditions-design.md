# Expéditions 0.21 — conception approuvée dans la conversation

Le parent autorise la réalisation le 5 novembre après avoir choisi des détachements
neufs à budget défini. Six missions jouables d'abord, objectif campagne 18 ; pas
18 cartes factices. L'aventure classique douze vagues et ses sauvegardes restent.

## Expérience

Six missions de la clairière : refuge, trois ponts, course des vifs, premières
coquilles, dragon et sonnette, carrefour des fougères. Chacune a 3–4 vagues,
un budget défini, une victoire et 0–3 étoiles. Une victoire ouvre la suivante,
sans grind ni puissance permanente. Chaque mission part avec un nouveau héros et
deux nouveaux massues, pas les morts de l'expédition précédente. Blessures,
survivants et or restent entre ses vagues, jamais entre missions.

Une configuration associe terrain (3 dispositions), attaque (3 plans) et couvée
(répartie/concentrée). Elle est annoncée avant achats. Nouvelle expédition évite
la configuration précédente, réessayer conserve configuration ET graine initiale.
Les variantes sont bornées et reproductibles, pas une génération infinie promise.
Terrain : routes courbes et jonctions modifiées réellement dans simulation et
rendu, trois voies toujours accessibles, obstacles légaux et pas de téléportation.
Les ennemis autorisés viennent du rang de mission, aucun ennemi précoce arbitraire.

## Architecture

MissionRun immuable et validé ; définitions séparées des vagues classiques.
Game reçoit un contexte optionnel de mission, conserve son API classique.
Checkpoint v5 porte configuration, minimum cristal et état de simulation ;
v1–v4 classiques lisibles. Une progression d'expédition séparée des étoiles
classiques est incluse dans une enveloppe familiale versionnée sans perdre les
anciens profils. Camp classique protégé lorsque l'on change de mode.
UI : carte de six missions, aperçu terrain/menaces/couvée/budget, lancer,
réessayer identique, nouvelle variante, retour carte après victoire et prochaine
mission. Pas de nouveau contrôle manuel de soldats.

## Interfaces retenues

- missions.ts : MissionId, MissionRun, MISSIONS, missionById(id),
  createMissionRun(id,seed,previous?), readMissionRun(raw), missionWave(run,wave).
- MissionRun : { missionId, seed, layout:0|1|2, assault:'balanced'|'rush'|'escort',
  nest:'spread'|'clustered' }. MissionDefinition : id,name,objective,waves
  (rangs classiques),budget,unlockRank.
- Game : constructor(seed?,tuning?,mission?:MissionRun), readonly mission,
  totalWaves, difficultyWave, briefing, missionMinBase, missionStars.
- levels.ts : missionLevel(layout:0|1|2):Level ; Level.id devient string,
  Level.layout optionnel : {junctions:readonly[number,number],curves:readonly[number,number,number]}.
- routes.ts : routeJunctions(level):readonly[number,number] ; junctionPoint et
  junctionRoad acceptent level optionnel. Le moteur utilise ces valeurs.
- missionProgress.ts : MissionProgress validée, createMissionProgress initial,
  readMissionProgress, synchronisation des vraies victoires, dernière configuration,
  reprise/classicCamp séparés. API précise arrêtée par l'agent et communiquée.

## Android et backend

Conserver TypeScript/Phaser/Vite et simulation locale. Ajouter une enveloppe
Capacitor Android synchronisable si compatible avec l'environnement ; pas de
publication Play ni APK signé prétendu. AppId provisoire com.conqueteserpents.famille.
Aucun serveur de gameplay, compte interne, API payante ou collecte nouvelle.
Architecture et limites Android documentées sur sources officielles actuelles.

## Vérification

Tests RED/GREEN des variantes, non-répétition, victoire réelle, reprise, ancien
format, nouvelles armées, géométrie et blocages ; navigateur tactile320/390/844,
web et portable, import/export. Simulations multiples sur six missions et
plusieurs politiques, avec temps/erreurs/pertes/écart variantes, sans prétendre
prouver le plaisir des enfants. Revue indépendante et conseil final. Publication
exacte sur Site privé existant, archives téléchargeables vérifiées.
