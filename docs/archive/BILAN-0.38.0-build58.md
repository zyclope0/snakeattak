# Bilan 0.38.0 — Préparation simplifiée, Android build58

Livraison du 13 novembre 2026, version **0.38.0**, Android **58**, [site familial](https://conquete-serpents-famille.zyclope.chatgpt.site/) publié, version Sites **33**.
Source figée : `d3e3e02251a29337002b34899bd432ac8b4c24d7`, issue de main `21f0feb` (PR40/PR41 de Claude), plus le compteur Android58 de Codex.

## Fait

- Carnet unique pour un nouvel appareil ; les sauvegardes avec plusieurs carnets gardent leurs carnets et leur sélecteur. Création et renommage retirés, explication du carnet et pagination en pages.
- Préparation : « Copains » visible seulement quand un choix est requis ; code de départ rangé chez les parents. Les anciens codes restent acceptés.
- Cinq bulles d’aide FR/EN : caprices, repérage, autre départ, sauvegarde familiale et code. Fermeture, retour du focus et pause conservés.
- Le bouclier ne se retourne plus vers l’allié protégé pendant un blocage. Correction d’affichage, protection inchangée : le suivi du build57 est clos.
- Version affichée0.38.0 conservée ; Android57→58, même package `com.conqueteserpents.famille` et clé d’envoi Play. Règles, valeurs de caprices, sauvegardes et anciens codes préservés. Aucune génération, dépense, permission réseau ou intégration commerciale ajoutée.

Les graphismes, sons et vignettes du [build57](../archive/BILAN-0.38.0-build57.md) restent inclus. Profils locaux et terrains supplémentaires restent des travaux futurs.

## Vérifié

- `npm run verify` : **601 tests**, aucun échec ; format, types, build et budgets verts. Navigateur, audit **13/13**, menus **2261**, caprices **329**, traduction **504** verts.
- Recette réelle des menus : anciens carnets multiples, propriétaire de l’autocollant après victoire, reprise et anciens codes ; aide tactile, focus, fermeture et langue contrôlés. Relecture indépendante sans anomalie bloquante.
- Site publié contrôlé sur cinq formats (1280×800, 812×375 EN, 780×360 et915×412 avec marges simulées, 1280×1024). Carnet FR/EN :36 identifiants/noms exacts et20 images décodables ; préparation ordinaire avec quatre onglets FR/EN à1024×768 et1280×800. Les tests couvrent aussi les choix de copains limités.
- AAB release : signature jarsigner, certificat d’envoi d’origine et bundletool validés ; versionCode58, non débogable, paysage, minSdk24/targetSdk36. APK debug signé séparément. **112 fichiers web identiques** entre build, paquets et site public ; aucune clé privée embarquée.
- Démarrage du contenu du vrai APK hors ligne FR/EN, décodage des30MP3, lecture continue et réglages audio en ligne verts. Aucun problème JavaScript relevé par ces recettes.

Preuves hors Git : `artifacts/livraison-build58/` et `/workspace/serpents-build58-20261113/`.

## Livraison et limites

`conquete-serpents-v0.38.0-build58-play.aab` : créer une nouvelle version du **canal de test interne Play existant** et l’importer. Aucun envoi Console par Codex. Une installation Play se met à jour via Play ; l’APK debug conserve une autre signature.

Aucun essai physique S24, écoute humaine, TalkBack, police agrandie Android, Safari/Firefox ni mesure FPS/mémoire du téléphone. Marges, rotation et interruptions contrôlées ici en Chromium, à confirmer sur appareil. Aucune règle de jeu modifiée dans cette livraison.
