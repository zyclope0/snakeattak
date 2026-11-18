# Bilan — « Reprendre » après une mission gagnée (18 novembre 2026)

## Décision

Point 14 du parent : corriger « Reprendre », avec une donnée de plus sur l'appareil ; les
anciennes sauvegardes restent lisibles.

## Le défaut

Une mission gagnée laisse son dernier camp dans le fichier familial. Tant que le jeu restait
ouvert, l'accueil savait qu'elle était finie. Fermé puis rouvert, il ne le savait plus et
proposait « Reprendre ma mission » pour une mission déjà gagnée.

## Ce qui change

- Quand une mission est gagnée, le jeu note sur l'appareil la marque de son dernier camp :
  sa longueur et une petite somme de contrôle, pas une copie du camp
  (`conquete-serpents:mission-done:v1`, une par joueur ; effacer un joueur l'efface).
- À l'ouverture, l'accueil ne dit « Reprendre » que si le camp en attente ne porte pas cette
  marque. Il propose alors la mission suivante, comme juste après la victoire.
- « Reprendre ma mission » reste sur la page Missions, comme avant ; y rentrer efface la
  marque, et l'accueil redit « Reprendre ».
- Un nouveau départ, même de la même mission avec le même tirage, efface la marque : le jeu
  rejoue les mêmes camps, et l'un d'eux ne doit pas passer pour la mission gagnée. Importer
  un fichier familial l'efface aussi.
- Le fichier familial ne change pas. Stockage refusé ou marque abîmée : l'accueil se comporte
  comme avant, sans erreur. Une mission perdue ou laissée en cours dit toujours « Reprendre ».
- Rien ne change dans les règles, les parties, les codes ni les textes.

## Vérifié

- Relecture indépendante (huit angles) : elle a trouvé les deux cas ci-dessus (même mission
  rejouée, fichier importé), corrigés.

- Tests unitaires (`tests/mission-done.test.ts`, clés de stockage, clés des joueurs).
- Recette dans le vrai jeu (`scripts/mobile-resume-checks.mjs`, dans
  `npm run test:mobile-menus`), à 780×360 : mission laissée en cours, puis jeu rouvert →
  « Reprendre » ; mission 1 gagnée, puis jeu rouvert → « Jouer » ; « Reprendre ma mission »
  sur la page Missions, et après y être rentré → « Reprendre » ; mission rejouée depuis le
  résultat → la marque disparaît et l'accueil dit « Reprendre ». Sans chaque correction, la
  recette échoue.

## Pas vérifié

- Rien n'a été essayé sur un vrai téléphone ni avec les enfants. L'application Android
  ferme et rouvre le jeu comme un onglet : non essayé sur le téléphone.
