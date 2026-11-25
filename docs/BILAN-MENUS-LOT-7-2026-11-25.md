# Bilan — les menus à l'allure du premier écran, lot 7 : le camp (25 novembre 2026)

Suite de « Continuer les menus ». Demande du parent pour ce lot : « utilise tous les skills
graphiques front end, challenge avec plusieurs skills, compare avec des best-sellers du
domaine pour avoir un truc clean ». Lots précédents : [1](BILAN-MENUS-2026-11-24.md) à
[6](BILAN-MENUS-LOT-6-2026-11-25.md).

## Comment les choix ont été faits : trois regards, puis la synthèse

1. **Critique de design** (compétence `design:design-critique`), sur les captures du camp à
   780 × 360 et 1280 × 800 : le plateau est réussi ; tout ce qui l'entoure était resté au
   dessin « page web » d'avant l'habillage.
2. **Revue d'accessibilité indépendante** (compétence `design:accessibility-review`, WCAG 2.1
   AA, mesurée dans Chromium) : presque tous les textes passent ; les vrais défauts sont
   l'anneau du clavier doré, presque invisible sur le papier (1,8:1) et sur un bouton miel
   (1,1:1), des états invisibles dans la préparation, et deux états qui se confondent dans la
   colonne des alliés.
3. **Revue de système de design indépendante** (compétence `design:design-system`) comparée
   aux meilleures ventes du genre (un jeu de jardin contre des morts-vivants, un jeu de
   royaume à défendre, un jeu de ballons à faire éclater) : des **principes** seulement,
   rien de copié — une carte qu'on ne peut pas encore acheter s'éteint et se rallume sur
   place ; un seul nombre par carte, le prix ; on voit le danger pendant qu'on prépare ;
   une seule action principale, toujours à la même place ; peu de mots, des signes.

Deux propositions de la critique ont été écartées par la revue du système, avec raison :
pas de liseré miel sur l'onglet ouvert (le miel dit « à jouer », pas « où je suis ») ; pas
d'ombre portée sur les cartes d'alliés (elles ne sont qu'à 4 px les unes des autres).

## Ce qui est fait

Une feuille nouvelle, `src/ui/campSkin.css`, et les fenêtres du camp qui entrent dans
`windowSkin.css`. Comme toujours : seuls le trait, l'ombre et les couleurs changent.

- **Les fenêtres du camp** (la préparation d'une mission, les serpents annoncés, l'aide des
  outils) prennent le trait d'encre des autres fenêtres, et leurs boutons clairs celui du
  voyage. Le catalogue des alliés, panneau collé au bord de l'écran, et la fenêtre « Qui
  joue ? » gardent leur dessin.
- **L'anneau du clavier à l'encre dans les fenêtres de papier** (13:1 au lieu de 1,8:1) :
  on voit enfin où l'on est.
- **Les onglets de la préparation** : au repos, le bouton clair posé ; ouvert, enfoncé et
  vert, cerné d'encre. **L'onglet « Caprices » ne montrait jamais qu'il était ouvert** (sa
  propre règle l'emportait) : réparé.
- **Un caprice choisi, « Mission normale » choisie, un copain choisi** : le signe passe du
  contour, que l'anneau du clavier remplaçait, à un trait intérieur ; « Mission normale »
  choisie, qui n'avait aucun signe, en reçoit un.
- **Les serpents annoncés** : le trait d'encre, sans relief (ce sont des informations, pas
  des boutons).
- **La colonne des alliés pendant le combat** : le trait d'encre ; une carte choisie a le
  trait d'encre, plus la couleur de l'anneau du clavier ; **une carte trop chère perd le miel
  de sa pastille de prix, une carte en pause le garde** — avant, les deux étaient identiques
  au pixel près.
- **Un jeton de plus**, `--clearing-drop` (l'ombre nette posée, en px, pour les fenêtres et le
  camp), à la place de la même ombre écrite à la main.
- **Pas touché** : le plateau, la barre du haut, le catalogue des alliés, les annonces.

## Décisions du parent (25 novembre 2026 : « OK pour la coche et le retour »)

Deux propositions sortaient de la règle du lot (elles changent un signe ou une taille) : le
parent les a acceptées.

- **La coche sur l'allié choisi**, dans la colonne du combat : la coche du catalogue des
  alliés, en encre, dans le coin du portrait. Le prix reste dans l'autre coin.
- **« Retour » dans la préparation** : écrit plus grand (12 px → 16 px sur téléphone,
  25,6 px sur ordinateur) et plus étroit ; « C'est parti ! » prend la place libérée. La
  hauteur des deux boutons ne change pas.

## Décision du parent : la zone de jeu suit l'accueil validé

Question posée seule, réponse du parent : « Oui, les deux ». **« C'est parti ! »** (la
préparation) et **« Vague suivante »** (la barre du haut du combat) prennent le pain de pâte
miel de « Jouer » : la même image, les lettres claires cerclées de bois. Aucune image
nouvelle, aucun crédit dépensé ; la règle des menus est reprise, pas recopiée. Éteints, ils
gardent leur vert sombre. Mesure : 96 états (8 tailles, français et anglais), 3 970 boîtes
identiques ; seul leur dessin change.

Deuxième question, réponse « Oui, lui aussi » : **« Encourager »**, qui prend la place de
« Vague suivante » pendant une vague, a le même bouton ; retenu (déjà utilisé), il garde son
vert sombre. Vérifié en jouant une vague : pâte avant l'usage, vert sombre après, même boîte
(140 × 48 à 780 × 360).

## Comment c'est vérifié

- **Boîtes mesurées**, avant et après, sur les écrans du camp (préparation et ses quatre
  onglets, combat, dangers), en français et en anglais, à 780 × 360 et 1280 × 800, le tirage
  de la mission fixé (sans cela, deux ouvertures de la même version ne donnent pas la même
  mission) : avant les décisions du parent, **96 états et 3 970 boîtes identiques** ; après,
  seuls « C'est parti ! » et « Retour » changent de largeur, rien d'autre ne bouge.
- **Fenêtres du lot 6** remesurées : seules la couleur de l'anneau du clavier change (or →
  encre).
- **États forcés et clavier** : onglet ouvert, caprice choisi, carte choisie, trop chère, en
  pause ; anneau du clavier compté au pixel sur chaque pièce.
- **Captures** à 568 × 320, 780 × 360 et 1280 × 800 (dans `artifacts/`, hors Git).
- **Une attaque indépendante** du lot (agent séparé, sans mes conclusions).
- **Recettes de la CI** jouées sur la machine avant la PR.

## Ce que l'attaque indépendante a trouvé, et corrigé

- **L'anneau du clavier restait doré dans la préparation** : sa propre règle, plus lourde
  (`mobileMenus.css`), l'emportait ; le bilan disait le contraire. Une règle de plus, mesurée
  au clavier : l'encre sur chaque pièce.
- **Une fenêtre ouverte pendant le combat** (les dangers, l'aide des outils) met le jeu en
  pause sans montrer le voile : toutes les pastilles devenaient grises, comme « trop cher ».
  Elles gardent maintenant leur miel, comme en pause.
- **« Autre départ »** gardait son trait vert pâle à côté de « Rejouer » et « Retour » à
  l'encre : il prend l'encre.
- Laissé tel quel : un caprice choisi garde sa couleur sous la souris (avant, le survol la
  changeait à peine : #f5e4b5 contre #ffebbc). Sur tablette et téléphone, pas de survol.
- Plus ancien que ce lot, noté pour plus tard : le bas de l'anneau du clavier de « Autre
  départ » et du « ? » est coupé par le bord de sa rangée.

## Ce qui n'est pas vérifié

- Rien n'a été essayé sur le vrai téléphone ni avec les enfants.
- Restent des questions pour le parent, une à la fois : les boutons foncés de la barre du
  haut ; les cibles de moins de 48 px (croix
  de l'aide des outils, 44 px ; « Accueil » et « Comment jouer » sur tablette, 36 px de
  haut) ; le catalogue « Tous les alliés », lot à part.
