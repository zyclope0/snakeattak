# Bilan 0.38.0 — Missions et vignettes, Android build57

Livraison du 13 novembre 2026, version **0.38.0**, Android **57**. [Site familial](https://conquete-serpents-famille.zyclope.chatgpt.site/) publié, version Sites **32**.
Source figée : `6e80a204a8559fedfe2dcf3ea245248132635297`. PR35 et PR36 de Claude, plus son correctif `1d84cdc`, intégré à cette livraison.

## Fait

- Missions et préparation : objets du jeu sur les cartes des six missions, les cinq onglets et les repères Terrain, Attaques, Œufs.
- Carnet, préparation et résultat : **20 vignettes en pâte à modeler pour les 36 caprices**, une par nom ; les vignettes non gagnées restent pâles. Noms et annonces du fils inchangés. [Journal des ressources](../../public/assets/illustrated/PROVENANCE-VIGNETTES-2026-11.md).
- Correctifs de Claude : le combattant garde le côté du coup pendant son geste ; les mots des onglets ne débordent plus en français/anglais. Ces ajustements concernent uniquement le rendu et l’interface.
- Codex applique le passage0.37.0→0.38.0 prévu par le bilan préparatoire et le code Android56→57. Même package `com.conqueteserpents.famille`, même clé d’envoi Play ; aucune règle, valeur de caprice, sauvegarde ou ancien code de départ changé depuis le build56. Aucune génération ou dépense supplémentaire par Codex.

La version reprend aussi les sons, personnages, plateau net et accueil déjà publiés dans les builds52 à56. [Bilan du build56](../archive/BILAN-0.37.0-build56.md), [rapport préparatoire de Claude](../archive/BILAN-0.38.0-prepare-claude.md).

## Vérifié

- `npm run verify` : **590 tests**, aucun échec ; format, types, build et budgets verts, empreintes du moteur conservées. Navigateur, audit **13/13**, menus **758**, caprices **294**, traduction **496** et présentation **14 scènes** verts.
- Carnet parcouru par ses vrais boutons en FR/EN à780×360 avec marges système simulées : **36 identifiants et noms exacts dans chaque langue**, 20 images distinctes décodables. Préparation à1024×768 et1280×800 FR/EN : les cinq onglets, dans chacune des cinq vues, restent dans leurs boutons et gardent leurs cibles48px.
- AAB release signé avec la clé d’envoi Play d’origine et vérifié par jarsigner/bundletool ; APK debug avec son certificat familial distinct. **112 fichiers web**, dont30MP3, identiques au build et aux paquets. Paysage, minSdk24 / targetSdk36 ; aucun serveur ou permission INTERNET/BILLING/AD_ID ajouté.
- Site public contrôlé sur cinq formats, dont1280×1024 et780×360 avec marges simulées ; aucun problème JavaScript. Ses **112 fichiers** correspondent aux paquets. Carnet FR/EN (36 noms et20 images), onglets FR/EN aux deux formats, lecture continue et réglages audio revérifiés en ligne sans erreur. Le retour de pause est visible dans le même clic de fermeture.
- Démarrages du contenu du vrai APK hors ligne FR/EN et décodage de tous les MP3 verts.

Preuves hors Git : `artifacts/livraison-build57/` et `/workspace/serpents-build57-20261113/`.

## Livraison et limites

`conquete-serpents-v0.38.0-build57-play.aab` est destiné à une nouvelle version du même **canal de test interne Play**. Aucun envoi Console par Codex. Une installation Play se met à jour via Play ; l’APK debug garde une autre signature.
Aucun essai physique S24, écoute humaine, TalkBack, police agrandie Android, Safari/Firefox ou mesure FPS/mémoire du téléphone par Codex. Les contrôles de lisibilité restent des captures Chromium ; la pose d’attaque du T-rex, dents comprises, est validée par le parent selon le commit de Claude `3b2b00e` du13 novembre2026. Aucun équilibrage ou SDK commercial ajouté.

Suivi visuel mineur : le bouclier peut se tourner vers l’allié protégé pendant0,4s lors d’un blocage. Ce défaut d’affichage est reproduit ; la protection et les règles restent inchangées. À reprendre lors de la prochaine passe de rendu.
