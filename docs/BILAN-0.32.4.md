# Étape 3 — icône Android et identifiant, 0.32.4

8 novembre 2026, Europe/Zurich. GO du parent après la publication0.32.3.
Base be874fb ; branche locale fix/android-icon-0324, worktree conservé dans
/workspace/conquete-serpents-0322. **Étape livrée ; STOP pour le choix du parent.**

## Constats, réalisation et preuves

| Constat / demande                      | Fait / pas fait                                                                                                                                  | Preuve                                                                                                                                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Icône encore Capacitor                 | **Fait** : l'illustration Magnific retenue remplace les ressources de lanceur dans l'APK                                                         | [Original et manifeste](../resources/android-icon/manifest.json), [inspection du binaire](../reports/suivi-0.32.4/apk.json) ; android/app/src/main/AndroidManifest.xml:6, mipmap-anydpi-v26 et v33              |
| Fond uni et coins blancs               | **Fait** : personnages détourés depuis l'image existante, fond #214C3B ; aucun coin blanc dans les exports ; cinq densités legacy et adaptatives | [Avant](../reports/suivi-0.32.4/icon-before.json), [après](../reports/suivi-0.32.4/icon-after.json) ; valeurs ic_launcher_background.xml, 20PNG de lanceur                                                      |
| Icône adaptative dans l'APK            | **Intégration vérifiée**, rendu physique S24 encore à confirmer : PNG décodés de l'APK et XML compilés contrôlés, aperçus de masques inspectés   | [Aperçu circulaire](captures-0.32.4/circle.png), [carré arrondi](captures-0.32.4/rounded-square.png), [lecture à48dp agrandie](captures-0.32.4/launcher-48dp.png), [reçu APK](../reports/suivi-0.32.4/apk.json) |
| Trois identifiants définitifs proposés | **Propositions faites, aucun nouvel identifiant appliqué** ; choix du parent attendu                                                             | [Comparatif](IDENTIFIANTS-APPLICATION.md), [fichiers d'identité inchangés](../reports/suivi-0.32.4/identifiers.json)                                                                                            |
| Règles, sauvegardes, anciens codes     | **Conservés** : aucun changement src/, public/, index.html, activité, manifeste Android ou configuration Capacitor ; même certificat et paquet   | Diff applicatif vide sur ces chemins depuis be874fb ; 425 tests, dont les témoins de départ et formats anciens ; certificat comparé sur les deux APK                                                            |

## Utilisation des ressources fournies

Original : docs/resources-2026-11/assets/icone-source.png, 2048×2048 RGB,
SHA256 **c2abce33a9f375a9c1687ce099501a856c78c130cdad5b39f5c0d35152079386**,
identique au téléchargement conservé. Aucun original retouché et aucune nouvelle
illustration générée, aucun appel à une API d'image ou de vidéo.

Le fichier source avait un fond vert photographique et des coins blancs opaques.
Un détourage local retire ce fond et conserve les pixels des deux personnages,
de l'épée et du cristal ; les contours sont légèrement antialiasés. Le résultat
est composé sur une couche Android unie #214C3B. Ce traitement est un export de
l'illustration retenue, pas un changement de personnage ou de direction artistique.
Les terrains crue et marais restent hors du runtime et hors de cette étape.

L'outil facultatif scripts/export-android-icon.py est séparé du jeu. OpenCV4.12,
NumPy2.2.6 et Pillow12.3 servent uniquement à l'export local ; ils ne sont pas des
dépendances de l'APK, du moteur ou du build web. Les masques et la graine324 sont
fixes ; une deuxième exécution reproduit les20PNG de ressources octet pour octet.
[Preuve de réexport](../reports/suivi-0.32.4/reexport.json).

Les dérivés et empreintes figurent dans resources/android-icon ; l'image512 est
préparée pour réutilisation ultérieure, sans publication sur le store. Les cinq
densités fournissent des icônes legacy48–192px et des couches108–432px. Les
couches monochromes sont disponibles pour les thèmes Android13+, sans ancienne
silhouette Capacitor. Les deux vecteurs de départ devenus inutilisés sont retirés.
Les images de splash restent un sujet distinct et ne sont pas retouchées.

## Cadrage et contrôle visuel

Canvas adaptatif108dp, illustration72dp centrée à18dp ; fond fourni par une
couleur, sans coins peints à la main. Android choisit son masque final.
Les centres des yeux et la pointe de l'épée ont été repérés dans l'image et
restent dans le disque central de66dp ; ce sont des repères approximatifs,
complétés par une inspection visuelle, pas une certification de tous les lanceurs.
Le bas du serpent et du socle peut être recadré par un masque circulaire.

Les aperçus sont produits depuis les mêmes ressources et montrent un cercle,
un carré arrondi et la version48dp agrandie sans ajouter de détail. La relecture
indépendante ne relève pas d'artefact grossier de détourage ou de coin blanc.
**Ce ne sont pas des captures d'un téléphone Android.** Aucun appareil n'est
connecté à ADB ici : masque OneUI, palette d'icônes et cache du lanceur restent à
confirmer sur le S24 du parent. Ne pas présenter le contrôle du binaire comme un
test physique réussi.

## Identifiants proposés — choix en attente

| Proposition                                   | Avantage principal                                                                                      | Inconvénient principal                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **com.conqueteserpents.famille — recommandé** | Identité déjà utilisée par les APK familiaux ; aucune migration de paquet pour les mises à jour de test | Nom centré sur ce jeu familial plutôt qu'une gamme de studio                            |
| io.github.zyclope0.conqueteserpents           | Namespace associé au compte GitHub existant zyclope0                                                    | Long et lié à ce pseudonyme ; autre installation Android                                |
| com.zyclope.conqueteserpents                  | Présentation courte sous une marque de studio                                                           | Rattachement au domaine et disponibilité Play non vérifiés ; autre installation Android |

[Avantages, limites et transition](IDENTIFIANTS-APPLICATION.md). Ces propositions
ne sont pas des réservations Play. Fixer le choix avant le premier envoi du
paquet ; changer d'identifiant impose une autre application, pas une mise à
jour de sa fiche existante. Le nom affiché du jeu reste inchangé.

L'APK livré conserve **com.conqueteserpents.famille**, le namespace, l'activité
et le certificat actuels. Aucun identifiant nouveau n'est appliqué et aucun
fichier de sauvegarde n'est migré. Un futur changement de clé de signature Play
reste distinct du choix de paquet : conserver le paquet seul ne permet pas de
mettre à jour un APK debug signé avec une autre clé.

## Vérifications exécutées

| Commande / contrôle       | Résultat                                                                                                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| npm test sur la base      | 425/425                                                                                                                                                   |
| npm run verify            | **425/425, zéro échec** ; types, formatage, build et budgets OK                                                                                           |
| npm run test:browser      | Deux parcours principaux ordinateur/mobile et deux tailles de tablette ; zéro erreur JavaScript                                                           |
| Exports graphiques        | 20PNG : dimensions, empreintes et transparence contrôlées ; 4XML adaptatifs et fond contrôlés                                                             |
| Réexport local            | 20/20 PNG reproduits octet pour octet                                                                                                                     |
| npm run android:apk:debug | Réussi ; assemblage final normal offline après la remise à zéro de la configuration de diagnostic du script                                               |
| Inspection de l'APK final | 20PNG décodés et comparés aux ressources ; 4XML compilés parsés ; fond #FF214C3B trouvé dans les ressources binaires ; identifiant et signature conservés |
| Relecture indépendante    | Aucun finding ; aperçu et ressources contrôlés, aucun build ou essai physique délégué                                                                     |

Le chemin Gradle temporaire produit par cap sync et le lien de dépendances du
worktree est remis au chemin relatif portable d'origine avant livraison. Les
rapports de recettes précédentes et les originaux sont conservés. Aucun test
unitaire redondant n'a été ajouté pour les PNG générés ; les contrôles portent
sur les fichiers réels et l'APK réel. Le total natif reste425.
[Journaux et reçu consolidé](../reports/suivi-0.32.4/verification.json).

## Livrable et limites

APK **0.32.4/code39**, 13 599 865 octets, SHA256
**19f73573401ad1cbab39b79f55aff96a2e78a5138336d0be24584481800e1190**.
Même certificat SHA256 que0.32.3 :
d018e28e8ab916b4cb46ef53e2c696079415304be87cb0cf90662df94598d599.
Les27fichiers web embarqués correspondent exactement au build vérifié.
Démarrage normal sans surcouche FPS, sensorLandscape conservé, aucune permission
INTERNET ajoutée. Les PNG natifs ajoutent environ493Ko au paquet ; les images
sources haute définition restent hors de l'APK et le code du jeu est inchangé.

Le site public reste en0.32.3 ; aucun déploiement web ou Play de l'étape3.
Ni achat, SDK publicitaire, serveur, langue ou nouveau niveau ajouté.
L'étape4 documentaire n'est pas commencée. Le rendu du lanceur physique et la
disponibilité Play des identifiants n'ont pas pu être vérifiés ici.

Fichiers : ressources mipmap/values Android, anciens vecteurs inutilisés retirés,
android/app/build.gradle, package.json et package-lock.json pour la version ;
scripts/export-android-icon.py, resources/android-icon, IDENTIFIANTS-APPLICATION.md,
IMPLEMENTATION-0.32.4.md, ce bilan, PLAN-ACTUEL.md, le suivi de ressources et les
preuves dans docs/captures-0.32.4 et reports/suivi-0.32.4. Les chemins détaillés et
les empreintes des exports sont dans le manifeste.

**STOP : le parent choisit l'identifiant et vérifie l'icône sur son S24.** Aucun
choix ni GO de l'étape4 ne sera déduit de la réalisation de l'icône.
