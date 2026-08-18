---
name: web-brand
description: Generate a complete brand asset kit — favicons (including a real .ico), apple-touch and Android PWA icons, social avatars, lockups, an X/Twitter banner, and an OG link-preview card — from a single SVG mark plus a colour config, and wire the matching <head> tags, web manifest and JSON-LD into a site. Use when asked to create favicons, a favicon.ico, app icons, an OG image, social profile images, a brand kit, or to fix missing-favicon / missing-image-dimensions / missing-manifest SEO warnings.
---

# WebBrand

Rasterise every brand asset from one vector mark, so there is no binary master
to keep in sync. Change the geometry or a colour, re-run, and all sizes rebuild.

## When to use this

- "make me a favicon" / "generate app icons" / "I need an OG image"
- "create a brand kit" / "social profile picture" / "Twitter header"
- An SEO audit flags: no `.ico` or PNG favicon, missing `og:image:width/height`,
  missing web app manifest, missing `og:image:alt`.

## Workflow

### 1. Get the mark as SVG paths

You need the artwork as `<path d="…">` strings plus a viewBox. If the user
supplies an SVG, lift the paths directly — **do not redraw it**, and do not
trace someone else's logo and recolour it (that is a trademark problem, not a
technicality; say so plainly and offer to design an original in the same
visual vocabulary).

Split the paths into two groups:

- `primary` — the part that flips between light and dark grounds
- `accent` — the part that stays the brand colour on every ground

A single-colour mark just puts everything in `primary` and omits `accent`.

### 2. Write the config

Copy `example/brand.config.json` and edit. Field reference:
`reference/config.md`. The example is a real, working config — run it to see
the output shape before adapting.

**`markSmall` matters.** Below roughly 24px, fine interior detail fills in and
the mark turns to mush. Provide a reduced cut — usually the outermost shapes
only — and it will be used for the 16px favicon and the apple-touch icon.
Always check the 16px output rather than assuming it survived.

### 3. Run it

`puppeteer-core` is not bundled. Install it in the directory you run from —
the script looks there as well as beside itself, so it does not need to live
in the skill folder:

```sh
npm i puppeteer-core
node ~/.claude/skills/web-brand/scripts/generate.mjs \
  --config brand.config.json \
  --out ./brand \
  --public ./public
```

From a clone of the repo, the path is `skills/web-brand/scripts/generate.mjs`.

- `--out` gets the full kit
- `--public` (optional) additionally places the web-facing files —
  favicons, `favicon.ico`, `favicon.svg`, apple-touch, android-chrome,
  `og.png` — and writes `site.webmanifest`
- `--only <substr>` re-renders just matching assets while iterating
- `--chrome <path>` if Chrome is somewhere unusual. Common macOS and Linux
  install paths are probed automatically, as is `$CHROME_PATH`.

Node 20+. On machines where the default `node` is older, point at a newer one
first (`export PATH="$HOME/.nvm/versions/node/vXX/bin:$PATH"`).

### 4. Wire up the page

Copy the `<head>` block from `reference/head-tags.md`, substituting the real
domain and description. It covers the icon links, Open Graph with explicit
image dimensions, Twitter Card, the manifest link and Organization JSON-LD.

Then add cache headers for the new files — they are fetched by crawlers often
and change rarely. A `_headers` snippet is in the same reference.

### 5. Verify, don't assume

Serve the site and check:

- every icon path returns 200 with the right content type
- `favicon.ico` parses: type 1, N entries, PNG magic at each offset
- `site.webmanifest` parses and is served as `application/manifest+json`
- the JSON-LD parses
- `meta description` and `og:description` both land in 110–160 characters

There is a ready-made check script in `reference/verify.md`.

## Things that will bite you

**`setContent` + `networkidle0` hangs** when the page links a webfont
stylesheet. The generator writes a temp HTML file and navigates to it instead.
Keep that shape if you extend it.

**Google Search ignores SVG favicons.** An SVG-only favicon means no icon in
search results. The `.ico` is not optional. Both ship: `favicon.svg` for crisp
modern tabs, `favicon.ico` for Search.

**The wordmark needs the network.** The font is pulled from Google Fonts at
render time. Offline, the page silently falls back to `system-ui` and the
lockups, banner and OG card come out in the wrong face — the run *succeeds*,
which is what makes it easy to miss. Check `lockup-dark-2400.png` if you are
not sure. On claude.ai, allow `fonts.googleapis.com` and `fonts.gstatic.com`
at `claude.ai/settings/capabilities`.

**ICO needs no image library.** The container has allowed embedded PNG data
since Vista, so the generator packs PNGs verbatim — no ImageMagick, no PIL.
This matters because neither is reliably installed.

**Transparent corners.** Rounded tiles are screenshotted with
`omitBackground` only for assets marked `transparent`. Avatars are opaque on
purpose: platforms that circle-crop need real pixels behind the rounding, and
a transparent-cornered avatar shows the platform's background through.

**Square *and* rounded avatars.** X and LinkedIn circle-crop and would clip a
rounded tile's corners; use the square file there. Both are generated.

**Cache-busting.** If the site links `styles.css?v=N`, bump N when the mark
changes size — icons are new files, but CSS is cached.

## Files

| Path | What |
|---|---|
| `scripts/generate.mjs` | The generator. Config-driven, includes the ICO packer. |
| `example/brand.config.json` | Working config — a real two-tone hexagonal mark. |
| `reference/config.md` | Every config field, defaults, and the mark-splitting rule. |
| `reference/head-tags.md` | `<head>` block, `_headers` snippet, JSON-LD. |
| `reference/verify.md` | Post-generation check script. |
