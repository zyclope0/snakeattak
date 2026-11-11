# Architecture et Android — décision 0.21

La croissance du jeu justifie des modules et des mesures, pas à elle seule un
backend. Le jeu est déjà développé en TypeScript, avec une simulation autonome,
Phaser pour le rendu et Vite pour produire les fichiers à publier. Le HTML sert
de point d'entrée et de structure d'interface ; il ne porte plus tout le moteur.
Continuer avec cette architecture préserve les règles testables et une partie
jouable sans réseau.

## Circulation des responsabilités

```text
Définitions / sauvegardes validées → Game / Session → état local
                                         ↑              ↓
                                commandes UI      Phaser + HTML

Vite → dist/ → hébergement statique HTTPS
             → Capacitor Android → assets locaux + WebView
```

Les expéditions ajoutent des définitions de missions et une progression locale
validée, en conservant la partie classique. La même simulation alimente les
deux distributions. L'enveloppe Android n'introduit pas de second moteur,
de copies de règles en Java, ni de serveur de combat. Voir la conception des
expéditions et `docs/ARCHITECTURE.md` pour les responsabilités détaillées.

## Pourquoi garder le HTML

Le DOM convient aux menus, boutons, textes lisibles, boîtes de dialogue et
fichiers familiaux. Phaser convient au terrain, aux acteurs et animations.
La séparation actuelle permet de faire évoluer ces vues sans déplacer les
règles de combat dans le rendu. Le site normal garde ses assets séparés ; le
gros fichier HTML autonome demeure un export portable facultatif.

La croissance doit être suivie avec les mesures existantes : taille du build,
coût de simulation, navigation, rendu et tests tactiles. Un ralentissement local
ne prouve pas qu'un serveur soit utile : le rendu GPU resterait sur l'appareil.
Le conteneur Android facilite l'installation et l'accès futur à une API native
si un besoin concret apparaît. Il ajoute aussi un outil de compilation et un
parcours de validation à entretenir ; il ne prouve pas encore la qualité sur
téléphone.

## Backend : seulement pour un nouveau besoin

Les profils familiaux, camps, étoiles et fichiers d'échange actuels restent
locaux. Un backend deviendrait utile pour la synchronisation automatique entre
appareils, une famille connectée à distance, un classement fiable ou du jeu en
réseau. Ce serait un projet distinct : identité, droits familiaux, validation et
versionnement des sauvegardes, récupération, limites et coûts d'hébergement.
Le noyau TypeScript pourrait rester partagé ; aucun de ces besoins n'exige de
réécrire aujourd'hui le jeu dans un moteur natif.

La 0.21 n'ajoute aucun compte, base de données, API payante, collecte ou service
de gameplay. Aucun service worker ni PWA n'est ajouté. Capacitor embarque les
fichiers compilés localement, sans URL du site publié. Le stockage de sa WebView
et celui du navigateur sont des espaces séparés : le fichier familial est la
passerelle existante à vérifier sur Android.

## État livrable

Les fichiers natifs, la configuration, les dépendances verrouillées et la
commande `npm run android:sync` permettent de préparer une compilation Android
sur une machine équipée. L'application garde l'identifiant provisoire
`com.conqueteserpents.famille` et la version native 0.21.0 / 21.

La synchronisation Capacitor est vérifiée ; l'APK, le rendu Android, l'import/
export dans une WebView, les zones des barres système, la signature et Play
Console restent à vérifier ou réaliser. Les exigences de compilation, sources
officielles et étapes sont détaillées dans [ANDROID.md](../ANDROID.md).
