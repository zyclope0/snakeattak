# Planches refaites en pâte à modeler — 12 novembre 2026

Décision du parent le 12 novembre 2026, après comparaison de quatre outils (Magnific, Recraft,
Leonardo, Higgsfield) : garder les personnages, leurs poses et leurs couleurs, et ne changer
que la matière, pour des figurines plus vives et plus lisibles sur téléphone. Outil retenu :
la retouche de Magnific (`images_retouch`, mode `edit`), puis son détourage.

Onze planches de `src/assets/illustrated/` sont remplacées, toujours en 1024×1024, quatre
cases de 512 (mutants : 512×600), WebP sans perte : allies-front, allies-support, allies-elite,
allies-creatures, allies-dinosaurs, allies-mutants, enemies-organic, enemies-mechanical,
serpents-family, strongholds, miels-parapluie. Les fonds, `terrain-props`,
`props-three-bridges` et `interface-craft` ne changent pas. Les planches précédentes
restent dans l'historique Git et sur le compte Magnific.

Dépense totale du chantier : 1 618 crédits Magnific (essais compris) et 4 crédits Recraft.

## Planches faites en premier (essais validés en jeu)

| Planche | Source | Retouche retenue | Détourage |
| --- | --- | --- | --- |
| allies-front | tC4Ptr6mZJ | [lJosK3cgv9](https://www.magnific.com/app/creation/lJosK3cgv9) | 5jTbEkNKxe |
| enemies-organic | 8ayO8lSIrU | [N2QNzyF6D9](https://www.magnific.com/app/creation/N2QNzyF6D9) | bx0bgPL5Y2 |

Essais écartés : copie de style rgp1XZkxtc (couleurs changées), génération guidée ksMKE9M16B
(personnages retournés), retouche SyISNuoUb8 (peau orange, confondue avec le contour des
ennemis).

## Compléments après accord du parent

| Planche | Retouche retenue | Détourage | Remarque |
| --- | --- | --- | --- |
| allies-support | eIJeqf8dqL | 1lD1cNTr4r | détourage Magnific à la place du détourage local |
| allies-mutants | hu3hLKovqL | XmyXU5pBfo | idem |
| serpents-family | [yifytfkPW9](https://www.magnific.com/app/creation/yifytfkPW9) (qualité haute, 270 crédits) | xSexVzdjfW | remplace s7Bs3xNl8e : le cobra doré retrouve ses écailles et ses bandes ; le roi à trois têtes garde ses yeux rouges, bouches fermées |

## Journal détaillé des neuf autres planches


Compte Magnific Premium du créateur, projet Personal. Outil : `images_retouch`, mode `edit`, qualité `medium` (80 crédits), puis `images_remove_background` (3 crédits). Source de chaque retouche : l'image « Format production » 1024×1024 de PROVENANCE.md.

**Solde : 14 207 → 13 303. Dépense : 904 crédits** (11 retouches × 80 = 880 ; 8 détourages × 3 = 24). Plafond : 1000.

Rien n'a été écrit dans le dépôt. Fichiers : `full/<planche>.png` (détourage Magnific, 1024×1024 RGBA), `full-local-cutout/<planche>.png` (détourage local provisoire, à refaire sur Magnific), `planche-controle.png`.

Contrôle de géométrie (boîtes alpha > 60 par case, nouveau contre jeu actuel) : aucun côté ne bouge de plus de 40 px. Écart maximal : allies-elite bas-gauche, bas −25 px (chevalier à deux têtes) ; strongholds bas-gauche, droite −9 px ; allies-mutants icône bouclier, 8–9 px.

À faire avec accord : détourage Magnific de eIJeqf8dqL (allies-support) et hu3hLKovqL (allies-mutants), 3 crédits chacun ; reprise éventuelle de serpents-family (80 + 3).

## allies-support

- Source (format production) : jUDMjZNLD0 — https://www.magnific.com/app/creation/jUDMjZNLD0
- Essai 1 : retouche ksMkyCm16B — https://www.magnific.com/app/creation/ksMkyCm16B
  - Détourage : LwXL3TzswO (payé, inutilisé : essai 1 écarté)
- Essai 2 (reprise, retenue) : retouche eIJeqf8dqL — https://www.magnific.com/app/creation/eIJeqf8dqL
  - Détourage : AUCUN côté Magnific : appel refusé deux fois par le contrôle de permissions de la session. Détourage LOCAL provisoire (work/cutout.py)
- Crédits : 80 + 3 + 80 = 163
- Verdict : ACCEPTÉE (reprise), détourage Magnific À FAIRE. Essai 1 : géométrie bonne mais peau rose saumon, manteau du médecin devenu blanc — écart avec la planche allies-front validée (peau beige pâle). Reprise : peau beige pâle, manteau crème tricoté, bonnet et pull crème, mêmes poses. Fichier : full-local-cutout/allies-support.png (liseré blanc fin, corde de l'arc et monture des lunettes amincies par le détourage local). L'essai 1 détouré par Magnific est gardé dans work/alt/.

Prompt exact, essai 1 (ksMkyCm16B) :

```
MATERIAL CHANGE ONLY. This is a 2x2 game sprite sheet of four toy heroes on a plain background. Do not move, resize, rotate, mirror, add or remove anything: each figure stays in its own quadrant, same pose, same proportions, same silhouette, same props, same direction.

Re-sculpt the four figures in hand-made children's modelling clay (plasticine), like a stop-motion film: soft rounded volumes, smooth matte clay with faint fingerprints, slightly richer and more saturated colours so they read clearly at very small size on a pale sandy background. Warm soft light from the upper left, gentle shading, no harsh shadows. Friendly, brave, smiling faces with round open eyes.

Keep the identity and colours of each: top-left = archer with blond hair, moss-green hood and moss-green tunic, brown belt and brown quiver of arrows on the back, holding a brown wooden bow with an arrow pointing left, light natural beige skin, bare feet; top-right = nurse with a cream knitted bonnet carrying a small green leaf, cream knitted sweater, tan apron, holding a rolled cream bandage in both hands, facing left, light natural beige skin, bare feet; bottom-left = doctor with curly light blond hair, round thin glasses, closed smiling eyes, long cream knitted coat, grey-blue shoulder satchel with a small green leaf, brown boots, light natural beige skin; bottom-right = ninja with a dusty purple hood, purple face scarf with a long purple scarf tail blowing to the right, blue-teal quilted jacket, brown wooden sword held diagonally behind the back, big dark round eyes, light natural beige skin, bare feet.

Keep the background exactly as it is. No text, no outline stroke, no ground, no new objects.
```

Prompt exact, essai 2 (reprise, retenue) (eIJeqf8dqL) :

```
MATERIAL CHANGE ONLY. This is a 2x2 game sprite sheet of four toy heroes on a plain background. Do not move, resize, rotate, mirror, add or remove anything: each figure stays in its own quadrant, same pose, same proportions, same silhouette, same props, same direction.

Re-sculpt the four figures in hand-made children's modelling clay (plasticine), like a stop-motion film: soft rounded volumes, smooth matte clay with faint fingerprints, slightly richer and more saturated colours so they read clearly at very small size on a pale sandy background. Warm soft light from the upper left, gentle shading, no harsh shadows. Friendly, brave, smiling faces with round open eyes.

Keep the identity and colours of each: top-left = archer with blond hair, moss-green hood and moss-green tunic, brown belt and brown quiver of arrows on the back, holding a brown wooden bow with an arrow pointing left, bare feet; top-right = nurse with a cream knitted bonnet carrying a small green leaf, cream knitted sweater, tan apron, holding a rolled cream bandage in both hands, facing left, bare feet; bottom-left = doctor with curly light blond hair, round thin glasses, closed smiling eyes, long cream knitted coat, grey-blue shoulder satchel with a small green leaf, brown boots; bottom-right = ninja with a dusty purple hood, purple face scarf with a long purple scarf tail blowing to the right, blue-teal quilted jacket, brown wooden sword held diagonally behind the back, big dark round eyes, bare feet.

SKIN COLOUR, important: the faces, hands and feet of all four must be very pale cream-beige clay, the colour of light unpainted wood or oatmeal, exactly as pale as in the original image. Not pink, not salmon, not peach, not orange, no rosy tint.

Keep the background exactly as it is. No text, no outline stroke, no ground, no new objects.
```

## allies-elite

- Source (format production) : 3zQu3oFREY — https://www.magnific.com/app/creation/3zQu3oFREY
- Essai 1 : retouche yifyYUDPW9 — https://www.magnific.com/app/creation/yifyYUDPW9
  - Détourage : lJolZpZgv9 — https://www.magnific.com/app/creation/lJolZpZgv9
- Crédits : 80 + 3 = 83
- Verdict : ACCEPTÉE. Quatre cases en place, mêmes poses. Tunique du chevalier d'un bleu plus vif, casques et canon restés métal. Regard des chevaliers un peu sourcils froncés sous la visière (comme l'original).

Prompt exact, essai 1 (yifyYUDPW9) :

```
MATERIAL CHANGE ONLY. This is a 2x2 game sprite sheet of four toy heroes on a plain background. Do not move, resize, rotate, mirror, add or remove anything: each figure stays in its own quadrant, same pose, same proportions, same silhouette, same props, same direction.

Re-sculpt the four figures in hand-made children's modelling clay (plasticine), like a stop-motion film: soft rounded volumes, smooth matte clay with faint fingerprints, slightly richer and more saturated colours so they read clearly at very small size on a pale sandy background. Warm soft light from the upper left, gentle shading, no harsh shadows. Friendly, brave, smiling faces with round open eyes.

Keep the identity and colours of each: top-left = knight with a silver-grey metal helmet with visor and a small ochre pennant on top, blue padded tunic with a cream hem, round blue shield with a brown rim on the right, short silver sword with a brown hilt on the left, dark green boots; top-right = rider with a cream cap and green tunic sitting on a chestnut-brown horse with a cream blond mane and cream tail, blue saddle blanket, horse facing left; bottom-left = two-headed knight with two silver-grey metal helmets side by side on one body, olive-green tunic with a brown belt, one brown wooden sword in each hand pointing up, dark green boots; bottom-right = small olive-green toy tank with a round turret, brass-coloured cannon pointing left, dark grey tracks and wheels, small blue flag on a pole. Helmets, sword blade and cannon stay metal-coloured clay (silver-grey, brass). The tank has no face.

Keep the background exactly as it is. No text, no outline stroke, no ground, no new objects.
```

## allies-creatures

- Source (format production) : p8SgpKlehw — https://www.magnific.com/app/creation/p8SgpKlehw
- Essai 1 : retouche 8a98bBFIrU — https://www.magnific.com/app/creation/8a98bBFIrU
  - Détourage : LwXL3DtswO — https://www.magnific.com/app/creation/LwXL3DtswO
- Crédits : 80 + 3 = 83
- Verdict : ACCEPTÉE. Dragon, dinosaure, barricade, pot de miel : mêmes poses, couleurs plus franches.

Prompt exact, essai 1 (8a98bBFIrU) :

```
MATERIAL CHANGE ONLY. This is a 2x2 game sprite sheet of four toy creatures and objects on a plain background. Do not move, resize, rotate, mirror, add or remove anything: each figure stays in its own quadrant, same pose, same proportions, same silhouette, same props, same direction.

Re-sculpt the four figures in hand-made children's modelling clay (plasticine), like a stop-motion film: soft rounded volumes, smooth matte clay with faint fingerprints, slightly richer and more saturated colours so they read clearly at very small size on a pale sandy background. Warm soft light from the upper left, gentle shading, no harsh shadows. Friendly, brave, smiling faces with round open eyes. (Only the dragon and the dinosaur have faces; the logs and the pot have no face.)

Keep the identity and colours of each: top-left = baby dragon, teal-blue body with a cream belly, two golden-yellow horns, small teal wings, teal arrow-tipped tail, standing on four legs facing left; top-right = small chubby dinosaur, sage grey-green body with a cream belly, orange-red back spikes, standing upright facing left, tail to the right; bottom-left = barricade of three upright moss-green wooden logs with patches of moss, tied together with a cream rope, a small teal-blue cloth hanging at the bottom right; bottom-right = round orange-ochre clay honey pot filled with amber honey, a brown wooden honey dipper resting in it pointing to the upper right, one small green leaf on its right side.

Keep the background exactly as it is. No text, no outline stroke, no ground, no new objects.
```

## enemies-mechanical

- Source (format production) : nVkKnF0YQD — https://www.magnific.com/app/creation/nVkKnF0YQD
- Essai 1 : retouche JNvJnyROq4 — https://www.magnific.com/app/creation/JNvJnyROq4
  - Détourage : SyISAo2Ub8 — https://www.magnific.com/app/creation/SyISAo2Ub8
- Crédits : 80 + 3 = 83
- Verdict : ACCEPTÉE. Le serpent blindé a maintenant des plaques sarcelle cerclées de cuivre (avant : plaques cuivre et vert-de-gris mêlées) — dérive de couleur légère à faire valider. Roi cobra : regard un peu sévère, sans crocs.

Prompt exact, essai 1 (JNvJnyROq4) :

```
MATERIAL CHANGE ONLY. This is a 2x2 game sprite sheet of four toy snakes and objects on a plain background. Do not move, resize, rotate, mirror, add or remove anything: each figure stays in its own quadrant, same pose, same proportions, same silhouette, same props, same direction.

Re-sculpt the four figures in hand-made children's modelling clay (plasticine), like a stop-motion film: soft rounded volumes, smooth matte clay with faint fingerprints, slightly richer and more saturated colours so they read clearly at very small size on a pale sandy background. Warm soft light from the upper left, gentle shading, no harsh shadows. Cheeky, mischievous but friendly cartoon expressions with round open eyes — never scary, no fangs showing, no blood. (The egg has no face.)

Keep the identity and colours of each: top-left = king cobra, dark green back with a cream belly and cream inside of the open hood, small golden crown on its head, coiled on the ground, head facing right; top-right = armoured mechanical snake, verdigris blue-green metal head with one big round amber-orange eye, body made of copper-brown riveted metal plates with a small copper gear on its side, head facing right, tail curling up on the left; bottom-left = spring snake, teal-blue head with an amber-orange eye, body made of a brass-coloured coiled metal spring with a small brass wind-up key behind the head, thin teal-blue tail curling up on the left, head facing right; bottom-right = large cream speckled egg with a zigzag crack line, a tiny green two-leaf sprout on top, sitting in a dark grey porous rock nest with green moss. Metal plates, gear, spring and key stay metal-coloured clay (copper, brass, verdigris).

Keep the background exactly as it is. No text, no outline stroke, no ground, no new objects.
```

## allies-dinosaurs

- Source (format production) : 5jWazibKxe — https://www.magnific.com/app/creation/5jWazibKxe
- Essai 1 : retouche N2QNVSo6D9 — https://www.magnific.com/app/creation/N2QNVSo6D9
  - Détourage : gO8gAhySXO — https://www.magnific.com/app/creation/gO8gAhySXO
- Crédits : 80 + 3 = 83
- Verdict : ACCEPTÉE. Mêmes poses, foulards gardés. Couleurs plus pastel : le stégosaure perd son ventre olive foncé (tout bleu clair), tête du T-rex plus rose. Le T-rex montre de petites dents, comme l'original.

Prompt exact, essai 1 (N2QNVSo6D9) :

```
MATERIAL CHANGE ONLY. This is a 2x2 game sprite sheet of four toy dinosaurs on a plain background. Do not move, resize, rotate, mirror, add or remove anything: each figure stays in its own quadrant, same pose, same proportions, same silhouette, same props, same direction.

Re-sculpt the four figures in hand-made children's modelling clay (plasticine), like a stop-motion film: soft rounded volumes, smooth matte clay with faint fingerprints, slightly richer and more saturated colours so they read clearly at very small size on a pale sandy background. Warm soft light from the upper left, gentle shading, no harsh shadows. Friendly, brave, smiling faces with round open eyes.

Keep the identity and colours of each: top-left = small raptor standing on two legs facing left, lilac-purple and cream body with light blue patches, teal neck scarf, long tail to the right; top-right = triceratops facing left, light blue-teal head with a frill edged in pink and three dark blue horns, body fading to coral pink at the back, teal neck scarf, dark blue toes; bottom-left = stegosaurus facing left, teal-blue body with a darker olive belly, orange back plates and orange tail spikes, teal neck scarf; bottom-right = tyrannosaurus standing upright facing left, orange body with a darker red-orange head, small orange crest spikes, tiny arms, teal neck scarf, cream claws. Every dinosaur keeps its teal scarf.

Keep the background exactly as it is. No text, no outline stroke, no ground, no new objects.
```

## allies-mutants

- Source (format production) : 1lTE0P9r4r — https://www.magnific.com/app/creation/1lTE0P9r4r
- Essai 1 : retouche 79h7zs9JAL — https://www.magnific.com/app/creation/79h7zs9JAL
  - Détourage : aucun
- Essai 2 (reprise, retenue) : retouche hu3hLKovqL — https://www.magnific.com/app/creation/hu3hLKovqL
  - Détourage : AUCUN côté Magnific : appel refusé par le contrôle de permissions de la session. Détourage LOCAL provisoire (work/cutout.py)
- Crédits : 80 + 80 = 160
- Verdict : ACCEPTÉE AVEC RÉSERVES (reprise), détourage Magnific À FAIRE. Essai 1 : golem devenu gris ardoise foncé et lisse (plus de blocs bleus), corps de la créature rouge-rose vif. Reprise : golem bleu en blocs, créature rose-mauve ; mais rendu plus pâle, une petite bouche souriante ajoutée aux deux personnages, et l'icône bouclier (bas droite, non utilisée par le jeu selon PROVENANCE.md) a perdu ses deux pointes du haut. Cadres 512×600 de la rangée du haut respectés. Fichier : full-local-cutout/allies-mutants.png (liseré blanc visible, arcs du signal délavés).

Prompt exact, essai 1 (79h7zs9JAL) :

```
MATERIAL CHANGE ONLY. This is a 2x2 game sprite sheet of four toy heroes and small icons on a plain background. Do not move, resize, rotate, mirror, add or remove anything: each figure stays in its own quadrant, same pose, same proportions, same silhouette, same props, same direction.

Re-sculpt the four figures in hand-made children's modelling clay (plasticine), like a stop-motion film: soft rounded volumes, smooth matte clay with faint fingerprints, slightly richer and more saturated colours so they read clearly at very small size on a pale sandy background. Warm soft light from the upper left, gentle shading, no harsh shadows. Friendly, brave, smiling faces with round open eyes. (The two small icons in the bottom row have no face.)

Keep the identity and colours of each: top-left = tall rock golem made of blue stone blocks, two round amber-brown eyes, teal scarf with a teal leaf-shaped end blowing to the left, big blue stone fists, standing facing the viewer, its feet reach slightly below the middle of the sheet; top-right = tall soft creature with a lilac-purple rounded head, two dark round eyes, mustard-yellow scarf, pink-mauve knitted body, two big teal mittens held out to the sides, round pink feet, standing facing the viewer, its feet reach slightly below the middle of the sheet; bottom-left = small orange icon: three stacked orange beads ending in a point at the bottom, with two small curved orange signal arcs on each side above it; bottom-right = small icon: golden-orange rounded shield shape with two cream horizontal stripes inside. The two bottom icons stay small and stay in the lower part of their quadrants.

Keep the background exactly as it is. No text, no outline stroke, no ground, no new objects.
```

Prompt exact, essai 2 (reprise, retenue) (hu3hLKovqL) :

```
MATERIAL CHANGE ONLY. This is a 2x2 game sprite sheet of four toy heroes and small icons on a plain background. Do not move, resize, rotate, mirror, add or remove anything: each figure stays in its own quadrant, same pose, same proportions, same silhouette, same props, same direction.

Re-sculpt the four figures in hand-made children's modelling clay (plasticine), like a stop-motion film: soft rounded volumes, smooth matte clay with faint fingerprints, slightly richer and more saturated colours so they read clearly at very small size on a pale sandy background. Warm soft light from the upper left, gentle shading, no harsh shadows. Friendly, brave, smiling faces with round open eyes. (The two small icons in the bottom row have no face.)

Keep the identity and colours of each: top-left = tall rock golem built from separate stacked stone blocks with visible gaps between the blocks, every block a clear medium cornflower blue (light sky-blue highlights, never dark, never grey, never navy), two round amber-brown eyes, teal scarf with a teal leaf-shaped end blowing to the left, big blue stone-block fists, standing facing the viewer, its feet reach slightly below the middle of the sheet; top-right = tall soft creature with a lilac-purple rounded head, two dark round eyes, mustard-yellow scarf, body in soft dusty mauve-pink (a pale purple-pink like heather, not red, not crimson, not coral), two big teal mittens held out to the sides, round mauve-pink feet, standing facing the viewer, its feet reach slightly below the middle of the sheet; bottom-left = small orange icon: three stacked orange beads ending in a point at the bottom, with two small curved orange signal arcs on each side above it; bottom-right = small icon: golden-orange rounded shield shape with two cream horizontal stripes inside. The two bottom icons stay small and stay in the lower part of their quadrants.

Keep the background exactly as it is. No text, no outline stroke, no ground, no new objects.
```

## serpents-family

- Source (format production) : BhJcUsRoQR — https://www.magnific.com/app/creation/BhJcUsRoQR
- Essai 1 : retouche s7Bs3xNl8e — https://www.magnific.com/app/creation/s7Bs3xNl8e
  - Détourage : 1lD1itLr4r — https://www.magnific.com/app/creation/1lD1itLr4r
- Crédits : 80 + 3 = 83
- Verdict : ACCEPTÉE AVEC RÉSERVE. Vérifiée en 1024 px : les trois têtes du roi ont la bouche fermée, sans dents ; yeux rouges gardés, air grognon mais pas effrayant. Le cobra doré a perdu ses écailles et les bandes du ventre (capuchon lisse, tête moins dessinée). Une reprise était prévue (prompt dans work/prompts/serpents-family-retry.txt) : l'appel a été refusé par le contrôle de permissions de la session, rien n'a été dépensé.

Prompt exact, essai 1 (s7Bs3xNl8e) :

```
MATERIAL CHANGE ONLY. This is a 2x2 game sprite sheet of four toy snakes on a plain background. Do not move, resize, rotate, mirror, add or remove anything: each figure stays in its own quadrant, same pose, same proportions, same silhouette, same props, same direction.

Re-sculpt the four figures in hand-made children's modelling clay (plasticine), like a stop-motion film: soft rounded volumes, smooth matte clay with faint fingerprints, slightly richer and more saturated colours so they read clearly at very small size on a pale sandy background. Warm soft light from the upper left, gentle shading, no harsh shadows. Cheeky, mischievous but friendly cartoon expressions with round open eyes — never scary, no fangs showing, no blood.

Keep the identity and colours of each: top-left = rattlesnake rising in an S shape, terracotta orange-pink body with cream diamond patches, cream belly, beige stacked rattle at the end of the tail on the left, head facing right; top-right = cobra standing tall with its hood open, golden-ochre body and hood with teal blue-green back and edges, head facing right; bottom-left = black snake coiled on the ground with its neck raised, charcoal-black back, light grey banded belly, yellow eye, head facing right; bottom-right = three-headed snake king, indigo blue-violet scaly body with a golden-ochre belly, three heads on three necks rising from one coil (left head facing left, middle head facing the viewer and wearing a small golden crown, right head facing right), round red-orange eyes, mouths in closed cheeky grins. The three heads stay clearly separated.

Keep the background exactly as it is. No text, no outline stroke, no ground, no new objects.
```

## strongholds

- Source (format production) : KLcMh3pkqp — https://www.magnific.com/app/creation/KLcMh3pkqp
- Essai 1 : retouche O6aO0WNynm — https://www.magnific.com/app/creation/O6aO0WNynm
  - Détourage : EbGEwJXuuO — https://www.magnific.com/app/creation/EbGEwJXuuO
- Crédits : 80 + 3 = 83
- Verdict : ACCEPTÉE. Refuge et trois antres en place ; mousse plus verte, engrenages orange vif. Les traces d'ombre bleu pâle de la source ont disparu. La tête de serpent de l'antre de racines a maintenant une petite bouche ouverte. Antre à rouages : bord droit 9 px plus court. Comparée à strongholds.webp (version nettoyée 0.28).

Prompt exact, essai 1 (O6aO0WNynm) :

```
MATERIAL CHANGE ONLY. This is a 2x2 game sprite sheet of four toy buildings (one small castle and three cave lairs) on a plain background. Do not move, resize, rotate, mirror, add or remove anything: each figure stays in its own quadrant, same pose, same proportions, same silhouette, same props, same direction.

Re-sculpt the four figures in hand-made children's modelling clay (plasticine), like a stop-motion film: soft rounded volumes, smooth matte clay with faint fingerprints, slightly richer and more saturated colours so they read clearly at very small size on a pale sandy background. Warm soft light from the upper left, gentle shading, no harsh shadows. The buildings have no faces. Cosy and inviting, never scary.

Keep the identity and colours of each: top-left = small grey stone castle refuge seen from the front-left, two round towers topped with green moss and a green flag each, a big glowing light-blue crystal between two green leaves in the middle, an arched brown wooden double door, moss at the foot of the walls; top-right = cave lair made of pale beige twisted tree roots forming an arch whose top is shaped like a sleepy snake head, green moss on top, small green ferns, a few small cream eggs at the lower left, dark cave opening with a grey stone paved floor in front; bottom-left = cave lair shaped like a pale beige wooden stump, decorated with rust-orange metal gears of several sizes and one round porthole, orange autumn leaves around, dark cave opening with a grey stone paved floor; bottom-right = cave lair made of a grey stone arch wrapped in pale beige winding vines and roots, green moss on top, tiny pale blue mushrooms, dark cave opening. Gears stay rust-orange metal-coloured clay; the paved floors inside each building stay. The faint pale blue shadow smudges on the white background around the buildings are not part of the buildings: leave plain white there.

Keep the background exactly as it is. No text, no outline stroke, no ground, no new objects.
```

## miels-parapluie

- Source (format production) : 1lTBZAWr4r — https://www.magnific.com/app/creation/1lTBZAWr4r
- Essai 1 : retouche XmyX55aBfo — https://www.magnific.com/app/creation/XmyX55aBfo
  - Détourage : ov4o1Lg829 — https://www.magnific.com/app/creation/ov4o1Lg829
- Crédits : 80 + 3 = 83
- Verdict : ACCEPTÉE. Serpent parapluie ouvert/fermé, pot ambré, pot vert : identiques en place, étiquettes restées vides.

Prompt exact, essai 1 (XmyX55aBfo) :

```
MATERIAL CHANGE ONLY. This is a 2x2 game sprite sheet of four toy snakes and honey pots on a plain background. Do not move, resize, rotate, mirror, add or remove anything: each figure stays in its own quadrant, same pose, same proportions, same silhouette, same props, same direction.

Re-sculpt the four figures in hand-made children's modelling clay (plasticine), like a stop-motion film: soft rounded volumes, smooth matte clay with faint fingerprints, slightly richer and more saturated colours so they read clearly at very small size on a pale sandy background. Warm soft light from the upper left, gentle shading, no harsh shadows. Cheeky, mischievous but friendly cartoon expressions with round open eyes — never scary, no fangs showing, no blood. (The two pots have no face.)

Keep the identity and colours of each: top-left = small sage-green snake with a cream banded belly, coiled, head facing left, big dark shiny eyes, holding an open umbrella made of sage-green leaves above its head on a thin green stem; top-right = the same sage-green snake with a cream banded belly, coiled, head facing left, with the leaf umbrella folded shut behind it; bottom-left = round honey pot in warm light-brown wood colour, amber honey glass rim on top, a brown wooden honey dipper resting in it pointing to the upper right, one blank cream rectangular label on the front; bottom-right = round sage-green pot with thick green sticky goo dripping over the rim, two dark green leaves at the upper right, one blank cream rectangular label on the front. Both labels stay completely blank.

Keep the background exactly as it is. No text, no outline stroke, no ground, no new objects.
```
