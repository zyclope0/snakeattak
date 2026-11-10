# Bilan 0.36.0 — caprices et carnets

9 novembre 2026 (Europe/Zurich). Candidate privée0.36.0/code46, arrêt pour essai du parent.
Les 36 défis existants deviennent accessibles sans modifier le moteur, leurs
valeurs, leurs noms, leurs annonces ou le RNG. Le site public et `main` restent
sur 0.35.0 ; aucune fusion ou publication dans cette livraison.

| Point          | Fait / pas fait                                                                                                            | Preuve                                                                |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 1. Préparation | Fait : deux rangées, étoiles, annonce et règles, relance du même caprice                                                   | [Recette](../reports/suivi-0.36.0/caprices.json), captures FR/EN      |
| 2. Copains     | Fait : choix vide/partiel/complet facultatif, conseil cohérent et vrais recrutements permis ; massues initiales conservées | 8 tests de lecture, régression R1 FR/EN, recette native               |
| 3. Sauvegarde  | Fait : checkpoint 8 conserve caprice et choix ; lecture1–7 conservée                                                       | Tests et reprise hors ligne explicite                                 |
| 4. Carnets     | Fait : 36cases par enfant, autocollant idempotent ; propriétaire du départ retenu au réessai/rechargement                  | Une victoire native attribuée à A alors que B est actif ; enveloppe 4 |
| 5. Codes       | Fait : code 3 avec caprice, portes mission/caprice ; anciens codes1/2 sans caprice                                         | Recettes caprices, départs, tests et lancement hors ligne             |
| 6. Langues     | Fait selon dernière instruction : noms ET annonces exactement français en FR/EN, contexte traduit                          | Inventaire et captures FR/EN ; voix locale facultative                |
| 7. Résultat    | Fait : vrai autocollant gagné, répétition reconnue, annonce française à la défaite                                         | Victoire native ; répétition/défaite contrôlées                       |
| 8. Créateur    | Fait : deuxième rangée, total/réserve/dépensable, achats protégés, coquille agrandie au rendu                              | Réserve568/812/1280 contrôlée, carapaces Canvas/WebGL                 |

La campagne et les étoiles restent partagées dans la famille. Les carnets locaux
ne sont pas des profils de combat :1–8enfants, noms de 24 caractères au plus,
36cases par carnet, aucun classement. Un changement de carnet ne réattribue pas
une expédition retenue ; un nouveau départ préparé prend le carnet actif.

L’enveloppe familiale 4 remplace aussi les carnets à l’import. Une enveloppe 1–3
remplace les carnets par un carnet vide après avertissement explicite ; aucune
réussite passée n’est inventée. L’échec de validation ou de stockage ne remplace
pas partiellement la famille. Les formats courants sont8/3/4 ; anciens schémas,
codes et fichiers restent lisibles.

Les noms et annonces du fils ne sont ni reformulés ni traduits. Les menus,
commandes et explications de règles autour passent en anglais. La lecture
vocale est facultative, sur action explicite et seulement avec une voix française
locale disponible. Aucun son effectivement entendu n’est revendiqué ici.

Les journaux, commandes exactes et comptes sont dans
[commands.json](../reports/suivi-0.36.0/commands.json),
[verify.log](../reports/suivi-0.36.0/verify.log) et les rapports de chaque recette et [counts.json](../reports/suivi-0.36.0/counts.json).
La vérification générale donne503tests réussis, sans échec ni saut, formatage,
types et budgets réussis. La recette caprices complète, sans saut natif, passe
205contrôles,31captures et zéro erreur JavaScript. La recette de langues passe
392 contrôles navigateur et 24 contrôles d’adaptateurs ; inventaire915phrases,
946entrées anglaises, aucune manquante. Les recettes sont exécutées en série ; aucun build ne
remplace les fichiers pendant une recette de production. L’audit historique est
restauré octet pour octet après copie du résultat actuel dans ce suivi.

Les vues couvrent1280×800,1366×768,812×375,780×360,568×320 avec marges et
375×812 portrait. Les boutons de préparation et fermeture de carnet après
scroll sont mesurés à 48 px. Les vues de réserve, carapaces et résultats forcés
sont explicitement contrôlées. Le parcours natif utilise une progression
familiale contrôlée, puis de vraies commandes et le vrai moteur pendant trois
vagues de Refuge, graine42, trio initial : victoire à 73% de cristal et 2 étoiles.
Ce n’est ni une séance enfant ni une
validation physique Android. Le contrôle hors ligne dédié reprend explicitement
le checkpoint 8 et le propriétaire A avec carnet B actif, puis lance un code 3 ;
quatre contrôles passent avec 26 fichiers locaux et réseau coupé. Le portable
FR/EN démarre depuis `file://`, ouvre le carnet et joue/pose une pause tutorielle
sans requête HTTP ; le build normal reste identique.

Les empreintes des trois sources figées et les36définitions complètes sont
comparées à `c886b82` dans
[source-freeze.json](../reports/suivi-0.36.0/source-freeze.json).
Aucun nouvel échantillon d’équilibrage n’est annoncé ; les 3888 parties du document
historique restent leurs mesures antérieures. Le HTML normal reste 31 771 octets,
bootstrap139 204, règles81 921, anglais70 957 et Phaser 1 481 792 octets ; les
plafonds sont respectés. Les ressources restent séparées dans le build normal.

Coquille et autocollants sont des dessins originaux procéduraux/SVG dans le code
(`src/render/capriceShell.ts`, `src/ui/capriceAlbums.ts`), sous les droits du projet.
Aucun service de génération, image payante ou téléchargement nouveau.

L’APK debug normal est `/workspace/conquete-serpents-v0.36.0-final-debug.apk`.
L’inspection paquet/signature/fichiers est conservée dans le suivi. Même appID
provisoire, même certificat debug, orientation paysage capteur, libellé anglais
Snake Attack TD et français conservé ; configuration serveur diagnostic absente.
L’APK précédent0.35.0 est préservé. Sources de l’APK :
`23a37debbc8659a46a6ad4c53e0b2a1deba87ae3` ; les changements ultérieurs
de livraison ne concernent que documents, rapports et captures.

[Le conseil final](CONSEIL-0.36.0.md), la [revue complète](../reports/suivi-0.36.0/final-review.md) et sa [relecture ciblée](../reports/suivi-0.36.0/final-fix-review.md) sont terminés et approuvés. Deux finitions corrigées : icône locale séparée du texte français de l'annonce ; raison de réserve visible et accessible sur les favoris, prix accessible conservé.

Les preuves de la finition sont distinctes de celles de la première candidate : [rapport](../reports/suivi-0.36.0/final-fix-report.md), [commandes](../reports/suivi-0.36.0/final-polish/commands.json), [inspection du dernier APK](../reports/suivi-0.36.0/final-polish/apk-inspection.json). Le premier APK et les rapports bruts antérieurs sont conservés ; le reçu d'empreintes est actualisé pour inclure les nouvelles preuves.

| Vérification finale             | Résultat                                                                                                                           |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `npm run verify`                | 503 tests, zéro échec/saut ; format, types, build et budgets verts                                                                 |
| `npm run test:browser`          | Parcours ordinateur et mobile vert, aucune erreur JavaScript                                                                       |
| `npm run test:caprices` complet | 269 contrôles, 39 captures, trois vraies vagues du moteur et victoire73%/2étoiles après progression de contrôle                    |
| Recette renforcée ciblée        | 268 contrôles, 38 captures, combat volontairement non rejoué ; mêmes fichiers produit, visibilité réelle après clic natif vérifiée |
| `npm run test:locale`           | 392 contrôles navigateur +24adaptateurs,915phrases,946entrées, aucun manque/paramètre ajouté/inconnu                               |
| Enfant mobile et renforts       | Six formats ; cinq cas de défilement plus ordinateur, zéro erreur                                                                  |
| Portable FR/EN                  | Quatre contrôles hors ligne, aucune requête HTTP ; build normal conservé                                                           |
| APK final                       | Code46,34fichiers web identiques, signature/appID conservés, aucune permission INTERNET/BILLING/AD_ID ni serveur diagnostic        |

Empreinte SHA256 du dernier APK : `c6909b41534b3f576cf59cc8bff55b32e801e8180a8022d2395770bcdf07cddb` ;15151926 octets. Les fichiers produit sont identiques entre les deux révisions de recette ; seule la seconde renforce les assertions de visibilité. Ces nombres ne s'additionnent pas comme des parties ou des contrôles uniques. Aucune nouvelle mesure d'équilibrage.

À faire avec de vraies personnes : essai du nouvel APK sur S24, tactile et TalkBack, relecture anglaise, compréhension des carnets et limites de copains, disponibilité/qualité vocale. Les sujets hérités restent distincts : aide longue, petites actions secondaires, explication du groupe médical et indice de défilement des résultats. La variété visuelle du motif des36autocollants est un retour à recueillir, pas une nouvelle règle.

## Arbitrages de cadrage

1. Le mandat explicite et l'autonomie ont permis de réaliser les huit points après la seule clarification nécessaire, sans nouvelle validation de conception. Les choix d'interface restent révisables après l'essai.
2. Le parent a choisi des carnets séparés avec campagne familiale partagée. Une campagne entièrement indépendante par enfant demanderait un autre lot.
3. Noms ET annonces restent exactement français dans l'anglais, conformément à la consigne directe qui prime sur le point 6 historique ; ces passages français sont donc volontaires.
4. STOP privé : branche de revue, pas de fusion ni publication du site ; le site reste en 0.35.0.
5. Pour les anciens camps à caprice6/7, les choix non enregistrés restent vides : aucune déduction depuis les unités vivantes ou mortes. Un choix historique absent du fichier ne peut pas être récupéré ; le schéma8 le conserve explicitement.
6. Les aides du workflow disponibles comme ressources cloud ont été remplacées par des briefs, paquets de revue et registre locaux équivalents, archivés ; la différence porte sur l'orchestration, pas le jeu.
7. Une hypothèse initiale d'exclusion des étoiles de caprice a été corrigée avant livraison : les étoiles familiales conservent exactement la progression existante, y compris les victoires en caprice. Seuls les autocollants sont individuels.
