# Étape 2 — tutoiement des sources 0.32.3

GO du parent après le retour qualitatif S24 de l'étape 1. Base : 7932b56.
Branche fix/tutoiement-0323 dans le worktree isolé existant.

## Périmètre et arbitrages

- Remplacer les textes sources au vouvoiement, y compris les deux phrases
  reconstruites à la reprise et « placez » dans la vague des volants, oublié
  par le convertisseur. Inventaire révisé : 24 chaînes, pas les 13 initiales.
- Supprimer entièrement childCopy et ses appels. Le format des camps ne stocke
  pas message : aucune réécriture de sauvegarde n'est nécessaire. Conserver les
  formulations simples actuellement affichées, dont « Choisis un allié. », et
  écrire aussi le vocabulaire « alliés » dans les trois conseils concernés.
- Aucun changement de logique, de format de camp, de RNG, de code de départ ou
  de contenu des missions. Pas de nouvel asset, SDK, monétisation ni icône.
- Version patch 0.32.3/code 38 ; aucun déploiement ni passage à l'étape 3.

## Exécution

1. Baseline native et capture avant édition des témoins de parties, codes et
   checkpoints. Exclure seulement le champ de présentation game.message de la
   comparaison des états ; comparer tous les autres champs et les octets des camps.
2. Tests rouges : absence des pronoms et impératifs au vouvoiement, messages
   directement lisibles du moteur, reprise des anciens camps sans convertisseur.
3. Réécriture des sources, suppression du convertisseur ; adapter les seuls
   témoins/attentes éditoriales, avec justification explicite de chaque changement.
4. verify, navigateur et recettes concernées : textes, départs, camps anciens,
   pause, mobile, interface et présentation. Relecture indépendante finale.
5. Bilan et plan à jour, commit révisable ; STOP pour accord du parent.

## Journal

- Prévol : childCopy gère aussi un vocabulaire simplifié et une phrase initiale
  spéciale. Les supprimer sans reprendre les sources ferait régresser l'interface.
- Prévol : le témoin legacy de 180 états contient game.message. Un changement
  de texte ferait échouer son empreinte sans changer le combat. Enregistrer
  d'abord la même projection sans ce seul champ sur la base inchangée, puis
  documenter ancienne et nouvelle empreinte et conserver les gardes éditoriales.

- RED : les trois contrôles éditoriaux échouent sur la base inchangée ; le témoin
  de parties passe. Avant édition : 24 parties, 89 642 pas, 3 212 états ; tous
  les camps sont enregistrés octet pour octet. Trois classiques perdus, 21
  expéditions gagnées ; observation de comparaison, aucun rééquilibrage.
- Témoin legacy : l'empreinte complète 18761719…a0d1b est confirmée avant
  modification. Projection sans le seul champ message : 27f9cf29…b8e34a, également
  capturée avant édition. Aucun autre champ retiré de ce témoin de 180 états.

- GREEN : 425/425 natifs ; navigateur, audit13/13, child-mobile6, codec108 et
  parcours départ, prévision5écrans, présentation14scénarios, horsligne10,
  interface24/24. Revue indépendante : aucun point ; vérification séparée des
  témoins et deux empreintes contre les sources7932b56 chargées en mémoire.
- Contrôle lexical : seuls les25 littéraux autorisés changent dans les quatre
  fichiers du domaine ; espaces/commentaires et virgules finales facultatives
  de Prettier normalisés, aucun identifiant ni expression de calcul changé.
- APK38 compilé puis réassemblé avec démarrage normal, même appId/certificat,
  27 fichiers web identiques au build vérifié ; aucun SDK ni nouvel asset.
- Les rapports et captures historiques sont restaurés octet pour octet après
  conservation de la recette courante dans ses propres dossiers.
- Étape2 terminée. STOP, aucun accord déduit pour l'icône ou l'identifiant.
