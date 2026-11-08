# Exécution — Suivi v0.32.1, étape 4 documentaire

8 novembre 2026. Mandat : « go etape 4 », critères de docs/PLAN-ACTUEL.md et
du message de mission. Base620a673, branche locale docs/monetisation-v1-0324,
worktree existant isolé conservé. Workflow executing-plans avec relecture finale.

## Périmètre et décisions d'exécution

- Achats non consommables dans l'app, acknowledge client, restauration au
  démarrage et cache hors ligne ; serveur de reçus facultatif ultérieur.
- Publicité : exigences, version exacte candidate et degré de preuve Familles,
  configuration enfant, permissions et brouillons de déclaration.
- Préparer la recette future, sans achat, publicité ou publication ; bilan et STOP.

Ruling : le GO explicite autorise cette étape documentaire sans attendre le choix
d'identifiant. Aucun choix déduit ; il reste requis avant le premier envoi Play.
Cela ne permet ni installation ni migration.

Ruling : uniquement des documents et preuves de lecture. Pas de0.32.5 ni de
nouvel APK : l'app reste0.32.4/code39. Un nouveau numéro suggérerait un changement
applicatif inexistant.

Ruling : aucun code de production ou test TDD ajouté à un texte de cadrage.
Contrôler sources, liens et diff applicatif ; exécuter les vérifications
existantes exigées par AGENTS.md, sans inventer un test de conformité SDK.

Pre-flight : le préflight store attend encore purchaseBackendVerified. Ne pas
modifier son code ou ce drapeau pour contourner le contrôle dans une mission
documentaire. Documenter sa future adaptation avec l'intégration v1.

## Sources consultées

Douze pages officielles relues par HTTP. SDK Index : visite Chromium, ouverture
de la ligne25.5.0, capture et texte dans reports/suivi-etape-4. Version et minimum
API24 confirmés ; aucun statut Familles individuel visible dans la vue obtenue.
La liste Familles mentionne AdMob19.0.0 et suivantes, mais ne certifie pas un
wrapper ni ses dépendances. Candidat exact25.5.0, vérification individuelle à
compléter avant intégration. Le corps de la fiche de divulgation AdMob porte
sur25.5.0 ; son résumé automatique cite encore23.6.0. Le corps fait foi, pas
ce résumé périmé. Inventaire générique à confronter au mode enfant réel.

## Suivi

- Références et conditions lues ; sources datées téléchargées.
- Documents et sources : rédigés, versions et limites explicites.
- npm run verify :425/425, zéro échec, format/types/build/budgets verts.
- npm run test:browser : ordinateur et mobile, tablettes, zéro erreur de page.
- Périmètre applicatif : diff vide sur les chemins protégés depuis620a673.
- Relecture indépendante :0Critical/0Important/1Minor proposé ; traitement ci-dessous.
- Bilan, sources et reçus finalisés ; commit local puis STOP, aucune intégration.

## Relecture finale et correction

Finding du relecteur : « remboursements/révocations détectés à la prochaine
lecture » trop général. La source précise qu'orders.refund sans revoke conserve
le droit. Je le requalifie Important pour le cadrage d'achat : promettre une
détection impossible peut conduire l'éditeur à choisir l'architecture sur une
garantie erronée. Coût si laissé : mauvaise attente sur les droits après remboursement.

Correction documentaire : distinguer remboursement et révocation, ne réconcilier
que les droits effectivement reflétés par une lecture Play complète réussie ;
ajouter ce cas à la recette et aligner le bilan. Source recontrôlée :
billing-integrate.txt:2178–2186. Aucun code n'a changé, pas de test de code ajouté.
Contrôle source et formulation finale passés (dix contrôles au total) ; aucun
test commercial déduit. Formatage final et diff vérifiés avant commit.

Final: Ruling: les résultats finaux et verification.json n'étaient pas jugés par
le relecteur car en préparation ; les contrôler moi-même avant le commit.
Confirmation Familles, pont et S24 sont des limites explicites, pas des validations
déduites de la relecture. Aucun autre finding ni mineur différé.
