# Exécution graphique — plan docs/superpowers/plans/2026-11-09-decors-matiere.md

Base1b1e6c4, worktree lié existant, branchefeat/craft-terrain-034.
Baseline438/438 relancée juste avant le mandat, aucune mutation ensuite.

Ruling : cadres périphériques plutôt que remplacement plein écran — les fonds
fournis sont picturaux/gravés, leur centre détaillé compromettrait la DA et la
lecture. Coût d’un mauvais choix : retouche réversible du décor, aucune migration.
Ruling : usage du marais uniquement aux bordures et sans nouveau nom de lieu,
ni obstacle, météo ou pouvoir — respecter la référence iconique et les règles.
Le parent autorise maintenant le point3 ; l’ancien report du lot6 n’interdit
pas cette utilisation purement graphique nouvellement demandée.

Pré-flight : sélection du cadre -> chargeur -> terrain doivent partager les
mêmes clés ; GROUND_ART garde ses trois indices pour menu/aperçu existants.

Implémentation : test du choix de cadre rouge (undefined), puis vert. En observant
les captures, des accessoires semblaient flotter dans le ruisseau : test rouge
sur24 couples terrain/graine, puis exclusion cosmétique, sans toucher aux rocks
réels. Les cartes UI gardent leur surface ; spécificité CSS bornée à.app pour
ne pas perdre leur matière sous les anciens styles. Pas de changement du layout.
Verify441/441, types/format/build/budgets verts. HTML31299, JS192554. Exports
554862 et528320octets ; originaux inchangés. Recettes navigateur en cours.
