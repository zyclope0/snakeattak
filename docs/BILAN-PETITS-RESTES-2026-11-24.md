# Bilan — petits restes du 24 novembre 2026

Deux restes acceptés par le parent ([décisions](DECISIONS-2026-11-24.md)).

## Ce qui est fait

- **« Recharge la page. »** remplace « Réessaie. » sur cinq boutons, en français et en
  anglais (`src/texts/*/home.ts`, `advice.ts`, `guide.ts`, `missionScreens.ts`). Les deux
  constantes qui portaient « Reessaie » dans leur nom sont renommées.
- **Bouton « retour » d'Android** (`src/ui/backButton.ts`, application seulement) :
  1. une fenêtre ouverte : elle reçoit la même demande que la touche Échap (une fenêtre qui
     refuse reste) ;
  2. une partie en cours : le bouton pause (un deuxième appui reprend) ;
  3. une partie gagnée ou perdue : retour à l'accueil ;
  4. une page de l'accueil : retour au premier écran ;
  5. le premier écran : l'application passe en arrière-plan, rien n'est fermé.
     Le jeu n'appuie que sur des boutons qu'un enfant pourrait toucher : aucun chemin nouveau.
- **Tant que le jeu n'écoute pas, « retour » reste celui d'Android**
  (`disableBackButtonHandler` dans `capacitor.config.ts`) : un jeu qui n'a pas démarré et la
  page « WebView trop ancien » se quittent encore. Le jeu ne prend « retour » que si le côté
  natif porte le module (`nativeBack`), comme pour le partage.
- Module ajouté : `@capacitor/app` 8.1.2 (version fixe). Son manifeste est vide : **aucune
  permission nouvelle**. Le site n'en porte rien.

## Comment c'est vérifié

- Mesure du défaut : `voyageScreens` et `privacyWindow` bloqués puis rendus dans Chromium,
  0 requête au deuxième et au troisième appui (script jetable, 24 novembre).
- `tests/back-button.test.ts` : le choix de ce que fait « retour », les seize combinaisons,
  et le côté natif sans le module.
- `npm run test:back-button` (`scripts/hygiene/back-button.mjs`, tâche « sauvegardes » de la
  CI) sur le vrai paquet de l'application avec un faux côté Android : aux trois tailles,
  accueil, quatre pages, fenêtres, pause au camp et en bataille ; une aventure entière jouée
  jusqu'à sa fin à 780×360 ; un jeu qui ne démarre pas ne demande rien à Android ; un côté
  natif sans le module ne demande rien et n'écrit aucune erreur ; le site n'a pas le fichier.
- Cette recette a trouvé un défaut avant la livraison : sans le module, le jeu écrivait une
  erreur à chaque démarrage. Corrigé (`nativeBack`), et la recette le tient.
- `npm run verify`, `npm run test:locale`, `npm run test:mobile-menus`, et les sept autres
  recettes du paquet de l'application.

## Ce qui n'est pas vérifié

- **Rien sur un vrai téléphone** : le geste « retour » d'Android, le bouton à trois touches,
  le passage en arrière-plan et le retour dans le jeu sont à essayer par le parent sur l'APK
  de test. Chromium n'a pas de bouton « retour » : la recette imite ce qu'Android envoie.
- Le geste « retour prédictif » d'Android 14 et plus (l'aperçu de l'écran d'avant) : non vu.
- Firefox et Safari redemandent peut-être un fichier qui a échoué : non mesuré. « Recharge la
  page. » y reste vrai.
- Rien avec les enfants.
