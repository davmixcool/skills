#!/usr/bin/env node
/**
 * The soundtrack: the voice over a steady, low music bed, as assets/soundtrack.m4a.
 *
 *   node tools/mix.mjs --music assets/music.m4a [--voice assets/voice/narration.wav --at 0.8]
 *                      [--bed -15] [--lift-until 9.0 [--lift 8.3]] [--duration 63.2]
 *
 * The bed sits a fixed --bed dB under the voice (default -15: the voice at -16 LUFS, the music
 * around -31) for the whole film. No ducking, no sidechain: a bed that dips and swells under
 * every sentence reads as the music fluctuating. Both gains are measured, so any take and any
 * track land at the same balance.
 *
 * --lift-until: a track's intro is often much quieter than its body (5–9 dB is common); left as it
 * is, the bed jumps at the drop. The intro, up to that film time, gets a fixed lift, ramped out over
 * the half second before it: measured (the intro's RMS against the 6 s after the drop), or --lift dB
 * when the ear wants more. Listen across the drop in the preview either way.
 *
 * Then one static gain for the whole mix to -15 LUFS (two-pass loudnorm, linear): nothing pumps.
 * Without --voice, the music alone is evened to -15 LUFS.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { arg } from './browser.mjs';

const music = arg('music', 'assets/music.m4a');
const voice = arg('voice', null);
const at = Number(arg('at', 0));
const bedDb = Number(arg('bed', -15));
const liftUntil = arg('lift-until', null) === null ? null : Number(arg('lift-until'));
const out = arg('out', 'assets/soundtrack.m4a');
mkdirSync(dirname(out), { recursive: true });

const run = (args) => spawnSync('ffmpeg', ['-v', 'info', '-y', ...args], { encoding: 'utf8', maxBuffer: 1 << 26 });
const lastJson = (s) => JSON.parse(s.slice(s.lastIndexOf('{'), s.lastIndexOf('}') + 1));
/** Integrated loudness (LUFS) of a file, or of a stretch of it. */
function loudness(file, { from = 0, to = null, pre = '' } = {}) {
  const r = run(['-ss', String(from), ...(to !== null ? ['-to', String(to)] : []), '-i', file, '-af', `${pre}loudnorm=print_format=json`, '-f', 'null', '-']);
  return Number(lastJson(r.stderr).input_i);
}
/** Mean level (dB RMS) of a stretch: what the ear compares across a cut. */
const rms = (file, from, to) => Number(/mean_volume: ([-\d.]+)/.exec(run(['-ss', String(from), '-to', String(to), '-i', file, '-af', 'volumedetect', '-f', 'null', '-']).stderr)[1]);
const durationOf = (file) => Number(/Duration: (\d+):(\d+):([\d.]+)/.exec(run(['-i', file]).stderr).slice(1).reduce((s, v, i) => s + Number(v) * [3600, 60, 1][i], 0));
const duration = Number(arg('duration', durationOf(music)));

const VOICE_PRE = 'highpass=f=70,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120,';
let lift = 0;
if (liftUntil !== null) {
  // RMS, not LUFS: integrated loudness gates and weights a quiet intro until the jump hides in it.
  lift = arg('lift', null) !== null ? Number(arg('lift')) : rms(music, liftUntil + 0.5, liftUntil + 6.5) - rms(music, 0, liftUntil - 0.5);
  console.error(`intro lift: +${lift.toFixed(1)} dB until film ${liftUntil}s`);
}
const musicI = loudness(music, liftUntil !== null ? { from: liftUntil + 0.5 } : {});
const liftExpr = liftUntil === null ? '1' : `(1+${(10 ** (lift / 20) - 1).toFixed(4)}*min(1,max(0,(${liftUntil}-t)/0.5)))`;

let filter, inputs;
if (voice) {
  const voiceI = loudness(voice, { pre: VOICE_PRE });
  const voiceGain = -16 - voiceI, musicGain = (-16 + bedDb) - musicI;
  console.error(`voice ${voiceI.toFixed(1)} LUFS → -16 (${voiceGain.toFixed(1)} dB); music ${musicI.toFixed(1)} → ${(-16 + bedDb).toFixed(1)} (${musicGain.toFixed(1)} dB)`);
  inputs = ['-i', music, '-i', voice];
  filter = [
    `[0:a]aformat=sample_rates=48000:channel_layouts=stereo,volume='${(10 ** (musicGain / 20)).toFixed(4)}*${liftExpr}':eval=frame,apad,atrim=end=${duration}[music]`,
    `[1:a]aformat=sample_rates=48000:channel_layouts=stereo,${VOICE_PRE}volume=${voiceGain.toFixed(2)}dB,adelay=${Math.round(at * 1000)}|${Math.round(at * 1000)},apad,atrim=end=${duration}[voice]`,
    `[voice][music]amix=inputs=2:normalize=0,afade=t=out:st=${duration - 1.2}:d=1.2`,
  ].join(';');
} else {
  inputs = ['-i', music];
  filter = `[0:a]aformat=sample_rates=48000:channel_layouts=stereo,volume='${liftExpr}':eval=frame,atrim=end=${duration}`;
}
const m1 = run([...inputs, '-filter_complex', `${filter},loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json[out]`, '-map', '[out]', '-f', 'null', '-']);
const m = lastJson(m1.stderr);
const norm = `loudnorm=I=-15:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
const r = run([...inputs, '-filter_complex', `${filter},${norm}[out]`, '-map', '[out]', '-ar', '48000', '-c:a', 'aac', '-b:a', '256k', out]);
if (r.status) { process.stderr.write(r.stderr.slice(-2000)); process.exit(r.status); }
console.log(out);
