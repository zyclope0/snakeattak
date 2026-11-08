# Modèle familial — décision du parent et réalisation restante

## Validé le 8 novembre 2026

- Jeu gratuit : progression, missions, troupes, statistiques et pouvoirs ne sont
  pas vendus. Les œufs ennemis restent la mécanique gratuite de combat existante.
- Pubs rares entre les missions, au plus une par dix minutes, après deux missions
  terminées, jamais pendant une vague.
- Achat unique pour supprimer les publicités ; cosmétiques payants uniquement.
- Aucun compte développeur Play disponible pour l'instant.

## Traduction technique proposée par le développeur

Pour rester sous ce plafond, le premier affichage attend aussi dix minutes
actives et deux missions gagnées. Les échecs, réessais, pauses et écrans masqués
ne déclenchent pas une pub. Deux nouvelles missions et dix minutes sont requises
avant chaque nouvelle pub. C'est plus protecteur que le seul plafond validé,
avec le coût d'afficher moins de publicité. Pas de pub au lancement, sur l'accueil,
pendant le classique ou avant que l'enfant ait joué.

Le calcul utilise le temps réel actif, jamais `game.time` accéléré en×2. Il vit
hors du moteur, ne consomme pas son RNG et ne change pas la difficulté. Les menus
ne remettent pas les compteurs à zéro. Effacer les données peut remettre la
période de grâce à zéro, ce qui réduit les affichages plutôt que les augmenter.

Une pub n'est proposée qu'après une action explicite pour quitter le bilan et
continuer. Si elle n'est pas prête, le jeu continue immédiatement. L'échec réseau,
l'absence de remplissage, le mode hors ligne et la reprise d'Android ne doivent
jamais bloquer une mission, un résultat ou une sauvegarde.

## Publicité destinée aux enfants

Google interdit les pubs personnalisées pour les enfants et impose l'utilisation
des versions de SDK Familles auto-certifiées. La fiche de la liste mentionne
AdMob, mais il faut vérifier **la version individuelle** dans le SDK Index avant
installation. Cela ne valide pas automatiquement un wrapper Capacitor.

Le candidat principal est Google Mobile Ads via un wrapper Capacitor maintenu,
avec configuration enfant appliquée avant toute initialisation ou requête.
Les docs actuelles introduisent `AgeRestrictedTreatment` et déprécient certains
réglages TFCD/TFUA : ne pas copier sans revue un exemple ancien. Note G maximale,
publicité contextuelle, absence d'AAID et de permission AD_ID pour cette cible,
configuration des traitements régionaux et vérification réelle du trafic.

Le format doit réellement pouvoir être fermé sous cinq secondes selon la règle
Familles applicable. Un faux bouton de fermeture ou une surcouche sur le SDK ne
constitue pas une solution. Ne pas intégrer un réseau qui ne satisfait pas ce
critère dans cette configuration. Source : politique Familles citée ci-dessous.

Le consentement ou le statut légal ne se déduisent pas d'une question dans le jeu.
La configuration exacte dépend du SDK et des pays ; elle reste à tester et relire.

## Achats et cosmétiques

Deux familles de produits non consommables, avec un prix direct fourni par Google :
suppression permanente des pubs et petits ensembles d'apparences. Pas de monnaie
virtuelle, tirage payant, abonnement, compte à rebours ou achat nécessaire pour gagner.
Les prix ne sont pas fixés ; l'ancienne hypothèse 3,99 € / 4 CHF concernait un autre modèle.

Premiers candidats cosmétiques : fanions du refuge et ornements du socle du
cristal. Même silhouette fonctionnelle, dimensions et visibilité des trois voies ;
ne pas modifier les contours de camp/ennemi ni teinter le décor en rouge-orangé
réservé aux serpents. Pas de nouvelle unité réservée aux acheteurs. Thèmes à
présenter au parent et à l'enfant avant production des assets.

La présentation des tarifs et achats reste dans l'espace parents. Le portail
parental doit être conçu et testé ; il ne prouve pas légalement l'âge. L'écran
Google Play et ses contrôles familiaux gardent l'autorité de confirmation.
Aucune simulation d'achat ne doit accorder un vrai droit dans une version livrée.

## Architecture d'achat proposée

Le gameplay reste local et indépendant du réseau. Un petit service distinct
vérifiera les reçus, accusera réception des achats et traitera annulations et
remboursements avec les API Google. Les secrets ne vont jamais dans l'APK.
Il ne gère ni dégâts, ni vagues, ni sauvegardes de bataille.

Les droits viennent d'un achat Play vérifié. Ils ne s'achètent pas en modifiant
un booléen local et ne sont pas transportés dans le fichier familial. La reprise
interroge le compte Play ; hors ligne, conserver les derniers droits vérifiés
sans promettre une nouvelle restauration ou un nouvel achat. Les remboursements
et achats en attente font partie des tests, avant d'activer quoi que ce soit.
Ne pas promettre qu'un achat intégré est partagé entre comptes de toute la famille.

Avec cette architecture, des jetons d'achat et des données SDK devront être
traités : la déclaration de confidentialité devra les décrire précisément.
Choix du service et du wrapper, durée de conservation et gestion des droits
hors ligne restent à finaliser avec l'intégration réelle.

## Passage au vrai test commercial

Compte Play et AdMob, identité/package définitifs, SDK/version vérifiés, produits
et prix validés, accès parents, backend de reçus, achats de licence de test,
restauration/remboursements puis compte rendu appareil réel. C'est seulement
après ces points qu'une version avec publicité pourra être appelée testable.

Sources principales : Google Play Familles [9893335](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en),
SDK Familles [12955712](https://support.google.com/googleplay/android-developer/answer/12955712?hl=en),
[traitement AdMob](https://developers.google.com/admob/android/targeting),
[sécurité des achats](https://developer.android.com/google/play/billing/security).
Consultation datée et empreintes dans sources.json. Ces sources ne constituent pas
une validation automatique de l'application.
