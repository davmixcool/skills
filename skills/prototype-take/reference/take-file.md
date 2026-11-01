# The take file

An ES module whose default export describes the take. `scripts/take.mjs` loads it, opens the
prototype in headless Chrome, and films it. Paths are relative to the take file.

## Fields

| Field | What it is |
| --- | --- |
| `page` | The prototype: a path (`prototype.html`) or a URL |
| `stage` | `{ width, height }`: the prototype's stage in its own pixels. The camera moves and scales it; pointer positions are in these coordinates |
| `duration` | Seconds of film |
| `camera` | `{ selector: '#stage' }` (the element to move and scale, transform-origin 0 0), or `{ apply: (x, y, k, ox, oy) => { … } }` when the prototype keeps its own scale and offset (set them there too, so its pointer maths stays right) |
| `focus` | A function run in the page every frame, returning `{ x, y, k }` (where to look, in stage coordinates, and how close; 1 = the stage's own size) or `null` (the stage's middle, filling the frame). Read the prototype's own state: what's open, what's being dragged, where the pointer is |
| `pointer` | Where the pointer starts, `{ x, y }` (default: the middle) |
| `actions` | The script (below) |
| `storage` | `localStorage` entries set before the page loads: `{ key: value }` (objects are stringified) |
| `setup` | A function run in the page once it has loaded: hide a settings panel, set a background, add take-only CSS, set `window.__take.afterFrame` (runs every frame, after the page's own frame work) |
| `scripts` | Extra files run in the page after `setup`: staging for what a page can't do for real |
| `warm` | Seconds the page runs before filming starts (default 1): fonts, pictures, opening animations |
| `extend` | `true` to let a frame wider than the stage look past its sides instead of cropping top and bottom; `window.__take.ext` is how far (px), for `setup` to draw there (the wallpaper and menu bar run on) |
| `size` | The default frame, `'1080x1080'` (overridden by `--size`) |

## Actions

Each is an object with `at` (seconds) and one or more of:

| Key | Does |
| --- | --- |
| `to`, `dur` | Moves the pointer to `{ x, y }`, or to the result of a page expression (a string), over `dur` seconds on a slight arc. `"__take.at('#send')"` is an element's centre in stage coordinates (`__take.at(sel, dx, dy)`). No `dur`: jumps there |
| `click` | A click where the pointer is: `{}`, or `{ meta: true }`, `{ shift: true }`, `{ alt: true }` |
| `down`, `up` | Press and release, for a drag: `down`, then a `to` with `dur`, then `up` |
| `press` | A key: `{ code: 'KeyA', key: 'a', text: 'a', meta, shift, alt, ctrl }` |
| `type`, `every` | Types a string, one key every `every` seconds (default 0.07) |
| `keys` | Keycaps shown by the pointer: `['⌘', 'A']`. They fade in, hold, and fade |
| `focus` | Pins the camera: `{ x, y, k }`; `null` hands it back to the `focus` function |
| `cross` | `true` shows a crosshair instead of the pointer (a screenshot selection), `false` back |
| `call` | Runs a page expression: start a staged moment, set a state |

## The camera

- Eases toward the focus every frame (position quickly, zoom more slowly), and never shows past the
  stage: zoom is at least what fills the frame, and the centre stays where the frame fits.
- A square frame of a wide stage can't show it all: keep the action inside what the square shows,
  or close in.
- A wider frame (16:9 on a 1.6:1 stage) would have to crop top and bottom: with `extend`, the
  camera may look past the sides instead, and `setup` draws something there:

```js
setup: () => {
  const ext = window.__take.ext;
  if (!ext) return;
  document.querySelector('#stage').style.overflow = 'visible';
  Object.assign(document.querySelector('.wall').style, { left: `-${ext}px`, right: `-${ext}px` });
  Object.assign(document.querySelector('.menubar').style, { left: `-${ext}px`, right: `-${ext}px` });
},
```

  Keep the wallpaper at the size and place it had: give it an explicit background-size, so
  extending it doesn't re-crop it.

## Example

`example/take.mjs` films `example/prototype.html`: the launcher opened with ⌥Space, "no" typed to
narrow it to Notes, Enter, and the note that says it opened.

```bash
cd example
node ../scripts/take.mjs take.mjs out/launcher.mp4 --stills 1.2,3,4.6 --scale 1
node ../scripts/take.mjs take.mjs out/launcher.mp4 --size 1080x1080
```
