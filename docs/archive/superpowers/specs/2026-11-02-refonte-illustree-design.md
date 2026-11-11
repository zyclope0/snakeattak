# Refonte illustrée et clairières — réalisation autonome 0.11

Le créateur valide le principe de la 0.10 et autorise une refonte graphique complète,
la génération d'assets, l'amélioration autonome des IA, de nouveaux niveaux et des
serpents mécaniques. Garder l'esprit familial et les unités du ZIP : dragon/dino alliés.

## Direction retenue

Miniatures de conte peintes, forêt chaleureuse, pierre moussue, bois et papier crème.
Trois passages de pierre dans un roncier vivant remplacent visuellement la rivière.
Les chemins sont bordés de pierres irrégulières, les routes logiques restent lisibles.
Pas de gros bloc de titre de site vitrine, pas de grille de cartes génériques à halos.
Le plateau domine l'écran ; commandes lisibles au tactile, détails accessibles au besoin.
Chaque unité et ennemi utilise une vraie image générée cohérente, avec animation
procédurale discrète. Aucune prétention à des sprites animés image par image.

## Approches écartées

Une vidéo de fond gêne les routes et alourdit la partie ; une conversion 3D changerait
la nature du projet. Une simple recoloration ne répond pas à la demande. On retient
assets raster et atlas bornés, interface HTML/CSS accessible, moteur Phaser existant.

## Périmètre jouable

- Même départ et catalogue, autonomie, morts définitives, miel, douze vagues et roi.
- Trois clairières successives (vagues 1–4, 5–8, 9–12) avec terrains et positions de
  rochers différentes. Conserver trois voies et leurs jonctions, pas de passage invisible.
- Transition sans perte : déplacer seulement les positions et points de retour devenus
  invalides vers des cases libres. Conserver vie, or, survivants, graine et sauvegardes.
- Deux serpents mécaniques lisibles : clockwork à plaque qui se brise à mi-vie ; spring
  qui avance par impulsions. Introduits progressivement et annoncés avant leur arrivée.
- IA alliée : éviter les oscillations inutiles de cibles, répartir les interventions.
  IA ennemie : couverture prenant mieux en compte les portées et vraies forces vivantes.
- Pas de réseau ni de service payant pendant le jeu, pas de nouveaux comptes.

## Frontières d'implémentation

Engine : src/game.ts, ai.ts, defenders.ts, enemies.ts, waves.ts, navigation.ts,
placement.ts, checkpoints.ts, nouveau levels.ts et tests associés. API de niveau :
Game.level getter expose {id,name,subtitle,palette,rocks}; levels.ts exporte
levelForWave(wave:number). palette peut être ignorée par le moteur, le rendu la lit.
Toutes les opérations de navigation prennent le même niveau explicitement ; aucun
état global mutable de carte. Garder les appels historiques utilisables par défaut.

UI : index.html et style.css gardent les identifiants et commandes existants ;
ui/controls.ts, unitGuide.ts, coaching.ts adaptables. Les portraits passent par
src/art.ts : portraitStyle(kind:Kind):string, portraitClass='portrait'. Elle retourne
les déclarations CSS d'un fond d'atlas. L'interface ne simule aucune règle.

Art/rendu : src/art.ts, assets, render/*.ts. Exports art.ts : ALLY_ART, ENEMY_ART
mapping key->{texture:string,frame:number}, ART_SHEETS tableau
{key:string,url:string,frameWidth:number,frameHeight:number}. Textures importées Vite.
Le rendu se reconstruit au changement de niveau, conserve les vrais repères de collision.
Le roi, œufs, miel et camp reçoivent des assets et silhouettes distinctes.

## Génération, preuves et livraison

Budget initial annoncé ~2500 crédits Magnific, plafond de travail de cette passe.
Génération test avant série, inspection visuelle, provenance et coûts consignés.
Vérifier transparence, mise en cache, tailles et mémoire ; pas de fichier HTML grossi
comme source. Export portable demeure facultatif et distinct du site normal.
Tests natifs, navigateurs et 100 campagnes de comparaison ; signaler tout déséquilibre
résiduel. Les bots ne mesurent pas le plaisir ni une tablette réelle. Aucun travail
planifié pour plus tard n'est promis comme exécuté hors session.
