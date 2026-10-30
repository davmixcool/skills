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
   the top two, next to a triplet or half-time reading: one 140 BPM track came out "92, 139".
   Take the tempo from the track's page if it lists one, or confirm by ear. Never cut bars on
   a guessed tempo.
3. **Put the drop on the big cut.** The drop is the track's biggest moment; the film's is the
   cut from the problem to the product. `--drop <track s> --drop-at <film s>` lines them up.
   This decides where the track starts (`drop - drop-at`). If the drop is too early in the
   track for the cut, the film's opening is shorter than the cut, so move the cut.
4. **Join to the track's own ending.** A track is rarely as long as the film. Play it from its
   start point, then at a bar line before the end card (`--splice-bar N`, N bars after the
   drop; needs `--bpm`), cross to the track's own ending so the music resolves under the
   wordmark.
5. **Let the audio pick the join.** With `--ending auto` (the default), the 4 s of onsets
   before the join are matched against every moment of the track's last 40%, and the best
   Pearson r wins. Expect r around 0.3–0.8; a candidate 4 or 8 bars from the best is the
   same phrase. Counting bars at a nominal tempo once landed 3 beats off, which you could
   hear as a jump. Matching the audio found the hand-checked join to 0.01 s.
6. **Listen across the join** in the preview (`?t=` a few seconds before it).

`music.mjs` writes `assets/music.m4a`, loudness-evened to -15 LUFS with one static gain.

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
