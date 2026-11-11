# Serpent Defender — brief de refonte

Transcription du PDF fourni le 7 novembre 2026. Les propositions non incluses dans
le lot validé restent à discuter; voir le plan et le bilan 0.23.

Nov 7, 2026 · ​@Yannick

Mode d'emploi
Ce brief se donne à Claude Code un lot à la fois, jamais en bloc.

1.  Retire ou modifie les idées qui ne te plaisent pas : ce sont des propositions.
2.  Exporte le doc en Markdown et place-le dans le repo, par exemple docs/brief-
    refonte.md .
3.  Lance Claude Code en mode plan : « Lis docs/brief-refonte.md. Fais l'état des lieux
    demandé, puis propose un plan pour le Lot 1 seulement. »
4.  Valide le plan, laisse-le coder, teste sur PC et sur Android, puis passe au lot suivant.

Contexte et contraintes
« La Conquête des Serpents » est un tower defense pour un enfant. Des serpents sortent
des antres à gauche et suivent 3 voies jusqu'au refuge à droite. Les assets sont réussis ; le
problème est leur mise en scène et le manque de variété entre deux parties.

       Stack : Phaser 3 + TypeScript, Vite. Rendu WebGL avec repli Canvas.
       UI : menus, catalogue et fenêtres en HTML/CSS, au-dessus du canvas.
       Règles : combats, IA, soins, vagues, progression et sauvegardes en TypeScript,
       séparées du rendu. Cette séparation reste intacte : toute nouvelle règle va côté
       règles, le rendu ne fait que lire l'état.
       Cible Android via Capacitor : chaque changement doit rester fluide sur un téléphone
       moyen.
       Public enfant : moins de texte, plus d'icônes, rien de punitif.
       Sauvegardes : les anciennes doivent continuer à se charger (migration si le format
       change).

État des lieux avant de coder. L'agent répond d'abord à ces questions, sans rien modifier :

       Où et comment les 3 voies sont-elles définies (coordonnées en dur, données, courbes
       Phaser) ?
       Comment le décor est-il posé (image de fond, sprites placés à la main, boucle) ?
       Où le code tire-t-il de l'aléatoire ( Math.random dans les règles ?) ?
       Quelle version exacte de Phaser 3 ? Les effets preFX / postFX demandent la 3.60 ou
       plus.
       Quel est le format des sauvegardes, et porte-t-il un numéro de version ?

Lot 1 — Une carte lisible
Objectif : le décor devient le terrain, et on voit d'un coup d'œil où passent les serpents et
où poser ses alliés.

Diagnostic de l'écran actuel (mission « Les trois ponts ») :

       Un aplat vert semi-transparent à bords nets recouvre le décor : la zone de jeu
       ressemble à un rectangle collé.
       Les répétitions se voient : 3 grottes identiques, 3 chemins de même forme, une
       colonne d'environ 5 arbres-ponts superposés, des rangées de poteaux identiques.
       Rien n'indique les emplacements de pose ni le rôle des passages entre voies.
       Les échelles sont incohérentes : les arbres écrasent les unités.
       Le contraste est faible : chemins beige sur fond beige-vert, les serpents risquent de
       s'y perdre.
       Il y a trop de texte : « Le carrefour des fougères » apparaît 3 fois, les étiquettes à
       empattements sont illisibles sur la texture, et grottes et refuge sont coupés par le
       cadre.

Changements demandés :

1.  Supprimer l'aplat. Le décor reste visible partout. Les chemins sont des tracés
    texturés au bord adouci (liseré ou ombre intérieure), pas des bandes posées dessus.
2.  Densité par zones. Décor dense en bordure, comme un cadre naturel, clairsemé près
    des chemins, rien sur les chemins. Placement par échantillonnage de Poisson
    (distance minimale entre objets), avec la graine de la partie.
3.  Varier chaque instance. flipX aléatoire, échelle 0,85 à 1,15, rotation de ±4°, légère
    teinte. Jamais deux objets identiques côte à côte. Diviser par deux le nombre d'arbres
    et de poteaux.
4.  Un pont = un sprite. Un seul pont par croisement entre deux voies, posé là où elles se
    croisent. Supprimer la pile d'arbres-ponts.
5.  Emplacements de pose visibles. Petites clairières ou souches sur le terrain, avec un
    halo quand une unité est sélectionnée. Les unités ne se posent que là.
6.  Une table d'échelles unique. Par exemple unité = 1, serpent = 0,8 à 1,5, rocher = 0,6 à 1,
    arbre de décor = 2 à 3, refuge = 4. Unités et serpents restent les éléments les plus
    lisibles.
7.  Acteurs lisibles. Ombre ellipse au sol sous chaque unité et serpent, léger contour clair
    sur les alliés. Une couleur réservée aux serpents (rouge-orangé) qu'aucun décor
    n'utilise.
8.  Profondeur. setDepth(y) pour tous les objets debout : ce qui est plus bas à l'écran
    passe devant.

9.  Texte hors de la carte. Retirer titres et étiquettes de la carte. Chaque voie est repérée
    par une icône ou une couleur à la sortie de son antre. Fusionner le bandeau de mission
    et le titre du panneau en un seul titre.
10. Rien de coupé. Grottes et refuge entièrement dans le cadre, avec une marge.

Lot 2 — Performance sur Android
Objectif : la nouvelle carte tourne à 60 images/s, et jamais sous 30, sur un téléphone
moyen via Capacitor.

       Cuire le décor immobile. Après génération, dessiner le sol et le décor immobile dans
       une RenderTexture , puis détruire ces sprites. Ne garder en sprites que ce qui bouge
       ou doit passer devant les acteurs (premier plan).
       Atlas de textures. Regrouper les assets dans un ou deux atlas (TexturePacker ou free-
       tex-packer) pour limiter les changements de texture.
       Effets optionnels. Les preFX / postFX de Phaser (vignette, lueur) ne fonctionnent
       qu'en WebGL : les activer seulement si renderer.type === Phaser.WEBGL , avec un
       réglage « effets réduits ».
       Pools d'objets. Serpents, projectiles et effets réutilisés via des Group , plutôt que
       créés et détruits à chaque vague.
       Mesurer avant et après sur un vrai téléphone, avec un compteur d'images/s visible en
       mode développement.

Lot 3 — Chaque partie est différente
Objectif : deux parties de la même mission ne se jouent pas pareil, sans perdre en lisibilité.
Tout ce lot vit côté règles ; le rendu se contente d'afficher.

3.1 Aléatoire à graine. Un seul générateur à graine, écrit côté règles (un petit PRNG type
mulberry32) pour ne pas dépendre de Phaser. Math.random est interdit dans les règles.
La graine s'affiche en fin de partie, sous une forme lisible (« FOUGÈRE-42 »), pour rejouer
une partie qu'on a aimée.

3.2 Le tirage du conteur. Avant la mission, l'enfant tire 3 cartes et peut en relancer une
seule :

       un lieu : variante de terrain (marais, clairière, rivière…) ;
       un événement : pluie (serpents ralentis), nuit (portée réduite, lucioles), crue (un pont
       fermé à la vague 2), vent (projectiles déviés) ;
       un serpent chef : le boss de la dernière vague.

Les cartes sont des données (JSON ou TS), faciles à enrichir.

3.3 Renforts en draft. Au départ, 4 alliés tirés parmi ceux débloqués, dont au moins un de
mêlée et un à distance. Après chaque vague, l'enfant choisit 1 nouvel allié parmi 3. Le
catalogue complet reste consultable dans « Fiches ».

3.4 Les ponts dévient. Un pont relie deux voies. Un serpent qui arrive à un pont ouvert
peut changer de voie, selon une règle simple liée à son type (voie la moins défendue, ou au
hasard). L'enfant lève ou baisse un pont d'un tap, avec un court temps de recharge.

3.5 Carte par segments. 8 à 12 segments de chemin dessinés à la main : droit, virage,
double virage, fourche, gué. Le générateur en enchaîne 4 à 6 par voie selon la graine, puis
place 1 à 3 ponts et les emplacements de pose. Garde-fous : longueurs des voies à ±15 %
l'une de l'autre, au moins 3 emplacements par voie.

3.6 Serpents à comportements. Chaque mission mélange 2 ou 3 types :

       le pondeur laisse des œufs qui éclosent (déjà présent) ;
       le creuseur disparaît sous terre et ressort sur une autre voie ;
       le géant est lent avec beaucoup de vie ;
       le rapide a peu de vie et file.

Un type = des paramètres + une liste de comportements, pas une classe par serpent.

Modèle de données proposé
Un point de départ : l'agent l'adapte aux types existants plutôt que de tout remplacer. La
génération produit ces données côté règles ; le rendu les lit et ne décide rien.

type LaneId = 'haut' | 'centre' | 'bas';
interface Vec2 { x: number; y: number }

interface MissionSetup {
seed: string; // ex. "FOUGERE-42"
place: string; // carte lieu tirée
event: string; // carte événement tirée
boss: string; // type de serpent chef
startingAllies: string[]; // draft initial (4)
}

interface MapDefinition {
seed: string;
lanes: Lane[]; // toujours 3
bridges: Bridge[];
slots: PlacementSlot[];
decor: DecorItem[]; // généré une fois, puis cuit en RenderTexture
}

interface Lane { id: LaneId; segments: string[]; points: Vec2[] }

interface Bridge {
id: string;
laneA: LaneId; atA: number; // progression 0..1 sur la voie A
laneB: LaneId; atB: number;
open: boolean;
}

interface PlacementSlot { id: string; lane: LaneId; pos: Vec2 }

interface DecorItem {
asset: string; pos: Vec2;
scale: number; flipX: boolean; angle: number; tint?: number;
foreground: boolean; // true = reste un sprite, trié par y
}

interface SnakeType {
id: string; speed: number; hp: number;
behaviors: Array<'lay-eggs' | 'burrow' | 'switch-at-bridge'>;
}

Ordre de travail et critères d'acceptation
Un lot = un commit ou une branche testable. On ne passe au suivant qu'après validation
sur PC et sur Android.

1.  État des lieux (section Contexte) : réponse écrite, aucun code modifié.
2.  Lot 1 sur la mission « Les trois ponts » seulement, avec captures avant/après.
3.  Lot 2, avec mesures d'images/s avant/après sur téléphone.
4.  Lot 3 dans cet ordre : 3.1 graine, 3.3 draft, 3.2 conteur, 3.4 ponts, 3.6 serpents, 3.5
    segments (le plus long).
5.  Étendre le Lot 1 aux autres missions.

Les points 3.1 à 3.3 ne touchent pas au rendu : ils peuvent passer avant le Lot 1 si tu veux
du neuf rapidement.

Critères d'acceptation :

       Même graine = même carte, même tirage, mêmes vagues (test automatique côté
       règles).
       Aucun Math.random dans le code des règles.
       Les anciennes sauvegardes se chargent.

       Aucun texte sur la carte hormis les chiffres de jeu (vie du refuge, pièces).
       Jamais deux objets de décor identiques (même asset, même échelle, même sens)
       côte à côte.
       Au moins 30 images/s sur le téléphone de test pendant une vague chargée.
