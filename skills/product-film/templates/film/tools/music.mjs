#!/usr/bin/env node
/**
 * Fits a music track to the film: its drop on the film's big cut, and its own ending under the
 * end card, joined where the beats line up.
 *
 *   node tools/music.mjs --analyse --track media/song.mp3
 *       the tempo, the likely drops, and the loudness every 2 s (to pick by ear and eye)
 *
 *   node tools/music.mjs --track media/song.mp3 --drop 15.02 --drop-at 9.0 --duration 63.2 \
 *       [--splice-bar 27 | --splice 55.29] [--ending 123.47 | auto] [--bpm 140] [--out assets/music.m4a]
 *
 * --drop is the drop's time in the track, --drop-at where it lands in the film (the cut to the
 * product). --splice-bar N joins N bars after the drop (a bar line); --splice is a film time.
 * The join's other side, --ending, is found by matching the audio when left as auto: the 4 s of
 * onsets before the join against every moment of the track's last part, best Pearson r wins.
 * Counting bars at a nominal BPM drifts (it once landed 3 beats off: an audible jump); matching
 * the audio does not. Expect r around 0.3; a candidate exactly 4 or 8 bars from the best one is
 * the same phrase, and either works.
 *
 * Without --splice, the track just plays from its start point and fades out with the film.
 * Loudness: one static gain to -15 LUFS (two-pass, linear), so nothing pumps.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { arg, flag } from './browser.mjs';

const track = arg('track', null);
if (!track) { console.error('--track <file> is required'); process.exit(1); }

const SR = 11025, HOP = 256, FPS = SR / HOP; // onset envelope: ~43 values a second

function decode(file) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
  if (r.status) { process.stderr.write(r.stderr); process.exit(1); }
  return new Float32Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.byteLength / 4);
}
/** Energy per hop, and its rectified log rise: where notes and beats start. */
function envelopes(pcm) {
  const n = Math.floor(pcm.length / HOP), energy = new Float32Array(n), onset = new Float32Array(n);
  for (let i = 0; i < n; i++) { let e = 0; for (let j = i * HOP; j < (i + 1) * HOP; j++) e += pcm[j] * pcm[j]; energy[i] = e / HOP; }
  for (let i = 1; i < n; i++) onset[i] = Math.max(0, Math.log(energy[i] + 1e-9) - Math.log(energy[i - 1] + 1e-9));
  return { energy, onset };
}
function pearson(a, b) {
  const n = a.length; let ma = 0, mb = 0;
  for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; }
  ma /= n; mb /= n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) { const x = a[i] - ma, y = b[i] - mb; num += x * y; da += x * x; db += y * y; }
  return num / Math.sqrt(da * db || 1);
}
const db = (e) => (10 * Math.log10(e + 1e-12)).toFixed(1);
/**
 * Tempo candidates, best first: a pulse train scored against the onsets at each BPM from 80 to
 * 180. Expect the true tempo in the top two, with a triplet or half-time reading beside it
 * (a 140 BPM track came out "92, 139"). Confirm by ear or from the track's page: never cut bars
 * on a guess.
 */
function tempos(onset) {
  const n = onset.length;
  let mean = 0; for (const v of onset) mean += v; mean /= n;
  const o = onset.map((v) => v - mean);
  const ac = (lag) => { const L = Math.round(lag); let s = 0; for (let i = L; i < n; i++) s += o[i] * o[i - L]; return s / (n - L); };
  const scored = [];
  for (let bpm = 80; bpm <= 180; bpm += 0.5) { const lag = (FPS * 60) / bpm; let s = 0; for (let k = 1; k <= 4; k++) s += ac(lag * k) / k; scored.push({ bpm, s }); }
  scored.sort((a, b) => b.s - a.s);
  const top = [];
  for (const { bpm } of scored) { if (top.every((t) => Math.abs(t - bpm) / t > 0.04)) top.push(bpm); if (top.length === 3) break; }
  return top;
}

const pcm = decode(track);
const { energy, onset } = envelopes(pcm);
const length = pcm.length / SR;

if (flag('analyse')) {
  const per = Math.round(FPS * 2), blocks = [];
  for (let i = 0; i + per <= energy.length; i += per) { let e = 0; for (let j = i; j < i + per; j++) e += energy[j]; blocks.push(e / per); }
  // a drop: where the next 4 s are much louder than the 4 s before; snapped to the strongest onset near it
  const drops = [];
  for (let b = 2; b < blocks.length - 2; b++) drops.push({ at: b * 2, rise: 10 * Math.log10((blocks[b] + blocks[b + 1]) / (blocks[b - 2] + blocks[b - 1] + 1e-12)) });
  drops.sort((a, b) => b.rise - a.rise);
  const snap = (t) => { let bi = Math.round(t * FPS); for (let i = Math.max(1, Math.round((t - 1) * FPS)); i < Math.min(onset.length, Math.round((t + 1) * FPS)); i++) if (onset[i] > onset[bi]) bi = i; return bi / FPS; };
  console.log(JSON.stringify({
    length: Number(length.toFixed(2)),
    bpmCandidates: tempos(onset),
    drops: drops.slice(0, 3).map((d) => ({ at: Number(snap(d.at).toFixed(2)), riseDb: Number(d.rise.toFixed(1)) })),
    loudnessEvery2s: blocks.map((e, i) => `${i * 2}s ${db(e)}`),
  }, null, 2));
  process.exit(0);
}

const drop = Number(arg('drop', 0)), dropAt = Number(arg('drop-at', 0));
const duration = Number(arg('duration', NaN));
if (!Number.isFinite(duration)) { console.error('--duration <film seconds> is required'); process.exit(1); }
const bpm = Number(arg('bpm', 0));
if (arg('splice-bar', null) !== null && !bpm) { console.error(`--splice-bar needs --bpm (candidates: ${tempos(onset).join(', ')}; confirm by ear or from the track's page).`); process.exit(1); }
const BAR = (60 / bpm) * 4, X = 0.5;
const start = drop - dropAt; // track time at film 0
if (start < 0) { console.error(`The drop (${drop}s) comes before the film's ${dropAt}s: pick a later drop or an earlier cut.`); process.exit(1); }
const splice = arg('splice', null) !== null ? Number(arg('splice')) : arg('splice-bar', null) !== null ? dropAt + Number(arg('splice-bar')) * BAR : null;
const out = arg('out', 'assets/music.m4a');
mkdirSync(dirname(out), { recursive: true });

let filter;
if (splice === null) {
  if (start + duration > length) console.error(`Note: the track runs out at film ${(length - start).toFixed(2)}s.`);
  filter = `[0:a]atrim=start=${start}:end=${start + duration},asetpts=PTS-STARTPTS,afade=t=in:d=0.05,afade=t=out:st=${duration - 1.2}:d=1.2`;
} else {
  let ending = arg('ending', 'auto');
  if (ending === 'auto') {
    const W = Math.round(FPS * 4), cut = Math.round((start + splice) * FPS);
    const probe = onset.subarray(cut - W, cut);
    const from = Math.round(Number(arg('search-from', length * 0.6)) * FPS);
    const scores = [];
    for (let c = Math.max(W, from); c < onset.length - Math.round(FPS * 2); c++) scores.push({ c, r: pearson(probe, onset.subarray(c - W, c)) });
    scores.sort((a, b) => b.r - a.r);
    const picked = [];
    for (const s of scores) { if (picked.every((p) => Math.abs(p.c - s.c) > FPS * 0.5)) picked.push(s); if (picked.length === 5) break; }
    console.error('join candidates (track s, r):', picked.map((p) => `${(p.c / FPS).toFixed(2)} r=${p.r.toFixed(2)}`).join(', '));
    ending = picked[0].c / FPS;
  }
  ending = Number(ending);
  const a = splice + X / 2, bFrom = ending - X / 2, bLen = duration - splice + X / 2;
  if (bFrom + bLen > length + 0.05) console.error(`Note: the ending runs out ${(bFrom + bLen - length).toFixed(2)}s before the film does.`);
  filter = [
    `[0:a]atrim=start=${start}:end=${start + a},asetpts=PTS-STARTPTS,afade=t=in:d=0.05[a]`,
    `[1:a]atrim=start=${bFrom}:end=${bFrom + bLen},asetpts=PTS-STARTPTS[b]`,
    `[a][b]acrossfade=d=${X}:c1=tri:c2=tri,atrim=end=${duration},afade=t=out:st=${duration - 0.8}:d=0.8`,
  ].join(';');
  console.error(`track ${start.toFixed(2)}s at film 0, drop on film ${dropAt}s, join at film ${splice.toFixed(2)}s → track ${ending.toFixed(2)}s`);
}
const ffmpeg = (extra) => spawnSync('ffmpeg', ['-v', 'info', '-y', '-i', track, '-i', track, ...extra], { encoding: 'utf8', maxBuffer: 1 << 26 });
const m1 = ffmpeg(['-filter_complex', `${filter},aformat=sample_rates=48000:channel_layouts=stereo,loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json[out]`, '-map', '[out]', '-f', 'null', '-']);
const m = JSON.parse(m1.stderr.slice(m1.stderr.lastIndexOf('{'), m1.stderr.lastIndexOf('}') + 1));
const norm = `loudnorm=I=-15:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
const r = ffmpeg(['-filter_complex', `${filter},aformat=sample_rates=48000:channel_layouts=stereo,${norm}[out]`, '-map', '[out]', '-ar', '48000', '-c:a', 'aac', '-b:a', '256k', out]);
if (r.status) { process.stderr.write(r.stderr); process.exit(r.status); }
console.log(out);
