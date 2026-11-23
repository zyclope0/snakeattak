# Passation — Android 0.41.0 / build 65

**Prêt à construire depuis `main`**, barrière pour adulte comprise (décision 3 du parent,
[décisions](DECISIONS-2026-11-23.md)), une fois son lot fusionné. La version est
montée ensemble dans `package.json`, `package-lock.json`, `android/app/build.gradle` et
`POLICY_APP` (un test refuse tout écart) ; contenu : [BILAN-0.41.0.md](BILAN-0.41.0.md). La
procédure de construction est celle du build 64 ([ANDROID-BUILD-64.md](ANDROID-BUILD-64.md)) :
`npm ci`, puis `npm run android:package` ; sortie dans
`artifacts/android/conquete-serpents-v0.41.0-build65/`.

## Ce que le build 65 apporte

- **L'export de l'aventure sort enfin de l'application** : deux modules officiels de
  Capacitor, `@capacitor/filesystem` 8.1.5 et `@capacitor/share` 8.0.3, acceptés par le
  parent le 22 novembre 2026. Le fichier est écrit dans le cache de l'application, puis le
  partage d'Android s'ouvre. Détails : [ARCHITECTURE.md](ARCHITECTURE.md), « Remettre un
  fichier à la famille ».
- `npx cap sync android` a ajouté les deux modules à `android/capacitor.settings.gradle` et
  `android/app/capacitor.build.gradle`. Leurs manifestes sont vides : **aucune permission
  nouvelle**. Le partage passe par le `FileProvider` déjà déclaré (`cache-path`).
- Les lots de solidité des sauvegardes (camps sauvés, copies de secours, « partie non
  gardée ») et les fenêtres de panne, fusionnés (PR 129 à 136).
- La question pour adulte avant le partage (décision 3) : « Combien font 17 × 9 ? »
  (nombres tirés à chaque fois), application seulement.

## APK de test, à côté de l'application de Play

Le parent a voulu pouvoir essayer sans toucher à l'application installée depuis Play
(23 novembre 2026). Le type `debug` d'`android/app/build.gradle` porte un identifiant à part
(`com.conqueteserpents.famille.test`), une version `0.41.0-test` et le nom « Serpents
(test) » (`android/app/src/debug/res/values/strings.xml`) : les deux s'installent côte à
côte, et chacune a ses propres sauvegardes. La version de Play (`release`) ne change pas.
Construction : `npm run android:apk:debug`.

## Recette sur le téléphone (à cocher)

Après la construction, contrôler dans le rapport que le manifeste fusionné ne demande aucune
permission de plus que le build 64, que `android/app/src/main/assets/capacitor.plugins.json`
nomme bien les deux modules (sinon l'application ne montre aucun bouton d'export), et noter
la taille de l'APK (premier code Kotlin, apporté par le module des fichiers).

Export, le point principal :

- [ ] « Pour les parents », « Sauvegarde familiale », « Exporter mon aventure » : le partage
      d'Android s'ouvre, avec un fichier `conquete-serpents-famille.json`.
- [ ] Choisir Drive : le jeu dit « Le fichier est parti vers l'application que tu as
      choisie… », et la phrase se voit sans faire défiler. Le fichier est bien dans Drive.
      (Premier APK de test, 23 novembre : le fichier arrive dans Drive et se réimporte, mais
      la phrase était cachée sous le bord ; corrigé dans le second. Sur le téléphone du
      parent, seul Drive est proposé. Explication probable, pas vérifiée : le module donne au
      fichier le type `application/json`, et Android ne montre que les applications qui
      acceptent ce type. Drive suffit, décision 11.)
- [ ] Ouvrir le partage puis le fermer par « retour » sans rien choisir : « Le partage s'est
      fermé… ». Le jeu continue normalement.
- [ ] Ouvrir le partage, appuyer sur l'accueil du téléphone, revenir au jeu, fermer le partage
      sans rien choisir : « Le partage s'est fermé… », jamais « Le fichier est parti… ».
- [ ] Appuyer deux fois vite sur « Exporter mon aventure » : un seul partage s'ouvre.
- [ ] Le grand test : exporter vers Drive, désinstaller l'application, la réinstaller,
      « Choisir un fichier » depuis Drive : les étoiles, les missions et les carnets reviennent.
- [ ] Après « Choisir un fichier », l'aperçu et « Remplacer » se voient sans faire défiler
      (APK v3 et suivants).

Le reste :

- [ ] Partage rapide (Nearby / Quick Share) ou partage vers une application qui ne quitte pas
      le jeu : noter la phrase affichée (le code du module laisse croire qu'il dira « fermé »).
- [ ] Avant le partage, la question pour adulte s'affiche ; une mauvaise réponse n'ouvre
      rien. Le clavier des chiffres s'ouvre, et la question reste visible au-dessus.
- [ ] Les recettes du build 64 (mise à jour, sauvegardes, fenêtres de panne) passent encore.
- [ ] Installer **par-dessus le build 64** : rien n'est effacé ; étoiles, aventure en cours,
      expédition, joueurs sont là.
- [ ] Hors ligne : « Pour les parents » → Confidentialité affiche « Application Android
      0.41.0, build 65 ».

## Quel APK pour quelle ligne

- **L'APK de test** (« Serpents (test) ») sert à tout ce qui précède sauf l'installation
  par-dessus le build 64 : il s'installe à côté, avec ses propres sauvegardes (vides au
  départ). Pour la famille, sans le compteur de performances (qui sinon s'affiche) :
  `$env:SERPENTS_PERF='0'; npm run android:apk:debug` dans PowerShell (la valeur reste pour
  toute la fenêtre : `Remove-Item Env:SERPENTS_PERF` pour retrouver le compteur),
  `SERPENTS_PERF=0 npm run android:apk:debug` dans un terminal Linux ou macOS.
- **Le build 65 signé** (`npm run android:package`, par le parent) sert à la ligne « par-dessus
  le build 64 » et à la recette de mise à jour.
- La mémoire d'un APK de test se lit sous son propre nom :
  `adb shell dumpsys meminfo com.conqueteserpents.famille.test`.

## Pas essayé

Essayé par le parent sur le premier APK de test (23 novembre) : la question s'affiche, la
bonne réponse ouvre le partage, le fichier arrive dans Drive et se réimporte ; la phrase du
résultat ne se voyait pas (corrigé dans le second APK de test, pas encore essayé). Le reste des cases n'a pas
tourné sur un téléphone. Les APK de test sont compilés ici (Gradle, type `debug`) ; aucune
recette navigateur ne peut ouvrir le vrai partage d'Android : elles imitent son côté natif.
Pas essayé avec les enfants.
