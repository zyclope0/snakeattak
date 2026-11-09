# Bilan 0.36.0 — caprices et carnets

9 novembre2026 (Europe/Zurich). Candidate privée0.36.0/code46, arrêt pour essai du parent.
Les36défis existants deviennent accessibles sans modifier le moteur, leurs
valeurs, leurs noms, leurs annonces ou le RNG. Le site public et `main` restent
sur0.35.0 ; aucune fusion ou publication dans cette livraison.

| Point          | Fait / pas fait                                                                                                            | Preuve                                                               |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1. Préparation | Fait : deux rangées, étoiles, annonce et règles, relance du même caprice                                                   | [Recette](../reports/suivi-0.36.0/caprices.json), captures FR/EN     |
| 2. Copains     | Fait : choix vide/partiel/complet facultatif, conseil cohérent et vrais recrutements permis ; massues initiales conservées | 8 tests de lecture, régression R1 FR/EN, recette native              |
| 3. Sauvegarde  | Fait : checkpoint8 conserve caprice et choix ; lecture1–7 conservée                                                        | Tests et reprise hors ligne explicite                                |
| 4. Carnets     | Fait : 36cases par enfant, autocollant idempotent ; propriétaire du départ retenu au réessai/rechargement                  | Une victoire native attribuée à A alors que B est actif ; enveloppe4 |
| 5. Codes       | Fait : code3 avec caprice, portes mission/caprice ; anciens codes1/2 sans caprice                                          | Recettes caprices, départs, tests et lancement hors ligne            |
| 6. Langues     | Fait selon dernière instruction : noms ET annonces exactement français en FR/EN, contexte traduit                          | Inventaire et captures FR/EN ; voix locale facultative               |
| 7. Résultat    | Fait : vrai autocollant gagné, répétition reconnue, annonce française à la défaite                                         | Victoire native ; répétition/défaite contrôlées                      |
| 8. Créateur    | Fait : deuxième rangée, total/réserve/dépensable, achats protégés, coquille agrandie au rendu                              | Réserve568/812/1280 contrôlée, carapaces Canvas/WebGL                |

La campagne et les étoiles restent partagées dans la famille. Les carnets locaux
ne sont pas des profils de combat :1–8enfants, noms de24caractères au plus,
36cases par carnet, aucun classement. Un changement de carnet ne réattribue pas
une expédition retenue ; un nouveau départ préparé prend le carnet actif.

L’enveloppe familiale4 remplace aussi les carnets à l’import. Une enveloppe1–3
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
392contrôles navigateur et24contrôles d’adaptateurs ; inventaire915phrases,
946entrées anglaises, aucune manquante. Les recettes sont exécutées en série ; aucun build ne
remplace les fichiers pendant une recette de production. L’audit historique est
restauré octet pour octet après copie du résultat actuel dans ce suivi.

Les vues couvrent1280×800,1366×768,812×375,780×360,568×320 avec marges et
375×812 portrait. Les boutons de préparation et fermeture de carnet après
scroll sont mesurés à48px. Les vues de réserve, carapaces et résultats forcés
sont explicitement contrôlées. Le parcours natif utilise une progression
familiale contrôlée, puis de vraies commandes et le vrai moteur pendant trois
vagues de Refuge, graine42, trio initial : victoire à73% de cristal et2étoiles.
Ce n’est ni une séance enfant ni une
validation physique Android. Le contrôle hors ligne dédié reprend explicitement
le checkpoint8 et le propriétaire A avec carnet B actif, puis lance un code3 ;
quatre contrôles passent avec26fichiers locaux et réseau coupé. Le portable
FR/EN démarre depuis `file://`, ouvre le carnet et joue/pose une pause tutorielle
sans requête HTTP ; le build normal reste identique.

Les empreintes des trois sources figées et les36définitions complètes sont
comparées à `c886b82` dans
[source-freeze.json](../reports/suivi-0.36.0/source-freeze.json).
Aucun nouvel échantillon d’équilibrage n’est annoncé ; les3888parties du document
historique restent leurs mesures antérieures. Le HTML normal reste31 771octets,
bootstrap139 024, règles81 921, anglais70 957 et Phaser1 481 792octets ; les
plafonds sont respectés. Les ressources restent séparées dans le build normal.

Coquille et autocollants sont des dessins originaux procéduraux/SVG dans le code
(`src/render/capriceShell.ts`, `src/ui/capriceAlbums.ts`), sous les droits du projet.
Aucun service de génération, image payante ou téléchargement nouveau.

L’APK debug normal est `/workspace/conquete-serpents-v0.36.0-debug.apk`.
L’inspection paquet/signature/fichiers est conservée dans le suivi. Même appID
provisoire, même certificat debug, orientation paysage capteur, libellé anglais
Snake Attack TD et français conservé ; configuration serveur diagnostic absente.
L’APK précédent0.35.0 est préservé. Sources de l’APK :
`673481f345b4c8790f1407ac13292155b0e80ba1` ; les changements ultérieurs
de livraison ne concernent que documents, rapports et captures.

[Le conseil final](CONSEIL-0.36.0.md) et la revue fraîche de toute la branche
restent à compléter par le coordinateur. Les revues approuvées des tâches1/2/3
et de R1 sont archivées dans le suivi, avec les limites des anciennes preuves.
À faire avec de vraies personnes : essai du nouvel APK sur S24, relecture anglaise,
compréhension des carnets et des limites de copains, disponibilité/qualité vocale.
Mineurs hérités conservés : aide longue, petites actions secondaires, explication
du groupe médical et indice de défilement des résultats. Aucun nouveau mineur
produit identifié par cette seule passe de livraison ; le conseil reste ouvert.
