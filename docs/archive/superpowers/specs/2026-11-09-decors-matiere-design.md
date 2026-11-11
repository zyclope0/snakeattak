# Décors et matière — conception v0.34.0

Mandat : réaliser le point graphique3, regarder le site dans le navigateur,
réutiliser les ressources fournies et préserver la direction de l’icône.
Le parent a délégué les choix ordinaires ; aucune nouvelle attente d’accord.

## Choix

Réutiliser les PNG crue/marais comme **cadres périphériques**, avec un fondu
sur les sols calmes existants. La crue sert aux clairières et à deux géométries
connues ; le marais à la troisième géométrie et au jardin de pierres. Le bosquet
reste ambré. Ce sont des variantes de décor, pas de nouveaux lieux/règles/météo.
Les routes, ponts, rochers, spawns et positions restent ceux du modèle.

Alternatives écartées : remplacer le sol entier par les fonds riches brouille
les figurines et introduit une rupture picturale ; une nouvelle génération
pâte à modeler serait hors du mandat sans génération payante. La bordure permet
d’exploiter les ressources existantes en gardant les unités sur un fond lisible.
Le marais gravé ne devient pas la référence artistique : seul son cadre est utilisé.

Les pavés prennent des coins arrondis, relief mat et ombre discrète. Les renforts
utilisent papier crème et boutons en relief, sans changement de disposition,
de taille tactile ou de fonctionnement. Les personnages gardent leurs sprites
actuels déjà sculptés et leurs contours fonctionnels. Pas de refonte intégrale
prétendue, pas de nouvelle ressource commerciale ou de dépendance.

## Contraintes et recette

Moteur, RNG, sauvegardes et codes de départ intacts. PNG HD originaux inchangés ;
exports WebP cadrés1600×900 reproductibles avec empreintes. Chargement d’un seul
cadre utile à la fois, aucun au menu. Rendu terrain mis en cache, pas de filtre,
shader, effet animé ou nouvelle boucle par unité. Fallback Canvas vérifié.

Captures avant/après : trois chapitres, trois géométries, ordinateur et petit
paysage tactile ; image réelle du site. État du jeu comparé pour chaque paire,
ombres/couleurs inspectées à l’œil, tests verify/build/browser/audit/mobile,
hors ligne et défilement. Budgets HTML32KiB, JSjeu200000 inchangés.
Conseil après le lot : architecture, rendu/mobile, accessibilité, cibles6/9/12ans
simulées. Corriger les défauts importants puis APK, site exact et GitHub.
