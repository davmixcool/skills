# Pitfalls

Each of these happened on a real film. Each has a fix in the template; check for them when you
change things.

| Symptom | Cause | Fix |
| --- | --- | --- |
| The preview page downloads instead of opening | The server took the content type from the URL (`/`), not from the file it served | `tools/serve.mjs` types by the resolved file |
| `EADDRINUSE` on serve | A preview server is still running | Open the URL it already serves, or `--port` |
| The preview shows only part of the frame | The 1920×1080 stage was centred, then scaled | `translate(-50%, -50%) scale(s)` in that order, origin centre |
| A TV-static look; a 944 MB file | Film grain in the finish shader, encoded at CRF | No grain. Use a ±0.5/255 dither; CRF 20 capped at 10 Mb/s |
| The "g" in a word is cut off | `background-clip: text` clips descenders | `.grad { padding-bottom: .18em; margin-bottom: -.18em }` |
| A jump in the music near the end | The join was counted in bars at a nominal tempo, 3 beats off | `music.mjs` matches the audio for the join |
| The music swells and dips | Sidechain ducking under the voice | A steady bed, a fixed -15 dB under the voice, and a linear two-pass loudnorm |
| The music is too loud under the voice | The bed was set by peak or by feel, not against the voice's loudness | `mix.mjs` measures both; go lower with `--bed`, never ride it |
| The bed jumps at the drop | The track's intro is 5–9 dB quieter than its body | `--lift-until <drop-at>` (and `--lift` by ear) |
| Canvas text in the fallback font | It was painted before the web font loaded | `await document.fonts.load(...)` before the first paint; repaint after |
| Coloured blobs behind cards look cheap | Glows used as decoration | Light the object itself; keep grounds soft and neutral |
| Stills differ from the film | They were drawn separately | Render them from the film (`?clean`) |
| Frames differ between renders | `Math.random()` or wall-clock time in the scene | `seeded()`, and everything from `t` |
| The export is slow or the bloom is missing | Playwright's Chromium fell back to software WebGL | Use the installed Chrome on the GPU (`tools/browser.mjs`; `CHROME_PATH`) |
| A cropped store image cuts the subject | A cover crop of a wide shot | `fit: "contain"` with `zoom` and `y`, or `x` to keep an edge |
| The site's video won't deploy | Cloudflare serves at most 25 MB a file | `tools/web.mjs --max-mb 24` |
| Words overlap the product | The slab comes closer to the camera than when it was laid out | Check the shot's closest frame; move the slab right or the camera back |
| A word lands late on a moment | The time was guessed from the script | Time from the pauses (`tools/voice.mjs`), then by ear |
| The music jumps at the join | Picked by hand mid-phrase, or skipped part of a chord cycle (the beat held, the chords didn't) | `music.mjs --bpm`: whole-cycle joins, scored on chords and rhythm; blend over 2 beats |
| The ending fades out on cut-off music | The join didn't run on to the track's own end | `--to-end`, `--duration` = join + what's left of the track; last shot on its last bar line |
| Two tempos both look right | They're 3:2 apart (92.7 and 139): both fit one beat count | `--landmarks` on two pairs, and the chord cycle at each |
| A new track throws every moment off | Moments written in seconds | Time everything in beats and bars from `timeline.js` |
| Square-ish dark corners behind a window's rounded ones | A rounded box can only be as round as it is thin | `slab(…, { radius: the face's })`: an extruded rounded body |
| A dark rim, or a dark strip along a white window's top edge | A dark glass body; the depth-of-field pass on a big white panel | `body` in the window's light grey; `bokeh.enabled = false` while it's the subject |
| A red and blue rim on white edges near the frame's sides | The colour-fringe finish | No chromatic aberration in the finish |
| A loop shows its seam | The last shot didn't land on the first; the music's length wasn't whole chord cycles | Ease the end onto the opening at `t − DURATION`; `loopmusic.mjs` on whole cycles; compare the first and last frames |
| Words collide with the product in the square | Laid out at 16:9 | Lay out square first; keep the words' band clear of background things |
| An object vanishes (opacity NaN) | `Infinity` as a "never" time in `seg()` (∞ − ∞) | Use a large finite time (1e6) |
| Only the dark version exists | One theme rendered, then reported | Render both themes (and every frame asked for) before reporting |
