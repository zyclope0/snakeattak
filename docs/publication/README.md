# Dossier Google Play — préparation, pas une publication

État au 26 novembre 2026. Ce dossier prépare la fiche Google Play de l'application Android.
Il n'envoie rien à Google : la Console reste entre les mains du parent.

## Le modèle de l'application

Décision du parent, les 17 et 18 novembre 2026 : **l'application Android est gratuite, sans
publicité et sans achat.** La seule publicité du projet est l'encart du site Web, sur grand
écran, non personnalisé, que l'on peut couper
([PUBLICITE-WEB-PROPOSITION.md](PUBLICITE-WEB-PROPOSITION.md)) ; il ne concerne pas
l'application.

| Quoi               | Ce que dit le dépôt                                                                                                                          |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Application        | `com.conqueteserpents.famille`, version 0.41.0, versionCode 65 (`package.json`, `android/app/build.gradle`)                                  |
| Identifiant        | Fixé par Google Play : paquet accepté depuis le build 52 ([IDENTIFIANTS-APPLICATION.md](../IDENTIFIANTS-APPLICATION.md))                     |
| Test fermé         | Piste « Alpha » créée le 20 novembre ; build 63 promu ce jour-là. Build 64 sur le téléphone du parent, sa promotion dans « Alpha » non notée |
| Build 65           | Préparé dans `main` ([ANDROID-BUILD-65.md](../ANDROID-BUILD-65.md)) ; rien n'est noté sur son envoi à Google Play                            |
| Langues du jeu     | Français et anglais, au choix dans le jeu (`src/i18n/`). Les noms et annonces des 36 défis restent en français, même en anglais              |
| Modules natifs     | `@capacitor/app` (bouton retour), `@capacitor/filesystem` et `@capacitor/share` (export volontaire du fichier familial)                      |
| Permissions        | Le manifeste source n'en demande aucune, pas même INTERNET. Le manifeste fusionné du build exact reste à relever                             |
| Pub, achat, compte | Aucun SDK publicitaire, de facturation ou de mesure ; aucun compte de joueur, aucun serveur                                                  |
| Confidentialité    | Publiée : https://snakeattacktd.com/confidentialite (source : `src/i18n/privacyPolicy.ts`, texte inchangé ici)                               |

## Utiliser ce dossier

```sh
npm run store:check -- --draft
npm run store:check
```

`store:check` (`scripts/play-preflight.mjs` → `deploy/publicationInputs.ts` →
`deploy/playReadiness.ts`) relit `configuration.json`, `fiches.json`, `captures.json`, les
images, `package.json` et les fichiers Android du dépôt. Il écrit
`reports/store-preparation.json`.

- **Erreur** (le contrôle échoue, même en brouillon) : un SDK publicitaire, de facturation ou
  de mesure dans ce que l'application embarque ; un modèle qui annonce de la publicité, des
  achats, un abonnement ou un compte ; des modules natifs ou une permission INTERNET qui ne
  correspondent pas à la configuration ; une version, une URL de confidentialité ou des
  langues fausses ; une fiche qui annonce le jeu dans une seule langue, dépasse une limite de
  Google Play (titre 30, courte 80, longue 4000 caractères) ou parle d'apparences payantes ;
  une capture dont le chemin sort du dossier, dont l'empreinte ou le format ne correspond
  pas.
- **À faire** (TODO, toléré par `--draft`, bloquant sans lui) : tout ce qui demande un humain
  ou le build exact. La liste est dans [PLAY-CONSOLE.md](PLAY-CONSOLE.md).
- `automaticPublicationAuthorized` vaut toujours `false`. Une coche verte n'est pas une
  autorisation : c'est le parent qui publie, dans la Console.

Le contrôle lit les fichiers du dépôt, pas l'AAB envoyé : ni le manifeste fusionné, ni le
trafic réseau, ni ce que Google ajoute à la distribution. C'est pour cela que ces points
restent à faire à la main.

## Captures : à refaire

Les captures de `assets/` et `captures.json` datent de la **version 0.30.1** (8 novembre
2026). Le contrôle le dit (`assets.stale`) et ne les compte pas. Pour les refaire :

```sh
npm run build
npm run store:captures
```

Puis relancer `npm run store:check -- --draft` et relire les images face à l'APK. L'icône
512×512 est prête (`resources/android-icon/icon-512.png`) mais pas encore dans le manifeste
des captures. `npm run store:dossier` régénère `index.html`, la page de relecture du dossier.

## Contenu

- [PLAY-CONSOLE.md](PLAY-CONSOLE.md) : ce que le parent remplit dans la Console, étape par
  étape, et ce qui reste à faire.
- [SECURITE-DES-DONNEES-V2.md](SECURITE-DES-DONNEES-V2.md) : réponses prudentes proposées pour
  le formulaire « Sécurité des données », et ce qu'il faut vérifier sur le build exact avant
  de les donner.
- [CONFIDENTIALITE.md](CONFIDENTIALITE.md) : la politique publiée, ce qu'elle dit de
  l'application, et la cohérence à garder avec la fiche.
- `configuration.json` : la checklist (schéma 2). Ce qui n'est pas prouvé dans le dépôt reste
  `null` ou `false` : identité de l'éditeur sur Play, public cible, classification IARC.
- `fiches.json` : fiches FR, EN, DE et IT, **brouillons** (`draft-not-reviewed`).
- `captures.json` et `assets/` : images du jeu, mesures et empreintes (version 0.30.1).
- `sources.json`, `sources-etape-4.json` : pages Google consultées en novembre 2026, pour
  l'ancien modèle. À reconsulter au moment de remplir la Console.
- [PUBLICITE-WEB-PROPOSITION.md](PUBLICITE-WEB-PROPOSITION.md),
  [SOUTIEN-WEB-PAYPAL-PROPOSITION.md](SOUTIEN-WEB-PAYPAL-PROPOSITION.md) : le site Web
  seulement.
- [MONETISATION.md](MONETISATION.md) et [SECURITE-DES-DONNEES-V1.md](SECURITE-DES-DONNEES-V1.md) :
  **historiques**, modèle abandonné le 18 novembre 2026 (publicité entre missions, achats).

## Ressources graphiques

Les originaux restent dans `../resources-2026-11/`, avec leurs empreintes. L'icône retenue est
la création Magnific s7XROQSl8e, source 2048×2048 ; ses dérivés (lanceur Android, export
512×512 sans coins blancs) sont décrits dans
[resources/android-icon/README.md](../../resources/android-icon/README.md). Son style pâte à
modeler / papier mâché fait foi. Aucune génération d'images payante n'est nécessaire pour
refaire les captures, qui viennent du jeu lui-même.
