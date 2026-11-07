# Défense vivante — proposition mise en œuvre en autonomie

## But et contraintes

Répondre au regroupement au pont et à la répétition constatés par le créateur.
Conserver trois voies interconnectées, soldats autonomes, morts définitives, œufs,
catalogue original, moteur local modulaire, graphismes actuels et douze vagues.
Aucun asset payant dans cette passe. Le plaisir et la difficulté pour des enfants
restent à valider en jouant, même après les mesures automatisées.

## Approches considérées

1. Changer seulement PV/prix : ne corrige pas la ruée collective vers le pont.
2. Imposer des cases fixes ou des ordres manuels : modifie le principe d'autonomie.
3. **Retenir le lieu de placement et différencier les rôles**, puis varier les tempos :
   choix de réalisation proposé par Codex dans le cadre de l'autonomie déjà demandée.

## Comportements

- Chaque allié garde un point de défense homeX/homeY issu de son placement.
- Gardiens : priorité à leur secteur (±108 en y), déplacement limité en avant
  (96 unités depuis homeX), retour à leur point après l'engagement.
- Tireurs : restent autour du placement (48 unités en avant), riposte possible
  contre un adversaire proche ; ne poursuivent pas les serpents de l'autre rive.
- Ninjas/cavaliers : renforts mobiles sur les trois voies, seulement contre les
  intrus dans le camp, puis retour au placement quand la menace disparaît.
- Soigneurs : alliés blessés de proximité, dans un rayon de 320 du placement,
  retour au placement après les soins. Pas de résurrection.
- Tout allié peut répondre à un ennemi au contact ; menace près du cristal
  (x ≥ 900) prioritaire même hors secteur. Aucun ordre manuel supplémentaire.
- Placement et secteur expliqués dans l'aide ; point d'ancrage discret pendant
  la préparation et aperçu de secteur lors du placement.
- Départ réparti : une massue sur la voie haute, une basse, héros au centre.

## Variété

Réutiliser les ennemis et le miel existants : ruées en petits groupes (3/9),
arrivées alternées sur les trois voies (2/6/10), vagues à éclosions décalées (4/8).
Les descriptions doivent annoncer la mécanique réelle, sans surprise punitive.
Les jonctions conservent l'IA qui cherche les voies faibles. Pas de nouveau pouvoir,
compte, serveur ou monnaie. Garder la progression des déblocages et le boss final.

## Sauvegarde et mesures

Versionner le format en v2 tout en lisant les sauvegardes v1 : homeX vient alors
au mieux de la position sauvegardée, homeY est conservé. Garder la même clé locale.
Comparer les 100 mêmes couples politique/graine, mesurer le regroupement des
combattants non mobiles au bord (x ≤ 636), les victimes avant le camp, pertes,
passages et durée. Des défaites sont attendues ; aucun blocage n'est acceptable.
Ne pas chercher artificiellement un taux de victoire précis pour des bots.

## Réglages retenus après mesure

Contact renforcé, ninja à 155 PV/40 dégâts, archer à 150 pièces/15 dégâts ; cracheur
à portée 220 avec priorité aux tireurs ; progression des dégâts 7+floor(vague×0,9),
roi ×2. Ces valeurs sont des choix de réalisation à valider en famille, pas une preuve
d’équilibre définitif. Les médecines ne réparent pas le bois. Les domiciles migrés
sont rapprochés vers un point légal si l’approximation tombe dans un obstacle.
