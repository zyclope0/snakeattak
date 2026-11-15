"""Provisional pictures of the three new snakes (fourth balance revision, 16 November 2026).

Each is a cell of `enemies-organic`, recoloured: no image generator, no cost, no new drawing.
They wait for the drawings of the child's three snakes; see
`public/assets/illustrated/PROVENANCE-SERPENTS-PROVISOIRES-2026-11.md`.

Usage, from the root of the repository:
    python3 scripts/recolor-new-snakes.py src/assets/illustrated src/assets/illustrated
"""
import sys, colorsys
from PIL import Image
import numpy as np
src_dir, out_dir = sys.argv[1], sys.argv[2]
CELL = 512
def cell(img, index):
    x, y = (index % 2) * CELL, (index // 2) * CELL
    return img.crop((x, y, x + CELL, y + CELL))
def recolor(tile, hue, sat=1.0, val=1.0, lift=0.0):
    a = np.asarray(tile.convert('RGBA')).astype(np.float32) / 255
    rgb, alpha = a[..., :3], a[..., 3:]
    mx, mn = rgb.max(-1), rgb.min(-1)
    v = mx
    s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    # Only the coloured parts turn: eyes, teeth and outlines keep their greys.
    h = np.full(v.shape, hue)
    s2 = np.clip(s * sat, 0, 1)
    v2 = np.clip(v * val + lift * (1 - v), 0, 1)
    i = np.floor(h * 6).astype(int) % 6
    f = h * 6 - np.floor(h * 6)
    p, q, t = v2 * (1 - s2), v2 * (1 - f * s2), v2 * (1 - (1 - f) * s2)
    out = np.zeros_like(rgb)
    for k, (r, g, b) in enumerate([(v2, t, p), (q, v2, p), (p, v2, t), (p, q, v2), (t, p, v2), (v2, p, q)]):
        m = i == k
        out[..., 0][m], out[..., 1][m], out[..., 2][m] = r[m], g[m], b[m]
    weight = np.clip(s * 3, 0, 1)[..., None]
    mixed = out * weight + rgb * (1 - weight)
    return Image.fromarray((np.concatenate([mixed, alpha], -1) * 255).round().astype(np.uint8), 'RGBA')
RECIPES = [  # (source cell of enemies-organic, hue 0..1, saturation, value, lift)
    (0, 0.00, 1.15, 1.00, 0.05),  # big fangs: red
    (0, 0.13, 0.85, 1.20, 0.25),  # rare: pale gold
    (1, 0.76, 0.90, 0.62, 0.00),  # ninja: dark violet, from the runner
]
for name in ['enemies-organic', 'enemies-organic-attack']:
    src = Image.open(f'{src_dir}/{name}.webp').convert('RGBA')
    sheet = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    for index, (source, hue, sat, val, lift) in enumerate(RECIPES):
        sheet.paste(recolor(cell(src, source), hue, sat, val, lift), ((index % 2) * CELL, (index // 2) * CELL))
    out = f"{out_dir}/{name.replace('enemies-organic', 'serpents-nouveaux')}.webp"
    sheet.save(out, 'WEBP', quality=88, method=6)
    print(out)
