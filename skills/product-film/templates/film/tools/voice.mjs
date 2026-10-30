#!/usr/bin/env node
/**
 * Readies a voiceover take and times its lines from its pauses, so each shot can cut on its
 * line and each moment land on its word.
 *
 *   node tools/voice.mjs --in assets/voice/narration-raw.wav [--tempo 1.1] [--out assets/voice/narration.wav]
 *                        [--at 0.8] [--noise -35] [--gap 0.18]
 *
 * --tempo speeds the take with the pitch kept (TTS voices read slowly: 1.08–1.12 sounds natural).
 * --at is where the voice starts in the film (timeline.js V): times are printed both in the voice
 * and in the film. --noise (dB) and --gap (s) tune what counts as a pause.
 *
 * Prints JSON: every phrase (start, end) between pauses. Match them to the script's lines in
 * order; a word inside a phrase is found by its share of the phrase's syllables, then checked by
 * ear in the preview (?t=). No transcription model needed.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { arg } from './browser.mjs';

const input = arg('in', null);
if (!input) { console.error('--in <take.wav> is required'); process.exit(1); }
const tempo = Number(arg('tempo', 1));
const out = arg('out', 'assets/voice/narration.wav');
const at = Number(arg('at', 0));
const noise = Number(arg('noise', -35)), gap = Number(arg('gap', 0.18));

mkdirSync(dirname(out), { recursive: true });
const prep = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', input, '-af', `${tempo !== 1 ? `atempo=${tempo},` : ''}aformat=sample_rates=48000:channel_layouts=mono`, out], { encoding: 'utf8' });
if (prep.status) { process.stderr.write(prep.stderr); process.exit(prep.status); }

const r = spawnSync('ffmpeg', ['-v', 'info', '-i', out, '-af', `silencedetect=noise=${noise}dB:d=${gap}`, '-f', 'null', '-'], { encoding: 'utf8' });
const length = Number(/Duration: (\d+):(\d+):([\d.]+)/.exec(r.stderr)?.slice(1).reduce((s, v, i) => s + Number(v) * [3600, 60, 1][i], 0) ?? 0);
const silences = [];
for (const line of r.stderr.split('\n')) {
  const s = /silence_start: ([\d.]+)/.exec(line); if (s) silences.push({ start: Number(s[1]) });
  const e = /silence_end: ([\d.]+)/.exec(line); if (e && silences.length) silences.at(-1).end = Number(e[1]);
}
const phrases = [];
let cursor = 0;
for (const s of silences) {
  if (s.start - cursor > 0.05) phrases.push([cursor, s.start]);
  cursor = s.end ?? length;
}
if (length - cursor > 0.05) phrases.push([cursor, length]);
const fix = (v) => Number(v.toFixed(2));
console.log(JSON.stringify({
  file: out, length: fix(length), tempo, startsInFilm: at,
  phrases: phrases.map(([a, b], i) => ({ n: i + 1, voice: [fix(a), fix(b)], film: [fix(a + at), fix(b + at)], pauseAfter: fix((phrases[i + 1]?.[0] ?? length) - b) })),
}, null, 2));
