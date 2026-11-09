"""Technical WebP exports of supplied originals; no retouch or generation.
Run with Python3 + Pillow; originals remain byte-for-byte unchanged.
"""
from pathlib import Path
from PIL import Image, ImageOps
import hashlib
import json

root = Path(__file__).resolve().parents[1]
exports = []
for source_name, exported in [('terrain-crue', 'scenery-flood'), ('terrain-marais', 'scenery-marsh')]:
    source = root / 'docs/resources-2026-11/assets' / (source_name + '.png')
    target = root / 'src/assets/illustrated' / (exported + '.webp')
    original = source.read_bytes()
    with Image.open(source) as image:
        # Centre crop only: native ratio1.75 -> display16:9; no painted changes.
        output = ImageOps.fit(image.convert('RGB'), (1600, 900), method=Image.Resampling.LANCZOS)
        output.save(target, 'WEBP', quality=88, method=6)
    assert original == source.read_bytes()
    exports.append({
        'source': str(source.relative_to(root)),
        'sourceSha256': hashlib.sha256(original).hexdigest(),
        'export': str(target.relative_to(root)),
        'exportSha256': hashlib.sha256(target.read_bytes()).hexdigest(),
        'bytes': target.stat().st_size,
        'dimensions': [1600, 900],
        'operation': 'centre crop, Lanczos resize, WebP quality88 method6; no retouch',
    })
manifest = {'version': '0.34.0', 'provenance': 'docs/resources-2026-11/PROVENANCE.md', 'usage': 'peripheral scenery only; quiet sculpted ground and original geometry retained', 'exports': exports}
(root / 'resources/scenery/manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps({'exports': [{'file': e['export'], 'bytes': e['bytes']} for e in exports]}))
