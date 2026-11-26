# Sécurité des données — brouillon v2, non soumis

26 novembre 2026. Pour l'application **0.41.0 / build 65**, gratuite, sans publicité ni achat.
**Ce n'est pas une déclaration.** C'est le parent qui remplit le formulaire dans la Play
Console, sous sa responsabilité. Le brouillon v1 (modèle avec publicité et achats, abandonné le
18 novembre 2026) reste lisible : [SECURITE-DES-DONNEES-V1.md](SECURITE-DES-DONNEES-V1.md).

## Ce que le dépôt montre

- Aucun SDK publicitaire, de facturation, de mesure d'audience ou de rapport de panne dans
  `package.json` ni dans les fichiers Gradle (`npm run store:check` le contrôle).
- Trois modules natifs officiels de Capacitor : `@capacitor/app` (bouton retour),
  `@capacitor/filesystem` et `@capacitor/share` (export du fichier familial). Leurs
  manifestes sont vides ([ANDROID-BUILD-65.md](../ANDROID-BUILD-65.md)).
- Le manifeste source (`android/app/src/main/AndroidManifest.xml`) ne demande **aucune
  permission**, pas même INTERNET. `allowBackup="false"`.
- Aucun compte de joueur, aucun serveur du projet. Les profils, surnoms facultatifs,
  progression et réglages restent sur l'appareil (politique publiée).
- L'export : l'adulte répond à une question, le jeu écrit le fichier dans le cache de
  l'application, puis ouvre le partage d'Android ; l'adulte choisit l'application qui le
  reçoit (Drive, Fichiers, e-mail…). Le jeu ne l'envoie à personne de lui-même.

## Ce que le dépôt ne montre pas — à vérifier sur le build exact

Ces points décident des réponses. Tant qu'ils ne sont pas relevés, **ne pas cocher « aucune
donnée collectée » comme un fait acquis.**

1. **Manifeste fusionné de l'AAB envoyé** : la liste complète des permissions après fusion
   des bibliothèques (AndroidX, Capacitor, les trois modules). Attendu d'après
   [ANDROID.md](../ANDROID.md) : aucune permission réseau, seulement la permission privée
   `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` d'AndroidX. Absence à vérifier de
   `android.permission.INTERNET`, `ACCESS_NETWORK_STATE` et `com.google.android.gms.permission.AD_ID`.
2. **Trafic réseau** de l'application installée depuis Play : au premier lancement, pendant
   une partie, à l'export, au retour au premier plan. Attendu : aucune requête émise par
   l'application elle-même. Le trafic du Play Store et des services Google est séparé.
3. **Ce que Google ajoute à la distribution** : la politique publiée parle d'un contrôle de la
   provenance de l'installation par Google Play, qui peut demander une connexion. Vérifier
   dans la Console s'il est actif, et lire ce que Google dit sur la façon de le déclarer.
4. **`capacitor.plugins.json`** du build ne nomme que les trois modules.
5. **Le build envoyé est bien le build vérifié** : même versionCode, même source.

## Réponses proposées, si les vérifications confirment ce qui est attendu

| Question du formulaire                                                   | Proposition prudente                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L'app collecte-t-elle ou partage-t-elle des données des types demandés ? | Probablement « Non » : sans permission INTERNET, l'application ne transmet rien hors de l'appareil d'elle-même. À confirmer par les points 1 à 3. Lire la définition de Google : la « collecte » est une transmission hors de l'appareil                                          |
| L'export par le partage d'Android                                        | L'adulte choisit le fichier, le moment et l'application destinataire. Lire dans l'aide de Google le cas des transferts lancés par l'utilisateur, où il s'attend à ce que les données partent vers le service qu'il choisit, avant de répondre. Ne pas l'oublier dans la réflexion |
| Chiffrement en transit                                                   | Sans objet si rien n'est collecté ; à revoir si une transmission apparaît                                                                                                                                                                                                         |
| Suppression des données                                                  | Sans objet si rien n'est collecté. Localement : supprimer un profil dans « Pour les parents », ou effacer les données de l'application dans les réglages Android (politique publiée)                                                                                              |
| Création de compte                                                       | Aucun compte dans l'application                                                                                                                                                                                                                                                   |
| Public enfant                                                            | Le programme Familles exige une déclaration exacte ; elle doit dire la même chose que la politique publiée                                                                                                                                                                        |

Si une seule de ces vérifications révèle une transmission (une permission réseau ajoutée par
une bibliothèque, une requête au démarrage), **tout est à reprendre** : catégorie de données,
destinataire, finalité, caractère obligatoire, chiffrement, conservation. Ne pas inventer de
durée de conservation.

## Hors de l'application

- Le **site Web** (hébergeur, encart publicitaire Google sur grand écran, lien de soutien) a
  ses propres traitements, décrits dans la politique publiée. Ils ne relèvent pas du
  formulaire de l'application.
- Le **groupe Google des testeurs** : le parent voit les adresses e-mail des membres. Ce n'est
  pas une donnée collectée par l'application ; la politique publiée le dit.

## Quand c'est fait

Noter dans `configuration.json` : `review.mergedManifestAndTrafficReviewed` après les relevés,
puis `legal.dataSafetyCompleted` une fois le formulaire envoyé par le parent. Garder les
relevés dans `artifacts/`, hors Git, sans identifiant d'appareil ni adresse e-mail.

Source : [formulaire Sécurité des données](https://support.google.com/googleplay/android-developer/answer/10787469),
consulté le 8 novembre 2026 pour l'ancien modèle ([sources.json](sources.json)) ; à relire au
moment de remplir.
