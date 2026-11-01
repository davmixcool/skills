---
name: prototype-take
description: "Film a working web prototype as a smooth video: the prototype runs in headless Chrome on a virtual clock (time only moves when a frame is taken, so every frame is perfect at 60 fps), a scripted pointer and keys drive its real interactions, a camera follows what's happening, and a drawn pointer and keycaps go on top. Any frame (square, vertical, 11:9, 1.43:1, 16:9). Silent by default, as the proof that goes in the reply under a product film; with a music track for a cut posted on its own (TikTok). Use when asked to \"film the prototype\", \"record a take of it working\", \"make the real demo for the reply\", \"show the prototype working, no edits\", or to film any interactive HTML prototype or web UI as a scripted demo. Not for editing screen recordings, camera footage, or for drawn product films (use product-film)."
---

# Prototype take

A take is the real thing, working: a prototype of a feature, filmed. Where a product film (the `product-film` skill) shows the idea at its best, drawn in 3D, the take shows it working, with no edits. Together they make one post: the film first, to stop the scroll; the take in the reply, to answer "is this real?".

It isn't a screen recording. The prototype runs in headless Chrome on a virtual clock, so time only moves when a frame is taken: timers, animation frames, CSS and Web animations, videos and images are all brought up to the clock each frame. Every frame comes out smooth at 60 fps, however slow the page is to draw. The pointer and keys are scripted, and they drive the prototype's real interactions through Chrome's own input events. A camera eases toward whatever is happening, and a drawn pointer and keycaps go on top.

## Requirements

- **Node 22+** (for its built-in WebSocket) and **ffmpeg** (libx264, aac) on the PATH.
- **Google Chrome**, found at its usual paths, or set `CHROME_PATH`.
- **A working prototype**: an HTML page whose interactions really work (see 1).
- Optional: **a music track** the person has rights to, for a cut posted on its own.

## How it works

1. **Prototype first.** The feature works in a page, really, before anything is filmed.
2. **Script the take.** A shot list (time, action, what it shows), then a take file: the page, its stage, the actions, where the camera looks.
3. **Check stills.** Render the moments that matter; look at each.
4. **Film it.** Every frame size asked for; silent.
5. **Post it.** In the reply under the film (silent), or on its own with music.

## 1. Prototype first

Every take films a prototype, so build the prototype before the take, and before any film of the same feature.

- **It really works.** Clicks, keys, drags and search do what they show. Never film a feature the prototype fakes.
- **One stage.** Put everything on one fixed-size element (say 1512 × 945, a laptop screen) that the camera can move and scale. The prototype's own pointer maths should go through `getBoundingClientRect`, or update its scale and offset when the camera moves (`camera.apply`).
- **Its settings** (sizes, counts) come from `localStorage`, so the take can set them (`storage`).
- **Staging, kept apart.** Things a browser page can't do for real (an OS screenshot, a system notification, another app's window) are staged in a separate script (`scripts` in the take file), never mixed into the prototype. Name them in the reply if they matter.
- **Real-browser limits.** A page never sees some shortcuts: ⌘⇧4 belongs to macOS, ⌘W closes the tab. Give the prototype its own (⌥⇧4, a close button); the take can still show any keycaps.
- **Nothing that isn't yours.** For an idea not out yet, keep your other products out of it, and use neutral sample data (stock photos, made-up vendors).

## 2. Script the take

Write a shot list in the prototype's folder first: time, action, what it shows. Agree it before scripting. Then write the take file: see [reference/take-file.md](reference/take-file.md) for every field and action, and `example/` for one that runs.

```js
export default {
  page: 'prototype.html',
  stage: { width: 1200, height: 750 },
  camera: { selector: '#stage' },
  duration: 6,
  focus: () => document.querySelector('#panel').classList.contains('on') ? { x: 600, y: 300, k: 1.55 } : null,
  actions: [
    { at: 1.0, keys: ['⌥', 'Space'], press: { code: 'Space', key: ' ', alt: true } },
    { at: 1.8, type: 'no', every: 0.12 },
    { at: 2.6, to: "__take.at('#list li')", dur: 0.5 },
    { at: 3.4, keys: ['↩'], press: { code: 'Enter', key: 'Enter' } },
  ],
};
```

- **Move like a hand.** Pointer moves of 0.4–0.8 s, arriving a beat before the click. Keep the pointer in the frame for every click: an event off-screen lands nowhere.
- **Show the keys.** Every shortcut gets keycaps (`keys`), even when the press itself is a different shortcut.
- **Let the camera follow.** `focus` returns where to look and how close (`{ x, y, k }`) from the page's own state, every frame. Pin it for a moment with a `focus` action. Close in on small moments (k 1.3–1.5); pull out to show where things go.
- **Pace for reading.** Hold on each result long enough to read it (about a second for a word, two for a sentence).

## 3. Check stills

```bash
node scripts/take.mjs <take.mjs> out/take.mp4 --stills 1.5,4.6,9 --scale 1
```

Look at each PNG: the pointer is where it should be, nothing is cut off, the right state is showing, the keycaps are readable. Fix, then check again.

## 4. Film it

```bash
node scripts/take.mjs <take.mjs> out/take-square.mp4 --size 1080x1080      # the main one for social
node scripts/take.mjs <take.mjs> out/take-wide.mp4 --size 1920x1080        # and 1320x1080, 1548x1080, 1080x1920 if asked
```

- 60 fps, rendered at 2× and scaled down (`--scale 2`): sharp type. Roughly 10 s of rendering per second of take.
- **Silent by default.** The take goes under a film that already has the music.
- A frame wider than the stage would crop its top and bottom (and lose a menu bar): set `extend: true` and draw past the stage's sides in `setup` (see the take-file reference).
- Two takes at once need two ports (`--port 9341`).

## 5. Post it

- **In the reply under the film:** silent. Open the reply the same way every time, so people learn it: "the real prototype, no edits:". Never suggest it's available if it isn't: a prototype is working, not shipped.
- **Instagram:** the film as the first slide of a carousel, the take as the second (silent: the music plays on the first).
- **On its own (TikTok "part 2")**: silent videos get pushed less there, so give it the film's track:

```bash
node scripts/take.mjs <take.mjs> out/take-tiktok.mp4 --size 1080x1920 --music <the film's track> --music-start 12.5 --lufs -16
```

- **LinkedIn** takes one video per post and none in comments: the take goes out as its own post.

## Present results

- Give the paths of every file made, and say what the take shows, action by action, and how long it is.
- Show a still or two if the interface allows images.
- Say what was staged rather than real, if anything.
- Don't post anything: the person does.

## Troubleshooting

See [reference/pitfalls.md](reference/pitfalls.md): every failure these takes have hit, with its fix.
