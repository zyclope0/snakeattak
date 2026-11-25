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
