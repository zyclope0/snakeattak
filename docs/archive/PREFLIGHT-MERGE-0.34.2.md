# Préparation de la fusion v0.34.2

9 novembre 2026. Le parent autorise explicitement la fusion de la PR1 dans
`main`. Aucun autre changement applicatif n'est ajouté pour cette opération.

La vérification GitHub du commit `7414e2e` a échoué dans
`npm run test:presentation` : l'adaptateur `revealControl` cliquait toujours
sur le dock, devenu masqué après une victoire. Ce test de présentation n'avait
pas été exécuté dans la recette locale détaillée du bilan précédent ; les
441 tests et les autres recettes qui y sont listées avaient bien réussi.

Reproduction locale du même échec, puis correction exclusivement de tests :

- choisir un des vrais boutons de catalogue visibles, y compris celui du
  panneau de résultat ; aucun clic forcé ni suppression d'assertion ;
- fermer le catalogue volontairement ouvert avant de cliquer sur Recommencer ;
- figer le temps de rendu de la fixture tactique dont le moteur était déjà
  figé. Les effets réels dragon/dinosaure existaient au premier rendu, mais
  pouvaient expirer après 0,55 seconde avant l'observation par le navigateur.
  Aucune action fabriquée, aucun changement du moteur ou du rendu applicatif.

Les assertions de blocage, miel, ciblage du ninja, souffle et attaque du dino
sont conservées. Le journal d'échec contient désormais aussi les effets et
actions observés pour faciliter le diagnostic.

Vérification locale après correction : `npm run verify`441/441 et build verts ;
`test:browser` normal et export portable verts ; `test:presentation`14 scénarios
verts, dont bouclier royal, tir annoncé, pause et impact. Le scénario tactique
passe également avec les images retardées de 1500 ms. Les échecs initiaux et les
résultats verts sont conservés séparément. La fusion est conditionnée au
succès des contrôles distants du nouveau commit, sans contournement.

Les 30 fichiers du build normal restent identiques octet par octet au site
v0.34.2 et à l'APK livré. Aucun nouvel APK, asset, SDK ou changement de règle
n'est nécessaire. Les anciens rapports restent intacts ; preuves de cette
opération dans `reports/merge-0.34.2/` et état de fusion/CI sur la
[PR1](https://github.com/zyclope0/snakeattak/pull/1).
