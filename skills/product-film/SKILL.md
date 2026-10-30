---
name: product-film
description: "Make a premium product film in code: a three.js scene of the product's own UI, drawn on glass slabs with depth of field, sharp words over it, music cut to the picture (drop on the big cut, joined to the track's ending by matching the audio) or a score made in code, an optional voiceover timed from its pauses, light and dark, exported frame by frame to MP4. Then the store images, posters and social cards from the same frames. Use when asked to make a launch video, product video, promo or demo film, a landing-page video, a 3D or three.js video of an app, a short seasonal or social clip in a product's look, video posters, or store screenshots that match a video. Not for editing camera footage, talking heads, captions, or AI-generated video."
---

# Product film

A film made the way a motion designer would make it, but in code. One three.js scene shows the product's real UI, drawn on canvases. Every frame is a pure function of time. The words are a sharp DOM layer on top, and the soundtrack is built to the picture's timeline. The same frames then become the store images and posters.

The result looks like a premium launch film, not a screen recording. Because everything is code, any change (a word, a beat, a colour, light mode) is a re-render, not a re-edit.

## Requirements

- **Node 20+** and **ffmpeg** (with libx264 and aac) on the PATH.
- **Chrome** installed, for exports on the GPU. `tools/browser.mjs` finds it at the usual paths, or set `CHROME_PATH`. Without Chrome, Playwright's Chromium is used (`npx playwright install chromium`), but it may render WebGL in software: slower, sometimes without bloom.
- The film folder's own `npm install` brings in three.js and Playwright.
- Optional:
  - **a music track** the person has rights to;
  - **a TTS voice** (any provider the agent can reach), or the person's own recording, for a narrated film.

## How it works

1. **Brief.** Find out what the film is for and what the product really does.
2. **Shot list.** Write one timeline: time, voice, picture. Agree it before building.
3. **Scaffold.** Copy the template, install, and preview.
4. **Draw the product.** Its real UI on canvases, animated by `k`, in light and dark.
5. **Stage the shots.** Slabs, camera moves and depth of field in `film.js`, timed from `timeline.js`.
6. **Words.** A few big words per shot, landing on the voice or the beat.
7. **Sound.** Music cut to the picture, or a code score; an optional voice; a steady mix.
8. **Review.** Stills, a contact sheet, and the preview with sound, in both themes.
9. **Export.** MP4 per theme, web copies under the size cap, posters.
10. **Stills.** Store images, posters and cards from the film's frames.

## 1. Brief

Read the product before asking anything: its README, landing page, store listing, and the UI components the film will show. Then ask only what you can't find:

- **Where it goes.** A landing page (~60 s, narrated), a launch post (20–40 s), a store promo, or a seasonal or social clip (15–20 s, music only). This sets the length and whether there's a voice.
- **What it shows.** Which features, and in which environments (browsers, OSes, devices). Get a reference screenshot of each real environment to draw from.
- **Music.** A track the person provides or names. Never download one on your own. With no track, use a code score.
- **Voice.** Whether there is one, and which (see [reference/voice.md](reference/voice.md)).

Defaults, unless the person says otherwise:

- **Both light and dark versions.**
- **No call to action in the film.** Don't add "Add to Chrome", a price, a URL or "free for 7 days". It ends on the wordmark and tagline.
- **No mascot or character unless asked.** No people, rooms, desks or monitors; the product floats in its own space.
- **Drawn UI, never screenshots, inside the film.**
- **A steady, low music bed under a voice. Never ducking.**
- **No film grain or noise.**
- **Every claim is true.** Show only what the product does, the way it does it.

## 2. Shot list

Write the film as one table before any code: time, voice line (if any), picture. Keep it in the film's `README.md`.

| Time | Voice | Picture |
| --- | --- | --- |
| 0–4 | "Too much to keep track of?" | Cards drifting in depth; the headline |
| 4–11.5 | "…" | The product on glass; its moment lands on the word |
| 11.5–16 | "Product. The tagline." | The wordmark |

Shape that works:

1. the problem, shown physically;
2. the promise;
3. the big cut to the product on the music's drop;
4. one shot per feature, each with one moment landing on its word;
5. a payoff that echoes the opening;
6. the wordmark and tagline.

Show the table to the person. Changing it now is cheap; changing it after the build is not.

## 3. Scaffold

```bash
cp -r <skill>/templates/film <project>/marketing/video/<film-name>
cd <project>/marketing/video/<film-name>
npm install
npm run serve          # http://localhost:8794/   (?theme=light, ?t=6 opens on a moment, Space plays)
```

The template is a working 16 s film: three shots (open, product, end), a code score, both themes. Change it shot by shot rather than starting over.

| File | What it holds |
| --- | --- |
| `src/timeline.js` | `DURATION`, `V` (when the voice starts), `SHOT` (when each shot starts), and the moments and words things land on |
| `src/draw.js` | The product's UI as canvas drawings, with light and dark palettes (`setMode`) |
| `src/film.js` | The scene, post-processing, shots, words, `renderFrame(t)`, and the preview player |
| `src/score.js` | The code score (Web Audio, offline). Delete it when using a track |
| `index.html` | The stage, the type styles, and the light theme's colours |
| `tools/` | `serve`, `export`, `music`, `voice`, `mix`, `contact-sheet`, `web` and `stills`. Each has its usage in its header |
| `stills.json` | The store images and posters to make from the film |

## 4. Draw the product

Read [reference/look.md](reference/look.md) first.

- **Draw each UI faithfully, from the code.** One function per surface (a window, a panel, a dialog, a card), parameterised by a state or a `k` from 0 to 1 for its moment.
- **Draw at 2–2.5× the on-screen size, with both palettes.**
- **Draw real environments from the person's reference screenshots,** such as a browser's start page, a desktop or a store.
- **Keep the sample data plausible and neutral.** Use real-looking site names and titles, with no real people's data.

## 5. Stage the shots

In `film.js`, each shot is a `THREE.Group`, visible in its time range. Inside `renderFrame(t)`, each shot sets:

- its ground;
- its objects' positions, from `seg(t, a, b)` and the easings;
- its camera (always moving);
- `focus = depthOf(subject)` and an aperture.

Moments come from `timeline.js`, never from numbers written in the shot.

- Use `slab(canvas, w, h)` for anything that is product UI, and `dust()` in every shot.
- Swing between similar slabs on an arc rather than cutting. Cut on the music's beats or the voice's lines.
- When a shot needs a still-only state for the store images, add a URL flag (e.g. `?still=x`).

## 6. Words

`LINES` in `film.js`: each has `at`, `to`, `html`, classes (`xl`, `lg`, `md`, `grad`, `left`) and `top`.

- Use few words, big, with one idea at a time. Use the product's own words.
- Time each line to its word in the voice, or to the beat when there's no voice.
- Words beside a slab sit left over the scrim. Check they never overlap the slab at its closest point.

## 7. Sound

Read [reference/sound.md](reference/sound.md), and [reference/voice.md](reference/voice.md) for a narrated film.

```bash
# a track: find the drop and tempo, then fit it (drop on the big cut, joined to its own ending)
node tools/music.mjs --analyse --track <track.mp3>
node tools/music.mjs --track <track.mp3> --drop 15.02 --drop-at 4 --duration 16 --bpm 140 --splice-bar 4

# a voice: speed the take, time its lines from the pauses (fill SHOT and the word times from this)
node tools/voice.mjs --in assets/voice/narration-raw.wav --tempo 1.1 --at 0.8

# the soundtrack: assets/soundtrack.m4a (the preview and the exporter pick it up)
node tools/mix.mjs --music assets/music.m4a --voice assets/voice/narration.wav --at 0.8 --lift-until 4 --duration 16
node tools/mix.mjs --music assets/music.m4a       # music only
```

With no `assets/soundtrack.m4a`, the preview and the export use `src/score.js`.

## 8. Review before showing anyone

```bash
node tools/export.mjs --theme dark  --stills 2,6,9.5,14    # frames/ (PNG): look at each
node tools/export.mjs --theme light --stills 2,6,9.5,14
```

**Look at the stills yourself.** Check that:

- type is sharp and no descenders are clipped;
- no words overlap the product;
- the drawn UI matches the real product;
- light and dark both hold up;
- nothing is empty or off-frame.

Then listen in the preview across the drop, the join and the end. Fix, then re-check.

## 9. Export

```bash
node tools/export.mjs --theme dark  --poster 14.5     # renders/film-dark.mp4 (+ poster jpg)
node tools/export.mjs --theme light --poster 14.5
node tools/contact-sheet.mjs renders/film-dark.mp4    # the whole film in one image: look at it
node tools/web.mjs renders/film-dark.mp4 --max-mb 24 --out <site>/public/video/<name>-dark.mp4
```

An export takes about 1.5× the film's length on an Apple Silicon Mac. Run long exports in the background. Encoding uses CRF 20 capped at 10 Mb/s, about 1 MB per second of film. Web copies step the CRF up until they fit under the cap.

On a site, use `<video controls playsinline preload="none" poster="…">` with one source per theme, chosen by `prefers-color-scheme`. Serve it with byte ranges.

## 10. Stills

Read [reference/stills.md](reference/stills.md). Edit `stills.json` with the frames, the images, their sizes, layouts and words. Then:

```bash
node tools/stills.mjs                   # every set, both themes → stills/<set>/<theme>/
node tools/stills.mjs --only posters
```

For posters, make 2–3 options per theme and let the person pick.

## Present results

- Give the paths: the MP4s, the posters, the contact sheet, and the stills folders, plus the preview URL for watching with sound.
- Show the contact sheet and one or two stills inline if the interface allows images.
- Say what the film shows, shot by shot, in one short list, and how long it is.
- Name anything still open: a voice not yet approved, a track the person should confirm they have rights to, a store upload they need to do.
- Don't upload, publish or post anything. The person does that.

## Troubleshooting

See [reference/pitfalls.md](reference/pitfalls.md): every failure these films have hit, with its fix.

## Examples

Films built this way:

- the WithFew browsers film (58 s; music only; four browsers on an arc);
- the WithFew landing film (63 s; narrated; light and dark);
- a WithFew Halloween clip (18.5 s; code score; pumpkin heads).
