"""Assemble allies-spinosaure (idle) and allies-spinosaure-attack from the Magnific cut-outs.

Usage: python3 scripts/assemble-spinosaurus.py <folder of cut-outs> <output folder>
Inputs: idle-cut.png and atk-cut.png (one figure each, background removed). See
public/assets/illustrated/PROVENANCE-SPINOSAURE-2026-11-19.md.

A 1024 sheet like allies-dinosaurs, the spinosaurus in its first 512 cell (the portraits of
the interface read every sheet as 2 × 2; the three other cells wait for other dinosaurs). At rest, the figure fills the cell width
(margin kept) with its feet on BOTTOM, the line of the tyrannosaurus. Attack: scaled to the same
amount of clay as the figure at rest (count of opaque pixels), never beyond the cell, with the
feet (lowest 30 %) centred where the feet at rest are, on the same bottom.
"""
import sys
from PIL import Image
import numpy as np

work, out = sys.argv[1], sys.argv[2]
TH, CELL, MARGIN, BOTTOM = 60, 512, 6, 475

def bbox(a):
    ys, xs = np.where(a > TH)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1

def feet(alpha):
    """Middle of the lowest 30 % of the figure."""
    x0, y0, x1, y1 = bbox(alpha)
    band = alpha[y1 - int((y1 - y0) * 0.3):y1]
    xs = np.where((band > TH).any(axis=0))[0]
    return (xs.min() + xs.max() + 1) / 2

def cropped(path):
    figure = Image.open(path).convert('RGBA')
    return figure.crop(bbox(np.array(figure)[:, :, 3]))

rest = cropped(f'{work}/idle-cut.png')
w, h = rest.size
scale = min((CELL - 2 * MARGIN) / w, (BOTTOM - MARGIN) / h)
rest = rest.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
idle = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
idle.paste(rest, ((CELL - rest.width) // 2, BOTTOM - rest.height), rest)
ia = np.array(idle)[:, :, 3]
rest_feet = feet(ia)

shot = cropped(f'{work}/atk-cut.png')
rest_area = int((ia > TH).sum())
shot_area = int((np.array(shot)[:, :, 3] > TH).sum())
w, h = shot.size
scale = min((rest_area / shot_area) ** 0.5, (CELL - 2 * MARGIN) / w, (BOTTOM - MARGIN) / h)
shot = shot.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
x = round(rest_feet - feet(np.array(shot)[:, :, 3]))
x = max(MARGIN, min(x, CELL - MARGIN - shot.width))
attack = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
attack.paste(shot, (x, BOTTOM - shot.height), shot)

for name, cell in (('allies-spinosaure', idle), ('allies-spinosaure-attack', attack)):
    sheet = Image.new('RGBA', (2 * CELL, 2 * CELL), (0, 0, 0, 0))
    sheet.paste(cell, (0, 0))
    sheet.save(f'{out}/{name}.webp', 'WEBP', quality=88, method=6)
for name, im in (('rest', idle), ('attack', attack)):
    a = np.array(im)[:, :, 3]
    print(name, bbox(a), 'clay', int((a > TH).sum()))
