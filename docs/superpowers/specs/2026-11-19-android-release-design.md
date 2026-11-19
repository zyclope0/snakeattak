# Android 63 et distributions indépendantes

Demande du parent : reconstruire le package Android depuis le Git actuel, conserver
le jeu commun et exclure les ajouts réservés au site ; fiabiliser les livraisons séparées.
Exécution autonome demandée. Base : main 6cd091f, v0.39.0 / code 63 déjà préparés par Claude.

Approche retenue : garder Capacitor/Vite et un seul moteur, avec des profils de
compilation explicites, une identité de build par cible et un flux de packaging vérifié.
Dupliquer le jeu ou migrer de moteur compliquerait la maintenance sans résoudre le
problème de distribution. Pas de migration ni de révision des règles dans ce lot.

- Centraliser les profils site / Android / portable / aperçu / test de publicité.
- Écrire build-info.json : cible, version du jeu, commit, état des sources et capacités.
  Aucun secret, aucun suivi de joueur. Le site peut rester sur un autre commit que l'app.
- Android : jeu, confidentialité approuvée hors ligne et crédits nécessaires. Exclure
  pages publiques, métadonnées SEO, soutien, publicité, fichiers d'hébergement et prototype
  historique (conservé dans les sources et les distributions Web).
- Contrôler dist-android, la copie Capacitor et les fichiers web du vrai AAB/APK,
  par liste complète et SHA256 ; refuser une copie ancienne ou une autre cible.
- Une commande de livraison construit, vérifie et signe avec la clé d'envoi existante,
  reçue uniquement via environnement privé. Fournir AAB, APK issu de l'AAB, mapping R8,
  empreintes, rapport et notes FR/EN. Aucun envoi Play ni nouveau déploiement du site.
- Préserver identifiant, clé, paysage, absence de permission INTERNET/SDK commercial,
  sauvegardes et codes historiques. Aucun texte juridique modifié.
- Ne pas annoncer une recette native réussie sans exécution effective du release.
  L'émulateur cloud sans KVM a déjà échoué en WebView ; fournir un kit local si nécessaire.
