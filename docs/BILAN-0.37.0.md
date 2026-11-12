# Bilan 0.37.0 — Graphismes, poses et son, Android build 54

Livraison du 13 novembre 2026, [site familial](https://conquete-serpents-famille.zyclope.chatgpt.site/), version Sites **29** publiée.
Version affichée **0.37.0**, Android **54**. Source des paquets : `d5e1d4767c5391a18022674c580b26a36c290217`.

## Fait

- Dernières mises à jour de Claude, PR23 à PR28 déjà fusionnées : barre de commandes allégée sur téléphone, langue et effets légers dans Réglages, musique lue en continu, son activé au premier appui pour un appareil sans choix enregistré (un choix existant reste respecté).
- Onze planches refaites en pâte à modeler et neuf planches de poses d’attaque ; impacts, respiration, pièces, poussière, éclosions et victoire animés. « Effets légers » conserve le repli sobre. Les poses optionnelles arrivent en arrière-plan, sans bloquer le chargement requis d’une mission. [Provenance des ressources](../public/assets/illustrated/PROVENANCE-RESTYLE-2026-11.md).
- Codex n’ajoute que le code Android et le suivi de livraison. Aucune règle, valeur des caprices, annonce du fils, sauvegarde ou ancien code de départ changé depuis le build53. Aucune génération ou dépense supplémentaire.
- AAB **release** signé avec la clé d’envoi Play d’origine ; APK debug avec le certificat familial conservé. Même package `com.conqueteserpents.famille`, code **54** supérieur aux précédents.

## Vérifié

- `npm run verify` : **565 tests**, aucun échec ; format, types, build et budgets verts. Navigateur vert, audit **13/13**, menus **758**, présentation **14 scènes**, traduction **496 contrôles** et caprices **294 contrôles** verts.
- Résultats FR/EN sur trois tailles avec marges Android simulées : **12 cas** verts. Vraie partie à 780×360 EN, horloge et jeu non modifiés, victoire et trois boutons de résultat visibles sans défiler. Sept planches d’attaque chargées pendant ce parcours, aucune erreur JavaScript.
- Audio contrôlé par les réglages et le toucher : lecture réelle via élément audio, **26 bruitages décodés**, aucune musique décodée dans un AudioBuffer complet ; préférences respectées au rechargement, pause conservée en quittant Réglages, suspension/reprise sur événements de visibilité simulés.
- AAB vérifié par `jarsigner` et `bundletool`, non débogable ; **73 fichiers web**, dont **30 MP3**, identiques à l’APK et au build. Paysage, minSdk24 / targetSdk36. Aucun serveur ou permission INTERNET/BILLING/AD_ID ajouté.
- Site public vérifié à 1280×800 FR, 812×375 EN, 780×360 et 915×412 FR (marges30/48/24/48 simulées sur les deux derniers). **73 fichiers publics identiques aux paquets**, aucune erreur JavaScript. Réglages audio et lecture réelle en continu contrôlés également sur le site publié, sans erreur média.
- Démarrages FR/EN avec les fichiers du vrai APK en mode hors ligne et décodage des30 MP3 vérifiés.

Captures, hashes et reçus hors Git : `artifacts/livraison-build54/` et `/workspace/serpents-build54-20261113/`. [Bilan précédent, build53](archive/BILAN-0.37.0-build53.md).

## Livraison et limites

`conquete-serpents-v0.37.0-build54-play.aab` est destiné à une **nouvelle version du même canal de test interne Play**. Codex ne l’a pas envoyé dans la Console. Mettre à jour l’installation Play via Play ; l’APK debug a une autre signature.
Aucun essai physique S24, écoute humaine, mesure mémoire Android, TalkBack ou test avec les enfants par Codex. Retour audio et fluidité restent à confirmer sur appareil. Équilibrage de mission1 et habillage des accessoires/interface restent des suivis distincts.
