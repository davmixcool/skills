# Config reference

```jsonc
{
  "name": "SaaSgate",              // required — wordmark text in lockups
  "shortName": "SaaSgate",         // manifest short_name        (default: name)
  "tagline": "Your gateway…",      // sits under the banner lockup
  "headline": "Line one\nLine two",// OG card headline; \n becomes <br>
  "blurb": "From idea to …",       // OG card subline + manifest description
  "domain": "saasgate.xyz",        // printed bottom-right of the OG card

  "colors": {
    "ink":    "#0a0a0d",           // dark ground, and the dark half of the mark
    "accent": "#f0263f",           // brand colour — constant on every ground
    "light":  "#ffffff",           // light ground, and the light half
    "muted":  "#a4a4ae",           // secondary copy
    "onDark": "#f2f2f4"            // primary copy on dark
  },

  "font": { "family": "Inter", "weight": 600 },   // loaded from Google Fonts

  "inset": 0.9,                    // fraction of the tile the mark fills
  "cornerRadius": 0.22,            // tile corner radius, as a fraction of size

  "mark":      { "viewBox": "0 0 200 200", "primary": ["…"], "accent": ["…"] },
  "markSmall": { "viewBox": "0 0 200 200", "primary": ["…"], "accent": ["…"] }
}
```

Only `name` and `mark.primary` are required.

## Splitting the mark

`primary` and `accent` are **roles, not sides**.

- `primary` paths flip colour with the ground: `light` on dark tiles, `ink` on
  light tiles. This is what makes one config produce both a dark and a light
  lockup that each read correctly.
- `accent` paths are always the brand colour, on every ground.

A single-colour mark: put every path in `primary`, omit `accent`. It then
renders as a solid silhouette that inverts correctly, which is usually what
you want.

## `inset` and `cornerRadius`

`inset` is how much of the tile the mark occupies. Artwork drawn with its own
clear space inside the viewBox wants a high value (0.9); artwork drawn edge to
edge wants ~0.6, or it will look cramped.

Check `avatar-1024.png` after the first run and adjust — this is the one field
you will almost always need to tune.

`cornerRadius` is a fraction of the tile's width. 0.22 approximates the iOS
squircle. Use 0 for hard squares.

## `markSmall`

Used for the 16px favicon and the apple-touch icon. Give it the outermost
shapes only — anything with interior detail turns to mush at 16px.

Omit it and `mark` is used at every size; fine for genuinely simple marks,
but look at `favicon-16x16.png` before deciding it was fine.

## Outputs

| File | Purpose |
|---|---|
| `avatar-1024.png` | Social profile picture, rounded |
| `avatar-square-1024.png` | Same, hard edges — for platforms that circle-crop |
| `avatar-light-1024.png` / `-square-` | Light-ground inverses |
| `mark-duo-dark-1024.png` | Two-tone mark, transparent, for dark grounds |
| `mark-duo-light-1024.png` | Two-tone mark, transparent, for light grounds |
| `mark-light/accent/ink-1024.png` | Single-colour marks, transparent |
| `lockup-dark-2400.png` | Mark + wordmark, transparent, for dark grounds |
| `lockup-light-2400.png` | Same, for light grounds |
| `favicon-16/32/48.png`, `favicon.ico` | Browser tabs and Google Search |
| `favicon.svg` | Vector tab icon — built from `markSmall`, like the 16px raster |
| `apple-touch-icon.png` | 180×180, iOS home screen |
| `android-chrome-192/512.png` | PWA / Android |
| `social-banner-1500x500.png` | X/Twitter header |
| `og-1200x630.png` | Link preview (placed as `og.png` in `--public`) |
