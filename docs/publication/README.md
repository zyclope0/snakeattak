# Dossier Google Play — préparation, pas une publication

Jeu de référence actuel : **0.32.4**, étape4 documentaire. Le parent confirme le modèle gratuit avec publicité
rare, suppression des pubs payante et cosmétiques payants sans avantage de combat.
L'APK reste sans publicité ni achat intégré. Le compte Play personnel est créé,
validation d'identité en attente selon le dernier retour. Prix, produits,
identité publique et identifiant final restent à choisir. La v1 prévoit la
validation et l'acknowledge dans l'app, sans serveur de reçus obligatoire.
[Cadrage actuel](MONETISATION.md), [bilan de l'étape4](../BILAN-0.32.4-etape-4.md).
Aucune publicité pendant le test fermé avant visualisation sur S24 et accord
explicite du parent. Aucun SDK commercial ajouté par cette étape documentaire.

## Utiliser ce dossier

```sh
npm run store:check -- --draft
npm run store:captures
npm run store:check
```

Le mode draft tolère les **éléments encore à faire**, mais échoue sur une erreur
technique. Le mode strict échoue aussi tant que ces réserves ne sont pas levées.
Le rapport indique toujours que la publication automatique n'est pas autorisée :
une checklist locale ne certifie ni les SDK, ni les politiques, ni le compte Play.
Le préflight est un outil de préparation, pas un certificat de conformité.

Le script de captures utilise le dernier `dist/` : lancer `npm run build` avant.
Il ne modifie aucune règle ni résultat ; il charge un camp initial légal, puis
joue avec les commandes de l'interface. Ses captures de navigateur sont à
comparer à l'APK réel avant leur usage public.

## Contenu

- MONETISATION.md : décisions validées, choix techniques et questions restantes.
- CONFIDENTIALITE.md : portée de l'APK actuel et rédaction future avec SDK.
- SECURITE-DES-DONNEES-V1.md : inventaire préparatoire, aucune déclaration soumise.
- PLAY-CONSOLE.md : compte, test fermé, achats de test, IARC et publication.
- configuration.json : checklist et cadence approuvée, services actuellement désactivés.
- fiches.json : textes FR/EN/DE/IT **brouillons** ; le jeu lui-même reste en français.
- sources.json : pages Google officielles consultées le 8 novembre 2026.
- sources-etape-4.json : nouvelle consultation, versions exactes et limites de preuve.
- captures.json et assets/ : images du jeu, mesures, version et empreintes.

Les textes sont à relire avant de les coller dans la Console. Aucune note PEGI,
validation de compte ou déclaration « aucune collecte » pour une version avec
publicité n'est présumée. Les six missions restent accessibles par la progression
normale : la limitation gratuite aux missions 1–3 proposée dans l'audit est écartée.

La configuration JSON, le préflight et le dossier HTML restent historiques :
référence0.30.1 et exigence purchaseBackendVerified encore présentes. Ne pas
cocher un faux serveur ou republier le dossier automatiquement ; adapter le
contrôle avec la future intégration client, sur GO distinct. Les captures ne
sont pas régénérées dans cette étape documentaire.

## Ressources graphiques fournies

Les originaux restent dans `../resources-2026-11/`, avec leurs empreintes.
L'icône retenue est la création s7XROQSl8e, source 2048×2048 conservée. Les coins
blancs sont retirés dans les dérivés0.32.4 : lanceur Android intégré et export
512×512 préparé, sans publication store. [Dérivés et provenance](../../resources/android-icon/README.md).
Son style pâte à modeler / papier mâché fait désormais foi. Les fonds crue et marais
restent réservés au lot 6 ; ils ne remplacent pas artificiellement les captures.

Le brouillon de bannière 0.26 est remplacé, dans ce dossier, par une capture de
la version de capture en 1024×500. Aucune génération d'images payante n'est nécessaire
pour ces captures. Leur version doit être contrôlée avant usage public.
