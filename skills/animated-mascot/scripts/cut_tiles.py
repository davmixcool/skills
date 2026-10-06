"""Cut expression tiles out of a 4x2 (or any grid) mascot sheet.

Usage:
  python3 -I cut_tiles.py SHEET.png OUT_DIR name1,name2,... [--pick 0,1,...] [--size 320x345]

- Tiles are read left to right, top to bottom. --pick chooses which tile
  indexes to keep (default: the first len(names)). Names map to picked tiles in order.
- Writes OUT_DIR/tile-<name>.png (rounded, transparent corners),
  merges eye boxes and skin color into OUT_DIR/meta.json,
  and saves OUT_DIR/debug-<sheet>.png with the detected eye boxes drawn in red.
  Look at the debug image once and fix any box that grabbed a decoration
  (sparkle, sweat drop) by editing meta.json by hand.

The top-edge rule assumes light, bluish hair (blue > red). For other hair
colours, adjust find_top().
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw


def runs(v, min_len=50):
    out, s = [], None
    for i, x in enumerate(v):
        if x and s is None:
            s = i
        if not x and s is not None:
            out.append((s, i - 1))
            s = None
    if s is not None:
        out.append((s, len(v) - 1))
    return [r for r in out if r[1] - r[0] > min_len]


def find_top(col, y_start):
    tops = np.where(col[:, 2] - col[:, 0] > 3)[0]
    return y_start + int(tops[0]) if len(tops) else y_start + 4


def tiles(path, W, H):
    im = Image.open(path).convert("RGB")
    a = np.asarray(im).astype(int)
    bg = a[5, 5]
    m = np.abs(a - bg).sum(2) > 60
    out = []
    for (y0, y1) in runs(m.any(1)):
        for (x0, x1) in runs(m.any(0)):
            cx = (x0 + x1) // 2
            my = min((y0 + y1) // 2 + 40, a.shape[0] - 1)
            s = a[my, x0:x1 + 1].sum(1)
            xs = np.where(s < 600)[0]
            L = x0 + int(xs[0]) if len(xs) else x0
            ys0 = max(y0 - 4, 0)
            T = find_top(a[ys0:y1 + 1, cx], ys0)
            out.append(im.crop((L, T, L + W, T + H)))
    return out


def analyze(t, W, H):
    a = np.asarray(t).astype(int)
    ys, xs = np.mgrid[0:H, 0:W]
    inner = (xs > 14) & (xs < W - 14) & (ys < H - 12) & (ys > 0.6 * H)
    white = (a.min(2) > 238) & (np.abs(a[:, :, 0] - a[:, :, 2]) < 14) & inner
    dark = (a.sum(2) < 330) & inner
    eyes = []
    for half in (0, 1):
        hm = (xs < W / 2) if half == 0 else (xs >= W / 2)
        w = white & hm
        has = int(w.sum()) > 60
        if has:
            wy = np.where(w.any(1))[0]
            wx = np.where(w.any(0))[0]
            mm = (w | dark) & hm & (ys >= wy[0] - 18) & (ys <= wy[-1] + 6) & (xs >= wx[0] - 14) & (xs <= wx[-1] + 14)
        else:
            mm = dark & hm
        yy = np.where(mm.any(1))[0]
        xx = np.where(mm.any(0))[0]
        if len(yy) == 0:
            eyes.append([W // 8, int(H * 0.65), W // 2 - 20, H - 30, False] if half == 0 else [W // 2 + 20, int(H * 0.65), W - W // 8, H - 30, False])
        else:
            eyes.append([int(xx[0]), int(yy[0]), int(xx[-1]), int(yy[-1]), has])
    return {"eyes": eyes, "skin": [int(v) for v in a[H - 8, W // 2]]}


def main():
    if len(sys.argv) < 4:
        print(__doc__)
        sys.exit(1)
    sheet, out_dir, names = sys.argv[1], sys.argv[2], sys.argv[3].split(",")
    pick, W, H = None, 320, 345
    args = sys.argv[4:]
    for i, arg in enumerate(args):
        if arg == "--pick":
            pick = [int(v) for v in args[i + 1].split(",")]
        if arg == "--size":
            W, H = (int(v) for v in args[i + 1].split("x"))
    os.makedirs(out_dir, exist_ok=True)
    ts = tiles(sheet, W, H)
    print(f"found {len(ts)} tiles")
    pick = pick or list(range(len(names)))
    meta_path = os.path.join(out_dir, "meta.json")
    meta = json.load(open(meta_path)) if os.path.exists(meta_path) else {}

    mask = Image.new("L", (W * 4, H * 4), 0)
    ImageDraw.Draw(mask).rounded_rectangle((8, 8, (W - 3) * 4, (H - 3) * 4), radius=28 * 4, fill=255)
    mask = mask.resize((W, H), Image.LANCZOS)

    dbg = Image.new("RGB", (W * len(names), H), "white")
    for n, (name, idx) in enumerate(zip(names, pick)):
        t = ts[idx]
        meta[name] = analyze(t, W, H)
        tt = t.convert("RGBA")
        tt.putalpha(mask)
        tt.save(os.path.join(out_dir, f"tile-{name}.png"))
        d = t.copy()
        dr = ImageDraw.Draw(d)
        for e in meta[name]["eyes"]:
            dr.rectangle(e[:4], outline=(255, 0, 0), width=2)
        dbg.paste(d, (n * W, 0))

    if "_clip" not in meta:
        print("tip: add a '_clip': [x0, y0, x1, y1] box to meta.json for the accessory glow")
    json.dump(meta, open(meta_path, "w"), indent=1)
    dbg.save(os.path.join(out_dir, "debug-" + os.path.splitext(os.path.basename(sheet))[0] + ".png"))
    print("wrote", len(names), "tiles to", out_dir)


if __name__ == "__main__":
    main()
