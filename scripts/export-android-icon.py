from pathlib import Path
import argparse, hashlib, json
import cv2, numpy as np
from PIL import Image, ImageFilter, ImageDraw

root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(
    description="Export the retained Magnific art into Android icon resources; no network or generation."
)
parser.add_argument(
    "--write", action="store_true", help="Write Android resources and tracked previews"
)
args = parser.parse_args()
source = Image.open(root / "docs/resources-2026-11/assets/icone-source.png").convert(
    "RGB"
)
small = np.array(source.resize((1024, 1024), Image.Resampling.LANCZOS))
snake = [
    (0, 1),
    (0, 0.39),
    (0.02, 0.31),
    (0.09, 0.28),
    (0.15, 0.23),
    (0.18, 0.18),
    (0.23, 0.14),
    (0.28, 0.14),
    (0.31, 0.16),
    (0.38, 0.14),
    (0.42, 0.16),
    (0.45, 0.21),
    (0.45, 0.27),
    (0.45, 0.31),
    (0.41, 0.36),
    (0.34, 0.39),
    (0.29, 0.45),
    (0.29, 0.52),
    (0.32, 0.57),
    (0.38, 0.64),
    (0.43, 0.72),
    (0.48, 0.81),
    (0.48, 0.92),
    (0.46, 1),
]
hero = [
    (0.45, 0.35),
    (0.54, 0.04),
    (0.61, 0.04),
    (0.64, 0.17),
    (0.63, 0.22),
    (0.66, 0.14),
    (0.72, 0.06),
    (0.85, 0.05),
    (0.96, 0.08),
    (1, 0.14),
    (1, 0.32),
    (0.97, 0.40),
    (1, 0.64),
    (1, 1),
    (0.49, 1),
    (0.48, 0.94),
    (0.57, 0.88),
    (0.58, 0.73),
    (0.52, 0.68),
    (0.51, 0.57),
    (0.47, 0.52),
    (0.46, 0.43),
]
roi = np.zeros((1024, 1024), np.uint8)
for poly in [snake, hero]:
    cv2.fillPoly(
        roi,
        [np.array([(round(x * 1023), round(y * 1023)) for x, y in poly], np.int32)],
        1,
    )
mask = np.full((1024, 1024), cv2.GC_PR_BGD, np.uint8)
mask[roi == 1] = cv2.GC_PR_FGD
outer = cv2.dilate(roi, np.ones((29, 29), np.uint8))
mask[outer == 0] = cv2.GC_BGD
# The only near-white pixels connected to a source corner are its baked frame.
for x, y in [(0, 0), (1023, 0), (0, 1023), (1023, 1023)]:
    for yy in range(max(0, y - 50), min(1024, y + 51)):
        for xx in range(max(0, x - 50), min(1024, x + 51)):
            if small[yy, xx].min() > 242:
                mask[yy, xx] = cv2.GC_BGD
# Known material samples inside the retained figures, never their backdrop.
for x, y, r in [
    (0.22, 0.28, 0.035),
    (0.26, 0.21, 0.027),
    (0.36, 0.27, 0.04),
    (0.15, 0.49, 0.045),
    (0.29, 0.85, 0.06),
    (0.72, 0.30, 0.045),
    (0.81, 0.16, 0.04),
    (0.81, 0.53, 0.065),
    (0.67, 0.63, 0.035),
    (0.93, 0.66, 0.025),
    (0.72, 0.84, 0.035),
    (0.55, 0.21, 0.008),
    (0.51, 0.35, 0.007),
    (0.51, 0.41, 0.018),
    (0.87, 0.96, 0.025),
    (0.85, 0.83, 0.012),
]:
    cv2.circle(
        mask, (round(x * 1023), round(y * 1023)), round(r * 1024), cv2.GC_FGD, -1
    )
cv2.setRNGSeed(324)
cv2.grabCut(
    cv2.cvtColor(small, cv2.COLOR_RGB2BGR),
    mask,
    None,
    np.zeros((1, 65), np.float64),
    np.zeros((1, 65), np.float64),
    7,
    cv2.GC_INIT_WITH_MASK,
)
alpha = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype("uint8")
# Remove isolated background specks; preserve the detached sword/crystal if any.
n, labels, stats, centroids = cv2.connectedComponentsWithStats(alpha, 8)
for i in range(1, n):
    if stats[i, cv2.CC_STAT_AREA] < 180:
        alpha[labels == i] = 0
am = (
    Image.fromarray(alpha)
    .resize(source.size, Image.Resampling.LANCZOS)
    .filter(ImageFilter.GaussianBlur(0.6))
)
foreground = source.convert("RGBA")
foreground.putalpha(am)
out = root / "artifacts/icon-0324"
out.mkdir(parents=True, exist_ok=True)
foreground.save(out / "foreground-cutout.png")
background = "#214C3B"
canvas = Image.new("RGBA", (1080, 1080), background)
canvas.alpha_composite(
    foreground.resize((720, 720), Image.Resampling.LANCZOS), (180, 180)
)
canvas.save(out / "adaptive-composite.png")
for shape in ["circle", "rounded-square"]:
    visible = canvas.crop((180, 180, 900, 900))
    m = Image.new("L", (720, 720))
    d = ImageDraw.Draw(m)
    if shape == "circle":
        d.ellipse((0, 0, 719, 719), fill=255)
    else:
        d.rounded_rectangle((0, 0, 719, 719), radius=150, fill=255)
    visible.putalpha(m)
    preview = Image.new("RGBA", (800, 800), "#F7F4E7")
    preview.alpha_composite(visible, (40, 40))
    preview.save(out / (shape + ".png"))


if args.write:
    res = root / "android/app/src/main/res"
    tracked = root / "resources/android-icon"
    tracked.mkdir(parents=True, exist_ok=True)
    previews = root / "docs/captures-0.32.4"
    previews.mkdir(parents=True, exist_ok=True)
    foreground.save(tracked / "foreground-source.png")
    canvas.crop((180, 180, 900, 900)).resize((512, 512), Image.Resampling.LANCZOS).save(
        tracked / "icon-512.png"
    )
    outputs = []

    def save(image, path):
        path.parent.mkdir(parents=True, exist_ok=True)
        image.save(path)
        outputs.append(
            {
                "file": str(path.relative_to(root)),
                "size": list(image.size),
                "mode": image.mode,
                "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            }
        )

    for density, scale in [
        ("mdpi", 1),
        ("hdpi", 1.5),
        ("xhdpi", 2),
        ("xxhdpi", 3),
        ("xxxhdpi", 4),
    ]:
        folder = res / ("mipmap-" + density)
        size = round(108 * scale)
        layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        content = foreground.resize(
            (round(72 * scale), round(72 * scale)), Image.Resampling.LANCZOS
        )
        pad = (size - content.width) // 2
        layer.alpha_composite(content, (pad, pad))
        save(layer, folder / "ic_launcher_foreground.png")
        mono = Image.new("RGBA", layer.size, "white")
        mono.putalpha(layer.getchannel("A"))
        save(mono, folder / "ic_launcher_monochrome.png")
        # Legacy icon is the central72dp viewport, exactly as the default adaptive mask.
        legacy = canvas.crop((180, 180, 900, 900)).resize(
            (round(48 * scale), round(48 * scale)), Image.Resampling.LANCZOS
        )
        save(legacy, folder / "ic_launcher.png")
        circle = Image.new("L", legacy.size, 0)
        draw = ImageDraw.Draw(circle)
        draw.ellipse((0, 0, legacy.width - 1, legacy.height - 1), fill=255)
        rounded = legacy.copy()
        rounded.putalpha(circle)
        save(rounded, folder / "ic_launcher_round.png")
    color = res / "values/ic_launcher_background.xml"
    color.write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#214C3B</color>\n</resources>\n'
    )
    for api in [26, 33]:
        folder = res / f"mipmap-anydpi-v{api}"
        folder.mkdir(exist_ok=True)
        xml = '<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@color/ic_launcher_background"/>\n    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n'
        if api >= 33:
            xml += (
                '    <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>\n'
            )
        xml += "</adaptive-icon>\n"
        for name in ["ic_launcher", "ic_launcher_round"]:
            (folder / (name + ".xml")).write_text(xml)
    # The two starter vector drawables are unused by the manifest and adaptive XML.
    for rel in [
        "drawable-v24/ic_launcher_foreground.xml",
        "drawable/ic_launcher_background.xml",
    ]:
        old = res / rel
        if old.exists():
            old.unlink()
    for name in ["circle", "rounded-square"]:
        (previews / (name + ".png")).write_bytes((out / (name + ".png")).read_bytes())
    small_preview = canvas.crop((180, 180, 900, 900)).resize(
        (48, 48), Image.Resampling.LANCZOS
    )
    small_preview.resize((384, 384), Image.Resampling.NEAREST).save(
        previews / "launcher-48dp.png"
    )
    info = {
        "original": "docs/resources-2026-11/assets/icone-source.png",
        "sourceSha256": hashlib.sha256(
            (root / "docs/resources-2026-11/assets/icone-source.png").read_bytes()
        ).hexdigest(),
        "background": "#214C3B",
        "canvasDp": 108,
        "foregroundDp": 72,
        "offsetDp": 18,
        "safeZoneDiameterDp": 66,
        "method": "Local deterministic GrabCut cutout of existing pixels, fixed masks and RNG seed324, resampling and Android resource exports; no image generation, no remote call",
        "tools": {"opencv": cv2.__version__, "numpy": np.__version__},
        "outputs": outputs,
    }
    (tracked / "manifest.json").write_text(json.dumps(info, indent=2) + "\n")
    print(
        json.dumps(
            {
                "resources": len(outputs),
                "background": background,
                "sourceUnmodified": info["sourceSha256"],
                "previewFolder": str(previews),
            }
        )
    )
else:
    print(
        "Prepared local cutout and mask previews only. Use --write to export Android resources."
    )
