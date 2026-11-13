# Bilan 0.38.0 — préparé, pas encore publié

Rédigé le 13 novembre 2026 par Claude à la demande du parent. Le jeu affiche encore
**0.37.0** : ce numéro a couvert huit livraisons (builds 49 à 56) alors que le jeu a
beaucoup changé. Le passage à 0.38.0 est proposé pour le prochain build ; Codex l'applique
et complète la partie « Livraison ». Aucune règle, aucune valeur d'équilibrage et aucune
sauvegarde n'ont changé depuis la 0.37.0 d'origine.

## Fait depuis la première 0.37.0

Déjà en ligne (builds 52 à 56) :

- **Son.** Vrais bruitages et quatre musiques choisis par le parent, lus en continu ;
  musique et bruitages réglables séparément, mémorisés, activés au départ.
- **Réglages.** Une seule fenêtre (son, langue, effets légers, aide), ouverte de l'accueil et
  de la pause ; langue du téléphone au premier lancement ; retour à l'accueil depuis la pause.
- **Personnages.** Onze planches refaites en pâte à modeler, neuf planches de poses
  d'attaque, combattant à massue à la peau des autres.
- **Combat.** Éclair au coup, respiration, pièces qui volent, confettis de victoire ; marche
  calée sur la distance parcourue, serpents qui ondulent.
- **Plateau.** Dessiné aux pixels réels de l'écran, figurines réduites une fois, liseré fin
  vert foncé pour les alliés et rouge orangé pour les ennemis.
- **Accueil.** Forêt de l'illustration d'origine derrière les personnages, refuge au
  cristal, un objet du jeu sur chaque bouton du bas.

Dans `main`, à publier :

- **Missions et préparation.** Un objet du jeu par mission, sur les cinq onglets et sur les
  repères Terrain, Attaques, Œufs. La roue des réglages et les commandes courantes restent.
- **Carnet de caprices.** Vingt vignettes en pâte à modeler, une par nom de caprice ; une
  vignette pas encore gagnée reste pâle. Les noms et les annonces du fils ne changent pas.
- **Coup porté.** Le combattant garde le côté de son coup jusqu'à la fin du geste.
- **Onglets de la préparation.** Plus de mot qui déborde, en français comme en anglais.

Images : environ 4 700 crédits Magnific et 4 crédits Recraft depuis le début du chantier
graphique, avec l'accord du parent ; journaux dans `public/assets/illustrated/`
(`PROVENANCE-RESTYLE-2026-11.md`, `PROVENANCE-VIGNETTES-2026-11.md`). Les décors de
l'accueil et les objets des boutons sont dérivés d'images du dépôt, sans crédit.

## Vérifié

- `npm run verify` : 590 tests verts, empreintes de parties identiques
  (`tests/engine-traces.test.ts`).
- Les seize recettes de la CI vertes sur chaque lot fusionné.
- Captures contrôlées de 568×320 à 1920×1080, en français et en anglais, pour l'accueil,
  la carte des missions, la préparation et le carnet.
- Une course de la recette des menus (lecture trop tôt après une rotation) a été reproduite
  et corrigée sans retirer de contrôle.

## Pas vérifié

- Rien n'a été essayé sur le Galaxy S24 ni avec les enfants depuis le build 52.
- La fluidité du plateau net n'a été mesurée que sans carte graphique : ces chiffres ne
  disent rien du vrai téléphone. Le garde-fou de taille et « Effets légers » n'ont jamais
  tourné sur un appareil.
- Safari, Firefox, TalkBack, perte du contexte WebGL, taille de police agrandie d'Android.
- La lisibilité des vignettes et des objets à taille réelle n'a été jugée que sur captures.
- Les dents du T-rex en pose d'attaque attendent l'avis du fils et du parent.

## Livraison

À compléter par Codex : source figée, code Android, paquets, contrôles du site et de l'APK.

## Addendum — validation du T-rex

Le commit de Claude `3b2b00e` du13 novembre2026 confirme la validation par le parent de la pose d’attaque du T-rex, dents comprises. Cette validation remplace le suivi d’avis en attente dans le rapport préparatoire conservé ci-dessus. Aucun asset ni règle modifié.
