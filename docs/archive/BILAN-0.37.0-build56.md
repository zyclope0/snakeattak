# Bilan 0.37.0 — Accueil illustré et pause, Android build56

Livraison du 13 novembre 2026 ; version affichée **0.37.0**, Android **56**. [Site familial](https://conquete-serpents-famille.zyclope.chatgpt.site/) publié, version Sites **31**.
Source des paquets : `f04f3d5fb1df8f53db9f72dbd9a64a373b50a735`, main `34be40e` (PR32 et PR33 de Claude).

## Fait

- Accueil de Claude : forêt derrière les personnages de l’icône, refuge au cristal, objets du jeu sur les boutons, carte proportionnée sur écran haut et réglages dégagés de la carte sur téléphone. Images dérivées de ressources existantes, aucune génération payante par Codex.
- Retour du panneau de pause pendant le clic « Fermer » des réglages, sans image intermédiaire manquante.
- Codex : code Android55→56 et petit correctif des espacements sur écran bas. Les nouveaux objets faisaient couper « Prochaine mission » à 780×360 avec marges système ; le libellé tient maintenant en français et en anglais, sans réduire les cibles tactiles sous 48 px. Aucun texte du fils ou règle de jeu modifié.
- Même package `com.conqueteserpents.famille` et même clé d’envoi Play. Sauvegardes, anciens codes de départ, règles, valeurs des caprices et rendu de combat inchangés depuis le build55.

## Vérifié

- `npm run verify` : **584 tests**, format, types, build et budgets verts. Navigateur vert, audit **13/13**, menus **758** verts après la correction finale. Réglages de rendu verts ; aucun rendu de combat modifié.
- Géométrie du libellé FR/EN et cibles tactiles à 780×360 avec marges 30/48/24/48 contrôlées ; parcours d’accueil sur cinq formats, dont 1280×1024, vérifiés sur les fichiers finaux, sans erreur JavaScript.
- **83 fichiers publics identiques à l’APK et à l’AAB**, dont30MP3. Démarrages du vrai contenu APK hors ligne FR/EN et décodage de tous les MP3 verts. Réglages audio et lecture continue contrôlés sur le site public ; le panneau de pause est visible pendant le même événement clic de fermeture, sans erreur JavaScript ou média. Ce contrôle ne simule pas un cycle de vie Android physique.
- AAB release signé avec la clé d’envoi d’origine et vérifié par jarsigner/bundletool ; APK debug avec le certificat familial conservé. Paysage, minSdk24 / targetSdk36. Aucun serveur ou permission INTERNET/BILLING/AD_ID ajouté.

Preuves hors Git : `artifacts/livraison-build56/` et `/workspace/serpents-build56-20261113/`. Les paquets intermédiaires avant correction sont conservés séparément et ne sont pas livrés. [Bilan précédent, build55](../archive/BILAN-0.37.0-build55.md).

## Livraison et limites

`conquete-serpents-v0.37.0-build56-play.aab` est destiné à une nouvelle version du même **canal de test interne Play**, sans envoi Console par Codex. Une installation Play se met à jour via Play ; l’APK debug a un autre certificat.
Aucun essai physique S24, écoute humaine, TalkBack, Safari/Firefox ou mesure de performance Android par Codex. Les marges système sont simulées en Chromium. L’équilibrage et les fonctionnalités restent hors périmètre de cette livraison.
