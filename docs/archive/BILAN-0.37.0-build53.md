# Bilan 0.37.0 — Réglages du son et interface, Android build 53

Publication du 12 novembre 2026 sur le [site familial](https://conquete-serpents-famille.zyclope.chatgpt.site/), Sites **28**.
Version affichée **0.37.0**, Android **53**. Source des paquets : `d05782239d374e33e22cc0bba88ca632e4234e36`.

## Fait

- Claude : PR20 (réglages musique/bruitages séparés, mémorisés, reprise au toucher et au retour dans le jeu, fondu des musiques) et PR21 (résultat compact et dock lisible : noms 13 px, prix 12 px).
- Codex : panneau de résultat légèrement élargi uniquement après la partie sur téléphone. Une vraie victoire en anglais avec marges Android révélait encore 31 px de contenu masqué ; les trois actions sont maintenant visibles, cibles de 48 px, défilement nul.
- AAB **release** signé avec la clé d’envoi Play d’origine, APK debug avec le certificat familial conservé. Package inchangé : `com.conqueteserpents.famille`, code **53** supérieur au **52** déjà accepté en test interne. Aucune règle, valeur de caprice, annonce du fils, sauvegarde ou code de départ changé.

## Vérifié

- `npm run verify` : **554 tests**, aucun échec ; format, types, build et budgets verts. Navigateur vert, audit **13/13**, menus **758 contrôles** verts après le correctif.
- Résultats contrôlés FR/EN à 780×360, 812×375 et 667×375, marges 30/48/24/48 simulées (**12 cas**). Missions ordinaires : trois actions sans défiler ; résultats longs de caprices : défilement de repli conservé, actions accessibles. Vraie victoire jouée à 780×360 EN, sans injection de jeu ou d’horloge : zéro erreur JavaScript, trois boutons visibles.
- AAB vérifié par `jarsigner` et `bundletool` ; release non débogable, paysage, minSdk 24 / targetSdk 36. **64 fichiers web**, dont **30 MP3**, identiques au build et à l’APK. Aucun serveur, SDK publicitaire/achat ou permission INTERNET/BILLING/AD_ID ajouté.
- Site public contrôlé sur quatre formats (1280×800 FR, 812×375 EN, 780×360 et 915×412 FR avec marges simulées sur les deux derniers), zéro erreur JavaScript. Les **64 fichiers publics** correspondent à l’APK et à l’AAB ; deux démarrages FR/EN avec les fichiers du vrai APK hors ligne passent, les **30 MP3** se décodent.
- Réglages audio : activation indépendante, choix conservé au rechargement, reprise au toucher, coupure, réglages depuis la pause sans reprise de partie. Sur le site public : 28 ressources audio décodées dans le parcours, 11 démarrages de buffers, aucune erreur. Suspension/reprise par événements de visibilité simulés, pas par cycle de vie Android physique.

Reçus, captures et contrôles après publication : `artifacts/livraison-build53/` et `/workspace/serpents-build53-20261112/`, hors Git. [Bilan précédent, build 52](../archive/BILAN-0.37.0-build52.md).

## Livraison et limites

`conquete-serpents-v0.37.0-build53-play.aab` est destiné à **une nouvelle version du canal de test interne existant**. Codex ne l’a pas envoyé à Play Console. L’APK debug reste un paquet distinct de la signature de distribution Play ; mettre à jour l’installation Play via le canal Play.
Aucun essai physique S24, écoute humaine, TalkBack ou test avec les enfants par Codex. L’installation Play du build 52 fonctionne selon le parent ; mise à jour vers 53 et cycle de vie audio à confirmer sur téléphone. Équilibrage de la première mission, barre du haut et poids du premier téléchargement restent des suivis séparés.
