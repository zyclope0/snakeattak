# Équilibrage 0.36.2 — index local compact

Version 0.36.2 / Android 48. Livraison locale préparée sur
`feat/equilibrage-0362`, base `9d3dded` de `feat/caprices-interface`.
Publication après revue autorisée le 10 novembre, conduite par le coordinateur.
Cet index ne prétend pas que le site est déjà mis à jour.

- [Bilan, décisions et limites](../../docs/BILAN-0.36.2.md).
- [Six perspectives simulées](../../docs/CONSEIL-0.36.2.md), revue globale sous responsabilité du coordinateur.
- [Commandes et provenance](commands.md).
- [Résultats de simulation compacts](measurements.json).
- Sources du paquet : `430e0212857f38a71d0558203163920e6bceba4f` pour les métadonnées, les annotations et les captures du guide ; commit final de QA indiqué dans le reçu APK.

Les preuves brutes nouvelles restent ignorées sous
`artifacts/equilibrage-0362/` ; les entrées exploratoires sous
`artifacts/balance-next-20261110/`. Les anciennes preuves, archives et APK ne
sont pas déplacés ni écrasés. La fixture fonctionnelle de régression
`tests/fixtures/balance-0362-legacy.json` reste dans Git.

[Reçu courant de livraison](delivery.json) : APK normal source `28e958e29ef86b8442c875ce6a96b0707ec0425d`,
34 fichiers web identiques au `dist/`, même version 0.36.2/code 48,
application/certificat, orientation paysage et absence de serveur/startpath/
permission réseau ou achat.

- APK courant : `/workspace/conquete-serpents-v0.36.2-debug.apk`, 15,159,454 octets ; SHA256 `4dfeab542049216e971f5a4e1f0a7085c0550869a6c71cedd58479a1482d7dd4`.
- Portable courant : `/workspace/conquete-serpents-v0.36.2-portable.html`, 15,103,538 octets ; SHA256 `8bf19d863db9cd6053ca71137906b270277f2754ea3270086758bf1e2161482f`.
- Copies avant revue : `/workspace/conquete-serpents-v0.36.2-before-final-review-debug.apk` et `conquete-serpents-v0.36.2-before-final-review-portable.html` ; [reçu initial conservé](delivery-before-final-review.json).
- Archive initiale Task3 inchangée : `/workspace/conquete-serpents-v0.36.2-preuves.tar.gz`, 150 058 244 octets, 632 membres vérifiés ; SHA256 `7611963e0815a53fe11dc6ea9d4ce9db0a20888fda53eb6c8d9c84186a2e9bb0`.
- Complément final distinct : `/workspace/conquete-serpents-v0.36.2-final-addendum.tar.gz`, 30,209,058 octets, **51 fichiers vérifiés** contre le manifeste SHA embarqué ; SHA256 `7bbdc57afb5382e04078a256a212882603e22933d08aa8ea5bf43a84ca7c8da2`. Reçu externe : même chemin suivi de `.verification.json`.

Le seul P3 de revue est corrigé : la progression mission 2 conservée après
remplacement d’un refuge neuf par un ancien exige toujours l’enveloppe 5 ;
les fausses étiquettes 1–4 sont rejetées sans écriture. Pas de rétrogradation
de progression ni de changement de règles. RED puis GREEN ciblé 45/45 ;
verify frais 548/548, navigateur général et famille sans erreur, quatre
démarrages froids FR/EN normal hors ligne/file:// réussis. Les 672 parties
Game2 restent les preuves déjà revues, sans nouvelle simulation.

8 139 preuves historiques fixes, les 145 fichiers Task3, huit empreintes du
cœur et six anciens APK/archives restent identiques. Le complément ne duplique
ni sauvegarde historique ni archive initiale ni anciens binaires. La revue
globale figure dans le complément ; la relecture ciblée et les documents de
coordination seront ajoutés séparément par le coordinateur. Aucun upload
distant réalisé par cette correction. Essai physique S24, TalkBack,
relecture anglophone humaine et enfants attendus.


La [revue globale](final-review.md) et la [relecture de sa correction](final-fix-review.md) clôturent les contrôles : R1 traité, aucun nouveau constat. Les [arbitrages et limites](coordination.md) conservent le journal de décision. Les trois revues de tâche et leurs corrections sont également conservées dans ce dossier.


Le [rapport de correction finale](final-fix-report.md) est conservé ici avec les autres preuves compactes ; le répertoire temporaire de coordination peut ainsi être supprimé sans perdre son contenu.


Publication réalisée après autorisation : PR3/PR4 fusionnées, Sites 23 en 0.36.2.
Le [reçu public](../deployment-0.36.2.json) et la vérification effective FR/EN
aux trois formats complètent les preuves locales ci-dessus. Le code livré
`28e958e` a sa CI entièrement verte ; les étapes postérieures sont documentaires.
