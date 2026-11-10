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

[Reçu exact de livraison](delivery.json) : APK normal source `e55e2d3`,
34 fichiers web identiques au `dist/`, même application/certificat, sans
serveur/startpath/permission réseau ou achat.

- APK : `/workspace/conquete-serpents-v0.36.2-debug.apk`, 15 100 389 octets ; SHA256 `27285893b3735eb0e029df6090a589be42982ec89e8fedc434c8b2046f61c578`.
- Portable : `/workspace/conquete-serpents-v0.36.2-portable.html`, 15 103 523 octets ; SHA256 `ad6c4c4ed4591b0c7a5203a3df50f1eb87ae36c13f33783a8a2ad90942925c1e`.
- Archive nouvelle : `/workspace/conquete-serpents-v0.36.2-preuves.tar.gz`, 150 058 244 octets ; SHA256 `7611963e0815a53fe11dc6ea9d4ce9db0a20888fda53eb6c8d9c84186a2e9bb0` ; **632 fichiers vérifiés individuellement** contre le manifeste SHA embarqué. Reçu externe : même chemin suivi de `.verification.json`.

L’archive couvre les nouvelles preuves jusqu’à Task3 et précède la revue
fraîche globale du coordinateur. Les anciennes archives et la sauvegarde
historique externe sont exclues ; 8 139 preuves fixes et six anciens
APK/archives restent identiques. Aucun upload distant réalisé par le lot Task3.
Essai physique S24, TalkBack, relecture anglophone humaine et enfants attendus.
