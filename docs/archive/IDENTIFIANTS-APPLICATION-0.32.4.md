# Identifiant définitif — choix du parent, étape 3

Trois propositions, **aucune appliquée**. L'APK 0.32.4 conserve exactement
com.conqueteserpents.famille, son namespace et son certificat de test.

| Proposition                                   | Avantages                                                                                                                    | Inconvénients / limite                                                                                                                   |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **com.conqueteserpents.famille — recommandé** | Identifiant déjà utilisé ; aucun changement de paquet pour les APK familiaux ; clair et indépendant d'un futur nom de studio | Centré sur ce jeu et son usage familial ; moins cohérent pour une future gamme sous une marque de studio                                 |
| io.github.zyclope0.conqueteserpents           | Namespace lié au compte GitHub zyclope0 déjà utilisé par le projet ; pas besoin de choisir un domaine de studio maintenant   | Plus long, lié à ce pseudonyme GitHub ; changer de paquet crée une installation distincte de l'APK actuel                                |
| com.zyclope.conqueteserpents                  | Court, organisé autour de la marque de développeur zyclope et réutilisable pour une gamme                                    | Le rattachement à un domaine zyclope.com n'est pas vérifié ; pas de disponibilité Google Play garantie ; paquet distinct de l'APK actuel |

Ces identifiants sont des propositions syntaxiquement valides, **pas une
réservation ou une vérification de disponibilité dans Play Console**. Aucun
compte Console n'a été piloté et aucun AAB envoyé pour cette étape.

Fixer le choix avant le premier envoi du paquet sur Google Play. Après création
d'une application publiée avec un paquet, changer d'identifiant signifie
publier une autre application : ce ne sera plus une mise à jour de la même fiche.
Le nom affiché du jeu et l'identifiant technique restent deux informations
séparées ; cette étape ne renomme pas le jeu.

Pour les APK de test, conserver identifiant **et certificat** permet de mettre
à jour l'installation actuelle. Un nouvel identifiant utilise un autre espace
de données Android : prévoir un export/import du fichier familial si ce choix
est retenu. Même identifiant ne suffit pas à garantir une mise à jour d'un APK
debug par une future version Play signée avec une autre clé ; cette transition
devra être préparée séparément. Aucune migration n'est appliquée ici.

**STOP : le parent choisit.** Ne modifier ni capacitor.config.ts, ni applicationId,
ni namespace, ni chemins d'activité avant ce choix et un GO de réalisation.
