# Bilan 0.37.0 — interface adaptative, Android build 51

Publication du 11 novembre 2026 sur le [site familial](https://conquete-serpents-famille.zyclope.chatgpt.site/), Sites **26**.
La version affichée reste **0.37.0** ; Android passe au **code 51**.

## Fait

- Correctifs d’accueil de Claude (PR14) et dialogues adaptatifs (PR15) intégrés ; PR15 fusionnée depuis `cd10eb5c8baaab218b982e3e1fc5beb51fb947f1`.
- Pages Missions, Favoris, Classique et Parents adaptées à la place réelle, barres Android déduites. Carnet, préparation, catalogue, aide et dangers adaptés ; cibles tactiles de 48 px et replis défilants sur les petits écrans.
- Site et APK reconstruits depuis `abe612370747bc51cc28da5a3d145f13e7846f45`. Codex n’ajoute que le numéro Android et les documents de livraison : aucune règle, valeur, chaîne du fils ni sauvegarde changée.
- Même identifiant `com.conqueteserpents.famille` et certificat. APK : `conquete-serpents-v0.37.0-build51-debug.apk` ; SHA-256 `00c8be8c9cbf9f8a1e4421e6a72f72a943ea422349806355e19da38cbb505776`.

## Vérifié

- `npm run verify` : **552 tests**, aucun échec, format, types, build et budgets verts.
- Recettes navigateur et journey vertes ; audit **13/13** ; menus **750 contrôles**, dont formats et marges système simulées.
- [CI de la PR15](https://github.com/zyclope0/snakeattak/actions/runs/43078791525) verte. La nouvelle CI des métadonnées Android/documents reste distincte et n’est pas annoncée verte avant son résultat.
- Site public à **1280×800 FR, 812×375 EN, 780×360 FR et 915×412 FR** ; marges simulées **30/48/24/48 px** sur les deux derniers formats. Navigation, focus, catalogue, pause et rotation contrôlés, zéro erreur JavaScript. Les six missions sont entièrement visibles à 1280×800.
- Les **34 fichiers publics** sont identiques aux octets embarqués dans l’APK. Deux démarrages Chromium hors ligne FR/EN à partir de ces fichiers extraits : zéro requête externe, aucune erreur, polices prêtes.
- APK normal sans serveur de développement ni permissions INTERNET/BILLING/AD_ID, même certificat, paysage conservé.

Reçus et captures hors Git : `artifacts/livraison-build51/` et `/workspace/serpents-build51-20261111/`. [Bilan précédent, build 50](../archive/BILAN-0.37.0-build50.md).

## Non fait

Pas d’essai physique S24, TalkBack ou avec les enfants ; police Android agrandie non simulée. L’accueil et l’écran de jeu gardent leurs seuils ; certains dialogues de lecture et les très petits écrans défilent. Pas de génération payante, SDK ni modification d’équilibrage.
