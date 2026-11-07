# Le refuge et les antres — 0.12

Le petit phare devient un refuge fortifié en bois et pierre, avec le cristal bleu
au centre. La porte regarde les attaquants. Une jauge dans le monde affiche la vraie
santé du camp ; impacts, fissures et réparations rendent les pertes plus lisibles.
La réparation reste celle du jeu (80 pièces, +25), sans remise à neuf automatique.

Les trous plats deviennent trois antres de serpents tournées vers les chemins.
Chaque clairière a sa variante : racines et œufs, bois ambré et rouages, portail
ancien de jardin. Une apparition réellement observée allume la bonne antre et
produit poussière/entrée progressive. Un œuf éclot à son emplacement et ne fait
pas faussement clignoter une antre. Aucun serpent décoratif ni renfort gratuit ajouté.

Les effets sont courts, bornés et séparés du moteur. Ils se figent en pause,
s'effacent au redémarrage et respectent les mouvements réduits. Les miniatures
restent des images fixes avec animation procédurale, pas des modèles 3D.

## Assets

Une seule planche originale Recraft V4 Pro via Magnific, dans le projet Personal,
ancrée sur le style de la planche terrain précédente. Résultat contrôlé avant
préparation. Atlas transparent 1024², WebP sans perte : 792 264 octets. Dépense
vérifiée 218 crédits, solde 17 215 → 16 997. Le PNG de travail reste hors distribution.
Provenance et prompt : art-assets-0.12.json et public/assets/illustrated/PROVENANCE.md.

## Vérifications

Cinq nouveaux tests : sortie unique et sans mutation, éclosion distincte, vraie
santé/réparation sans faux chargement, pause/nettoyage, bornage/expiration. Les tests
existants de simulation, sauvegarde et présentation restent exécutés.

Les fixtures navigateur contrôlent les trois antres, la porte du refuge, une base
chargée à 28 % sans impact inventé, dégâts jusqu'à 19 %, réparation réelle à 44 %,
et une sortie sur la voie effective avec un seul monstre. Les captures sont des
scènes préparées de contrôle, pas des victoires humaines. Un état visuel de sortie
est gelé dans la fixture seulement pour rendre l'effet photographiable.

Les quatorze fichiers de règles, IA, navigation, sauvegarde et session comparés à
la 0.11.1 sont identiques octet pour octet. L'avantage des armées à distance reste
un point connu ; cette passe ne rééquilibre pas les statistiques.

100 campagnes finales (cinq politiques × vingt graines) : 84 victoires, 16 défaites,
aucun blocage. Issues, résultats par vague et nombre de pas (1 732 387) identiques
à la 0.11.1. Rapports versionnés dans reports/final-0.12. Ce lot ne mesure pas le plaisir
et ne corrige pas l'avantage déjà connu du jeu à distance.

La revue indépendante a reproduit un allié masqué près du fort. L'ordre de dessin
a été corrigé : tous les combattants restent au-dessus du bâtiment, sans supprimer
une place auparavant légale. Le recrutement par clic à (984,312) est maintenant
contrôlé dans la fixture, avec échec constaté avant correction.

Le test GPU compare terrain, fort et antre avant/après restauration et retrouve
les trois mêmes images. Dernière mesure isolée du cloud : médiane 33,3 ms entre
callbacks d'image, p95 33,4 ms. Ce n'est pas un essai d'appareil physique.
