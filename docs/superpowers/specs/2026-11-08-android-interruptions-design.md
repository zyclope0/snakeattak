# Android — interruption et reprise sûres

Suite du lot 4, mandat autonome du parent du 8 novembre : priorité à
l'application, pendant la validation du compte Google. Base : 0.30.1.

## Intention et limites

Une interruption (écran verrouillé, autre application ou sortie de page) doit
laisser le jeu en pause jusqu'à l'action explicite Reprendre. Fermer une fiche
ou revenir en paysage ne doit pas effacer cette pause. Une simple rotation
aller-retour, sans interruption et sans pause préalable, conserve sa reprise
actuelle. Même comportement avec les fenêtres d'aide et de diagnostic.

Conserver règles, RNG, prix, vagues, unités, trois voies et sauvegardes.
Pas de SDK, serveur, publicité, nouvel asset ou frais. Pas de sauvegarde de
combat inventée : après destruction du processus, le dernier camp est repris.
Le navigateur n'atteste pas le cycle de vie physique du S24.

## Approches et choix du développeur

1. Ajouter un écouteur de visibilité dans la seule rotation : petit correctif,
   mais ne traite pas les interruptions de page ni les pauses temporaires imbriquées.
2. Un petit arbitre de pauses dans l'interface, commun à la rotation, aux
   dialogues et aux interruptions : retenu. Les pauses temporaires possèdent
   leur acquisition ; une interruption reste acquise jusqu'à Reprendre.
3. Réécrire le moteur ou intégrer un plugin natif : disproportionné et inutile
   pour le défaut observé. Un correctif natif sera motivé par un test réel.

L'arbitre ne dépend ni de Phaser ni du DOM. Il est créé une fois par Session,
ne sérialise aucun état et suit l'identité du Game pour ignorer les anciennes
fenêtres après changement de mission. La liaison DOM gère visibilitychange et
pagehide ; pageshow ne reprend jamais seule. Pas de reprise automatique au focus.

## Recette

Reproduire d'abord rotation → arrière-plan → retour → paysage sur 0.30.1.
Contrôler le vrai temps du moteur via fixture navigateur, puis les commandes
de la distribution. Tester aussi dialogue + rotation dans les deux ordres,
pause volontaire, ancienne acquisition après changement de Game, événements
répétés et nettoyage des écouteurs. Vérifier la reprise du dernier camp et
l'accès aux assets des missions quand le réseau est coupé, depuis le paquet
embarqué (simulation de transport local, sans prétendre à un cache web hors ligne).

Version corrective visée 0.30.2 ; build web et APK familial sans diagnostic.
