"""Assemble serpents-nouveaux (idle) and serpents-nouveaux-attack from the Magnific cut-outs.

Usage: python3 scripts/assemble-new-snakes.py <folder of cut-outs> <output folder>
Inputs: idle-cut.png (the idle sheet, background removed), fang-cut.png, rare-cut.png and
ninja-cut.png (one attacking figure each, background removed). See
public/assets/illustrated/PROVENANCE-SERPENTS-NOUVEAUX-2026-11-18.md.

Idle: the three cells of the cut sheet, each moved down so that its bottom matches the
provisional sheet (in-game anchor unchanged). Attack: each single-figure cut-out is scaled to the
same amount of clay as the figure at rest (count of opaque pixels), never beyond its 512 cell,
then placed with the coil left edge and the bottom of the figure at rest, inside its cell.
"""
import sys
from PIL import Image
import numpy as np

work, out = sys.argv[1], sys.argv[2]
TH, CELL, MARGIN = 60, 512, 6
BOTTOMS = [491, 491, 488]  # bottoms of the provisional cells: fang, rare, ninja
ORIGINS = [(0, 0), (512, 0), (0, 512)]
ATTACKS = ['fang-cut', 'rare-cut', 'ninja-cut']

def bbox(a):
    ys, xs = np.where(a > TH)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1

def coil(alpha):
    """Left edge and width of the lowest 30 % of the figure."""
    x0, y0, x1, y1 = bbox(alpha)
    band = alpha[y1 - int((y1 - y0) * 0.3):y1]
    xs = np.where((band > TH).any(axis=0))[0]
    return xs.min(), xs.max() + 1 - xs.min()

idle = Image.open(f'{work}/idle-cut.png').convert('RGBA')
rest = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
attack = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
for index, ((ox, oy), bottom, name) in enumerate(zip(ORIGINS, BOTTOMS, ATTACKS)):
    cell = idle.crop((ox, oy, ox + CELL, oy + CELL))
    a = np.array(cell)[:, :, 3]
    x0, y0, x1, y1 = bbox(a)
    dy = bottom - y1
    placed = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
    placed.paste(cell, (0, dy), cell)
    rest.paste(placed, (ox, oy))
    left, width = coil(np.array(placed)[:, :, 3])

    figure = Image.open(f'{work}/{name}.png').convert('RGBA')
    fa = np.array(figure)[:, :, 3]
    fx0, fy0, fx1, fy1 = bbox(fa)
    figure = figure.crop((fx0, fy0, fx1, fy1))
    fleft, fwidth = coil(np.array(figure)[:, :, 3])
    w, h = figure.size
    # As much clay as the figure at rest (same count of opaque pixels), so that the snake
    # neither shrinks nor swells for the instant of the blow; never beyond its cell.
    rest_area = int((a > TH).sum())
    shot_area = int((np.array(figure)[:, :, 3] > TH).sum())
    scale = min((rest_area / shot_area) ** 0.5, (CELL - 2 * MARGIN) / w, (bottom - MARGIN) / h)
    figure = figure.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    w, h = figure.size
    x = left - round(fleft * scale)
    x = max(MARGIN, min(x, CELL - MARGIN - w))
    y = bottom - h
    shot = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
    shot.paste(figure, (x, y), figure)
    attack.paste(shot, (ox, oy))
    ratio = int((np.array(shot)[:, :, 3] > TH).sum()) / rest_area
    print(f'cell {index}: idle dy={dy:+d} bottom={bottom}; attack scale={scale:.3f} '
          f'at x={x} y={y} size={w}x{h}; clay attack/rest={ratio:.2f}')

rest.save(f'{out}/serpents-nouveaux.webp', lossless=True, quality=100, method=6)
attack.save(f'{out}/serpents-nouveaux-attack.webp', lossless=True, quality=100, method=6)
