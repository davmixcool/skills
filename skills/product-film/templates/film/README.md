# Film name

What the film is for, where it goes, and how long it runs. Ends on the wordmark and the tagline.

| Time | Voice | Picture |
| --- | --- | --- |
| 0–4 | "Too much to keep track of?" | Cards drifting in depth; the headline |
| 4–11.5 | "…" | The product on glass; its moment lands on the word |
| 11.5–16 | "Product. The tagline." | The wordmark |

- **Preview:** `npm run serve`, then http://localhost:8794/ (`?theme=light`, `?t=6`, `?size=1080x1080`; Space plays).
- **Frames:** which sizes this film is rendered at (16:9 for a site; square first for social, plus
  1320x1080, 1548x1080, 1920x1080 and the vertical made from the square), and whether it ends or loops.
- **Soundtrack:** the code score (`src/score.js`), or `assets/soundtrack.m4a` from `tools/music.mjs` +
  `tools/mix.mjs` (or `tools/loopmusic.mjs` for a loop): note the track, its tempo and chord cycle, its
  drop, the join (and its harmony and rhythm scores) and the levels here.
- **Voice:** the take, the voice, the speed, and where the line times came from.
- **MP4s:** `npm run export:dark`, `npm run export:light` → `renders/` (`--size WxH` for other frames).
- **Stills:** `npm run stills` → `stills/` (from `stills.json`).
