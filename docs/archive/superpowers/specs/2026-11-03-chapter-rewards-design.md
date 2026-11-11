# Bonus de chapitre — 0.17

## Intention et périmètre

Le parent approuve la prochaine passe proposée : après les vagues 4 et 8, trois
propositions et un seul bonus choisi. Donner envie de rejouer, préserver le combat
automatique et les unités des enfants. Cette livraison porte sur ces choix ; les
modes de difficulté et l'hébergement restent des étapes distinctes. L'autonomie
et les choix techniques ont été confiés dans la conversation ; aucune nouvelle
validation intermédiaire requise.

## Choix retenus

Garder Phaser/TypeScript/Vite, moteur sans navigateur, aucune dépendance nouvelle.
Approches : trois cartes fixes seraient simples mais répétitives ; une boutique
permanente compliquerait les combats ; retenir deux offres de chapitre tirées de
façon déterministe, séparées du RNG du combat. Toujours un renfort et deux cartes
parmi miel, protection et pièces. Le renfort varie entre bouclier, ninja et raptor,
tous déjà débloqués. Réutiliser les portraits existants.

Offres : un renfort offert à placer normalement (bon d'achat), +4 s de durée du
miel pour le reste de la campagne (deux choix au maximum), protection du cristal
absorbant 18 points de dégâts ordinaires (maximum 36 ; le roi l'ignore et reste
fatal s'il entre), ou 100 pièces. Chiffres modestes proposés par le développeur,
à vérifier par simulations, sans retoucher les règles ni la difficulté 0.16.

Le bonus est proposé uniquement après une vraie fin de vague4/8. On peut choisir
une carte ou continuer sans bonus. Tant que l'offre est en attente, le moteur
refuse la vague suivante. Un bon de renfort n'est consommé qu'à un placement
légal ; le joueur peut le garder. Aucun soldat mort n'est ressuscité. Pas d'effet
pendant une pause, un combat terminé ou une offre inexistante. Le nouveau départ
réinitialise l'ensemble. Une offre, même après recharge, ne peut être encaissée
deux fois. La protection absorbe les impacts successifs, sans dépasser sa réserve.

## Sauvegarde et interface

Campv3, même clé locale ; lecture des v1/v2 conservée. Une ancienne sauvegarde
exactement à4/8 reçoit l'offre correspondante ; pas de bonus rétroactif pour les
chapitres passés. Conserver graine des offres, choix, bons utilisés et protection
restante. Refuser l'état incohérent plutôt que réparer silencieusement.

Panneau dans le flux du plateau, seulement aux deux transitions : titre court,
trois boutons illustrés, effet précis et continuer sans bonus. Pas de nouvelle
fenêtre modale. Focus clavier à l'apparition sauf dialogue existant ou pause ;
aucune capture de focus répétée. Après un renfort, sélectionner son placement ;
après un autre choix, revenir au lancement de vague. Prix offert visible dans le
catalogue et indicateurs compacts de protection, miel et renforts encore offerts.
Interface320px, clavier, mouvements réduits, sans requête tierce.

## Validation

Tests des deux jalons, choix uniques, entrées invalides, pause, RNG indépendant,
bons non consommés par refus de placement, durée réelle du miel et protection
réelle contre serpent/boss. Recharger avant/après choix/placement et vérifier
v1/v2/corruption. Vérifier web et HTML autonome sur navigateur. Comparer les bots
avec renoncement explicite et plusieurs politiques de bonus, sur graines neuves,
sans or ni vie ajoutés hors bonus publics. Ne pas prétendre mesurer le plaisir.
