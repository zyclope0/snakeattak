# Passation Codex — Android 0.40.0 / build 64

But : construire l'application depuis `main` pour la remettre au niveau du site, **sans rien
de ce qui est réservé au site**. La procédure est celle du build 63, sans changement : il n'y
a ni option à régler ni fichier à retirer à la main. Contenu de la version :
[BILAN-0.40.0.md](BILAN-0.40.0.md). Outils et signature : [ANDROID.md](ANDROID.md).

## Ce qui est déjà fait dans `main`

- Version : `package.json` et `package-lock.json` 0.40.0, `android/app/build.gradle`
  `versionCode 64` / `versionName "0.40.0"`, `POLICY_APP` 0.40.0 / 64 dans
  `src/i18n/privacyPolicy.ts` (un test refuse tout écart entre les trois).
- Le mode de compilation `android` (`vite build --mode android`, `webDir: 'dist-android'`)
  écarte ce qui n'existe que sur le site : encart publicitaire et `ads.txt`, lien de soutien
  PayPal, pages publiques, `sitemap.xml`, `robots.txt`, prototype historique, `.htaccess` et
  `_headers`. **N'utilisez pas `npm run build`** (site) ni `dist/` pour l'application. Les
  gardes sont décrits dans [ANDROID-BUILD-63.md](ANDROID-BUILD-63.md) ; ils n'ont pas changé.
- La politique de confidentialité embarquée (`confidentialite/` et fenêtre « Pour les
  parents ») est le texte approuvé par le parent ; ne pas le modifier.

## Construire

Depuis la racine, Node 24, JDK 21, SDK Android 36, commit propre :

```sh
git checkout main && git pull
npm ci
npm run android:package
```

Variables privées de signature : voir [ANDROID.md](ANDROID.md), « Livraison reproductible ».
Sortie : `artifacts/android/conquete-serpents-v0.40.0-build64/` (AAB, APK issu du même AAB,
mapping R8, `SHA256SUMS.txt`, `release-report.json`). La commande refuse des sources non
committées, un dossier de livraison déjà utilisé et une autre clé que la clé d'envoi
d'origine.

## Recette sur le téléphone (à cocher)

Mise à jour et sauvegardes :

- [ ] Installer **par-dessus le build 63** : rien n'est effacé ; les étoiles, la grande
      aventure en cours, le voyage en cours et les joueurs sont là.
- [ ] Un voyage commencé avec le build 63 se finit ; l'accueil propose ensuite La Grande
      Expédition.
- [ ] Gagner une mission, tuer l'application (bouton carré, balayer), rouvrir : les étoiles
      sont là, l'accueil dit « Jouer ».
- [ ] Acheter un allié, tuer l'application avant de lancer la vague, rouvrir : l'allié et les
      pièces vont ensemble.
- [ ] « Pour les parents » → exporter le fichier familial, puis l'importer : l'expédition en
      cours et le record de l'aventure sans fin reviennent.
      **Échec, essayé par le parent le 22 novembre : « Exporter mon aventure » ne fait rien**,
      puis le jeu écrit « Fichier prêt ». Aucun fichier ne sort de l'application, dans ce
      build comme dans les précédents. Ne rien désinstaller, ne pas effacer les données de
      l'application : l'aventure partirait avec.
      **L'import marche** : essayé par le parent le 22 novembre, avec un fichier exporté
      depuis le site (« la reprise du fichier marche parfaitement »).

Ce qui est nouveau :

- [ ] Hors ligne : accueil, partie, expédition, « Pour les parents » → Confidentialité
      (affiche « Application Android 0.40.0, build 64 »).
- [ ] Nouvelle grande aventure : le code de départ commence par `AVENTURE-9-` ; à la vague 8,
      bannière « Nouvel allié : Spinosaure ! » ; le spinosaure se pose et nage.
- [ ] La Grande Expédition : la carte est une route avec ses embranchements ; choisir un
      chemin, passer une halte, gagner une étape ; les trois cadeaux arrivent, « Tirer
      encore » en redonne trois.
- [ ] Toucher deux fois vite « Continuer l'expédition » : les trois cadeaux attendent, aucun
      n'est pris à l'aveugle.
- [ ] L'aventure sans fin : la porte est fermée tant que King Snake n'est pas battu dans la
      grande aventure ; ouverte ensuite. Après un roi : « Continuer » ou « Rentrer avec mon
      record » ; le record du joueur s'affiche.
- [ ] Un allié posé près d'un rocher, dans une nouvelle partie, ne reste pas collé.

Téléphone :

- [ ] Paysage 780×360 et 812×375 : rien de coupé, boutons de 48 px au moins.
- [ ] Retour par geste et par le bouton « retour » depuis chaque écran.
- [ ] Une vague dense à ×2 : le jeu reste fluide (`?perf=1` donne le relevé).
- [ ] Aucune publicité, aucun lien PayPal, aucune requête réseau pendant le jeu.

## À ne pas faire sans le parent

- Aucun envoi à Google Play, aucune activation de test, aucun passage en production.
- `npm run store:check` sort en erreur (code 2) avec des points « TODO » : le dossier Play
  décrit encore l'ancien modèle (publicité entre missions, cosmétiques). Il est à refaire
  avant la fiche ; ce n'est pas un défaut du build 64.

Notes de version FR/EN proposées : fin de [BILAN-0.40.0.md](BILAN-0.40.0.md).
