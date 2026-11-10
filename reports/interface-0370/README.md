# Interface mobile 0.37.0 — index de livraison locale

Les preuves lourdes et les journaux sont dans
`/workspace/serpents-interface-0370/task3/`. Les captures ne constituent pas des
essais physiques Android. Le site public reste en 0.36.2 jusqu’à la revue globale
et à la publication par le coordinateur.

- `delivery.json` : source de l’APK, empreintes, identité, recette finale.
- `image-quote.json` : devis partiel uniquement ; aucune image produite.
- `task-1-report.md` : rapport du premier lot, déplacé depuis le dossier de travail
  SDD par un déplacement Git normal, sans effacer son historique.
- `task-2-report.md`, `council-task1.md` et `council-task2.md` : preuves des lots
  précédents conservées ; les trois conseils sont réunis dans le document lié.
- [Bilan](../../docs/BILAN-0.37.0.md) et [conseils simulés](../../docs/CONSEIL-0.37.0.md).
- [Devis expliqué](../../docs/interface-0370/DEVIS-COMPARATIF.md).

Les anciens rapports et captures ont été copiés avant les
recettes. Les nouvelles sorties sont conservées hors Git avant restauration des
anciens fichiers ; les preuves 0.36.2 et les autres historiques restent intacts.
Les conseils de six perspectives sont des simulations, jamais des rencontres
avec des enfants, des tests TalkBack ou des essais S24.

La correction de revue [Task 3 / I1](task-3-fix1.json) ajoute la preuve de
défilement tactile réel du corps dans les deux sens et à sa limite. Le contrôle
négatif bloque le toucher par CSS de test et échoue ; la recette normale passe
sur les cinq tailles, avec les 20 alliés et les protections contre les achats
accidentels. Cet addendum ne remplace pas la passe initiale de 21 commandes et
ne modifie ni le produit ni les artefacts APK/portable de source `9ca13bb`.
