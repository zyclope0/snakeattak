# Sécurité des données — brouillon v1, non soumis

8 novembre 2026, étape 4 documentaire. **Pas une déclaration finalisée.**
L'app0.32.4 reste sans achat, publicité ou INTERNET. Le tableau prépare une
variante avec publicité enfant et achats non consommables validés côté client,
sans serveur de l'éditeur.

## Réponses préparatoires, à confirmer sur le build exact

| Question du formulaire | Proposition et condition de preuve                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Collecte/partage       | Ne pas répondre « aucune collecte » pour un build avec pub : inclure SDK et traitements même sans serveur de l'éditeur                       |
| Collecte               | Relever les catégories ci-dessous dans le SDK exact et le trafic ; une transmission hors appareil peut compter sans revenir à l'éditeur      |
| Partage                | Qualifier chaque fournisseur et les exceptions Play applicables ; « prestataire » ne justifie pas automatiquement de répondre non            |
| Transit chiffré        | AdMob annonce TLS ; confirmer tous les chemins réseau du build, pont/UMP inclus, avant de cocher oui                                         |
| Obligatoire/facultatif | Décrire ce qui peut réellement être désactivé et quand ; l'achat « sans pubs » ne suffit pas à qualifier tous les traitements de facultatifs |
| Suppression            | Décrire effacement local et procédure fournisseurs ; effacer l'app ne supprime pas automatiquement les données chez Google                   |
| Comptes                | Aucun compte joueur prévu ; distinguer compte Play et définition du formulaire, sans inventer de création de compte dans le jeu              |
| Portée                 | Décrire les versions distribuées selon les règles du formulaire ; le test fermé n'autorise pas une déclaration inexacte                      |

## Inventaire à confronter au SDK et aux mesures

| Flux / type possible                        | Catégorie Play à examiner                                   | Destinataire / finalité à qualifier                    | Preuve manquante                                                                                                     |
| ------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| IP et estimation de zone                    | Localisation approximative                                  | Google/AdMob ; publicité et fraude                     | Trafic25.5.0 en mode enfant ; aucun GPS précis ajouté                                                                |
| Affichages, clics et vidéos publicitaires   | Activité dans l'application / interactions                  | Google/AdMob ; publicité, mesure, fraude               | Événements réellement envoyés                                                                                        |
| Pannes et performance du SDK                | Informations et performances de l'application               | Google/AdMob ; diagnostics                             | Types, destinataires, conservation ; aucun SDK analytique distinct choisi                                            |
| App set ID et autres identifiants possibles | Appareil ou autres identifiants                             | Google, selon configuration                            | Retrait AD_ID, absence AAID et inventaire des autres identifiants                                                    |
| État/produit/jeton d'achat                  | Informations financières / historique des achats à examiner | Google Play ; traitement et restauration               | Distinguer paiement Play et collecte imputable à l'app selon le formulaire ; pas de catégorie cochée automatiquement |
| Signaux de confidentialité si UMP retenu    | Selon les données réelles                                   | Google/UMP, si utilisé                                 | Version, traitements régionaux et enfant avant initialisation                                                        |
| Camps et fichier familial                   | Progression locale, sans envoi automatique à l'éditeur      | Appareil ; destinataire choisi manuellement au partage | Aucun camp reçu par les SDK ; export sans jeton ni droit payant                                                      |

Cette liste est une préparation conservatrice : elle n'affirme pas que chaque
catégorie est collectée ou partagée par le futur build. Le corps de la fiche
AdMob décrit25.5.0 ; il reste à confronter ce défaut générique au mode enfant.
Son résumé automatique ancien cite23.6.0 : ne pas le substituer au corps actuel.
Ne pas confondre pub non personnalisée, absence d'AAID et absence de données.

## Dossier requis avant validation et envoi

Conserver le graphe Gradle et les versions exactes du pont, Billing, AdMob, UMP
et de chaque adaptateur ; aucun réseau médié implicitement autorisé. Inspecter
le manifeste fusionné et les requêtes au premier démarrage, retour au premier
plan, pub de test, hors ligne, après suppression des pubs et lors d'une restauration.

Pour chaque flux, renseigner catégorie, collecte/partage et exception éventuelle,
finalité, caractère obligatoire, transit, conservation, suppression, destinataire
et preuve datée. Expurger les journaux : pas de jeton d'achat, e-mail, identifiant
appareil ou secret dans Git.

Relire ensemble formulaire, politique et variante distribuée. La politique doit
avoir responsable, contact et URL publics avant soumission. Les données de
l'hébergeur web restent distinctes de celles de l'APK. Aucun formulaire rempli
dans Play Console par cette mission.

Sources : [formulaire Play](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en),
[divulgation AdMob](https://developers.google.com/admob/android/privacy/play-data-disclosure).
Consultation et empreintes : [sources-etape-4.json](sources-etape-4.json).
