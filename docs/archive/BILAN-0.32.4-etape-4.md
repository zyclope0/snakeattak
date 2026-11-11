# Étape 4 — monétisation v1 sans serveur, documents uniquement

8 novembre 2026, Europe/Zurich. GO explicite du parent « go etape 4 ».
Base620a673 ; branche docs/monetisation-v1-0324. Application conservée en
**0.32.4/code39**, site conservé en 0.32.3. Aucun nouvel APK ni déploiement.

## Constats du suivi, réalisation et preuves

Les cinq constats visuels/textuels initiaux restent dans les bilans des étapes
0 à 3 ; aucune nouvelle correction de gameplay ou d'écran dans cette étape.

| Constat / demande de l'étape 4                      | Fait / pas fait                                                                                                                                                                                                    | Preuve                                                                                                                                                                   |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Serveur de reçus présenté comme nécessaire          | **Fait, document** : v1 client seul, acknowledge natif ; serveur optionnel ultérieur et limites de sécurité explicites                                                                                             | [Achats et serveur](../publication/MONETISATION.md#achats--traitement-prévu-dans-lapp), [source officielle](https://developer.android.com/google/play/billing/integrate) |
| Droits au démarrage et hors ligne                   | **Fait, spécification seulement** : relecture au démarrage/reprise, cache séparé des camps, PENDING sans nouveau droit, retrait après lecture complète réussie                                                     | [Table des cas](../publication/MONETISATION.md#achats--traitement-prévu-dans-lapp)                                                                                       |
| SDK Familles dans sa version exacte                 | **Partiel pour la preuve individuelle** : candidat25.5.0 et liste officielle relevés ; version ouverte dans SDK Index, aucun statut individuel exploitable visible ; pont/transitives à examiner avant intégration | [Sources datées](../publication/sources-etape-4.json), [capture](../../reports/suivi-etape-4/ads-index-25.5.0.png)                                                       |
| Traitement enfant avant les requêtes                | **Fait, spécification seulement** : CHILD + noteG avant initialisation/préchargement, pas d'AAID, audit des initialisations automatiques et du trafic                                                              | [Ordre prévu](../publication/MONETISATION.md#ordre-obligatoire-avant-toute-requête-future)                                                                               |
| INTERNET et changement de portée des données        | **Fait, document** : permission future, AD_ID à retirer, manifeste fusionné et flux à inspecter ; « aucune collecte » exclu pour la variante avec pub                                                              | [Permissions](../publication/MONETISATION.md#permissions-et-données--ce-qui-change)                                                                                      |
| Brouillons confidentialité et Sécurité des données  | **Fait, non soumis** : rédaction parents et inventaire conditionnel, pas de catégories cochées sans preuve                                                                                                         | [Confidentialité](../publication/CONFIDENTIALITE.md#brouillon-v1-avec-publicité-et-achats--étape-4), [Sécurité des données](../publication/SECURITE-DES-DONNEES-V1.md)   |
| Pas de pub dans le test fermé avant retour S24      | **Fait, consigne documentaire** : build séparé d'annonces de test sur GO, parent voit puis donne un accord explicite ; pas de préchargement dans la variante sans pub                                              | [Portes de recette](../publication/MONETISATION.md#recette-future-et-passage-au-test-fermé), [Play Console](../publication/PLAY-CONSOLE.md)                              |
| Aucun SDK, achat, génération ou changement de règle | **Vérifié** : diff applicatif vide ; version, permissions, dépendances et sauvegardes conservées                                                                                                                   | [Rapport de vérification](../../reports/suivi-etape-4/verification.json)                                                                                                 |

## Sources et arbitrages

Douze pages Google relues en HTTP, empreintes et dates conservées. Le SDK Index
nécessite JavaScript : Chromium a ouvert la ligne25.5.0, minimumAPI24 confirmé.
La liste Familles couvre AdMob19.0.0 et suivantes mais demande une vérification
individuelle ; l'absence de statut visible ne vaut ni retrait de certification,
ni certification vérifiée. Sans preuve complémentaire, aucun GO d'intégration.
Le pont et les dépendances transitives ne sont pas choisis ni installés.

Le corps de la fiche de divulgation AdMob décrit25.5.0 ; un résumé automatique
ancien mentionne23.6.0. Le corps fait foi. L'inventaire générique ne remplace
pas l'observation des réglages enfant et du trafic du futur build.

La validation client est un compromis explicite demandé pour v1 : falsification
locale possible, révocations prises en compte lorsqu'une lecture Play complète
réussie les reflète, acknowledge dépendant du retour de l'app. Un remboursement
sans révocation peut laisser le droit actif ; la recette devra le distinguer
du retrait de droit. Le cache reste utilisable hors ligne.
Le serveur demeure une option pour améliorer ces protections plus tard.

Le GO documentaire permet de continuer sans choisir le package ; il ne tranche
pas les [trois identifiants proposés](../IDENTIFIANTS-APPLICATION.md). Pas de nouvelle
version, signature ou migration pour une modification de documents uniquement.

## Vérifications

| Commande / contrôle                     | Résultat                                                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| npm run verify                          | **425/425**, zéro échec ; formatage, types, build et budgets verts                                                                                        |
| npm run test:browser                    | Réussi : ordinateur/mobile, deux formats tablette, zéro erreur JavaScript                                                                                 |
| Lectures de sources ciblées             | **10 contrôles réussis** : huit faits de source et distinction remboursement/révocation relue dans source et document ; pas de validation SDK/app déduite |
| Périmètre, liens, source et permissions | Chemins applicatifs protégés inchangés, liens locaux contrôlés ; [reçus](../../reports/suivi-etape-4/verification.json)                                   |
| Relecture indépendante                  | Un point d’exactitude sur les remboursements, corrigé et contrôlé ; aucun autre constat, aucun mineur différé. Résultats finaux contrôlés par l’auteur    |

Pas de nouveau test de code : aucun comportement ni configuration de build
modifié. Pas de nouvel APK, test d'achat, requête publicitaire, test physique,
paiement ou formulaire envoyé. Les résultats antérieurs ne sont pas présentés
comme une nouvelle recette commerciale réussie.

## Écarts, risques et décisions encore attendues

- Confirmation Familles individuelle du candidat25.5.0 à compléter ; statut du
  pont et des transitives non vérifié. Aucun SDK commercial installé.
- Aucun contrôle physique du format publicitaire sur le S24 : pas de pub à
  activer sur la piste fermée avant cette observation et le GO du parent.
- Identifiant final, produits/prix, thèmes et espace parents à valider avant
  intégration ; coordonnées publiques et pays avant publication de la politique.
- Préflight existant encore basé sur purchaseBackendVerified et configuration
  historique0.30.1. Il reste bloqué ; adaptation future sur GO, pas de faux drapeau
  backend pour contourner son contrôle. Le dossier HTML historique reste inchangé.
- Achat/restauration, réconciliation après changement de compte, coupure réseau,
  acknowledge et remboursements restent des recettes futures, pas des faits acquis.

## Fichiers concernés

- docs/publication/MONETISATION.md : architecture client, données, recette et STOP.
- docs/publication/CONFIDENTIALITE.md : portée actuelle et nouveau brouillon v1.
- docs/publication/SECURITE-DES-DONNEES-V1.md : inventaire et réponses préparatoires.
- docs/publication/README.md et PLAY-CONSOLE.md : références cohérentes avec v1,
  compte créé et porte S24 ; aucun accès Console utilisé.
- docs/publication/sources-etape-4.json : nouvelle consultation ; sources.json
  et les bilans historiques restent conservés.
- docs/PLAN-ACTUEL.md, docs/BILAN-0.32.4.md (lien vers ce complément), ce bilan
  et docs/IMPLEMENTATION-ETAPE-4.md : état, limites et exécution.
- reports/suivi-etape-4 : capture, contrôles et reçus de vérification.

**STOP demandé pour l'étape 4. Ce cadrage ne donne pas le GO pour intégrer les
achats, la publicité, publier une politique ou lancer un test commercial.**
