# Exécution graphique — plan docs/superpowers/plans/2026-11-09-decors-matiere.md

Base1b1e6c4, worktree lié existant, branchefeat/craft-terrain-034.
Baseline438/438 relancée juste avant le mandat, aucune mutation ensuite.

Ruling : cadres périphériques plutôt que remplacement plein écran — les fonds
fournis sont picturaux/gravés, leur centre détaillé compromettrait la DA et la
lecture. Coût d’un mauvais choix : retouche réversible du décor, aucune migration.
Ruling : usage du marais uniquement aux bordures et sans nouveau nom de lieu,
ni obstacle, météo ou pouvoir — respecter la référence iconique et les règles.
Le parent autorise maintenant le point 3 ; l’ancien report du lot 6 n’interdit
pas cette utilisation purement graphique nouvellement demandée.

Pré-flight : sélection du cadre -> chargeur -> terrain doivent partager les
mêmes clés ; GROUND_ART garde ses trois indices pour menu/aperçu existants.

Implémentation : test du choix de cadre rouge (undefined), puis vert. En observant
les captures, des accessoires semblaient flotter dans le ruisseau : test rouge
sur 24 couples terrain/graine, puis exclusion cosmétique, sans toucher aux rocks
réels. Les cartes UI gardent leur surface ; spécificité CSS bornée à.app pour
ne pas perdre leur matière sous les anciens styles. Pas de changement du layout.
Verify441/441, types/format/build/budgets verts. HTML31299, JS192554. Exports
554862 et 528320 octets ; originaux inchangés. Recettes navigateur en cours.

Conseil après le lot : six relectures terminées, aucune régression bloquante
nouvelle. Deux problèmes visuels hérités confirmés et classés importants pour
la lisibilité : cartes/pots désactivés identiques aux actifs sur tactile ; Canvas
ignore setTintFill et perd les contours des camps. Correction bornée en une passe :
état papier grisé sans diminuer le contraste du texte ; petites silhouettes
128×128 issues des alpha déjà chargés, uniquement en Canvas et partagées par
frame/couleur. Pas d’atlas complet recoloré, pas de coût nouveau en WebGL.
Recette rouge : quatre contrôles faux, zéro pixel de contour orange. Après :
quatre verts,1515pixels orange par scène ;18cellules partagées (1 179 648 octets
RGBA théoriques, hors copies) stables entre frames et toutes retirées au shutdown.
Deux contrôles réels de chargement ajoutés : échec+Réessayer, et changement de
chapitre avec image retardée, ancien cache conservé jusqu’à disponibilité.
Huit contrôles d’états/chargement verts. Captures renfort et miel sélectionnés.

Ruling : résoudre les deux limites héritées maintenant — elles portent sur les
repères visuels déjà protégés et la correction reste dans rendu/interface.
Coût si mauvais : ajustement réversible de cache/CSS ; aucun camp à migrer.
Mineurs différés : atlas de bordure compact, finesse du fondu/gravure et répétition
d’accessoires ; centre déjà lisible et pas de génération payante. Petits libellés
mobiles restent à observer avec les enfants. Nom du test palette restreint à ce
qu’il prouve, pas de promesse de compatibilité ancienne issue de cette seule unité.

Clôture : produit47cdeb6, verify441/441 ; recettes finales navigateur, interface 24,
audit 13, enfant 6, scroll5+ordinateur, offline10/25fichiers, scènes14 et états8
verts après correctifs. Même APK normal code42/certificat,30fichiers web identiques,
20 PNG lanceur identiques. Site0.34.0/Sites19 publié, source206da8d, audience publique
conservée ; recette réelle trois formats verte, aucun cadre au menu, un utile au
lancement. HTML/JS/CSS comparés octet par octet,31299/193413/65442octets.
Originaux et24modules protégés identiques à la base. Plan/conseil/bilan mis à jour.
Branche distante de la PR1 actualisée sans fusion ; pas de publication Play.
