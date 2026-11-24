#!/usr/bin/env python3
"""Images de l'accueil, dérivées d'images déjà dans le dépôt : aucune génération, aucun appel distant.

  python3 scripts/build-home-scene.py

Écrit dans src/assets/home/ :
- menu-*.webp : un petit objet du jeu pour les boutons de l'accueil et du plateau ;
- mission-*.webp : l'objet de chaque mission, pour la carte des missions ;
- onglet-*.webp, repere-*.webp : les images de la préparation d'une mission ;
- joueur-*.webp : le portrait de chaque personnage qu'un joueur peut choisir ;
- voyage-*.webp : le panneau du voyage, l'antre de ses petites cartes et les images de ses bonus ;
- clairiere-*.webp : le premier écran « la clairière » (24 novembre 2026) : le décor, les
  trois lieux, la plaque et le parchemin, et les pièces modelées (resources/home-clay/).
Seul Pillow est nécessaire. Ce n'est pas une étape du build : les fichiers sont suivis dans Git.
"""
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageOps

root = Path(__file__).resolve().parent.parent
sheets = root / "src/assets/illustrated"
out = root / "src/assets/home"
out.mkdir(parents=True, exist_ok=True)


def cell(sheet, index):
    image = Image.open(sheets / f"{sheet}.webp").convert("RGBA")
    x, y = (index % 2) * 512, (index // 2) * 512
    tile = image.crop((x, y, x + 512, y + 512))
    return tile.crop(tile.getchannel("A").point(lambda v: 255 if v > 16 else 0).getbbox())


def fit(image, height, flip=False):
    image = image.resize((round(image.width * height / image.height), height), Image.LANCZOS)
    return ImageOps.mirror(image) if flip else image


# Un petit objet du jeu par bouton de l'accueil, dans un carré de 128 px.
def piece(sheet, index, box):
    image = Image.open(sheets / f"{sheet}.webp").convert("RGBA")
    x, y = (index % 2) * 512, (index // 2) * 512
    return image.crop((x + box[0], y + box[1], x + box[2], y + box[3]))


def soft_base(image, rows):
    """Le bas d'un morceau découpé s'efface en douceur au lieu de finir net."""
    fade = Image.new("L", image.size, 255)
    draw = ImageDraw.Draw(fade)
    for row in range(rows):
        draw.line((0, image.height - 1 - row, image.width, image.height - 1 - row), fill=round(255 * row / rows))
    image.putalpha(ImageChops.multiply(image.getchannel("A"), fade))
    return image


def round_cut(image):
    """Un portrait rond, bord adouci."""
    disc = Image.new("L", (image.width * 4, image.height * 4), 0)
    ImageDraw.Draw(disc).ellipse((0, 0, disc.width - 1, disc.height - 1), fill=255)
    image.putalpha(ImageChops.multiply(image.getchannel("A"), disc.resize(image.size, Image.LANCZOS)))
    return image


def picture(image, name, side=128):
    image = image.crop(image.getchannel("A").point(lambda v: 255 if v > 16 else 0).getbbox())
    scale = side / max(image.size)
    image = image.resize((round(image.width * scale), round(image.height * scale)), Image.LANCZOS)
    square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    square.alpha_composite(image, ((side - image.width) // 2, (side - image.height) // 2))
    square.save(out / f"{name}.webp", quality=88, method=6)


picture(soft_base(piece("strongholds", 0, (356, 36, 500, 232)), 34), "menu-missions")
picture(cell("interface-craft", 1), "menu-carnet")
picture(round_cut(piece("allies-front", 1, (166, 22, 440, 296))), "menu-favoris")
picture(piece("serpents-family", 3, (0, 40, 512, 512)), "menu-classique")
picture(cell("interface-craft", 3), "menu-parents")

# La carte des missions : un objet du jeu par mission.
picture(cell("strongholds", 0), "mission-refuge")
picture(cell("terrain-props", 0), "mission-trois-ponts")
picture(cell("enemies-organic", 1), "mission-course")
picture(cell("enemies-mechanical", 3), "mission-coquilles")
picture(cell("serpents-family", 0), "mission-sonnette")
picture(cell("props-three-bridges", 1), "mission-carrefour")

# La préparation : deux portraits ronds pour les onglets, un serpent pour les attaques.
picture(round_cut(piece("allies-support", 0, (150, 30, 440, 320))), "onglet-copains")
picture(round_cut(piece("enemies-organic", 0, (185, 20, 415, 250))), "onglet-reperage")
picture(cell("enemies-organic", 0), "repere-serpent")

# Les joueurs : un portrait par personnage à choisir (src/players.ts), sans charger les
# grandes planches des alliés sur l'accueil.
def figure(image):
    """Le personnage seul : les miettes d'une case voisine, au bord, sont retirées."""
    labels = image.getchannel("A").point(lambda v: 255 if v > 16 else 0)
    count = 0
    while count < 254:
        box = labels.point(lambda v: 255 if v == 255 else 0).getbbox()
        if not box:
            break
        row = labels.crop((box[0], box[1], box[2], box[1] + 1)).tobytes()
        count += 1
        ImageDraw.floodfill(labels, (box[0] + row.index(255), box[1]), count)
    sizes = labels.histogram()
    largest = max(sizes[1 : count + 1])
    keep = labels.point([255 if 0 < v <= count and sizes[v] * 20 >= largest else 0 for v in range(256)])
    # Le bord adouci du personnage est gardé avec lui.
    image.putalpha(ImageChops.multiply(image.getchannel("A"), keep.filter(ImageFilter.MaxFilter(5))))
    return image


for character, sheet, index in (
    ("hero", "allies-front", 0),
    ("club", "allies-front", 1),
    ("archer", "allies-support", 0),
    ("ninja", "allies-support", 3),
    ("knight", "allies-elite", 0),
    ("dragon", "allies-creatures", 0),
    ("dino", "allies-creatures", 1),
    ("triceratops", "allies-dinosaurs", 1),
):
    picture(figure(cell(sheet, index)), f"joueur-{character}")

# Le voyage : le panneau de bois de son bouton et de son titre (plus large que haut, gardé à
# ses proportions), l'antre des petites cartes de ses étapes, et une image par bonus à garder
# (les trois alliés offerts et le pot de miel). Les bonus s'affichent en grand sur leur
# carte : 192 px.
sign = cell("interface-craft", 0)
sign.resize((176, round(sign.height * 176 / sign.width)), Image.LANCZOS).save(
    out / "voyage-panneau.webp", quality=88, method=6
)
picture(cell("strongholds", 1), "voyage-antre")
picture(cell("miels-parapluie", 2), "voyage-miel", 192)
for ally, sheet, index in (
    ("bouclier", "allies-front", 2),
    ("ninja", "allies-support", 3),
    ("raptor", "allies-dinosaurs", 0),
):
    picture(figure(cell(sheet, index)), f"voyage-{ally}", 192)


# Le premier écran « la clairière » (maquette D retenue par le parent le 24 novembre 2026).
# Le décor est la clairière des missions, calmée pour que ce qui se touche passe devant :
# un peu floue, un peu moins de couleur et de contraste (la « dose légère » choisie par le
# parent). C'est cuit dans l'image : aucun filtre ne tourne sur le téléphone.
clearing = Image.open(sheets / "ground-clearing.webp").convert("RGB").filter(ImageFilter.GaussianBlur(1.25))
clearing = ImageEnhance.Color(clearing).enhance(0.84)
clearing = ImageEnhance.Contrast(clearing).enhance(0.87)
clearing = ImageEnhance.Brightness(clearing).enhance(0.93)
clearing.resize((1440, 810), Image.LANCZOS).save(out / "clairiere-decor.webp", quality=74, method=6)

# Les lieux : un décor du jeu et son personnage, posés sur leur ombre. Les mesures sont celles
# de la maquette, en unités (un pixel d'un téléphone de 780×360), à trois pixels l'unité.
UNIT = 3


def shadowed(image):
    """Le personnage avec une ombre courte derrière lui."""
    pad = 4 * UNIT
    canvas = Image.new("RGBA", (image.width + 2 * pad, image.height + 2 * pad), (0, 0, 0, 0))
    shade = Image.new("RGBA", image.size, (8, 18, 10, 115))
    shade.putalpha(ImageChops.multiply(image.getchannel("A"), shade.getchannel("A")))
    canvas.alpha_composite(shade, (pad, pad + UNIT))
    canvas = canvas.filter(ImageFilter.GaussianBlur(UNIT))
    canvas.alpha_composite(image, (pad, pad))
    return canvas, pad


def place(name, back, front, overlap, drop, front_left):
    """Deux pièces côte à côte qui se chevauchent, pieds alignés, sur une ombre au sol.

    back, front : (image, hauteur en unités) ; overlap : chevauchement en unités ;
    drop : de combien la pièce de devant descend sous l'autre ; front_left : devant à gauche.
    """
    (a, pad), (b, _) = shadowed(fit(back[0], back[1] * UNIT)), shadowed(fit(front[0], front[1] * UNIT))
    span = a.width + b.width - 2 * pad - overlap * UNIT
    margin, ground = 8 * UNIT, 22 * UNIT
    width, height = span + 2 * margin, max(a.height, b.height + drop * UNIT) + ground
    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    # L'ombre au sol : large, douce, plus sombre au centre.
    foot = height - ground - pad + drop * UNIT // 2
    for grow, alpha in ((1.0, 70), (0.78, 60), (0.52, 55)):
        blot = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        half_w, half_h = round(span * 0.52 * grow), round(15 * UNIT * grow)
        ImageDraw.Draw(blot).ellipse(
            (width // 2 - half_w, foot - half_h, width // 2 + half_w, foot + half_h), fill=(10, 20, 10, alpha)
        )
        canvas.alpha_composite(blot.filter(ImageFilter.GaussianBlur(5 * UNIT)))
    left, right = (b, a) if front_left else (a, b)
    x_right = margin - pad + left.width - 2 * pad - overlap * UNIT
    base = height - ground
    for image, x in ((a, margin - pad if not front_left else x_right), (b, x_right if not front_left else margin - pad)):
        sink = drop * UNIT if image is b else 0
        canvas.alpha_composite(image, (x, base - image.height + pad + sink))
    canvas.save(out / f"clairiere-{name}.webp", quality=86, method=6)


# L'antre des serpents et King Snake, à gauche comme sur le plateau ; le pont et le raptor au
# milieu ; le château au cristal et le héros à droite.
place("antre", (cell("strongholds", 1), 124), (figure(cell("serpents-family", 3)), 90), 40, 4, False)
place("pont", (cell("terrain-props", 0), 92), (figure(cell("allies-dinosaurs", 0)), 62), 30, 2, True)
place("chateau", (cell("strongholds", 0), 122), (figure(cell("allies-front", 0)), 92), 26, 6, False)

# La plaque peinte des noms de lieux (découpée en neuf par le style : ses rivets restent ronds
# à toute taille) et le parchemin de « Pour les parents ».
piece("interface-craft", 2, (84, 155, 430, 345)).save(out / "clairiere-plaque.webp", quality=90, method=6)
scroll = cell("interface-craft", 3)
scroll.resize((round(scroll.width * 180 / scroll.height), 180), Image.LANCZOS).save(
    out / "clairiere-parchemin.webp", quality=86, method=6
)

# Les pièces modelées (Magnific, 24 novembre 2026, public/assets/illustrated/
# PROVENANCE-ACCUEIL-2026-11-24.md) : leurs originaux allégés sont dans resources/home-clay/.
clay = root / "resources/home-clay"
for source, name, width, quality in (
    ("logo-fr", "logo-fr", 760, 84),
    ("logo-en", "logo-en", 760, 84),
    ("bouton", "bouton", 720, 84),
    ("roue", "roue", 144, 88),
    ("etoile", "etoile", 96, 88),
):
    image = Image.open(clay / f"{source}.webp").convert("RGBA")
    image.resize((width, round(image.height * width / image.width)), Image.LANCZOS).save(
        out / f"clairiere-{name}.webp", quality=quality, method=6
    )
