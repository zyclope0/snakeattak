# Révision 7 — le spinosaure (19 novembre 2026)

## Ce que le fils a demandé

Rapporté par le parent le 19 novembre :

- « Sa morsure et sa voile sont très dangereux et il nage mais pas tous le temps pour pas trop
  déséquilibrer le jeux » ;
- il arrive dans la grande aventure, à la vague 8 ;
- le pierre-feuille-ciseaux entre dinosaures attend : « Il faut plus de dinosaures pour le
  faire ».

## Ce qui est fait

- **Nouvel allié « Spinosaure »** (« Spinosaurus » en anglais), seulement dans une grande
  aventure de la révision 7, dès la vague 8. 420 pièces, vie 400 (celle du tyrannosaure),
  morsure 84, portée 60, vitesse 66, une morsure toutes les 1,3 s. Aucune mission, aucun
  défi, aucun voyage ne le propose (`allyExists` dans `src/balanceRevision.ts`).
- **La voile** : chaque morsure touche aussi les serpents au sol à 72 pas de lui, devant
  comme derrière, pour le quart de la morsure. Un éventail orange s'ouvre autour de lui.
- **La nage, pas tout le temps** : au plus toutes les 20 secondes, si un serpent marche sur un
  pont à 240 pas de lui, il plonge dans la rivière (rond d'eau, « plouf »), nage jusqu'au
  bord du pont, mord ce serpent une fois (morsure et voile), puis revient au camp. Dans
  l'eau, il est enfoncé jusqu'au ventre. Une vague finie pendant qu'il nage le remet sur la
  rive, et sa prochaine vague commence plongée prête, comme un camp relu d'une sauvegarde
  (`src/engine/swim.ts`).
- **Dessin** en pâte à modeler, accepté par le parent ; il occupe la première case d'une planche
  de 2 × 2, comme les autres, pour que son portrait soit entier dans les menus
  (`public/assets/illustrated/PROVENANCE-SPINOSAURE-2026-11-19.md`, 306 crédits).
- **Catalogue des alliés** : avec le spinosaure, une grande aventure montre 21 alliés. Les
  deux onglets montent dans la ligne du titre ; les 21 cartes de 48 px tiennent sur un
  téléphone couché de 780×360 et de 812×375, sans faire défiler.
- **Codes et sauvegardes** : une nouvelle grande aventure a le code `AVENTURE-9-…` et un camp
  de version 14. Les anciens codes et les anciennes sauvegardes gardent leurs règles ; un
  camp d'une révision plus ancienne qui contiendrait un spinosaure est refusé.
- Page « Nouveautés » du site : un bloc sur le spinosaure, en français et en anglais.

## Mesure (200 grandes aventures par ligne, vrai moteur)

Le joueur « dino » joue comme le joueur expert et recrute deux grands dinosaures dès qu'ils
arrivent. Le joueur « gros » achète les alliés les plus chers.

| Joueur                     | Révision 6             | Essai (voile ½, nage 14 s, vie 460) | Retenu | Après relecture |
| -------------------------- | ---------------------- | ----------------------------------- | ------ | --------------- |
| dino (2 grands dinosaures) | 56 % (2 tyrannosaures) | 84 %                                | 71 %   | 69 %            |
| gros                       | 49 %                   | 62 %                                | 58 %   | 59 %            |
| expert (sans spinosaure)   | 67,5 %                 | —                                   | 67,5 % | 67,5 %          |
| moyen, vague moyenne       | 10,01                  | —                                   | 10,01  | 10,01           |
| petit, vague moyenne       | 7,43                   | —                                   | 7,43   | 7,43            |

Essais intermédiaires, joueur « dino » : sans voile 52 % ; sans nage 82 % ; voile ¼ 75 % ;
voile ¼, nage 20 s, vie 400 : 71 %. C'est la voile qui fait presque toute la force.

Le parent a choisi le 19 novembre « Voile 25 %, nage 20 s, vie 400 », la proposition la plus
sage, et le dessin. Les joueurs qui ne recrutent pas de spinosaure jouent exactement comme en
révision 6 (mêmes chiffres, mêmes parties de référence).

« Après relecture » : mêmes valeurs, nage corrigée (voir plus bas) ; mesure refaite pour les
deux joueurs qui recrutent des spinosaures. Les trois autres n'en recrutent jamais.

Fichiers : `artifacts/spino/mesure/` (hors Git).

## Relecture à huit angles (19 novembre) et corrections

- Une plongée annulée avant l'eau (serpent mort ou parti) le faisait glisser tout droit vers la
  rive, à travers un rocher : il reste maintenant sur place et marche comme un allié.
- Il pouvait plonger vers un serpent que sa morsure n'atteint pas depuis l'eau, et y rester
  sans fin : il ne choisit plus que des serpents qu'il peut mordre depuis l'eau, et revient si
  le sien s'éloigne. Un rocher sur le chemin annule la plongée.
- Pendant qu'il nage, il ne compte plus dans la ligne que saute la sauterelle, ni dans les
  renforts envoyés vers un serpent bloqué.
- En sortant de l'eau en fin de vague, il ne se pose plus sur la place d'un autre allié.
- La partie de référence du spinosaure le recrute vraiment (et sa sauvegarde à la vague 9) ;
  un test vérifie qu'on y voit la voile et la plongée.
- Portrait : la planche était une seule case, les menus n'en montraient que la tête.
- Textes : plus de numéro de vague tapé dans la description ; « pas plus d'une fois toutes les
  20 secondes ». Son de morsure : celui des dinosaures. Eau jusqu'au ventre pour de vrai.
  Mouvement réduit : la voile et le plouf gardent leur taille. Fenêtre d'ordinateur étroite :
  les onglets repassent sous le titre.

## Comment c'est vérifié

- `tests/balance-revision-7.test.ts` : valeurs, révision courante, rien d'autre ne change,
  le spinosaure absent des révisions 1 à 6 et des missions, la morsure et le quart de voile,
  la plongée et le retour, une plongée toutes les 20 s au plus, pas de plongée sans serpent
  sur un pont ou trop loin, sortie de l'eau en fin de vague et sauvegarde, code
  `AVENTURE-9`. Contre-épreuve : sans la voile ou sans la nage, quatre de ces tests
  échouent.
- `tests/engine-traces.test.ts` : toutes les anciennes parties de référence sont identiques ;
  deux nouvelles en révision 7, dont une où le joueur recrute le spinosaure en premier.
- `tests/render-traces.test.ts` : l'empreinte des poses des anciens alliés est inchangée ; le
  spinosaure bouge comme le tyrannosaure.
- Captures sur Chromium : catalogue à 780×360, 812×375, 667×375 et 1280×800 ; spinosaure dans
  la rivière et voile sur le plateau.

## Pas vérifié

- Rien n'a été joué par le fils ni sur un vrai téléphone.
- À 667×375 (petit iPhone couché), la 21e carte demande de faire défiler.
- La plongée n'a pas de son de fichier : seulement deux notes du petit synthétiseur.
