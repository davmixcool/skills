# Film name

What the film is for, where it goes, and how long it runs. Ends on the wordmark and the tagline.

| Time | Voice | Picture |
| --- | --- | --- |
| 0–4 | "Too much to keep track of?" | Cards drifting in depth; the headline |
| 4–11.5 | "…" | The product on glass; its moment lands on the word |
| 11.5–16 | "Product. The tagline." | The wordmark |

- **Preview:** `npm run serve`, then http://localhost:8794/ (`?theme=light`, `?t=6`; Space plays).
- **Soundtrack:** the code score (`src/score.js`), or `assets/soundtrack.m4a` from `tools/mix.mjs`:
  note the track, its drop, the join and the levels here.
- **Voice:** the take, the voice, the speed, and where the line times came from.
- **MP4s:** `npm run export:dark`, `npm run export:light` → `renders/`.
- **Stills:** `npm run stills` → `stills/` (from `stills.json`).
