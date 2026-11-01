#!/usr/bin/env node
/**
 * The soundtrack for a film that loops (a social clip that plays round and round): the track from
 * --start for the film's length, its last seconds crossfaded into the music just before --start, so
 * when the film starts again the music runs on unbroken.
 *
 *   node tools/loopmusic.mjs --track media/song.mp3 --start 11.54 --duration 20.72 [--xfade 1.2] \
 *       [--lufs -16] [--out assets/soundtrack.m4a]
 *
 * --start is the track time at film 0 (often a bar or two before the drop, so the drop lands on the
 * cut). --duration must be a whole number of chord cycles (tools/music.mjs --analyse --bpm gives the
 * cycle), or the crossfade blends two different chords. Levelled with one static gain, two passes.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { arg } from './browser.mjs';

const track = arg('track', null), start = Number(arg('start', NaN)), D = Number(arg('duration', NaN));
if (!track || Number.isNaN(start) || Number.isNaN(D)) { console.error('usage: node tools/loopmusic.mjs --track <file> --start <s> --duration <s> [--xfade 1.2] [--lufs -16] [--out assets/soundtrack.m4a]'); process.exit(1); }
const x = Number(arg('xfade', 1.2)), out = arg('out', 'assets/soundtrack.m4a'), lufs = Number(arg('lufs', -16));
if (start < x) { console.error(`The track starts ${start.toFixed(2)} s in: not enough before it for a ${x} s crossfade.`); process.exit(1); }

// The body (fading out over its last x seconds) and the lead-in to the start (fading in over the same
// x seconds), equal-power, laid on top of each other.
const graph = [
  `[0:a]atrim=start=${start.toFixed(4)}:duration=${D.toFixed(4)},asetpts=PTS-STARTPTS,afade=t=out:st=${(D - x).toFixed(4)}:d=${x}:curve=qsin[body]`,
  `[0:a]atrim=start=${(start - x).toFixed(4)}:duration=${x},asetpts=PTS-STARTPTS,afade=t=in:d=${x}:curve=qsin,adelay=${Math.round((D - x) * 1000)}:all=1[tail]`,
  `[body][tail]amix=inputs=2:normalize=0:duration=first[mix]`,
].join(';');
const run = (args) => spawnSync('ffmpeg', ['-hide_banner', '-y', ...args], { encoding: 'utf8' });
const measured = run(['-i', track, '-filter_complex', `${graph};[mix]loudnorm=I=${lufs}:TP=-1.5:LRA=11:print_format=json[o]`, '-map', '[o]', '-f', 'null', '-']).stderr;
const m = JSON.parse(measured.match(/\{[^{}]*\}/g).pop());
const norm = `loudnorm=I=${lufs}:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
mkdirSync(dirname(out), { recursive: true });
const r = run(['-v', 'error', '-i', track, '-filter_complex', `${graph};[mix]${norm},atrim=duration=${D.toFixed(4)}[o]`, '-map', '[o]', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', out]);
if (r.status) { process.stderr.write(r.stderr); process.exit(1); }
console.error(`${track.split('/').pop()} from ${start.toFixed(2)} s, ${D.toFixed(2)} s, crossfaded ${x} s back into its start`);
console.log(out);
