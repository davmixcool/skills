# Sound

Two ways to score a film: a music track cut to the picture, or a score made in code. Either
way the picture's timeline is the master, and the soundtrack is built to it.

## A music track

Use one the person has rights to (a folder of licensed tracks, or one they name). Never
download music on your own.

1. **Analyse it.** `node tools/music.mjs --analyse --track <file>` prints the length, tempo
   candidates, the likely drops (the biggest rises in loudness, snapped to an onset), and the
   loudness every 2 s.
2. **Confirm the tempo.** The analysis gives candidates, best first. Expect the true tempo in
   the top two, next to a triplet or half-time reading: one 139 BPM track came out "92, 139".
   Take the tempo from the track's page if it lists one. Otherwise measure it from the track's
   structure: `--landmarks a,b` (two clear moments, such as the drop and the re-entry after a
   break) counts the beats between them at each candidate, and the true tempo gives a whole
   number. Tempos 3:2 apart can both pass one pair (162 beats at 139 is 108 at 92.7), so check a
   second pair, and the chord cycle at each: the true tempo has a clean 8, 16 or 32. Then take
   the exact tempo from the whole count, and the beat grid from `--analyse --bpm`. Never cut bars
   on a guessed tempo.
3. **Put the drop on the big cut.** The drop is the track's biggest moment; the film's is the
   cut from the problem to the product. `--drop <track s> --drop-at <film s>` lines them up.
   This decides where the track starts (`drop - drop-at`). If the drop is too early in the
   track for the cut, the film's opening is shorter than the cut, so move the cut.
4. **Join to the track's own ending.** A track is rarely as long as the film. Play it from its
   start point, then at a bar line (`--splice-bar N`, N bars after the drop; needs `--bpm`),
   cross to music that plays out to the track's own end (`--to-end`), so the film ends with the
   music rather than on a fade. Set `--duration` to the join plus what's left of the track, and
   put the last shot on the track's last bar line.
5. **Join on whole chord cycles, matched on chords and rhythm.** A track's chords go round in a
   cycle (often 8 or 16 beats; `--analyse --bpm` measures it). A join that skips part of a
   cycle lands mid-progression: the beat holds and the chords jump. With `--bpm`, `--ending
   auto` tries only whole cycles on from the join, scores each on harmony (12-note chroma) and
   rhythm (onsets), 6 s before and 6 s after, and prints the top five. A clean join scores
   about 0.85+ on harmony; rhythm 0.3–0.8. It blends over 2 beats (`--xfade`). Two joins that
   jumped: one picked by hand, mid-phrase, straight into a track's outro; one that skipped
   7 bars of a 2-bar progression, which matched the rhythm but not the chords. Counting bars at
   a nominal tempo also once landed 3 beats off. Let the tool choose, from the measured grid.
6. **Listen across the join** in the preview (`?t=` a few seconds before it). If you can't
   listen, say so, and ask the person to listen there.

## A film that loops

A social clip plays round and round, so a loop must be seamless in sound as well as picture.

- **Length: a whole number of chord cycles** (12 bars at a 4-bar cycle, say). The music's end
  is crossfaded into the music just before its start, so the two halves of the crossfade must
  be on the same chord.
- **Start it a bar or two before the drop,** so the drop lands on the film's big cut and the
  wrap falls back into the quieter bars before it, as the track itself does.
- `node tools/loopmusic.mjs --track <file> --start <track s at film 0> --duration <film s>`
  (a 1.2 s equal-power crossfade, -16 LUFS).
- Check the wrap: the first and last frames of the export should match, and the level across
  the wrap should be what the track does there.

`music.mjs` writes `assets/music.m4a`, loudness-evened to -15 LUFS with one static gain
(`--lufs -16` for a social post, the platforms' usual level).

## A score in code

`src/score.js` builds the soundtrack in Web Audio, rendered offline on the film's own
timeline:

- a pad under everything;
- a soft boom and a bell on each cut;
- a whoosh into a big move;
- a chime on each step of a moment;
- a chord under the wordmark.

Use it when there is no suitable track, or when the mood is one stock music doesn't have (a
Halloween clip got low drones, a heartbeat and bells). The noise is seeded, so every render
sounds the same. The exporter takes it from `window.scoreWav()` when there is no
`assets/soundtrack.m4a`. The preview plays it too.

## Under a voice: a steady, low bed

`node tools/mix.mjs --music assets/music.m4a --voice assets/voice/narration.wav --at <V> --lift-until <drop-at> --duration <D>`

- **No ducking and no sidechain.** A bed that dips under every sentence and swells in every
  pause reads as the music fluctuating, and people notice. The music sits at one level for the
  whole film.
- **The level is about 15 dB under the voice** (`--bed -15`): the voice at -16 LUFS, the music
  around -31. That is as low as a ducked bed sits while someone talks, and it stays there. If
  it still sounds loud, go lower (`--bed -18`). Never ride it up and down.
- **Both gains are measured**, so any take and any track land at the same balance. The voice
  gets a high-pass at 70 Hz and gentle compression first.
- **Lift a quiet intro.** Many tracks' intros sit 5–9 dB under the body; at a fixed bed, the
  music then jumps at the drop. `--lift-until <drop-at>` raises the intro by the measured
  difference (RMS, intro against the 6 s after the drop), ramped over the last half second. Set
  `--lift` by ear if it still jumps.
- **The whole mix gets one static gain to -15 LUFS** (two-pass loudnorm, `linear=true`).
  Single-pass loudnorm is dynamic, and it pumps.

Without a voice, `mix.mjs --music assets/music.m4a` just evens the music to -15 LUFS as
`assets/soundtrack.m4a`.

## Levels to check

- `ffmpeg -i assets/soundtrack.m4a -af ebur128 -f null -`: integrated about -15 LUFS, true peak
  under -1.5 dBTP.
- Across the drop, and across the join: no jump.
- Under the voice: every word clear on laptop speakers, with the music still there.
