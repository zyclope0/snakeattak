# Android — état de la version 0.25

Le projet natif porte versionName 0.25.0 et versionCode 25. Les nouveaux assets
2D restent locaux, dans le build web embarqué. Voir le rapport de vérification
0.23 pour la synchronisation de cette livraison. Aucun APK/AAB compilé ou
appareil physique testé n’est revendiqué.

## Préparation initiale Android — 0.21

Le projet contient une enveloppe Android Capacitor 8.6.0. Elle embarque le build
web local dans une WebView : Phaser, les images, les polices et la simulation
restent sur l'appareil. Ce dossier prépare un futur essai Android ; aucun APK,
émulateur ou téléphone n'a été testé dans cet environnement.

## Refaire les fichiers embarqués

Depuis la racine, avec Node 24 et les dépendances du verrou :

```sh
npm ci
npm run android:sync
```

`android:sync` compile le site puis exécute `cap sync android`. Il faut le refaire
après chaque modification web. Un simple `npx cap sync android` copie le dernier
`dist/` existant sans le reconstruire : il peut donc embarquer une ancienne
version. Ne pas exécuter `cap add android` à nouveau : `android/` existe déjà.

Configuration : `capacitor.config.ts`, `webDir: 'dist'`, identifiant **provisoire**
`com.conqueteserpents.famille`, nom `La Conquête des Serpents`. Pas de `server.url`
ni d'adresse de site de production : le contenu provient des assets de l'app.
L'origine locale virtuelle de Capacitor n'est pas un serveur distant de gameplay.
L'export `dist-portable/` reste une livraison web séparée.

## Outils nécessaires pour compiler

| Outil ou réglage               | Version de ce projet                                              |
| ------------------------------ | ----------------------------------------------------------------- |
| Node                           | 24.x, contrainte du projet ; Capacitor 8 accepte ≥22              |
| Capacitor core / CLI / Android | 8.6.0, versions exactes dans le verrou npm                        |
| Android Studio                 | Otter 2025.2.1 ou plus récent, minimum documenté pour Capacitor 8 |
| JDK                            | 21, requis par la compilation Java de Capacitor                   |
| Android SDK Platform           | API 36 pour compiler ce projet                                    |
| SDK minimum de l'application   | API 24, Android 7                                                 |
| SDK de compilation / cible     | 36 / 36                                                           |
| Android Gradle Plugin          | 8.13.0                                                            |
| Wrapper Gradle                 | 8.14.3, fourni dans `android/`                                    |
| Version native                 | `versionName "0.25.0"`, `versionCode 25`                          |

Installer Android Studio et le SDK via son SDK Manager, dont Platform API 36,
les Build Tools requis par AGP et les Platform Tools pour un téléphone. Android
Studio fournit son JDK ; vérifier que le Gradle JDK sélectionné est Java 21.
Les dépendances Gradle nécessitent un accès réseau lors de leur premier
téléchargement. Elles ne deviennent pas des services utilisés par une partie.

```sh
npm run android:open
```

Android Studio ouvre le dossier `android/`. Sélectionner ensuite un téléphone
de test ou un émulateur configuré. En ligne de commande, une fois le SDK et le
JDK configurés, `./gradlew assembleDebug` depuis `android/` construit l'APK de
développement. Cette commande n'a pas été exécutée ici : le SDK Android est
absent. Aucun SDK volumineux n'a été installé pour cette préparation.

API 24 est le minimum natif du conteneur, pas une preuve que toutes les anciennes
WebView exécutent le JavaScript ES2022 et le rendu de ce jeu. Tester un Android
récent avec WebView à jour, puis définir le parc réellement supporté à partir
des essais.

## Données et permissions

Le manifeste applicatif ne demande aucune permission Android ; la permission
`INTERNET` du modèle a été retirée. Il faut notamment vérifier le lancement
réel hors connexion sur un appareil avant de considérer ce choix validé.
Aucun plugin caméra, micro, localisation, publicité, statistiques, compte ou
Google Services n'est ajouté. `allowBackup="false"` désactive la participation
à la sauvegarde automatique Android via ce réglage du manifeste.

Le stockage web de la WebView est distinct du navigateur : installer l'app ne
retrouve pas automatiquement les profils du site. L'import/export familial
existant reste le format d'échange prévu, mais son sélecteur de fichiers et son
téléchargement doivent être essayés dans la WebView. Aucun plugin natif de
stockage ou partage n'a été ajouté. Une désinstallation ou un effacement des
données peut supprimer les sauvegardes locales.

## Vérifications effectuées et limites

Le 5 novembre 2026 : installation npm exacte 8.6.0 sous Node 24.19.0/npm 11.9.0,
génération Android réussie depuis le `dist/` 0.20 existant, puis `cap sync android`
réussi. Les fichiers web copiés ont été comparés au build source par empreinte,
la configuration locale et les versions Gradle/SDK ont été contrôlées. Le build
web 0.21 final a ensuite été synchronisé : les 26 fichiers de distribution sont
identiques par SHA256 à ceux embarqués, et cap doctor réussit. Ce contrôle ne
compile pas un APK. La preuve est dans reports/verification-0.21.json.
Java 21 est présent ; Android Studio, SDK et adb ne sont pas disponibles.

Pas de compilation APK/AAB, de signature, d'installation, de test GPU Android,
de validation du manifeste fusionné par Gradle ou de publication Play réalisée.
Les icônes natives sont encore celles du modèle Capacitor.

Avant une diffusion : tester tactile/petits écrans, zones des barres système,
bouton Retour Android, rotation, pause/reprise après mise en arrière-plan, son,
performances/chauffe, refus du stockage, import/export et conservation des camps
entre redémarrages. Vérifier le démarrage en mode avion et l'absence de permission
inutile dans le manifeste fusionné. Le changement de focus natif doit notamment
être évalué sur appareil : aucun cycle de vie natif supplémentaire n'est promis.

Pour Google Play, il restera à fixer l'identifiant définitif, remplacer les
icônes, préparer et protéger la clé de signature hors dépôt, construire un AAB
signé, ouvrir/configurer Play Console, renseigner audience/classification et
déclarations de données, puis effectuer les tests requis et vérifier les règles
de cible SDK alors en vigueur. Ces opérations ne sont pas faites ici. Les clés,
keystores, fichiers locaux de SDK et sorties APK/AAB sont ignorés par Git.

## Sources officielles consultées

Documents **Capacitor 8** consultés le 5 novembre 2026, et non la branche courante
de la documentation qui peut déjà décrire une autre version :

- [Environnement Capacitor 8](https://github.com/ionic-team/capacitor-docs/blob/main/versioned_docs/version-v8/main/getting-started/environment-setup.md)
- [Réglages Android / migration vers 8](https://github.com/ionic-team/capacitor-docs/blob/main/versioned_docs/version-v8/main/updating/8-0.md)
- [Exécution Android Capacitor 8](https://github.com/ionic-team/capacitor-docs/blob/main/versioned_docs/version-v8/main/android/index.md)
- [Sources Capacitor 8.6.0 et configuration](https://github.com/ionic-team/capacitor/tree/8.6.0)
- [Documentation Android Studio](https://developer.android.com/studio)

Les exigences SDK/Gradle/Java sont également lisibles dans `android/variables.gradle`,
`android/build.gradle`, `android/gradle/wrapper/gradle-wrapper.properties` et le
fichier `android/app/capacitor.build.gradle` régénéré par la synchronisation.
