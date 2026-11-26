# Bilan — boss caché, lot 1 : les pommes (26 novembre 2026)

Décisions du parent du 26 novembre ([BOSS-CACHE.md](BOSS-CACHE.md)) : une pomme toutes les
trois vagues, partout, discrète, jusqu'à la fin de sa vague ; 12 pommes ouvriront le boss
caché. Ce lot fait les pommes seulement : ni boss, ni bouton de l'accueil, ni compteur sur
l'accueil. Rien n'est publié.

## Ce qui est fait

1. **La règle** (`src/apples.ts`, sans navigateur) : une pomme pendant chaque vague dont le
   numéro compté depuis la première est un multiple de 3 (`APPLE_EVERY_WAVES`) — vagues 3, 6,
   9, 12 de la grande aventure, vague 3 d'une mission ou d'une bataille de la Grande
   Expédition, 3, 6, 9… de l'aventure sans fin comptées par `endlessWave`. Elle se montre
   entre 4 et 15 secondes de jeu après le début de la vague (`APPLE_DELAY_SECONDS`), le temps
   du jeu (la pause l'arrête), et reste jusqu'à la fin de la vague, sans minuteur. Son nom :
   `graine:vague` (`33:3`). Le tirage vient d'une suite à part (`mixSeed` de la graine de la
   partie et de la vague) : rien n'est pris à `game.rng`, aucun champ n'est ajouté à `Game`.
2. **L'endroit** : trois zones du haut du plateau (`APPLE_ZONES`) — le coin gauche côté
   serpents, une bande juste sous les mots du milieu, le coin droit au-dessus du camp — hors
   des routes (marge du décor : rayon + 43), du ruisseau, des rochers et des décors tirés par
   `stageComposition` (réutilisé, non modifié), à l'écart des mots que la page écrit au milieu
   (voies du refuge, jauge du roi), au-dessus du camp (un toucher qui place un allié ne tombe
   jamais sur la pomme), jamais en bas (la ligne des annonces). Une place est trouvée sur les
   six terrains pour 18 000 graines essayées.
3. **Le plateau** (`src/render/appleLayer.ts`, couche `DEPTH.apple` = 9,2) : l'image
   `pomme.webp` est chargée à part des planches du combat ; si elle n'arrive pas, une pomme
   simple est dessinée, et la bataille n'attend jamais. Un toucher à moins de 24 px CSS du
   centre (cible de 48 px à toutes les tailles) est traité en tête de `pressBoard` : il garde
   la pomme et ne place ni allié ni miel. Retour : petite gerbe (`Presentation.appleFound`),
   bouffée (`BattleJuice.pop`, rien si mouvements réduits), le son des pièces
   (`soundFrame.apple`), et « Pomme 3 / 12 » / « Apple 3 / 12 » (`TEXT.pommeNSurN`,
   `src/texts/*/board.ts`). Une pomme déjà trouvée ne revient pas.
4. **Le carnet du joueur** (`src/appleBook.ts`, clé `conquete-serpents:apples:v1` ajoutée à
   `PLAYER_KEYS`) : `{ version: 1, found: [...] }`, lecteur strict (refuse au moindre doute,
   600 caractères au plus), sans doublon, arrêté à `APPLES_TO_UNLOCK` = 12 ; une écriture
   refusée attend et est réessayée à chaque sauvegarde, et « Ta partie n'est pas gardée » le
   dit, comme pour les records.
5. **Le fichier familial version 7** (`src/familyBackup.ts`, `src/familyExtras.ts`) : un
   quatrième extra, `apples`, lu par le carnet. Un fichier sans pommes s'écrit toujours en
   version 6 (ou plus ancienne) : une version plus ancienne du jeu le lit encore ; un fichier
   version 6 qui porterait des pommes, ou version 7 sans pommes, est refusé.

## Comment c'est vérifié

- `tests/apples.test.ts` : vagues à pomme dans chaque mode ; endroit et temps stables et
  retapés pour deux graines ; la partie n'est pas touchée (`game.rng` et `JSON.stringify`
  identiques) ; 1 800 pommes sur les six terrains, toutes hors des routes, rochers et décors ;
  les zones loin des repaires, du ruisseau, du camp et des mots du haut.
- `tests/apple-book.test.ts` : lecture, 20 carnets douteux refusés, doublons, arrêt à 12,
  écriture refusée puis réessayée, oubli après un import.
- `tests/family-extras.test.ts` : aller-retour version 7, version 6 inchangée sans pommes,
  refus des versions mal écrites, collecte et écriture sous la clé.
- Tests retapés mis à jour : clés de stockage (18), clés d'un joueur (12), couches du plateau,
  `FAMILY_APPLES_VERSION` = 7 et `APPLES_TO_UNLOCK` = 12, empreinte de `check.yml`.
- **Empreintes des parties rejouées (`tests/engine-traces.test.ts`) inchangées.**
- `npm run test:apples` (nouvelle recette, groupe « écrans » de la CI) : banc d'essai du
  vrai plateau en 780×360 tactile (mouvements réduits) et 1280×800 : aucune pomme aux
  vagues 1 et 2, pomme à la vague 3 après 4,7 s, un toucher la garde (1 dans le carnet), un
  allié choisi n'est pas placé, rien n'est payé, elle s'en va ; une pomme déjà trouvée ne
  revient pas ; une pomme laissée part à la fin de sa vague. Puis le site construit, vrai
  démarrage, camp de l'aventure avant la vague 3 en 780×360 : pomme gardée sous la clé du
  joueur, pièces inchangées.
- `npm run test:saves:family` étendu : l'appareil a deux pommes, l'export est en version 7,
  la restauration, la copie avant import et le retour en arrière les rendent à l'identique.
- Paquet principal : 193 104 → 195 791 octets sur 200 000.

## Ce qui n'est pas vérifié

- Rien sur le vrai téléphone, rien avec les enfants : la pomme est-elle trop discrète, ou pas
  assez ? Le fils la trouve-t-il ?
- Pas de compteur sur l'accueil (prévu au lot suivant avec le bouton du boss).
- Le son de la pomme est celui des pièces : un son à elle serait une dépense.
