# Dossier Google Play — préparation, pas une publication

Jeu de référence : **0.30.1**. Le parent confirme le modèle gratuit avec publicité
rare, suppression des pubs payante et cosmétiques payants sans avantage de combat.
L'APK actuel reste sans publicité ni achat intégré. Le parent n'a pas encore de
compte Play Console. Les prix, produits, identité publique et identifiant final
ne sont pas décidés.

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
- PLAY-CONSOLE.md : compte, test fermé, achats de test, IARC et publication.
- configuration.json : checklist et cadence approuvée, services actuellement désactivés.
- fiches.json : textes FR/EN/DE/IT **brouillons** ; le jeu lui-même reste en français.
- sources.json : pages Google officielles consultées le 8 novembre 2026.
- captures.json et assets/ : images du jeu, mesures, version et empreintes.

Les textes sont à relire avant de les coller dans la Console. Aucune note PEGI,
validation de compte ou déclaration « aucune collecte » pour une version avec
publicité n'est présumée. Les six missions restent accessibles par la progression
normale : la limitation gratuite aux missions 1–3 proposée dans l'audit est écartée.

## Ressources graphiques fournies

Les originaux restent dans `../resources-2026-11/`, avec leurs empreintes.
L'icône retenue est la création s7XROQSl8e, source 2048×2048. Elle comporte des
coins blancs arrondis : elle n'est pas encore une icône store prête. Export
512×512 carré après correction, puis validation humaine. Les fonds crue et marais
restent réservés au lot 6 ; ils ne remplacent pas artificiellement les captures.

Le brouillon de bannière 0.26 est remplacé, dans ce dossier, par une capture de
la version actuelle en1024×500. Aucune génération d'images payante n'est nécessaire
pour produire ces captures. La correction créative de l'icône reste distincte.
