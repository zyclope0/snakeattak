# Le livre des clairières — pilote 0.11

Le gameplay de la 0.10 est conservé et enrichi par trois véritables configurations
de terrain sur les douze vagues, deux serpents mécaniques et une refonte illustrée.
Le tableau de bord reste HTML accessible ; le terrain et les figurines sont rendus
par Phaser. Les règles n'ont pas été réintégrées dans un gros fichier HTML source.

## Direction et coût

Miniatures de bois peint, pierre moussue, forêt, papier crème et cuivre. Le titre de
site vitrine a cédé la place au plateau, à un comptoir de renforts et au carnet des
vagues. Les mêmes portraits servent dans la boutique, le guide et le jeu.

11 planches/fonds générés avec Recraft V4 Pro via Magnific, dont huit atlas de quatre
images et trois paysages : 1925 crédits de génération, 24 de détourage, 440 de mise
au format, soit **2389 crédits**. Solde observé :19604→17215. Aucun nouvel abonnement.
Détails dans [la provenance](../public/assets/illustrated/PROVENANCE.md).

Les planches comprennent tous les alliés du ZIP, dont le bébé dragon et le petit
dinosaure alliés, six variantes ennemies, roi, œuf, miel, pont, roncier, rochers,
cristal et éléments d'interface. Les sprites sont des poses fixes animées de façon
procédurale : marche, réactions, attaque et ressort. Pas d'animation dessinée image
par image ni de conversion du projet en vraie 3D.

## Variété jouable

| Clairière        | Vagues | Changements                                     |
| ---------------- | ------ | ----------------------------------------------- |
| Fougères         | 1–4    | Terrain d'apprentissage et routes connues       |
| Bosquet ambré    | 5–8    | Nouveaux rochers, serpents à rouages            |
| Vieilles pierres | 9–12   | Dernière disposition, serpents à ressort et roi |

Les trois voies et les deux jonctions tactiques restent lisibles. Les ponts traversent
un roncier à la place de la rivière ; le modèle de navigation suit les mêmes ouvertures.
Les niveaux ont de vraies collisions différentes, pas seulement une recoloration.
Vie, trésor et survivants traversent les chapitres ; seuls les placements devenus
invalides sont rapprochés de points libres. Les sauvegardes v1/v2 restent lisibles.

La plaque du serpent à rouages réduit les dégâts de42%, puis6% à mi-vie ; « Clac ! »
signale la transition. Le serpent à ressort avance lentement pendant1seconde puis
bondit pendant0,6seconde. Ces phases utilisent l'horloge qui se fige en pause.
L'IA conserve une cible quand un nouvel adversaire n'est que légèrement préférable,
mais libère les morts et garde la priorité à l'urgence du cristal.

## Validation et limites

Les tests couvrent cartes indépendantes, cache de chemins, transitions, reprises,
phases mécaniques, stabilité de cible, roi distinct, signal de plaque et nouvelle
clairière. Les scènes navigateur comprennent les quinze alliés, les trois décors,
les nouveaux ennemis, la victoire, le miel et le placement. Le catalogue de contrôle
utilise une armée préparée pour voir les images ; ce n'est pas une partie gagnée.

La composition statique du terrain avait fait tomber les callbacks d'image vers
433ms sur le navigateur cloud. Après précalcul du décor, les sondes ont montré une
médiane de16,7–33,3ms, avec p95 vers33,4ms. C'est une mesure Chromium dans cet
environnement, pas une garantie FPS sur téléphone. La restauration forcée du contexte
WebGL est testée par comparaison d'un carré de terrain avant/après : le décor reste
identique. Le test a été observé en échec avant la correction d'invalidation du cache.

L'équilibrage est mesuré par les cinq mêmes politiques sur vingt mêmes graines.
Les résultats finaux sont dans reports/final-0.11 et le complément de bilan ci-dessous.
Les stratégies à distance restent les plus sûres ; les bots ne certifient ni le plaisir
pour un enfant ni une difficulté idéale. Aucun test sur tablette physique ou Safari.

## Références consultées et décisions

- [Red Blob Games — Flow fields](https://www.redblobgames.com/pathfinding/tower-defense/) :
  calculer des trajets partagés peut aider quand beaucoup d'ennemis poursuivent un but
  commun. Pour ce petit effectif, le cache A* existant est conservé et séparé par carte.
- [Eric Johnson — Taming Spatial Queries](https://www.gameaipro.com/GameAIProOnlineEdition2021/GameAIProOnlineEdition2021_Chapter05_Taming_Spatial_Queries_Tips_for_Natural_Position_Selection.pdf) :
  la stabilité des décisions évite les changements incessants. Le seuil conservateur
  est couvert par des cas de cible proche, de mort et d'urgence du cristal.
- [Stardock — What Makes a Good Tower Defense Game](https://www.stardock.com/games/article/495008/siege-of-centauri-dev-journal-what-makes-a-good-tower-defense-game) :
  la variété est utile quand les ennemis demandent des réactions différentes. Les deux
  mécaniques et les obstacles de chapitre changent la situation en gardant des annonces.

Ces références ont guidé des choix adaptés au projet ; aucun asset de ces sources
n'a été copié. Les compétences spécialisées frontend design n'étaient pas présentes
au catalogue ; la mise en œuvre utilise TypeScript/Phaser et les skills de conception,
implémentation, diagnostic et revue réellement disponibles.

## Dernier lot de comparaison

Mêmes cinq politiques et vingt graines initiales que la 0.10, à30Hz, préparation
fixe de10secondes. Aucun PV ni ressource forcés par le banc de campagnes.

| Politique       | Victoires | Base finale moyenne | Part moyenne de combattants non mobiles au bord |
| --------------- | --------- | ------------------- | ----------------------------------------------- |
| Équilibrée      | 15/20     | 60.4/100            | 4.2 %                                           |
| Mêlée et soins  | 19/20     | 84.9/100            | 5.4 %                                           |
| Distance        | 20/20     | 98.7/100            | 0.1 %                                           |
| Unités lourdes  | 19/20     | 84.7/100            | 7.4 %                                           |
| Choix spontanés | 14/20     | 63.2/100            | 5.9 %                                           |

Total : **87 victoires, 13 défaites, zéro délai maximal atteint**.
1,768,903 pas exécutés. Les fichiers de détail sont dans reports/final-0.11.
Empreinte des TypeScript racine lors de la mesure : `874734f4459a2942c2295dda698b3ebad2f76863bdda06ea5ea7baea741285b2`.
Les premiers résultats exploratoires sont exclus de ce bilan final. Le roi reste
un cobra normal ; le dernier index de vague ne lui attribue pas la phase ressort.
