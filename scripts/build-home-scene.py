#!/usr/bin/env python3
"""Images de l'accueil, dérivées d'images déjà dans le dépôt : aucune génération, aucun appel distant.

  python3 scripts/build-home-scene.py

Écrit dans src/assets/home/ :
- fond.webp : la forêt floue de l'illustration d'origine, sans les personnages ;
- masque.webp : la silhouette des personnages, par le même chemin que icon-512.png ;
- second-plan-gauche.webp, second-plan-droite.webp : plantes et rochers du jeu, derrière eux ;
- refuge.webp : le refuge au cristal, pour le panneau du titre.
Seul Pillow est nécessaire. Ce n'est pas une étape du build : les fichiers sont suivis dans Git.
"""
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps

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
