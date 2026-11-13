# Identifiant Android — paquet accepté sur Play

Au 12 novembre 2026, **com.conqueteserpents.famille** est le paquet du build52
accepté sur le canal de test interne Google Play ; le parent confirme son installation.
Les builds53 à58 conservent cet identifiant, le namespace et la clé d’envoi d’origine.
Aucun renommage de paquet n’est nécessaire pour cette mise à jour.

La clé d’envoi signe l’AAB ; Google Play signe les APK distribués avec sa propre clé.
L’APK debug familial garde un certificat distinct : une installation Play se met à jour via Play.
Conserver le paquet et la signature de distribution permet de conserver les données
Android ; aucun format de sauvegarde n’a changé dans cette livraison.

Changer de paquet crée une autre application et un autre espace de données.
Le nom affiché FR/EN reste indépendant de cet identifiant technique.
[Propositions historiques de l’étape3](archive/IDENTIFIANTS-APPLICATION-0.32.4.md).
