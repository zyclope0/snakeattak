# Interface mobile 0.37.0 — index de livraison publiée

Les preuves lourdes et les journaux sont dans
`/workspace/serpents-interface-0370/task3/`. Les captures ne constituent pas des
essais physiques Android. Le site public est en 0.37.0, Sites24, après revue approuvée et PR7 fusionnée.
Le [reçu de publication](../deployment-0.37.0.json) distingue Git, CI, source
fonctionnelle, paquet et vérification publique.

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

## Correction finale de revue globale

La source actuelle et celle des artefacts sont `b31933bf9f6dc56b9c7bf4d286068f52ff3bf28a`.
[final-fix.json](final-fix.json) consigne I1/M1/M2, RED/GREEN, les six commandes
de vérification fraîches, la préservation et le nouvel écart attendu avec le
snapshot immuable `9ca13bb`. Verify compte 549 tests ; navigation 9 contrôles ;
journey garde toutes ses assertions métier ; gestes natifs 5 cas positifs plus
ordinateur ; menus 519 contrôles ; navigateur normal et quatre démarrages
froids FR/EN réussis. L’APK contient exactement les 34 fichiers normaux.

Les preuves lourdes corrigées sont dans `/workspace/serpents-interface-0370/final-fix/`.
APK/HTML/ZIP, favicon et reçu précédents sont préservés dans `pre-global-review/`.
`delivery.json` expose `historicalQA` pour les 21 commandes de `9ca13bb`, séparément
de `qa` pour la correction. Le snapshot et la partie authentique du coordinateur
restent historiques. Aucun nouvel essai physique n’est revendiqué. La fusion et
le déploiement publics sont consignés séparément dans le reçu de publication.

Les revues de chaque lot, la revue globale, la relecture finale et les neuf
arbitrages du coordinateur sont conservés dans [reviews/](reviews/). La CI
complète de la PR7 est verte ; le reçu distingue les passages automatiques de
main encore en cours au moment de la publication, sans les annoncer verts.
