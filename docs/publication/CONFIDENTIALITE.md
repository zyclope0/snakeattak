# Confidentialité — brouillons à compléter

> **Historique.** Ces brouillons datent de la préparation de novembre (jeu 0.32.4). La
> politique approuvée et publiée est dans `src/i18n/privacyPolicy.ts` : c'est la seule
> source de la page publique et de la fenêtre de l'application. Voir [SITE.md](../SITE.md).

**Ne pas publier ce document comme politique finale d'une application avec pubs.**
L'application actuelle0.32.4 ne contient pas de SDK publicitaire ni de facturation.
L'identité du responsable, son contact et la configuration de la future version
commerciale ne sont pas encore disponibles. La page publique nécessaire à Google
Play sera préparée après ces données et avant le test d'une version monétisée.

## Faits de l'APK actuel, à relire avec l'éditeur

- Jeu local sans compte de joueur, sans analytique ou publicité ajoutée au jeu.
- Sauvegardes, réglages et équipes enregistrés sur l'appareil.
- Transfert volontaire par fichier familial ; le jeu n'organise pas de transfert
  automatique vers son développeur.
- APK 0.32.4 compilé sans permission INTERNET. Cela ne décrit pas les opérations
  propres à Android ou Google Play, qui ont leurs propres règles.
- Le site web est servi par un hébergeur : ses requêtes et données techniques
  d'hébergement ne sont pas assimilées à celles de l'APK hors ligne.

## Formulations de travail pour la version sans publicité

**FR.** La Conquête des Serpents conserve votre progression et vos réglages sur
votre appareil. Cette version de l'application ne transmet pas vos données de
jeu au développeur. Vous pouvez exporter un fichier familial et le partager de
votre propre initiative. Le destinataire reçoit alors les données de progression
contenues dans ce fichier. Contact de l'éditeur : à renseigner avant publication.

**EN.** La Conquête des Serpents stores your progress and settings on your device.
This app version does not send your game data to its developer. You can export a
family file and choose to share it. Its recipient then receives the progress
data in that file. Publisher contact: must be completed before publication.

**DE.** La Conquête des Serpents speichert deinen Fortschritt und deine Einstellungen
auf deinem Gerät. Diese App-Version sendet keine Spieldaten an den Entwickler.
Du kannst eine Familiendatei exportieren und selbst weitergeben. Der Empfänger
erhält dann die darin enthaltenen Fortschrittsdaten. Kontakt des Herausgebers:
muss vor der Veröffentlichung ergänzt werden.

**IT.** La Conquête des Serpents salva i progressi e le impostazioni sul dispositivo.
Questa versione dell'app non invia dati di gioco allo sviluppatore. Puoi esportare
un file familiare e scegliere di condividerlo. Il destinatario riceve i dati sui
progressi contenuti nel file. Contatto dell'editore: da completare prima della
pubblicazione.

Ces quatre textes sont des brouillons, pas une certification juridique ou une
relecture native. Ils ne promettent pas que l'interface du jeu est traduite.

## Pour la future version avec publicité et achats

Une pub non personnalisée peut encore utiliser l'adresse IP, des signaux du
terminal, interactions et diagnostics. Le détail dépend du SDK et des options.
Les états d'achat traités par Play et gardés dans le cache natif s'ajoutent à
cet inventaire. La v1 prévoit une validation client, sans service de reçus de
l'éditeur ; un futur serveur exigerait une nouvelle politique. Ne pas cocher
« aucune donnée collectée ou partagée » par défaut.

Avant rédaction finale : relever SDK et version, réglages enfant, initialisation,
permissions fusionnées, destinataires, finalités, données obligatoires/facultatives,
transit et conservation, suppression/contact et conditions géographiques.
Identifier ce que le développeur reçoit et ce que chaque fournisseur reçoit.
Le portail parental ne remplace pas une base légale ou un mécanisme requis.

La politique finale devra nommer l'éditeur et l'application, être accessible par
URL publique et depuis l'app, et rester cohérente avec Sécurité des données et
le comportement mesuré. Les brouillons « sans publicité » restent historiques
et ne sont pas réutilisés silencieusement pour cette version.

Source : [formulaire Sécurité des données Google](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en),
qui inclut les bibliothèques/SDK et la localisation approximative déduite de l'IP.

## Brouillon v1 avec publicité et achats — étape 4

**Proposition française pour l'espace parents, à compléter et relire. Ne pas
publier telle quelle.** Ce texte décrit une version future, pas l'APK 0.32.4 sans
SDK commercial. Aucune traduction ajoutée dans cette mission.

> La Conquête des Serpents est éditée par [nom légal/public à confirmer],
> joignable à [contact public à renseigner]. Cette politique concerne la version
> [version et date à renseigner] sur Google Play, dans [pays retenus].
>
> La progression et les réglages restent sur ton appareil. Le jeu ne crée pas
> de compte joueur et n'envoie pas les camps à l'éditeur. Tu peux exporter un
> fichier familial et décider de le transmettre ; son destinataire reçoit les
> données de progression du fichier. Les droits payants n'y figurent pas.
>
> Cette version pourra afficher de rares publicités entre les missions avec
> Google AdMob [SDK et version intégrés à confirmer]. Elles seront configurées
> pour les enfants, sans personnalisation ni remarketing. Même ainsi, Google
> peut recevoir des informations techniques : IP, interactions publicitaires,
> diagnostics et identifiants utilisés [inventaire final à compléter après
> recette]. L'IP peut servir à estimer une zone géographique approximative.
> L'absence d'ID publicitaire Android ne signifie pas absence de toute collecte.
>
> Google Play gère les paiements et contrôles familiaux. L'app vérifie et confirme
> les achats, puis conserve sur l'appareil les produits et droits connus pour
> leur utilisation hors ligne. L'éditeur n'a pas de serveur de reçus dans cette
> version. Le jeu ne demande ni ne stocke de numéro de carte bancaire. Restaurer
> un achat dépend du compte Play acheteur ; effacer les données locales peut
> nécessiter une nouvelle restauration.
>
> Finalités, destinataires, durées de conservation et modalités de suppression :
> [inventaire final et liens fournisseurs à compléter]. Effacer les données de
> l'app supprime les copies locales ; cela ne supprime pas l'historique chez
> Google et ne rembourse pas un achat. Pour les données, contacte [contact] ;
> pour les achats, utilise aussi les fonctions et l'assistance Google Play.

À finaliser : responsables et rôles selon pays, bases applicables et mécanismes
parents, destinataires exacts dont UMP si retenu, traitements optionnels,
chiffrement constaté, durées réelles par fournisseur, suppression et URL publique
accessible sans compte. Aucun délai de conservation inventé ici.

Le corps de la fiche AdMob décrit25.5.0 ; confronter cet inventaire générique
à la configuration enfant, au manifeste fusionné et aux observations réseau. Voir
[Sécurité des données v1](SECURITE-DES-DONNEES-V1.md) et
[monétisation](MONETISATION.md). Sources et limites :
[divulgation AdMob](https://developers.google.com/admob/android/privacy/play-data-disclosure),
[données Play](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en).

Aucune pub pendant le test fermé avant visualisation du format sur le S24 et
GO explicite du parent. Une variante sans pub mais avec achats devra avoir une
portée fidèle au build, sans recopier l'inventaire d'un SDK publicitaire absent.
