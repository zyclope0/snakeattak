# Android — version 0.32.1

VersionName 0.32.1, versionCode 36 : correction du défilement tactile du
catalogue en paysage. Même identifiant et certificat debug ; mise à jour
par-dessus la précédente. Voir BILAN-0.32.1.md ; confort S24 à confirmer.

## Version précédente — 0.32.0

VersionName 0.32.0, versionCode 35. Préparation illustrée et dangers de vague ;
aucun changement de règles ou de sauvegarde. Recette et livraison dans
BILAN-0.32.md. Aucun AAB ou SDK commercial implicite.

## Version précédente — 0.31.0

VersionName 0.31.0, versionCode 34. Dock permanent de quatre alliés, miel au
toucher des chemins et catalogue adjacent. APK familial sans diagnostic au
démarrage, certificat debug conservé. Voir BILAN-0.31.md. Les essais navigateur
ne valident pas les performances ni le cycle de vie physique du S24.

## Correctif précédent — 0.30.2

VersionName 0.30.2, versionCode 33, paysage `sensorLandscape`. La pause
d'interruption est conservée après retour en paysage ou fermeture d'un dialogue.
Tests en navigateur : pause et temps réel du moteur, empilement des pauses,
sortie/retour de page, démarrage caché, paquet embarqué chargé sans réseau,
reprise du dernier camp et lecture des formats 1 à 7. Voir BILAN-0.30.2.md.

Ces simulations ne remplacent pas les mesures ni le cycle de vie physique du
S24. Les preuves 0.30.1 ci-dessous restent historiques. Aucun AAB Play signé,
SDK commercial ni cache hors ligne du site web n'est ajouté.

## Correctif mobile précédent — 0.30.1

VersionName 0.30.1, versionCode 32, paysage `sensorLandscape`. Le parent a testé
la 0.30.0 sur Galaxy S24 Ultra SM-S928B/DS (Android 17, One UI 9.0 déclarés) :
les enfants apprécient le jeu, mais les barres système chevauchent les commandes
et le tiroir masque trop le terrain. Le correctif 0.30.1 traite ces deux points.

APK familial debug compilé sans compteur de performances au démarrage, signature
identique à la 0.30.0 ; mise à jour par-dessus possible. Les 27 fichiers web sont
identiques au build testé. Configuration normale sans `server` ; SystemBars
expose explicitement les marges CSS. Voir reports/verification-0.30.1.json.
Le script de diagnostic décrit plus bas garde son démarrage volontaire `/?perf=1`.

Le correctif doit encore être retesté sur le téléphone. Aucun résultat FPS/RAM
physique, émulateur Android 17 ou AAB Play signé n'est revendiqué.

## Préparation initiale Android — 0.21

Le projet contient une enveloppe Android Capacitor 8.6.0. Elle embarque le build
web local dans une WebView : Phaser, les images, les polices et la simulation
restent sur l'appareil. Lors de cette préparation initiale0.21, aucun APK,
émulateur ou téléphone n’avait encore été testé ici. L’état courant est décrit
en tête de ce document.

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
| Version native                 | `versionName "0.30.1"`, `versionCode 32`                          |

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
développement. La version 0.27.1 a été compilée ici après installation isolée du JDK21 complet
et du SDK36 ; voir reports/verification-0.27.1.json. Ces outils ne sont pas
embarqués dans le jeu.

API 24 est le minimum natif du conteneur, pas une preuve que toutes les anciennes
WebView exécutent le JavaScript ES2022 et le rendu de ce jeu. Tester un Android
récent avec WebView à jour, puis définir le parc réellement supporté à partir
des essais.

## Données et permissions

Le manifeste source ne demande aucune permission Android ; le manifeste fusionné
ajoute la permission privée de niveau signature DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION
pour les récepteurs de la bibliothèque AndroidX. Aucune permission réseau ; la permission
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
État initial0.21 : Java21 présent, SDK/adb absents. Le lot 4 installe ensuite
un JDK complet, le SDK36 et adb dans un répertoire de travail ; Studio reste absent.

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

## Lot 4 — protocole famille, 0.27.1

Le compteur est disponible sur le build de production avec `?perf=1`. Sans cette
option il n’est pas créé. L’option historique `?debug-performance` reste réservée
au serveur de développement. Aucun envoi de mesure, aucune statistique en ligne.

### Compiler sous Windows

1. Installer Node 24, Android Studio avec JDK21, Platform API36, Build Tools36 et
   Platform Tools. Configurer JAVA_HOME vers le JDK21 complet et ANDROID_HOME vers
   le SDK (souvent `%LOCALAPPDATA%\Android\Sdk`).
2. Extraire le projet dans un dossier local, ouvrir PowerShell : `npm ci`.
3. `npm run android:apk:debug` reconstruit le web, synchronise Capacitor avec
   un démarrage local `/?perf=1`, compile `assembleDebug`, copie l’APK dans
   `artifacts/android/`, puis rétablit la configuration normale. Aucun server.url.
4. Activer Options développeur / Débogage USB sur le téléphone, accepter sa
   connexion, vérifier `adb devices`, puis `adb install -r chemin\vers\le-debug.apk`.
   L’APK debug est destiné aux essais ; ce n’est pas un AAB signé pour Play.

La clé debug est locale à la machine de compilation. Une autre clé peut empêcher
la mise à jour d’une ancienne installation debug ; exporter les sauvegardes
avant toute désinstallation. Aucune clé privée n’est incluse dans le projet.

### Relever la performance

- Noter modèle, Android, WebView, écran/fréquence, mode batterie et température
  perçue. Fermer les autres applications ; conserver une condition comparable.
- Dans Relevé, Recommencer la mesure juste avant chaque scénario, puis Fermer.
- Mission6 : jouer au moins deux minutes dont une vague chargée ; relever la
  durée et la situation. Classique : faire un relevé distinct sur la vague 12.
  Ne pas substituer une partie en navigateur cloud à ces essais.
- Ouvrir Relevé : copier le JSON par Sélectionner le relevé puis copie Android,
  ou prendre une capture lisible. Compléter `reports/android-device.json`.
- Le minimum est celui des fenêtres complètes d’au moins une seconde, pas le
  FPS instantané d’une seule image. La plus longue image est relevée séparément.
  Les pauses et onglets masqués ne contribuent pas ; une fenêtre incomplète ne
  donne pas de FPS. Les 3600 dernières fenêtres bornent le stockage des mesures.
- Mémoire : JS heap quand WebView l’expose ; sinon null. Ce n’est jamais la RAM
  totale d’Android. Pour le total processus, utiliser Android Studio Profiler ou
  `adb shell dumpsys meminfo com.conqueteserpents.famille`, en indiquant sa source.
- Le temps de chargement couvre la dernière préparation d’assets du plateau,
  pas le temps complet installation→premier écran. Tester aussi un démarrage
  à froid en mode avion, bouton Retour, rotation, arrière-plan et sauvegardes.

Si la vague chargée reste sous30 FPS, prioriser selon des mesures avant/après :

1. rendu des effets/contours, 2. résolution adaptée au devicePixelRatio,
2. cadence des mises à jour UI et allocations. Ce sont des pistes, pas des
   optimisations affirmées rentables sans le relevé.

La validation physique de ce lot reste en attente de la famille.
