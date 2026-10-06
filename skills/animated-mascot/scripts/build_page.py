"""Build the animated reactions page from cut tiles.

Usage:
  python3 -I build_page.py TILES_DIR OUT.html --name Boost --brand BoostGPT

Reads TILES_DIR/meta.json and every TILES_DIR/tile-<name>.png, plus an
optional TILES_DIR/shades.png prop sprite (with meta "_shades": [x0,y0,x1,y1]),
and fills templates/reactions-page.html.

Every key in the template's STATES object must have a tile-<key>.png.
Edit STATES in the template (names, product-moment lines, blink, glow, fx)
to match your reactions before building.
"""
import base64
import io
import json
import os
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE = os.path.join(HERE, "..", "templates", "reactions-page.html")


def uri(path):
    buf = io.BytesIO()
    Image.open(path).save(buf, "WEBP", lossless=True)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    tiles_dir, out = sys.argv[1], sys.argv[2]
    name, brand = "Mascot", "Brand"
    args = sys.argv[3:]
    for i, a in enumerate(args):
        if a == "--name":
            name = args[i + 1]
        if a == "--brand":
            brand = args[i + 1]
    meta = json.load(open(os.path.join(tiles_dir, "meta.json")))
    img = {}
    for f in sorted(os.listdir(tiles_dir)):
        if f.startswith("tile-") and f.endswith(".png"):
            img[f[5:-4]] = uri(os.path.join(tiles_dir, f))
    shades = os.path.join(tiles_dir, "shades.png")
    if os.path.exists(shades):
        img["shades"] = uri(shades)
    meta.setdefault("_clip", [0, 0, 0, 0])
    meta.setdefault("_shades", [0, 0, 0, 0])
    page = open(TEMPLATE).read()
    page = page.replace("__ASSETS__", json.dumps({"img": img, "meta": meta}))
    page = page.replace("__NAME__", name).replace("__BRAND__", brand)
    open(out, "w").write(page)
    print("wrote", out, f"({len(page) // 1024} KB, {len(img)} images)")


if __name__ == "__main__":
    main()
