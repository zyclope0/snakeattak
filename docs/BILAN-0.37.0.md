# Bilan 0.37.0 — mise à jour Claude, Android build 50

Publication du 11 novembre 2026 sur le [site familial](https://conquete-serpents-famille.zyclope.chatgpt.site/), Sites **25**.
La version affichée reste **0.37.0**, conformément au plan de Claude ; Android passe au **code 50**.

## Fait

- Changements de Claude récupérés depuis `751dcf5206d34fcc1512013b5da38d4fbb870a9b` (PR8 à PR12) : dépôt allégé, documents rangés, moteur découpé dans `src/engine/`, HTML/CSS séparés et pages secondaires compactes sur téléphone.
- Site et APK reconstruits depuis `0dbc7cf53ddbdd82f9a7ba5af9d1a2efc8883f51`. Seul le code de version Android a été ajouté par Codex ; aucune nouvelle règle ou valeur de jeu.
- Identifiant `com.conqueteserpents.famille`, certificat et formats de sauvegarde conservés. Les noms et annonces du fils restent français, même dans l’interface anglaise.
- APK fourni : `conquete-serpents-v0.37.0-build50-debug.apk` ; SHA-256 `14349b42a413047bf37d7bf5db85fd33b96ec3bffef5be1888f761541596f3c4`.

## Vérifié

- `npm run verify` : **552 tests**, aucun échec, types, format, build et budgets verts.
- `npm run test:browser`, `npm run test:audit` (**13/13**), `npm run test:journey` et `npm run test:mobile-menus` (**537 contrôles**) verts.
- [CI du dernier merge de Claude](https://github.com/zyclope0/snakeattak/actions/runs/43013974328) verte. Le build 50 ne change que les métadonnées Android et les documents ; sa nouvelle CI automatique n’est pas annoncée verte avant son résultat.
- Site public contrôlé à **1280×800 FR, 812×375 EN et 780×360 FR** : navigation visible, catalogue, focus, pause et rotation, zéro erreur JavaScript. Les **34 fichiers publics** correspondent octet pour octet aux fichiers embarqués dans l’APK.
- APK normal sans serveur de développement ni permission INTERNET/BILLING/AD_ID ; même certificat, paysage conservé.

Les reçus et captures sont hors Git dans `artifacts/livraison-build50/` et dans l’espace de livraison `/workspace/serpents-claude-20261111/`. [Bilan précédent, build 49](archive/BILAN-0.37.0-build49.md).

## Non fait

Pas d’essai physique S24, TalkBack ou séance avec les enfants. Les travaux restants de Claude (dont la seconde rangée de missions sur ordinateur) restent au [plan](PLAN-ACTUEL.md). Pas de génération payante, SDK ni modification d’équilibrage.
