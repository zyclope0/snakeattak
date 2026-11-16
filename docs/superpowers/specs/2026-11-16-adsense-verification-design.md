# AdSense Web — liaison du site avant diffusion

## Accord et périmètre

Le parent choisit AdSense automatique comme fournisseur, exclusivement sur le site du jeu.
Il fournit l’identifiant public `pub-8498417364292905` et indique que le site n’est pas
encore ajouté dans AdSense. L’activation réelle exige donc d’abord son approbation par Google.

Cette première livraison prépare la liaison : balise Meta à la racine du jeu Web et
`ads.txt` exact, publiés par le workflow existant. Aucun script Google, bloc publicitaire,
cookie publicitaire, assouplissement de CSP, changement de confidentialité approuvée,
APK/AAB ou achat. Les fichiers Android et portable restent sans cette liaison AdSense.

## Approches

Choix du parent : AdSense, fournisseur automatique ; le partenaire choisi manuellement
est différé jusqu’à ce que le jeu soit connu. Choix technique dans le cadre de l’autonomie :
un emplacement futur manuel, pour garder la maîtrise des menus. Les annonces automatiques
qui choisissent leurs propres emplacements ne seront pas activées.

Pour la liaison, la balise Meta et ads.txt évitent de charger le script publicitaire avant
le cadrage des traitements enfant et du consentement. L’extrait JavaScript de validation
est donc écarté à cette étape. L’ID n’est pas un secret ; aucun accès au compte nécessaire.

## Suite prévue, non activée

Un emplacement « Publicité / Advertisement » sur la page du jeu, hors du plateau et des
commandes, uniquement là où l’espace permet de préserver leur taille et une séparation
prudente (Google recommande150px avec le jeu). Pas de bannière pendant le combat sur S24.
Les dimensions et états exacts seront vérifiés par une maquette locale avant intégration.
Aucune annonce ne doit apparaître dans les remerciements à la place de cette demande.

Traitement enfant pour tout le trafic de jeu ; contexte plutôt qu’historique individuel.
La documentation du16novembre2026 indique TFAT / `data-tag-for-age-treatment="1"`
pour les demandes AdSense asynchrones. Revoir les exigences de consentement en Suisse,
France et autres pays desservis et les réglages exacts du compte avant tout appel réel.
Ne pas assimiler annonces non personnalisées ou limitées à une absence de cookies.

Après approbation du site : bloc d’annonce manuel et son ID public, réglages de sécurité,
contrôle des créations, confidentialité et textes parents FR/EN cohérents, recette locale
sans vraies annonces, puis accord de diffusion. La promesse « uniquement éducatif » n’est
pas faite : les catégories de blocage ne garantissent pas chaque création.

## Vérification

Format, typage, tests, budget HTML32KiB, navigateur ; contrôle des sorties réelles Web,
Android et portable. Après publication : balise et ads.txt à la bonne adresse, politiques
et données de jeu inchangées. Aucun faux statut d’approbation Google ni demande d’examen
annoncée par Codex : ces actions restent dans le compte du parent.

## Sources officielles consultées le16novembre2026

- https://support.google.com/adsense/answer/7584263?hl=fr — liaison Meta / ads.txt, approbation requise avant diffusion.
- https://support.google.com/adsense/answer/3248194?hl=fr — traitement enfant et balise TFAT.
- https://support.google.com/adsense/answer/2768340?hl=en — séparation du jeu et des annonces.
- https://support.google.com/adsense/answer/9007336?hl=fr — données/cookies même sans personnalisation.
