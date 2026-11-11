# Chemins vivants et combats lisibles — 0.11.1

Demande : corriger le sens des monstres, les superpositions et les routes trop droites et peu visibles. Autonomie déjà accordée ; réalisation dans le projet TypeScript/Phaser existant.

Choix : conserver les trois passages et les deux jonctions, partager des courbes échantillonnées entre le moteur et le dessin. Donner aux sentiers un lit de terre sombre, des pavés irréguliers et des bordures contrastées. Les obstacles restent autoritaires. Une route purement décorative conserverait les sorties dans l'herbe ; déplacer tout le jeu sur une nouvelle grille modifierait trop les règles.

Chaque figurine décrit son orientation d'origine ; l'orientation des serpents en attaque suit leur cible. Réduire modérément la taille des figurines et afficher les petites barres de santé seulement quand elles sont utiles. Espacer les alliés et répartir les serpents sur deux traces à l'intérieur des chemins. Aucun nouvel asset payant nécessaire.

Conserver rôles, économie, sauvegardes et contrôle autonome. Vérifier les chemins sur les trois cartes, l'orientation au combat, les passages sans blocage, les captures navigateur et 100 campagnes. Une image fixe reste une miniature, pas une animation 3D multidirectionnelle.
