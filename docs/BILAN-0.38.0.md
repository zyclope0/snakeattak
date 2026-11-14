# Bilan 0.38.0 — Joueurs et caprices visibles, Android build59

Livraison du 14 novembre 2026 : **0.38.0 / Android59**, [site familial](https://conquete-serpents-famille.zyclope.chatgpt.site/) publié en version Sites **34**.
Source figée : `bedda44697e3ea3a7bf9666b48cf3d82da26525d`, issue de main `5b7306c` (PR43 à49 de Claude), plus le compteur Android59 de Codex.

## Fait

- Jusqu’à quatre joueurs locaux, chacun avec personnage, surnom facultatif, campagne, carnet, favoris et partie. Son et langue communs à l’appareil. L’ancienne aventure reste le premier joueur, sans conversion ; aucun compte ni serveur ajouté.
- Les missions montrent leurs autocollants. Une victoire propose « Rejouer avec un caprice » ; l’accueil conduit aux caprices après les six missions gagnées, quand il en reste à gagner. Les noms et annonces du fils restent en français.
- Nettoyage de Claude : fonctions communes, moteur, lecteurs de sauvegardes/codes, interface, rendu, son et styles découpés. Règles, équilibrage et tirages conservés ; anciens codes et sauvegardes préservés.
- Version affichée0.38.0 maintenue, Android58→59. Même package `com.conqueteserpents.famille` et clé d’envoi Play. Aucun SDK, achat, publicité, permission réseau ou génération ajouté par Codex.

[Livraison précédente](archive/BILAN-0.38.0-build58.md) · [bilan historique du nettoyage](BILAN-NETTOYAGE-2026-11.md) · [architecture](ARCHITECTURE.md).

## Vérifié

- `npm run verify` : **658 tests**, aucun échec, format/types/build/budgets verts. Navigateur, audit **13/13**, menus **4925**, caprices **330**, traduction **504**, interruptions et hors ligne verts. CI du main source `5b7306c` entièrement verte (run43602682540).
- Recettes de profils : ajout, choix, changement, suppression confirmée, quatre joueurs, aventures isolées, ancien stockage du joueur1, onglets concurrents et refus de stockage. Recettes de rejouabilité : autocollants, proposition après victoire et accueil avancé FR/EN. Ces contrôles utilisent aussi des familles de test préparées ; ils ne remplacent pas des parties jouées par les enfants.
- Contrôles publics sur cinq formats, dont1280×800,812×375 EN et780×360 tactile avec marges simulées. Carnet FR/EN :36 noms exacts et20 vignettes décodables ; préparation FR/EN à1024×768 et1280×800. Aucun problème JavaScript relevé par ces recettes.
- AAB release signé avec le certificat d’envoi d’origine, vérifié par jarsigner et bundletool ; non débogable, paysage, minSdk24/targetSdk36. APK debug signé séparément. **120 fichiers web**, dont30MP3, identiques entre build, paquets et site public ; aucune clé privée embarquée.
- Contenu du vrai APK démarré hors ligne FR/EN ; tous les MP3 décodés. Lecture continue et réglages audio locaux/publics vérifiés.

Preuves hors Git : `artifacts/livraison-build59/` et `/workspace/serpents-build59-20261114/`.

## Livraison et limites

`conquete-serpents-v0.38.0-build59-play.aab` est destiné à une nouvelle version du **canal de test interne Play existant**. Aucun envoi Console par Codex ; l’APK debug ne remplace pas une installation signée par Play.

À confirmer sur le S24 : confort, interruptions Android réelles, fluidité et sons. Aucun essai physique, TalkBack, police agrandie, écoute humaine ou Safari/Firefox revendiqué. Après fermeture complète, un camp d’une mission terminée peut encore faire afficher « Reprendre » : suivi existant, sans changement du format de camp dans cette livraison. Profils connectés, nouveaux terrains et équilibrage restent hors périmètre.
