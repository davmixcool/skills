#!/usr/bin/env node
/**
 * Fits a music track to the film: its drop on the film's big cut, and its own ending under the
 * end card, joined where it can't be heard.
 *
 *   node tools/music.mjs --analyse --track media/song.mp3 [--bpm 139] [--landmarks 14.99,84.92]
 *       the tempo, the likely drops, the loudness every 2 s; with --bpm, the beat grid and how often the
 *       chords go round (the chord cycle, in beats); with --landmarks, the beats between two moments
 *       at each candidate tempo
 *
 *   node tools/music.mjs --track media/song.mp3 --drop 15.02 --drop-at 9.0 --duration 63.2 --bpm 140 \
 *       [--splice-bar 27 | --splice 55.29] [--ending 123.47 | auto] [--to-end] [--cycle 16] [--xfade 0.86] \
 *       [--lufs -15] [--out assets/music.m4a]
 *
 * --drop is the drop's time in the track, --drop-at where it lands in the film (the cut to the
 * product). --splice-bar N joins N bars after the drop (a bar line); --splice is a film time.
 *
 * The join's other side, --ending, is found when left as auto. With --bpm, the candidates are whole
 * chord cycles on from the splice (--cycle beats, or the cycle measured from the track): a join that
 * skips part of a cycle lands mid-progression, and the chords jump even when the beat holds. Each is
 * scored on harmony (12-note chroma) and rhythm (onsets), 6 s before and 6 s after; the best wins, and
 * the top five are printed. Expect harmony around 0.85+ and rhythm 0.3–0.8 for a clean one. Without
 * --bpm, only the 4 s of onsets before the join are matched (the old way: it can hold the beat and
 * still jump in harmony). Never pick a join by hand in the middle of a phrase.
 *
 * The crossfade is centred on the join: --xfade seconds (2 beats with --bpm, else 0.5).
 * --to-end keeps only joins whose music then plays out to the track's own ending (set --duration to
 * the join plus what's left of the track): the film ends with the music, not on a fade.
 * Without --splice, the track just plays from its start point and fades out with the film.
 * Loudness: one static gain to --lufs (default -15; social posts -16), two-pass, linear, so nothing pumps.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { arg, flag } from './browser.mjs';

const track = arg('track', null);
if (!track) { console.error('--track <file> is required'); process.exit(1); }

const SR = 11025, HOP = 256, FPS = SR / HOP; // onset envelope: ~43 values a second

function decode(file, sr = SR) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(sr), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
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
 * (a 139 BPM track came out "92, 139"). Settle it with --landmarks: between two moments of the
 * track's structure (a drop and the re-entry after a break), the true tempo counts a whole number of
 * beats. Tempos 3:2 apart can both do that (162 beats at 139 is 108 at 92.7), so check a second pair,
 * and the chord cycle at each (a clean 8, 16 or 32 beats at the true one).
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
/** The beat grid's phase at a tempo: the offset that best lines beats up with the onsets. */
function phaseAt(onset, bpm) {
  const beat = 60 / bpm; let best = [0, -1];
  for (let ph = 0; ph < beat; ph += 0.002) {
    let s = 0; for (let t = ph; t < onset.length / FPS; t += beat) { const i = Math.round(t * FPS); s += (onset[i - 1] || 0) + (onset[i] || 0) + (onset[i + 1] || 0); }
    if (s > best[1]) best = [ph, s];
  }
  return best[0];
}

/* ---------- harmony: 12-note chroma, ~21 frames a second ---------- */
const CSR = 22050, CN = 4096, CHOP = 1024, CFPS = CSR / CHOP;
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const a = (-2 * Math.PI) / len, wr = Math.cos(a), wi = Math.sin(a);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const p = i + k, q = p + len / 2, vr = re[q] * cr - im[q] * ci, vi = re[q] * ci + im[q] * cr;
        re[q] = re[p] - vr; im[q] = im[p] - vi; re[p] += vr; im[p] += vi;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
}
let CHROMA = null;
function chroma() {
  if (CHROMA) return CHROMA;
  const x = decode(track, CSR), win = Float32Array.from({ length: CN }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / CN));
  const pc = Array.from({ length: CN / 2 }, (_, k) => { const f = (k * CSR) / CN; return f < 55 || f > 2000 ? -1 : ((Math.round(12 * Math.log2(f / 440)) % 12) + 21) % 12; });
  const frames = Math.max(0, Math.floor((x.length - CN) / CHOP)), out = [];
  for (let f = 0; f < frames; f++) {
    const re = new Float32Array(CN), im = new Float32Array(CN);
    for (let i = 0; i < CN; i++) re[i] = x[f * CHOP + i] * win[i];
    fft(re, im);
    const c = new Float32Array(12);
    for (let k = 1; k < CN / 2; k++) if (pc[k] >= 0) c[pc[k]] += Math.hypot(re[k], im[k]);
    const s = Math.hypot(...c) || 1; out.push(c.map((v) => v / s));
  }
  return (CHROMA = out);
}
/** How alike the chords are over `secs` from two times (cosine of chroma, averaged). */
function harmony(t1, t2, secs) {
  const C = chroma(), a = Math.round(t1 * CFPS), b = Math.round(t2 * CFPS), n = Math.round(secs * CFPS);
  let s = 0, k = 0;
  for (let i = 0; i < n; i++) { const p = C[a + i], q = C[b + i]; if (!p || !q) continue; let d = 0; for (let j = 0; j < 12; j++) d += p[j] * q[j]; s += d; k++; }
  return k ? s / k : 0;
}
/** How often the chords go round, in beats: chroma per beat, compared with itself shifted. */
function chordCycle(bpm, phase, from, to) {
  const beat = 60 / bpm, C = chroma(), per = [];
  for (let t = phase + Math.ceil((from - phase) / beat) * beat; t + beat < to; t += beat) {
    const c = new Float32Array(12), a = Math.round(t * CFPS), b = Math.round((t + beat) * CFPS);
    for (let i = a; i < b && C[i]; i++) for (let j = 0; j < 12; j++) c[j] += C[i][j];
    const s = Math.hypot(...c) || 1; per.push(c.map((v) => v / s));
  }
  const sim = (lag) => { let s = 0, n = 0; for (let i = 0; i + lag < per.length; i++) { let d = 0; for (let j = 0; j < 12; j++) d += per[i][j] * per[i + lag][j]; s += d; n++; } return n ? s / n : 0; };
  const lags = [4, 8, 12, 16, 24, 32, 48, 64].map((l) => ({ beats: l, similarity: Number(sim(l).toFixed(3)) }));
  // the shortest of 8, 16 and 32 beats that comes within 0.01 of the best of them
  const main = lags.filter((l) => [8, 16, 32].includes(l.beats)), top = Math.max(...main.map((l) => l.similarity));
  return { cycleBeats: main.find((l) => l.similarity >= top - 0.01).beats, byShift: lags };
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
  const cands = tempos(onset), report = {
    length: Number(length.toFixed(2)),
    bpmCandidates: cands,
    drops: drops.slice(0, 3).map((d) => ({ at: Number(snap(d.at).toFixed(2)), riseDb: Number(d.rise.toFixed(1)) })),
    loudnessEvery2s: blocks.map((e, i) => `${i * 2}s ${db(e)}`),
  };
  const marks = arg('landmarks', null);
  if (marks) {
    const [a, b] = marks.split(',').map(Number);
    // only the true tempo counts a whole number of beats between two points of the track's structure
    report.beatsBetweenLandmarks = cands.flatMap((c) => [c, c * 1.5, c / 1.5, c * 2, c / 2]).filter((c) => c >= 60 && c <= 200)
      .map((c) => { const beats = ((b - a) * c) / 60, whole = Math.round(beats); return { bpm: Number(c.toFixed(2)), beats: Number(beats.toFixed(2)), bars: Number((beats / 4).toFixed(2)), exactBpm: Number(((whole * 60) / (b - a)).toFixed(3)) }; })
      .sort((p, q) => Math.abs(p.beats - Math.round(p.beats)) - Math.abs(q.beats - Math.round(q.beats)));
  }
  const bpm = Number(arg('bpm', 0));
  if (bpm) {
    const phase = phaseAt(onset, bpm);
    report.grid = { bpm, beat: Number((60 / bpm).toFixed(5)), firstBeat: Number(phase.toFixed(3)) };
    // the chords' cycle, over the loud middle of the track
    report.chords = chordCycle(bpm, phase, length * 0.15, length * 0.85);
  }
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

const drop = Number(arg('drop', 0)), dropAt = Number(arg('drop-at', 0));
const duration = Number(arg('duration', NaN));
if (!Number.isFinite(duration)) { console.error('--duration <film seconds> is required'); process.exit(1); }
const bpm = Number(arg('bpm', 0));
if (arg('splice-bar', null) !== null && !bpm) { console.error(`--splice-bar needs --bpm (candidates: ${tempos(onset).join(', ')}; confirm with --analyse --landmarks).`); process.exit(1); }
const BEAT = bpm ? 60 / bpm : 0, BAR = BEAT * 4;
const X = Number(arg('xfade', bpm ? 2 * BEAT : 0.5)), LUFS = Number(arg('lufs', -15));
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
    const from = start + splice, need = duration - splice;
    if (bpm) {
      // whole chord cycles on from the join, scored on harmony and rhythm, 6 s before and after
      const cycle = Number(arg('cycle', 0)) || chordCycle(bpm, phaseAt(onset, bpm), length * 0.15, length * 0.85).cycleBeats;
      const W = Math.round(FPS * 6), oAt = (t) => Math.round(t * FPS);
      const scores = [];
      for (let k = 1; ; k++) {
        const to = from + k * cycle * BEAT;
        if (to + need > length + 0.05) break;
        if (to < Number(arg('search-from', 0))) continue;
        const h = (harmony(from - 6, to - 6, 6) + harmony(from, to, 6)) / 2;
        const r = (pearson(onset.subarray(oAt(from) - W, oAt(from)), onset.subarray(oAt(to) - W, oAt(to))) + pearson(onset.subarray(oAt(from), oAt(from) + W), onset.subarray(oAt(to), oAt(to) + W))) / 2;
        scores.push({ to, h, r, s: 0.7 * h + 0.3 * r });
      }
      // to end with the track: only joins whose music then runs into its last cycle
      if (flag('to-end')) for (let i = scores.length - 1; i >= 0; i--) if (scores[i].to + need < length - cycle * BEAT) scores.splice(i, 1);
      if (!scores.length) { console.error(`No whole-cycle join fits${flag('to-end') ? ' and runs to the end' : ''}: change --duration so the music after the join runs to the track's end, join elsewhere, or pass --ending.`); process.exit(1); }
      scores.sort((a, b) => b.s - a.s);
      console.error(`join candidates, whole ${cycle}-beat cycles on (track s: harmony, rhythm):`, scores.slice(0, 5).map((p) => `${p.to.toFixed(2)}: ${p.h.toFixed(2)}, ${p.r.toFixed(2)}`).join(' | '));
      ending = scores[0].to;
    } else {
      console.error('Note: without --bpm the join is matched on rhythm only, and can still jump in harmony.');
      const W = Math.round(FPS * 4), cut = Math.round(from * FPS);
      const probe = onset.subarray(cut - W, cut);
      const lo = Math.round(Number(arg('search-from', length * 0.6)) * FPS);
      const scores = [];
      for (let c = Math.max(W, lo); c < onset.length - Math.round(FPS * 2); c++) scores.push({ c, r: pearson(probe, onset.subarray(c - W, c)) });
      scores.sort((a, b) => b.r - a.r);
      const picked = [];
      for (const s of scores) { if (picked.every((p) => Math.abs(p.c - s.c) > FPS * 0.5)) picked.push(s); if (picked.length === 5) break; }
      console.error('join candidates (track s, r):', picked.map((p) => `${(p.c / FPS).toFixed(2)} r=${p.r.toFixed(2)}`).join(', '));
      ending = picked[0].c / FPS;
    }
  }
  ending = Number(ending);
  const a = splice + X / 2, bFrom = ending - X / 2, bLen = duration - splice + X / 2;
  if (bFrom + bLen > length + 0.05) console.error(`Note: the ending runs out ${(bFrom + bLen - length).toFixed(2)}s before the film does.`);
  filter = [
    `[0:a]atrim=start=${start}:end=${start + a},asetpts=PTS-STARTPTS,afade=t=in:d=0.05[a]`,
    `[1:a]atrim=start=${bFrom}:end=${bFrom + bLen},asetpts=PTS-STARTPTS[b]`,
    `[a][b]acrossfade=d=${X}:c1=tri:c2=tri,atrim=end=${duration},afade=t=out:st=${duration - 0.8}:d=0.8`,
  ].join(';');
  console.error(`track ${start.toFixed(2)}s at film 0, drop on film ${dropAt}s, join at film ${splice.toFixed(2)}s → track ${ending.toFixed(2)}s (crossfade ${X.toFixed(2)}s)`);
}
const ffmpeg = (extra) => spawnSync('ffmpeg', ['-v', 'info', '-y', '-i', track, '-i', track, ...extra], { encoding: 'utf8', maxBuffer: 1 << 26 });
const m1 = ffmpeg(['-filter_complex', `${filter},aformat=sample_rates=48000:channel_layouts=stereo,loudnorm=I=${LUFS}:TP=-1.5:LRA=11:print_format=json[out]`, '-map', '[out]', '-f', 'null', '-']);
const m = JSON.parse(m1.stderr.slice(m1.stderr.lastIndexOf('{'), m1.stderr.lastIndexOf('}') + 1));
const norm = `loudnorm=I=${LUFS}:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
const r = ffmpeg(['-filter_complex', `${filter},aformat=sample_rates=48000:channel_layouts=stereo,${norm}[out]`, '-map', '[out]', '-ar', '48000', '-c:a', 'aac', '-b:a', '256k', out]);
if (r.status) { process.stderr.write(r.stderr); process.exit(r.status); }
console.log(out);
