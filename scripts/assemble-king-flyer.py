"""Assemble serpents-roi-volant (idle) and serpents-roi-volant-attack from the Magnific cut-outs.

Usage: python3 scripts/assemble-king-flyer.py <folder of cut-outs> <output folder>
Inputs (one figure each, background removed): fly-idle.png, fly-attack.png, king-idle.png,
king-attack.png. See public/assets/illustrated/PROVENANCE-ROI-VOLANT-2026-11-26.md.

A 1024 sheet like serpents-family: the flying snake in the first 512 cell, King Snake in the
second; the two others stay empty. At rest, each figure takes the place of the picture it
replaces: King Snake the width and bottom of the king of serpents-family (cell 3), the flying
snake the bottom of the green snake of enemies-organic (cell 0), which it borrowed until now,
so that the board anchors do not move. Attack: scaled to the same amount of clay as the figure
at rest (count of opaque pixels), never beyond its cell, with the lowest 30 % of the figure
centred where it is at rest, on the same bottom.
"""
import sys
from PIL import Image
import numpy as np

work, out = sys.argv[1], sys.argv[2]
TH, CELL, MARGIN = 60, 512, 6
# name, bottom of the picture it replaces, widest width at rest
FIGURES = [('fly', 491, CELL - 2 * MARGIN), ('king', 479, 492)]


def bbox(a):
    ys, xs = np.where(a > TH)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def cropped(path):
    figure = Image.open(path).convert('RGBA')
    return figure.crop(bbox(np.array(figure)[:, :, 3]))


def base_centre(alpha):
    """Middle of the lowest 30 % of the figure."""
    x0, y0, x1, y1 = bbox(alpha)
    band = alpha[y1 - int((y1 - y0) * 0.3):y1]
    xs = np.where((band > TH).any(axis=0))[0]
    return (xs.min() + xs.max() + 1) / 2


rest_sheet = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
attack_sheet = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
for index, (name, bottom, widest) in enumerate(FIGURES):
    ox, oy = (index % 2) * CELL, (index // 2) * CELL
    rest = cropped(f'{work}/{name}-idle.png')
    w, h = rest.size
    scale = min(widest / w, (bottom - MARGIN) / h)
    rest = rest.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    cell = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
    cell.paste(rest, ((CELL - rest.width) // 2, bottom - rest.height), rest)
    rest_sheet.paste(cell, (ox, oy))
    a = np.array(cell)[:, :, 3]
    centre = base_centre(a)

    shot = cropped(f'{work}/{name}-attack.png')
    w, h = shot.size
    rest_area = int((a > TH).sum())
    shot_area = int((np.array(shot)[:, :, 3] > TH).sum())
    scale = min((rest_area / shot_area) ** 0.5, (CELL - 2 * MARGIN) / w, (bottom - MARGIN) / h)
    shot = shot.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    x = round(centre - base_centre(np.array(shot)[:, :, 3]))
    x = max(MARGIN, min(x, CELL - MARGIN - shot.width))
    cell = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
    cell.paste(shot, (x, bottom - shot.height), shot)
    attack_sheet.paste(cell, (ox, oy))
    ratio = int((np.array(cell)[:, :, 3] > TH).sum()) / rest_area
    print(f'{name}: rest {rest_area} px of clay, attack/rest {ratio:.2f}')

rest_sheet.save(f'{out}/serpents-roi-volant.webp', 'WEBP', quality=88, method=6)
attack_sheet.save(f'{out}/serpents-roi-volant-attack.webp', 'WEBP', quality=88, method=6)
