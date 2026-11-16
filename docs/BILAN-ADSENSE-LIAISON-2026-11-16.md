# Liaison AdSense du site — 16 novembre 2026

## Livrable

Balise Meta de propriétaire et ads.txt, pour l’ID public transmis par le parent :
`pub-8498417364292905`. Destination : uniquement https://snakeattacktd.com/ et
https://snakeattacktd.com/ads.txt. Aucun code de diffusion publicitaire.

Le parent dispose déjà d’un compte ; le site n’est pas encore ajouté au dernier état
communiqué. Aucune approbation Google ou demande d’examen n’est prétendue. La suite
consiste à l’ajouter dans AdSense et demander son examen par la méthode de validation
Meta. Aucun mot de passe requis par Codex.

## Garanties de périmètre

- La balise est invisible et ne change pas les menus ou le plateau.
- Aucun script Google, encart, iframe, cookie publicitaire ou assouplissement de CSP.
- Confidentialité approuvée et textes « sans publicité » encore exacts : aucun changement.
- Les builds Android et portable excluent la liaison ; aucun APK/AAB signé produit.
- Règles, valeurs, sauvegardes, anciens codes et numéros de version préservés.

## Validation et livraison

- Baseline ciblée :6tests verts ; nouveaux contrôles observés en échec avant implémentation,
  puis8tests ciblés verts.
- `npm run verify` :777tests,0échec, format/typage/build/budgets verts.
- `npm run test:browser` : ordinateur, téléphone paysage/portrait et Voyage ;0erreur de page.
- `npm run build:android` et `npm run build:portable` : verts, ID et ads.txt absents
  des fichiers réellement embarquables.
- HTML Web :32706octets, sous32768 ;62octets de marge. Ne pas augmenter le plafond
  silencieusement lors de la future intégration publicitaire.
- Relecture indépendante : aucun point critique ou important. Une formulation mineure
  corrigée dans le journal de publication : « owner-supplied » plutôt que « approved »,
  pour ne pas suggérer une approbation Google.

La recette vérifie les chaînes exactes de la meta et ads.txt, l’absence d’activation
publicitaire et les sorties réellement construites. Les résultats finaux seront
consignés après exécution et dans la PR ; publication exclusivement par le workflow
« Publier le site » après CI verte, suivie du contrôle des deux adresses publiques.

## Suite avant diffusion réelle

Un emplacement manuel sur la page de jeu, hors du plateau et des commandes, compatible
avec la place réellement disponible. Traitement enfant, consentement et cookies à
cadrer avec les réglages actuels de Google ; confidentialité et pages parents bilingues
à actualiser et approuver avant activation. Pas de garantie « exclusivement éducatif ».
Les partenariats choisis directement restent envisagés plus tard.
