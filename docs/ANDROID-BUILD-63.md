# Passation Codex — Android 0.39.0 / build 63

But : construire l'application depuis `main` pour la remettre au niveau du site, **sans rien
de ce qui est réservé au site**. Tout est déjà câblé : il n'y a ni option à régler ni fichier
à retirer à la main. Contenu de la version : [BILAN-0.39.0.md](BILAN-0.39.0.md). Outils et
signature : [ANDROID.md](ANDROID.md).

## Ce qui est déjà fait dans `main`

- Version : `package.json` et `package-lock.json` 0.39.0, `android/app/build.gradle`
  `versionCode 63` / `versionName "0.39.0"`, `POLICY_APP` 0.39.0 / 63 dans
  `src/i18n/privacyPolicy.ts` (un test refuse tout écart entre les trois). Le texte et la
  date de la politique ne changent pas.
- Le mode de compilation `android` (`vite build --mode android`, `webDir: 'dist-android'`)
  écarte ce qui n'existe que sur le site. **N'utilisez pas `npm run build`** (site) ni
  `dist/` pour l'application.

| Réservé au site, absent de `dist-android/`                                                                                                                                  | Contrôlé par                        |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Encart publicitaire, script Google, `ads.txt`                                                                                                                               | `scripts/check-web-ad-disabled.mjs` |
| Lien de soutien PayPal (`data-support`, adresse de paiement)                                                                                                                | `scripts/check-discovery.mjs`       |
| Pages publiques (accueil du site, « Comment jouer », « Alliés et serpents », « Nouveautés », « Pour les parents », 404), `sitemap.xml`, `robots.txt`, métadonnées publiques | `scripts/check-discovery.mjs`       |
| Habillage de la page du jeu pour le site                                                                                                                                    | `vite.config.ts` (`website`)        |

La politique de confidentialité embarquée (`confidentialite/` et fenêtre « Pour les
parents ») reste : elle décrit aussi le site et y nomme PayPal en texte, sans lien. C'est le
texte approuvé par le parent ; ne pas le modifier.

## Construire

Depuis la racine, Node 24 :

```sh
git checkout main && git pull
npm ci
npm run verify
npm run android:sync
```

`android:sync` reconstruit `dist-android/` (avec ses trois contrôles ci-dessus), puis fait
`cap sync android`. Ne lancez pas `npx cap sync android` seul : il copierait un ancien
`dist-android/`. Ensuite, comme pour le build 62 : AAB release signé avec la clé d'envoi
d'origine (sur le poste du parent, jamais dans le dépôt ni dans une conversation), R8 et
fichier de désobscurcissement, APK de test.

## Recette sur le téléphone (à cocher)

- [ ] Installer **par-dessus le build 62** : rien n'est effacé ; une partie commencée en 62
      reprend avec ses règles.
- [ ] Hors ligne : accueil, partie, voyage, « Pour les parents » → Confidentialité
      (affiche « Application Android 0.39.0, build 63 »).
- [ ] Nouvelle grande aventure : le code de départ commence par `AVENTURE-8-`.
- [ ] Vague 7 : bannière « Nouveau serpent : Serpent sauterelle ! » ; la sauterelle saute
      par-dessus une ligne d'alliés (arc en pointillés, petit son), puis avance vers le
      cristal.
- [ ] « Tous les serpents » (Favoris) : 17 serpents et l'œuf, avec les quatre nouveaux
      dessins.
- [ ] Voyage : nouveau code `VOYAGE-2-…` ; à la dernière étape, King Snake arrive avec ses
      gardes.
- [ ] Gagner une mission, fermer complètement l'application, la rouvrir : le grand bouton
      propose la mission suivante, pas « Reprendre ».
- [ ] Paysage 780×360 et 812×375 : rien de coupé, boutons de 48 px au moins.
- [ ] Aucune publicité, aucun lien PayPal, aucune requête réseau pendant le jeu.

## À ne pas faire sans le parent

- Aucun envoi à Google Play, aucune activation de test, aucun passage en production.
- `npm run store:check` sort aujourd'hui en erreur (code 2) avec des points « TODO » : le
  dossier Play décrit encore l'ancien modèle (publicité entre missions, cosmétiques). Il est
  à refaire avant la fiche ; ce n'est pas un défaut du build 63.

Notes de version FR/EN proposées : fin de [BILAN-0.39.0.md](BILAN-0.39.0.md).
