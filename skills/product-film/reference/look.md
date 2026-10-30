# The look

What makes these films read as premium rather than as a screen recording. Everything here is
already wired into `templates/film/src/film.js`; this is what to keep, and why, when shots change.

## The frame

- **16:9, 1920×1080, 30 fps.** One WebGL canvas, `renderer.setPixelRatio(1)`: the export
  screenshots exactly 1920×1080, and a higher ratio only costs time.
- **Every frame is a pure function of `t`.** `renderFrame(t)` sets every position, opacity and
  repaint from `t` alone. No `requestAnimationFrame` state, no `Date.now()`, no `Math.random()`
  (use `seeded()`), no tweens that carry state between frames. That is what makes the export
  exact, the preview scrubbable, and any frame renderable alone (stills, posters).
- **The camera never stops.** Every shot has a slow push (`z - local * 0.1`) or drift
  (`Math.sin(local * 0.12)`) on top of its main move. A still camera reads as a slideshow.

## Depth

- **Glass slabs** (`slab()`): the product's drawn UI on the face of a rounded box with a clear
  coat, and a faded reflection on an invisible floor. The product always sits on one.
- **Depth of field** (`BokehPass`): focus on what the voice is talking about
  (`focus = depthOf(thing.position)`), aperture 0.0005–0.0012. Background things blur; that is
  most of the 3D feel.
- **Dust** (`dust()`): a few hundred specks of soft light drifting in depth in each shot.
  Additive in dark, normal blending and grey in light.
- **Grounds**: a soft radial gradient per mood (`GROUNDS.night`, `violet`, `dawn`). Change the
  ground on a cut, not mid-shot.
- **Bloom**: low (0.4 dark, 0.12 light). It should lift highlights, not haze the frame.

## Finish

A vignette, the faintest colour fringe at the edges, and a dither of ±0.5/255 against banding.

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
  itself instead (a badge that lights up, a halo behind a slab).

## Light and dark

Both, always, from one film: `?theme=light` swaps the grounds, the slab material, the bloom and
vignette strength, the dust blending, the DOM colours (`body.light`) and the drawings' palette.
Check both at the same moments before exporting either.

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
