# Assets illustrés — version 0.11

> Onze planches ont été refaites en pâte à modeler le 12 novembre 2026 : voir
> [PROVENANCE-RESTYLE-2026-11.md](PROVENANCE-RESTYLE-2026-11.md). Ce qui suit décrit leur
> création d'origine.

Création le 2 novembre 2026 via le compte Magnific Premium du créateur,
modèle Recraft V4 Pro. Style défini pour ce jeu : miniatures de conte en bois
peint, moss/ocre/teal, silhouettes distinctes et lisibles. La planche front a
servi de référence de style aux suivantes.

11 générations ×175 crédits =1925 ; 8 détourages ×3 =24 ; 11 mises au format
×40 =440. **Total annoncé et vérifié : 2389 crédits.** Solde observé avant19604,
après17215. Aucun abonnement supplémentaire ni achat de stock.

Les huit atlas sont en 1024×1024 avec quatre cellules512×512. Les trois fonds
sont en1600×900. Les atlas sont exportés en WebP sans perte, en conservant l'alpha ;
les fonds opaques utilisent WebP qualité88 pour contenir le poids. Cette compression
locale est un export technique, pas une nouvelle génération. Les PNG originaux
restent sur le compte Magnific et ont été conservés séparément dans l'environnement.

| Fichier | Création initiale | Détourage | Format production | Octets WebP |
| --- | --- | --- | --- | --- |
| allies-front | [lJder7Qgv9](https://www.magnific.com/app/creation/lJder7Qgv9) | O6mtwrmynm | tC4Ptr6mZJ | 572,236 |
| allies-support | [lJdejmJgv9](https://www.magnific.com/app/creation/lJdejmJgv9) | 0ejxWPtTfW | jUDMjZNLD0 | 582,990 |
| allies-elite | [w48ogCv7EI](https://www.magnific.com/app/creation/w48ogCv7EI) | WDr1nyecXe | 3zQu3oFREY | 544,860 |
| allies-creatures | [79I8SuqJAL](https://www.magnific.com/app/creation/79I8SuqJAL) | 3zQu6siREY | p8SgpKlehw | 511,150 |
| enemies-organic | [lJdejf4gv9](https://www.magnific.com/app/creation/lJdejf4gv9) | rgVTkv5xtc | 8ayO8lSIrU | 647,204 |
| enemies-mechanical | [u52ZfDyQLD](https://www.magnific.com/app/creation/u52ZfDyQLD) | TdLjc6JVNR | nVkKnF0YQD | 559,602 |
| terrain-props | [s7epxC5l8e](https://www.magnific.com/app/creation/s7epxC5l8e) | Xm7wez7Bfo | SyBXSDLUb8 | 689,720 |
| interface-craft | [tC4PocEmZJ](https://www.magnific.com/app/creation/tC4PocEmZJ) | UPoBg5Pwny | 3zQu3CxREY | 415,986 |
| ground-clearing | [TdLjWiyVNR](https://www.magnific.com/app/creation/TdLjWiyVNR) | — | p8SgpgPehw | 521,614 |
| ground-grove | [WDrr0QOcXe](https://www.magnific.com/app/creation/WDrr0QOcXe) | — | xSMMl0wjfW | 593,130 |
| ground-ruins | [vQ66fJNa47](https://www.magnific.com/app/creation/vQ66fJNa47) | — | fH33Qi8CDY | 610,788 |

Les images sont des poses fixes ; la marche, les réactions, la compression des
ressorts et les attaques sont animées de façon procédurale dans Phaser. Aucune
planche d'animation à plusieurs poses n'est annoncée. Les routes et rochers sont
composés à partir des vraies coordonnées du moteur, pas déduits du fond peint.

Les personnages sont générés pour ce projet ; les conditions Magnific/Recraft du
compte régissent les droits d'utilisation. Aucune licence ouverte n'est présumée.
Prompts et identifiants de création : docs/archive/art-production-0.11.json. Aucun token,
URL privée signée ou clé API n'est incorporé au jeu.


## Ajout 0.12 — refuge et antres

`src/assets/illustrated/strongholds.webp` : une planche 2×2 (refuge, antre de racines,
antre à rouages, antre de jardin), génération originale Recraft V4 Pro via Magnific.
Style de référence : planche terrain de la 0.11, création s7epxC5l8e.

- Source : https://www.magnific.com/app/creation/JNtabQwOq4
- Détourage : https://www.magnific.com/app/creation/TdLS6U6VNR
- Préparation 1024² : https://www.magnific.com/app/creation/KLcMh3pkqp
- Coût : 175 + 3 + 40 = 218 crédits. Compte : 17 215 → 16 997, vérifié.
- Export technique PNG → WebP sans perte, alpha conservé : 792 264 octets.
- Aucun dessin externe copié ; pas de licence de stock à acquérir pour cette génération.
- Les droits d'utilisation suivent les conditions du compte Magnific/Recraft ; aucune exclusivité ou protection juridique n'est garantie.

Le refuge est retourné horizontalement dans le moteur pour orienter la porte vers
les attaques. Fissures, jauge et signaux d'arrivée sont du rendu de jeu, sans
modification créative des fichiers de pixels. Aucun service de génération en partie.
Métadonnées et prompt : docs/archive/art-assets-0.12.json dans les sources.


## Ajout 0.13 — miels et serpent parapluie

`src/assets/illustrated/miels-parapluie.webp` : atlas 2×2 original Recraft V4 Pro,
style ancré sur la première planche alliée. Parapluie ouvert/fermé du même serpent,
pot ambré attirant et pot vert collant. Les deux profils générés regardent à gauche ;
le moteur les retourne selon l'orientation réelle, sans modifier les pixels.

- Source : https://www.magnific.com/app/creation/UPofR1Jwny
- Détourage : https://www.magnific.com/app/creation/79IEcCBJAL
- Préparation 1024² : https://www.magnific.com/app/creation/1lTBZAWr4r
- Coût : 175 + 3 + 40 = 218 crédits. Solde vérifié : 16 997 → 16 779.
- PNG préparé par Magnific puis conversion technique WebP sans perte et alpha conservé.
- Taille : 336 234 octets ; prompt et empreinte dans docs/archive/art-assets-0.13.json.

Aucun personnage ou dessin externe copié ; utilisation suivant les conditions du
compte Magnific/Recraft. Pas de service de génération requis pendant le jeu.

## Bestiaire et lisibilité — 0.14

Quatre générations Recraft V4 Pro (dont une reprise mutants après inspection de
bandes d'ombres résiduelles), quatre détourages, trois formats : **832 crédits**
(700 +12 +120). Même projet Personal et référence de style que les premières
planches. Trois exports 1024², WebP sans perte avec alpha. Total nouveau :
1 671 362 octets. Aucun appel au service pendant une partie.

| Fichier | Génération | Alpha | Format production | Octets |
| --- | --- | --- | --- | --- |
| allies-dinosaurs.webp | [fH3Xy2ICDY](https://www.magnific.com/app/creation/fH3Xy2ICDY) | 3zQ7al7REY | 5jWazibKxe | 684408 |
| serpents-family.webp | [ks0CAdZ16B](https://www.magnific.com/app/creation/ks0CAdZ16B) | iGuwvgj3uK | BhJcUsRoQR | 580330 |
| allies-mutants.webp | [SyBKeYuUb8](https://www.magnific.com/app/creation/SyBKeYuUb8) | xSMQToJjfW | 1lTE0P9r4r | 406624 |

Dinosaures/serpents : cadres512². Mutants : deux cadres512×600 dans la rangée
supérieure, pour inclure les pieds ; icônes inférieures non utilisées. La première
planche mutants dtwYjirXSL (alpha jUDFcFoLD0), rejetée visuellement, n'est pas
incluse. Contrôle : silhouettes distinctes des quatre dinosaures, collerette du
cobra simple, trois têtes séparées du boss, alpha et pieds des mutants.

Les sources de conception de lisibilité et le détail des règles figurent dans
docs/archive/BESTIAIRE-LISIBILITE-0.14.md. Le liseré et le sol calmé sont des traitements
au rendu ; aucun fond peint ni dessin d'origine n'est supprimé.

## Interface 0.15

Images et atlas réutilisés sans nouvelle génération ni facturation graphique. Interface HTML/CSS réorganisée ; polices Fredoka et Nunito Sans auto-hébergées sous SIL OFL 1.1. Licences complètes dans FONT-LICENCES.txt fourni avec chaque distribution. Aucun appel de police ou d'image à un service tiers pendant le jeu.

## Carte pilote « Les trois ponts » — 0.23, 7 novembre 2026

Deux assets générés sur Magnific avec Google Nano Banana 2.1, en prenant le fond
`ground-clearing` existant comme référence de style :

- [Fond de clairière](https://www.magnific.com/app/creation/eI7u6vTdqL) : 65 crédits,
  export technique WebP 1600×900, 199 922 octets.
- [Pont et végétation](https://www.magnific.com/app/creation/9ZE0KGfNYZ) : 65 crédits;
  [détourage Magnific](https://www.magnific.com/app/creation/xSp9tkojfW) : 3 crédits.
  Quatre cases 512² rangées dans un atlas WebP 1024² sans perte, 541 866 octets.

Total de ce lot : **133 crédits**. Projet « La Conquête des Serpents ».
Prompts et étapes conservés dans `docs/archive/art-assets-0.23.json`; originaux dans
`docs/art-sources-0.23/`. Réduction et rangement locaux sont des exports
techniques. Les personnages existants ne sont pas remplacés.

## Généralisation des cartes — 0.25, 7 novembre 2026

Deux fonds supplémentaires sur Magnific, Google Nano Banana 2.1, référence de
style : la clairière lisible 0.23. Projet « La Conquête des Serpents ».

- [Bosquet ambré](https://www.magnific.com/app/creation/5j0OOrPKxe) : 65 crédits,
  export WebP 1600×900 qualité86, 142 082 octets.
- [Jardin de pierres](https://www.magnific.com/app/creation/XmOHH8uBfo) : 65 crédits,
  export WebP 1600×900 qualité86, 216 522 octets.

Total du lot : **130 crédits**. Pas de nouvelle génération des personnages.
Prompts : docs/archive/art-assets-0.25.json; PNG originaux : docs/art-sources-0.25/.
Les anciens fonds restent conservés comme références dans les sources ; ils
ne sont plus chargés pour les cartes courantes. Le prototype V4 reste intact.

## Détourage technique des bâtiments — 0.28, 8 novembre2026

Aucune nouvelle génération ni achat. Source inchangée :
`src/assets/illustrated/strongholds.original.webp` (SHA256
9c0f0d4d22e398c868635a3cbe0a585752fcf5984b673b5faf59ad73c96a8604).
Le script local `scripts/clean-strongholds.py` met à zéro l’alpha des grandes
composantes bleu pâle reliées aux bords inférieurs/latéraux des cellules.
22249 pixels sélectionnés, dont19604 opaques : contrairement au diagnostic
initial, retirer seulement les semi-transparents aurait laissé le fond bleu.
Tous les pixels non sélectionnés restent identiques, cristal bleu compris.
Original conservé ; export WebP sans perte, aucune licence/crédit d’origine
remplacé. Reproduction : Pillow12.3.0 (`requirements-art.txt`), puis
`python scripts/clean-strongholds.py`; contrôle sans écriture : `--check`.
Empreintes, seuils et composantes dans `reports/strongholds-cleanup-0.28.json`.
Cette provenance est copiée dans `dist/asset-provenance.md` à la compilation.

## Cadres périphériques — 0.34.0

Sources fournies par le créateur dans l’audit : terrain-crue.png (création
Magnific cpLvd4Z0eP) et terrain-marais.png (Sy8A4QrUb8). Originaux et provenance
détaillée conservés dans docs/resources-2026-11. Réexport technique local WebP
1600×900, qualité88, sans retouche ni nouvelle génération. Le centre des fonds
n’est pas affiché derrière les unités : seuls les bords cadrent les terrains
existants. Empreintes et conversion reproductible : resources/scenery/manifest.json
et scripts/export-scenery-034.py. Le marais gravé n’est pas la référence de DA.

## Soucoupe décorative — 0.35.0

Dessin original procédural dans `src/render/saucer.ts`, créé pour le projet le
9 novembre 2026 : disques mats superposés, dôme turquoise, petits détails fixes.
Aucun fichier, personnage, logo ou extrait du film Mars Attacks n'est utilisé.
Le clin d'œil demandé reste une petite soucoupe de genre, dans un seul décor de
ruines classique. Aucun service de génération ni téléchargement payant.
Le dessin suit les droits du code propriétaire du projet ; aucune licence de
ressource externe n'est revendiquée pour cet élément.
