# Marche à suivre — avant la première publication

> **État courant au15novembre2026.** Build60 confirmé en test interne par le parent ;
> build61 préparé avec confidentialité hors ligne. URL à renseigner dans Play :
> **https://snakeattacktd.com/confidentialite**. Aucun accès authentifié Console dans cette
> session, aucun envoi ou attestation par Codex. Les indications ci-dessous du8novembre
> sont historiques ; [SITE.md](../SITE.md) et [PLAN-ACTUEL.md](../PLAN-ACTUEL.md) font foi.

État au 8 novembre 2026 : compte personnel créé, validation d'identité en attente
selon le dernier retour. Aucun accès au compte ou statut de validation présumé
ici. Ni clé de publication, ni produit créé, ni invitation envoyée dans cette mission.
La v1 documentaire prévoit des achats validés/confirmés dans l'app sans serveur
obligatoire : [MONETISATION.md](MONETISATION.md).

## 1. Compte et identité

Le compte personnel est créé ; terminer sa validation dans
[Play Console](https://play.google.com/console/signup). Vérifier les pièces,
coordonnées publiques et exigences réellement affichées par Google.
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
recomposé. Pour le kit, viser au moins trois captures de combat téléphone 16:9 en
1920×1080 : c'est la recommandation de mise en avant des jeux, plus exigeante que
les seuls minima de téléversement. Bannière 1024×500 et icône 512×512 conformes.
L'original de l'icône est conservé ; les dérivés0.32.4 ont leurs coins blancs
supprimés et le lanceur est intégré. Aucun téléversement store réalisé.

## 4. Formulaires

- Public cible : groupes 6–8 et 9–12 proposés par l'audit, à confirmer par le parent.
  Ne pas cocher d'autres âges pour contourner les exigences Familles.
- Sécurité des données : inclure SDK et publicité ; v1 sans service de reçus de
  l'éditeur, réviser si un serveur est ajouté. [Brouillon](SECURITE-DES-DONNEES-V1.md).
- Confidentialité : URL publique accessible sans compte et contenu exact du build commercial.
- IARC : répondre à partir du jeu et du modèle réel. Ne pas annoncer PEGI3 ou
  une autre classification avant le résultat du questionnaire.
- Vérifier catégorie, pays, prix éventuels, déclarations d'achats/publicités,
  accès de l'équipe de revue et règles en vigueur dans la Console.

## 5. Test fermé puis demande de production

Pour un nouveau **compte personnel**, la règle Google consultée impose au moins
**12 testeurs inscrits continuellement pendant 14 jours** avant de pouvoir demander
l'accès à la production. Ce n'est ni une validation automatique après 14 jours,
ni une règle à transposer sans contrôle à tous les comptes d'organisation.

Le parent choisit la piste, les testeurs et les accès. Privilégier des comptes
d'adultes responsables pour l'inscription au test, avec essais familiaux
accompagnés. Vérifier l'âge et les restrictions réelles des comptes utilisés.
**Aucune publicité sur la piste fermée avant que le parent ait vu le format sur
son S24 et donné son accord explicite.** Prévoir auparavant, sur GO séparé, un
build de recette pour le parent avec annonces de test, hors diffusion fermée.
Aucun chargement publicitaire en arrière-plan dans la variante sans pub.

Consigner modèle/Android/WebView, jeu hors ligne, reprise après veille, sauvegardes,
achats de licence de test et, seulement après cette porte, pubs ; compréhension
et retours des enfants. Une inscription au test fermé ne suffit pas à rendre
les achats gratuits : vérifier les comptes de licence et moyens de paiement de test.
Ne pas fabriquer des
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
Consultation du 8 novembre 2026 ; recontrôler au moment de la soumission.
