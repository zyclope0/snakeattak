# Soutien Web bilingue — 16 novembre 2026

## Résultat

Le parent a approuvé le lien PayPal créé et le texte de confidentialité français /
anglais. Le soutien est activé dans les pieds des10pages publiques et dans les pages
parents FR/EN, sous le nom « Soutenir le développement » / « Support development ».
Mention claire : adultes, facultatif, ponctuel en CHF, aucun avantage de jeu.

Le jeu conserve sa coquille HTML de32636octets, sous le plafond32768, et ses menus.
Aucune ligne ajoutée au panneau parents : accès par les liens existants « À propos » /
« About » puis les pages parents publiques. Le moteur, les valeurs, les sauvegardes,
les anciens codes, le numéro de version et le compteur Android sont inchangés.

La source unique de confidentialité contient exactement la section bilingue approuvée,
datée du16novembre2026 ; les anciens engagements sont toujours comparés à l'archive.
Une fixture indépendante fige le nouvel ajout. Aucun paiement réel, publicité, SDK,
iframe, compte enfant ou suivi publicitaire ajouté. Les liens ouvrent le site PayPal
avec `noopener noreferrer nofollow`, sans profil ou code transmis.

## Vérifications locales

| Contrôle                               | Résultat                                                                                                             |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Baseline `npm test`                    | 775tests,0échec                                                                                                      |
| Cycle ciblé découverte/confidentialité | 5échecs attendus avant implémentation ;13tests verts après                                                           |
| `npm run verify`                       | Format,775tests, typage, build et budgets verts                                                                      |
| `npm run test:browser`                 | Scénarios ordinateur, mobile812×375, portrait et Voyage ;0erreur de page                                             |
| `npm run test:discovery`               | 30combinaisons (10pages ×1280×800,780×360,375×812),0erreur,0requête externe avant clic,0échec réseau                 |
| Parcours de soutien au clavier         | 6ouvertures (FR/EN ×3tailles), destination exacte interceptée localement, nouvel onglet sans opener ; aucun paiement |
| Politique publique                     | FR/EN lisibles sans JavaScript, aucun cookie ou ressource externe chargée                                            |
| `npm run build:android`                | Build vert ; URL de paiement absente du HTML et de tous les fichiers JS                                              |
| Retour à `SUPPORT_URL = null`          | Erreur du contrôle reproduite avant correctif, puis cas désactivé vert                                               |

Captures : `artifacts/web-discovery/{fr,en}-parents-{1280,780,375}.png`.
Rapport navigateur : `artifacts/web-discovery/browser-report.json`.
`npm run build:portable` est vert : aucun lien de soutien ni URL de paiement dans
le fichier autonome. Contrôle final de format vert. Android :11fichiers HTML/JS
inspectés sans URL de paiement.

## Conseil de revue indépendant

| Point de vue      | Avis et preuve                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| Développement Web | Liens statiques sûrs, pas de dépendance ni changement du moteur                                  |
| Assurance qualité | Budget HTML préservé ; recette des pages et sorties distinctes                                   |
| Confidentialité   | Texte approuvé figé, anciens engagements comparés, données PayPal distinguées des données enfant |
| Parent            | Soutien facultatif explicite, en CHF, sans contrepartie                                          |
| Enfant6–8ans      | Action de jeu gratuit dominante, aucune sollicitation dans une partie                            |
| Enfant9–12ans     | Soutien discret dans les informations publiques, sans récompense                                 |

Aucun point critique ou important relevé. Deux détails mineurs de revue corrigés avant fusion :
contrôle de distribution compatible avec une désactivation du soutien ; documentation
d'architecture actualisée. La revue n'est pas un test effectué par de vrais enfants.

## Livraison et limites

Passage prévu : PR, cinq tâches CI vertes, fusion dans main, puis workflow officiel
« Publier le site » et vérification publique du commit et du contenu exact. Aucune autre
méthode de déploiement autorisée. Les numéros et liens d'exécution seront donnés dans le
compte rendu après cette publication ; ce bilan ne prétend pas une publication avant
son observation.

Aucun APK/AAB signé ni changement dans Play Console pour ce lot exclusivement Web.
La politique embarquée évoluera lors d'un prochain build Android à partir de cette source,
sans bouton de paiement. La recette PayPal publique hors connexion a confirmé le titre,
la description et CHF ; elle peut afficher des commandes en allemand selon le contexte.
L'identité visible sur un reçu réel et les frais débités restent non vérifiés. Aucun
anonymat ou avantage fiscal promis.

### Attente historique de la recette hors ligne

La première CI a signalé un écart dans `test:offline` : son attente littérale était
encore de5sections de confidentialité ; l'ajout approuvé en porte le nombre à6.
Le test a été actualisé et renforcé pour vérifier le titre de cette nouvelle section
hors ligne et l'absence de lien de paiement dans la fenêtre de l'application. Aucun
changement de comportement produit pour cette correction de recette. La recette
hors ligne corrigée passe localement :12parcours,110fichiers servis depuis le disque,
aucune requête externe, aucun fichier manquant, aucune erreur JavaScript.
