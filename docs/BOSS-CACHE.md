# Le boss caché aux pommes — décisions et plan (26 novembre 2026)

Idée 8 du fils (15 novembre, `GAME_DESIGN.md`) : un boss final caché, en hommage au tout
premier jeu du serpent qui grandit en mangeant, qui se débloque en touchant des pommes
apparues discrètement tout au long de l'aventure. Il laissait le nombre de pommes au parent,
après mesure.

## Décisions du parent (26 novembre 2026, posées une à une)

1. **Où se bat-il ?** « Un combat à part » : un bouton « Boss caché » s'allume sur l'accueil
   quand les pommes sont trouvées ; un combat spécial, qu'on peut rejouer. Les autres modes et
   leurs réglages ne changent pas.
2. **Où sont les pommes ?** « Partout » : grande aventure, missions et Grande Expédition.
3. **Comment se bat-il ?** « Il grandit en mangeant » : un très long serpent en anneaux de
   pâte ; chaque fois qu'il avale un allié tombé ou du miel, il gagne un anneau ; chaque
   anneau détruit le raccourcit ; il est vaincu quand il ne reste que la tête.
4. **Combien de pommes ?** 12. Une pomme apparaît toutes les trois vagues, à un endroit
   discret du plateau, et reste jusqu'à la fin de sa vague (aucun minuteur). Une grande
   aventure en montre 4, les six missions environ 6, toute la Grande Expédition environ 17.

## Règles à tenir (celles du fils et du projet)

- Les pommes ne changent rien à la bataille : ni pièces, ni force, ni vague. Leur tirage ne
  prend rien aux tirages du jeu (une suite à part, tirée de la graine) : les parties et
  leurs empreintes (`tests/engine-traces.test.ts`) ne bougent pas.
- Jamais de retour quotidien, de minuteur ou de récompense de retour : une pomme s'attrape en
  jouant, quand on veut.
- Les pommes trouvées appartiennent au joueur (comme ses étoiles) et voyagent dans le fichier
  familial.
- Le boss : un dessin original en pâte à modeler, jamais une copie du jeu d'origine ; tout
  dessin est une dépense acceptée par le parent (reste du plafond du 26 novembre : 888
  crédits sur 1 500).
- Le combat du boss est une règle nouvelle : il passe par une mesure (joueur simulé) et
  l'accord du parent avant d'être publié.
- Le nom du boss est à demander au fils.

## Plan, en lots

1. **Les pommes** : où et quand elles apparaissent (module de règles, sans toucher au
   tirage du jeu), le toucher sur le plateau, le compte du joueur, le fichier familial, un
   petit compteur discret (« 3 / 12 » quelque part que l'enfant trouve). Recettes.
2. **Le combat du boss** : le serpent en anneaux, manger et grandir, perdre un anneau par
   coup assez fort, la tête seule = victoire ; un terrain et une armée de départ ; la
   mesure.
3. **Le dessin** (tête, anneau, queue, en pâte), le bouton de l'accueil, les textes FR/EN, le
   nom donné par le fils.

Rien n'est publié avant que les trois lots soient finis et que le parent ait dit oui.
