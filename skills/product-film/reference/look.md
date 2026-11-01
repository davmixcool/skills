# The look

What makes these films read as premium rather than as a screen recording. Everything here is
already wired into `templates/film/src/film.js`; this is what to keep, and why, when shots change.

## The frame

- **16:9, 1920×1080, 30 fps by default; any frame with `?size=`.** One WebGL canvas,
  `renderer.setPixelRatio(1)`: the export screenshots exactly the frame, and a higher ratio only
  costs time. Every frame keeps the height (1080), so type keeps its size and a wider frame shows
  more at the sides. Social posts: lay out in the square (1080×1080) first, then check 11:9
  (1320×1080), 1.43:1 (1548×1080) and 16:9. Vertical is the square on a card
  (made outside the film).
- **Every frame is a pure function of `t`.** `renderFrame(t)` sets every position, opacity and
  repaint from `t` alone. No `requestAnimationFrame` state, no `Date.now()`, no `Math.random()`
  (use `seeded()`), no tweens that carry state between frames. That is what makes the export
  exact, the preview scrubbable, and any frame renderable alone (stills, posters).
- **The camera never stops.** Every shot has a slow push (`z - local * 0.1`) or drift
  (`Math.sin(local * 0.12)`) on top of its main move. A still camera reads as a slideshow.

## Depth

- **Glass slabs** (`slab()`): the product's drawn UI on the face of a rounded glass body with a
  clear coat, and a faded reflection on an invisible floor. The product always sits on one.
  - Give `slab()` the face's own corner radius (the drawing's radius × the slab's width ÷ the
    drawing's width). The body is an extruded rounded rectangle for this reason: a rounded box
    can only be as round as it is thin, and its square-ish corners poked out behind a window
    with rounder ones.
  - For a white window, colour the body the window's own light grey (`body`), so its edge reads
    as the window's thickness. A dark body showed as a rim, and as a dark strip along the top
    edge when seen from just above.
- **Depth of field** (`BokehPass`): focus on what the voice is talking about
  (`focus = depthOf(thing.position)`), aperture 0.0005–0.0012. Background things blur; that is
  most of the 3D feel. While one big white panel fills the shot, turn the pass off
  (`bokeh.enabled = false`): it drew a dark strip along the panel's top edge.
- **Dust** (`dust()`): a few hundred specks of soft light drifting in depth in each shot.
  Additive in dark, normal blending and grey in light.
- **Grounds**: a soft radial gradient per mood (`GROUNDS.night`, `violet`, `dawn`). Change the
  ground on a cut, not mid-shot.
- **Bloom**: low (0.4 dark, 0.12 light). It should lift highlights, not haze the frame.

## Finish

A vignette and a dither of ±0.5/255 against banding. No colour fringe (chromatic aberration):
near the frame's sides it split white windows' edges into a red and blue rim.

**No grain, no noise, no scanlines.** Grain reads as TV static on a phone, and x264 spends its
bits encoding it: one film went from ~30 MB to 944 MB with grain at CRF. The dither is invisible
and costs nothing.

## The product, drawn

- Draw the UI on canvases (`src/draw.js`), never screenshots. A drawing stays sharp at any
  size and angle, animates from a `k` (0→1), and has a light and a dark palette (`setMode`).
- Draw it faithfully: the product's real words, layout, colours and icons. Read the product's
  components to get them right. A drawn UI that differs from the real one is a false claim.
- Draw at 2–2.5× the size it appears on screen (a window canvas of 2400×1500 for a slab that
  fills half the frame), and set `anisotropy` (done in `tex()`): angled text stays crisp.
- Repaint only when `k` moves (quantise it: `Math.round(k * 600) / 600`), and only the canvas
  that changed. Canvas uploads are the slow part of a frame.
- Wait for fonts before the first paint (`document.fonts.load`): a canvas painted earlier keeps
  the fallback font for good.
- Real environments (a browser's start page, an OS) are drawn too, from a reference screenshot
  the person provides: the same layout and colours, nothing invented.

## Words

- A DOM layer over the canvas (`#words`), so type is sharp and uses the real web font.
- Few words, big: `.xl` 112px, `.lg` 80px, `.md` 44px. One idea on screen at a time.
- In from a blur and a small rise (0.55 s), out quicker. Timed to the voice's words when there
  is a voice; on the beat when there isn't.
- Gradient type (`.grad`) needs `padding-bottom: .18em; margin-bottom: -.18em`, or descenders
  (g, y, p) are cut off by the background clip.
- Words beside the product sit left over a soft wash (`#scrim`), with the product to the right;
  check no word overlaps the slab at its closest point in the shot.
- No glows, coloured blobs or gradients behind text or cards: they look cheap. Light the object
  itself instead (a badge that lights up). No halo behind the product either, unless asked: the
  template has none.
- In a square frame the words sit above the product: keep that band clear. Move background
  things (drifting cards, dust clusters) out of it, rather than checking frame by frame.
- The product's own words and shortcuts can be type too: keycaps (`⌥ D`) under a closing line.

## Light and dark

Both, always, from one film: `?theme=light` swaps the grounds, the slab material, the bloom and
vignette strength, the dust blending, the DOM colours (`body.light`) and the drawings' palette.
Check both at the same moments before exporting either.

## Drawn UI

- Shadows on drawn cards and notifications: faint and tight (about 14% black, a short blur, a
  small drop), as macOS draws them. A heavy, spread shadow read as fake. Stack them close, as
  real notifications stack.
- Repaint a canvas only when its state changes: key it on the state (`count:hover:sent`), and
  quantise animated values (to 1/20).

## Shots that work

- **Open**: the problem, physical. Cards (tabs, files, messages: whatever the product tames)
  drifting in depth, or a ribbon of them; the headline over it. It dims or tangles on the
  problem's words, and clears on the promise.
- **Product moments**: one slab per feature, its moment (`k` 0→1) landing on the word that
  names it. Swing between slabs on an arc (`inOutQuint` over ~1.4 s) rather than cutting when
  they are the same kind of thing.
- **Close-up**: one panel large, turned ~20°, one interaction played out.
- **Payoff**: everything at once, wide.
- **End**: the wordmark and the tagline. Nothing after it: no call to action, no URL, no
  "available now", no price, unless the person asks for one.
- **End without a name** (an idea not out yet): a line that answers the opening one ("Your
  downloads, everywhere." → "Every file, one shortcut away."), over the product's central
  moment, with the shortcut as keycaps. A question tacked on ("Would you use this?") read as
  tacked on. Land it on the track's last bar line and let the music ring out under it.
- **Loop** (a social clip): the last shot eases the camera and objects onto the opening shot's
  path, run just before 0 (`t − DURATION`), so the last frame meets the first.
