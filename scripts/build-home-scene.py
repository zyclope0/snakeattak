#!/usr/bin/env python3
"""Images de l'accueil, dérivées d'images déjà dans le dépôt : aucune génération, aucun appel distant.

  python3 scripts/build-home-scene.py

Écrit dans src/assets/home/ :
- fond.webp : la forêt floue de l'illustration d'origine, sans les personnages ;
- masque.webp : la silhouette des personnages, par le même chemin que icon-512.png ;
- second-plan-gauche.webp, second-plan-droite.webp : plantes et rochers du jeu, derrière eux ;
- refuge.webp : le refuge au cristal, pour le panneau du titre ;
- menu-*.webp : un petit objet du jeu pour chaque bouton du bas de l'accueil ;
- mission-*.webp : l'objet de chaque mission, pour la carte des missions ;
- onglet-*.webp, repere-*.webp : les images de la préparation d'une mission.
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


def far(image):
    """Second plan : un peu flou et un peu éteint, comme le fond."""
    return ImageEnhance.Brightness(image.filter(ImageFilter.GaussianBlur(1.6))).enhance(0.93)


def compose(width, height, items, name, quality):
    """items : (image, bord gauche, ligne des pieds), du fond vers l'avant."""
    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    for image, x, foot in items:
        canvas.alpha_composite(image, (x, foot - image.height))
    box = canvas.getchannel("A").getbbox()
    canvas.crop((box[0], box[1], box[2], height)).save(out / f"{name}.webp", quality=quality, method=6)


fern = cell("props-three-bridges", 1)
bush = cell("props-three-bridges", 2)
rocks = cell("props-three-bridges", 3)
palm = cell("terrain-props", 1)
mossy = cell("terrain-props", 3)
fort = cell("strongholds", 0)

compose(520, 520, [(far(fit(palm, 430)), 0, 520), (far(fit(fern, 240, True)), 250, 520)], "second-plan-gauche", 78)
compose(520, 520, [(far(fit(fern, 330)), 60, 520), (far(fit(mossy, 150)), 0, 520)], "second-plan-droite", 78)
compose(
    640,
    420,
    [(fit(fern, 170, True), 0, 380), (fit(fort, 340), 110, 410), (fit(bush, 100), 420, 418), (fit(rocks, 80), 20, 418)],
    "refuge",
    86,
)

foreground = Image.open(root / "resources/android-icon/foreground-source.png").convert("RGBA")
source = Image.open(root / "docs/resources-2026-11/assets/icone-source.png").convert("RGB")

# La silhouette suit le chemin de icon-512.png (2048 -> 720 -> 512), rognée d'un demi-pixel
# pour ne pas garder le liseré vert foncé de l'icône sur un fond clair.
alpha = foreground.getchannel("A").resize((720, 720), Image.LANCZOS).resize((512, 512), Image.LANCZOS)
tight = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.5))
mask = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
mask.putalpha(tight)
mask.save(out / "masque.webp", lossless=True, method=6)

# Le fond sans les personnages : leur place est comblée par la forêt floue qui les entoure.
size = 256
plate = source.resize((size, size), Image.LANCZOS).convert("RGBA")
hole = (
    foreground.getchannel("A")
    .resize((size, size), Image.LANCZOS)
    .point(lambda v: 255 if v > 4 else 0)
    .filter(ImageFilter.MaxFilter(13))
)
plate.putalpha(hole.point(lambda v: 255 - v))
for radius in (48, 24, 12, 6, 3):
    fill = plate.convert("RGBa").filter(ImageFilter.GaussianBlur(radius)).convert("RGBA")
    fill.putalpha(fill.getchannel("A").point(lambda v: 255 if v > 0 else 0))
    fill.alpha_composite(plate)
    plate = fill
backdrop = plate.convert("RGB").filter(ImageFilter.GaussianBlur(3))
backdrop.resize((768, 768), Image.BICUBIC).filter(ImageFilter.GaussianBlur(4)).save(
    out / "fond.webp", quality=72, method=6
)


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


def picture(image, name):
    image = image.crop(image.getchannel("A").point(lambda v: 255 if v > 16 else 0).getbbox())
    scale = 128 / max(image.size)
    image = image.resize((round(image.width * scale), round(image.height * scale)), Image.LANCZOS)
    square = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    square.alpha_composite(image, ((128 - image.width) // 2, (128 - image.height) // 2))
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
