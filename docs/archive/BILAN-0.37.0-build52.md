# Bilan 0.37.0 — Jouer directement et vrais sons, Android build 52

Publication du 11 novembre 2026 sur le [site familial](https://conquete-serpents-famille.zyclope.chatgpt.site/), Sites **27**.
Version affichée **0.37.0**, Android **52**. Source du paquet : `072855f90a961657d457671886222666182f5467`.

## Fait

- Derniers changements de Claude intégrés : PR17 (Jouer lance directement la prochaine mission ; actions agrandies et illustrées), PR18 (musiques et bruitages choisis par le parent).
- **26 bruitages et 4 musiques**, environ 7,25 Mo, embarqués dans le site et l’APK. Musiques des menus et vagues calmes, musique épique et arrivée du roi ; [provenance et licences](../AUDIO-LICENCES.md). Son coupé au départ, chargement après activation.
- Codex n’ajoute que le numéro Android et le suivi de livraison. Aucune règle, valeur, annonce du fils, sauvegarde ni RNG du moteur changé. Même identifiant `com.conqueteserpents.famille` et même certificat.
- APK : `conquete-serpents-v0.37.0-build52-debug.apk` ; SHA-256 `49575e489c89151b05115304094cfdf4ef994d425854780e646944b1f9b04fa8`.

## Vérifié

- `npm run verify` : **552 tests**, aucun échec, types, format, build et budgets verts. Menus **758 contrôles**, audit **13/13**, navigateur et journey verts.
- [CI de la PR18](https://github.com/zyclope0/snakeattak/actions/runs/43112687135) verte, source `3e3df13`. Les passages automatiques du numéro Android et des documents restent distincts.
- **64 fichiers publics identiques à l’APK**. Quatre formats publics : 1280×800 FR, 812×375 EN, 780×360 FR et 915×412 FR ; marges 30/48/24/48 simulées sur les deux derniers, zéro erreur JavaScript.
- Audio testé par les commandes visibles, en local puis sur le site : **aucune requête MP3 avant activation**, 28 ressources décodées pendant le parcours menus → partie, 13 démarrages de buffers et coupure effective (AudioContext suspendu). Aucun échec de décodage ou de requête.
- Vérification séparée des **30 MP3 extraits du vrai APK** : tous décodables dans Chromium, y compris les pistes du roi et épique non atteintes dans cette courte partie. Deux démarrages hors ligne FR/EN verts ; polices prêtes, aucune requête externe.
- APK normal, paysage conservé, sans serveur de développement ni permissions INTERNET/BILLING/AD_ID. La licence publique de Cozy Quest confirme l’usage non exclusif et libre de droits ; aucun achat supplémentaire.

Reçus et captures hors Git : `artifacts/livraison-build52/` et `/workspace/serpents-build52-20261111/`. [Bilan précédent, build 51](../archive/BILAN-0.37.0-build51.md).

## Non fait

Aucune écoute humaine par Codex, aucun essai physique S24, TalkBack ou avec les enfants. Équilibre des volumes et taille de police agrandie d’Android à confirmer sur appareil. Pas de génération payante, SDK ou modification d’équilibrage.
