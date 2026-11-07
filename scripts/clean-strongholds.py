"""Remove the border-connected pale blue export background; never regenerate art.
Requires requirements-art.txt. Original is kept unchanged beside the output.
"""
import argparse
from collections import deque
import hashlib
import io
import json
from pathlib import Path
from PIL import Image, __version__ as pillow_version

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'src/assets/illustrated/strongholds.original.webp'
OUTPUT = ROOT / 'src/assets/illustrated/strongholds.webp'

def clean(image):
    image = image.convert('RGBA')
    if image.size != (1024, 1024):
        raise ValueError('Review thresholds before using another source layout')
    out = image.copy()
    px, target = image.load(), out.load()
    removed = set()
    components = []
    for fy in (0, 512):
        for fx in (0, 512):
            candidates = set()
            # Only the lower 232px of each cell contain the export's blue floor.
            # Blue crystal, mushrooms and cool stone above it are retained.
            for y in range(fy + 280, fy + 512):
                for x in range(fx, fx + 512):
                    r, g, b, a = px[x, y]
                    if a and r >= 130 and 10 <= b-r <= 65 and 5 <= g-r <= 50 and 0 <= b-g <= 28:
                        candidates.add((x, y))
            while candidates:
                first = min(candidates)
                candidates.remove(first)
                component, queue = [first], deque([first])
                while queue:
                    x, y = queue.popleft()
                    for point in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
                        if point in candidates:
                            candidates.remove(point)
                            component.append(point)
                            queue.append(point)
                # Small isolated subject highlights and interior cave floors survive.
                edge = any(x in (fx, fx+511) or y == fy+511 for x,y in component)
                if edge and len(component) >= 256:
                    removed.update(component)
                    components.append({'cell':[fx//512,fy//512],'pixels':len(component)})
    opaque = 0
    for point in sorted(removed):
        r,g,b,a = px[point]
        opaque += a == 255
        target[point] = r,g,b,0
    for y in range(1024):
        for x in range(1024):
            if (x,y) not in removed and target[x,y] != px[x,y]:
                raise AssertionError('Unselected subject pixels changed')
    return out, {'removedPixels':len(removed),'opaqueRemoved':opaque,'components':components}

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    image, stats = clean(Image.open(SOURCE))
    buffer = io.BytesIO()
    image.save(buffer, format='WEBP', lossless=True, exact=True, method=6)
    encoded = buffer.getvalue()
    if args.check:
        if OUTPUT.read_bytes() != encoded:
            raise SystemExit('Output does not match the reproducible cleanup; regenerate with the pinned Pillow version')
    else:
        OUTPUT.write_bytes(encoded)
    stats.update(sourceSha256=hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
                 outputSha256=hashlib.sha256(encoded).hexdigest(),pillow=pillow_version,
                 method='Border-connected pale blue lower-cell components >=256 pixels; alpha only, lossless WebP')
    print(json.dumps(stats, ensure_ascii=False, indent=2))
