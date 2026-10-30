# Stills: store images, posters, social cards

Once a film exists, its frames are the best source for every still image around the product.
They give one look across the film, the store listing, the landing page's poster and the
launch posts. `tools/stills.mjs` renders frames without words (`?clean`) and lays each image
out at its exact size, with one headline in the film's type, in each theme. Everything is
described in `stills.json`.

## Pick the frames

- Render candidates first: `node tools/export.mjs --theme light --clean --stills 8,16.8,41`,
  then look at them.
- Pick moments where the product's state says the feature: the tabs already in groups, the
  dialog with its result showing, the item mid-flight. A shot that only works in motion (a
  half-swing between slabs) makes a poor still.
- When a still needs a state the film only passes through, add a URL flag the film reads (e.g.
  `?still=bin` freezes an object mid-move) and pass it as `query` on that frame.
- Mix in real captures where a screen should be the real thing, such as a settings page or an
  editor. Capture them at 2× (with Playwright, use a CDP `Page.captureScreenshot` session, since
  `deviceScaleFactor` alone can still give 1× on some setups). Use `real: { src, width }`.

## Layouts

- `side`: the headline and a line on the left, over the film's wash; the product on the right.
  Use it for feature screenshots.
- `top`: the headline centred above a contained frame. Use it for an overview.
- `hero`: the wordmark, the tagline and a foot line. Use it for a hero image or poster.
- `poster`: the wordmark, a title and a line, over a cover frame.
- `brand`: the wordmark only, with a strong wash. Use it for small promo tiles, where anything
  more is unreadable.

`fit: "contain"` shows the whole frame sharp, faded at its edges into the end shot's ground.
Use it when cropping would cut the subject. The default cover crop keeps the edge given by `x`.

## Sizes

| Where | Size |
| --- | --- |
| Chrome Web Store screenshots | 1280×800 (up to 5) |
| Chrome Web Store small promo tile | 440×280 |
| Chrome Web Store marquee | 1400×560 |
| Mac App Store screenshots | 2880×1800 or 1440×900 |
| AppSumo, Product Hunt gallery | 1920×1080 (PH also 1270×760) |
| Video poster | the film's size, 1920×1080 |
| Open Graph / X card | 1200×630 |

Check the store's current requirements before a submission. Sizes change.

## Words on stills

- One idea per image, in the film's words and the store listing's words. Don't write new
  marketing copy for the stills.
- A headline of 2–4 short lines, and one supporting line.
- Never claim what the product doesn't do. The drawn UI in a frame must match the real product.

## Posters

Make 2–3 options in both themes and let the person pick. A poster with just one sentence
floating on a frame reads as awkward. Use the wordmark plus the tagline over the product (or
the end shot's objects), with a foot line saying what the video is ("A minute with X, in …").
