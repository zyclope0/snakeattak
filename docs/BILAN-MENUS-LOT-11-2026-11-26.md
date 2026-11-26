# Bilan — lot 11 : la pâte miel à la fin d'une partie et à la pause, le bouton en tête, un paquet plus léger (26 novembre 2026)

Trois décisions du parent du 26 novembre, posées une à une : « Pâte si assez large », « Oui,
le premier en miel », « Oui, à la demande ». Puis « go ».

## Ce qui est fait

1. **Le bouton en tête de la fin d'une mission est toujours en miel**
   (`bindPrimaryButton`, `src/ui/battleResult.ts`). Après une défaite, « Recommencer cette
   partie » montait en tête mais restait un bouton clair comme les autres ; après la dernière
   mission gagnée, « Rejouer avec un caprice » de même. Le bouton qui monte en tête prend
   maintenant le miel, et c'est le seul de la rangée ; les couleurs de la page reviennent quand
   le résultat s'en va (la même rangée sert dans le camp). L'aventure classique et le voyage
   avaient déjà leur bouton en tête en miel.
2. **La pâte miel là où le mot tient** (`src/ui/clayFit.ts`, règle dans `src/ui/homeSkin.css`).
   Le bouton en miel de la fin d'une partie et « Reprendre la partie » de la pause prennent
   le pain de pâte de « Jouer » quand leur mot tient sur une ligne, à l'intérieur du bord
   modelé de l'image (bord mesuré sur l'image : 40 px sur 720, plus le contour des lettres et
   4 px d'air). Sinon, ils gardent le miel à plat. Le dessin seul change : aucune taille,
   aucune marge. La mesure est refaite quand le bouton change de taille, de mot ou de couleur.
3. **La fenêtre « Sauvegarde familiale » est chargée au premier toucher de son bouton**
   (`src/ui/familyDoor.ts`, la porte ; `src/ui/familyControls.ts` dans un paquet à part). Si le
   paquet n'arrive pas, le bouton dit « Sauvegarde familiale indisponible » et le toucher
   suivant redemande. Le carnet des caprices l'était déjà (`capriceAlbums.ts` →
   `capriceBook.ts`) : la note du plan qui demandait de le faire était périmée.

## Ce que la mesure dit

- **Bouton en tête** (5 tailles, français et anglais, victoire et défaite d'une première
  mission, dernière mission gagnée, aventure classique) : un seul bouton en miel par rangée,
  toujours le premier.
- **Pâte ou miel à plat** : sur un téléphone couché, le bouton en tête seul sur sa rangée
  (210 à 258 px) prend la pâte ; « Mission suivante » à côté de « Rejouer avec un caprice »
  (102 à 126 px) la prend en anglais (« Next mission »), pas en français. Sur un grand écran
  (150 px), « Mission suivante » et « Recommencer cette partie » en anglais la prennent ;
  « Rejouer une aventure », « Rejouer avec un caprice » et « Recommencer cette partie » (sur
  deux lignes) gardent le miel à plat. « Reprendre la partie » / « Resume game » prend la pâte
  partout. Aucune boîte ne change de taille (mêmes mesures avant et après).
- **Octets** : `bootstrap` 196 341 → 193 358 (la porte gagne 3 998 octets, la pâte et le
  bouton en tête en coûtent 1 015) ; nouveau paquet `familyControls` 4 384. Marge sous le
  plafond de 200 000 : 6 642 octets.

## Comment c'est vérifié

- `npm run test:offline` (web et Android) : la fenêtre de la sauvegarde familiale s'ouvre sans
  réseau, depuis son paquet servi par le disque, et ce paquet n'est pas chargé avant le
  toucher (vérification ajoutée).
- `npm run test:family`, `npm run test:saves:family`, `npm run build:android`, tests
  unitaires, puis toutes les recettes de la CI sur la machine.
- Captures à 2× dans `artifacts/menus/lot11/` (fin d'une mission gagnée et perdue, aventure
  classique, pause).

## Ce qui n'est pas vérifié

- Rien n'a été essayé sur le vrai téléphone ni avec les enfants.
- Le délai du premier toucher de « Sauvegarde familiale » sur un téléphone lent n'est pas
  mesuré (paquet de 4 Ko lu depuis l'application, hors ligne).
