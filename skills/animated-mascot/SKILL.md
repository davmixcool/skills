---
name: "animated-mascot"
description: "Design a brand mascot, generate a consistent pixel-art expression sheet with an AI image model, cut the tiles, and animate the reactions smoothly in plain JavaScript as a shareable page. Use when asked to create a mascot or character for a product, give a brand a face, make an expression or reaction sheet, add expressions to an approved sheet, or animate an existing character sheet. Not for redrawing a character procedurally, AI video generation, or copying another brand's mascot."
---

# Animated mascot: from idea to moving character

Use this when someone wants a mascot or character for a product, wants expression or reaction sheets, or wants an existing character sheet animated.

The workflow has six stages. Move fast through the early ones, and ask before redoing anything expensive.

## Requirements

- **An image-generation model** for stage 3. Without one, the person generates the sheet elsewhere and attaches it; stages 4–6 still work.
- **Python 3 with Pillow and numpy** for the scripts in stages 4–5. Install them in a virtual environment, not with `pip install --user`: the scripts run under `python3 -I`, and `-I` ignores the user site-packages folder, so a `--user` install stays invisible and the import still fails. Inside a venv, `-I` works normally:
  ```bash
  python3 -m venv .venv && .venv/bin/pip install pillow numpy
  ```
- **A headless browser** for the one-look check in stage 6.

## 1. Ground the mascot in the brand

Before drawing anything:
- Read any brand, voice, positioning or GTM docs the person shares. Check whether they warn against mascots or set a tone such as calm, capable or "not a chatbot". The character has to fit that voice.
- Point out the usual gaps in one short reply:
  - **Name collisions:** a nickname that competes with the product name.
  - **Pronouns:** the character's pronouns must match the copy everywhere.
  - **Where it appears:** inside the product, or also on surfaces customers' own visitors see.
  - **Small sizes:** it has to read at 16px.
  - **Trademark:** check the name before investing in it.
- Tie every expression to a real product moment, for example "noticed something", "working", "ready for review", "not enough evidence" or "error". Expressions that are only decorative get cut.
- Check current events if the person cites rival mascots, and give the honest trade-offs, including any backlash.

## 2. Explore directions quickly (optional)

If the person hasn't picked a look, show two or three original directions side by side on a Design canvas or a simple page: an abstract mark, a minimal face and a character. Show each one large, at 96/48/24/16px, and as an avatar. Keep this fast. Its job is to find a direction, not to finish one.

## 3. Generate the character with an image model

The person often brings reference images for a style. Treat them as inspiration only: match the feel, such as a cropped face filling an app-icon tile, chunky pixels and big expressive eyes. Never copy the reference character's distinctive features, like the same glasses or hair; give the mascot its own signature detail instead, such as a colored hair clip that echoes a brand mark.

Write every prompt for a **4×2 expression sheet** on one plain background, eight rounded-square tiles evenly spaced. Repeat the full character description in every prompt:
- **Hair:** color, shape and coverage. If they want hair on top only, say "hair sits ONLY on top of her head... does NOT come down the sides of her face; below the fringe the tile is entirely face out to both edges."
- **Signature accessory:** what it is and where it sits.
- **Face:** skin tone, eye style and brows.
- **Crop:** for example "cropped just below the eyes, no mouth".
- **Rendering:** "crisp hard pixel edges, flat colors, no text, no labels, no watermark".
- **Expressions:** list them in grid order (top row left to right, then bottom row).

Iterate cheaply:
- **Colors:** generate a variation sheet that shows the same face in six hair colors. Point out contrast against the accessory and how well each holds up at small sizes.
- **Models:** if more than one image model is available, try both once and let the person choose. Then stick with their choice.
- **Femininity:** don't add hair down the sides just to make a character read as female. Ask first, or follow the reference.

To add expressions later, **edit the approved sheet**: pass the approved sheet's URL as the reference image and ask to "keep the exact same character, art style, tile size, background and 4×2 layout... replace the expressions with...". That keeps the character consistent across sheets. If you need fewer than eight, alternate the new expressions to fill the grid and let the person pick the best version of each.

If generated images are hosted somewhere your workspace can't fetch, say so plainly. Give the person the links and ask them to attach the sheets to the chat. Never describe an image you couldn't open as if you had seen it.

Good reaction set, each with its product moment:

| Reaction | Moment |
|---|---|
| calm | nothing needs you |
| curious | noticed something |
| excited | found an opportunity |
| focused | working |
| happy | improvement ready |
| cool (sunglasses) | published |
| attentive | waiting on review |
| unsure | not enough evidence |
| hello (wink) | onboarding |
| thinking | analyzing |
| surprised | traffic spike |
| listening | live chat |
| concerned | contradiction found |
| oops (sweat drop) | error |
| proud | a change worked |
| determined | launch day |
| celebrating (confetti) | milestone |
| sleepy | no activity |

## 4. Cut the tiles from the sheet

Once the person attaches the approved sheet, copy it into its own working folder and run the scripts with the venv's Python and `-I` (see Requirements).

1. **Find the tiles.** Sample the background at (5,5). Mark pixels whose summed RGB distance from it is over 60. Take runs longer than 50px along the rows and along the columns; their intersections are the tiles.
2. **Measure exact edges.** Left edge: the first x at mid-height whose RGB sum is under 600. Top edge: the first y in the center column where blue is more than red + 3 (this suits light, bluish hair; adjust it for other hair colors). Bottom edge: the last skin-colored pixel in the center column.
3. **Crop and mask.** Crop every tile to one fixed size (about 320×345 for a 1536×1024 sheet), so frames never jitter. Apply a rounded-rectangle alpha mask inset about 2px, which removes the sheet's background edge.
4. **Detect each tile's eyes.** Search below 60% of the tile height, at least 14px from the edges. Find white pixels (min channel over 238, near-neutral) together with dark pixels (RGB sum under 330), separately for the left and right halves. Closed eyes have no white, so use the dark pixels alone.
5. **Sample the skin color** at (W/2, H−8).
6. **Check the detection once.** Draw the boxes on a debug sheet and view it. Fix by hand any box that grabbed a decoration, such as a sparkle or sweat drop.
7. **Pull overlays into their own layers.** Extract animatable props as separate sprites, for example sunglasses: keep the pixels that differ from skin within the frame's rows.
8. **Encode** tiles as lossless WebP data URIs.

## 5. Animate in plain JavaScript

Animate the real tiles. Don't redraw the character procedurally when the person wants it to look exactly like the sheet. Skip AI video models: they usually can't take the sheet as a reference, so the character drifts.

Draw on one canvas at tile resolution:
- **Blink-swap between reactions** (about 420ms). The upper and lower lids close over the union of the old and new eye boxes, filled with skin color and edged by a lash line snapped to the art's pixel grid (tile width ÷ about 30). The new tile crossfades in while the lids are shut, then they open. This hides the frame jump. Mention that brows may blend briefly, because AI tiles don't line up perfectly.
- **Props slide** instead of popping, like sunglasses dropping with a back-out ease and lifting off on exit.
- **Idle life:**
  - random blinks every 2–5 seconds, only on open-eyed tiles
  - a gentle float, and a damped spring squash on each change
  - a pulsing glow on the signature accessory for "noticed"
- **Per-reaction motion** (`fx`):
  - tilt for thinking, sway for listening
  - a bigger bounce for surprised, a decaying shake for oops
  - drooping lids for sleepy, falling pixel confetti for celebrating
- **Page:** an auto-cycle that tells a story (hello, then work, problems, wins, sleepy). Add a picker that holds a reaction, a pause/play button and a readout showing the reaction's name and product moment.
- **Reduced motion:** honor `prefers-reduced-motion` with instant swaps and no idle motion.

Keep the whole page self-contained (fonts from Google Fonts only), with themed tokens for light and dark.

## 6. Check once, publish, and offer the next step

- Take one look before publishing. Render it headless and save frames straight from `canvas.toDataURL()`, because element screenshots time out on a floating tile. Capture a resting state, a mid-blink frame and a mid-prop-slide frame. Fix what you see in one pass, then publish the page as an artifact.
- Report what moves and which product moment each reaction maps to, plus any honest limits, such as AI tiles not being perfectly aligned.
- Offer the next step:
  - export a GIF or MP4 for social
  - export a favicon and avatar set
  - have a pixel artist redraw the sheet as clean, layered art, so every part animates seamlessly

## Bundled files

- `scripts/cut_tiles.py`: cuts tiles from a sheet and detects eye boxes and skin color (stage 4).
  `.venv/bin/python -I scripts/cut_tiles.py SHEET.png tiles/ calm,curious,... [--pick 0,1]`
  Run it once per sheet; it merges results into `tiles/meta.json` and writes a debug image to check. Add a `"_clip": [x0, y0, x1, y1]` box for the accessory glow, and optionally a `tiles/shades.png` prop sprite with a `"_shades"` box.
- `scripts/build_page.py`: fills the page template with the tiles (stage 5).
  `.venv/bin/python -I scripts/build_page.py tiles/ reactions.html --name Boost --brand BoostGPT`
- `templates/reactions-page.html`: the animated page. Edit its `STATES` object (names, product-moment lines, `blink`, `glow`, `fx`) to match your reactions. Reactions without a tile are skipped.
