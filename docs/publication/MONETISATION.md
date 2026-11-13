# Monétisation — version 1 sans serveur

**Étape 4 documentaire, 8 novembre 2026. Rien n'est intégré ni activé.**
État actualisé au 13 novembre2026 : application0.37.0/code55, sans publicité,
achat ou permission INTERNET. Le compte Play est activé ; le parent a envoyé le
build52 en test interne avec le paquet `com.conqueteserpents.famille` et confirme
son installation. Le build55 signé est préparé pour mettre à jour ce même canal.
Les choix ci-dessous restent documentaires ; aucun SDK ou produit intégré.
[Sources datées](sources-etape-4.json).

## Décisions du parent et propositions techniques

| Sujet           | Décision / statut                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Jeu             | Gratuit ; missions, unités, statistiques et pouvoirs ne sont pas vendus                                                 |
| Publicité       | Rare, entre missions : au plus une par dix minutes et après au moins deux missions terminées ; jamais pendant une vague |
| Produits        | Suppression permanente des pubs et cosmétiques sans avantage au combat, non consommables                                |
| Prix            | À choisir ; l'ancienne hypothèse3,99€ /4CHF concernait un autre modèle                                                  |
| Architecture v1 | Validation et acknowledge dans l'app ; serveur de reçus facultatif ultérieur                                            |
| Test fermé      | **Aucune pub tant que le parent ne l'a pas vue sur son S24 et n'a pas donné son accord**                                |

Propositions de confort conservées, distinctes du plafond validé : attendre
également dix minutes actives et deux victoires avant la première pub ; exclure
défaites, réessais et mode classique. Après chaque pub, attendre à nouveau
dix minutes et deux victoires. Compter le temps réel actif, pas le combat
accéléré. Ces modalités restent à vérifier lors d'une future intégration.

Pas de récompense conditionnée à une pub, de bannière sur le plateau, de pub
au lancement, de monnaie payante, d'abonnement ou de tirage payant. L'espace
parents présentera le prix local réel fourni par Play. Son contrôle d'accès
ne prouve pas légalement l'âge et ne remplace pas les contrôles de Google.

Cosmétiques envisagés : fanions du refuge et ornements du socle du cristal,
thèmes à valider avant production, dans la direction **pâte à modeler / papier
mâché de l'icône**. Conserver silhouettes, dimensions et contrastes fonctionnels,
ainsi que la teinte rouge-orangé réservée aux ennemis. Aucun allié exclusif payant.

## Achats : traitement prévu dans l'app

Un adaptateur Android/Capacitor distinct des règles appellera Google Play Billing.
Il ne changera ni RNG, ni combats, ni prix en pièces, ni format des camps.
La documentation consultée utilise `com.android.billingclient:billing:9.1.0` :
repère de préparation, **pas une dépendance ajoutée ou un pont déjà choisi**.

1. Connecter Billing au démarrage et au retour au premier plan. Relire les droits
   par `queryPurchasesAsync(INAPP)` après connexion réussie et sur « Restaurer
   mes achats » dans l'espace parents.
2. Contrôler côté natif la signature des données originales avec la clé publique
   de licence Play de l'app, le package, le produit autorisé, le jeton et l'état.
   La clé publique n'est pas secrète ; aucune clé privée ni autorisation de service
   Developer API dans l'APK. Refuser réponse altérée et produit inconnu.
3. Pour un achat validé `PURCHASED`, enregistrer durablement le droit, de manière
   idempotente par jeton/produit, puis appeler `BillingClient.acknowledgePurchase()`
   si `isAcknowledged()` est faux. Ne jamais consommer ces produits permanents.
4. Persister le besoin d'acknowledge, réessayer après erreur/reprise. Une fermeture
   entre enregistrement et acknowledge ne doit pas perdre l'opération. La fenêtre
   normale Play est de trois jours à compter de `PURCHASED` ; sans confirmation,
   remboursement automatique possible. Le délai de test est plus court.

Google documente explicitement l'acknowledge pour une app cliente seule dans
[l'intégration Billing](https://developer.android.com/google/play/billing/integrate).
Les contrôles natifs proposés utilisent les données exposées par
[Purchase](https://developer.android.com/reference/com/android/billingclient/api/Purchase).
Ils ne constituent pas une vérification distante du reçu auprès de Developer API.

| Situation                                     | Comportement à vérifier avant activation                                               |
| --------------------------------------------- | -------------------------------------------------------------------------------------- |
| `PENDING`, refus ou annulation                | Aucun nouveau droit ; message parents, jeu gratuit accessible                          |
| Même retour reçu deux fois                    | Même droit, aucun doublon, acknowledge idempotent                                      |
| Lecture Play réussie et complète              | Réconcilier les produits possédés ; retirer un droit absent confirmé par cette lecture |
| Hors ligne, lecture incomplète ou erreur Play | Garder le dernier droit connu ; une erreur n'est pas une liste vide                    |
| Nouvelle installation hors ligne              | Aucun droit inventé ; restauration quand Play peut être interrogé                      |
| Droit « sans pubs » déjà connu                | Ne pas initialiser ni précharger le SDK publicitaire                                   |
| Droits encore inconnus                        | Aucune requête publicitaire pendant la vérification ; jeu accessible                   |

Le cache natif sera séparé des camps et exclu du fichier familial. Importer un
camp ne pourra ni acheter, ni restaurer, ni effacer un droit. Aucun e-mail ou
identifiant Google dans les sauvegardes du jeu. La restauration dépend du compte
Play acheteur ; ne pas promettre de partage entre comptes familiaux. Le changement
de compte et la relecture complète font partie de la recette.

### Limites de v1 et serveur facultatif

Un client et son cache peuvent être modifiés sur un appareil compromis. La
signature ne prouve pas à elle seule que l'achat est encore valide. Sans serveur,
les révocations ne pourront être prises en compte que lorsqu'une lecture Play
complète réussie les reflète. Un remboursement sans révocation peut conserver
le droit : ne pas confondre remboursement et retrait de l'achat. Hors ligne,
le dernier droit peut rester accordé. Sans reprise de l'app à temps,
un acknowledge en attente peut dépasser le délai. Ces limites n'empêchent pas
le jeu gratuit et ne doivent pas être cachées à l'éditeur.

La recette devra distinguer remboursement avec et sans révocation. Dans le
second cas, ne pas retirer un droit encore possédé selon Play ; la documentation
[Billing](https://developer.android.com/google/play/billing/integrate#handle_rejected_or_unfulfilled_purchases)
explicite cette distinction pour `orders.refund` et son paramètre `revoke`.

Google recommande une vérification distante pour mieux résister à la fraude
([sécurité Billing](https://developer.android.com/google/play/billing/security)).
Un serveur pourra être ajouté sur GO séparé : vérification des jetons, acknowledge
serveur, RTDN et achats révoqués. Revoir alors confidentialité, conservation et
transfert des jetons. Il ne calculera pas les combats et ne deviendra pas requis
pour jouer hors ligne. **Il n'est pas un prérequis de la v1 de cette mission.**

## Publicité : candidat exact et preuves disponibles

| Élément              | Constat au 8 novembre 2026                                                                                                                                                                                                                                                         |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SDK candidat         | Google Mobile Ads classique, `com.google.android.gms:play-services-ads:25.5.0`                                                                                                                                                                                                     |
| Version publiée      | Confirmée par les [notes officielles](https://developers.google.com/admob/android/rel-notes), datée du17septembre2026 ; minimumAPI24, comme le projet                                                                                                                              |
| Liste Familles       | [Liste officielle](https://support.google.com/googleplay/android-developer/answer/12955712?hl=en) : AdMob19.0.0 et suivantes, avec consigne de vérifier chaque version dans le SDK Index                                                                                           |
| Contrôle individuel  | Ligne25.5.0 ouverte dans le [SDK Index](https://play.google.com/sdks/details/com-google-android-gms-play-services-ads?hl=en) ; pas de statut Familles individuel visible dans la vue obtenue. **Confirmation individuelle encore requise**, aucune certification du build annoncée |
| Pont Capacitor       | Non choisi ; devra configurer le traitement enfant avant initialisation. Un wrapper ne bénéficie pas automatiquement du statut du SDK natif                                                                                                                                        |
| Versions transitives | Non résolues ici ; relever UMP, SDK et adaptateurs exacts sans plage flottante avant intégration                                                                                                                                                                                   |

Le guide signale maintenant ce SDK comme maintenu en mode « Legacy » et propose
GMA Next-Gen. Cela ne transfère pas la preuve Familles au nouveau SDK : aucun
choix Next-Gen implicite.25.5.0 reste une candidature à recontrôler avant
installation/publication. Sans preuve suffisante, garder la version sans pub.
[Capture de la ligne exacte](../../reports/suivi-etape-4/ads-index-25.5.0.png).

### Ordre obligatoire avant toute requête future

1. Publicité désactivée au démarrage. Vérifier droit « sans pubs » et GO de la
   variante ; sans GO ou en cas d'incertitude, aucune initialisation.
2. Avant initialisation, chargement ou préchargement, appliquer côté natif
   `AgeRestrictedTreatment.CHILD` et `MAX_AD_CONTENT_RATING_G` à la configuration
   globale. Avec25.5.0, `setAgeRestrictedTreatment` remplace TFCD/TFUA dépréciés ;
   ne pas réutiliser silencieusement un exemple pour une autre version.
3. Exclure personnalisation et remarketing, retirer AD_ID du manifeste fusionné
   et contrôler l'absence d'AAID transmis. Examiner les autres identifiants,
   consentements et traitements régionaux ; le seul réglage enfant ne signifie
   pas absence de collecte.
4. Contrôler les initialisations natives automatiques et options UMP. Un réglage
   JavaScript après le démarrage d'un wrapper serait trop tardif. D'abord des
   annonces de test seulement, puis inspection du trafic réel.

Référence : [ciblage AdMob Android](https://developers.google.com/admob/android/targeting).
La proposition v1 applique le traitement enfant à tous ; aucun écran d'âge
n'ouvre une route publicitaire adulte. Cela reste à vérifier techniquement.

### Permissions et données : ce qui change

La version avec pub devra déclarer **`android.permission.INTERNET`**, permission
normale qui n'affiche pas de demande de consentement Android. Inspecter aussi
`ACCESS_NETWORK_STATE`, `WAKE_LOCK` et les permissions fusionnées/transitives.
Ne pas ajouter GPS, téléphone ou stockage pour une pub. Retirer explicitement
`com.google.android.gms.permission.AD_ID`, déclarée par défaut par ce SDK,
et vérifier le résultat dans l'APK/AAB, pas seulement le manifeste source.
[Guide d'intégration AdMob](https://developers.google.com/admob/android/quick-start).

**« Aucune collecte » ne décrit pas une version avec publicité.** Les données
traitées par les SDK sont à déclarer même sans serveur de l'éditeur. Inventaire
initial : IP/localisation approximative, interactions avec les annonces,
diagnostics et identifiants éventuels. Le corps de la fiche AdMob décrit bien
25.5.0 ; son résumé automatique ancien mentionne encore23.6.0 et ne fait pas foi.
La fiche reste à confronter aux réglages enfant et au trafic du build réel.

Compléter puis relire avant distribution d'un build monétisé :
[brouillon de confidentialité](CONFIDENTIALITE.md#brouillon-v1-avec-publicité-et-achats--étape-4)
et [brouillon Sécurité des données](SECURITE-DES-DONNEES-V1.md).
Aucune déclaration envoyée ou politique publiée dans cette étape.

## Recette future et passage au test fermé

| Porte                        | Résultat requis avant de passer à la suivante                                                                                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GO d'intégration distinct    | Identifiant choisi avant premier envoi Play, produits/prix et espace parents validés ; SDK/version/pont relus. Ce document n'autorise pas l'intégration                                                |
| Achats de test               | Accepté/refusé/en attente, doublons, coupure avant acknowledge, fermeture/reprise, restauration, compte changé, cache hors ligne puis révocation à la reconnexion ; fichier familial sans droit payant |
| Publicité de test sur le S24 | GO pour un build de recette séparé, annonces marquées test ; configuration avant requête, trafic, permissions, marges système et fermeture native en 5 secondes au plus ; aucune charge réelle         |
| Accord explicite du parent   | Parent ayant vu le format sur son S24 ; pas d'accord déduit d'un retour « fluide » sur un APK sans pub                                                                                                 |
| Test fermé                   | **Sans pub jusqu'à ce retour et à cet accord** ; ensuite GO spécifique de la variante et déclarations cohérentes avec son contenu                                                                      |

Une pub ne sera proposée qu'après l'action explicite pour continuer depuis le
bilan. Si elle n'est pas prête, si le réseau manque ou si un droit « sans pubs »
est présent/inconnu, continuer sans attendre. Aucun préchargement en arrière-plan
dans un build dont la pub est interdite. Fermeture/échec ne relancent pas un
combat suspendu pour une autre raison.

La [politique Familles](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en)
impose notamment la possibilité de fermer après cinq secondes ce format
interruptif. Un SDK auto-certifié ne garantit pas chaque création affichée.
Pas de bouton de fermeture maison ni de clic forcé ; si le format ne respecte
pas cette contrainte, garder les pubs désactivées.

La [recette Billing](https://developer.android.com/google/play/billing/test)
servira aux futurs achats de licence de test. Une inscription à un test fermé
ne rend pas les achats gratuits : utiliser comptes et moyens de paiement de
test, puis vérifier le build distribué par Play. Aucun paiement ni test
commercial exécuté dans cette mission documentaire.

## Outils existants et STOP

Le préflight attend encore `purchaseBackendVerified` dans `deploy/playReadiness.ts`.
Sa configuration et ses résultats historiques restent inchangés et bloqués.
Lors de l'intégration v1, adapter ce contrôle pour distinguer validation client
testée et serveur optionnel ; **ne pas mettre un faux drapeau backend à vrai**.
Le dossier HTML et les captures historiques ne sont pas une preuve de préparation
commerciale actuelle.

Ce document prépare architecture et contrôles ; il ne prouve pas qu'un achat,
une restauration ou une pub fonctionne. **STOP après le bilan : aucune intégration,
création de produit, déclaration ou publication sans nouveau GO.**
