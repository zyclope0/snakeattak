# Découverte du jeu et soutien sur le Web

Accord du parent : réaliser les points1 et2 proposés dans la conversation ; publicité
repoussée. Le lien de soutien reste masqué tant que le parent n'a pas choisi sa destination.

## Approche retenue

Conserver le jeu à `/` et son stockage existant. Ajouter des pages HTML statiques FR/EN
à côté : présentation, prise en main, personnages, nouveautés et parents. Elles sont
lisibles sans JavaScript, liées entre elles et au jeu, et réutilisent les images et polices
locales déjà autorisées. Aucune nouvelle génération, aucun traceur ni compte enfant.

Le jeu reçoit des métadonnées et des liens discrets vers ces pages dans la rubrique
parents, sans agrandir le pied de son accueil. La politique approuvée
reste strictement intacte. Les liens de soutien, quand ils seront activés explicitement,
seront réservés aux pages parents et au pied des pages publiques, avec avertissement de
paiement externe et sans contrepartie de jeu. Aucun bouton vide, paiement intégré,
sollicitation pendant une partie ni avantage payant.

Le choix d'une régie publicitaire est hors périmètre. Une vitrine remplaçant l'accueil à
`/` a été écartée pour conserver l'accès direct et les sauvegardes. Un serveur applicatif
ou un framework supplémentaire n'est pas nécessaire : les pages sortent du build Vite.

## Indexation et séparation

Titres et descriptions propres, canonicals, équivalents linguistiques, Open Graph,
sitemap et robots.txt ; liens de découverte depuis le jeu. Fournir la procédure Google
Search Console et Bing Webmaster Tools, sans affirmer une soumission ou un classement.

Le Web continue à sortir dans `dist/`. Le build Android dédié sort dans `dist-android/`,
sans pages marketing, métadonnées publiques ou lien de soutien ; Capacitor lit ce dossier.
Le portable reste séparé. Aucun changement du moteur, des règles, des valeurs, des anciens
codes, des sauvegardes, de la version ou du compteur Android dans cette mission.

## Vérification

Tests de génération, sécurité des liens et désactivation du soutien ; parcours navigateur
FR/EN, clavier et mobile portrait/paysage des pages publiques ; aucune requête externe ni
cookie. Compilation Android dédiée et contrôle d'absence des contenus Web. `npm run verify`
et `npm run test:browser` avant livraison. Publication uniquement via le workflow existant.
