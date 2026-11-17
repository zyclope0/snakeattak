"""Small pictures of the website, cut from the application icon. No generator, no cost.

The icon of 512 px stays the picture shared on social networks; a browser tab, an iPhone home
screen and the top of each public page only need a few kilobytes.

Usage, from the root of the repository:
    python3 scripts/export-site-icons.py
"""
from pathlib import Path
from PIL import Image

SOURCE = Path("resources/android-icon/icon-512.png")
OUT = Path("resources/site")
OUT.mkdir(parents=True, exist_ok=True)
icon = Image.open(SOURCE).convert("RGBA")


def resized(size: int) -> Image.Image:
    return icon.resize((size, size), Image.LANCZOS)


# The hero of the public pages: the same picture, far lighter than the PNG.
icon.save(OUT / "hero-512.webp", "WEBP", quality=82, method=6)
# The logo beside the title is shown at 48 px: 96 px for sharp screens.
resized(96).save(OUT / "logo-96.png", optimize=True)
# Browser tab, then the home screen of a phone (an iPhone wants no transparency).
resized(48).save(OUT / "icon-48.png", optimize=True)
resized(180).convert("RGB").save(OUT / "touch-180.png", optimize=True)
# `/favicon.ico` is asked for by every browser on a page that names no icon.
icon.save(OUT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
for path in sorted(OUT.iterdir()):
    print(path, path.stat().st_size)
