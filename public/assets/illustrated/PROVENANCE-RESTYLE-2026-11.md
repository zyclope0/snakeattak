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

## Poses d'attaque (essai)

Essai accepté par le parent : une seconde planche pour les quatre alliés du départ, montrée
un court instant quand le combattant frappe. Mêmes cases et même ordre que `allies-front`
(1024×1024, quatre cases de 512, WebP).

- Fichier : `src/assets/illustrated/allies-front-attack.webp`
- Outil : Magnific `images_generate`, modèle Nano Banana Pro ; référence = la planche
  allies-front refaite, création lJosK3cgv9
- Création : YMjYLzfWeC — https://www.magnific.com/app/creation/YMjYLzfWeC
- Détourage : aFZaMXYfSh — https://www.magnific.com/app/creation/aFZaMXYfSh
- Crédits : 78 (en plus du total du chantier indiqué plus haut)
- Recalage : chaque figurine est décalée verticalement de 1 à 10 px pour que ses pieds
  reposent sur la ligne de base de la planche de repos.
- Choix : variante aux visages souriants et décidés, retenue par le parent le
  12 novembre 2026.

## Poses d'attaque des autres planches (12 novembre 2026)

Huit planches `<nom>-attack.webp`, même recette que l'essai des alliés de départ. Dépense :
1 527 crédits Magnific. Les cases qui ne frappent pas (soigneurs, palissade, pot de miel, œuf,
cobra couronné inutilisé, icônes des mutants) reprennent l'image de repos.


Huit planches `<nom>-attack` (1024×1024, RGBA, mêmes cases que la planche de repos ;
allies-mutants : cases du haut 512×600). Rien n'a été écrit dans le dépôt.

- Outil : Magnific `images_generate`, `mode: imagen-nano-banana-2` (Nano Banana Pro),
  `aspectRatio: 1:1`, `count: 2`, une référence image = la retouche retenue sur fond blanc.
  75 crédits par image. Puis `images_remove_background` (3 crédits).
- Solde : 12 791 → 11 264. **Dépense : 1 527 crédits** (10 appels de génération × 150 = 1 500 ;
  9 détourages × 3 = 27). Plafond du lot : 2 500. Aucun appel payant refusé.
- Lien d'une création : `https://www.magnific.com/app/creation/<identifiant>`.
- Recalage (`attack-work/post.py`) : boîte alpha > 60 par case ; la case d'attaque est décalée
  verticalement pour que son bas soit celui du repos ; aucun déplacement horizontal.
  **Écart à la consigne** : la remise à l'échelle prévue quand la hauteur diffère de plus de
  12 % n'a été appliquée nulle part. Dans les six cases concernées, la hauteur change parce que
  la pose change (tête baissée, corps penché, passage à quatre pattes), pas parce que la
  figurine a changé de taille : les anneaux, les pieds et les largeurs de corps sont restés ceux
  du repos. Agrandir aurait grossi le personnage de 15 à 48 %.
- WebP sans perte (`ffmpeg -c:v libwebp -lossless 1 -compression_level 6`) : alpha identique
  au PNG, couleurs identiques partout où le pixel est visible. Tailles : 213 à 440 Ko.

| Planche | Référence | Générations (essai 1) | Reprise | Retenue | Détourage | Crédits | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- |
| enemies-organic | N2QNzyF6D9 | 3zbZznrREY, nVjWVDMYQD | — | nVjWVDMYQD | jUXsUjnLD0 | 153 | ACCEPTÉE |
| allies-support | eIJeqf8dqL | 9ZQ6Z58NYZ, LwBlwmEswO | — | LwBlwmEswO | 79vON8jJAL | 153 | ACCEPTÉE |
| allies-elite | yifyYUDPW9 | 1lpxg9Er4r, huRaQjKvqL | — | huRaQjKvqL | tCihuLomZJ | 153 | ACCEPTÉE |
| allies-creatures | 8a98bBFIrU | KLM1lUzkqp, 9ZQ6AnwNYZ | — | 9ZQ6AnwNYZ | nVjWDARYQD | 153 | ACCEPTÉE |
| allies-dinosaurs | N2QNVSo6D9 | Sytw4HIUb8, rgejUabxtc | — | Sytw4HIUb8 | ov9ICOn829 | 153 | ACCEPTÉE, T-rex à faire valider |
| enemies-mechanical | JNvJnyROq4 | ov9ICPW829, Bh48fPkoQR | 4RuNGJo9Aa, SytwNLHUb8 | 4RuNGJo9Aa | 5jVkS8mKxe | 303 | ACCEPTÉE (reprise) |
| serpents-family | yifytfkPW9 | aF2Cb8wfSh, Bh48fM6oQR | fHAEKvWCDY, dtyBae8XSL | fHAEKvWCDY + case bas-gauche de aF2Cb8wfSh | p8JdvZvehw, ov9IQak829 | 306 | ACCEPTÉE (reprise, deux sources) |
| allies-mutants | hu3hLKovqL | O6fPZeDynm, JNayRpEOq4 | — | JNayRpEOq4 | vQZf59Ba47 | 153 | ACCEPTÉE |

Cases : 0 = haut gauche, 1 = haut droite, 2 = bas gauche, 3 = bas droite.

## enemies-organic

- Choix : nVjWVDMYQD, visages plus rieurs ; l'autre montrait une langue sur le serpent jaune.
- Cases gardées au repos : aucune.
- Recalage : dy = 0 partout. Case 0 (serpent vert) : hauteur 388 contre 446 px, pas de remise
  à l'échelle (tête baissée).
- Vérifié en gros plan : bouches ouvertes du vert et du jaune sans crocs ni dents.
- Réserve : le bleu (tête un peu avancée) et le cobra violet (bouche en « o », boîte identique
  au repos) bougent peu.

```
Using the reference image as the exact character sheet, create the ATTACK FRAME of the same 2x2 game sprite sheet: the same four modelling-clay toy snakes, identical faces, eyes, scales, accessories, colours, clay material, lighting and size, each one alone and centred in its own quadrant, coils resting at the same height as in the reference, all four seen in the same view and still facing the SAME direction as in the reference (heads toward the right). Pure white background, tiny soft contact shadow under the coils.

Only the pose changes, to show the moment the bite lands toward the right:
- top-left: the green snake with the cream belly keeps its coil on the ground and stretches its neck forward and low toward the right in a quick lunge, head tilted slightly down, mouth slightly open;
- top-right: the yellow snake with the brown aviator cap and goggles on its head keeps its coil and curled tail and darts its neck forward toward the right, head leading, mouth slightly open in a cheeky grin, goggles still on its forehead;
- bottom-left: the blue scaly snake with the two round copper goggle eyes keeps its coil and thrusts its head forward toward the right like a head-butt, neck stretched, mouth closed;
- bottom-right: the purple cobra with the open hood, green cheeks and cream belly keeps its coil and curled tail and leans its hooded head forward toward the right, neck stretched, lips pursed in a small round "o" as if blowing.

Mischievous, cheeky, never frightening; the mouth may open slightly for the bite but NO fangs, no teeth, no tongue, no blood. No motion lines, no impact stars, no dust, no spit, no droplets, no text, no frame, no extra characters or objects, nothing crossing from one quadrant into another.
```

## allies-support

- Choix : LwBlwmEswO ; dans l'autre, l'archer fronce nettement les sourcils.
- Cases gardées au repos : 1 (infirmier) et 2 (médecin) : `damage: 0` dans `src/data.ts`,
  ils soignent et ne frappent pas. Remplacées par la case de repos.
- Recalage : archer dy = −2 ; ninja dy = +1.
- Réserves : l'épée du ninja touche le bord gauche de sa case (pointe peut-être rognée de
  quelques pixels) ; les yeux du ninja et de l'archer sont plus plissés qu'au repos (air décidé).

```
Using the reference image as the exact character sheet, create the ATTACK FRAME of the same 2x2 game sprite sheet: the same four modelling-clay toy figures, identical faces, hair, clothes, colours, clay material, lighting and size, each one alone and centred in its own quadrant, feet at the same height as in the reference, all four seen in the same view and still facing the SAME direction as in the reference (toward the left). Pure white background, tiny soft contact shadow under the feet.

Only the pose of the two fighters changes, to show the moment the blow lands toward the left:
- top-left: the archer with blond hair, moss-green hood and tunic and brown quiver on the back has just shot: the brown wooden bow is held out at arm's length toward the left, the string arm pulled back behind the ear and open, no arrow on the bow any more, body leaning slightly forward;
- top-right: the nurse with the cream knitted bonnet with a green leaf, cream sweater and tan apron, holding the rolled bandage in both hands: KEEP THIS QUADRANT EXACTLY UNCHANGED, same pose as the reference;
- bottom-left: the doctor with curly blond hair, round glasses, long cream coat and grey-blue satchel: KEEP THIS QUADRANT EXACTLY UNCHANGED, same pose as the reference;
- bottom-right: the ninja with the dusty purple hood, purple face scarf with its long tail, blue-teal quilted jacket, strikes with the brown wooden sword held in both hands, swung forward and down toward the left, arms extended, one bare foot stepping forward, scarf tail still flowing to the right.

Determined, brave, friendly faces. No motion lines, no impact stars, no dust, no text, no frame, no extra characters or objects, no flying arrow, nothing crossing from one quadrant into another.
```

## allies-elite

- Choix : huRaQjKvqL ; dans l'autre, le tank avait changé d'angle de vue.
- Cases gardées au repos : aucune.
- Recalage : chevalier dy = 0 ; cavalier dy = +4 ; deux têtes dy = −2 ; tank dy = 0.
- Réserve : le tank change très peu (canon un peu raccourci, 6 px de moins en hauteur).

```
Using the reference image as the exact character sheet, create the ATTACK FRAME of the same 2x2 game sprite sheet: the same four modelling-clay toy figures, identical helmets, faces, clothes, colours, clay material, lighting and size, each one alone and centred in its own quadrant, feet, hooves and tracks at the same height as in the reference, all four seen in the same view and still facing the SAME direction as in the reference (toward the left). Pure white background, tiny soft contact shadow under the feet.

Only the pose changes, to show the moment the blow lands toward the left:
- top-left: the knight with the silver-grey visor helmet with the small ochre pennant, blue padded tunic and round blue shield thrusts his short silver sword straight out toward the left at arm's length, one dark green boot stepping forward, the round blue shield pulled back against his side;
- top-right: the rider with the cream cap and green tunic on the chestnut-brown horse with the cream mane and tail: the horse charges toward the left, head lowered and pushed forward, both front legs lifted off the ground in a gallop, the rider leaning forward over the mane; blue saddle blanket unchanged;
- bottom-left: the two-headed knight with two silver-grey helmets side by side, olive-green tunic and brown belt swings both brown wooden swords forward and down in front of him at the same time, arms extended, leaning slightly forward;
- bottom-right: the small olive-green toy tank with the round turret, brass cannon pointing left, dark grey tracks and small blue flag has just fired: the hull rocks back on its tracks with the front slightly lifted, the brass cannon pulled back shorter into the turret, the blue flag swept backward toward the right. The tank has no face.

Determined, brave, friendly faces. No motion lines, no impact stars, no dust, no smoke, no flash, no shell, no text, no frame, no extra characters or objects, nothing crossing from one quadrant into another.
```

## allies-creatures

- Choix : 9ZQ6AnwNYZ ; dans l'autre, le petit dinosaure avait un regard fâché.
- Cases gardées au repos : 2 (palissade : `damage: 0`, objet fixe) et 3 (pot de miel : objet).
- Recalage : dragon dy = +13, hauteur 374 contre 452 px, pas de remise à l'échelle (cou
  baissé) ; dinosaure dy = +26, hauteur 304 contre 449 px, pas de remise à l'échelle.
- Réserve : le petit dinosaure, debout au repos, passe à quatre pattes pour son coup de tête :
  silhouette très différente pendant 0,2 s. Le dragon ouvre la bouche (petites dents rondes).

```
Using the reference image as the exact character sheet, create the ATTACK FRAME of the same 2x2 game sprite sheet: the same two modelling-clay toy creatures and the same two clay objects, identical faces, horns, spikes, colours, clay material, lighting and size, each one alone and centred in its own quadrant, feet at the same height as in the reference, seen in the same view and still facing the SAME direction as in the reference (toward the left). Pure white background, tiny soft contact shadow under the feet.

Only the pose of the two creatures changes, to show the moment the blow lands toward the left:
- top-left: the teal-blue baby dragon with the cream belly, two golden-yellow horns, small teal wings and arrow-tipped tail lunges toward the left: neck and head stretched forward and low, mouth open wide in a brave little roar with a round pink tongue, wings raised and spread, tail lifted, all four feet on the ground;
- top-right: the chubby sage grey-green dinosaur with the cream belly and orange-red back spikes, standing upright, leans forward toward the left and gives a head-butt: head lowered and pushed forward, small arms pulled back, one foot stepping forward, tail lifted behind for balance;
- bottom-left: the barricade of three upright moss-green logs tied with a cream rope and a small teal cloth: KEEP THIS QUADRANT EXACTLY UNCHANGED, identical to the reference;
- bottom-right: the round orange clay honey pot with amber honey, wooden honey dipper and green leaf: KEEP THIS QUADRANT EXACTLY UNCHANGED, identical to the reference.

Determined, brave, friendly faces. No fire, no flame, no smoke, no sharp teeth, no motion lines, no impact stars, no dust, no text, no frame, no extra characters or objects, nothing crossing from one quadrant into another.
```

## allies-dinosaurs

- Choix : Sytw4HIUb8 ; charge du tricératops plus lisible, T-rex un peu moins denté.
- Cases gardées au repos : aucune.
- Recalage : raptor dy = +9 ; tricératops dy = +36, hauteur 417 contre 490 px, pas de remise à
  l'échelle (tête baissée) ; stégosaure dy = 0 ; T-rex dy = 0.
- **À faire valider par le parent** : le T-rex ouvre la bouche et montre une rangée de petites
  dents, plus visibles qu'au repos (où il en montre déjà). Regard rond, pas menaçant à mon
  avis, mais c'est la case la plus « mordante » du lot.
- La queue du raptor touche le bord droit de sa case.

```
Using the reference image as the exact character sheet, create the ATTACK FRAME of the same 2x2 game sprite sheet: the same four modelling-clay toy dinosaurs, identical faces, eyes, teal neck scarves, colours, clay material, lighting and size, each one alone and centred in its own quadrant, feet at the same height as in the reference, all four seen in the same view and still facing the SAME direction as in the reference (toward the left). Pure white background, tiny soft contact shadow under the feet.

Only the pose changes, to show the moment the blow lands toward the left:
- top-left: the small lilac-purple and cream raptor with light blue patches and teal scarf pounces toward the left: body leaning far forward, head stretched out, both small arms reaching forward, one leg lifted, tail raised straight behind;
- top-right: the light blue-teal triceratops with the pink-edged frill, three dark blue horns and coral pink hindquarters charges toward the left: head lowered so the three horns point forward, front legs braced, back legs pushing;
- bottom-left: the teal-blue stegosaurus with orange back plates and orange tail spikes keeps its head facing left and swings its spiked tail high and forward over its back like a club, body twisted a little, all feet on the ground;
- bottom-right: the orange tyrannosaurus with the red-orange head, small crest spikes and tiny arms, standing upright, lunges its big head forward and down toward the left, mouth half open in a brave grin, tail lifted behind for balance.

Determined, brave, friendly faces with the same round eyes; teeth small and rounded exactly as in the reference, never sharp. Every dinosaur keeps its teal scarf. No motion lines, no impact stars, no dust, no text, no frame, no extra characters or objects, nothing crossing from one quadrant into another.
```

## enemies-mechanical

- Essai 1 (ov9ICPW829, Bh48fPkoQR) : ÉCARTÉ. Le serpent à ressort ouvrait la bouche avec deux
  petits crocs blancs (vérifié en gros plan sur ov9ICPW829 ; rangée de dents sur l'autre).
  Le prompt de l'essai 1 était celui ci-dessous, sauf : « bite » au lieu de « head-butt »,
  « mouth closed » en minuscules pour le serpent blindé, « mouth slightly open in a cheeky
  grin » et « shooting the teal head forward to the right edge of its quadrant » pour le
  ressort, et la phrase finale standard « the mouth may open slightly for the bite but NO
  fangs, no teeth, no tongue, no blood » avec « no sparks ».
- Reprise : 4RuNGJo9Aa retenue (bouches fermées, ressort étiré) ; dans SytwNLHUb8 le ressort
  ne bouge presque pas.
- Cases gardées au repos : 0 (cobra couronné : aucune unité n'utilise cette case dans
  `src/art.ts`) et 3 (œuf : ne frappe pas).
- Recalage : serpent blindé dy = 0 ; ressort dy = 0.
- Réserves : geste discret pour le serpent blindé (tête avancée et baissée de 34 px) ; la
  tête du ressort touche le bord droit de sa case.

```
Using the reference image as the exact character sheet, create the ATTACK FRAME of the same 2x2 game sprite sheet: the same three modelling-clay toy snakes and the same clay egg, identical faces, eyes, metal parts, colours, clay material, lighting and size, each one alone and centred in its own quadrant, resting on the ground at the same height as in the reference, seen in the same view and still facing the SAME direction as in the reference (the two mechanical snakes face the right). Pure white background, tiny soft contact shadow underneath.

Only the pose of the two mechanical snakes changes, to show the moment the head-butt lands toward the right:
- top-left: the dark green king cobra with the cream open hood and small golden crown: KEEP THIS QUADRANT EXACTLY UNCHANGED, identical to the reference;
- top-right: the armoured mechanical snake with the verdigris blue-green metal head, one big round glowing amber-orange eye, copper-brown riveted plates and a small copper gear on its side keeps its body and curled tail in place and thrusts its heavy metal head forward and low toward the right like a head-butt, neck plates stretched out, MOUTH CLOSED exactly as in the reference;
- bottom-left: the spring snake with the teal-blue head, amber-orange eye, brass coiled spring body, small brass wind-up key and thin teal tail: the brass spring uncoils and stretches out long toward the right, shooting the teal head forward toward the right, MOUTH COMPLETELY CLOSED in the same smooth closed-lip smile as in the reference, the lower coils and the tail staying in place on the ground;
- bottom-right: the cream speckled cracked egg with the tiny green sprout in its dark grey mossy rock nest: KEEP THIS QUADRANT EXACTLY UNCHANGED, identical to the reference.

IMPORTANT, this is a toy for young children: both mechanical snakes keep their mouths shut. No open mouth, no teeth, no fangs, no white points at the lips, no tongue. Mischievous, cheeky, never frightening. No motion lines, no impact stars, no sparks, no dust, no text, no frame, no extra characters or objects, nothing crossing from one quadrant into another.
```

## serpents-family

- Essai 1 (aF2Cb8wfSh, Bh48fM6oQR) : insuffisant, le roi à trois têtes restait identique au
  repos dans les deux variantes.
- Reprise : fHAEKvWCDY retenue (les trois têtes du roi partent vers la droite, yeux rouges,
  bouches fermées, couronne gardée ; crotale en fente basse). dtyBae8XSL écartée (couronne
  passée sur la tête du haut, têtes empilées de profil).
- **Planche assemblée depuis deux créations** : dans la reprise le serpent noir ne bougeait
  plus ; sa case (2, bas gauche) vient de l'essai 1 aF2Cb8wfSh (cou lancé, bouche ouverte,
  vérifiée en gros plan : ni crocs ni dents). Cases 0, 1, 3 : fHAEKvWCDY (détourage
  p8JdvZvehw) ; case 2 : aF2Cb8wfSh (détourage ov9IQak829).
- Cases gardées au repos : aucune.
- Recalage : crotale dy = 0, hauteur 380 contre 495 px, pas de remise à l'échelle (fente
  basse) ; cobra doré dy = 0 ; serpent noir dy = +5 ; roi dy = 0.
- Réserves : le cobra doré bouge peu (buste penché, queue apparue à gauche de sa base) ; un
  fin reste d'ombre de contact sous le crotale ; la tête du crotale touche le bord droit.

Prompt de la reprise (cases 0, 1, 3) :

```
Using the reference image as the exact character sheet, create the ATTACK FRAME of the same 2x2 game sprite sheet: the same four modelling-clay toy snakes, identical faces, eyes, scales, patterns, colours, clay material, lighting and size, each one alone and centred in its own quadrant, resting on the ground at the same height as in the reference, all four seen in the same view as in the reference. Pure white background, tiny soft contact shadow underneath.

Only the pose changes, to show the moment the lunge lands toward the right. EVERY one of the four must clearly move, especially the three-headed king:
- bottom-right, the most important: the three-headed snake king, indigo blue-violet scaly body with golden-ochre belly, three heads on three necks rising from one coil, the middle head wearing the small golden crown, round red eyes, grumpy boss look. Its coil stays in place but all three long necks now bend and stretch strongly toward the RIGHT side like three reeds blown by the wind: all three heads are turned to face the right in profile, pushed forward and lower than in the reference, stacked one above the other without touching, the crowned head in the middle; the heads come close to the right edge of the quadrant. Mouths closed in grumpy grins;
- top-left: the terracotta orange-pink rattlesnake with cream diamond patches, cream belly and beige stacked rattle on the left keeps its lower body and rattle in place and whips its head forward and down toward the right, neck stretched, lips closed in a cheeky grin;
- top-right: the golden-ochre cobra with the open hood and teal blue-green back and edges, standing tall on the same base as in the reference, bends its hooded head and upper body forward toward the right in a quick peck, hood still open, lips closed;
- bottom-left: the charcoal-black snake with the light grey banded belly and yellow eye keeps its coil on the ground and shoots its raised neck forward and low toward the right, head leading, lips closed.

IMPORTANT, this is a toy for young children: mischievous, never frightening (the king stays grumpy but not scary). All mouths stay shut: no teeth, no fangs, no white points at the lips, no forked tongue, no blood. No motion lines, no impact stars, no dust, no text, no frame, no extra characters or objects, nothing crossing from one quadrant into another.
```

Prompt de l'essai 1 (case 2) :

```
Using the reference image as the exact character sheet, create the ATTACK FRAME of the same 2x2 game sprite sheet: the same four modelling-clay toy snakes, identical faces, eyes, scales, patterns, colours, clay material, lighting and size, each one alone and centred in its own quadrant, resting on the ground at the same height as in the reference, all four seen in the same view and still facing the SAME direction as in the reference (toward the right). Pure white background, tiny soft contact shadow underneath.

Only the pose changes, to show the moment the bite lands toward the right:
- top-left: the terracotta orange-pink rattlesnake with cream diamond patches, cream belly and beige stacked rattle on the left keeps its lower body and rattle in place and whips its head forward and down toward the right, the S of its neck straightened into a lunge, mouth slightly open in a cheeky grin;
- top-right: the golden-ochre cobra with the open hood and teal blue-green back and edges, standing tall, bends its hooded head and upper body forward toward the right in a quick peck, hood still open, mouth slightly open;
- bottom-left: the charcoal-black snake with the light grey banded belly and yellow eye keeps its coil on the ground and shoots its raised neck forward and low toward the right, head leading, mouth slightly open;
- bottom-right: the three-headed snake king, indigo blue-violet scaly body with golden-ochre belly, three separate heads on three necks rising from one coil, the middle head wearing the small golden crown, round red eyes and grumpy boss look: the coil stays in place and all three necks stretch forward toward the right together in a lunge, the three heads staying clearly separated one above the other, mouths closed in grumpy grins, crown still on the middle head.

Mischievous, cheeky, never frightening (the king stays grumpy but not scary); the mouth may open slightly for the bite but NO fangs, no teeth, no forked tongue, no blood. No motion lines, no impact stars, no dust, no text, no frame, no extra characters or objects, nothing crossing from one quadrant into another.
```

## allies-mutants

- Choix : JNayRpEOq4 : les deux mutants frappent vers la gauche, comme les autres alliés ;
  dans O6fPZeDynm ils frappaient vers la droite.
- Disposition : cases du haut 512×600 comme la planche de repos. Tout ce qui est sous y = 600
  (les deux icônes, hors cases et non utilisées par le jeu) est recopié de la planche de repos.
- Recalage : golem dy = −1 (bas à 580) ; mutant élastique dy = 0 (bas à 585).
- Réserve : le bras du mutant élastique est tendu mais pas vraiment étiré ; le poing du golem
  est levé vers la gauche plutôt que lancé à l'horizontale.

```
Using the reference image as the exact character sheet, create the ATTACK FRAME of the same game sprite sheet: the same two tall modelling-clay toy figures in the top row and the same two small clay icons in the bottom row, identical faces, eyes, scarves, colours, clay material, lighting and size, each one alone and centred in its own quadrant, the two figures with their feet at exactly the same height as in the reference (slightly below the middle of the sheet), seen from the front as in the reference. Pure white background, tiny soft contact shadow under the feet.

Only the pose of the two tall figures changes, to show the moment the blow lands toward the left side of the picture:
- top-left: the tall rock golem built from separate cornflower-blue stone blocks, two round amber-brown eyes, small smile, teal scarf with a leaf-shaped end, punches toward the left: the big stone fist on the left side of the picture is thrown straight out to the left at shoulder height, arm fully extended, the body leaning a little into the punch, the other fist pulled back against its side, both feet on the ground;
- top-right: the tall soft creature with the lilac-purple rounded head, two dark round eyes, small smile, mustard-yellow scarf, dusty mauve-pink body and two big teal mittens stretches its elastic arm: the arm on the left side of the picture stretches out long and thin like rubber toward the left, the teal mitten closed in a fist at the end reaching the left edge of its quadrant, the other arm bent with its mitten near the body, both round feet on the ground;
- bottom-left: the small orange icon of three stacked beads with curved signal arcs: KEEP THIS QUADRANT EXACTLY UNCHANGED, identical to the reference, same small size and same place;
- bottom-right: the small golden-orange shield icon with two cream stripes: KEEP THIS QUADRANT EXACTLY UNCHANGED, identical to the reference, same small size and same place.

Determined, brave, friendly faces. No motion lines, no impact stars, no dust, no text, no frame, no extra characters or objects, nothing crossing from one quadrant into another.
```

## Ce qui n'a pas été vérifié

- Aucune planche n'a été chargée dans le jeu : ni l'enchaînement repos → attaque à l'écran,
  ni la lisibilité à la taille réelle sur téléphone.
- Rien n'a été montré aux enfants ni au parent.
- Le sens de l'attaque suit la direction du personnage au repos ; le rendu d'un sprite
  retourné par le jeu n'a pas été contrôlé.
