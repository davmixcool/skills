# Voiceover

A narrated film is written as a script first: the picture is cut to the voice, not the voice to
the picture.

## The script

- One short line per shot. Say what the product does in the words it uses, and say it plainly.
  No "revolutionary", no "seamlessly", no "supercharge".
- Lead with the problem in the viewer's terms ("Too many tabs? They're costing you time,
  memory, and focus."), then the promise, then one line per feature, then the payoff (echo the
  opening: "Your time, your memory, your focus. Back."), then the name and the tagline.
- Every claim must be something the product really does, as it does it. Check behaviour in the
  code when unsure.
- Write lists as the voice should say them, with commas ("Chrome, Edge, Brave, and Vivaldi."):
  each item becomes a beat to land a picture on.
- About 2.3 words a second at the final speed. A 60 s film holds about 130 words.

## The take

- Any TTS the person has access to, or their own recording. Generate the whole script as **one
  take**, so the delivery stays even, rather than line by line.
- Show the person the script and the voice choice before generating: a take costs credits and
  is a voice in their brand. Once they approve a voice, keep using it for later films.
- TTS reads slowly. `tools/voice.mjs --tempo 1.1` speeds it with the pitch kept (`atempo`);
  1.08–1.12 sounds natural.
- Keep the raw take (`assets/voice/narration-raw.wav`) next to the sped one.

## Timing from the pauses

`node tools/voice.mjs --in assets/voice/narration-raw.wav --tempo 1.1 --at 0.8`

This prints every phrase between pauses (ffmpeg `silencedetect`), in voice time and in film
time. No transcription model is needed, and none should be run locally.

1. Match the phrases to the script's lines in order. A line with a comma may come out as two
   phrases. If a long pause is missing, lower `--gap`; if breaths split words, raise `--noise`.
2. Shots start on their line (`SHOT` in `timeline.js`): usually 0.3–0.6 s before the line's
   first word, so the picture settles as the voice starts.
3. Moments land on words (`WORD`): `at(voice seconds)`. A word inside a phrase is about its
   share of the phrase's syllables in; check it by ear in the preview (`?t=`) and nudge.
4. The voice starts at `V` (0.5–1 s), so the film doesn't open mid-word.
5. `DURATION` = the voice's end + 3–5 s for the end card to breathe and the music to resolve.

## With music

The drop goes on the cut from problem to product, which is usually the line right after the
promise. Cut the music to that (`tools/music.mjs --drop-at`), then mix (see `sound.md`).
