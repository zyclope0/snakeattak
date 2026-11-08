# Marche à suivre — avant la première publication

État : le parent n'a pas encore de compte. Ce dossier ne contient ni compte,
clé de signature de publication, produit payant créé ni invitation envoyée.

## 1. Compte et identité

Le parent crée son compte sur [Play Console](https://play.google.com/console/signup)
et choisit personnel ou organisation selon sa situation réelle. Vérifier les
pièces, coordonnées publiques et exigences de vérification affichées par Google.
La page officielle mentionne actuellement **US$25** de frais d'inscription uniques ;
confirmer le montant et les conditions au paiement. Cette opération revient au parent.

À choisir avant le premier téléversement : nom public de l'éditeur, adresse de
contact, identité de l'application et identifiant de package définitif. Le code
utilise encore `com.conqueteserpents.famille` à titre provisoire. Après publication,
changer ce package reviendrait à publier une autre application. L'APK familial
actuel est signé en debug ; il n'est pas un AAB Play signé de publication.

## 2. Préparation technique et commerciale

Créer le compte de publicité et les emplacements de test ; vérifier le SDK et le
wrapper retenus. Configurer le traitement enfant avant initialisation et contrôler
les requêtes réelles. Créer les produits non consommables une fois thèmes/prix
validés, puis tester achat autorisé/refusé/en attente, suppression de pub,
restauration sur réinstallation et remboursement/révocation. Utiliser uniquement
les comptes et moyens de paiement de test prévus par Google pour cette recette.

Créer un AAB signé de test, protéger les clés et inscrire Play App Signing selon
la procédure retenue. Confirmer package, versionCode, SDK, permissions fusionnées,
versions des dépendances et absence de secrets dans l'archive. Ne pas tester la
facturation uniquement sur un APK sideloadé puis la déclarer validée.

## 3. Contenu de la fiche

Les quatre fiches de fiches.json sont en brouillon ; le jeu est actuellement en
français, mention conservée dans chaque langue. Faire relire les traductions avant
de les publier. Déclarer les achats et publicités au bon endroit, relire la
fidélité de chaque capture au build monétisé réellement distribué.

Les captures et la bannière sont générées depuis le jeu, pas depuis un décor
recomposé. Pour le kit, viser au moins trois captures de combat téléphone16:9 en
1920×1080 : c'est la recommandation de mise en avant des jeux, plus exigeante que
les seuls minima de téléversement. Bannière1024×500 et icône512×512 conformes.
L'icône source fournie attend correction de ses coins blancs.

## 4. Formulaires

- Public cible : groupes6–8 et9–12 proposés par l'audit, à confirmer par le parent.
  Ne pas cocher d'autres âges pour contourner les exigences Familles.
- Sécurité des données : inclure tous les SDK, publicité et service de reçus.
- Confidentialité : URL publique et contenu exact du build commercial.
- IARC : répondre à partir du jeu et du modèle réel. Ne pas annoncer PEGI3 ou
  une autre classification avant le résultat du questionnaire.
- Vérifier catégorie, pays, prix éventuels, déclarations d'achats/publicités,
  accès de l'équipe de revue et règles en vigueur dans la Console.

## 5. Test fermé puis demande de production

Pour un nouveau **compte personnel**, la règle Google consultée impose au moins
**12 testeurs inscrits continuellement pendant14 jours** avant de pouvoir demander
l'accès à la production. Ce n'est ni une validation automatique après14 jours,
ni une règle à transposer sans contrôle à tous les comptes d'organisation.

Le parent choisit la piste, les testeurs et les accès. Privilégier des comptes
d'adultes responsables pour l'inscription au test, avec essais familiaux
accompagnés. Vérifier l'âge et les restrictions réelles des comptes utilisés.
Consigner modèle/Android/WebView, jeu hors ligne, reprise après veille, sauvegardes,
achats de test, pubs, compréhension et retour des enfants. Ne pas fabriquer des
témoignages ou des résultats pour la demande de production.

### Invitation prête à adapter — aucun envoi automatique

> Bonjour ! Nous préparons La Conquête des Serpents, un petit jeu de défense
> imaginé en famille. Nous cherchons des adultes pour participer au test fermé
> Android, éventuellement avec leurs enfants sous leur supervision. Si vous êtes
> volontaires, je vous transmettrai le lien d'inscription et la version de test.
> Il faudra rester inscrits pendant la durée demandée par Google. Les achats
> éventuels utiliseront le mode de test prévu ; je vous indiquerai précisément
> ce qui est actif et les retours recherchés avant l'installation. Merci !

Lancer la piste ou envoyer ce message exige une action explicite du parent.
Après le test, il relit la demande d'accès à la production et les textes finaux.

Sources : [inscription](https://support.google.com/googleplay/android-developer/answer/6112435?hl=en),
[tests des nouveaux comptes](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en),
[images et fiches](https://support.google.com/googleplay/android-developer/answer/1078870?hl=en).
Consultation du8novembre2026 ; recontrôler au moment de la soumission.
