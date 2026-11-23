# Bilan 0.41.0 — l'aventure sort enfin de l'application (build 65)

Version préparée le 23 novembre 2026 : **0.41.0 / Android 65** (`package.json`,
`package-lock.json`, `android/app/build.gradle` et `POLICY_APP` de la politique de
confidentialité), avec l'accord du parent du 23 novembre
([décisions](DECISIONS-2026-11-23.md), n° 1). La construction signée suit
[ANDROID-BUILD-65.md](ANDROID-BUILD-65.md). Rien n'est envoyé à Google Play dans ce lot.

Le build 64 (0.40.0) est sur le téléphone du parent depuis le 22 novembre. Son export du
fichier familial ne faisait rien : aucune aventure ne pouvait sortir de l'application.

## Ce qui change pour la famille depuis le build 64

- **L'export de l'aventure marche dans l'application** : le fichier est écrit dans le cache de
  l'application, puis le partage d'Android s'ouvre (Drive, Fichiers, e-mail…). Deux modules
  officiels de Capacitor, acceptés par le parent le 22 novembre, sans aucune permission
  nouvelle (PR 136).
- **Un camp de la sauvegarde qui ne se lit plus n'emporte plus le reste** : les étoiles, les
  missions et les carnets restent (PR 133).
- **Copies de secours** : le jeu garde l'aventure d'avant chaque import et celle d'un
  lancement d'avant ; un import par erreur s'annule d'un appui, sans fichier (PR 134).
- **« Ta partie n'est pas gardée »** : quand l'appareil est plein ou bloque le stockage, une
  fenêtre le dit après une vague gagnée, jamais pendant un combat ; une marque reste sur
  l'accueil, puis « C'est réparé » (PR 135).
- **Fenêtres de panne** : un plateau arrêté par une erreur, un démarrage raté, disent quoi
  faire (lots du 22 novembre, PR 129 à 132).

## Ce que ce lot a changé lui-même

- La version, partout ensemble (un test refuse tout écart).
- **La politique de confidentialité** (décisions 1, 2 et 8) : elle nomme l'application 0.41.0
  (build 65) ; elle dit que le fichier passe par le cache de l'application, où des copies
  restent tant qu'Android ne le vide pas ; elle dit qu'une copie de l'aventure remplacée est
  gardée avant chaque import, et que supprimer le joueur la supprime. Mise à jour datée du 23
  novembre. La nouvelle approbation est figée dans
  `tests/fixtures/politique-approuvee-build-65-2026-11-23.json`.
- **Phrase des parents, appareil plein** (décision 6) : « … Libère de la place sans fermer le
  jeu, puis continue à jouer : il réessaiera et le dira. »
- **Phrase des parents, stockage bloqué, dans l'application** (décision 10) : « Cet appareil ne
  laisse pas le jeu garder la partie. Elle dure tant que le jeu reste ouvert. » Le site garde
  la sienne, qui parle de navigation privée.
- **Page publique des parents** (décision 7) : « L'espace parents propose une sauvegarde
  familiale ; elle porte l'aventure du joueur en cours, avec son expédition, son voyage et ses
  records ; elle ne porte pas les autres joueurs. »

## Lot suivant : la question pour adulte (décision 3)

- Dans l'application, avant d'ouvrir le partage d'Android, une fenêtre demande « Combien font
  17 × 9 ? » (deux nombres tirés à chaque fois). « Annuler », Échap ou une mauvaise réponse
  n'envoient rien, et le jeu dit « Rien n'a été envoyé : il faut la bonne réponse d'un
  adulte. ». Sur le site, rien ne change : le fichier va au navigateur, sans question.
- Mots à lire par le parent : [DECISIONS-2026-11-23.md](DECISIONS-2026-11-23.md), lot
  « barrière de l'export ». Anglais fait par moi : « To send the file, an adult answers: »,
  « What is 17 × 9? », « Cancel », « Send », « Nothing was sent: an adult’s right answer is
  needed. »
- Vérifié par `tests/hand-over.test.ts` et la recette `npm run test:saves:gate` (tâche
  « sauvegardes » de la CI), sur le paquet de l'application avec un faux côté Android.
- **APK de test** : le type `debug` s'installe à côté de l'application de Play
  (`com.conqueteserpents.famille.test`, « Serpents (test) », ses propres sauvegardes). Voir
  [ANDROID-BUILD-65.md](ANDROID-BUILD-65.md).

## Traductions anglaises, à relire par le parent

Faites par moi à partir des phrases approuvées en français :

- Politique : « In the Android app, the file is first written to the app’s cache, where copies
  remain (one per kind of file) until Android clears that cache, then handed to Android’s
  share sheet, where you choose the app that receives it. » et « Before each import, the game
  keeps a copy of the replaced adventure on the device so it can be restored; deleting the
  player deletes it too. »
- Appareil plein : « The device probably has no room left to save the game. Free some space
  without closing the game, then keep playing: it will try again and say so. »
- Stockage bloqué, application : « This device does not let the game save. The game lasts as
  long as it stays open. »
- Page des parents : « The parents’ area offers a family backup; it carries the current
  player’s adventure, with their expedition, voyage and records; it does not carry the other
  players. »

## Sauvegardes et codes

Le build 65 lit tout ce que les builds 63 et 64 ont écrit. Aucune règle de jeu ne change :
`src/game.ts` et `src/engine` sont intacts, les traces de parties entières sont les mêmes.

## Vérifié, et comment

`npm run verify`, `npm run build:android`, les recettes `test:saves:family`,
`test:failure` et `test:saves:unkept` ; le test de la politique tient la chaîne des
approbations (14 novembre, 17, 20, 22, build 64, build 65). Chaque lot fusionné depuis le
build 64 a été attaqué par des relecteurs indépendants avant fusion.

## Pas vérifié

- **Rien n'a tourné sur un téléphone** : un APK de test a été compilé ici, mais ni le partage,
  ni l'écriture dans le cache, ni la question pour adulte avec le clavier du téléphone, ni un
  fichier envoyé dans Drive puis repris après désinstallation n'ont été essayés. C'est la
  recette du téléphone ([ANDROID-BUILD-65.md](ANDROID-BUILD-65.md)).
- Pas essayé avec les enfants. La question arrête un petit enfant, pas un grand qui sait ses
  tables.

## Publication du site

La politique publiée sur le site nomme l'application installée. Comme pour le build 64, la
page n'est à publier qu'une fois le build 65 sur le téléphone, avec le mot du parent.

## Notes de version proposées (Google Play)

- FR : « Tu peux maintenant sauvegarder ton aventure en dehors de l'application et la
  retrouver sur un autre appareil. Le jeu garde aussi des copies de secours, et te prévient si
  ta partie n'est pas gardée. »
- EN : « You can now save your adventure outside the app and get it back on another device.
  The game also keeps backup copies, and tells you when your game is not being saved. »
