# Verify

Run against a served site — not the filesystem, so content types and `_headers`
are exercised too. Set `BASE` to the dev or production origin.

```bash
BASE=${BASE:-http://127.0.0.1:8787} python3 - <<'PY'
import json, os, re, struct, urllib.request

base = os.environ.get("BASE", "http://127.0.0.1:8787").rstrip("/")
ok = fail = 0

def check(label, passed, detail=""):
    global ok, fail
    ok, fail = ok + bool(passed), fail + (not passed)
    print(f"  {'ok  ' if passed else 'FAIL'} {label}{'  ' + detail if detail else ''}")

def get(path):
    with urllib.request.urlopen(base + path) as r:
        return r.status, r.headers.get("content-type", ""), r.read()

print("assets")
expect = {
    "/favicon.ico": "image", "/favicon.svg": "svg",
    "/favicon-16x16.png": "png", "/favicon-32x32.png": "png",
    "/apple-touch-icon.png": "png",
    "/android-chrome-192x192.png": "png", "/android-chrome-512x512.png": "png",
    "/site.webmanifest": "manifest", "/og.png": "png",
}
blobs = {}
for path, kind in expect.items():
    try:
        status, ctype, body = get(path)
        blobs[path] = body
        check(path, status == 200 and kind in ctype, f"{status} {ctype}")
    except Exception as e:
        check(path, False, str(e)[:60])

print("\nfavicon.ico")
try:
    d = blobs["/favicon.ico"]
    _, typ, cnt = struct.unpack("<HHH", d[:6])
    check("container", typ == 1 and cnt >= 1, f"type={typ} images={cnt}")
    for i in range(cnt):
        w, h, *_, size, off = struct.unpack("<BBBBHHII", d[6 + 16 * i : 22 + 16 * i])
        magic = d[off : off + 8] == b"\x89PNG\r\n\x1a\n"
        check(f"  entry {w or 256}x{h or 256}", magic and off + size <= len(d))
except Exception as e:
    check("parse", False, str(e)[:60])

print("\nmanifest")
try:
    m = json.loads(blobs["/site.webmanifest"])
    check("parses", True, f"{m.get('name')} · {len(m.get('icons', []))} icons")
    check("has 512px icon", any(i.get("sizes") == "512x512" for i in m.get("icons", [])))
except Exception as e:
    check("parses", False, str(e)[:60])

print("\nhead")
try:
    html = get("/")[2].decode("utf-8", "replace")
except Exception as e:
    check("fetch /", False, str(e)[:60])
    print(f"\n{ok} passed, {fail} failed  — is the server up at "
          f"{base}? try BASE=http://localhost:PORT")
    raise SystemExit(1)

for tag in ["og:image:width", "og:image:height", "og:image:alt", "og:locale",
            'rel="manifest"', 'href="/favicon.ico"']:
    check(tag, tag in html)

for label, pat, lo, hi in [
    ("meta description", r'name="description" content="([^"]*)"', 110, 160),
    ("og:description",   r'property="og:description" content="([^"]*)"', 110, 160),
    ("title",            r"<title>([^<]*)</title>", 10, 60),
]:
    m = re.search(pat, html)
    n = len(m.group(1)) if m else 0
    check(f"{label} length", m and lo <= n <= hi, f"{n} chars (want {lo}-{hi})")

print("\njson-ld")
for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
    try:
        d = json.loads(block)
        types = [n.get("@type") for n in d.get("@graph", [d])]
        check("parses", True, str(types))
    except Exception as e:
        check("parses", False, str(e)[:60])

print(f"\n{ok} passed, {fail} failed")
raise SystemExit(1 if fail else 0)
PY
```

## Eyeball these too

Automated checks can't tell you the mark is legible.

- **`favicon-16x16.png` at actual size.** Blow it up and look. If the interior
  has filled in, `markSmall` needs to be simpler.
- **`avatar-1024.png`** — is the mark cramped or swimming? Adjust `inset`.
- **`lockup-light-2400.png` on white.** Two-tone marks that work on black often
  go muddy on white when both halves are close in value.
