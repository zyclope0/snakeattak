# L'aventure sans fin — compte rendu (20 novembre 2026)

Idée du parent : un mode où King Snake revient toutes les 12 vagues et où la partie continue,
avec un record de chaque joueur gardé sur l'appareil. Décisions, réglages et mesures :
[MODE-INFINI.md](MODE-INFINI.md). Architecture : [ARCHITECTURE.md](ARCHITECTURE.md),
« L'aventure sans fin ».

## Ce qui est fait

- **Le mode.** La grande aventure de la révision 7, jouée en boucle. Après King Snake, le même
  camp repart à la vague 1 ; les serpents sont plus forts, jamais plus nombreux (vie ×1,45,
  morsure ×1,2, prime de vague ×0,9 à chaque roi). Les alliés restent ouverts.
- **Les cadeaux.** Après les vagues 4 et 8 de chaque tour et après chaque roi, un cadeau parmi
  trois : la forge, l'armure, le marché, la rente, le cristal solide, la longue-vue, la réserve
  de miel (trois niveaux, cinq places, un nouveau prend la place qu'on lui donne), et les
  cartes « une fois » (allié offert, bourse, garde du cristal).
- **La porte.** « L'aventure sans fin » sur la page « Aventure classique », ouverte une fois
  King Snake battu dans la grande aventure.
- **Le record.** Chaque joueur voit le sien (vague atteinte, rois battus), sans classement entre
  joueurs. Une ligne par partie.
- **Après un roi.** « Continuer » ou « Rentrer avec mon record » : la partie reste enregistrée.
- **La sauvegarde.** Camp version 15 ; les anciennes sauvegardes et les anciens codes ne
  changent pas.
- **Le paquet principal** (lot précédent du même jour) : 199,3 → 188,5 Ko avant ce mode, 192,9 Ko
  avec lui (limite 200).

## Comment c'est vérifié

- `npm test` : 883 tests, dont 11 sur le moteur sans fin et 4 sur les records. Les empreintes
  des parties de référence (`tests/engine-traces.test.ts`) sont toutes inchangées.
- `npm run test:endless` (dans la CI, groupe « écrans ») : porte fermée puis ouverte, record,
  cadeau après un roi, « Continuer », « Rentrer avec mon record », cinq places pleines, à
  780×360, 812×375 et 1280×800 ; cibles de 48 px, pas de défilement de côté.
- Recettes déjà présentes, vertes en local : langue, navigateur, parcours, cadeaux,
  présentation, audit, téléphone enfant, interruptions, hors ligne, missions, caprices.
- Mesures : plus de 1 800 parties simulées sur le vrai moteur (`ENDLESS=1` dans
  `scripts/balance-modes.mjs`).
- Relecture à huit angles (deux relecteurs) : un héros entraîné rendait le camp d'après le roi
  illisible ; les alliés se refermaient à chaque tour ; une partie pouvait écrire plusieurs
  records ; les valeurs des cadeaux n'étaient pas rangées par version ; des règles étaient
  recopiées dans l'interface ; des pluriels étaient écrits dans le code. Tout est corrigé.

## Pas vérifié

- Rien n'a été joué par un enfant ni sur un vrai téléphone.
- Les mots des cadeaux (« +15 % », « la rente », « la longue-vue ») sont à relire avec le parent
  et le fils.
- La perte d'une vague se réessaie, comme dans la grande aventure : une défaite n'est donc pas
  définitive. À revoir si le parent veut un mode plus dur.
- La politique de confidentialité ne nomme pas les records (ils restent sur l'appareil, comme
  la progression) : à relire par le parent, le texte approuvé n'a pas été touché.
- Pas encore dans l'application Android : il viendra avec le prochain build.
