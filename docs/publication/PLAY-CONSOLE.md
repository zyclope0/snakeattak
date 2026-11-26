# Marche à suivre dans la Play Console — pour le parent

État au 26 novembre 2026, pour l'application gratuite **sans publicité ni achat** (décision du
parent, 17 et 18 novembre 2026). Rien de ce qui suit n'a été fait par Claude : aucun accès à la
Console, aucun envoi, aucune attestation. Les intitulés de la Console changent parfois :
suivre ceux qu'elle affiche, et relire les pages d'aide de Google au moment de remplir.

Où on en est, d'après [PLAN-ACTUEL.md](../PLAN-ACTUEL.md) : compte développeur personnel
actif ; piste de test fermé « Alpha » créée le 20 novembre (groupe `snakeattack-testeurs`) ;
build 63 promu dans « Alpha » le 20 novembre ; build 64 sur le téléphone du parent le
22 novembre, sa promotion dans « Alpha » n'est pas notée ; build 65 (0.41.0) préparé dans
`main`, son envoi n'est pas noté.

## 1. Compte et identité

- Confirmer le **nom de développeur** et l'**adresse de contact publique** affichés sur la
  fiche. La politique publiée nomme un éditeur et une adresse (`src/i18n/privacyPolicy.ts`,
  `src/site.ts`) : vérifier que la Console dit la même chose.
- Confirmer le type de compte (personnel) et que la vérification d'identité est terminée.
- Puis renseigner `publisher` dans `configuration.json` (`name`, `email`, `accountType`,
  `accountVerified`). Rien n'y est inventé aujourd'hui.

## 2. Contenu de l'application (« App content » / « Contenu de l'application »)

| Rubrique                                               | Réponse proposée, à confirmer par le parent                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Règles de confidentialité                              | URL : **https://snakeattacktd.com/confidentialite**. Vérifier avant que la page en ligne nomme la version envoyée (0.41.0, build 65) : voir [CONFIDENTIALITE.md](CONFIDENTIALITE.md)                                                                                                                                                                                                                                  |
| Annonces                                               | « Non, mon application ne contient pas d'annonces. » L'encart du site Web ne fait pas partie de l'application                                                                                                                                                                                                                                                                                                         |
| Accès à l'application                                  | Tout est accessible sans identifiant ni compte. La question pour adulte avant l'export (une multiplication) n'est pas une connexion : la mentionner dans les instructions si la Console le demande                                                                                                                                                                                                                    |
| Public cible et contenu                                | **Décision du parent.** Le jeu vise les 6 à 10 ans ; les tranches de la Console sont plus larges (par exemple 6–8 et 9–12). Avec un public d'enfants, le programme Familles de Google s'applique. Ne pas cocher d'autres âges pour l'éviter                                                                                                                                                                           |
| Sécurité des données                                   | **À remplir par le parent**, après les vérifications du build exact : [SECURITE-DES-DONNEES-V2.md](SECURITE-DES-DONNEES-V2.md)                                                                                                                                                                                                                                                                                        |
| Classification du contenu                              | Questionnaire IARC, rempli honnêtement par le parent. Aucune note (PEGI ou autre) n'est présumée. Faits utiles : des alliés combattent des serpents, dessinés en pâte à modeler (aucun sang dans les textes ni le code ; à confirmer à l'écran) ; aucun échange entre joueurs, aucun chat ; aucun achat ni hasard payant ; aucune localisation ; un fichier peut être partagé par l'adulte vers une autre application |
| Applications d'actualité, santé, finance, gouvernement | Non concernée                                                                                                                                                                                                                                                                                                                                                                                                         |

Après chaque rubrique terminée, cocher le drapeau correspondant de `legal` dans
`configuration.json` (`dataSafetyCompleted`, `audienceApproved`, `iarcCompleted`), et y noter
`targetAgeGroups` et `contentRating` tels que la Console les donne.

## 3. Fiche principale

- Textes : `fiches.json`, brouillons FR, EN, DE et IT, dans les limites de Google Play. **À
  relire par un humain**, de préférence quelqu'un qui parle l'allemand et l'italien. Chaque
  fiche dit exactement que le jeu est en français et en anglais ; les fiches DE et IT disent
  en plus qu'il n'est pas traduit dans leur langue.
- Titres : « La Conquête des Serpents » en français, « Snake Attack TD » en anglais, comme dans
  le jeu et dans `android/app/src/main/res/values*/strings.xml`. Les fiches DE et IT
  proposent « Snake Attack TD », parce qu'un appareil allemand ou italien ouvre le jeu en
  anglais ; mais son lanceur y affiche « La Conquête des Serpents » (seules les ressources FR
  par défaut et EN existent). **Choix du parent.**
- Catégorie (Jeux, puis Stratégie ou Famille…) et adresse de contact : choix du parent.
- Images : les captures du dossier datent de la version 0.30.1, **à refaire**
  (`npm run build` puis `npm run store:captures`) ; bannière 1024×500 ; icône 512×512 prête
  (`resources/android-icon/icon-512.png`). Relire chaque image face à l'APK envoyé.
- Une fois relues : `status: "reviewed"` dans chaque fiche, puis `localizedCopiesReviewed` et
  `assetsApproved` à `true`. Le contrôle refuse une fiche encore en brouillon si la relecture
  est cochée.

## 4. Le build envoyé

- Construire l'AAB signé du build exact ([ANDROID-BUILD-65.md](../ANDROID-BUILD-65.md)) ;
  vérifier la signature, le paquet, versionCode et versionName.
- Relever le **manifeste fusionné** (permissions) et le **trafic réseau** du build exact, au
  premier lancement, en partie, à l'export : voir [SECURITE-DES-DONNEES-V2.md](SECURITE-DES-DONNEES-V2.md).
- Essayer ce build sur un **téléphone physique** (recette de
  [ANDROID-BUILD-65.md](../ANDROID-BUILD-65.md)).
- Puis `signedAabVerified`, `mergedManifestAndTrafficReviewed` et `physicalAndroidPassed` à
  `true` dans `review`.

## 5. Test fermé puis accès à la production

D'après la page de Google consultée en novembre 2026 (à revérifier) : un compte **personnel**
récent doit mener un test fermé avec **au moins 12 testeurs inscrits sans interruption
pendant 14 jours** avant de demander la production. Google pose ensuite des questions sur le
test ; il peut refuser. Pas de testeurs payés ni de service « 12 testeurs »
([TESTEURS-ET-JOUEURS.md](../TESTEURS-ET-JOUEURS.md)). Quand c'est fait :
`closedTestCompleted` à `true`.

### Invitation prête à adapter — aucun envoi automatique

> Bonjour ! Nous préparons La Conquête des Serpents, un petit jeu de défense né d'un jeu sur
> papier inventé par un enfant. Nous cherchons des adultes pour le test fermé Android, avec
> leurs enfants s'ils le souhaitent, sous leur surveillance. Le jeu est gratuit, sans
> publicité et sans achat. Il faut rester inscrit pendant toute la durée demandée par Google.
> Si vous êtes partant, je vous envoie le lien d'inscription. Merci !

Envoyer ce message, lancer une piste ou demander la production : toujours une action du
parent.

## Ce qui reste à faire (les TODO de `npm run store:check -- --draft`)

1. `publisher` : nom de développeur, adresse publique, type de compte, vérification.
2. `privacy` : la page en ligne nomme la version envoyée et dit la même chose que
   l'application.
3. `data-safety` : formulaire Sécurité des données.
4. `audience` : public cible.
5. `iarc` : questionnaire de classification.
6. `copies` : relecture humaine des quatre fiches.
7. `asset-review` : relecture des images face au build envoyé.
8. `merged-manifest` : manifeste fusionné et trafic du build exact.
9. `android-device` : essai sur téléphone physique.
10. `aab` : AAB signé vérifié.
11. `closed-test` : test fermé mené jusqu'au bout.
12. `assets.stale` : captures à refaire pour la version envoyée.
13. `icon` : icône 512×512 à ajouter au manifeste des captures.

Sources : [inscription](https://support.google.com/googleplay/android-developer/answer/6112435),
[tests des nouveaux comptes](https://support.google.com/googleplay/android-developer/answer/14151465),
[images et fiches](https://support.google.com/googleplay/android-developer/answer/1078870),
[Sécurité des données](https://support.google.com/googleplay/android-developer/answer/10787469),
[Familles](https://support.google.com/googleplay/android-developer/answer/9893335). Consultées
en novembre 2026 pour l'ancien modèle ; à relire au moment de remplir.
