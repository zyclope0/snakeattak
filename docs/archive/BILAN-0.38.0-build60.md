# Bilan 0.38.0 — Le voyage, Android build60

Livraison du 14 novembre2026 : **0.38.0 / Android60**, [site familial](https://conquete-serpents-famille.zyclope.chatgpt.site/) publié en version Sites **35**.
Source figée : `f8552429ee7e291b13e07b85ca294b1db24b035d`, intégration de la PR51 de Claude (`b328901`) avec main `d5bd04e`, puis compteur Android60. Conflit de plan résolu en conservant le bilan du build59 et les nouvelles décisions du Voyage.

## Fait

- **Le voyage** : cinq étapes tirées d’une graine, caprices surprises à partir de la troisième, roi à trois têtes à la dernière ; trois bonus proposés entre étapes, un à garder pour toute la suite. Budget de la dernière étape réduit de300pièces comme approuvé ; aucun nouveau réglage de Codex.
- Carte, sac, choix de bonus, code partageable, reprise et résultats FR/EN. Noms/annonces des caprices en français. Interface chargée à la demande ; illustrations dérivées des assets du dépôt, sans génération payante.
- Voyage par joueur, gardé entre étapes ; une étape quittée recommence au début. Il ne donne ni étoile ni autocollant, et reste hors du fichier familial comme décidé. Anciennes sauvegardes et codes conservés.
- **Première publication de la version1 du Voyage : ses règles et tirages sont désormais figés.** Toute modification future demandera une nouvelle version, sans modifier les anciens codes.
- Version affichée0.38.0 maintenue ; Android59→60, même package `com.conqueteserpents.famille` et certificat d’envoi Play. AAB release, APK debug et ZIP des sources préparés. Aucun SDK, achat, publicité ou serveur ajouté.

[Build59](archive/BILAN-0.38.0-build59.md) · [réglages du Voyage](VOYAGE.md) · [architecture](ARCHITECTURE.md).

## Vérifié

- `npm run verify` : **711 tests**,0échec ; format/types/build/budgets verts. Navigateur, audit **13/13**, menus **5478**, caprices **330**, traduction **504**, interruptions, hors ligne et parcours des missions verts. CI du source Claude entièrement verte (run43631495016).
- Tests du Voyage : première étape réellement gagnée dans le navigateur, bonus/sac/reprise, codes avec ou sans tirets, refus des codes invalides, profils distincts et absence d’écriture dans les autres progressions. Empreintes de compatibilité des anciens modes conservées ; relecture indépendante sans problème critique ou important.
- Contrôles publics sur cinq formats, dont1280×800,812×375 EN et780×360 avec marges simulées. Contrôle supplémentaire du Voyage FR/EN à780×360 et1280×800 : cinq étapes, code et carte identiques après rechargement, lancement de l’étape. Carnet FR/EN :36 noms exacts et20 images décodables. Aucun problème JavaScript relevé par ces recettes.
- AAB signé avec la clé d’envoi d’origine, validé jarsigner/bundletool ; non débogable, paysage, minSdk24/targetSdk36. APK debug signé séparément. **128 fichiers web**, dont30MP3, identiques entre build, paquets et site public ; aucune clé privée embarquée. ZIP des sources issu de Git, contrôlé et accompagné d’empreintes.
- Contenu du vrai APK démarré hors ligne FR/EN ; tous les MP3 décodés. Audio continu et réglages locaux/publics verts.

Preuves hors Git : `artifacts/livraison-build60/` et `/workspace/serpents-build60-20261114/`.

## Livraison et limites

Importer `conquete-serpents-v0.38.0-build60-play.aab` dans une nouvelle version du **canal de test interne existant**. Aucun envoi Console par Codex. L’APK debug conserve une autre signature que Play.

À essayer avec les enfants et sur le S24 : la durée et la difficulté du Voyage, notamment la marche devant le roi. La cinquième victoire est contrôlée sur une page de test, pas gagnée de bout en bout dans le navigateur. Aucun essai physique, TalkBack, police agrandie, écoute humaine ou Safari/Firefox revendiqué.
