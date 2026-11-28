# Recette Android — candidat 0.41.0 / build 65

La version est alignée dans `package.json`, `package-lock.json`,
`android/app/build.gradle` et `POLICY_APP`. Le paquet Play reste
`com.conqueteserpents.famille` avec la clé d'envoi d'origine. La construction,
les prérequis et les empreintes attendues sont dans le [guide Android](ANDROID.md).
Le [bilan 0.41.0](BILAN-0.41.0.md) réunit le contenu et les notes FR/EN.

## Fichiers et cibles d'essai

| Fichier                       | Usage                                                                                                                                          |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `*-play.aab`                  | Import dans la piste de test **Alpha** après vérification du code disponible dans Play Console.                                                |
| `*-release.apk`               | APK de publication dérivé du même AAB, avec R8 actif, à lancer sur un appareil de test ou un émulateur accéléré.                               |
| APK debug « Serpents (test) » | Essais d'interface et de partage. Identifiant `com.conqueteserpents.famille.test` et stockage séparé. Il s'installe à côté de la version Play. |

Pour construire l'APK debug sans compteur, lancer
`SERPENTS_PERF=0 npm run android:apk:debug` sous Linux ou macOS. Sous PowerShell,
définir `$env:SERPENTS_PERF='0'` puis lancer la commande npm.

L'app obtenue via Google Play peut être signée avec un certificat différent de
celui de l'APK de publication local. Pour tester une mise à jour, utiliser deux
versions de même signature sur une cible dédiée, ou une mise à jour via Play.
Conserver l'installation et les données de l'app familiale en cas de désaccord
de signature. Toute désinstallation de test doit se faire avec un profil jetable
et après contrôle du fichier exporté.

## Contrôles du fichier signé

- [ ] Identifier le commit, la version et le code de version dans `release-report.json`.
      Vérifier les empreintes de l'AAB, de l'APK et du mapping avec `SHA256SUMS.txt`.
- [ ] Vérifier le package, la clé d'envoi, le mapping R8 embarqué et le manifeste fusionné.
      Vérifier l'absence de permission réseau et de contenu réservé au site, notamment
      la publicité, PayPal et les pages publiques.
- [ ] Contrôler les trois modules dans `capacitor.plugins.json` extrait du paquet :
      **App**, **Filesystem** et **Share**.

## Contrôles natifs

- [ ] Démarrer à froid en mode avion. Ouvrir l'accueil et la confidentialité hors ligne en
      français et en anglais. Lire le numéro de version.
- [ ] Jouer une vague en paysage avec les commandes hors des barres système. Essayer le
      Retour Android depuis une fenêtre et depuis le combat, puis revenir après mise en
      arrière-plan.
- [ ] Reprendre un camp après fermeture forcée. Pour la mise à jour, repartir d'un build
      64 de même signature avec un camp, des étoiles et une expédition en cours, puis
      vérifier l'intégrité des joueurs et de leurs données après installation.
- [ ] Dans « Pour les parents », ouvrir « Sauvegarde familiale ». Le clavier laisse la
      question adulte visible. Une erreur ou une annulation garde l'utilisateur dans le jeu.
- [ ] Répondre correctement. Vérifier qu'un double appui ouvre un seul partage. Annuler
      une fois, puis choisir Drive. Relever les messages réellement affichés, y compris
      après mise en arrière-plan puis retour. Vérifier que le fichier existe et que le
      message et le bouton « Remplacer » sont visibles.
- [ ] Sur un profil de test, importer un ancien fichier familial v6 puis un fichier
      exporté v7. Contrôler étoiles, carnets, camp, expédition, records et pommes, ainsi
      que l'isolation du profil actif. Faire l'aller-retour depuis un autre profil ou
      une installation de test.
- [ ] Vérifier qu'une partie sans fin v1 reprend avec ses règles, et qu'une nouvelle
      utilise la v2. Dans un profil de recette, ouvrir le combat spécial et vérifier
      le retour à l'accueil sans perte du camp.

Relever la cible, la version de la WebView, la date et l'empreinte de l'APK installé.
Sur une version distribuée via Play, relever le code installé. Consigner les résultats
et les éventuels journaux de démarrage dans `artifacts/`, à côté du rapport du paquet.

## Preuves antérieures

Le parent a confirmé sur des APK debug (23 novembre) que la question adulte, le partage
vers Drive et la réimportation fonctionnaient. Le premier APK masquait le message sous
le bord de l'écran. Les essais suivants ont confirmé l'affichage des messages corrigés.
Drive suffit selon le parent ([décisions du 23 novembre](DECISIONS-2026-11-23.md)).
La recette du **build de publication 65** reste à renseigner. Les recettes navigateur
simulent les appels Android et ne peuvent pas ouvrir son partage natif.
